"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PreparedStory } from "@/content/stories";
import { createStorySafetyReport } from "@/app/[locale]/(admin)/role-actions";
import BreathingWarmup from "@/components/breathing/BreathingWarmup";
import CategoryChips from "@/components/stories/CategoryChips";

const UPPERCASE_DETAIL_TITLES = new Set([
  "pasar-malam-di-dalam-kepalaku",
  "langit-yang-belajar-hujan",
]);

const PREVIEW_ILLUSTRATION_OVERRIDES: Record<string, number[]> = {
  "tubuhku-bukan-musuhku": [3, 6, 9],
};

export default function StoryDetailView({ story }: { story: PreparedStory }) {
  const locale = useLocale();
  const t = useTranslations("storyDetail");
  const previewIndexOverride = PREVIEW_ILLUSTRATION_OVERRIDES[story.slug];
  const previewIllustrations = previewIndexOverride
    ? previewIndexOverride
        .map((index) => story.illustrations[index])
        .filter((image): image is (typeof story.illustrations)[number] => Boolean(image))
    : story.illustrations.slice(0, 3);
  const displayTitle = UPPERCASE_DETAIL_TITLES.has(story.slug)
    ? story.title.toLocaleUpperCase("id-ID")
    : story.title;

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <Link href="/pustaka" className="text-sm font-semibold text-sakti-forest underline">
        {t("backToLibrary")}
      </Link>

      <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-sakti border border-sakti-mist bg-sakti-paper shadow-sm sm:aspect-square">
          {story.coverUrl && (
            <Image
              src={story.coverUrl}
              alt={t("coverAlt", { title: story.title })}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {story.originCountry} - {t("readingMinutes", { count: story.readingEstimateMinutes })}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-sakti-forestDark sm:text-4xl">
            {displayTitle}
          </h1>
          {story.subtitle && (
            <p className="mt-4 text-lg leading-8 text-sakti-forestDark/75">
              {story.subtitle}
            </p>
          )}

          <div className="mt-5">
            <CategoryChips categories={story.publicCategorySlugs} />
          </div>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-sakti bg-sakti-mist/35 p-4">
              <dt className="font-semibold text-sakti-forestDark">{t("storyLanguage")}</dt>
              <dd className="mt-1 text-sakti-forestDark/70">
                {story.originalLanguage === "id-ID" ? t("indonesian") : t("malay")}
              </dd>
            </div>
            <div className="rounded-sakti bg-sakti-mist/35 p-4">
              <dt className="font-semibold text-sakti-forestDark">{t("storyLength")}</dt>
              <dd className="mt-1 text-sakti-forestDark/70">
                {t("wordCount", { count: story.cleanWordCount.toLocaleString(locale) })}
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-sakti border border-sakti-gold/40 bg-sakti-gold/10 p-4 text-sm leading-6 text-sakti-forestDark/80">
            {t("safetyNote")}
          </div>

          <form action={createStorySafetyReport} className="mt-4 rounded-sakti border border-sakti-mist bg-white p-4 shadow-sm">
            <input type="hidden" name="story_slug" value={story.slug} />
            <input type="hidden" name="location" value="story_detail" />
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("reportLabel")}
              <textarea
                name="body"
                required
                minLength={8}
                rows={3}
                placeholder={t("reportPlaceholder")}
                className="mt-2 w-full rounded-sakti border border-sakti-mist px-3 py-2 text-sm leading-6 outline-none focus:border-sakti-forest"
              />
            </label>
            <button type="submit" className="mt-3 rounded-full border border-sakti-forest px-4 py-2 text-sm font-semibold text-sakti-forest">
              {t("sendReport")}
            </button>
          </form>

          <BreathingWarmup readHref={`/cerita/${story.slug}/baca`} storyTitle={story.title} />

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/pustaka"
              className="tap-target inline-flex w-full items-center justify-center rounded-full border border-sakti-forest px-6 py-3 font-semibold text-sakti-forest sm:w-auto"
            >
              {t("chooseAnother")}
            </Link>
          </div>
        </div>
      </section>

      {previewIllustrations.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
            {t("previewTitle")}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {previewIllustrations.map((image) => (
              <div
                key={image.src}
                className="relative aspect-[4/3] overflow-hidden rounded-sakti border border-sakti-mist"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
