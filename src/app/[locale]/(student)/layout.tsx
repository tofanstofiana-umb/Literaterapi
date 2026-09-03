import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/permissions/requireRole";
import AreaShell from "@/components/layout/AreaShell";

// Area Siswa (PRD bagian 5): Pustaka, Perjalanan S-A-K-T-I, Koleksi, Profil.
// Hanya peran "siswa" (+ admin, otomatis lewat requireRole) yang diizinkan.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("areaLabels");
  await requireRole(["siswa"]);
  return <AreaShell areaLabel={t("student")} homeHref="/dashboard">{children}</AreaShell>;
}
