import { setRequestLocale } from "next-intl/server";
import StudentDashboard from "@/components/student/StudentDashboard";
import type { AppLocale } from "@/i18n/routing";
import { getStudentDashboardData } from "@/lib/student/dashboardData";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  const dashboardData = await getStudentDashboardData();

  return <StudentDashboard data={dashboardData} />;
}
