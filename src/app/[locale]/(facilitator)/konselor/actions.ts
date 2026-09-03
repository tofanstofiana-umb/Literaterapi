"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { supabaseUrl } from "@/lib/supabase/env";
import { hasAnyRole } from "@/types/roles";

export async function createCounselorFollowUp(formData: FormData) {
  const currentUser = await getCurrentUser();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!currentUser || !supabaseUrl || !serviceRoleKey) return;
  if (!hasAnyRole(currentUser.roles, ["konselor", "admin"])) return;

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const studentId = String(formData.get("student_id") ?? "");
  const classId = String(formData.get("class_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!studentId || !body) return;

  let membershipQuery = admin
    .from("class_members")
    .select("class_id,student_id")
    .eq("student_id", studentId);

  if (classId) {
    membershipQuery = membershipQuery.eq("class_id", classId);
  }

  const { data: membershipRows } = await membershipQuery.limit(1);
  const safeMembership = membershipRows?.[0];
  if (!safeMembership) return;

  await admin.from("companion_notes").insert({
    facilitator_id: currentUser.id,
    student_id: studentId,
    class_id: safeMembership.class_id,
    note_type: "counselor_follow_up",
    body,
    status: "open",
  });

  revalidatePath("/konselor");
  revalidatePath("/id-ID/konselor");
  revalidatePath("/ms-MY/konselor");
  revalidatePath("/fasilitator");
  revalidatePath("/id-ID/fasilitator");
  revalidatePath("/ms-MY/fasilitator");
}
