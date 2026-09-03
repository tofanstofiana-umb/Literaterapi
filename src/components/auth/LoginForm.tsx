"use client";

import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPrimaryRoleHome, type AppRole } from "@/types/roles";

export default function LoginForm() {
  const t = useTranslations("auth.form");
  const tLogin = useTranslations("auth.login");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setError(t("supabaseMissing"));
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? t("invalidLogin")
          : signInError.message,
      );
      return;
    }

    const userId = signInData.user?.id;
    let roleHome = "/dashboard";

    if (userId) {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const roles = (roleRows ?? []).map((row: { role: string }) => row.role as AppRole);
      roleHome = getPrimaryRoleHome(roles);
    }

    router.push(roleHome);
    router.refresh();
  }

  async function handleResendConfirmation() {
    const supabase = createClient();
    if (!supabase) {
      setError(t("supabaseMissing"));
      return;
    }
    if (!email) {
      setError(t("emailRequired"));
      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResending(false);

    if (resendError) {
      setError(t("confirmationResendFailed"));
      return;
    }

    setMessage(t("confirmationResent"));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-sakti-forestDark">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-sakti border border-sakti-mist px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-sakti-forestDark">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-sakti border border-sakti-mist px-3 py-2"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-sakti-forestDark/70">{message}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-sakti bg-sakti-forest px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {submitting ? tCommon("processing") : tLogin("title")}
      </button>
      <button
        type="button"
        onClick={handleResendConfirmation}
        disabled={resending}
        className="w-full rounded-sakti border border-sakti-forest px-4 py-2 font-semibold text-sakti-forest disabled:opacity-60"
      >
        {resending ? t("sending") : t("resendConfirmation")}
      </button>
    </form>
  );
}
