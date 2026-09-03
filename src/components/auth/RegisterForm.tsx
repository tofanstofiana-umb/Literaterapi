"use client";

import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerStudentAccount } from "@/app/[locale]/(public)/daftar/actions";

export default function RegisterForm() {
  const t = useTranslations("auth.form");
  const tRegister = useTranslations("auth.register");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const result = await registerStudentAccount({
      displayName,
      email,
      password,
      joinCode,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.message);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setSubmitting(false);
      setMessage(result.message || t("accountCreatedReady"));
      setError(t("accountCreatedLoginIssue"));
      return;
    }

    setSubmitting(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-sakti-forestDark">
          {t("displayName")}
        </label>
        <input
          id="displayName"
          required
          value={displayName}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)}
          className="mt-1 w-full rounded-sakti border border-sakti-mist px-3 py-2"
        />
      </div>

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
          minLength={8}
          value={password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-sakti border border-sakti-mist px-3 py-2"
        />
        <p className="mt-1 text-xs text-sakti-forestDark/60">{t("passwordHint")}</p>
      </div>

      <div>
        <label htmlFor="joinCode" className="block text-sm font-medium text-sakti-forestDark">
          {t("classCode")}
        </label>
        <input
          id="joinCode"
          value={joinCode}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setJoinCode(event.target.value)}
          className="mt-1 w-full rounded-sakti border border-sakti-mist px-3 py-2 uppercase"
          placeholder={t("optional")}
        />
        <p className="mt-1 text-xs text-sakti-forestDark/60">
          {t("classCodeHint")}
        </p>
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
        {submitting ? tCommon("processing") : tRegister("submit")}
      </button>
    </form>
  );
}
