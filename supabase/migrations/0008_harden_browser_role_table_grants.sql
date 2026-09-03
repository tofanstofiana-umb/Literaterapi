-- LITERATERAPI-SAKTI — migrasi 0008: persempit grant tabel untuk role browser.
--
-- RLS sudah aktif di semua tabel public. Migrasi ini menambahkan lapisan
-- hardening dengan menghapus hak table-level yang tidak dibutuhkan browser
-- seperti TRUNCATE, TRIGGER, REFERENCES, dan DELETE.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all privileges on all tables in schema public from anon;
    grant usage on schema public to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all privileges on all tables in schema public from authenticated;
    grant usage on schema public to authenticated;
  end if;
end $$;

-- Konten publik yang aman dibaca tanpa login. RLS tetap memastikan cerita
-- draft/tidak terbit tidak terbuka untuk pengguna publik.
grant select on table
  public.stories,
  public.story_versions,
  public.story_translations,
  public.story_categories,
  public.story_category_links,
  public.cultural_contexts,
  public.cultural_glossary,
  public.content_warnings
to anon, authenticated;

-- Data akun dan organisasi: baca sesuai RLS; tulis dibatasi oleh policy
-- atau service role pada server action.
grant select on table
  public.profiles,
  public.schools,
  public.classes,
  public.class_members,
  public.user_roles,
  public.user_preferences,
  public.consents,
  public.reading_progress,
  public.reflection_entries,
  public.companion_notes,
  public.content_review_notes,
  public.story_review_statuses,
  public.content_safety_reports
to authenticated;

grant insert, update on table
  public.user_preferences,
  public.reading_progress,
  public.reflection_entries,
  public.companion_notes,
  public.content_review_notes,
  public.story_review_statuses,
  public.content_safety_reports
to authenticated;

grant insert on table
  public.consents
to authenticated;

grant update on table
  public.profiles
to authenticated;
