import "server-only";
import { STORIES, getStoryBySlug } from "@/content/stories";
import { createClient } from "@/lib/supabase/server";

export interface ContentReviewNote {
  id: string;
  storySlug: string;
  storyTitle: string;
  authorRole: string;
  noteType: string;
  body: string;
  status: "open" | "in_review" | "resolved";
  createdAt: string;
}

export type StoryRevisionStatus = "aman" | "perlu_revisi_gambar" | "perlu_tinjauan_ahli" | "selesai";

export interface StoryReviewStatus {
  storySlug: string;
  status: StoryRevisionStatus;
  note: string | null;
  updatedAt: string;
}

export interface ContentSafetyReport {
  id: string;
  storySlug: string;
  storyTitle: string;
  reporterRole: string;
  location: string;
  body: string;
  status: "open" | "in_review" | "resolved";
  createdAt: string;
}

export interface ExpertStoryRubric {
  storySlug: string;
  reviewerId: string;
  cultureOk: boolean;
  nonClinicalOk: boolean;
  ageOk: boolean;
  publicCategoryOk: boolean;
  saktiAffirmationOk: boolean;
  recommendation: "layak" | "perlu_revisi" | "tidak_cocok";
  note: string | null;
  updatedAt: string;
}

interface NoteRow {
  id: string;
  story_slug: string;
  author_role: string;
  note_type: string;
  body: string;
  status: "open" | "in_review" | "resolved";
  created_at: string;
}

interface StoryReviewStatusRow {
  story_slug: string;
  status: StoryRevisionStatus;
  note: string | null;
  updated_at: string;
}

interface ContentSafetyReportRow {
  id: string;
  story_slug: string;
  reporter_role: string;
  location: string;
  body: string;
  status: "open" | "in_review" | "resolved";
  created_at: string;
}

interface ExpertStoryRubricRow {
  story_slug: string;
  reviewer_id: string;
  culture_ok: boolean;
  non_clinical_ok: boolean;
  age_ok: boolean;
  public_category_ok: boolean;
  sakti_affirmation_ok: boolean;
  recommendation: "layak" | "perlu_revisi" | "tidak_cocok";
  note: string | null;
  updated_at: string;
}

export async function getContentReviewNotes(): Promise<ContentReviewNote[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("content_review_notes")
    .select("id,story_slug,author_role,note_type,body,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as NoteRow[]).map((row) => ({
    id: row.id,
    storySlug: row.story_slug,
    storyTitle: getStoryBySlug(row.story_slug)?.title ?? row.story_slug,
    authorRole: row.author_role,
    noteType: row.note_type,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getStoryReviewStatuses(): Promise<Map<string, StoryReviewStatus>> {
  const supabase = await createClient();
  if (!supabase) return new Map();

  const { data } = await supabase
    .from("story_review_statuses")
    .select("story_slug,status,note,updated_at");

  return new Map(
    ((data ?? []) as StoryReviewStatusRow[]).map((row) => [
      row.story_slug,
      {
        storySlug: row.story_slug,
        status: row.status,
        note: row.note,
        updatedAt: row.updated_at,
      },
    ]),
  );
}

export async function getContentSafetyReports(): Promise<ContentSafetyReport[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("content_safety_reports")
    .select("id,story_slug,reporter_role,location,body,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as ContentSafetyReportRow[]).map((row) => ({
    id: row.id,
    storySlug: row.story_slug,
    storyTitle: getStoryBySlug(row.story_slug)?.title ?? row.story_slug,
    reporterRole: row.reporter_role,
    location: row.location,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getExpertStoryRubrics(): Promise<Map<string, ExpertStoryRubric>> {
  const supabase = await createClient();
  if (!supabase) return new Map();

  const { data } = await supabase
    .from("expert_story_rubrics")
    .select(
      "story_slug,reviewer_id,culture_ok,non_clinical_ok,age_ok,public_category_ok,sakti_affirmation_ok,recommendation,note,updated_at",
    )
    .order("updated_at", { ascending: false });

  const rubrics = new Map<string, ExpertStoryRubric>();
  ((data ?? []) as ExpertStoryRubricRow[]).forEach((row) => {
    if (rubrics.has(row.story_slug)) return;
    rubrics.set(row.story_slug, {
      storySlug: row.story_slug,
      reviewerId: row.reviewer_id,
      cultureOk: row.culture_ok,
      nonClinicalOk: row.non_clinical_ok,
      ageOk: row.age_ok,
      publicCategoryOk: row.public_category_ok,
      saktiAffirmationOk: row.sakti_affirmation_ok,
      recommendation: row.recommendation,
      note: row.note,
      updatedAt: row.updated_at,
    });
  });

  return rubrics;
}

export function getReviewQueue() {
  return STORIES.filter(
    (story) => story.emotionalIntensity !== "low" || story.facilitatorRequirement !== "independent",
  );
}
