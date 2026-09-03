import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/permissions/requireRole";
import AreaShell from "@/components/layout/AreaShell";

// Area Penelitian (PRD bagian 5/18, modul DBR): akses data agregat/anonim
// untuk peneliti, dan tinjauan konten lintas budaya untuk ahli. "peneliti"
// dan "ahli" digabung ke sini untuk fondasi teknis ini — pemisahan lebih
// lanjut (kalau memang diperlukan) adalah pekerjaan Tahap 11, bukan bagian
// fondasi ini.
export default async function ResearchLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("areaLabels");
  const user = await requireRole(["peneliti", "ahli"]);
  const homeHref = user.roles.includes("peneliti") ? "/peneliti" : "/ahli";

  return <AreaShell areaLabel={t("research")} homeHref={homeHref}>{children}</AreaShell>;
}
