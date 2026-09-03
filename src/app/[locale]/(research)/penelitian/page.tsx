import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { requireRole } from "@/lib/permissions/requireRole";

export default async function ResearchDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const user = await requireRole(["peneliti", "ahli"]);
  const href = user.roles.includes("peneliti") ? "/peneliti" : "/ahli";

  redirect({ href, locale: locale as AppLocale });
}
