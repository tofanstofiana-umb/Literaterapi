import { setRequestLocale } from "next-intl/server";
import ContentEditorDashboard from "@/components/roles/ContentEditorDashboard";
import type { AppLocale } from "@/i18n/routing";
import { requireRole } from "@/lib/permissions/requireRole";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  await requireRole(["editor_konten"]);

  return <ContentEditorDashboard />;
}
