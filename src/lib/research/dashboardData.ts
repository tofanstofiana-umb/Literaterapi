import "server-only";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import {
  STORIES,
  STORY_CATEGORY_LABELS,
  getAllCategorySlugs,
  getStoryCountries,
  type StoryCategorySlug,
  type StoryOriginCountry,
} from "@/content/stories";
import { supabaseUrl } from "@/lib/supabase/env";

export interface ResearchAggregateFilters {
  dateFrom?: string;
  dateTo?: string;
  country?: StoryOriginCountry;
  category?: StoryCategorySlug;
  classId?: string;
}

export interface RawResearchAggregateFilters {
  dateFrom?: string;
  dateTo?: string;
  country?: string;
  category?: string;
  classId?: string;
}

export interface ResearchClassOption {
  id: string;
  name: string;
}

export interface ResearchAggregateData {
  configured: boolean;
  filters: ResearchAggregateFilters;
  classOptions: ResearchClassOption[];
  csv: string;
  totals: {
    students: number;
    classes: number;
    readingProgress: number;
    reflections: number;
    stories: number;
  };
  popularStories: Array<{
    slug: string;
    title: string;
    count: number;
  }>;
  charts: {
    saktiStages: ChartDatum[];
    storyCountries: ChartDatum[];
    publicCategories: ChartDatum[];
    progressBuckets: ChartDatum[];
    popularStories: ChartDatum[];
  };
}

interface ProgressRow {
  student_id: string;
  story_slug: string;
  progress_percent: number;
  updated_at: string;
}

interface ReflectionRow {
  student_id: string;
  story_slug: string;
  stage: string;
  updated_at: string;
}

interface ClassRow {
  id: string;
  name: string;
}

export interface ChartDatum {
  key: string;
  label: string;
  value: number;
}

function isStoryCountry(value: string | undefined): value is StoryOriginCountry {
  return getStoryCountries().includes(value as StoryOriginCountry);
}

function isStoryCategory(value: string | undefined): value is StoryCategorySlug {
  return getAllCategorySlugs().includes(value as StoryCategorySlug);
}

function normalizeFilters(filters: RawResearchAggregateFilters = {}): ResearchAggregateFilters {
  const country = isStoryCountry(filters.country) ? filters.country : undefined;
  const category = isStoryCategory(filters.category) ? filters.category : undefined;

  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    country,
    category,
    classId: filters.classId,
  };
}

function getFilteredStorySlugs(filters: ResearchAggregateFilters) {
  return STORIES.filter((story) => {
    if (filters.country && story.originCountry !== filters.country) return false;
    if (filters.category && !story.publicCategorySlugs.includes(filters.category)) return false;
    return true;
  }).map((story) => story.slug);
}

