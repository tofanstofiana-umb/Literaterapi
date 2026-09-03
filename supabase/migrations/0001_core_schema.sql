-- LITERATERAPI-SAKTI — migrasi 0001: fondasi teknis (identitas/organisasi +
-- konten inti), sesuai PRD bagian 15 "Struktur Database Inti" dan bagian 18
-- "Role-Based Access dan RLS".
--
-- CAKUPAN MIGRASI INI (fondasi teknis, disepakati sebagai titik mulai):
--   - Identitas & organisasi: profiles, schools, classes, class_members,
--     user_roles, user_preferences, consents.
--   - Konten inti (tanpa mesin SAKTI/gamifikasi/moderasi/penelitian dulu):
--     stories, story_versions, story_translations, story_categories,
--     story_category_links, cultural_contexts, cultural_glossary,
--     content_warnings.
-- TABEL YANG SENGAJA BELUM DIBUAT DI SINI (menyusul di migrasi fase MVP
-- berikutnya, lihat README project bagian "Peta Jalan"): seluruh tabel
-- mesin SAKTI (learning_modules, sakti_stages, stage_activities, dst.),
-- aktivitas siswa (reading_progress, reflection_entries, dst.),
-- gamifikasi, moderasi interkultural, penelitian/DBR, dan keamanan
-- (safety_events dst.) — PRD bagian 15.
--
-- PRINSIP KEAMANAN (PRD bagian 18, wajib dijaga di SETIAP migrasi
-- berikutnya juga):
--   - deny by default: RLS aktif di semua tabel, TANPA kebijakan permisif
--     "USING (true)" untuk tabel yang berisi data pribadi.
--   - admin memakai akses server: role admin diberikan HANYA lewat SQL
--     manual (service role) di luar aplikasi — tidak ada jalur klien untuk
--     memberi diri sendiri (atau orang lain) peran apa pun, termasuk siswa
--     menaikkan diri jadi fasilitator/admin.
--   - service role tidak pernah dikirim ke browser — kunci itu hanya boleh
--     dipakai di Server Action/Route Handler/Edge Function, tidak pernah
--     lewat NEXT_PUBLIC_*.

-- =========================================================================
-- 1. IDENTITAS & ORGANISASI
-- =========================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  age_group text check (age_group in ('12-13', '13-14', '12-14')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is
  'Identitas minimal per pengguna (PRD bagian 23: data minimal siswa) — TIDAK menyimpan email, alamat, nomor telepon, atau data pribadi lain yang tidak esensial. Satu baris per akun auth.users, dibuat otomatis oleh trigger handle_new_user().';

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null check (country in ('Indonesia', 'Malaysia')),
  created_at timestamptz not null default now()
);
comment on table public.schools is
  'Sekolah/institusi tempat kelas dibentuk (PRD bagian 3: siswa masuk lewat sekolah/kode kelas, bukan akun publik bebas).';

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  facilitator_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now()
);
comment on table public.classes is
  'Kelas yang dikelola satu fasilitator, dengan kode gabung unik (PRD alur onboarding: "Masukkan kode kelas").';
create index if not exists classes_school_id_idx on public.classes (school_id);
create index if not exists classes_facilitator_id_idx on public.classes (facilitator_id);

create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (class_id, student_id)
);
comment on table public.class_members is
  'Keanggotaan siswa dalam satu kelas — satu siswa boleh ada di lebih dari satu kelas.';
create index if not exists class_members_student_id_idx on public.class_members (student_id);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (
    role in ('siswa', 'fasilitator', 'konselor', 'moderator', 'editor_konten', 'ahli', 'peneliti', 'admin')
  ),
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);
comment on table public.user_roles is
  'Peran per akun (PRD bagian 4) — SATU akun BISA punya lebih dari satu peran (mis. Ahli yang juga Editor Konten), karena itu tabel terpisah, bukan satu kolom role di profiles. Baris "siswa" pertama dibuat otomatis oleh handle_new_user(); peran lain HANYA bisa ditambahkan manual lewat SQL Editor (service role) di luar aplikasi — lihat README.';

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  interface_language text not null default 'id-ID' check (interface_language in ('id-ID', 'en', 'ms-MY')),
  story_language_preference text not null default 'follow_interface'
    check (story_language_preference in ('follow_interface', 'original', 'id-ID', 'en', 'ms-MY')),
  avatar_config jsonb not null default '{}'::jsonb,
  theme text,
  reduced_motion boolean not null default false,
  updated_at timestamptz not null default now()
);
comment on table public.user_preferences is
  'Preferensi non-sensitif: bahasa, avatar, tema, aksesibilitas (PRD bagian 9 & 11). Lihat src/lib/i18n/storyLanguage.ts untuk logika story_language_preference.';

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent_type text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
comment on table public.consents is
  'Catatan persetujuan/assent (PRD bagian 3 & 23) — mis. assent siswa saat onboarding, persetujuan orang tua/wali kalau diwajibkan institusi. Append-only: perubahan persetujuan dicatat sebagai baris baru, bukan update baris lama, supaya riwayatnya utuh untuk audit.';
