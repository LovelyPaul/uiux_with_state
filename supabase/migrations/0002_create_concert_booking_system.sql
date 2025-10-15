-- Migration: 콘서트 예약 시스템 데이터베이스 스키마
-- Created: 2025-10-16
-- Description: 콘서트 예약 시스템의 모든 테이블, 인덱스, 트리거 생성

-- ============================================
-- 1. 확장 기능 활성화
-- ============================================

-- 전문 검색을 위한 pg_trgm 확장
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- UUID 생성을 위한 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. 테이블 생성
-- ============================================

-- 2.1 공연장 (venues)
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE venues IS '공연장 정보';
COMMENT ON COLUMN venues.name IS '공연장명';
COMMENT ON COLUMN venues.address IS '공연장 주소';
COMMENT ON COLUMN venues.location_lat IS '위도 (지도 표시용)';
COMMENT ON COLUMN venues.location_lng IS '경도 (지도 표시용)';

-- 2.2 콘서트 (concerts)
CREATE TABLE IF NOT EXISTS concerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,

  -- 기본 정보
  title VARCHAR(300) NOT NULL,
  poster_url TEXT,
  description TEXT,

  -- 분류 정보
  genre VARCHAR(50),
  performers TEXT,
  rating VARCHAR(20),
  running_time INTEGER,

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

  -- 통계
  popularity INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_concerts_status CHECK (status IN ('active', 'cancelled', 'postponed'))
);

COMMENT ON TABLE concerts IS '콘서트 기본 정보';
COMMENT ON COLUMN concerts.title IS '콘서트 제목';
COMMENT ON COLUMN concerts.genre IS '장르 (필터링 용)';
COMMENT ON COLUMN concerts.performers IS '출연진 (검색 용)';
COMMENT ON COLUMN concerts.status IS 'active: 정상, cancelled: 취소, postponed: 연기';
COMMENT ON COLUMN concerts.popularity IS '인기도 (검색/예약 수 기반)';

-- 2.3 콘서트 회차 (concert_schedules)
CREATE TABLE IF NOT EXISTS concert_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,

  -- 회차 정보
  concert_date DATE NOT NULL,
  concert_time TIME NOT NULL,

  -- 좌석 정보
  total_seats INTEGER NOT NULL,
  available_seats INTEGER NOT NULL,

  -- 상태
  is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
  is_booking_open BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_concert_schedule UNIQUE(concert_id, concert_date, concert_time),
  CONSTRAINT chk_available_seats CHECK (available_seats >= 0 AND available_seats <= total_seats)
);

COMMENT ON TABLE concert_schedules IS '콘서트 회차 (날짜/시간별)';
COMMENT ON COLUMN concert_schedules.available_seats IS '실시간 예매 가능 좌석 수';
COMMENT ON COLUMN concert_schedules.is_sold_out IS '매진 여부 (캐시)';

-- 2.4 좌석 (seats)
CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concert_schedule_id UUID NOT NULL REFERENCES concert_schedules(id) ON DELETE CASCADE,

  -- 좌석 정보
  seat_number VARCHAR(20) NOT NULL,
  seat_grade VARCHAR(20) NOT NULL,
  price INTEGER NOT NULL,

  -- 좌표 (좌석도 표시용)
  position_x INTEGER,
  position_y INTEGER,

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'available',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_seat UNIQUE(concert_schedule_id, seat_number),
  CONSTRAINT chk_seats_price CHECK (price >= 0),
  CONSTRAINT chk_seats_status CHECK (status IN ('available', 'temp_reserved', 'reserved', 'unavailable'))
);

COMMENT ON TABLE seats IS '좌석 정보';
COMMENT ON COLUMN seats.seat_number IS '좌석 번호';
COMMENT ON COLUMN seats.seat_grade IS '좌석 등급 (가격 구분)';
COMMENT ON COLUMN seats.status IS 'available: 예약가능, temp_reserved: 임시예약, reserved: 예약완료, unavailable: 판매불가';

