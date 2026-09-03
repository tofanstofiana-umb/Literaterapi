import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LOCALES, type AppLocale } from "@/i18n/routing";
import { getStoryBySlug, STORIES } from "@/content/stories";
import StoryDetailView from "@/components/stories/StoryDetailView";
import { requireRole } from "@/lib/permissions/requireRole";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return STORIES.flatMap((story) => LOCALES.map((locale) => ({ locale, slug: story.slug })));
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as AppLocale);
  await requireRole(["siswa", "fasilitator", "konselor", "editor_konten", "moderator", "ahli", "peneliti"]);

  const story = getStoryBySlug(slug);
  if (!story) notFound();

  return <StoryDetailView story={story} />;
}
