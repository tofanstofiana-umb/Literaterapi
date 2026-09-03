-- LITERATERAPI-SAKTI - migrasi 0002: aktivitas siswa dan pendampingan.
--
-- Tabel ini menghubungkan pengalaman membaca siswa dengan area pendamping:
-- progres layar, refleksi S-A-K-T-I, dan catatan tindak lanjut fasilitator.
-- Progres layar tetap diperlakukan sebagai jejak interaksi, bukan bukti
-- pemahaman penuh.

create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  story_slug text not null,
  story_title text not null,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, story_slug)
);
comment on table public.reading_progress is
  'Jejak progres layar per siswa dan cerpen. Tidak boleh dipakai sebagai bukti pemahaman penuh.';
create index if not exists reading_progress_student_id_idx on public.reading_progress (student_id);
create index if not exists reading_progress_story_slug_idx on public.reading_progress (story_slug);

create table if not exists public.reflection_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  story_slug text not null,
  story_title text not null,
  stage text not null check (stage in ('sadar', 'aktif', 'kritis', 'terbuka', 'imersif')),
  response text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, story_slug, stage)
);
comment on table public.reflection_entries is
  'Catatan refleksi S-A-K-T-I siswa yang dapat dibaca pendamping kelas untuk tindak lanjut suportif.';
create index if not exists reflection_entries_student_id_idx on public.reflection_entries (student_id);
create index if not exists reflection_entries_story_slug_idx on public.reflection_entries (story_slug);

create table if not exists public.companion_notes (
  id uuid primary key default gen_random_uuid(),
  facilitator_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  note_type text not null default 'support' check (note_type in ('support', 'follow_up', 'safety', 'class_note')),
  body text not null,
  status text not null default 'open' check (status in ('open', 'done', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.companion_notes is
  'Catatan tindak lanjut pendamping untuk siswa. Tidak ditampilkan ke siswa secara otomatis.';
create index if not exists companion_notes_facilitator_id_idx on public.companion_notes (facilitator_id);
create index if not exists companion_notes_student_id_idx on public.companion_notes (student_id);
create index if not exists companion_notes_class_id_idx on public.companion_notes (class_id);

create or replace function public.is_facilitator_for_student(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.classes c
    join public.class_members cm on cm.class_id = c.id
    where c.facilitator_id = auth.uid()
      and cm.student_id = p_student_id
  );
$$;
comment on function public.is_facilitator_for_student(uuid) is
  'True bila pengguna saat ini adalah fasilitator kelas tempat siswa tersebut menjadi anggota.';

alter table public.reading_progress enable row level security;
alter table public.reflection_entries enable row level security;
alter table public.companion_notes enable row level security;

create policy reading_progress_select_self_facilitator_admin on public.reading_progress
  for select using (
    student_id = auth.uid()
    or public.is_facilitator_for_student(student_id)
    or public.is_admin()
  );
create policy reading_progress_insert_self on public.reading_progress
  for insert with check (student_id = auth.uid());
create policy reading_progress_update_self on public.reading_progress
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy reflection_entries_select_self_facilitator_admin on public.reflection_entries
  for select using (
    student_id = auth.uid()
    or public.is_facilitator_for_student(student_id)
    or public.is_admin()
  );
create policy reflection_entries_insert_self on public.reflection_entries
  for insert with check (student_id = auth.uid());
create policy reflection_entries_update_self on public.reflection_entries
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy companion_notes_select_facilitator_admin on public.companion_notes
  for select using (
    facilitator_id = auth.uid()
    or public.is_facilitator_for_student(student_id)
    or public.is_admin()
  );
create policy companion_notes_insert_facilitator_admin on public.companion_notes
  for insert with check (
    facilitator_id = auth.uid()
    and (
      public.is_facilitator_for_student(student_id)
      or public.is_admin()
    )
  );
create policy companion_notes_update_facilitator_admin on public.companion_notes
  for update using (
    facilitator_id = auth.uid()
    or public.is_admin()
  ) with check (
    facilitator_id = auth.uid()
    or public.is_admin()
  );
