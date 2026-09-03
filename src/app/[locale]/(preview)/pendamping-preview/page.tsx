import { redirect } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";

export default async function PendampingPreviewPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/fasilitator`);
}
