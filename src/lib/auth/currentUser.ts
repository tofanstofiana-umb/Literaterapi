import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, UserRoles } from "@/types/roles";

export interface CurrentUser {
  id: string;
  roles: UserRoles;
}

/**
 * Ambil pengguna yang sedang login (kalau ada) beserta SELURUH perannya
 * (PRD bagian 4/18: satu akun bisa multi-peran). Dipakai di Server
 * Component layout setiap area beratap (siswa/fasilitator/admin/penelitian)
 * untuk memutuskan izin akses — lihat requireRole() di berkas yang sama.
 *
 * Mengembalikan `null` kalau belum login ATAU Supabase belum dikonfigurasi
 * (lihat lib/supabase/env.ts) — pemanggil wajib menangani kasus ini secara
 * eksplisit, bukan mengasumsikan pengguna selalu ada.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (roleRows ?? []).map((row: { role: string }) => row.role as AppRole);
  return { id: user.id, roles };
}
