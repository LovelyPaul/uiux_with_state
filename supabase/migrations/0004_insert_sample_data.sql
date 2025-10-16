-- Migration: 테스트용 샘플 데이터 입력
-- Created: 2025-10-16
-- Description: 콘서트 예약 시스템 테스트를 위한 샘플 데이터

-- ============================================
-- 1. 공연장 데이터 (Venues)
-- ============================================

INSERT INTO venues (id, name, address, location_lat, location_lng) VALUES
  ('11111111-1111-1111-1111-111111111111', '올림픽공원 체조경기장', '서울특별시 송파구 올림픽로 424', 37.5219, 127.1231),
  ('22222222-2222-2222-2222-222222222222', '잠실 실내체육관', '서울특별시 송파구 올림픽로 25', 37.5125, 127.0737),
  ('33333333-3333-3333-3333-333333333333', '고척스카이돔', '서울특별시 구로구 경인로 430', 37.4985, 126.8671),
  ('44444444-4444-4444-4444-444444444444', 'KSPO DOME', '서울특별시 송파구 올림픽로 424', 37.5152, 127.1262),
  ('55555555-5555-5555-5555-555555555555', '세종문화회관 대극장', '서울특별시 종로구 세종대로 175', 37.5720, 126.9762)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. 콘서트 데이터 (Concerts)
-- ============================================

INSERT INTO concerts (id, venue_id, title, poster_url, description, genre, performers, rating, running_time, status, popularity) VALUES
  (
    '10000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '2024 Rock Festival Seoul',
    'https://picsum.photos/seed/rock1/800/600',
    '국내 최대 규모의 록 페스티벌! 최고의 록 밴드들이 한자리에 모입니다.',
    'rock',
    '넬(Nell), 잔나비, 데이브레이크',
    '12세이상관람가',
    180,
    'active',
    1250
  ),
  (
    '10000002-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'K-POP 슈퍼콘서트 2024',
    'https://picsum.photos/seed/kpop1/800/600',
    '글로벌 K-POP 스타들의 환상적인 무대를 만나보세요!',
    'pop',
    'BTS, 블랙핑크, 아이브',
    '전체관람가',
    150,
    'active',
    2300
  ),
  (
    '10000003-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'Jazz Night in Seoul',
    'https://picsum.photos/seed/jazz1/800/600',
    '감성 가득한 재즈의 밤. 세계적인 재즈 뮤지션들과 함께하는 특별한 공연.',
    'jazz',
    'Chick Corea Elektric Band, 나윤선',
    '12세이상관람가',
    120,
    'active',
    850
  ),
  (
    '10000004-0000-0000-0000-000000000004',
    '44444444-4444-4444-4444-444444444444',
    '힙합 레전드 컴백 콘서트',
    'https://picsum.photos/seed/hiphop1/800/600',
    '한국 힙합의 전설들이 돌아왔다! 역대급 라인업으로 찾아갑니다.',
    'hiphop',
    '타이거JK, 윤미래, 비지',
    '15세이상관람가',
    140,
    'active',
    1650
  ),
  (
    '10000005-0000-0000-0000-000000000005',
    '55555555-5555-5555-5555-555555555555',
    '클래식 갈라 콘서트',
    'https://picsum.photos/seed/classical1/800/600',
    '세계적인 클래식 연주자들이 선사하는 명곡의 향연.',
    'classical',
    '조성진, KBS교향악단',
    '전체관람가',
    110,
    'active',
    720
  ),
  (
    '10000006-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'EDM Festival Korea 2024',
    'https://picsum.photos/seed/edm1/800/600',
    '밤새도록 즐기는 일렉트로닉 뮤직 페스티벌!',
    'edm',
    'Martin Garrix, DJ Snake, Peggy Gou',
    '19세이상관람가',
    240,
    'active',
    1980
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. 공연 일정 데이터 (Concert Schedules)
-- ============================================

-- Rock Festival (3일간)
INSERT INTO concert_schedules (id, concert_id, concert_date, concert_time, total_seats, available_seats, is_sold_out, is_booking_open) VALUES
  ('20000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001', '2025-11-15', '19:00:00', 5000, 3200, false, true),
  ('20000002-0000-0000-0000-000000000002', '10000001-0000-0000-0000-000000000001', '2025-11-16', '19:00:00', 5000, 2800, false, true),
  ('20000003-0000-0000-0000-000000000003', '10000001-0000-0000-0000-000000000001', '2025-11-17', '19:00:00', 5000, 1200, false, true)
ON CONFLICT (id) DO NOTHING;

-- K-POP 슈퍼콘서트 (2일간)
INSERT INTO concert_schedules (id, concert_id, concert_date, concert_time, total_seats, available_seats, is_sold_out, is_booking_open) VALUES
  ('20000004-0000-0000-0000-000000000004', '10000002-0000-0000-0000-000000000002', '2025-12-20', '18:00:00', 8000, 0, true, false),
  ('20000005-0000-0000-0000-000000000005', '10000002-0000-0000-0000-000000000002', '2025-12-21', '18:00:00', 8000, 150, false, true)
ON CONFLICT (id) DO NOTHING;

-- Jazz Night
INSERT INTO concert_schedules (id, concert_id, concert_date, concert_time, total_seats, available_seats, is_sold_out, is_booking_open) VALUES
  ('20000006-0000-0000-0000-000000000006', '10000003-0000-0000-0000-000000000003', '2025-11-30', '19:30:00', 2000, 1450, false, true)
ON CONFLICT (id) DO NOTHING;

-- 힙합 레전드
INSERT INTO concert_schedules (id, concert_id, concert_date, concert_time, total_seats, available_seats, is_sold_out, is_booking_open) VALUES
  ('20000007-0000-0000-0000-000000000007', '10000004-0000-0000-0000-000000000004', '2025-12-05', '19:00:00', 6000, 4200, false, true),
  ('20000008-0000-0000-0000-000000000008', '10000004-0000-0000-0000-000000000004', '2025-12-06', '19:00:00', 6000, 3800, false, true)
ON CONFLICT (id) DO NOTHING;

-- 클래식 갈라
INSERT INTO concert_schedules (id, concert_id, concert_date, concert_time, total_seats, available_seats, is_sold_out, is_booking_open) VALUES
  ('20000009-0000-0000-0000-000000000009', '10000005-0000-0000-0000-000000000005', '2025-11-25', '19:30:00', 3000, 2100, false, true)
ON CONFLICT (id) DO NOTHING;

-- EDM Festival
INSERT INTO concert_schedules (id, concert_id, concert_date, concert_time, total_seats, available_seats, is_sold_out, is_booking_open) VALUES
  ('20000010-0000-0000-0000-000000000010', '10000006-0000-0000-0000-000000000006', '2025-12-31', '20:00:00', 10000, 5500, false, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. 좌석 데이터 (Seats)
-- ============================================

-- 각 일정별로 좌석 생성 (VIP, R석, S석, A석)
-- Rock Festival - 첫째날 (20000001)
DO $$
DECLARE
  schedule_id UUID := '20000001-0000-0000-0000-000000000001';
  seat_num TEXT;
  i INTEGER;
BEGIN
  -- VIP석 (1-100번): 150,000원
  FOR i IN 1..100 LOOP
    seat_num := 'VIP-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'VIP', 150000, i % 10, i / 10,
            CASE WHEN i <= 68 THEN 'reserved' ELSE 'available' END)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- R석 (1-200번): 120,000원
  FOR i IN 1..200 LOOP
    seat_num := 'R-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'R석', 120000, i % 20, i / 20 + 10,
            CASE WHEN i <= 120 THEN 'reserved' ELSE 'available' END)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- S석 (1-300번): 90,000원
  FOR i IN 1..300 LOOP
    seat_num := 'S-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'S석', 90000, i % 30, i / 30 + 20,
            CASE WHEN i <= 180 THEN 'reserved' ELSE 'available' END)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- A석 (1-400번): 60,000원
  FOR i IN 1..400 LOOP
    seat_num := 'A-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'A석', 60000, i % 40, i / 40 + 30, 'available')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- K-POP 슈퍼콘서트 - 둘째날 (20000005) - 마감 임박