create index if not exists consents_user_id_idx on public.consents (user_id);

-- =========================================================================
-- 2. KONTEN INTI
-- =========================================================================

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  origin_country text not null check (origin_country in ('Indonesia', 'Malaysia')),
  original_language text not null check (original_language in ('id-ID', 'en', 'ms-MY')),
  age_min integer not null default 12,
  age_max integer not null default 14,
  emotional_intensity text not null check (emotional_intensity in ('low', 'medium', 'high')),
  facilitator_requirement text not null default 'independent'
    check (facilitator_requirement in ('independent', 'recommended', 'required', 'restricted')),
  -- Kategori/label KLINIS internal (mis. "anxiety_related") HANYA di sini,
  -- TIDAK PERNAH ditampilkan ke siswa — lihat story_categories &
  -- story_category_links untuk label yang memang tampil ke siswa (PRD
  -- bagian 8: "Kategori klinis hanya ada pada metadata internal").
  internal_category text,
  publication_status text not null default 'draft' check (
    publication_status in (
      'draft', 'editing', 'linguistic_review', 'literary_review',
      'cultural_review', 'psychological_review', 'approved', 'published', 'archived'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.stories is
  'Metadata inti satu judul cerpen, lepas dari bahasa/versi (lihat story_versions/story_translations). Status alur editorial PRD bagian 20.';

create table if not exists public.story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  version_number integer not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (story_id, version_number)
);
comment on table public.story_versions is
  'Versioning naskah (PRD bagian 20 & 24) — perubahan isi/aktivitas cerpen tercatat sebagai versi baru, bukan menimpa versi lama, supaya penelitian DBR bisa membandingkan versi prototipe.';
create index if not exists story_versions_story_id_idx on public.story_versions (story_id);

create table if not exists public.story_translations (
  id uuid primary key default gen_random_uuid(),
  story_version_id uuid not null references public.story_versions (id) on delete cascade,
  locale text not null check (locale in ('id-ID', 'en', 'ms-MY')),
  title text not null,
  synopsis text not null,
  body text not null,
  reading_estimate_minutes integer,
  linguistic_reviewed_at timestamptz,
  literary_reviewed_at timestamptz,
  cultural_reviewed_at timestamptz,
  psychological_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (story_version_id, locale)
);
comment on table public.story_translations is
  'Satu baris = satu bahasa untuk satu versi cerpen (PRD bagian 9 & 20). AI TIDAK PERNAH mengisi kolom body di sini secara langsung untuk ditampilkan ke siswa tanpa keempat tinjauan (linguistic/literary/cultural/psychological) tercatat — lihat src/lib/i18n/storyLanguage.ts untuk aturan pemilihan versi di klien.';
create index if not exists story_translations_version_id_idx on public.story_translations (story_version_id);

create table if not exists public.story_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  -- Label PUBLIK yang tampil ke siswa (PRD bagian 8, contoh: "Menemukan
  -- Ketenangan", "Berani Menghadapi Tekanan") — non-klinis, per locale.
  label_id text not null,
  label_en text not null,
  label_ms text not null
);
comment on table public.story_categories is
  'Kategori PUBLIK (non-klinis) yang tampil ke siswa, terpisah total dari stories.internal_category yang klinis/internal (PRD bagian 8).';

create table if not exists public.story_category_links (
  story_id uuid not null references public.stories (id) on delete cascade,
  category_id uuid not null references public.story_categories (id) on delete cascade,
  primary key (story_id, category_id)
);

create table if not exists public.cultural_contexts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  country text not null check (country in ('Indonesia', 'Malaysia')),
  name text not null,
  description text
);
comment on table public.cultural_contexts is
  'Konsep budaya rujukan (PRD bagian 17 contoh: "Adat Perpatih", "muafakat", "tenggang rasa") yang dikaitkan ke cerpen lewat cultural_glossary.';

