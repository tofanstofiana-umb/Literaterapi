import PublicFooter from "@/components/layout/PublicFooter";
import PublicHeader from "@/components/layout/PublicHeader";

export const dynamic = "force-dynamic";

// Area Publik (PRD bagian 5): Beranda, Tentang Program, Panduan
// Sekolah/Orang Tua, Privasi, Bantuan — SELALU bisa diakses tanpa login,
// termasuk oleh pengunjung baru yang belum punya kode kelas.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
