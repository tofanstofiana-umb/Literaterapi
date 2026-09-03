-- LITERATERAPI-SAKTI — migrasi 0010: persempit grant tabel rubrik ahli.
--
-- Tabel expert_story_rubrics dibuat setelah hardening grant umum, sehingga
-- perlu dicabut ulang dari role browser dan diberikan hanya akses minimal.

revoke all privileges on table public.expert_story_rubrics from anon;
revoke all privileges on table public.expert_story_rubrics from authenticated;

grant select on table public.expert_story_rubrics to authenticated;
grant insert, update on table public.expert_story_rubrics to authenticated;
