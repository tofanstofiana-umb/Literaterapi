import { setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import FacilitatorDashboard from "@/components/facilitator/FacilitatorDashboard";
import { getFacilitatorDashboardData } from "@/lib/facilitator/dashboardData";

export default async function FacilitatorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const data = await getFacilitatorDashboardData();

  return <FacilitatorDashboard data={data} />;
}
