-- LITERATERAPI-SAKTI - migrasi 0005: workflow role lanjutan.
--
-- Menambahkan status revisi cerita untuk Editor Konten dan laporan keamanan
-- konten dari pengguna. Keduanya berada pada level cerita, bukan diagnosis
-- atau penilaian pribadi siswa.

create table if not exists public.story_review_statuses (
  story_slug text primary key,
  status text not null default 'aman'
    check (status in ('aman', 'perlu_revisi_gambar', 'perlu_tinjauan_ahli', 'selesai')),
  note text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.story_review_statuses is
  'Status kerja editorial per cerita: aman, perlu revisi gambar, perlu tinjauan ahli, atau selesai.';

create table if not exists public.content_safety_reports (
  id uuid primary key default gen_random_uuid(),
  story_slug text not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reporter_role text not null default 'siswa',
  location text not null default 'story_detail',
  body text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content_safety_reports is
  'Laporan pengguna tentang konten atau gambar yang terasa tidak nyaman atau tidak sesuai. Laporan ini untuk moderasi konten, bukan data klinis.';

create index if not exists content_safety_reports_story_slug_idx on public.content_safety_reports (story_slug);
create index if not exists content_safety_reports_status_idx on public.content_safety_reports (status);
create index if not exists content_safety_reports_reporter_id_idx on public.content_safety_reports (reporter_id);

alter table public.story_review_statuses enable row level security;
alter table public.content_safety_reports enable row level security;

drop policy if exists story_review_statuses_select_review_roles on public.story_review_statuses;
create policy story_review_statuses_select_review_roles on public.story_review_statuses
  for select using (
    public.has_role('moderator')
    or public.has_role('editor_konten')
    or public.has_role('ahli')
    or public.has_role('peneliti')
    or public.has_role('admin')
  );

drop policy if exists story_review_statuses_manage_editor_admin on public.story_review_statuses;
create policy story_review_statuses_manage_editor_admin on public.story_review_statuses
  for all using (
    public.has_role('editor_konten')
    or public.has_role('admin')
  )
  with check (
    public.has_role('editor_konten')
    or public.has_role('admin')
  );

drop policy if exists content_safety_reports_insert_authenticated on public.content_safety_reports;
create policy content_safety_reports_insert_authenticated on public.content_safety_reports
  for insert with check (
    reporter_id = auth.uid()
  );

drop policy if exists content_safety_reports_select_reporter_or_review_roles on public.content_safety_reports;
create policy content_safety_reports_select_reporter_or_review_roles on public.content_safety_reports
  for select using (
    reporter_id = auth.uid()
    or public.has_role('moderator')
    or public.has_role('editor_konten')
    or public.has_role('ahli')
    or public.has_role('admin')
  );

drop policy if exists content_safety_reports_update_review_roles on public.content_safety_reports;
create policy content_safety_reports_update_review_roles on public.content_safety_reports
  for update using (
    public.has_role('moderator')
    or public.has_role('editor_konten')
    or public.has_role('ahli')
    or public.has_role('admin')
  )
  with check (
    public.has_role('moderator')
    or public.has_role('editor_konten')
    or public.has_role('ahli')
    or public.has_role('admin')
  );
