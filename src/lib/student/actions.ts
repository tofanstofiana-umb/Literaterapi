"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";

export interface StudentActionState {
  ok: boolean;
  message: string;
}

const AVATAR_KEYS = new Set(["laki", "netral", "perempuan"]);
const THEME_KEYS = new Set(["rimba", "mentari", "samudra", "senja"]);
const LOCALE_KEYS = new Set(["id-ID", "ms-MY"]);

export async function saveStudentPreferences(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const t = await getTranslations("actionMessages.student");
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!supabase || !currentUser) {
    return { ok: false, message: t("sessionMissing") };
  }

  const avatarKey = String(formData.get("avatar") ?? "netral");
  const themeKey = String(formData.get("theme") ?? "mentari");
  const interfaceLanguage = String(formData.get("interface_language") ?? "id-ID");

  if (!AVATAR_KEYS.has(avatarKey) || !THEME_KEYS.has(themeKey) || !LOCALE_KEYS.has(interfaceLanguage)) {
    return { ok: false, message: t("invalidPreference") };
  }

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: currentUser.id,
      interface_language: interfaceLanguage,
      avatar_config: {
        avatar: avatarKey,
        theme: themeKey,
      },
      theme: themeKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { ok: false, message: t("preferenceSaveFailed") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/id-ID/dashboard");
  revalidatePath("/ms-MY/dashboard");
  return { ok: true, message: t("preferenceSaved") };
}

export async function joinFacilitatorClass(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const t = await getTranslations("actionMessages.student");
  const currentUser = await getCurrentUser();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const joinCode = String(formData.get("join_code") ?? "").trim();

  if (!currentUser) {
    return { ok: false, message: t("sessionMissing") };
  }

  if (!joinCode) {
    return { ok: false, message: t("joinCodeRequired") };
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, message: t("serverConfigMissing") };
  }

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: classRow, error: classError } = await admin
    .from("classes")
    .select("id,name")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (classError) {
    return { ok: false, message: t("classJoinFailed") };
  }

  if (!classRow) {
    return { ok: false, message: t("classCodeNotFound") };
  }

  const { error: memberError } = await admin.from("class_members").upsert(
    {
      class_id: classRow.id,
      student_id: currentUser.id,
    },
    { onConflict: "class_id,student_id" },
  );

  if (memberError) {
    return { ok: false, message: t("classJoinFailed") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/id-ID/dashboard");
  revalidatePath("/ms-MY/dashboard");
  return { ok: true, message: t("classJoined", { name: classRow.name }) };
}