function csvEscape(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function buildCsv(rows: ResearchAggregateData["popularStories"]) {
  const header = ["story_slug", "judul", "jumlah_progres_anonim"];
  return [
    header.map(csvEscape).join(","),
    ...rows.map((row) => [row.slug, row.title, row.count].map(csvEscape).join(",")),
  ].join("\n");
}

function emptyCharts(): ResearchAggregateData["charts"] {
  return {
    saktiStages: [],
    storyCountries: [],
    publicCategories: [],
    progressBuckets: [],
    popularStories: [],
  };
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function mapToChartData(map: Map<string, number>, labelForKey: (key: string) => string) {
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, label: labelForKey(key), value }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function getProgressBucket(progress: number) {
  if (progress >= 100) return "complete";
  if (progress >= 75) return "high";
  if (progress >= 40) return "middle";
  if (progress > 0) return "early";
  return "notStarted";
}

const STAGE_LABELS: Record<string, string> = {
  sadar: "S - Sadar",
  aktif: "A - Aktif",
  kritis: "K - Kritis",
  terbuka: "T - Terbuka",
  imersif: "I - Imersif",
};

const PROGRESS_BUCKET_LABELS: Record<string, string> = {
  notStarted: "0%",
  early: "1-39%",
  middle: "40-74%",
  high: "75-99%",
  complete: "100%",
};

export async function getResearchAggregateData(
  rawFilters: RawResearchAggregateFilters = {},
): Promise<ResearchAggregateData> {
  const filters = normalizeFilters(rawFilters);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      configured: false,
      filters,
      classOptions: [],
      csv: buildCsv([]),
      totals: {
        students: 0,
        classes: 0,
        readingProgress: 0,
        reflections: 0,
        stories: STORIES.length,
      },
      popularStories: [],
      charts: emptyCharts(),
    };
  }

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const [{ count: studentCount }, { count: classCount }, { data: classRows }] = await Promise.all([
    admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "siswa"),
    admin.from("classes").select("*", { count: "exact", head: true }),
    admin.from("classes").select("id,name").order("name", { ascending: true }),
  ]);

  const storySlugs = getFilteredStorySlugs(filters);
  let allowedStudentIds: Set<string> | undefined;

  if (filters.classId) {
    const { data: memberRows } = await admin
      .from("class_members")
      .select("student_id")
      .eq("class_id", filters.classId);
    allowedStudentIds = new Set(((memberRows ?? []) as Array<{ student_id: string }>).map((row) => row.student_id));
  }

  let progressQuery = admin.from("reading_progress").select("student_id,story_slug,progress_percent,updated_at");
  let reflectionQuery = admin.from("reflection_entries").select("student_id,story_slug,stage,updated_at");

  if (filters.dateFrom) {
    progressQuery = progressQuery.gte("updated_at", filters.dateFrom);
    reflectionQuery = reflectionQuery.gte("updated_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    progressQuery = progressQuery.lte("updated_at", `${filters.dateTo}T23:59:59.999Z`);
    reflectionQuery = reflectionQuery.lte("updated_at", `${filters.dateTo}T23:59:59.999Z`);
  }

  const [{ data: progressRows }, { data: reflectionRows }] = await Promise.all([
    progressQuery,
    reflectionQuery,
  ]);

  const filteredProgress = ((progressRows ?? []) as ProgressRow[]).filter((row) => {
    if (!storySlugs.includes(row.story_slug)) return false;
    if (allowedStudentIds && !allowedStudentIds.has(row.student_id)) return false;
    return true;
  });
  const filteredReflections = ((reflectionRows ?? []) as ReflectionRow[]).filter((row) => {
    if (!storySlugs.includes(row.story_slug)) return false;
    if (allowedStudentIds && !allowedStudentIds.has(row.student_id)) return false;
    return true;
  });

  const countBySlug = new Map<string, number>();
  filteredProgress.forEach((row) => {
    countBySlug.set(row.story_slug, (countBySlug.get(row.story_slug) ?? 0) + 1);
  });

  const popularStories = Array.from(countBySlug.entries())
    .map(([slug, count]) => ({
      slug,
      title: STORIES.find((story) => story.slug === slug)?.title ?? slug,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const storyBySlug = new Map(STORIES.map((story) => [story.slug, story]));
  const stageCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const progressBucketCounts = new Map<string, number>();

  ["sadar", "aktif", "kritis", "terbuka", "imersif"].forEach((stage) => stageCounts.set(stage, 0));
  ["notStarted", "early", "middle", "high", "complete"].forEach((bucket) => progressBucketCounts.set(bucket, 0));

  filteredReflections.forEach((row) => {
    increment(stageCounts, row.stage);
  });

  filteredProgress.forEach((row) => {
    const story = storyBySlug.get(row.story_slug);
    if (story) {
      increment(countryCounts, story.originCountry);
      story.publicCategorySlugs.forEach((category) => increment(categoryCounts, category));
    }
    increment(progressBucketCounts, getProgressBucket(row.progress_percent));
  });

  return {
    configured: true,
    filters,
    classOptions: ((classRows ?? []) as ClassRow[]).map((row) => ({
      id: row.id,
      name: row.name,
    })),
    csv: buildCsv(popularStories),
    totals: {
      students: studentCount ?? 0,
      classes: classCount ?? 0,
      readingProgress: filteredProgress.length,
      reflections: filteredReflections.length,
      stories: storySlugs.length,
    },
    popularStories,
    charts: {
      saktiStages: mapToChartData(stageCounts, (key) => STAGE_LABELS[key] ?? key),
      storyCountries: mapToChartData(countryCounts, (key) => key),
      publicCategories: mapToChartData(categoryCounts, (key) => STORY_CATEGORY_LABELS[key as StoryCategorySlug] ?? key),
      progressBuckets: ["notStarted", "early", "middle", "high", "complete"]
        .map((key) => ({
          key,
          label: PROGRESS_BUCKET_LABELS[key] ?? key,
          value: progressBucketCounts.get(key) ?? 0,
        }))
        .filter((row) => row.value > 0),
      popularStories: popularStories.map((story) => ({
        key: story.slug,
        label: story.title,
        value: story.count,
      })),
    },
  };
}

export const RESEARCH_CATEGORY_OPTIONS = STORY_CATEGORY_LABELS;
