import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/permissions/requireRole";
import AreaShell from "@/components/layout/AreaShell";

// Area Admin (PRD bagian 5/18): pengelolaan sekolah/kelas, moderasi konten,
// dan penyuntingan konten. "moderator" dan "editor_konten" digabung ke sini
// untuk fondasi teknis ini karena keduanya bekerja di sisi pengelolaan
// platform (bukan pendampingan siswa langsung); "admin" sendiri selalu
// diizinkan lewat requireRole(). Pemisahan antrean moderasi vs. editor
// konten jadi halaman terpisah adalah pekerjaan Tahap 11, bukan bagian
// fondasi ini.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("areaLabels");
  const user = await requireRole(["moderator", "editor_konten"]);
  const homeHref = user.roles.includes("admin")
    ? "/admin"
    : user.roles.includes("editor_konten")
      ? "/editor-konten"
      : "/moderator";

  return <AreaShell areaLabel={t("admin")} homeHref={homeHref}>{children}</AreaShell>;
}
