"use client";

import { createBrowserClient } from "@supabase/ssr/dist/module/createBrowserClient";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Klien Supabase untuk dipakai di Client Component ("use client"). Panggil
 * fungsi ini di dalam komponen/hook — JANGAN simpan hasilnya sebagai
 * singleton modul-level yang dibagi lintas request server, itu jalur
 * `server.ts` (Server Component) yang berbeda kebutuhannya.
 *
 * Mengembalikan `null` kalau Supabase belum dikonfigurasi (lihat env.ts) —
 * pemanggil wajib menangani kasus ini dengan pesan ramah, bukan mengasumsikan
 * klien selalu ada.
 */
export function createClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
