export const TRANSLATION_LOCALES = ["id-ID", "ms-MY"] as const;
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

export const TRANSLATION_LOCALE_NAME: Record<TranslationLocale, string> = {
  "id-ID": "Indonesian",
  "ms-MY": "Malay as used in Malaysia",
};

export const LIBRE_TRANSLATE_LOCALE: Record<TranslationLocale, string> = {
  "id-ID": "id",
  "ms-MY": "ms",
};

export function isTranslationLocale(value: unknown): value is TranslationLocale {
  return typeof value === "string" && TRANSLATION_LOCALES.includes(value as TranslationLocale);
}
