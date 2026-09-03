"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { supabaseUrl } from "@/lib/supabase/env";
import { APP_ROLES, hasRole, type AppRole } from "@/types/roles";

function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

async function requireAdminUser() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasRole(currentUser.roles, "admin")) return null;
  return currentUser;
}

function makeJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `SAKTI-${suffix}`;
}

function revalidateAdminPages() {
  revalidatePath("/admin");
  revalidatePath("/id-ID/admin");
  revalidatePath("/ms-MY/admin");
}

export async function grantUserRole(formData: FormData) {
  const currentUser = await requireAdminUser();
  const admin = getAdminClient();
  if (!currentUser || !admin) return;

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !isAppRole(role)) return;

  await admin.from("user_roles").upsert(
    {
      user_id: userId,
      role,
      granted_by: currentUser.id,
      granted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,role" },
  );

  revalidateAdminPages();
}

export async function revokeUserRole(formData: FormData) {
  const currentUser = await requireAdminUser();
  const admin = getAdminClient();
  if (!currentUser || !admin) return;

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !isAppRole(role)) return;

  if (userId === currentUser.id && role === "admin") return;

  await admin.from("user_roles").delete().eq("user_id", userId).eq("role", role);

  revalidateAdminPages();
}

export async function deleteUserAccount(formData: FormData) {
  const currentUser = await requireAdminUser();
  const admin = getAdminClient();
  if (!currentUser || !admin) return;

  const userId = String(formData.get("user_id") ?? "");
  if (!userId || userId === currentUser.id) return;

  await admin.auth.admin.deleteUser(userId);

  revalidateAdminPages();
}

export async function createAdminClass(formData: FormData) {
  const currentUser = await requireAdminUser();
  const admin = getAdminClient();
  if (!currentUser || !admin) return;

  const schoolName = String(formData.get("school_name") ?? "").trim().replace(/\s+/g, " ");
  const className = String(formData.get("class_name") ?? "").trim().replace(/\s+/g, " ");
  const facilitatorId = String(formData.get("facilitator_id") ?? "");
  const rawCountry = String(formData.get("country") ?? "Indonesia");
  const country = rawCountry === "Malaysia" ? "Malaysia" : "Indonesia";

  if (!schoolName || !className || !facilitatorId) return;

  const { data: facilitatorRoles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", facilitatorId)
    .in("role", ["fasilitator", "konselor", "admin"]);

  if (!facilitatorRoles?.length) return;

  const { data: existingSchool } = await admin
    .from("schools")
    .select("id")
    .eq("name", schoolName)
    .eq("country", country)
    .limit(1);

  let schoolId = existingSchool?.[0]?.id as string | undefined;
  if (!schoolId) {
    const { data: newSchool, error: schoolError } = await admin
      .from("schools")
      .insert({ name: schoolName, country })
      .select("id")
      .single();
    if (schoolError || !newSchool) return;
    schoolId = newSchool.id as string;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await admin.from("classes").insert({
      school_id: schoolId,
      facilitator_id: facilitatorId,
      name: className,
      join_code: makeJoinCode(),
    });

    if (!error) {
      revalidateAdminPages();
      revalidatePath("/fasilitator");
      revalidatePath("/id-ID/fasilitator");
      revalidatePath("/ms-MY/fasilitator");
      return;
    }

    if (error.code !== "23505") return;
  }
}

export async function assignStudentToClass(formData: FormData) {
  const currentUser = await requireAdminUser();
  const admin = getAdminClient();
  if (!currentUser || !admin) return;

  const classId = String(formData.get("class_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  if (!classId || !studentId) return;

  const [{ data: classRow }, { data: studentRoles }] = await Promise.all([
    admin.from("classes").select("id").eq("id", classId).maybeSingle(),
    admin.from("user_roles").select("role").eq("user_id", studentId).eq("role", "siswa").limit(1),
  ]);

  if (!classRow || !studentRoles?.length) return;

  await admin.from("class_members").upsert(
    {
      class_id: classId,
      student_id: studentId,
    },
    { onConflict: "class_id,student_id" },
  );

  revalidateAdminPages();
  revalidatePath("/fasilitator");
  revalidatePath("/id-ID/fasilitator");
  revalidatePath("/ms-MY/fasilitator");
  revalidatePath("/dashboard");
  revalidatePath("/id-ID/dashboard");
  revalidatePath("/ms-MY/dashboard");
}

export async function removeStudentFromClass(formData: FormData) {
  const currentUser = await requireAdminUser();
  const admin = getAdminClient();
  if (!currentUser || !admin) return;

  const classId = String(formData.get("class_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  if (!classId || !studentId) return;

  await admin.from("class_members").delete().eq("class_id", classId).eq("student_id", studentId);

  revalidateAdminPages();
  revalidatePath("/fasilitator");
  revalidatePath("/id-ID/fasilitator");
  revalidatePath("/ms-MY/fasilitator");
  revalidatePath("/dashboard");
  revalidatePath("/id-ID/dashboard");
  revalidatePath("/ms-MY/dashboard");
}