-- 2.5 예약 (bookings)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  concert_schedule_id UUID NOT NULL REFERENCES concert_schedules(id) ON DELETE RESTRICT,

  -- 예약 정보
  booking_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',

  -- 취소 정보
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_bookings_status CHECK (status IN ('confirmed', 'cancelled'))
);

COMMENT ON TABLE bookings IS '예약 정보';
COMMENT ON COLUMN bookings.booking_number IS '예약 번호 (QR코드 생성 기준)';
COMMENT ON COLUMN bookings.status IS 'confirmed: 예약확정, cancelled: 취소됨';

-- 2.6 예약-좌석 관계 (booking_seats)
CREATE TABLE IF NOT EXISTS booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_booking_seat UNIQUE(booking_id, seat_id)
);

COMMENT ON TABLE booking_seats IS '예약-좌석 다대다 관계';

-- 2.7 임시 예약 (temp_reservations)
CREATE TABLE IF NOT EXISTS temp_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,

  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_temp_seat UNIQUE(seat_id)
);

COMMENT ON TABLE temp_reservations IS '임시 예약 (10분 타이머)';
COMMENT ON COLUMN temp_reservations.expires_at IS '만료 시간 (10분 후, 자동 삭제 대상)';

-- 2.8 위시리스트 (wishlists)
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_wishlist UNIQUE(user_id, concert_id)
);

COMMENT ON TABLE wishlists IS '사용자 위시리스트';

-- ============================================
-- 3. 인덱스 생성
-- ============================================

-- 3.1 concerts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_concerts_venue_id ON concerts(venue_id);
CREATE INDEX IF NOT EXISTS idx_concerts_genre ON concerts(genre) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_concerts_status ON concerts(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_concerts_popularity ON concerts(popularity DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_concerts_title_trgm ON concerts USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_concerts_performers_trgm ON concerts USING gin(performers gin_trgm_ops);

-- 3.2 concert_schedules 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_concert_schedules_concert_id ON concert_schedules(concert_id);
CREATE INDEX IF NOT EXISTS idx_concert_schedules_date ON concert_schedules(concert_date);
CREATE INDEX IF NOT EXISTS idx_concert_schedules_available ON concert_schedules(concert_date)
  WHERE is_booking_open = TRUE AND is_sold_out = FALSE;

-- 3.3 seats 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_seats_schedule_id ON seats(concert_schedule_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status) WHERE status = 'available';

-- 3.4 bookings 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_id ON bookings(concert_schedule_id);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);

-- 3.5 booking_seats 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_seat_id ON booking_seats(seat_id);

-- 3.6 temp_reservations 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_temp_reservations_user_id ON temp_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_reservations_expires_at ON temp_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_reservations_seat_id ON temp_reservations(seat_id);

-- 3.7 wishlists 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_concert_id ON wishlists(concert_id);

-- ============================================
-- 4. 트리거 함수 및 트리거 생성
-- ============================================

-- 4.1 updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 각 테이블에 updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_venues_updated_at ON venues;
CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_concerts_updated_at ON concerts;
CREATE TRIGGER update_concerts_updated_at
  BEFORE UPDATE ON concerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_concert_schedules_updated_at ON concert_schedules;
CREATE TRIGGER update_concert_schedules_updated_at
  BEFORE UPDATE ON concert_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seats_updated_at ON seats;
CREATE TRIGGER update_seats_updated_at
  BEFORE UPDATE ON seats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. RLS (Row Level Security) 비활성화
-- ============================================
-- AGENTS.md 가이드라인에 따라 RLS 사용하지 않음

ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE concerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE concert_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE temp_reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. 예제 데이터 삽입 (선택 사항)
-- ============================================

-- 예제 공연장
INSERT INTO venues (name, address, location_lat, location_lng) VALUES
  ('서울 올림픽공원 체조경기장', '서울특별시 송파구 올림픽로 424', 37.5219, 127.1231),
  ('잠실 실내체육관', '서울특별시 송파구 올림픽로 25', 37.5125, 127.0737)
ON CONFLICT DO NOTHING;

-- Migration 완료
COMMENT ON SCHEMA public IS 'Concert Booking System - Migration 0002 completed';
