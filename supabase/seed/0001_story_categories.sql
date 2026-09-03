-- Kategori publik siswa (PRD bagian 8) — non-klinis, sama untuk cerita
-- Indonesia maupun Malaysia. Jalankan setelah migrasi 0001_core_schema.sql.
insert into public.story_categories (slug, label_id, label_en, label_ms) values
  ('menemukan-ketenangan', 'Menemukan Ketenangan', 'Finding Calm', 'Menemukan Ketenangan'),
  ('menemukan-harapan', 'Menemukan Harapan', 'Finding Hope', 'Menemukan Harapan'),
  ('mengelola-emosi', 'Mengelola Emosi', 'Managing Emotions', 'Mengurus Emosi'),
  ('menemukan-cara-belajar', 'Menemukan Cara Belajar', 'Finding How I Learn', 'Menemukan Cara Belajar'),
  ('menghargai-diri', 'Menghargai Diri', 'Valuing Myself', 'Menghargai Diri'),
  ('berani-menghadapi-tekanan', 'Berani Menghadapi Tekanan', 'Facing Pressure Bravely', 'Berani Menghadapi Tekanan'),
  ('membangun-pertemanan-sehat', 'Membangun Pertemanan Sehat', 'Building Healthy Friendships', 'Membina Persahabatan Sihat'),
  ('mendengarkan-tubuh', 'Mendengarkan Tubuh', 'Listening to My Body', 'Mendengar Tubuh'),
  ('mencari-pegangan', 'Mencari Pegangan', 'Finding My Footing', 'Mencari Pegangan'),
  ('meminta-bantuan', 'Meminta Bantuan', 'Asking for Help', 'Meminta Bantuan')
on conflict (slug) do nothing;
