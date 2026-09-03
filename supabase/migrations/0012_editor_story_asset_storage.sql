-- LITERATERAPI-SAKTI — migrasi 0012: bucket gambar draft editor.
--
-- Bucket ini dipakai Studio Draft untuk menyimpan sampul dan ilustrasi adegan
-- yang diunggah editor konten. Bucket dibuat privat karena aset draft belum
-- tentu siap tampil publik. Publikasi cerita perlu proses terpisah setelah
-- tinjauan editor/ahli/moderator selesai.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'editor-story-assets',
  'editor-story-assets',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists editor_story_assets_select_review_roles on storage.objects;
create policy editor_story_assets_select_review_roles on storage.objects
  for select using (
    bucket_id = 'editor-story-assets'
    and (
      public.has_role('editor_konten')
      or public.has_role('moderator')
      or public.has_role('ahli')
      or public.is_admin()
    )
  );

drop policy if exists editor_story_assets_insert_editor_admin on storage.objects;
create policy editor_story_assets_insert_editor_admin on storage.objects
  for insert with check (
    bucket_id = 'editor-story-assets'
    and (public.has_role('editor_konten') or public.is_admin())
  );

drop policy if exists editor_story_assets_update_editor_admin on storage.objects;
create policy editor_story_assets_update_editor_admin on storage.objects
  for update using (
    bucket_id = 'editor-story-assets'
    and (public.has_role('editor_konten') or public.is_admin())
  )
  with check (
    bucket_id = 'editor-story-assets'
    and (public.has_role('editor_konten') or public.is_admin())
  );

drop policy if exists editor_story_assets_delete_editor_admin on storage.objects;
create policy editor_story_assets_delete_editor_admin on storage.objects
  for delete using (
    bucket_id = 'editor-story-assets'
    and (public.has_role('editor_konten') or public.is_admin())
  );
