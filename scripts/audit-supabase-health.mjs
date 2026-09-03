import { existsSync, readFileSync } from "node:fs";
import { Client } from "pg";

function loadEnvFile(filePath) {
  const env = {};
  if (!existsSync(filePath)) return env;

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }

  return env;
}

const env = {
  ...process.env,
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env"),
};

const connectionString = env.DIRECT_URL || env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL atau DATABASE_URL belum tersedia.");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

function byName(a, b) {
  return String(a.table_name ?? a.name ?? "").localeCompare(String(b.table_name ?? b.name ?? ""));
}

await client.connect();

try {
  const tables = await client.query(`
    select
      c.relname as table_name,
      c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as rls_forced,
      count(pol.polname)::int as policy_count
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_policy pol on pol.polrelid = c.oid
    where n.nspname = 'public'
      and c.relkind = 'r'
    group by c.relname, c.relrowsecurity, c.relforcerowsecurity
    order by c.relname
  `);

  const browserGrants = await client.query(`
    select table_name, grantee, privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated')
    order by table_name, grantee, privilege_type
  `);

  const triggerRows = await client.query(`
    select event_object_schema, event_object_table, trigger_name, action_statement
    from information_schema.triggers
    where event_object_schema = 'auth'
      and event_object_table = 'users'
      and trigger_name = 'on_auth_user_created'
  `);

  const functionRows = await client.query(`
    select routine_schema, routine_name, security_type
    from information_schema.routines
    where routine_schema = 'public'
      and routine_name in ('handle_new_user', 'has_role', 'is_facilitator_for_student')
    order by routine_name
  `);

  const counts = await client.query(`
    select
      (select count(*)::int from auth.users) as auth_users,
      (select count(*)::int from public.profiles) as profiles,
      (select count(*)::int from public.user_preferences) as user_preferences,
      (select count(*)::int from public.user_roles) as user_role_rows,
      (select count(*)::int from public.reading_progress) as reading_progress,
      (select count(*)::int from public.reflection_entries) as reflection_entries,
      (select count(*)::int from public.class_members) as class_members,
      (select count(*)::int from public.companion_notes) as companion_notes
  `);

  const integrity = await client.query(`
    select
      (select count(*)::int
       from auth.users u
       left join public.profiles p on p.id = u.id
       where p.id is null) as auth_without_profile,
      (select count(*)::int
       from auth.users u
       left join public.user_preferences pref on pref.user_id = u.id
       where pref.user_id is null) as auth_without_preferences,
      (select count(*)::int
       from auth.users u
       left join public.user_roles r on r.user_id = u.id
       where r.user_id is null) as auth_without_any_role,
      (select count(*)::int
       from auth.users u
       where coalesce(u.confirmed_at, u.email_confirmed_at) is null) as unconfirmed_auth_users,
      (select count(*)::int
       from public.profiles p
       where p.display_name is null or trim(p.display_name) = '') as profiles_without_display_name
  `);

  const duplicateRoles = await client.query(`
    select user_id, role, count(*)::int as row_count
    from public.user_roles
    group by user_id, role
    having count(*) > 1
  `);

  const rlsDisabled = tables.rows
    .filter((row) => !row.rls_enabled)
    .map((row) => row.table_name)
    .sort();

  const noPolicies = tables.rows
    .filter((row) => row.rls_enabled && row.policy_count === 0)
    .map((row) => row.table_name)
    .sort();

  const grantsByTable = {};
  for (const row of browserGrants.rows) {
    grantsByTable[row.table_name] ??= [];
    grantsByTable[row.table_name].push(`${row.grantee}:${row.privilege_type}`);
  }

  console.log(
    JSON.stringify(
      {
        summary: {
          tables: tables.rows.length,
          rlsDisabled,
          rlsEnabledWithoutPolicies: noPolicies,
          authTriggerInstalled: triggerRows.rows.length > 0,
          requiredFunctions: functionRows.rows.map((row) => row.routine_name).sort(),
        },
        counts: counts.rows[0],
        integrity: integrity.rows[0],
        duplicateRoleRows: duplicateRoles.rows.length,
        tables: tables.rows.sort(byName),
        browserGrantsByTable: grantsByTable,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
