import { getTranslations } from "next-intl/server";
import { STORIES } from "@/content/stories";
import { createContentReviewNote, upsertExpertStoryRubric } from "@/app/[locale]/(admin)/role-actions";
import {
  getContentReviewNotes,
  getExpertStoryRubrics,
  getStoryReviewStatuses,
} from "@/lib/roles/contentReviewData";
import RoleWorkspace from "./RoleWorkspace";

const expertRubric = ["culture", "nonClinical", "age", "publicCategory", "saktiAffirmation"] as const;
const rubricFieldByKey = {
  culture: "culture_ok",
  nonClinical: "non_clinical_ok",
  age: "age_ok",
  publicCategory: "public_category_ok",
  saktiAffirmation: "sakti_affirmation_ok",
} as const;
const recommendationKeys = ["layak", "perlu_revisi", "tidak_cocok"] as const;

export default async function ExpertDashboard() {
  const t = await getTranslations("rolePages.expert");
  const tMeta = await getTranslations("reviewMeta");
  const [notes, reviewStatuses, expertRubrics] = await Promise.all([
    getContentReviewNotes(),
    getStoryReviewStatuses(),
    getExpertStoryRubrics(),
  ]);
  const malaysiaStories = STORIES.filter((story) => story.originCountry === "Malaysia").length;
  const indonesiaStories = STORIES.filter((story) => story.originCountry === "Indonesia").length;
  const reviewStories = STORIES.filter(
    (story) => story.emotionalIntensity === "high" || story.facilitatorRequirement !== "independent",
  ).slice(0, 10);

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
          href: "/moderator",
          label: t("links.moderator.label"),
          detail: t("links.moderator.detail"),
        },
        {
          href: "/peneliti",
          label: t("links.researcher.label"),
          detail: t("links.researcher.detail"),
        },
      ]}
      cards={[
        {
          title: t("cards.indonesia.title"),
          body: t("cards.indonesia.body", { count: indonesiaStories }),
        },
        {
          title: t("cards.malaysia.title"),
          body: t("cards.malaysia.body", { count: malaysiaStories }),
        },
        {
          title: t("cards.review.title"),
          body: t("cards.review.body", { count: reviewStories.length }),
        },
      ]}
      note={t("note")}
    >
      <section className="rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
            {t("reviewSection.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("reviewSection.body")}
          </p>
        </div>
        <div className="divide-y divide-sakti-mist">
          {reviewStories.map((story) => {
            const savedRubric = expertRubrics.get(story.slug);

            return (
              <article key={story.slug} className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                  {story.originCountry} - {story.internalCategory}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-sakti-forestDark">{story.title}</h3>
                <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
                  {t("reviewSection.storyContext", {
                    intensity: story.emotionalIntensity,
                    requirement: story.facilitatorRequirement,
                  })}
                </p>
                <form action={upsertExpertStoryRubric} className="mt-3 rounded-sakti border border-sakti-mist bg-sakti-paper/70 p-4">
                  <input type="hidden" name="story_slug" value={story.slug} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-sakti-forestDark">{t("reviewSection.rubricTitle")}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sakti-forest">
                      {tMeta(`storyStatuses.${reviewStatuses.get(story.slug)?.status ?? "aman"}`)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {expertRubric.map((item) => (
                      <label
                        key={item}
                        className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-sakti-forestDark/80"
                      >
                        <input
                          type="checkbox"
                          name={rubricFieldByKey[item]}
                          defaultChecked={
                            item === "culture"
                              ? savedRubric?.cultureOk
                              : item === "nonClinical"
                                ? savedRubric?.nonClinicalOk
                                : item === "age"
                                  ? savedRubric?.ageOk
                                  : item === "publicCategory"
                                    ? savedRubric?.publicCategoryOk
                                    : savedRubric?.saktiAffirmationOk
                          }
                          className="h-4 w-4 rounded border-sakti-mist accent-sakti-forest"
                        />
                        {t(`rubric.${item}`)}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[260px_1fr]">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-sakti-forestDark/65">
                      {t("reviewSection.recommendationLabel")}
                      <select
                        name="recommendation"
                        defaultValue={savedRubric?.recommendation ?? "perlu_revisi"}
                        className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm normal-case tracking-normal text-sakti-forestDark"
                      >
                        {recommendationKeys.map((value) => (
                          <option key={value} value={value}>
                            {t(`reviewSection.recommendations.${value}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <textarea
                      name="note"
                      rows={2}
                      defaultValue={savedRubric?.note ?? ""}
                      placeholder={t("reviewSection.rubricNotePlaceholder")}
                      className="w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                    />
                  </div>
                  <button type="submit" className="mt-3 rounded-full bg-sakti-forest px-4 py-2 text-sm font-semibold text-white">
                    {t("reviewSection.saveRubric")}
                  </button>
                </form>
                <form action={createContentReviewNote} className="mt-4 space-y-3">
                  <input type="hidden" name="story_slug" value={story.slug} />
                  <input type="hidden" name="note_type" value="expert_review" />
                  <textarea
                    name="body"
                    rows={3}
                    placeholder={t("reviewSection.notePlaceholder")}
                    className="w-full rounded-sakti border border-sakti-mist px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                  />
                  <button type="submit" className="rounded-full border border-sakti-forest px-4 py-2 text-sm font-semibold text-sakti-forest">
                    {t("reviewSection.saveReview")}
                  </button>
                </form>
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
          {notes.slice(0, 6).map((note) => (
            <article key={note.id} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                {tMeta(`roles.${note.authorRole}`)} - {tMeta(`noteTypes.${note.noteType}`)} - {tMeta(`noteStatuses.${note.status}`)}
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
