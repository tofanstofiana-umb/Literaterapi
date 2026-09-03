"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABEL, LOCALES } from "@/i18n/routing";

// Pengalih bahasa aplikasi. Saat locale berubah, komponen cerita mencoba
// mengambil terjemahan otomatis untuk konten yang belum punya versi tersimpan.
export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("language");

  return (
    <label className="flex shrink-0 items-center gap-2 text-sm">
      <span className="sr-only">{t("switchLabel")}</span>
      <select
        value={locale}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          router.replace(pathname, { locale: event.target.value as (typeof LOCALES)[number] });
        }}
        aria-label={t("switchLabel")}
        className="tap-target max-w-[150px] rounded-full border-2 border-sakti-mist bg-white px-3 py-2 text-xs font-black text-sakti-forestDark shadow-sm transition hover:border-sakti-forest focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sakti-forest/20 sm:max-w-none sm:text-sm"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABEL[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
