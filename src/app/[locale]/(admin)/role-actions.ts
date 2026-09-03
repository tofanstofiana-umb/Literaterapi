"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";
import { getStoryBySlug } from "@/content/stories";
import { EDITOR_STORY_DRAFT_STATUSES } from "@/lib/roles/editorStoryDrafts";
import { hasAnyRole, ROLE_PRIORITY, type AppRole } from "@/types/roles";

const REVIEW_ROLE_BY_NOTE_TYPE: Record<string, AppRole> = {
  moderation: "moderator",
  editorial: "editor_konten",
  expert_review: "ahli",
  safety: "moderator",
};

const EDITOR_ASSET_BUCKET = "editor-story-assets";
const MAX_EDITOR_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EDITOR_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseSceneAssets(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line, index) => {
      const [url = "", alt = "", placement = ""] = line.split("|").map((part) => part.trim());
      if (!url) return null;
      return {
        url,
        alt: alt || `Ilustrasi adegan ${index + 1}`,
        placement: placement || `Adegan ${index + 1}`,
      };
    })
    .filter((item): item is { url: string; alt: string; placement: string } => Boolean(item));
}

function parseSceneFileNotes(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => {
      const [alt = "", placement = ""] = line.split("|").map((part) => part.trim());
      return { alt, placement };
    });
}

function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "gambar"}.${extension}`;
}

function isUsableEditorImage(value: FormDataEntryValue | null): value is File {
  return (
    typeof File !== "undefined" &&
    value instanceof File &&
    value.size > 0 &&
    value.size <= MAX_EDITOR_IMAGE_SIZE &&
    ALLOWED_EDITOR_IMAGE_TYPES.has(value.type)
  );
}

async function uploadEditorImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  slug: string,
  folder: "cover" | "scenes",
) {
  if (!supabase) return null;

  const path = `${slug}/${folder}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(EDITOR_ASSET_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) return null;

  return `storage://${EDITOR_ASSET_BUCKET}/${path}`;
}

function revalidateRolePages() {
  ["/moderator", "/editor-konten", "/ahli", "/peneliti", "/pustaka"].forEach((path) => {
    revalidatePath(path);
    revalidatePath(`/id-ID${path}`);
    revalidatePath(`/ms-MY${path}`);
  });
}

export async function createContentReviewNote(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;

  const storySlug = String(formData.get("story_slug") ?? "");
  const noteType = String(formData.get("note_type") ?? "moderation");
  const body = String(formData.get("body") ?? "").trim();
  const authorRole = REVIEW_ROLE_BY_NOTE_TYPE[noteType] ?? "moderator";

  if (!storySlug || !body) return;
  if (!hasAnyRole(currentUser.roles, [authorRole, "admin"])) return;

  await supabase.from("content_review_notes").insert({
    story_slug: storySlug,
    author_id: currentUser.id,
    author_role: authorRole,
    note_type: noteType,
    body,
    status: "open",
  });

  revalidateRolePages();
}

