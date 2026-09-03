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

function getMetadataDisplayName(user) {
  const value = user.user_metadata?.display_name;
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";
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

const { data: roleRows, error: roleReadError } = await admin
  .from("user_roles")
  .select("user_id,role")
  .in("user_id", userIds);

if (roleReadError) throw roleReadError;

const rolesByUserId = new Map();
for (const row of roleRows ?? []) {
  const roles = rolesByUserId.get(row.user_id) ?? new Set();
  roles.add(row.role);
  rolesByUserId.set(row.user_id, roles);
}

let repairedProfiles = 0;
let repairedRoles = 0;
let repairedPreferences = 0;
let confirmedStudents = 0;

for (const user of users) {
  const roles = rolesByUserId.get(user.id) ?? new Set();
  const isStudent = roles.has("siswa") || roles.size === 0;
  if (!isStudent) continue;

  const displayName = getMetadataDisplayName(user);
  const profilePayload = displayName ? { id: user.id, display_name: displayName } : { id: user.id };
  const { error: profileError } = await admin.from("profiles").upsert(profilePayload, { onConflict: "id" });
  if (profileError) throw profileError;
  repairedProfiles += 1;

  if (!roles.has("siswa")) {
    const { error: roleError } = await admin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "siswa" }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;
    repairedRoles += 1;
  }

  const { error: preferenceError } = await admin
    .from("user_preferences")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });
  if (preferenceError) throw preferenceError;
  repairedPreferences += 1;

  const confirmedAt = user.confirmed_at ?? user.email_confirmed_at;
  if (!confirmedAt) {
    const { error: confirmError } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (confirmError) throw confirmError;
    confirmedStudents += 1;
  }
}

console.log(
  JSON.stringify(
    {
      scannedAuthUsers: users.length,
      repairedProfiles,
      repairedRoles,
      repairedPreferences,
      confirmedStudents,
    },
    null,
    2,
  ),
);
