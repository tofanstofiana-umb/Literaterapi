import { setRequestLocale } from "next-intl/server";
import CounselorDashboard from "@/components/roles/CounselorDashboard";
import type { AppLocale } from "@/i18n/routing";
import { getFacilitatorDashboardData } from "@/lib/facilitator/dashboardData";
import { requireRole } from "@/lib/permissions/requireRole";

export default async function CounselorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  await requireRole(["konselor"]);
  const data = await getFacilitatorDashboardData("counselor");

  return <CounselorDashboard data={data} />;
}