create table if not exists public.cultural_glossary (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  cultural_context_id uuid references public.cultural_contexts (id) on delete set null,
  term text not null,
  explanation_id text not null,
  explanation_en text not null,
  explanation_ms text not null
);
comment on table public.cultural_glossary is
  'Istilah/konteks budaya yang perlu penjelasan bagi pembaca lintas negara (PRD bagian 7B "Baca Cerpen Utuh" — fitur glosarium budaya).';
create index if not exists cultural_glossary_story_id_idx on public.cultural_glossary (story_id);

create table if not exists public.content_warnings (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  warning_text_id text not null,
  warning_text_en text not null,
  warning_text_ms text not null
);
comment on table public.content_warnings is
  'Peringatan isi yang tampil di detail cerpen sebelum dibaca (PRD bagian 7A "Sadar" & bagian 12 "Detail cerita").';
create index if not exists content_warnings_story_id_idx on public.content_warnings (story_id);

-- =========================================================================
-- 3. FUNGSI BANTU PERAN (dipakai kebijakan RLS di bawah)
-- =========================================================================

create or replace function public.has_role(p_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = p_role
  );
$$;
comment on function public.has_role(text) is
  'True kalau pengguna yang sedang login punya peran p_role. security definer supaya bisa dipanggil dari kebijakan RLS tabel lain tanpa terjebak RLS user_roles itu sendiri (pola yang sama dengan is_admin() di proyek sebelumnya).';

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.has_role('admin');
$$;

create or replace function public.is_facilitator_of_class(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.classes
    where id = p_class_id and facilitator_id = auth.uid()
  );
$$;

create or replace function public.is_member_of_class(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.class_members
    where class_id = p_class_id and student_id = auth.uid()
  );
$$;

-- =========================================================================
-- 4. TRIGGER: PROFIL + PERAN "SISWA" OTOMATIS SAAT AKUN BARU DIBUAT
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'siswa')
  on conflict (user_id, role) do nothing;

  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
comment on function public.handle_new_user() is
  'Dipicu SETIAP akun auth.users baru dibuat — memberi peran default "siswa" (satu-satunya peran yang boleh didapat otomatis; semua peran lain PRD bagian 4 wajib lewat proses manual admin, lihat README). Konsisten dengan prinsip PRD bagian 18 "admin memakai akses server".';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 5. ROW LEVEL SECURITY — deny by default di setiap tabel
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.consents enable row level security;
alter table public.stories enable row level security;
alter table public.story_versions enable row level security;
alter table public.story_translations enable row level security;
alter table public.story_categories enable row level security;
alter table public.story_category_links enable row level security;
alter table public.cultural_contexts enable row level security;
alter table public.cultural_glossary enable row level security;
alter table public.content_warnings enable row level security;

-- --- profiles: lihat/ubah profil sendiri; admin lihat semua (dukungan/moderasi).
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- SENGAJA tidak ada kebijakan insert/delete untuk klien — baris profiles
-- hanya dibuat lewat handle_new_user() (security definer) dan dihapus lewat
-- cascade saat akun auth.users dihapus (proses admin/service role).

-- --- schools: baca publik terbatas (nama & negara saja lewat kolom yang
-- memang tidak sensitif), kelola hanya admin.
create policy schools_select_authenticated on public.schools
  for select to authenticated using (true);
create policy schools_manage_admin on public.schools
  for all using (public.is_admin()) with check (public.is_admin());

-- --- classes: fasilitator kelola kelasnya sendiri; anggota kelas boleh
-- lihat; admin kelola semua.
create policy classes_select_member_or_facilitator_or_admin on public.classes
  for select using (
    facilitator_id = auth.uid()
    or public.is_member_of_class(id)
    or public.is_admin()
  );
create policy classes_manage_facilitator_or_admin on public.classes
  for all using (facilitator_id = auth.uid() or public.is_admin())
  with check (facilitator_id = auth.uid() or public.is_admin());

