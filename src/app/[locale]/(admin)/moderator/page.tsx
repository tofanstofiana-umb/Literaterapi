import { setRequestLocale } from "next-intl/server";
import ModeratorDashboard from "@/components/roles/ModeratorDashboard";
import type { AppLocale } from "@/i18n/routing";
import { requireRole } from "@/lib/permissions/requireRole";

export default async function ModeratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  await requireRole(["moderator"]);

  return <ModeratorDashboard />;
}
