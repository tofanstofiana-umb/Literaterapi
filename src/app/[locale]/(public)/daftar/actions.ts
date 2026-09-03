"use server";

import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

interface RegisterStudentInput {
  displayName: string;
  email: string;
  password: string;
  joinCode?: string;
}

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeJoinCode(value: string | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function joinClassWithCode(userId: string, joinCode: string) {
  const t = await getTranslations("actionMessages.student");
  const admin = getAdminClient();
  if (!supabaseUrl || !supabaseAnonKey || !admin) {
    return { ok: false, message: t("serverConfigMissing") };
  }

  const normalizedJoinCode = normalizeJoinCode(joinCode);
  if (!normalizedJoinCode) {
    return { ok: true, message: "" };
  }

  const { data: classRow, error: classError } = await admin
    .from("classes")
    .select("id")
    .eq("join_code", normalizedJoinCode)
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
      student_id: userId,
    },
    { onConflict: "class_id,student_id" },
  );

  if (memberError) {
    return { ok: false, message: t("classJoinFailed") };
  }

  return { ok: true, message: t("classJoinedSimple") };
}

export async function registerStudentAccount(input: RegisterStudentInput) {
  const t = await getTranslations("auth.form");
  const tStudent = await getTranslations("actionMessages.student");
  const admin = getAdminClient();

  if (!supabaseUrl || !supabaseAnonKey || !admin) {
    return { ok: false, message: tStudent("serverConfigMissing") };
  }

  const displayName = normalizeDisplayName(input.displayName);
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!displayName || !isValidEmail(email) || password.length < 8) {
    return { ok: false, message: t("accountCreationFailed") };
  }

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
    },
  });

  if (createError || !data.user) {
    const isDuplicate =
      createError?.message.toLowerCase().includes("already") ||
      createError?.message.toLowerCase().includes("registered");
    return {
      ok: false,
      message: isDuplicate ? t("emailAlreadyRegistered") : t("accountCreationFailed"),
    };
  }

  const userId = data.user.id;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
    },
    { onConflict: "id" },
  );

  const { error: roleError } = await admin.from("user_roles").upsert(
    {
      user_id: userId,
      role: "siswa",
    },
    { onConflict: "user_id,role" },
  );

  const { error: preferenceError } = await admin.from("user_preferences").upsert(
    {
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (profileError || roleError || preferenceError) {
    return { ok: false, message: t("accountCreationFailed") };
  }

  const joinCode = normalizeJoinCode(input.joinCode);
  if (joinCode) {
    const joinResult = await joinClassWithCode(userId, joinCode);
    if (!joinResult.ok) {
      return {
        ok: true,
        message: t("accountCreatedWithClassIssue", { message: joinResult.message }),
      };
    }
  }

  return { ok: true, message: t("accountCreatedReady") };
}
