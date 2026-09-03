import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  const env = {};
  if (!existsSync(filePath)) return env;
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    env[key] = rawValue.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
  return env;
}

function getSqlFiles(folder) {
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => path.join(folder, file));
}

function checksumSql(sql) {
  return createHash("sha256").update(sql).digest("hex");
}

function fileInfo(file) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  return {
    absolute: file,
    relative,
    kind: relative.startsWith("supabase/seed/") ? "seed" : "migration",
  };
}

const env = {
  ...process.env,
  ...loadEnvFile(path.join(root, ".env.local")),
};

const directUrl = env.DIRECT_URL || env.DATABASE_URL;
if (!directUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is required in .env.local");
}
if (directUrl.includes("[YOUR-PASSWORD]")) {
  throw new Error("Replace [YOUR-PASSWORD] in DIRECT_URL/DATABASE_URL before migrating.");
}

const files = [
  ...getSqlFiles(path.join(root, "supabase", "migrations")),
  ...getSqlFiles(path.join(root, "supabase", "seed")),
].map(fileInfo);

const client = new Client({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(`
    create table if not exists public.literaterapi_schema_migrations (
      name text primary key,
      kind text not null check (kind in ('migration', 'seed')),
      checksum text not null,
      applied_at timestamptz not null default now(),
      execution_ms integer not null default 0
    )
  `);
  await client.query("alter table public.literaterapi_schema_migrations enable row level security");
  await client.query(`
    do $$
    begin
      if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke all on table public.literaterapi_schema_migrations from anon;
      end if;
      if exists (select 1 from pg_roles where rolname = 'authenticated') then
        revoke all on table public.literaterapi_schema_migrations from authenticated;
      end if;
    end $$;
  `);

  const { rows: existingRows } = await client.query(
    "select name, checksum from public.literaterapi_schema_migrations",
  );
  const applied = new Map(existingRows.map((row) => [row.name, row.checksum]));

  const { rows: schemaRows } = await client.query(
    "select to_regclass('public.profiles') is not null as has_core_schema",
  );
  const hasCoreSchema = Boolean(schemaRows[0]?.has_core_schema);

  if (applied.size === 0 && hasCoreSchema) {
    const migrationFiles = files.filter((file) => file.kind === "migration");
    process.stdout.write(
      `Existing schema detected; baselining ${migrationFiles.length} migration file(s)... `,
    );
    for (const file of migrationFiles) {
      const sql = readFileSync(file.absolute, "utf8");
      const checksum = checksumSql(sql);
      await client.query(
        `
          insert into public.literaterapi_schema_migrations (name, kind, checksum, execution_ms)
          values ($1, $2, $3, 0)
          on conflict (name) do nothing
        `,
        [file.relative, file.kind, checksum],
      );
      applied.set(file.relative, checksum);
    }
    process.stdout.write("done\n");
  }

  for (const file of files) {
    const sql = readFileSync(file.absolute, "utf8");
    const checksum = checksumSql(sql);
    const appliedChecksum = applied.get(file.relative);

    if (appliedChecksum) {
      if (appliedChecksum !== checksum) {
        throw new Error(
          `Checksum mismatch for already applied SQL file: ${file.relative}. ` +
            "Create a new migration instead of editing an applied one.",
        );
      }
      process.stdout.write(`Skipping ${file.relative}... already applied\n`);
      continue;
    }

    process.stdout.write(`Applying ${file.relative}... `);
    const startedAt = Date.now();
    await client.query("begin");
    try {
      await client.query("select pg_advisory_xact_lock(hashtext('literaterapi_sakti_migrations'))");
      await client.query(sql);
      const executionMs = Date.now() - startedAt;
      await client.query(
        `
          insert into public.literaterapi_schema_migrations
            (name, kind, checksum, execution_ms)
          values ($1, $2, $3, $4)
        `,
        [file.relative, file.kind, checksum, executionMs],
      );
      await client.query("commit");
      applied.set(file.relative, checksum);
      process.stdout.write(`done (${executionMs}ms)\n`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
