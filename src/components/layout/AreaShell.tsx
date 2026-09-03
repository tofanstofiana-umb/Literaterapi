import SignOutButton from "@/components/auth/SignOutButton";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import SaktiLogo from "@/components/layout/SaktiLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";

// Bingkai bersama untuk setiap area beratap (siswa/fasilitator/admin/
// penelitian) — dipakai oleh layout.tsx masing-masing route group setelah
// requireRole() lolos. Hanya header identitas area + tombol keluar; isi
// dashboard sungguhan (kartu progres, antrean moderasi, dst.) adalah
// pekerjaan Tahap 11 pada skill lanjutan, bukan bagian fondasi teknis ini.
export default function AreaShell({
  areaLabel,
  homeHref = "/dashboard",
  children,
}: {
  areaLabel: string;
  homeHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-sakti-paper">
      <header className="sticky top-0 z-40 border-b border-sakti-mist/70 border-t-4 border-t-sakti-gold bg-sakti-paper/96 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <SaktiLogo href={homeHref} areaLabel={areaLabel} />
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
