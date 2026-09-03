import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function DaftarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({ locale, namespace: "auth.register" });

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
        {t("eyebrow")}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-sakti-forestDark">
        {t("title")}
      </h1>
      <p className="mt-3 text-sm leading-6 text-sakti-forestDark/70">
        {t("body")}
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-sakti-forestDark/70">
        {t("hasAccount")}{" "}
        <Link href="/masuk" className="font-semibold text-sakti-forest underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
