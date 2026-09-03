import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

function loadEnvFile(filePath) {
  const env = {};
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = line
      .slice(index + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");
    env[key] = value;
  }
  return env;
}

const fileArg = process.argv[2];
if (!fileArg) {
  throw new Error("Usage: node scripts/run-single-migration.mjs <sql-file>");
}

const root = process.cwd();
const env = {
  ...process.env,
  ...loadEnvFile(path.join(root, ".env.local")),
};

const directUrl = env.DIRECT_URL || env.DATABASE_URL;
if (!directUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is required in .env.local");
}

const filePath = path.resolve(root, fileArg);
const sql = readFileSync(filePath, "utf8");

const client = new Client({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log(`Applied ${path.relative(root, filePath)}`);
} finally {
  await client.end();
}
