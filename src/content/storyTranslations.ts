import type { PreparedStory } from "./stories";
import { STORY_STATIC_TRANSLATIONS, type StaticStoryTranslation } from "./storyTranslations.generated";
import type { TranslationLocale } from "@/lib/translation/locales";

export { STORY_STATIC_TRANSLATIONS };
export type { StaticStoryTranslation };

export function getStaticStoryTranslation(
  story: PreparedStory,
  targetLocale: TranslationLocale,
): StaticStoryTranslation | undefined {
  if (story.originalLanguage === targetLocale) return undefined;
  return STORY_STATIC_TRANSLATIONS.find(
    (translation) => translation.slug === story.slug && translation.targetLocale === targetLocale,
  );
}

export function applyStaticStoryTranslation(
  story: PreparedStory,
  translation: StaticStoryTranslation,
  includeParagraphs: boolean,
): PreparedStory {
  return {
    ...story,
    title: translation.title || story.title,
    subtitle: translation.subtitle || story.subtitle,
    excerpt: translation.excerpt || story.excerpt,
    paragraphs: includeParagraphs ? [...translation.paragraphs] : story.paragraphs,
  };
}
