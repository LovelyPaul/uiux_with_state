-- Migration: 게스트 예약 지원을 위한 스키마 수정
-- Created: 2025-10-16
-- Description: user_id를 TEXT 타입으로 변경하여 게스트 세션 ID(guest_{uuid}) 지원

-- ============================================
-- 0. 기존 데이터 삭제 (타입 변경을 위해 필요)
-- ============================================

-- 기존 예약 데이터 삭제 (개발 환경이므로 안전)
DELETE FROM booking_seats;
DELETE FROM bookings;
DELETE FROM temp_reservations;

-- ============================================
-- 1. temp_reservations 테이블 수정
-- ============================================

-- 기존 외래키 제약 조건 삭제
ALTER TABLE temp_reservations
  DROP CONSTRAINT IF EXISTS temp_reservations_user_id_fkey;

-- user_id 컬럼을 TEXT로 변경
ALTER TABLE temp_reservations
  ALTER COLUMN user_id TYPE TEXT;

-- 기존 제약 조건 삭제 후 재생성
ALTER TABLE temp_reservations
  DROP CONSTRAINT IF EXISTS chk_temp_reservations_user_id;

-- user_id가 비어있지 않도록 제약 추가
ALTER TABLE temp_reservations
  ADD CONSTRAINT chk_temp_reservations_user_id
  CHECK (user_id IS NOT NULL AND length(user_id) > 0);

-- 인덱스 재생성 (타입 변경으로 인해 필요)
DROP INDEX IF EXISTS idx_temp_reservations_user_id;
CREATE INDEX idx_temp_reservations_user_id ON temp_reservations(user_id);

COMMENT ON COLUMN temp_reservations.user_id IS '사용자 ID (UUID 또는 guest_{sessionId})';

-- ============================================
-- 2. bookings 테이블 수정
-- ============================================

-- 기존 외래키 제약 조건 삭제
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

-- user_id 컬럼을 TEXT로 변경
ALTER TABLE bookings
  ALTER COLUMN user_id TYPE TEXT;

-- 기존 제약 조건 삭제 후 재생성
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS chk_bookings_user_id;

-- user_id가 비어있지 않도록 제약 추가
ALTER TABLE bookings
  ADD CONSTRAINT chk_bookings_user_id
  CHECK (user_id IS NOT NULL AND length(user_id) > 0);

-- 인덱스 재생성 (타입 변경으로 인해 필요)
DROP INDEX IF EXISTS idx_bookings_user_id;
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

DROP INDEX IF EXISTS idx_bookings_status;
CREATE INDEX idx_bookings_status ON bookings(user_id, status);

COMMENT ON COLUMN bookings.user_id IS '사용자 ID (UUID 또는 guest_{sessionId})';

-- ============================================
-- 3. wishlists 테이블 수정 (게스트는 위시리스트 사용 불가)
-- ============================================

-- wishlists는 로그인 사용자만 사용하므로 외래키 유지

-- ============================================
-- 4. RPC 함수 수정
-- ============================================

-- create_temp_reservation 함수 수정 (user_id TEXT로 변경)
DROP FUNCTION IF EXISTS create_temp_reservation(uuid, uuid);
CREATE OR REPLACE FUNCTION create_temp_reservation(p_user_id text, p_seat_id uuid)
RETURNS void AS $$
BEGIN
  -- 좌석 상태 확인 및 락
  PERFORM * FROM seats
  WHERE id = p_seat_id AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SEAT_NOT_AVAILABLE';
  END IF;

  -- 임시 예약 생성 (10분 유효)
  INSERT INTO temp_reservations (user_id, seat_id, expires_at)
  VALUES (p_user_id, p_seat_id, NOW() + INTERVAL '10 minutes');

  -- 좌석 상태 변경
  UPDATE seats
  SET status = 'temp_reserved', updated_at = NOW()
  WHERE id = p_seat_id;
END;
$$ LANGUAGE plpgsql;

