-- LITERATERAPI-SAKTI — migrasi 0011: studio draft cerita untuk editor konten.
--
-- Draft ini menjadi ruang kerja editorial berbasis dashboard. Cerita baru
-- tidak langsung tampil untuk siswa; editor/ahli/moderator dapat meninjau
-- metadata, naskah, aset visual, dan prompt S-A-K-T-I terlebih dahulu.

create table if not exists public.editor_story_drafts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_id text not null,
  title_ms text,
  synopsis_id text not null,
  synopsis_ms text,
  body_id text not null,
  body_ms text,
  origin_country text not null check (origin_country in ('Indonesia', 'Malaysia')),
  original_language text not null default 'id-ID' check (original_language in ('id-ID', 'ms-MY')),
  age_min integer not null default 12,
  age_max integer not null default 14,
  reading_estimate_minutes integer not null default 5,
  emotional_intensity text not null default 'medium' check (emotional_intensity in ('low', 'medium', 'high')),
  facilitator_requirement text not null default 'recommended'
    check (facilitator_requirement in ('independent', 'recommended', 'required', 'restricted')),
  internal_category text,
  public_category_slugs text[] not null default '{}'::text[],
  cover_image_url text,
  scene_assets jsonb not null default '[]'::jsonb,
  sakti_prompts jsonb not null default '{}'::jsonb,
  editorial_status text not null default 'draft' check (
    editorial_status in (
      'draft', 'editing', 'linguistic_review', 'literary_review',
      'cultural_review', 'psychological_review', 'approved', 'ready_to_publish', 'archived'
    )
  ),
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.editor_story_drafts is
  'Ruang draft cerita dari dashboard editor konten. Draft belum otomatis tampil ke siswa sampai melewati alur tinjauan dan proses publikasi.';

create index if not exists editor_story_drafts_created_by_idx on public.editor_story_drafts (created_by);
create index if not exists editor_story_drafts_status_idx on public.editor_story_drafts (editorial_status);
create index if not exists editor_story_drafts_origin_country_idx on public.editor_story_drafts (origin_country);

alter table public.editor_story_drafts enable row level security;

drop policy if exists editor_story_drafts_select_review_roles on public.editor_story_drafts;
create policy editor_story_drafts_select_review_roles on public.editor_story_drafts
  for select using (
    public.has_role('editor_konten')
    or public.has_role('moderator')
    or public.has_role('ahli')
    or public.is_admin()
  );

drop policy if exists editor_story_drafts_insert_editor_admin on public.editor_story_drafts;
create policy editor_story_drafts_insert_editor_admin on public.editor_story_drafts
  for insert with check (
    created_by = auth.uid()
    and (public.has_role('editor_konten') or public.is_admin())
  );

drop policy if exists editor_story_drafts_update_editor_admin on public.editor_story_drafts;
create policy editor_story_drafts_update_editor_admin on public.editor_story_drafts
  for update using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());

revoke all privileges on table public.editor_story_drafts from anon;
revoke all privileges on table public.editor_story_drafts from authenticated;

grant select on table public.editor_story_drafts to authenticated;
grant insert, update on table public.editor_story_drafts to authenticated;
