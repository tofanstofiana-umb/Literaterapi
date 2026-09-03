import { setRequestLocale } from "next-intl/server";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { AppLocale } from "@/i18n/routing";
import { getAdminDashboardData } from "@/lib/admin/dashboardData";
import { requireRole } from "@/lib/permissions/requireRole";

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string; role?: string }>;
}) {
  const { locale } = await params;
  const filters = searchParams ? await searchParams : {};
  setRequestLocale(locale as AppLocale);
  await requireRole(["admin"]);
  const data = await getAdminDashboardData();

  return <AdminDashboard data={data} searchQuery={filters.q ?? ""} roleFilter={filters.role ?? ""} />;
}