-- --- class_members: siswa lihat keanggotaannya sendiri; fasilitator kelola
-- anggota kelas miliknya; admin kelola semua.
create policy class_members_select_self_or_facilitator_or_admin on public.class_members
  for select using (
    student_id = auth.uid()
    or public.is_facilitator_of_class(class_id)
    or public.is_admin()
  );
create policy class_members_manage_facilitator_or_admin on public.class_members
  for all using (public.is_facilitator_of_class(class_id) or public.is_admin())
  with check (public.is_facilitator_of_class(class_id) or public.is_admin());

-- --- user_roles: lihat peran sendiri (dan admin lihat semua) — TIDAK ADA
-- kebijakan insert/update/delete untuk klien sama sekali, PRD bagian 18 &
-- README: peran hanya berubah lewat SQL manual (service role) di luar
-- aplikasi. Ini pelajaran langsung dari proyek Vite sebelumnya (audit
-- prevent_role_escalation) — diterapkan lebih ketat lagi di sini karena
-- kolomnya sekarang tabel terpisah (bisa multi-role), bukan satu kolom.
create policy user_roles_select_self_or_admin on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());

-- --- user_preferences: kelola milik sendiri saja.
create policy user_preferences_select_self_or_admin on public.user_preferences
  for select using (user_id = auth.uid() or public.is_admin());
create policy user_preferences_upsert_self on public.user_preferences
  for insert with check (user_id = auth.uid());
create policy user_preferences_update_self on public.user_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --- consents: append-only milik sendiri; admin baca untuk kepatuhan.
create policy consents_select_self_or_admin on public.consents
  for select using (user_id = auth.uid() or public.is_admin());
create policy consents_insert_self on public.consents
  for insert with check (user_id = auth.uid());
-- SENGAJA tidak ada kebijakan update/delete — riwayat persetujuan bersifat
-- append-only (lihat komentar tabel di atas), supaya tidak bisa "diam-diam
-- diubah" setelah tercatat.

-- --- konten: publik hanya boleh baca cerita yang publication_status =
-- 'published'; peran editor_konten/ahli/admin bisa baca & kelola SEMUA
-- status (termasuk draft, dalam tinjauan) untuk keperluan alur editorial.
create policy stories_select_published_or_editor on public.stories
  for select using (
    publication_status = 'published'
    or public.has_role('editor_konten')
    or public.has_role('ahli')
    or public.is_admin()
  );
create policy stories_manage_editor_or_admin on public.stories
  for all using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());

create policy story_versions_select_via_story on public.story_versions
  for select using (
    exists (
      select 1 from public.stories s
      where s.id = story_id
        and (
          s.publication_status = 'published'
          or public.has_role('editor_konten')
          or public.has_role('ahli')
          or public.is_admin()
        )
    )
  );
create policy story_versions_manage_editor_or_admin on public.story_versions
  for all using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());

create policy story_translations_select_via_story on public.story_translations
  for select using (
    exists (
      select 1 from public.story_versions v
      join public.stories s on s.id = v.story_id
      where v.id = story_version_id
        and (
          s.publication_status = 'published'
          or public.has_role('editor_konten')
          or public.has_role('ahli')
          or public.is_admin()
        )
    )
  );
create policy story_translations_manage_editor_or_admin on public.story_translations
  for all using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());

-- --- kategori/glosarium/peringatan: baca publik (dipakai memilih & membaca
-- cerita di area publik/siswa), kelola oleh editor_konten/admin.
create policy story_categories_select_all on public.story_categories
  for select using (true);
create policy story_categories_manage_editor_or_admin on public.story_categories
  for all using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());

create policy story_category_links_select_all on public.story_category_links
  for select using (true);
create policy story_category_links_manage_editor_or_admin on public.story_category_links
  for all using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());

create policy cultural_contexts_select_all on public.cultural_contexts
  for select using (true);
create policy cultural_contexts_manage_editor_or_admin on public.cultural_contexts
  for all using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());

create policy cultural_glossary_select_all on public.cultural_glossary
  for select using (true);
create policy cultural_glossary_manage_editor_or_admin on public.cultural_glossary
  for all using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());

create policy content_warnings_select_all on public.content_warnings
  for select using (true);
create policy content_warnings_manage_editor_or_admin on public.content_warnings
  for all using (public.has_role('editor_konten') or public.is_admin())
  with check (public.has_role('editor_konten') or public.is_admin());
