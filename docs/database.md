# 콘서트 예약 시스템 - 데이터베이스 설계

> 본 문서는 콘서트 예약 시스템의 데이터베이스 스키마와 데이터플로우를 정의합니다.
> 유저플로우(`userflow.md`)에 명시된 기능만을 포함한 최소 스펙입니다.

**문서 버전**: 1.0
**작성일**: 2025-10-16
**최종 수정일**: 2025-10-16
**데이터베이스**: PostgreSQL (Supabase)

---

## 목차

1. [ERD 개요](#1-erd-개요)
2. [테이블 상세 스키마](#2-테이블-상세-스키마)
3. [데이터플로우](#3-데이터플로우)
4. [인덱스 전략](#4-인덱스-전략)
5. [제약조건 및 정책](#5-제약조건-및-정책)

---

## 1. ERD 개요

### 1.1 엔티티 관계도

```
users (Supabase Auth)
  ↓ 1:N
wishlists ─→ concerts

concerts
  ↓ 1:N
concert_schedules
  ↓ 1:N
seats

users
  ↓ 1:N
bookings ─→ concert_schedules
  ↓ 1:N
booking_seats ─→ seats

concerts ─→ venues (N:1)

temp_reservations ─→ users, seats (임시 예약)
```

### 1.2 주요 테이블 목록

| 테이블명 | 설명 | 주요 관계 |
|---------|------|----------|
| `users` | 사용자 정보 (Supabase Auth 사용) | - |
| `venues` | 공연장 정보 | - |
| `concerts` | 콘서트 기본 정보 | venues |
| `concert_schedules` | 콘서트 회차 정보 | concerts |
| `seats` | 좌석 정보 | concert_schedules |
| `bookings` | 예약 정보 | users, concert_schedules |
| `booking_seats` | 예약-좌석 관계 (M:N) | bookings, seats |
| `temp_reservations` | 임시 예약 (10분 제한) | users, seats |
| `wishlists` | 위시리스트 | users, concerts |

---

## 2. 테이블 상세 스키마

### 2.1 users (Supabase Auth 사용)
Supabase의 `auth.users` 테이블을 사용하므로 별도 테이블 불필요.
필요 시 `public.profiles` 테이블로 확장 가능.

```sql
-- Supabase Auth의 auth.users 사용
-- 필요한 필드: id (UUID), email, created_at
```

---

### 2.2 venues (공연장)

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,                    -- 공연장명
  address TEXT NOT NULL,                         -- 주소
  location_lat DECIMAL(10, 8),                   -- 위도
  location_lng DECIMAL(11, 8),                   -- 경도
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE venues IS '공연장 정보';
COMMENT ON COLUMN venues.name IS '공연장명';
COMMENT ON COLUMN venues.address IS '공연장 주소';
COMMENT ON COLUMN venues.location_lat IS '위도 (지도 표시용)';
COMMENT ON COLUMN venues.location_lng IS '경도 (지도 표시용)';
```

---

### 2.3 concerts (콘서트)

```sql
CREATE TABLE concerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,

  -- 기본 정보
  title VARCHAR(300) NOT NULL,                   -- 콘서트 제목
  poster_url TEXT,                               -- 포스터 이미지 URL
  description TEXT,                              -- 상세 설명

  -- 분류 정보
  genre VARCHAR(50),                             -- 장르 (Rock, Pop, Jazz, etc.)
  performers TEXT,                               -- 출연진 (JSON 배열 또는 쉼표 구분)
  rating VARCHAR(20),                            -- 관람등급 (전체, 12세, 15세 등)
  running_time INTEGER,                          -- 러닝타임 (분 단위)

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, cancelled, postponed
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,     -- 소프트 삭제

  -- 통계
  popularity INTEGER NOT NULL DEFAULT 0,         -- 인기도 (검색/예약 수 기반)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE concerts IS '콘서트 기본 정보';
COMMENT ON COLUMN concerts.title IS '콘서트 제목';
COMMENT ON COLUMN concerts.genre IS '장르 (필터링 용)';
COMMENT ON COLUMN concerts.performers IS '출연진 (검색 용)';
COMMENT ON COLUMN concerts.status IS 'active: 정상, cancelled: 취소, postponed: 연기';
```

---

### 2.4 concert_schedules (콘서트 회차)

```sql
CREATE TABLE concert_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,

  -- 회차 정보
  concert_date DATE NOT NULL,                    -- 공연 날짜
  concert_time TIME NOT NULL,                    -- 공연 시간

  -- 좌석 정보
  total_seats INTEGER NOT NULL,                  -- 총 좌석 수
  available_seats INTEGER NOT NULL,              -- 예매 가능 좌석 수

  -- 상태
  is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,    -- 매진 여부
  is_booking_open BOOLEAN NOT NULL DEFAULT TRUE, -- 예매 오픈 여부

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_concert_schedule UNIQUE(concert_id, concert_date, concert_time)
);

COMMENT ON TABLE concert_schedules IS '콘서트 회차 (날짜/시간별)';
COMMENT ON COLUMN concert_schedules.available_seats IS '실시간 예매 가능 좌석 수';
COMMENT ON COLUMN concert_schedules.is_sold_out IS '매진 여부 (캐시)';
```

---

### 2.5 seats (좌석)

```sql
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concert_schedule_id UUID NOT NULL REFERENCES concert_schedules(id) ON DELETE CASCADE,

  -- 좌석 정보
  seat_number VARCHAR(20) NOT NULL,              -- 좌석 번호 (A-1, B-12 등)
  seat_grade VARCHAR(20) NOT NULL,               -- 좌석 등급 (VIP, R, S, A 등)
  price INTEGER NOT NULL,                        -- 가격 (원)

  -- 좌표 (좌석도 표시용)
  position_x INTEGER,                            -- X 좌표
  position_y INTEGER,                            -- Y 좌표

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'available', -- available, temp_reserved, reserved, unavailable

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_seat UNIQUE(concert_schedule_id, seat_number)
);

COMMENT ON TABLE seats IS '좌석 정보';
COMMENT ON COLUMN seats.seat_number IS '좌석 번호';
COMMENT ON COLUMN seats.seat_grade IS '좌석 등급 (가격 구분)';
COMMENT ON COLUMN seats.status IS 'available: 예약가능, temp_reserved: 임시예약, reserved: 예약완료, unavailable: 판매불가';
```

---

### 2.6 bookings (예약)

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  concert_schedule_id UUID NOT NULL REFERENCES concert_schedules(id) ON DELETE RESTRICT,

  -- 예약 정보
  booking_number VARCHAR(50) NOT NULL UNIQUE,    -- 예약 번호 (사용자 표시용)
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled

  -- 취소 정보
  cancelled_at TIMESTAMPTZ,                      -- 취소 일시
  cancellation_reason TEXT,                      -- 취소 사유

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bookings IS '예약 정보';
COMMENT ON COLUMN bookings.booking_number IS '예약 번호 (QR코드 생성 기준)';
COMMENT ON COLUMN bookings.status IS 'confirmed: 예약확정, cancelled: 취소됨';
```

---

### 2.7 booking_seats (예약-좌석 관계)

```sql
CREATE TABLE booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_booking_seat UNIQUE(booking_id, seat_id)
);

COMMENT ON TABLE booking_seats IS '예약-좌석 다대다 관계';
```

---

### 2.8 temp_reservations (임시 예약)

```sql
CREATE TABLE temp_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,

  expires_at TIMESTAMPTZ NOT NULL,               -- 만료 시간 (10분 후)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_temp_seat UNIQUE(seat_id)
);

COMMENT ON TABLE temp_reservations IS '임시 예약 (10분 타이머)';
COMMENT ON COLUMN temp_reservations.expires_at IS '만료 시간 (10분 후, 자동 삭제 대상)';
```

---

### 2.9 wishlists (위시리스트)

```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_wishlist UNIQUE(user_id, concert_id)
);

COMMENT ON TABLE wishlists IS '사용자 위시리스트';
```

---

## 3. 데이터플로우

### 3.1 콘서트 목록 조회 및 검색

```sql
-- 기본 목록 조회 (필터, 검색, 정렬 포함)
SELECT
  c.id,
  c.title,
  c.poster_url,
  c.genre,
  c.performers,
  v.name AS venue_name,
  v.address AS venue_address,
  MIN(cs.concert_date) AS nearest_date,
  MIN(s.price) AS min_price
FROM concerts c
  INNER JOIN venues v ON c.venue_id = v.id
  INNER JOIN concert_schedules cs ON c.id = cs.concert_id
  INNER JOIN seats s ON cs.id = s.concert_schedule_id
WHERE c.is_deleted = FALSE
  AND c.status = 'active'
  -- 검색 조건
  AND (c.title ILIKE '%검색어%' OR c.performers ILIKE '%검색어%')
  -- 필터 조건
  AND c.genre = '장르' -- 선택 시
  AND cs.concert_date BETWEEN '시작날짜' AND '종료날짜' -- 선택 시
  AND v.address LIKE '%지역%' -- 선택 시
  AND s.price BETWEEN 최소가격 AND 최대가격 -- 선택 시
GROUP BY c.id, v.name, v.address
ORDER BY
  CASE WHEN 정렬='최신순' THEN c.created_at END DESC,
  CASE WHEN 정렬='인기순' THEN c.popularity END DESC,
  CASE WHEN 정렬='가격순' THEN MIN(s.price) END ASC
LIMIT 20 OFFSET 0;
```

---

### 3.2 콘서트 상세 조회

```sql
-- 콘서트 기본 정보
SELECT
  c.*,
  v.name AS venue_name,
  v.address AS venue_address,
  v.location_lat,
  v.location_lng
FROM concerts c
  INNER JOIN venues v ON c.venue_id = v.id
WHERE c.id = '콘서트ID' AND c.is_deleted = FALSE;

-- 회차 목록
SELECT
  id,
  concert_date,
  concert_time,
  available_seats,
  is_sold_out,
  is_booking_open
FROM concert_schedules
WHERE concert_id = '콘서트ID'
ORDER BY concert_date, concert_time;

-- 좌석 등급별 가격 정보
SELECT
  seat_grade,
  MIN(price) AS min_price,
  MAX(price) AS max_price
FROM seats
WHERE concert_schedule_id = '회차ID'
GROUP BY seat_grade;

-- 위시리스트 여부 확인
SELECT EXISTS(
  SELECT 1 FROM wishlists
  WHERE user_id = '사용자ID' AND concert_id = '콘서트ID'
) AS is_wishlisted;
```

---

### 3.3 좌석 선택 및 예약

#### 3.3.1 좌석도 조회
```sql
-- 모든 좌석 상태 조회
SELECT
  id,
  seat_number,
  seat_grade,
  price,
  position_x,
  position_y,
  status
FROM seats
WHERE concert_schedule_id = '회차ID'
ORDER BY seat_number;
```

#### 3.3.2 임시 예약 생성
```sql
BEGIN;

-- 좌석 상태 확인
SELECT status FROM seats WHERE id = '좌석ID' FOR UPDATE;

-- 임시 예약 생성
INSERT INTO temp_reservations (user_id, seat_id, expires_at)
VALUES ('사용자ID', '좌석ID', NOW() + INTERVAL '10 minutes');

-- 좌석 상태 업데이트
UPDATE seats SET status = 'temp_reserved', updated_at = NOW()
WHERE id = '좌석ID';

COMMIT;
```

#### 3.3.3 예약 생성
```sql
BEGIN;

-- 예약 생성
INSERT INTO bookings (user_id, concert_schedule_id, booking_number)
VALUES ('사용자ID', '회차ID', '예약번호')
RETURNING id;

-- 예약-좌석 관계 생성 (선택한 모든 좌석)
INSERT INTO booking_seats (booking_id, seat_id)
SELECT '예약ID', seat_id
FROM temp_reservations
WHERE user_id = '사용자ID';

-- 좌석 상태 업데이트
UPDATE seats
SET status = 'reserved', updated_at = NOW()
WHERE id IN (
  SELECT seat_id FROM temp_reservations WHERE user_id = '사용자ID'
);

-- 임시 예약 삭제
DELETE FROM temp_reservations WHERE user_id = '사용자ID';

-- 예매 가능 좌석 수 업데이트
UPDATE concert_schedules
SET available_seats = available_seats - (선택한좌석수),
    is_sold_out = (available_seats - (선택한좌석수) = 0),
    updated_at = NOW()
WHERE id = '회차ID';

COMMIT;
```

---

### 3.4 예약 내역 조회

```sql
-- 예약 목록 조회
SELECT
  b.id,
  b.booking_number,
  b.status,
  b.created_at,
  c.title AS concert_title,
  c.poster_url,
  cs.concert_date,
  cs.concert_time,
  v.name AS venue_name,
  v.address AS venue_address,
  COUNT(bs.seat_id) AS seat_count,
  ARRAY_AGG(s.seat_number ORDER BY s.seat_number) AS seat_numbers
FROM bookings b
  INNER JOIN concert_schedules cs ON b.concert_schedule_id = cs.id
  INNER JOIN concerts c ON cs.concert_id = c.id
  INNER JOIN venues v ON c.venue_id = v.id
  LEFT JOIN booking_seats bs ON b.id = bs.booking_id
  LEFT JOIN seats s ON bs.seat_id = s.id
WHERE b.user_id = '사용자ID'
  AND b.status = '상태필터' -- confirmed, cancelled
  -- 날짜 필터
  AND (
    CASE WHEN 필터='예정' THEN cs.concert_date >= CURRENT_DATE
         WHEN 필터='지난공연' THEN cs.concert_date < CURRENT_DATE
         ELSE TRUE
    END
  )
  -- 검색
  AND c.title ILIKE '%검색어%'
GROUP BY b.id, c.title, c.poster_url, cs.concert_date, cs.concert_time, v.name, v.address
ORDER BY
  CASE WHEN 정렬='날짜순' THEN cs.concert_date END ASC,
  CASE WHEN 정렬='최신예약순' THEN b.created_at END DESC
LIMIT 10 OFFSET 0;
```

---

### 3.5 예약 상세 조회

```sql
-- 예약 상세 정보
SELECT
  b.id,
  b.booking_number,
  b.status,
  b.created_at,
  b.cancelled_at,
  b.cancellation_reason,
  c.title AS concert_title,
  c.poster_url,
  c.performers,
  cs.concert_date,
  cs.concert_time,
  v.name AS venue_name,
  v.address AS venue_address,
  v.location_lat,
  v.location_lng,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'seat_number', s.seat_number,
      'seat_grade', s.seat_grade,
      'price', s.price
    ) ORDER BY s.seat_number
  ) AS seats
FROM bookings b
  INNER JOIN concert_schedules cs ON b.concert_schedule_id = cs.id
  INNER JOIN concerts c ON cs.concert_id = c.id
  INNER JOIN venues v ON c.venue_id = v.id
  LEFT JOIN booking_seats bs ON b.id = bs.booking_id
  LEFT JOIN seats s ON bs.seat_id = s.id
WHERE b.id = '예약ID' AND b.user_id = '사용자ID'
GROUP BY b.id, c.title, c.poster_url, c.performers, cs.concert_date, cs.concert_time,
         v.name, v.address, v.location_lat, v.location_lng;
```

---

### 3.6 예약 취소

```sql
BEGIN;

-- 예약 상태 업데이트
UPDATE bookings
SET status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = '취소사유',
    updated_at = NOW()
WHERE id = '예약ID' AND user_id = '사용자ID' AND status = 'confirmed';

-- 좌석 상태 복원
UPDATE seats
SET status = 'available', updated_at = NOW()
WHERE id IN (
  SELECT seat_id FROM booking_seats WHERE booking_id = '예약ID'
);

-- 예매 가능 좌석 수 복원
UPDATE concert_schedules cs
SET available_seats = available_seats + (
  SELECT COUNT(*) FROM booking_seats WHERE booking_id = '예약ID'
),
    is_sold_out = FALSE,
    updated_at = NOW()
WHERE id = (SELECT concert_schedule_id FROM bookings WHERE id = '예약ID');

COMMIT;
```

---

## 4. 인덱스 전략

### 4.1 주요 인덱스

```sql
-- concerts 테이블
CREATE INDEX idx_concerts_genre ON concerts(genre) WHERE is_deleted = FALSE;
CREATE INDEX idx_concerts_status ON concerts(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_concerts_popularity ON concerts(popularity DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_concerts_title_trgm ON concerts USING gin(title gin_trgm_ops); -- 전문 검색
CREATE INDEX idx_concerts_performers_trgm ON concerts USING gin(performers gin_trgm_ops);

-- concert_schedules 테이블
CREATE INDEX idx_concert_schedules_concert_id ON concert_schedules(concert_id);
CREATE INDEX idx_concert_schedules_date ON concert_schedules(concert_date);
CREATE INDEX idx_concert_schedules_available ON concert_schedules(concert_date)
  WHERE is_booking_open = TRUE AND is_sold_out = FALSE;

-- seats 테이블
CREATE INDEX idx_seats_schedule_id ON seats(concert_schedule_id);
CREATE INDEX idx_seats_status ON seats(status) WHERE status = 'available';

-- bookings 테이블
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_schedule_id ON bookings(concert_schedule_id);

-- booking_seats 테이블
CREATE INDEX idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat_id ON booking_seats(seat_id);

-- temp_reservations 테이블
CREATE INDEX idx_temp_reservations_user_id ON temp_reservations(user_id);
CREATE INDEX idx_temp_reservations_expires_at ON temp_reservations(expires_at);

-- wishlists 테이블
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_concert_id ON wishlists(concert_id);
```

---

## 5. 제약조건 및 정책

### 5.1 체크 제약조건

```sql
-- seats 테이블
ALTER TABLE seats ADD CONSTRAINT chk_seats_price CHECK (price >= 0);
ALTER TABLE seats ADD CONSTRAINT chk_seats_status
  CHECK (status IN ('available', 'temp_reserved', 'reserved', 'unavailable'));

-- concert_schedules 테이블
ALTER TABLE concert_schedules ADD CONSTRAINT chk_available_seats
  CHECK (available_seats >= 0 AND available_seats <= total_seats);

-- bookings 테이블
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status
  CHECK (status IN ('confirmed', 'cancelled'));
```

### 5.2 트리거

#### 5.2.1 updated_at 자동 업데이트
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 적용
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concerts_updated_at BEFORE UPDATE ON concerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concert_schedules_updated_at BEFORE UPDATE ON concert_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 5.2.2 만료된 임시 예약 자동 삭제 (Cron Job 필요)
```sql
-- Supabase의 pg_cron 또는 애플리케이션 레벨에서 주기적 실행
DELETE FROM temp_reservations WHERE expires_at < NOW();

-- 좌석 상태 복원
UPDATE seats SET status = 'available'
WHERE id IN (
  SELECT seat_id FROM temp_reservations WHERE expires_at < NOW()
);
```

### 5.3 RLS (Row Level Security) - 비활성화

```sql
-- AGENTS.md 가이드라인에 따라 RLS 사용하지 않음
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE concerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE concert_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE temp_reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;
```

---

## 6. 추가 고려사항

### 6.1 성능 최적화

- **파티셔닝**: `concert_schedules`, `bookings` 테이블은 날짜 기준 파티셔닝 고려 (데이터 증가 시)
- **캐싱**: 콘서트 목록, 상세 정보는 Redis 캐싱 권장
- **Connection Pooling**: Supabase Pooler 사용

### 6.2 데이터 정합성

- **트랜잭션**: 예약 생성/취소는 반드시 트랜잭션 처리
- **낙관적 락킹**: 좌석 선택 시 `FOR UPDATE` 사용
- **정합성 체크**: 주기적으로 `concert_schedules.available_seats` 재계산

### 6.3 백업 및 복구

- Supabase 자동 백업 활용
- 중요 트랜잭션은 별도 로그 테이블 고려

---

**문서 종료**
