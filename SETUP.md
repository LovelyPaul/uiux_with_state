# 🚀 콘서트 예약 시스템 환경 설정 가이드

이 문서는 로컬 개발 환경에서 프로젝트를 실행하기 위한 단계별 가이드입니다.

## ✅ 설정 체크리스트

- [x] Node modules 설치 완료
- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 데이터베이스 마이그레이션 적용
- [ ] 샘플 데이터 입력
- [ ] 개발 서버 실행

---

## 📋 1단계: Supabase 프로젝트 설정

### 1-1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: concert-booking (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 설정
   - **Region**: Northeast Asia (Seoul) 권장
4. "Create new project" 클릭하여 생성 (1-2분 소요)

### 1-2. API Keys 확인

프로젝트 생성 후, 다음 경로에서 API Keys를 확인:

1. 왼쪽 메뉴 → **Settings** → **API**
2. 다음 3가지 값을 복사:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon/public key** (매우 긴 JWT 토큰)
   - **service_role key** (매우 긴 JWT 토큰)

---

## 🔐 2단계: 환경 변수 설정

### 2-1. .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하세요:

\`\`\`bash
# 프로젝트 루트에서 실행
cp .env.local.example .env.local
\`\`\`

### 2-2. API Keys 입력

`.env.local` 파일을 열고, Supabase에서 복사한 값을 입력:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

> ⚠️ **주의**: \`SUPABASE_SERVICE_ROLE_KEY\`는 절대 외부에 노출하면 안 됩니다!

---

## 🗄️ 3단계: 데이터베이스 마이그레이션

### 3-1. SQL Editor에서 마이그레이션 실행

Supabase Dashboard에서:

1. 왼쪽 메뉴 → **SQL Editor**
2. "New Query" 클릭
3. 다음 순서대로 SQL 파일 내용을 복사하여 실행:

#### ① 기본 테이블 생성
\`\`\`bash
# supabase/migrations/0001_create_example_table.sql
# (예제 테이블이므로 선택사항)
\`\`\`

#### ② 콘서트 예약 시스템 테이블 생성
\`\`\`bash
# supabase/migrations/0002_create_concert_booking_system.sql 내용을 복사
\`\`\`

이 파일은 다음 테이블을 생성합니다:
- \`venues\`: 공연장
- \`concerts\`: 콘서트
- \`schedules\`: 공연 일정
- \`seats\`: 좌석
- \`wishlists\`: 위시리스트
- \`temp_reservations\`: 임시 예약
- \`bookings\`: 예약
- \`booking_seats\`: 예약-좌석 관계

#### ③ RPC Functions 생성
\`\`\`bash
# supabase/migrations/0003_create_rpc_functions.sql 내용을 복사
\`\`\`

이 파일은 다음 함수를 생성합니다:
- \`create_temp_reservation\`: 임시 예약 생성
- \`create_booking_transaction\`: 예약 확정 (트랜잭션)
- \`cancel_booking_transaction\`: 예약 취소 (트랜잭션)
- \`cleanup_expired_temp_reservations\`: 만료된 임시 예약 정리

> 💡 **팁**: 각 SQL 파일을 실행할 때 "RUN" 버튼을 클릭하고 에러가 없는지 확인하세요.

### 3-2. RLS (Row Level Security) 비활성화 확인

이 프로젝트는 서버 사이드에서만 Supabase를 사용하므로 RLS를 비활성화합니다:

1. **Table Editor** 메뉴로 이동
2. 각 테이블 선택 → 오른쪽 상단 ⚙️ 아이콘 클릭
3. "Enable Row Level Security" 체크 해제

---

## 🎭 4단계: 샘플 데이터 입력 (선택사항)

테스트를 위해 샘플 데이터를 입력합니다:

### SQL Editor에서 실행:

\`\`\`sql
-- 1. 공연장 생성
INSERT INTO venues (name, location, address, total_capacity) VALUES
('올림픽공원 체조경기장', '서울 송파구', '서울특별시 송파구 올림픽로 424', 5000),
('고척스카이돔', '서울 구로구', '서울특별시 구로구 경인로 430', 10000);

-- 2. 콘서트 생성
INSERT INTO concerts (title, artist, genre, description, image_url, venue_id, start_date, end_date) VALUES
('2024 Rock Festival', 'Various Artists', 'rock', '최고의 록 밴드들이 모이는 축제', 'https://picsum.photos/seed/rock1/800/450',
  (SELECT id FROM venues WHERE name = '올림픽공원 체조경기장' LIMIT 1),
  '2025-11-01', '2025-11-03'),
('K-POP 콘서트', 'BTS', 'pop', '글로벌 K-POP 스타들의 무대', 'https://picsum.photos/seed/kpop1/800/450',
  (SELECT id FROM venues WHERE name = '고척스카이돔' LIMIT 1),
  '2025-12-15', '2025-12-17');

-- 3. 공연 일정 생성
INSERT INTO schedules (concert_id, concert_date, start_time) VALUES
((SELECT id FROM concerts WHERE title = '2024 Rock Festival' LIMIT 1), '2025-11-01', '19:00'),
((SELECT id FROM concerts WHERE title = '2024 Rock Festival' LIMIT 1), '2025-11-02', '19:00'),
((SELECT id FROM concerts WHERE title = 'K-POP 콘서트' LIMIT 1), '2025-12-15', '18:00');

-- 4. 좌석 생성 (간단히 A1-A10만 생성)
DO $$
DECLARE
  schedule_record RECORD;
  seat_num TEXT;
  i INTEGER;
BEGIN
  FOR schedule_record IN SELECT id FROM schedules LOOP
    FOR i IN 1..10 LOOP
      seat_num := 'A' || i;
      INSERT INTO seats (schedule_id, seat_number, grade, price, status)
      VALUES (schedule_record.id, seat_num, 'VIP', 150000, 'available');
    END LOOP;
  END LOOP;
END $$;
\`\`\`

---

## 🏗️ 5단계: 빌드 테스트

\`\`\`bash
npm run build
\`\`\`

빌드가 성공하면 다음과 같은 메시지가 표시됩니다:
\`\`\`
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
\`\`\`

---

## 🚀 6단계: 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

서버가 시작되면:
\`\`\`
▲ Next.js 15.1.0
- Local:        http://localhost:3000
- Ready in 2.5s
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속!

---

## 📍 주요 페이지 경로

- **콘서트 목록**: `/concerts`
- **콘서트 상세**: `/concerts/[id]`
- **좌석 선택**: `/concerts/[id]/seats?scheduleId=[schedule_id]`
- **내 예약 목록**: `/my/bookings`
- **예약 상세**: `/my/bookings/[id]`

---

## 🐛 문제 해결

### Q1: "TypeError: fetch failed" 또는 API 에러
→ `.env.local` 파일의 Supabase URL과 Keys를 확인하세요.

### Q2: "relation does not exist" 데이터베이스 에러
→ 마이그레이션 SQL이 제대로 실행되지 않았습니다. 3단계를 다시 확인하세요.

### Q3: 빌드 에러 발생
→ node_modules를 재설치하세요:
\`\`\`bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --ignore-scripts
\`\`\`

### Q4: "SUPABASE_SERVICE_ROLE_KEY is not defined"
→ 환경 변수 파일 이름이 정확히 \`.env.local\`인지 확인하세요.

---

## 🎉 완료!

모든 단계가 완료되면 기능 테스트를 시작할 수 있습니다!

다음 단계: [TESTING.md](./TESTING.md) 문서를 참고하여 기능 테스트를 진행하세요.
