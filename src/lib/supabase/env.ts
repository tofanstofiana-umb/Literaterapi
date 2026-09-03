// Pola `isSupabaseConfigured` dilanjutkan dari proyek Vite sebelumnya —
// aplikasi tetap bisa dibuka (menampilkan UI dasar/pesan ramah) walau env
// var Supabase belum diisi, alih-alih melempar exception saat build/start.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
