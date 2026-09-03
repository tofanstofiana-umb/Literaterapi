import { setRequestLocale } from "next-intl/server";
import ExpertDashboard from "@/components/roles/ExpertDashboard";
import type { AppLocale } from "@/i18n/routing";
import { requireRole } from "@/lib/permissions/requireRole";

export default async function ExpertPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  await requireRole(["ahli"]);

  return <ExpertDashboard />;
}
