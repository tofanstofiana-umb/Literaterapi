import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LOCALES, type AppLocale } from "@/i18n/routing";
import { getStoryBySlug, STORIES } from "@/content/stories";
import StoryReader from "@/components/reader/StoryReader";
import { requireRole } from "@/lib/permissions/requireRole";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return STORIES.flatMap((story) => LOCALES.map((locale) => ({ locale, slug: story.slug })));
}

export default async function StoryReadPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as AppLocale);
  await requireRole(["siswa"]);

  const story = getStoryBySlug(slug);
  if (!story) notFound();

  return <StoryReader story={story} />;
}
