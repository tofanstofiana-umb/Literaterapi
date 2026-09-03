"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";
import { hasAnyRole } from "@/types/roles";

function makeJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `SAKTI-${suffix}`;
}

export async function createFacilitatorClass(formData: FormData) {
  const currentUser = await getCurrentUser();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!currentUser || !hasAnyRole(currentUser.roles, ["fasilitator", "konselor", "admin"])) return;
  if (!supabaseUrl || !serviceRoleKey) return;

  const className = String(formData.get("class_name") ?? "").trim();
  const schoolName = String(formData.get("school_name") ?? "").trim();
  const rawCountry = String(formData.get("country") ?? "Indonesia");
  const country = rawCountry === "Malaysia" ? "Malaysia" : "Indonesia";

  if (!className || !schoolName) return;

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: existingSchools } = await admin
    .from("schools")
    .select("id")
    .eq("name", schoolName)
    .eq("country", country)
    .limit(1);

  let schoolId = existingSchools?.[0]?.id as string | undefined;
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
      facilitator_id: currentUser.id,
      name: className,
      join_code: makeJoinCode(),
    });

    if (!error) {
      revalidatePath("/fasilitator");
      revalidatePath("/id-ID/fasilitator");
      revalidatePath("/ms-MY/fasilitator");
      return;
    }

    if (error.code !== "23505") return;
  }
}

export async function createCompanionNote(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;
  if (!hasAnyRole(currentUser.roles, ["fasilitator", "konselor", "admin"])) return;

  const studentId = String(formData.get("student_id") ?? "");
  const classId = String(formData.get("class_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!studentId || !body) return;

  let membershipQuery = supabase
    .from("class_members")
    .select("class_id,student_id")
    .eq("student_id", studentId);

  if (classId) {
    membershipQuery = membershipQuery.eq("class_id", classId);
  }

  const { data: membershipRows } = await membershipQuery.limit(1);
  const safeMembership = membershipRows?.[0];
  if (!safeMembership) return;

  await supabase.from("companion_notes").insert({
    facilitator_id: currentUser.id,
    student_id: studentId,
    class_id: safeMembership.class_id,
    note_type: "follow_up",
    body,
    status: "open",
  });

  revalidatePath("/fasilitator");
  revalidatePath("/id-ID/fasilitator");
  revalidatePath("/ms-MY/fasilitator");
  revalidatePath("/konselor");
  revalidatePath("/id-ID/konselor");
  revalidatePath("/ms-MY/konselor");
}

export async function updateCompanionNoteStatus(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;
  if (!hasAnyRole(currentUser.roles, ["fasilitator", "konselor", "admin"])) return;

  const noteId = String(formData.get("note_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!noteId || !["open", "done", "archived"].includes(status)) return;

  await supabase
    .from("companion_notes")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId);

  revalidatePath("/fasilitator");
  revalidatePath("/id-ID/fasilitator");
  revalidatePath("/ms-MY/fasilitator");
  revalidatePath("/konselor");
  revalidatePath("/id-ID/konselor");
  revalidatePath("/ms-MY/konselor");
}
