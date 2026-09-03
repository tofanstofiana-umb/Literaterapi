-- LITERATERAPI-SAKTI - migrasi 0009: rubrik tinjauan ahli per cerita.
--
-- Menyimpan checklist ahli secara terstruktur agar editor/moderator dapat
-- melihat dasar tinjauan tanpa membuka data siswa.

create table if not exists public.expert_story_rubrics (
  story_slug text not null,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  culture_ok boolean not null default false,
  non_clinical_ok boolean not null default false,
  age_ok boolean not null default false,
  public_category_ok boolean not null default false,
  sakti_affirmation_ok boolean not null default false,
  recommendation text not null default 'perlu_revisi'
    check (recommendation in ('layak', 'perlu_revisi', 'tidak_cocok')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (story_slug, reviewer_id)
);

comment on table public.expert_story_rubrics is
  'Rubrik tinjauan ahli per cerita: kesesuaian budaya, bahasa non-klinis, usia, kategori publik, dan afirmasi S-A-K-T-I.';

alter table public.expert_story_rubrics enable row level security;

drop policy if exists expert_story_rubrics_select_review_roles on public.expert_story_rubrics;
create policy expert_story_rubrics_select_review_roles on public.expert_story_rubrics
  for select using (
    public.has_role('ahli')
    or public.has_role('editor_konten')
    or public.has_role('moderator')
    or public.has_role('admin')
  );

drop policy if exists expert_story_rubrics_manage_expert_admin on public.expert_story_rubrics;
create policy expert_story_rubrics_manage_expert_admin on public.expert_story_rubrics
  for all using (
    reviewer_id = auth.uid()
    or public.is_admin()
  )
  with check (
    (reviewer_id = auth.uid() and public.has_role('ahli'))
    or public.is_admin()
  );

grant select on table public.expert_story_rubrics to authenticated;
grant insert, update on table public.expert_story_rubrics to authenticated;
