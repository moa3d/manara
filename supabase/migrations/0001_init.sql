-- ============================================================
-- دار الرموز العربية — المخطط الأساسي
-- الجداول: categories, authors, publishers, books, admins
-- القراءة متاحة للجميع، والكتابة للمديرين فقط (RLS)
-- ============================================================

-- ---------- الجداول المرجعية ----------
create table public.categories (
  id          bigint generated always as identity primary key,
  name        text not null unique check (length(trim(name)) between 1 and 80),
  color       text not null default '#4A5561' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at  timestamptz not null default now()
);

create table public.authors (
  id          bigint generated always as identity primary key,
  name        text not null unique check (length(trim(name)) between 1 and 120),
  created_at  timestamptz not null default now()
);

create table public.publishers (
  id          bigint generated always as identity primary key,
  name        text not null unique check (length(trim(name)) between 1 and 120),
  created_at  timestamptz not null default now()
);

-- ---------- الكتب ----------
create table public.books (
  id            bigint generated always as identity primary key,
  title         text   not null check (length(trim(title)) between 1 and 200),
  -- on delete restrict: لا يمكن حذف كاتب/دار/تصنيف ما دامت له كتب
  author_id     bigint not null references public.authors(id)    on delete restrict,
  publisher_id  bigint not null references public.publishers(id) on delete restrict,
  category_id   bigint not null references public.categories(id) on delete restrict,
  publish_year  int    not null check (publish_year between -3000 and 2100), -- سالب = قبل الميلاد
  language      text   not null default 'العربية',
  pages         int    check (pages is null or pages > 0),
  isbn          text   unique check (isbn is null or isbn ~ '^([0-9]{9}[0-9X]|[0-9]{13})$'),
  description   text   check (description is null or length(description) <= 1000),
  cover_url     text,
  shelf_code    text,  -- رمز الرف (اختياري): يساعد على إيجاد الكتاب فعليًا
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index books_author_idx    on public.books(author_id);
create index books_publisher_idx on public.books(publisher_id);
create index books_category_idx  on public.books(category_id);
create index books_year_idx      on public.books(publish_year);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger books_touch before update on public.books
  for each row execute function public.touch_updated_at();

-- ---------- المديرون ----------
-- المدير مستخدم في Supabase Auth (كلمة المرور مشفّرة هناك) ومسجّل في هذا الجدول
create table public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------- RLS ----------
alter table public.categories enable row level security;
alter table public.authors    enable row level security;
alter table public.publishers enable row level security;
alter table public.books      enable row level security;
alter table public.admins     enable row level security;

-- القراءة للجميع
create policy "read categories" on public.categories for select using (true);
create policy "read authors"    on public.authors    for select using (true);
create policy "read publishers" on public.publishers for select using (true);
create policy "read books"      on public.books      for select using (true);

-- الكتابة للمديرين فقط
create policy "admin write categories" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write authors" on public.authors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write publishers" on public.publishers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write books" on public.books for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- المدير يرى سجله فقط (الإضافة تتم من SQL Editor)
create policy "admin reads self" on public.admins for select to authenticated
  using (user_id = auth.uid());

-- ---------- تخزين صور الأغلفة ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public read covers" on storage.objects for select
  using (bucket_id = 'covers');
create policy "admin upload covers" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and public.is_admin());
create policy "admin update covers" on storage.objects for update to authenticated
  using (bucket_id = 'covers' and public.is_admin());
create policy "admin delete covers" on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and public.is_admin());
