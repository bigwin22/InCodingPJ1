-- 1. user_id 컬럼 추가 (아직 없다면)
alter table public.reviews 
add column if not exists user_id uuid references public.users(id);

-- 2. updated_at 컬럼 추가 (아직 없다면)
alter table public.reviews 
add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- 3. 기존 데이터에 대해 updated_at이 혹시 비어있다면 created_at 값으로 채움
update public.reviews 
set updated_at = created_at 
where updated_at is null;

-- 4. 한 사용자가 같은 급식(날짜+끼니)에 대해 중복 리뷰 방지 (유니크 인덱스)
create unique index if not exists idx_reviews_user_meal 
on public.reviews(user_id, meal_date, meal_type) 
where user_id is not null;

-- 5. 학교별/날짜별 조회 성능 향상을 위한 인덱스
create index if not exists reviews_school_lookup_idx 
on public.reviews (school_code, office_code, meal_date);

-- 6. updated_at 자동 갱신을 위한 함수 생성 (이미 존재하면 덮어씌움)
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 7. 트리거 연결 (이미 존재할 수 있으므로 삭제 후 재생성 방식 사용)
drop trigger if exists set_updated_at on public.reviews;

create trigger set_updated_at
before update on public.reviews
for each row
execute function update_updated_at_column();
