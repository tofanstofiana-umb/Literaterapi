"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PreparedStory } from "@/content/stories";
import CategoryChips from "./CategoryChips";

export default function StoryCard({ story }: { story: PreparedStory }) {
  const t = useTranslations("storyCard");

  return (
    <article className="overflow-hidden rounded-sakti border border-sakti-mist bg-white shadow-sm">
      <Link href={`/cerita/${story.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-sakti-paper sm:aspect-square">
          {story.coverUrl ? (
            <Image
              src={story.coverUrl}
              alt={t("coverAlt", { title: story.title })}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain transition duration-300 hover:brightness-[0.96]"
            />
          ) : null}
        </div>
      </Link>
      <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {story.originCountry} - {t("minutes", { count: story.readingEstimateMinutes })}
          </p>
          <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-sakti-forestDark sm:text-xl">
            <Link href={`/cerita/${story.slug}`}>{story.title}</Link>
          </h2>
          {story.subtitle && (
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
              {story.subtitle}
            </p>
          )}
        </div>
        <CategoryChips categories={story.publicCategorySlugs} compact />
        <p className="line-clamp-3 text-sm leading-6 text-sakti-forestDark/75">
          {story.excerpt}
        </p>
        <Link
          href={`/cerita/${story.slug}`}
          className="tap-target inline-flex w-full items-center justify-center rounded-full bg-sakti-forest px-4 py-2 text-sm font-semibold text-white sm:w-auto"
        >
          {t("viewStory")}
        </Link>
      </div>
    </article>
  );
}
