import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/permissions/requireRole";
import AreaShell from "@/components/layout/AreaShell";

// Area Fasilitator (PRD bagian 5/18): dashboard kelas, progres siswa, dan
// pendampingan psikologis. "fasilitator" dan "konselor" digabung dalam satu
// area untuk fondasi teknis ini karena keduanya sama-sama mendampingi siswa
// secara langsung — pemisahan halaman per peran (kalau memang diperlukan)
// adalah pekerjaan Tahap 11 (dashboard) pada skill lanjutan, bukan bagian
// fondasi ini.
export default async function FacilitatorLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("areaLabels");
  const user = await requireRole(["fasilitator", "konselor"]);
  const homeHref = user.roles.includes("fasilitator") ? "/fasilitator" : "/konselor";

  return <AreaShell areaLabel={t("facilitator")} homeHref={homeHref}>{children}</AreaShell>;
}
