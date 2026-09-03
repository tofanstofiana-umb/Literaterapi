-- LITERATERAPI-SAKTI - migrasi 0004: jenis catatan tindak lanjut konselor.
--
-- UI Konselor menyimpan catatan dengan note_type = 'counselor_follow_up'.
-- Constraint lama di 0002 belum memasukkan nilai ini, sehingga aksi simpan
-- tindak lanjut konselor dapat gagal di database.

alter table public.companion_notes
  drop constraint if exists companion_notes_note_type_check;

alter table public.companion_notes
  add constraint companion_notes_note_type_check
  check (note_type in ('support', 'follow_up', 'counselor_follow_up', 'safety', 'class_note'));
