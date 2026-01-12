# 학교 급식 리뷰 플랫폼 - 최종 설정 가이드

본 프로젝트의 모든 기능(Google OAuth 로그인, 학교 자동 설정, 마이페이지 리뷰 관리) 개발이 완료되었습니다. 서비스를 정상적으로 실행하기 위해 다음 단계를 반드시 수행해 주세요.

## 1. Supabase 데이터베이스 구축 (필수)
프로젝트 루트에 있는 `setup.sql` 파일을 사용하여 DB 테이블을 생성해야 합니다.
1. [Supabase Dashboard](https://app.supabase.com/) 접속 및 프로젝트 선택.
2. 왼쪽 메뉴의 **SQL Editor** 클릭 -> **New query** 선택.
3. `setup.sql` 파일의 전체 내용을 복사하여 붙여넣고 **Run** 버튼 클릭.

## 2. Google Cloud OAuth 설정
Google 로그인을 연동하기 위한 클라이언트 정보를 발급받아야 합니다.
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성/선택.
2. **API 및 서비스 > 사용자 인증 정보** -> **사용자 인증 정보 만들기 > OAuth 클라이언트 ID** 클릭.
3. **애플리케이션 유형**: 웹 애플리케이션.
4. **승인된 리디렉션 URI**: Supabase Dashboard의 **Authentication > Providers > Google** 섹션에 표시된 `Callback URL`을 입력 (중요).
5. 생성된 **Client ID**와 **Client Secret**을 복사해둡니다.

## 3. Supabase Auth 활성화
1. Supabase Dashboard -> **Authentication > Providers** -> **Google** 클릭.
2. **Enabled** 활성화.
3. 위에서 복사한 **Client ID**와 **Client Secret**을 입력하고 **Save** 클릭.

## 4. 환경 변수(.env) 설정

### 백엔드 (루트 폴더의 .env)
```env
SUPABASE_URL=당신의_SUPABASE_URL
SUPABASE_KEY=당신의_SUPABASE_SERVICE_ROLE_KEY (또는 ANON_KEY)
NEIS_KEY=당신의_NEIS_API_KEY
```

### 프론트엔드 (School Meal Review Platform/.env)
```env
VITE_SUPABASE_URL=당신의_SUPABASE_URL
VITE_SUPABASE_KEY=당신의_SUPABASE_ANON_KEY
```

## 5. 서버 실행 방법

### 백엔드 실행
```bash
pip install -r requirements.txt
uvicorn backend:app --reload
```

### 프론트엔드 실행
```bash
cd "School Meal Review Platform"
npm install
npm run dev
```

## 6. 주요 기능 확인
- **최초 로그인**: 로그인 성공 시 즉시 학교 설정 창이 뜹니다. 본인의 학교를 검색해 선택하세요.
- **자동 급식 로딩**: 다음 접속 시부터는 검색 없이 로그인만 하면 내 학교 급식이 바로 보입니다.
- **리뷰 제한**: 본인 학교가 아닌 곳은 리뷰 작성이 금지되며, 한 끼니당 하나의 리뷰만 작성/수정 가능합니다.
- **마이페이지**: 우측 상단 사람 아이콘을 클릭해 별도 페이지에서 내 리뷰를 관리(조회/삭제)하세요.
