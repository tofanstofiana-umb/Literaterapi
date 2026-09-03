import type { AppLocale } from "@/i18n/routing";

// PRD bagian 9 "Sistem Multibahasa" - aturan utama:
//   interface_language = id-ID -> story_language = id-ID
//   interface_language = ms-MY -> story_language = ms-MY
// Pengguna tetap bisa memilih manual: "Ikuti bahasa aplikasi" (default),
// "bahasa asli", atau salah satu bahasa aplikasi secara eksplisit.
// lihat StoryLanguagePreference di bawah.
//
// Catatan implementasi saat ini: bila versi terjemahan tersimpan belum ada,
// komponen pembaca dapat memakai terjemahan otomatis on-demand sebagai fallback
// operasional. Fungsi di berkas ini tetap hanya menyelesaikan pilihan bahasa
// dan fallback bahasa asli.

export type StoryLanguagePreference = "follow_interface" | "original" | AppLocale;

/**
 * Bahasa cerita "default" untuk suatu locale antarmuka, sebelum
 * mempertimbangkan preferensi eksplisit pengguna atau ketersediaan versi.
 */
export function defaultStoryLanguageFor(interfaceLocale: AppLocale): AppLocale {
  return interfaceLocale;
}

export interface StoryVersionLookup {
  /** Bahasa yang tersedia untuk cerpen ini, mis. dari tabel story_translations. */
  availableLanguages: AppLocale[];
  /** Bahasa asli naskah (originalLanguage pada metadata cerita, PRD bagian 17). */
  originalLanguage: AppLocale;
}

export interface StoryLanguageResolution {
  /** Bahasa versi yang sebenarnya ditampilkan. */
  resolvedLanguage: AppLocale;
  /** True kalau bahasa yang diminta tidak tersedia dan sistem jatuh ke bahasa asli. */
  isFallback: boolean;
  /** True kalau versi yang tampil BUKAN bahasa asli — UI sebaiknya menawarkan glosarium/lihat versi asli. */
  glossaryRecommended: boolean;
}

/**
 * Alur fallback PRD bagian 9:
 *   Cari versi sesuai bahasa antarmuka
 *   -> jika tidak ada, gunakan bahasa asli
 *   -> tampilkan pemberitahuan
 *   -> aktifkan glosarium
 */
export function resolveStoryLanguage(
  preference: StoryLanguagePreference,
  interfaceLocale: AppLocale,
  version: StoryVersionLookup,
): StoryLanguageResolution {
  const requested: AppLocale =
    preference === "follow_interface"
      ? defaultStoryLanguageFor(interfaceLocale)
      : preference === "original"
        ? version.originalLanguage
        : preference;

  if (version.availableLanguages.includes(requested)) {
    return {
      resolvedLanguage: requested,
      isFallback: false,
      glossaryRecommended: requested !== version.originalLanguage,
    };
  }

  // Fallback wajib: bahasa asli SELALU dianggap "tersedia" secara definisi
  // (itulah naskah sumbernya), jadi ini tidak pernah gagal total.
  return {
    resolvedLanguage: version.originalLanguage,
    isFallback: true,
    glossaryRecommended: true,
  };
}
