import "server-only";
import { createClient } from "@/lib/supabase/server";

export const EDITOR_STORY_DRAFT_STATUSES = [
  "draft",
  "editing",
  "linguistic_review",
  "literary_review",
  "cultural_review",
  "psychological_review",
  "approved",
  "ready_to_publish",
  "archived",
] as const;

export type EditorStoryDraftStatus = (typeof EDITOR_STORY_DRAFT_STATUSES)[number];

export interface EditorSceneAsset {
  url: string;
  alt: string;
  placement: string;
}

export interface EditorSaktiPrompts {
  sadar?: string;
  aktif?: string;
  kritis?: string;
  terbuka?: string;
  imersif?: string;
}

export interface EditorStoryDraft {
  id: string;
  slug: string;
  titleId: string;
  titleMs: string | null;
  synopsisId: string;
  synopsisMs: string | null;
  originCountry: "Indonesia" | "Malaysia";
  originalLanguage: "id-ID" | "ms-MY";
  readingEstimateMinutes: number;
  emotionalIntensity: "low" | "medium" | "high";
  facilitatorRequirement: "independent" | "recommended" | "required" | "restricted";
  internalCategory: string | null;
  publicCategorySlugs: string[];
  coverImageUrl: string | null;
  sceneAssets: EditorSceneAsset[];
  saktiPrompts: EditorSaktiPrompts;
  editorialStatus: EditorStoryDraftStatus;
  createdAt: string;
  updatedAt: string;
}

interface EditorStoryDraftRow {
  id: string;
  slug: string;
  title_id: string;
  title_ms: string | null;
  synopsis_id: string;
  synopsis_ms: string | null;
  origin_country: "Indonesia" | "Malaysia";
  original_language: "id-ID" | "ms-MY";
  reading_estimate_minutes: number;
  emotional_intensity: "low" | "medium" | "high";
  facilitator_requirement: "independent" | "recommended" | "required" | "restricted";
  internal_category: string | null;
  public_category_slugs: string[] | null;
  cover_image_url: string | null;
  scene_assets: EditorSceneAsset[] | null;
  sakti_prompts: EditorSaktiPrompts | null;
  editorial_status: EditorStoryDraftStatus;
  created_at: string;
  updated_at: string;
}

export async function getEditorStoryDrafts(): Promise<EditorStoryDraft[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("editor_story_drafts")
    .select(
      "id,slug,title_id,title_ms,synopsis_id,synopsis_ms,origin_country,original_language,reading_estimate_minutes,emotional_intensity,facilitator_requirement,internal_category,public_category_slugs,cover_image_url,scene_assets,sakti_prompts,editorial_status,created_at,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) return [];

  return ((data ?? []) as EditorStoryDraftRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    titleId: row.title_id,
    titleMs: row.title_ms,
    synopsisId: row.synopsis_id,
    synopsisMs: row.synopsis_ms,
    originCountry: row.origin_country,
    originalLanguage: row.original_language,
    readingEstimateMinutes: row.reading_estimate_minutes,
    emotionalIntensity: row.emotional_intensity,
    facilitatorRequirement: row.facilitator_requirement,
    internalCategory: row.internal_category,
    publicCategorySlugs: row.public_category_slugs ?? [],
    coverImageUrl: row.cover_image_url,
    sceneAssets: row.scene_assets ?? [],
    saktiPrompts: row.sakti_prompts ?? {},
    editorialStatus: row.editorial_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
