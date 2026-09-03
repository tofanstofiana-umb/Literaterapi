import "server-only";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/currentUser";
import { hasAnyRole, type AppRole } from "@/types/roles";

/**
 * Penjaga akses server-side untuk layout satu area beratap (mis.
 * (facilitator), (admin), (research)) — PRD bagian 5 memisahkan area
 * fasilitator/konten-ahli/penelitian-admin dari area publik/siswa.
 *
 * Kalau belum login → redirect ke /masuk. Kalau sudah login TAPI tidak
 * punya salah satu dari `allowed` → redirect ke beranda (bukan halaman
 * error generik), konsisten dengan pola proyek sebelumnya (RequireRole.tsx)
 * yang mengarahkan otomatis ke tempat yang benar alih-alih menampilkan
 * kartu "akses ditolak" pasif.
 *
 * `admin` SELALU diizinkan tambahan di atas `allowed` — admin punya akses
 * penuh untuk mengawasi aplikasi (konsisten dengan PRD bagian 18 kolom
 * Admin: "Kelola" di hampir semua baris).
 */
export async function requireRole(allowed: AppRole[]): Promise<CurrentUser> {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/masuk", locale });
    // redirect() dari next-intl (dibangun di atas next/navigation) selalu
    // melempar — baris ini tidak pernah tereksekusi sungguhan, tapi
    // `throw` eksplisit di sini membuat TypeScript bisa menyempitkan
    // `user` ke non-null di bawah TANPA bergantung pada ketepatan tanda
    // tangan tipe `never` pustaka pihak ketiga.
    throw new Error("unreachable: redirect() seharusnya sudah melempar");
  }
  if (!hasAnyRole(user.roles, [...allowed, "admin"])) {
    redirect({ href: "/", locale });
    throw new Error("unreachable: redirect() seharusnya sudah melempar");
  }
  return user;
}
