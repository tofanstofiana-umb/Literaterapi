import {
  STORIES,
  STORY_CATEGORY_LABELS,
  type PreparedStory,
  type StoryIllustration,
  type StoryCategorySlug,
  type StoryOriginCountry,
} from "./stories.generated";

export { STORIES, STORY_CATEGORY_LABELS };
export type { PreparedStory, StoryCategorySlug, StoryIllustration, StoryOriginCountry };

export function getStoryBySlug(slug: string): PreparedStory | undefined {
  return STORIES.find((story) => story.slug === slug);
}

export function getStoriesByCountry(country: StoryOriginCountry): PreparedStory[] {
  return STORIES.filter((story) => story.originCountry === country);
}

export function getStoriesByCategory(category: StoryCategorySlug): PreparedStory[] {
  return STORIES.filter((story) => story.publicCategorySlugs.includes(category));
}

export function getCategoryLabel(slug: StoryCategorySlug): string {
  return STORY_CATEGORY_LABELS[slug];
}

export function getStoryCountries(): StoryOriginCountry[] {
  return ["Indonesia", "Malaysia"];
}

export function getAllCategorySlugs(): StoryCategorySlug[] {
  return Object.keys(STORY_CATEGORY_LABELS) as StoryCategorySlug[];
}
