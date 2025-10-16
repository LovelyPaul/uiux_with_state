-- RPC Functions for Concert Booking System

-- Function 1: create_temp_reservation
-- Purpose: 임시 좌석 예약 생성 (10분 유효, FOR UPDATE 락)
CREATE OR REPLACE FUNCTION create_temp_reservation(p_user_id uuid, p_seat_id uuid)
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

-- Function 2: create_booking_transaction
-- Purpose: 예약 생성 (트랜잭션)
CREATE OR REPLACE FUNCTION create_booking_transaction(
  p_user_id uuid,
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

-- Function 3: cancel_booking_transaction
-- Purpose: 예약 취소 (트랜잭션)
CREATE OR REPLACE FUNCTION cancel_booking_transaction(
  p_booking_id uuid,
  p_user_id uuid,
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

-- Function 4: cleanup_expired_temp_reservations
-- Purpose: 만료된 임시 예약 정리 (크론 작업용)
CREATE OR REPLACE FUNCTION cleanup_expired_temp_reservations()
RETURNS void AS $$
DECLARE
  v_expired_seat_ids uuid[];
BEGIN
  -- 만료된 임시 예약의 좌석 ID 수집
  SELECT ARRAY_AGG(seat_id)
  INTO v_expired_seat_ids
  FROM temp_reservations
  WHERE expires_at < NOW();

  -- 만료된 임시 예약 삭제
  DELETE FROM temp_reservations
  WHERE expires_at < NOW();

  -- 좌석 상태 복원
  IF v_expired_seat_ids IS NOT NULL THEN
    UPDATE seats
    SET status = 'available', updated_at = NOW()
    WHERE id = ANY(v_expired_seat_ids);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger를 사용한 자동 정리 (선택 사항)
-- 매번 temp_reservations 테이블 접근 시 만료된 예약 정리
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_temp_reservations()
RETURNS trigger AS $$
BEGIN
  PERFORM cleanup_expired_temp_reservations();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS auto_cleanup_expired_temp_reservations ON temp_reservations;
CREATE TRIGGER auto_cleanup_expired_temp_reservations
  BEFORE INSERT ON temp_reservations
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_expired_temp_reservations();
