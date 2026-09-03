import { getRequestConfig } from "next-intl/server";
import { isAppLocale, routing } from "./routing";

// Dipanggil next-intl di server untuk setiap request — memuat berkas pesan
// UI (messages/<locale>.json) sesuai locale aktif di URL. INI HANYA untuk
// teks antarmuka (tombol, label, microcopy) — bahasa CERITA (cerpen) adalah
// urusan terpisah yang mengikuti aturan PRD bagian 9 (lihat
// src/lib/i18n/storyLanguage.ts), bukan lewat mekanisme ini.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isAppLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
