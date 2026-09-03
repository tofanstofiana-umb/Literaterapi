import { defineRouting } from "next-intl/routing";

// Aplikasi dipakai oleh pengguna Indonesia dan Malaysia. Locale ini mengatur
// seluruh navigasi/UI, sementara konten cerita mengikuti bahasa pilihan ini
// melalui versi tersimpan atau terjemahan otomatis.
export const LOCALES = ["id-ID", "ms-MY"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "id-ID";

export const LOCALE_LABEL: Record<AppLocale, string> = {
  "id-ID": "Bahasa Indonesia",
  "ms-MY": "Bahasa Melayu Malaysia",
};

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
});

export function isAppLocale(locale: string | undefined): locale is AppLocale {
  return LOCALES.includes(locale as AppLocale);
}
