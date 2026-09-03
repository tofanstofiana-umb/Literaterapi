-- LITERATERAPI-SAKTI — migrasi 0003: kolaborasi lintas role.
-- Tabel ini menghubungkan Moderator, Editor Konten, dan Ahli melalui catatan
-- tinjauan konten. Catatan ini berada pada level cerita, bukan data pribadi siswa.

create table if not exists public.content_review_notes (
  id uuid primary key default gen_random_uuid(),
  story_slug text not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_role text not null check (author_role in ('moderator', 'editor_konten', 'ahli', 'admin')),
  note_type text not null check (note_type in ('moderation', 'editorial', 'expert_review', 'safety')),
  body text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_review_notes_story_slug_idx on public.content_review_notes (story_slug);
create index if not exists content_review_notes_status_idx on public.content_review_notes (status);
create index if not exists content_review_notes_author_id_idx on public.content_review_notes (author_id);

alter table public.content_review_notes enable row level security;

drop policy if exists content_review_notes_select_review_roles on public.content_review_notes;
create policy content_review_notes_select_review_roles on public.content_review_notes
  for select using (
    public.has_role('moderator')
    or public.has_role('editor_konten')
    or public.has_role('ahli')
    or public.has_role('admin')
  );

drop policy if exists content_review_notes_insert_review_roles on public.content_review_notes;
create policy content_review_notes_insert_review_roles on public.content_review_notes
  for insert with check (
    author_id = auth.uid()
    and (
      public.has_role('moderator')
      or public.has_role('editor_konten')
      or public.has_role('ahli')
      or public.has_role('admin')
    )
  );

drop policy if exists content_review_notes_update_review_roles on public.content_review_notes;
create policy content_review_notes_update_review_roles on public.content_review_notes
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
