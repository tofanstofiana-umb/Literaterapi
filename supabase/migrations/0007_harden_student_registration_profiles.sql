create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  v_display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  insert into public.profiles (id, display_name)
  values (new.id, v_display_name)
  on conflict (id) do update
    set display_name = coalesce(nullif(trim(public.profiles.display_name), ''), excluded.display_name),
        updated_at = now();

  insert into public.user_roles (user_id, role) values (new.id, 'siswa')
  on conflict (user_id, role) do nothing;

  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

update public.profiles p
set display_name = nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    updated_at = now()
from auth.users u
where p.id = u.id
  and (p.display_name is null or trim(p.display_name) = '')
  and nullif(trim(u.raw_user_meta_data ->> 'display_name'), '') is not null;
