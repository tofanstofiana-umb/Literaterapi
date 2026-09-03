import { getTranslations } from "next-intl/server";
import { STORIES } from "@/content/stories";
import {
  createContentReviewNote,
  updateContentReviewStatus,
  updateSafetyReportStatus,
} from "@/app/[locale]/(admin)/role-actions";
import {
  getContentReviewNotes,
  getContentSafetyReports,
  getExpertStoryRubrics,
  getStoryReviewStatuses,
} from "@/lib/roles/contentReviewData";
import RoleWorkspace from "./RoleWorkspace";

export default async function ModeratorDashboard() {
  const t = await getTranslations("rolePages.moderator");
  const tMeta = await getTranslations("reviewMeta");
  const [notes, reports, reviewStatuses, expertRubrics] = await Promise.all([
    getContentReviewNotes(),
    getContentSafetyReports(),
    getStoryReviewStatuses(),
    getExpertStoryRubrics(),
  ]);
  const reviewQueue = STORIES.filter(
    (story) => story.emotionalIntensity !== "low" || story.facilitatorRequirement !== "independent",
  ).slice(0, 8);
  const needsFacilitator = STORIES.filter((story) => story.facilitatorRequirement !== "independent").length;
  const openReports = reports.filter((report) => report.status !== "resolved").length;

  return (
    <RoleWorkspace
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      relatedLinks={[
        {
          href: "/editor-konten",
          label: t("links.editor.label"),
          detail: t("links.editor.detail"),
        },
        {
          href: "/ahli",
          label: t("links.expert.label"),
          detail: t("links.expert.detail"),
        },
        {
          href: "/admin",
          label: t("links.admin.label"),
          detail: t("links.admin.detail"),
        },
      ]}
      cards={[
        {
          title: t("cards.queue.title"),
          body: t("cards.queue.body", { count: reviewQueue.length }),
        },
        {
          title: t("cards.companion.title"),
          body: t("cards.companion.body", { count: needsFacilitator }),
        },
        {
          title: t("cards.boundary.title"),
          body: t("cards.boundary.body"),
        },
        {
          title: t("cards.reports.title"),
          body: t("cards.reports.body", { count: openReports }),
        },
      ]}
      note={t("note")}
    >
      <section className="rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
            {t("queueSection.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("queueSection.body")}
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {reviewQueue.map((story) => {
            const expertRubric = expertRubrics.get(story.slug);

            return (
            <article key={story.slug} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                {story.originCountry} - {story.emotionalIntensity}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-sakti-forestDark">{story.title}</h3>
              <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
                {t("queueSection.storyContext", { requirement: story.facilitatorRequirement })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-sakti-forest">
                  {t("queueSection.revisionStatus", {
                    status: t(`status.${reviewStatuses.get(story.slug)?.status ?? "aman"}`),
                  })}
                </span>
                {expertRubric ? (
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-sakti-forest">
                    {tMeta(`expertRecommendations.${expertRubric.recommendation}`)}
                  </span>
                ) : null}
              </div>
              <form action={createContentReviewNote} className="mt-4 space-y-3">
                <input type="hidden" name="story_slug" value={story.slug} />
                <input type="hidden" name="note_type" value="moderation" />
                <textarea
                  name="body"
                  rows={3}
                  placeholder={t("queueSection.notePlaceholder")}
                  className="w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                />
                <button type="submit" className="rounded-full bg-sakti-forest px-4 py-2 text-sm font-semibold text-white">
                  {t("queueSection.sendNote")}
                </button>
              </form>
            </article>
            );
          })}
        </div>
      </section>
      <section className="mt-8 rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
            {t("reportsSection.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("reportsSection.body")}
          </p>
        </div>
        <div className="divide-y divide-sakti-mist">
          {reports.map((report) => (
            <article key={report.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                    {tMeta(`roles.${report.reporterRole}`)} - {report.location}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-sakti-forestDark">
                    {report.storyTitle}
                  </h3>
                </div>
                <form action={updateSafetyReportStatus} className="flex gap-2">
                  <input type="hidden" name="report_id" value={report.id} />
                  <select
                    name="status"
                    defaultValue={report.status}
                    className="rounded-full border border-sakti-mist bg-white px-3 py-1 text-xs"
                  >
                    <option value="open">{t("status.open")}</option>
                    <option value="in_review">{t("status.in_review")}</option>
                    <option value="resolved">{t("status.resolved")}</option>
                  </select>
                  <button type="submit" className="rounded-full bg-sakti-forest px-3 py-1 text-xs font-semibold text-white">
                    {t("save")}
                  </button>
                </form>
              </div>
              <p className="mt-3 text-sm leading-6 text-sakti-forestDark/75">{report.body}</p>
            </article>
          ))}
          {reports.length === 0 ? (
            <p className="p-5 text-sm leading-6 text-sakti-forestDark/70">
              {t("reportsSection.empty")}
            </p>
          ) : null}
        </div>
      </section>
      <section className="mt-8 rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
            {t("notesSection.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("notesSection.body")}
          </p>
        </div>
        <div className="divide-y divide-sakti-mist">
          {notes.map((note) => (
            <article key={note.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                    {tMeta(`roles.${note.authorRole}`)} - {tMeta(`noteTypes.${note.noteType}`)}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-sakti-forestDark">
                    {note.storyTitle}
                  </h3>
                </div>
                <form action={updateContentReviewStatus} className="flex gap-2">
                  <input type="hidden" name="note_id" value={note.id} />
                  <select
                    name="status"
                    defaultValue={note.status}
                    className="rounded-full border border-sakti-mist bg-white px-3 py-1 text-xs"
                  >
                    <option value="open">{t("status.open")}</option>
                    <option value="in_review">{t("status.in_review")}</option>
                    <option value="resolved">{t("status.resolved")}</option>
                  </select>
                  <button type="submit" className="rounded-full bg-sakti-forest px-3 py-1 text-xs font-semibold text-white">
                    {t("save")}
                  </button>
                </form>
              </div>
              <p className="mt-3 text-sm leading-6 text-sakti-forestDark/75">{note.body}</p>
            </article>
          ))}
          {notes.length === 0 ? (
            <p className="p-5 text-sm leading-6 text-sakti-forestDark/70">
              {t("notesSection.empty")}
            </p>
          ) : null}
        </div>
      </section>
    </RoleWorkspace>
  );
}