-- create_booking_transaction 함수 수정 (user_id TEXT로 변경)
DROP FUNCTION IF EXISTS create_booking_transaction(uuid, uuid);
CREATE OR REPLACE FUNCTION create_booking_transaction(
  p_user_id text,
  p_schedule_id uuid
)
RETURNS json AS $$
DECLARE
  v_booking_id uuid;
  v_booking_number text;
  v_seat_count int;
BEGIN
  -- 예약 번호 생성 (BK-XXXXXXXX)
  v_booking_number := 'BK-' || UPPER(substring(md5(random()::text) from 1 for 8));

  -- 예약 생성
  INSERT INTO bookings (user_id, concert_schedule_id, booking_number, status)
  VALUES (p_user_id, p_schedule_id, v_booking_number, 'confirmed')
  RETURNING id INTO v_booking_id;

  -- 임시 예약을 정식 예약으로 변환
  INSERT INTO booking_seats (booking_id, seat_id)
  SELECT v_booking_id, seat_id
  FROM temp_reservations
  WHERE user_id = p_user_id;

  GET DIAGNOSTICS v_seat_count = ROW_COUNT;

  -- 임시 예약이 없으면 에러
  IF v_seat_count = 0 THEN
    RAISE EXCEPTION 'NO_TEMP_RESERVATIONS';
  END IF;

  -- 좌석 상태 변경 (temp_reserved → reserved)
  UPDATE seats
  SET status = 'reserved', updated_at = NOW()
  WHERE id IN (
    SELECT seat_id FROM temp_reservations WHERE user_id = p_user_id
  );

  -- 임시 예약 삭제
  DELETE FROM temp_reservations WHERE user_id = p_user_id;

  -- 예매 가능 좌석 수 업데이트
  UPDATE concert_schedules
  SET
    available_seats = available_seats - v_seat_count,
    is_sold_out = CASE WHEN (available_seats - v_seat_count) <= 0 THEN TRUE ELSE FALSE END,
    updated_at = NOW()
  WHERE id = p_schedule_id;

  -- 결과 반환
  RETURN json_build_object(
    'booking_id', v_booking_id,
    'booking_number', v_booking_number
  );
END;
$$ LANGUAGE plpgsql;

-- cancel_booking_transaction 함수 수정 (user_id TEXT로 변경)
DROP FUNCTION IF EXISTS cancel_booking_transaction(uuid, uuid, text, text);
CREATE OR REPLACE FUNCTION cancel_booking_transaction(
  p_booking_id uuid,
  p_user_id text,
  p_reason text,
  p_reason_detail text
)
RETURNS void AS $$
DECLARE
  v_schedule_id uuid;
  v_status text;
  v_concert_date date;
  v_seat_count int;
BEGIN
  -- 예약 정보 조회 및 락
  SELECT status, concert_schedule_id
  INTO v_status, v_schedule_id
  FROM bookings
  WHERE id = p_booking_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'ALREADY_CANCELLED';
  END IF;

  -- 공연 날짜 확인 (취소 가능 기간 체크)
  SELECT concert_date
  INTO v_concert_date
  FROM concert_schedules
  WHERE id = v_schedule_id;

  IF v_concert_date <= CURRENT_DATE OR
     (v_concert_date - CURRENT_DATE) < 1 THEN
    RAISE EXCEPTION 'NOT_CANCELLABLE';
  END IF;

  -- 예약 상태 업데이트
  UPDATE bookings
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = COALESCE(p_reason, '') || ' ' || COALESCE(p_reason_detail, ''),
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- 좌석 상태 복원 (reserved → available)
  UPDATE seats
  SET status = 'available', updated_at = NOW()
  WHERE id IN (
    SELECT seat_id FROM booking_seats WHERE booking_id = p_booking_id
  );

  GET DIAGNOSTICS v_seat_count = ROW_COUNT;

  -- 예매 가능 좌석 수 복원
  UPDATE concert_schedules
  SET
    available_seats = available_seats + v_seat_count,
    is_sold_out = FALSE,
    updated_at = NOW()
  WHERE id = v_schedule_id;
END;
$$ LANGUAGE plpgsql;

-- Migration 완료
COMMENT ON SCHEMA public IS 'Concert Booking System - Migration 0005 completed: Guest reservations enabled';
