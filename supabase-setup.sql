-- 기도 편지 테이블
create table if not exists letters (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  title_en text,
  date text,
  greeting text,
  greeting_en text,
  body_blocks jsonb default '[]',
  prayer_items jsonb default '[]',
  closing text,
  closing_en text,
  main_photo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 공개 읽기 허용 (링크로 누구나 볼 수 있도록)
alter table letters enable row level security;

create policy "누구나 읽기 가능" on letters
  for select using (true);

create policy "누구나 저장 가능" on letters
  for insert with check (true);

create policy "누구나 수정 가능" on letters
  for update using (true);
