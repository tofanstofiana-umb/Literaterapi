import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { requireRole } from "@/lib/permissions/requireRole";
import {
  getAllCategorySlugs,
  getStoryCountries,
  STORIES,
  type StoryCategorySlug,
  type StoryOriginCountry,
} from "@/content/stories";
import StoryCard from "@/components/stories/StoryCard";

function isCountry(value: string | undefined): value is StoryOriginCountry {
  return value === "Indonesia" || value === "Malaysia";
}

function isCategory(value: string | undefined): value is StoryCategorySlug {
  return getAllCategorySlugs().includes(value as StoryCategorySlug);
}

export default async function PustakaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ negara?: string; kategori?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  await requireRole(["siswa", "fasilitator", "konselor", "editor_konten", "moderator", "ahli", "peneliti"]);

  const filters = searchParams ? await searchParams : {};
  const selectedCountry = isCountry(filters.negara) ? filters.negara : undefined;
  const selectedCategory = isCategory(filters.kategori) ? filters.kategori : undefined;
  const tCategories = await getTranslations({ locale, namespace: "categories" });
  const tLibrary = await getTranslations({ locale, namespace: "libraryPage" });

  const stories = STORIES.filter((story) => {
    if (selectedCountry && story.originCountry !== selectedCountry) return false;
    if (selectedCategory && !story.publicCategorySlugs.includes(selectedCategory)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
          {tLibrary("eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-sakti-forestDark sm:text-4xl">
          {tLibrary("title")}
        </h1>
        <p className="mt-4 text-base leading-7 text-sakti-forestDark/75">
          {tLibrary("body")}
        </p>
      </div>

      <section className="mt-8 space-y-5" aria-label={tLibrary("filterLabel")}>
        <div>
          <p className="mb-3 text-sm font-semibold text-sakti-forestDark">{tLibrary("countryLabel")}</p>
          <div className="mobile-scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <Link
              href={selectedCategory ? `/pustaka?kategori=${selectedCategory}` : "/pustaka"}
              className={`tap-target inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold ${
                !selectedCountry
                  ? "bg-sakti-forest text-white"
                  : "border border-sakti-mist bg-white text-sakti-forestDark"
              }`}
            >
              {tLibrary("all")}
            </Link>
            {getStoryCountries().map((country) => {
              const query = selectedCategory
                ? `/pustaka?negara=${country}&kategori=${selectedCategory}`
                : `/pustaka?negara=${country}`;
              return (
                <Link
                  key={country}
                  href={query}
                  className={`tap-target inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold ${
                    selectedCountry === country
                      ? "bg-sakti-forest text-white"
                      : "border border-sakti-mist bg-white text-sakti-forestDark"
                  }`}
                >
                  {country}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-sakti-forestDark">{tLibrary("categoryLabel")}</p>
          <div className="mobile-scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <Link
              href={selectedCountry ? `/pustaka?negara=${selectedCountry}` : "/pustaka"}
              className={`tap-target inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold ${
                !selectedCategory
                  ? "bg-sakti-forest text-white"
                  : "border border-sakti-mist bg-white text-sakti-forestDark"
              }`}
            >
              {tLibrary("allCategories")}
            </Link>
            {getAllCategorySlugs().map((category) => {
              const query = selectedCountry
                ? `/pustaka?negara=${selectedCountry}&kategori=${category}`
                : `/pustaka?kategori=${category}`;
              return (
                <Link
                  key={category}
                  href={query}
                  className={`tap-target inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold ${
                    selectedCategory === category
                      ? "bg-sakti-forest text-white"
                      : "border border-sakti-mist bg-white text-sakti-forestDark"
                  }`}
                >
                  {tCategories(category)}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-2 border-y border-sakti-mist/70 py-4 text-sm text-sakti-forestDark/70 sm:flex-row sm:items-center sm:justify-between">
        <p>{tLibrary("availableCount", { count: stories.length })}</p>
        {(selectedCountry || selectedCategory) && (
          <Link href="/pustaka" className="font-semibold text-sakti-forest underline">
            {tLibrary("reset")}
          </Link>
        )}
      </div>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <StoryCard key={story.slug} story={story} />
        ))}
      </section>
    </div>
  );
}