DO $$
DECLARE
  schedule_id UUID := '20000005-0000-0000-0000-000000000005';
  seat_num TEXT;
  i INTEGER;
BEGIN
  -- VIP석: 200,000원 (전석 매진)
  FOR i IN 1..150 LOOP
    seat_num := 'VIP-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'VIP', 200000, i % 15, i / 15, 'reserved')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- R석: 150,000원 (잔여 150석)
  FOR i IN 1..300 LOOP
    seat_num := 'R-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'R석', 150000, i % 30, i / 30 + 15,
            CASE WHEN i <= 150 THEN 'available' ELSE 'reserved' END)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- S석과 A석은 매진
  FOR i IN 1..500 LOOP
    seat_num := 'S-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'S석', 110000, i % 50, i / 50 + 30, 'reserved')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Jazz Night (20000006)
DO $$
DECLARE
  schedule_id UUID := '20000006-0000-0000-0000-000000000006';
  seat_num TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..50 LOOP
    seat_num := 'VIP-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'VIP', 100000, i % 10, i / 10,
            CASE WHEN i <= 28 THEN 'reserved' ELSE 'available' END)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..150 LOOP
    seat_num := 'R-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'R석', 70000, i % 15, i / 15 + 5,
            CASE WHEN i <= 65 THEN 'reserved' ELSE 'available' END)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..200 LOOP
    seat_num := 'S-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'S석', 50000, i % 20, i / 20 + 15, 'available')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 힙합 레전드 - 첫째날 (20000007)
DO $$
DECLARE
  schedule_id UUID := '20000007-0000-0000-0000-000000000007';
  seat_num TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..100 LOOP
    seat_num := 'VIP-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'VIP', 180000, i % 10, i / 10,
            CASE WHEN i <= 30 THEN 'reserved' ELSE 'available' END)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..300 LOOP
    seat_num := 'R-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'R석', 130000, i % 30, i / 30 + 10, 'available')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- EDM Festival (20000010)
DO $$
DECLARE
  schedule_id UUID := '20000010-0000-0000-0000-000000000010';
  seat_num TEXT;
  i INTEGER;
BEGIN
  -- 스탠딩 A구역
  FOR i IN 1..200 LOOP
    seat_num := 'STANDING-A-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'Standing A', 150000, i % 20, i / 20,
            CASE WHEN i <= 110 THEN 'reserved' ELSE 'available' END)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 스탠딩 B구역
  FOR i IN 1..300 LOOP
    seat_num := 'STANDING-B-' || LPAD(i::TEXT, 3, '0');
    INSERT INTO seats (concert_schedule_id, seat_number, seat_grade, price, position_x, position_y, status)
    VALUES (schedule_id, seat_num, 'Standing B', 120000, i % 30, i / 30 + 10, 'available')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- Migration 완료
-- ============================================

COMMENT ON SCHEMA public IS 'Concert Booking System - Sample Data Migration 0004 completed';

-- 샘플 데이터 통계
SELECT
  '공연장' as category,
  COUNT(*)::text as count
FROM venues
UNION ALL
SELECT
  '콘서트',
  COUNT(*)::text
FROM concerts
UNION ALL
SELECT
  '공연일정',
  COUNT(*)::text
FROM concert_schedules
UNION ALL
SELECT
  '좌석',
  COUNT(*)::text
FROM seats;
