import { createServerClient } from "@supabase/ssr/dist/module/createServerClient";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Klien Supabase untuk dipakai di Server Component / Server Action / Route
 * Handler. Membaca & (kalau mungkin) menulis cookie sesi lewat next/headers
 * — Server Component murni (render, bukan Server Action) tidak bisa
 * menulis cookie, jadi `setAll` di bawah sengaja dibungkus try/catch: gagal
 * dengan aman di situ, karena middleware.ts (lihat berkas itu) sudah
 * menangani refresh sesi lintas request.
 *
 * Mengembalikan `null` kalau Supabase belum dikonfigurasi (lihat env.ts).
 */
export async function createClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Dipanggil dari Server Component murni (bukan Server Action/Route
          // Handler) — tidak bisa menulis cookie di sini, dan itu memang
          // tidak apa-apa selama middleware.ts menjaga sesi tetap segar.
        }
      },
    },
  });
}
