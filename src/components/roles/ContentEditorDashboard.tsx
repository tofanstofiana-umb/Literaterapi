import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { STORIES, STORY_CATEGORY_LABELS } from "@/content/stories";
import { Link } from "@/i18n/navigation";
import {
  createContentReviewNote,
  createEditorStoryDraft,
  updateEditorStoryDraftStatus,
  updateStoryRevisionStatus,
} from "@/app/[locale]/(admin)/role-actions";
import {
  getContentReviewNotes,
  getExpertStoryRubrics,
  getStoryReviewStatuses,
  type StoryRevisionStatus,
} from "@/lib/roles/contentReviewData";
import { EDITOR_STORY_DRAFT_STATUSES, getEditorStoryDrafts } from "@/lib/roles/editorStoryDrafts";
import RoleWorkspace from "./RoleWorkspace";

const statusKeys: StoryRevisionStatus[] = ["aman", "perlu_revisi_gambar", "perlu_tinjauan_ahli", "selesai"];
const intensityKeys = ["low", "medium", "high"] as const;
const facilitatorKeys = ["independent", "recommended", "required", "restricted"] as const;

export default async function ContentEditorDashboard() {
  const t = await getTranslations("rolePages.editor");
  const tMeta = await getTranslations("reviewMeta");
  const [notes, reviewStatuses, expertRubrics, editorDrafts] = await Promise.all([
    getContentReviewNotes(),
    getStoryReviewStatuses(),
    getExpertStoryRubrics(),
    getEditorStoryDrafts(),
  ]);
  const categoryCount = Object.keys(STORY_CATEGORY_LABELS).length;
  const illustratedStories = STORIES.filter((story) => story.coverUrl && story.illustrations.length > 0).length;

  return (
    <RoleWorkspace
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      primaryHref="/pustaka"
      primaryLabel={t("primaryLabel")}
      relatedLinks={[
        {
          href: "/moderator",
          label: t("links.moderator.label"),
          detail: t("links.moderator.detail"),
        },
        {
          href: "/ahli",
          label: t("links.expert.label"),
          detail: t("links.expert.detail"),
        },
        {
          href: "/peneliti",
          label: t("links.researcher.label"),
          detail: t("links.researcher.detail"),
        },
      ]}
      cards={[
        {
          title: t("cards.activeStories.title"),
          body: t("cards.activeStories.body", { count: STORIES.length }),
        },
        {
          title: t("cards.categories.title"),
          body: t("cards.categories.body", { count: categoryCount }),
        },
        {
          title: t("cards.visuals.title"),
          body: t("cards.visuals.body", { count: illustratedStories }),
        },
      ]}
      note={t("note")}
    >
      <section className="rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("studio.eyebrow")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
            {t("studio.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("studio.body")}
          </p>
        </div>
        <form action={createEditorStoryDraft} encType="multipart/form-data" className="grid gap-5 p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.titleId")}
              <input
                name="title_id"
                required
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.titleId")}
              />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.titleMs")}
              <input
                name="title_ms"
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.titleMs")}
              />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.slug")}
              <input
                name="slug"
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.slug")}
              />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.cover")}
              <input
                name="cover_image_url"
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.cover")}
              />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.coverUpload")}
              <input
                name="cover_image_file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sakti-forest file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
              <span className="mt-1 block text-xs font-normal text-sakti-forestDark/60">
                {t("studio.uploadHelp")}
              </span>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.synopsisId")}
              <textarea
                name="synopsis_id"
                rows={3}
                required
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.synopsisId")}
              />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.synopsisMs")}
              <textarea
                name="synopsis_ms"
                rows={3}
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.synopsisMs")}
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.bodyId")}
              <textarea
                name="body_id"
                rows={10}
                required
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.bodyId")}
              />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.bodyMs")}
              <textarea
                name="body_ms"
                rows={10}
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.bodyMs")}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.country")}
              <select name="origin_country" className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm">
                <option value="Indonesia">Indonesia</option>
                <option value="Malaysia">Malaysia</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.language")}
              <select name="original_language" className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm">
                <option value="id-ID">Indonesia</option>
                <option value="ms-MY">Malaysia</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.minutes")}
              <input
                name="reading_estimate_minutes"
                type="number"
                min={1}
                max={30}
                defaultValue={5}
                className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.internalCategory")}
              <input
                name="internal_category"
                className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm"
                placeholder={t("studio.placeholders.internalCategory")}
              />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.ageMin")}
              <input name="age_min" type="number" min={7} max={18} defaultValue={12} className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.ageMax")}
              <input name="age_max" type="number" min={7} max={18} defaultValue={14} className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.intensity")}
              <select name="emotional_intensity" defaultValue="medium" className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm">
                {intensityKeys.map((value) => (
                  <option key={value} value={value}>
                    {t(`studio.intensity.${value}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.facilitator")}
              <select name="facilitator_requirement" defaultValue="recommended" className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm">
                {facilitatorKeys.map((value) => (
                  <option key={value} value={value}>
                    {t(`studio.facilitator.${value}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="rounded-sakti border border-sakti-mist bg-sakti-paper/60 p-4">
            <legend className="px-2 text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.categories")}
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(STORY_CATEGORY_LABELS).map(([slug, label]) => (
                <label key={slug} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-sakti-forestDark/75">
                  <input type="checkbox" name="public_category_slugs" value={slug} className="h-4 w-4 accent-sakti-forest" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-semibold text-sakti-forestDark">
            {t("studio.fields.scenes")}
            <textarea
              name="scene_assets"
              rows={4}
              className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-sakti-forest"
              placeholder={t("studio.placeholders.scenes")}
            />
          </label>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.sceneUpload")}
              <input
                name="scene_image_files"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sakti-forest file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
              <span className="mt-1 block text-xs font-normal text-sakti-forestDark/60">
                {t("studio.uploadHelp")}
              </span>
            </label>
            <label className="block text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.sceneFileNotes")}
              <textarea
                name="scene_file_notes"
                rows={4}
                className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-sakti-forest"
                placeholder={t("studio.placeholders.sceneFileNotes")}
              />
            </label>
          </div>

          <fieldset className="grid gap-4 rounded-sakti border border-sakti-mist bg-sakti-paper/60 p-4 lg:grid-cols-2">
            <legend className="px-2 text-sm font-semibold text-sakti-forestDark">
              {t("studio.fields.sakti")}
            </legend>
            {(["sadar", "aktif", "kritis", "terbuka", "imersif"] as const).map((stage) => (
              <label key={stage} className="block text-sm font-semibold text-sakti-forestDark">
                {t(`studio.sakti.${stage}`)}
                <textarea
                  name={`sakti_${stage}`}
                  rows={2}
                  className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-sakti-forest"
                  placeholder={t(`studio.placeholders.sakti.${stage}`)}
                />
              </label>
            ))}
          </fieldset>

          <div className="rounded-sakti border border-sakti-mist bg-sakti-paper/70 p-4 text-sm leading-6 text-sakti-forestDark/75">
            {t("studio.safetyNote")}
          </div>
          <button type="submit" className="w-full rounded-full bg-sakti-forest px-5 py-3 text-sm font-semibold text-white sm:w-fit">
            {t("studio.submit")}
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
            {t("drafts.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("drafts.body")}
          </p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {editorDrafts.map((draft) => (
            <article key={draft.id} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                    {draft.originCountry} - {t("minutes", { count: draft.readingEstimateMinutes })}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-sakti-forestDark">
                    {draft.titleId}
                  </h3>
                  <p className="mt-1 text-xs text-sakti-forestDark/60">{draft.slug}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sakti-forest">
                  {t(`drafts.status.${draft.editorialStatus}`)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-sakti-forestDark/70">{draft.synopsisId}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-sakti-forest">
                <span className="rounded-full bg-white px-3 py-1">
                  {t("drafts.categoryCount", { count: draft.publicCategorySlugs.length })}
                </span>
                <span className="rounded-full bg-white px-3 py-1">
                  {t("drafts.sceneCount", { count: draft.sceneAssets.length })}
                </span>
              </div>
              <form action={updateEditorStoryDraftStatus} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="draft_id" value={draft.id} />
                <select
                  name="editorial_status"
                  defaultValue={draft.editorialStatus}
                  className="min-w-0 flex-1 rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm text-sakti-forestDark"
                >
                  {EDITOR_STORY_DRAFT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t(`drafts.status.${status}`)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-full bg-sakti-forest px-4 py-2 text-sm font-semibold text-white">
                  {t("drafts.updateStatus")}
                </button>
              </form>
            </article>
          ))}
          {editorDrafts.length === 0 ? (
            <p className="rounded-sakti border border-dashed border-sakti-mist p-5 text-sm leading-6 text-sakti-forestDark/70 md:col-span-2">
              {t("drafts.empty")}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-8 rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">{t("catalog.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("catalog.body")}
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((story) => {
            const expertRubric = expertRubrics.get(story.slug);

            return (
            <article key={story.slug} className="overflow-hidden rounded-sakti border border-sakti-mist">
              <div className="relative aspect-square bg-sakti-paper">
                <Image src={story.coverUrl} alt={t("catalog.coverAlt", { title: story.title })} fill sizes="320px" className="object-contain" />
              </div>
              <div className="p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-sakti-mist px-3 py-1 text-xs font-semibold text-sakti-forest">
                    {t(`status.${reviewStatuses.get(story.slug)?.status ?? "aman"}`)}
                  </span>
                  {expertRubric ? (
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-sakti-forest">
                      {tMeta(`expertRecommendations.${expertRubric.recommendation}`)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                  {story.originCountry} - {t("minutes", { count: story.readingEstimateMinutes })}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-sakti-forestDark">
                  {story.title}
                </h3>
                <p className="mt-2 text-xs text-sakti-forestDark/65">
                  {t("catalog.storyMeta", {
                    categories: story.publicCategorySlugs.length,
                    illustrations: story.illustrations.length,
                  })}
                </p>
                <Link href={`/cerita/${story.slug}`} className="mt-4 inline-flex rounded-full bg-sakti-forest px-4 py-2 text-sm font-semibold text-white">
                  {t("catalog.reviewStory")}
                </Link>
                <form action={updateStoryRevisionStatus} className="mt-4 space-y-2 rounded-sakti border border-sakti-mist bg-sakti-paper/70 p-3">
                  <input type="hidden" name="story_slug" value={story.slug} />
                  <label className="block text-xs font-semibold uppercase tracking-wide text-sakti-forestDark/65">
                    {t("catalog.revisionStatus")}
                    <select
                      name="status"
                      defaultValue={reviewStatuses.get(story.slug)?.status ?? "aman"}
                      className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm normal-case tracking-normal text-sakti-forestDark"
                    >
                      {statusKeys.map((value) => (
                        <option key={value} value={value}>
                          {t(`status.${value}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    name="note"
                    rows={2}
                    defaultValue={reviewStatuses.get(story.slug)?.note ?? ""}
                    placeholder={t("catalog.statusNotePlaceholder")}
                    className="w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                  />
                  <button type="submit" className="rounded-full bg-sakti-forest px-4 py-2 text-sm font-semibold text-white">
                    {t("catalog.saveStatus")}
                  </button>
                </form>
                <form action={createContentReviewNote} className="mt-4 space-y-2">
                  <input type="hidden" name="story_slug" value={story.slug} />
                  <input type="hidden" name="note_type" value="editorial" />
                  <textarea
                    name="body"
                    rows={2}
                    placeholder={t("catalog.editorialNotePlaceholder")}
                    className="w-full rounded-sakti border border-sakti-mist px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                  />
                  <button type="submit" className="rounded-full border border-sakti-forest px-4 py-2 text-sm font-semibold text-sakti-forest">
                    {t("catalog.saveNote")}
                  </button>
                </form>
              </div>
            </article>
            );
          })}
        </div>
      </section>
      <section className="mt-8 rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
          {t("notes.title")}
        </h2>
        <div className="mt-4 space-y-3">
          {notes.slice(0, 8).map((note) => (
            <article key={note.id} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                {tMeta(`roles.${note.authorRole}`)} - {tMeta(`noteStatuses.${note.status}`)}
              </p>
              <p className="mt-1 font-semibold text-sakti-forestDark">{note.storyTitle}</p>
              <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">{note.body}</p>
            </article>
          ))}
          {notes.length === 0 ? (
            <p className="text-sm leading-6 text-sakti-forestDark/70">{t("notes.empty")}</p>
          ) : null}
        </div>
      </section>
    </RoleWorkspace>
  );
}
