-- Migration: 예약자 정보 필드 추가
-- Created: 2025-10-16
-- Description: 게스트 예약을 위한 예약자 이름, 핸드폰 번호, 비밀번호 필드 추가

-- bookings 테이블에 예약자 정보 컬럼 추가
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS guest_password_hash VARCHAR(255);

-- 컬럼 설명 추가
COMMENT ON COLUMN bookings.guest_name IS '예약자 이름 (게스트 예약용)';
COMMENT ON COLUMN bookings.guest_phone IS '예약자 핸드폰 번호 (게스트 예약용)';
COMMENT ON COLUMN bookings.guest_password_hash IS '예약 조회/취소용 비밀번호 해시 (게스트 예약용)';

-- Migration 완료
COMMENT ON SCHEMA public IS 'Concert Booking System - Migration 0006 completed: Added guest booking info fields';
