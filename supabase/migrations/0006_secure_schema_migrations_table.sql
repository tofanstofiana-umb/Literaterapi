alter table public.literaterapi_schema_migrations enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.literaterapi_schema_migrations from anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.literaterapi_schema_migrations from authenticated;
  end if;
end $$;

comment on table public.literaterapi_schema_migrations is
  'Internal migration history table. RLS is enabled and browser-facing roles are not granted access.';