export async function updateContentReviewStatus(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;
  if (!hasAnyRole(currentUser.roles, ["moderator", "editor_konten", "ahli", "admin"])) return;

  const noteId = String(formData.get("note_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!noteId || !["open", "in_review", "resolved"].includes(status)) return;

  await supabase
    .from("content_review_notes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", noteId);

  revalidateRolePages();
}

export async function createStorySafetyReport(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;

  const storySlug = String(formData.get("story_slug") ?? "");
  const location = String(formData.get("location") ?? "story_detail");
  const body = String(formData.get("body") ?? "").trim();

  if (!storySlug || !getStoryBySlug(storySlug) || body.length < 8) return;

  const reporterRole =
    ROLE_PRIORITY.find((role) => currentUser.roles.includes(role)) ?? "siswa";

  await supabase.from("content_safety_reports").insert({
    story_slug: storySlug,
    reporter_id: currentUser.id,
    reporter_role: reporterRole,
    location,
    body,
    status: "open",
  });

  revalidatePath(`/cerita/${storySlug}`);
  revalidatePath(`/id-ID/cerita/${storySlug}`);
  revalidatePath(`/ms-MY/cerita/${storySlug}`);
  revalidateRolePages();
}

export async function updateSafetyReportStatus(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;
  if (!hasAnyRole(currentUser.roles, ["moderator", "editor_konten", "ahli", "admin"])) return;

  const reportId = String(formData.get("report_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!reportId || !["open", "in_review", "resolved"].includes(status)) return;

  await supabase
    .from("content_safety_reports")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reportId);

  revalidateRolePages();
}

export async function updateStoryRevisionStatus(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;
  if (!hasAnyRole(currentUser.roles, ["editor_konten", "admin"])) return;

  const storySlug = String(formData.get("story_slug") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!storySlug || !getStoryBySlug(storySlug)) return;
  if (!["aman", "perlu_revisi_gambar", "perlu_tinjauan_ahli", "selesai"].includes(status)) return;

  await supabase.from("story_review_statuses").upsert(
    {
      story_slug: storySlug,
      status,
      note: note || null,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "story_slug" },
  );

  revalidateRolePages();
}

export async function upsertExpertStoryRubric(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;
  if (!hasAnyRole(currentUser.roles, ["ahli", "admin"])) return;

  const storySlug = String(formData.get("story_slug") ?? "");
  const recommendation = String(formData.get("recommendation") ?? "perlu_revisi");
  const note = String(formData.get("note") ?? "").trim();

  if (!storySlug || !getStoryBySlug(storySlug)) return;
  if (!["layak", "perlu_revisi", "tidak_cocok"].includes(recommendation)) return;

  await supabase.from("expert_story_rubrics").upsert(
    {
      story_slug: storySlug,
      reviewer_id: currentUser.id,
      culture_ok: formData.get("culture_ok") === "on",
      non_clinical_ok: formData.get("non_clinical_ok") === "on",
      age_ok: formData.get("age_ok") === "on",
      public_category_ok: formData.get("public_category_ok") === "on",
      sakti_affirmation_ok: formData.get("sakti_affirmation_ok") === "on",
      recommendation,
      note: note || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "story_slug,reviewer_id" },
  );

  revalidateRolePages();
}

export async function createEditorStoryDraft(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;
  if (!hasAnyRole(currentUser.roles, ["editor_konten", "admin"])) return;

  const titleId = String(formData.get("title_id") ?? "").trim();
  const bodyId = String(formData.get("body_id") ?? "").trim();
  const synopsisId = String(formData.get("synopsis_id") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const baseSlug = toSlug(rawSlug || titleId);
  const slug = `${baseSlug || "draft-cerita"}-${crypto.randomUUID().slice(0, 8)}`;
  const originCountry = String(formData.get("origin_country") ?? "Indonesia");
  const originalLanguage = String(formData.get("original_language") ?? "id-ID");
  const emotionalIntensity = String(formData.get("emotional_intensity") ?? "medium");
  const facilitatorRequirement = String(formData.get("facilitator_requirement") ?? "recommended");

  if (!titleId || !synopsisId || bodyId.length < 80) return;
  if (!["Indonesia", "Malaysia"].includes(originCountry)) return;
  if (!["id-ID", "ms-MY"].includes(originalLanguage)) return;
  if (!["low", "medium", "high"].includes(emotionalIntensity)) return;
  if (!["independent", "recommended", "required", "restricted"].includes(facilitatorRequirement)) return;

  const categorySlugs = formData
    .getAll("public_category_slugs")
    .map((value) => String(value))
    .filter(Boolean)
    .slice(0, 5);
  const coverFile = formData.get("cover_image_file");
  const uploadedCoverUrl = isUsableEditorImage(coverFile)
    ? await uploadEditorImage(supabase, coverFile, slug, "cover")
    : null;
  const manualSceneAssets = parseSceneAssets(String(formData.get("scene_assets") ?? ""));
  const sceneFileNotes = parseSceneFileNotes(String(formData.get("scene_file_notes") ?? ""));
  const uploadedSceneAssets = [];

  for (const [index, entry] of formData.getAll("scene_image_files").entries()) {
    if (!isUsableEditorImage(entry)) continue;
    const url = await uploadEditorImage(supabase, entry, slug, "scenes");
    if (!url) continue;
    const note = sceneFileNotes[index];
    uploadedSceneAssets.push({
      url,
      alt: note?.alt || `Ilustrasi adegan ${index + 1}`,
      placement: note?.placement || `Adegan ${index + 1}`,
    });
  }

  await supabase.from("editor_story_drafts").insert({
    slug,
    title_id: titleId,
    title_ms: String(formData.get("title_ms") ?? "").trim() || null,
    synopsis_id: synopsisId,
    synopsis_ms: String(formData.get("synopsis_ms") ?? "").trim() || null,
    body_id: bodyId,
    body_ms: String(formData.get("body_ms") ?? "").trim() || null,
    origin_country: originCountry,
    original_language: originalLanguage,
    age_min: Number(formData.get("age_min") ?? 12) || 12,
    age_max: Number(formData.get("age_max") ?? 14) || 14,
    reading_estimate_minutes: Number(formData.get("reading_estimate_minutes") ?? 5) || 5,
    emotional_intensity: emotionalIntensity,
    facilitator_requirement: facilitatorRequirement,
    internal_category: String(formData.get("internal_category") ?? "").trim() || null,
    public_category_slugs: categorySlugs,
    cover_image_url: uploadedCoverUrl || String(formData.get("cover_image_url") ?? "").trim() || null,
    scene_assets: [...manualSceneAssets, ...uploadedSceneAssets],
    sakti_prompts: {
      sadar: String(formData.get("sakti_sadar") ?? "").trim(),
      aktif: String(formData.get("sakti_aktif") ?? "").trim(),
      kritis: String(formData.get("sakti_kritis") ?? "").trim(),
      terbuka: String(formData.get("sakti_terbuka") ?? "").trim(),
      imersif: String(formData.get("sakti_imersif") ?? "").trim(),
    },
    editorial_status: "draft",
    created_by: currentUser.id,
    updated_by: currentUser.id,
  });

  revalidateRolePages();
}

export async function updateEditorStoryDraftStatus(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) return;
  if (!hasAnyRole(currentUser.roles, ["editor_konten", "admin"])) return;

  const draftId = String(formData.get("draft_id") ?? "");
  const status = String(formData.get("editorial_status") ?? "");
  if (!draftId || !EDITOR_STORY_DRAFT_STATUSES.includes(status as never)) return;

  await supabase
    .from("editor_story_drafts")
    .update({
      editorial_status: status,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);

  revalidateRolePages();
}
