import { setRequestLocale } from "next-intl/server";
import ResearcherDashboard from "@/components/roles/ResearcherDashboard";
import type { AppLocale } from "@/i18n/routing";
import { requireRole } from "@/lib/permissions/requireRole";
import { getResearchAggregateData } from "@/lib/research/dashboardData";

export default async function ResearcherPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    dateFrom?: string;
    dateTo?: string;
    country?: string;
    category?: string;
    classId?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  await requireRole(["peneliti"]);
  const filters = searchParams ? await searchParams : {};
  const data = await getResearchAggregateData(filters);

  return <ResearcherDashboard data={data} />;
}
