import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum tersedia.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function maskEmail(email) {
  if (!email || !email.includes("@")) return "email tidak tersedia";
  const [name, domain] = email.split("@");
  const safeName = name.length <= 2 ? `${name[0] ?? ""}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${safeName}@${domain}`;
}

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

const users = await listAllAuthUsers();
const userIds = users.map((user) => user.id);

const [profilesResult, rolesResult, preferencesResult] = await Promise.all([
  userIds.length
    ? admin.from("profiles").select("id,display_name").in("id", userIds)
    : Promise.resolve({ data: [], error: null }),
  userIds.length
    ? admin.from("user_roles").select("user_id,role").in("user_id", userIds)
    : Promise.resolve({ data: [], error: null }),
  userIds.length
    ? admin.from("user_preferences").select("user_id").in("user_id", userIds)
    : Promise.resolve({ data: [], error: null }),
]);

if (profilesResult.error) throw profilesResult.error;
if (rolesResult.error) throw rolesResult.error;
if (preferencesResult.error) throw preferencesResult.error;

const profileById = new Map((profilesResult.data ?? []).map((row) => [row.id, row]));
const preferenceIds = new Set((preferencesResult.data ?? []).map((row) => row.user_id));
const rolesByUserId = new Map();

for (const row of rolesResult.data ?? []) {
  const roles = rolesByUserId.get(row.user_id) ?? [];
  roles.push(row.role);
  rolesByUserId.set(row.user_id, roles);
}

const missing = users
  .map((user) => {
    const profile = profileById.get(user.id);
    const roles = rolesByUserId.get(user.id) ?? [];
    return {
      id: user.id,
      email: maskEmail(user.email),
      hasAuth: true,
      hasProfile: Boolean(profile),
      hasDisplayName: Boolean(profile?.display_name),
      roles,
      hasStudentRole: roles.includes("siswa"),
      hasPreferences: preferenceIds.has(user.id),
      confirmed: Boolean(user.confirmed_at ?? user.email_confirmed_at),
    };
  })
  .filter(
    (row) =>
      !row.hasProfile ||
      !row.hasDisplayName ||
      !row.hasStudentRole ||
      !row.hasPreferences ||
      !row.confirmed,
  );

console.log(
  JSON.stringify(
    {
      supabaseProject: supabaseUrl.replace(/^https:\/\/([^.]+).*/, "$1"),
      totals: {
        authUsers: users.length,
        profiles: profilesResult.data?.length ?? 0,
        userRolesRows: rolesResult.data?.length ?? 0,
        userPreferences: preferencesResult.data?.length ?? 0,
        incompleteAuthUsers: missing.length,
      },
      incompleteExamples: missing.slice(0, 20),
    },
    null,
    2,
  ),
);
