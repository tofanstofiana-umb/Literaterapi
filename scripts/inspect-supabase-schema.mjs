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

await client.connect();

try {
  const { rows: columns } = await client.query(`
    select table_name, column_name, data_type, is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'profiles',
        'user_roles',
        'user_preferences',
        'class_members',
        'consents',
        'literaterapi_schema_migrations'
      )
    order by table_name, ordinal_position
  `);

  const { rows: migrations } = await client.query(`
    select name, kind, applied_at
    from public.literaterapi_schema_migrations
    order by name
  `).catch((error) => ({
    rows: [{ name: `ERROR: ${error.message}`, kind: "error", applied_at: null }],
  }));

  console.log(JSON.stringify({ columns, migrations }, null, 2));
} finally {
  await client.end();
}
