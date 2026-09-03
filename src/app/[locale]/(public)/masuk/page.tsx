import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import LoginForm from "@/components/auth/LoginForm";

// Halaman masuk minimal untuk fondasi teknis — lihat catatan di
// LoginForm.tsx. Alur pendaftaran lengkap (pilih peran, dst.) menyusul di
// fase MVP; lihat /daftar untuk catatannya.
export default async function MasukPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({ locale, namespace: "auth.login" });

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-sakti-forestDark">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-sakti-forestDark/70">
        {t("body")}
      </p>
      <LoginForm />
      <p className="mt-6 text-sm text-sakti-forestDark/70">
        {t("noAccount")}{" "}
        <Link href="/daftar" className="font-semibold text-sakti-forest underline">
          {t("registerLink")}
        </Link>
      </p>
    </div>
  );
}
