import Image from "next/image";
import { useTranslations } from "next-intl";
import { STORIES } from "@/content/stories";
import { Link } from "@/i18n/navigation";
import type { FacilitatorDashboardData } from "@/lib/facilitator/dashboardData";
import {
  createCompanionNote,
  createFacilitatorClass,
  updateCompanionNoteStatus,
} from "@/app/[locale]/(facilitator)/fasilitator/actions";

const tasks = [
  {
    key: "reviewReflection",
    done: true,
  },
  {
    key: "prepareDiscussion",
    done: false,
  },
  {
    key: "chooseNextStory",
    done: false,
  },
] as const;

const signalToneClass: Record<string, string> = {
  green: "bg-sakti-forest/10 text-sakti-forest",
  coral: "bg-red-100 text-red-700",
  blue: "bg-sky-100 text-sky-700",
};

const noteStatusClass: Record<string, string> = {
  open: "bg-sakti-gold/15 text-sakti-forestDark",
  done: "bg-sakti-forest/10 text-sakti-forest",
  archived: "bg-sakti-mist text-sakti-forestDark/70",
};

export default function FacilitatorDashboard({ data }: { data: FacilitatorDashboardData }) {
  const t = useTranslations("facilitatorDashboard");
  const tMeta = useTranslations("reviewMeta");
  const recommendedStories = data.recommendedStorySlugs
    .map((slug) => STORIES.find((story) => story.slug === slug))
    .filter((story): story is (typeof STORIES)[number] => Boolean(story));
  const noteLearners = data.learners.filter((row) => row.studentId);
  const learnerNameById = new Map(data.learners.map((row) => [row.studentId, row.name]));

  return (
    <div className="bg-sakti-paper">
      <section className="border-b border-sakti-mist bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-sakti-forestDark sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-sakti-forestDark/75">
              {t("description")}
            </p>
            {data.isDemo && (
              <p className="mt-5 rounded-sakti border border-sakti-gold/40 bg-sakti-gold/10 p-4 text-sm leading-6 text-sakti-forestDark/75">
                {t("demoNotice")}
              </p>
            )}
            {data.dataWarning && (
              <p className="mt-5 rounded-sakti border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {data.dataWarningKey ? t(`warnings.${data.dataWarningKey}`) : data.dataWarning}
              </p>
            )}
          </div>

          <aside className="overflow-hidden rounded-sakti border border-sakti-mist bg-white shadow-sm">
            <div className="relative aspect-[16/10]">
              <Image
                src="/assets/general/animasi-dashboard.png"
                alt={t("illustrationAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 360px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-4 p-5">
              <Image
                src="/assets/general/avatar-perempuan.png"
                alt={t("avatarAlt")}
                width={58}
                height={58}
                className="rounded-full border-2 border-sakti-gold object-cover"
              />
              <div>
                <p className="font-semibold text-sakti-forestDark">{t("profileTitle")}</p>
                <p className="text-sm text-sakti-forestDark/65">{t("profileSubtitle")}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.signals.map((item) => (
            <article key={item.key} className="rounded-sakti border border-sakti-mist bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                {t(`signals.${item.key}.label`)}
              </p>
              <p className="mt-3 font-display text-4xl font-semibold text-sakti-forest">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-sakti-forestDark/68">
                {t(`signals.${item.key}.detail`, { count: item.detailCount ?? Number(item.value) })}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
        <div className="rounded-sakti border border-sakti-mist bg-white">
          <div className="border-b border-sakti-mist p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
              {t("classes.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
              {t("classes.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/68">
              {t("classes.body")}
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {data.classes.map((classItem) => (
              <article
                key={classItem.id ?? classItem.joinCode}
                className="rounded-sakti border border-sakti-mist bg-sakti-paper/70 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                      {classItem.schoolName} - {classItem.country}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-sakti-forestDark">
                      {classItem.name}
                    </h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sakti-forest">
                    {t("classes.memberCount", { count: classItem.memberCount })}
                  </span>
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-sakti-forest/35 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sakti-forestDark/60">
                    {t("classes.joinCode")}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tracking-wide text-sakti-forest">
                    {classItem.joinCode}
                  </p>
                </div>
              </article>
            ))}
            {data.classes.length === 0 && (
              <div className="rounded-sakti border border-dashed border-sakti-mist bg-sakti-paper/70 p-6 text-sm leading-6 text-sakti-forestDark/68 sm:col-span-2">
                {t("classes.empty")}
              </div>
            )}
          </div>
        </div>

        <form action={createFacilitatorClass} className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("createClass.eyebrow")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
            {t("createClass.title")}
          </h2>
          <label className="mt-5 block text-sm font-semibold text-sakti-forestDark">
            {t("createClass.schoolName")}
            <input
              name="school_name"
              required
              placeholder={t("createClass.schoolPlaceholder")}
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-4 py-3 text-sm outline-none focus:border-sakti-forest"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-sakti-forestDark">
            {t("createClass.country")}
            <select
              name="country"
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-4 py-3 text-sm outline-none focus:border-sakti-forest"
            >
              <option value="Indonesia">Indonesia</option>
              <option value="Malaysia">Malaysia</option>
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold text-sakti-forestDark">
            {t("createClass.className")}
            <input
              name="class_name"
              required
              placeholder={t("createClass.classPlaceholder")}
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-4 py-3 text-sm outline-none focus:border-sakti-forest"
            />
          </label>
          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-sakti-forest px-4 py-3 text-sm font-semibold text-white"
          >
            {t("createClass.submit")}
          </button>
          <p className="mt-3 text-xs leading-5 text-sakti-forestDark/60">
            {t("createClass.hint")}
          </p>
        </form>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="rounded-sakti border border-sakti-mist bg-white">
          <div className="border-b border-sakti-mist p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
              {t("monitoring.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
              {t("monitoring.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/68">
              {t("monitoring.body")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead className="bg-sakti-mist/40 text-xs uppercase tracking-wide text-sakti-forestDark/65">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t("monitoring.student")}</th>
                  <th className="px-5 py-3 font-semibold">{t("monitoring.story")}</th>
                  <th className="px-5 py-3 font-semibold">{t("monitoring.progress")}</th>
                  <th className="px-5 py-3 font-semibold">{t("monitoring.signal")}</th>
                  <th className="px-5 py-3 font-semibold">{t("monitoring.action")}</th>
                </tr>
              </thead>
              <tbody>
                {data.learners.map((row) => (
                  <tr key={row.name} className="border-t border-sakti-mist/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sakti-forestDark">{row.name}</p>
                      <p className="text-xs text-sakti-forestDark/60">{row.className}</p>
                    </td>
                    <td className="px-5 py-4 text-sakti-forestDark/76">{row.story}</td>
                    <td className="px-5 py-4">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-sakti-mist">
                        <div
                          className="h-full rounded-full bg-sakti-forest"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-sakti-forestDark/60">
                        {t("monitoring.progressValue", { progress: row.progress })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          signalToneClass[row.signalTone]
                        }`}
                      >
                        {t(`learnerSignals.${row.signalKey}`)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-sakti-forest">
                      {t(`learnerActions.${row.actionKey}`)}
                    </td>
                  </tr>
                ))}
                {data.learners.length === 0 && (
                  <tr className="border-t border-sakti-mist/70">
                    <td className="px-5 py-8 text-sakti-forestDark/65" colSpan={5}>
                      {t("monitoring.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-sakti border border-sakti-mist bg-white">
            <div className="border-b border-sakti-mist p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                {t("notes.eyebrow")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
                {t("notes.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-sakti-forestDark/68">
                {t("notes.body")}
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-sakti border border-sakti-mist/80 bg-sakti-paper/70 p-4">
                <h3 className="font-display text-xl font-semibold text-sakti-forestDark">
                  {t("notes.historyTitle")}
                </h3>
                <div className="mt-3 space-y-3">
                  {data.companionNotes.slice(0, 6).map((note) => (
                    <article key={note.id} className="rounded-xl bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-sakti-forestDark">
                          {learnerNameById.get(note.studentId) ?? t("notes.defaultLearner")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-sakti-mist px-2 py-1 text-[11px] font-semibold uppercase text-sakti-forest">
                            {note.noteType === "follow_up"
                              ? tMeta("noteTypes.follow_up")
                              : note.noteType === "counselor_follow_up"
                                ? tMeta("noteTypes.counselor_follow_up")
                                : note.noteType}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${
                              noteStatusClass[note.status] ?? noteStatusClass.open
                            }`}
                          >
                            {tMeta(`companionStatuses.${note.status}`)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">{note.body}</p>
                      <form action={updateCompanionNoteStatus} className="mt-3 flex flex-wrap gap-2">
                        <input type="hidden" name="note_id" value={note.id} />
                        <select
                          name="status"
                          defaultValue={note.status}
                          className="rounded-full border border-sakti-mist bg-white px-3 py-1 text-xs text-sakti-forestDark"
                        >
                          <option value="open">{tMeta("companionStatuses.open")}</option>
                          <option value="done">{tMeta("companionStatuses.done")}</option>
                          <option value="archived">{tMeta("companionStatuses.archived")}</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-full bg-sakti-forest px-3 py-1 text-xs font-semibold text-white"
                        >
                          {t("notes.updateStatus")}
                        </button>
                      </form>
                    </article>
                  ))}
                  {data.companionNotes.length === 0 ? (
                    <p className="text-sm leading-6 text-sakti-forestDark/65">
                      {t("notes.emptyHistory")}
                    </p>
                  ) : null}
                </div>
              </div>
              {noteLearners.map((row) => (
                <form
                  key={`note-${row.studentId}`}
                  action={createCompanionNote}
                  className="rounded-sakti border border-sakti-mist/70 bg-sakti-paper/70 p-4"
                >
                  <input type="hidden" name="student_id" value={row.studentId} />
                  <input type="hidden" name="class_id" value={row.classId ?? ""} />
                  <label className="block text-sm font-semibold text-sakti-forestDark">
                    {row.name} - {row.className}
                    <textarea
                      name="body"
                      rows={3}
                      placeholder={t("notes.placeholder")}
                      className="mt-2 w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-sakti-forest"
                    />
                  </label>
                  <button
                    type="submit"
                    className="mt-3 rounded-full bg-sakti-forest px-4 py-2 text-sm font-semibold text-white"
                  >
                    {t("notes.submit")}
                  </button>
                </form>
              ))}
              {noteLearners.length === 0 && (
                <p className="text-sm leading-6 text-sakti-forestDark/65">
                  {t("notes.emptyForm")}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-sakti border border-sakti-mist bg-white">
            <div className="border-b border-sakti-mist p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                {t("agenda.eyebrow")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
                {t("agenda.title")}
              </h2>
            </div>
            <div className="space-y-3 p-5">
              {tasks.map((task) => (
                <div
                  key={task.key}
                  className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-sakti border border-sakti-mist/70 bg-sakti-paper/70 p-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-sakti-forest text-sm font-bold text-sakti-forest">
                    {task.done ? "OK" : ""}
                  </span>
                  <div>
                    <p className="font-semibold text-sakti-forestDark">{t(`agenda.tasks.${task.key}.title`)}</p>
                    <p className="mt-1 text-sm leading-6 text-sakti-forestDark/68">
                      {t(`agenda.tasks.${task.key}.note`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-sakti border border-sakti-mist bg-white">
            <div className="border-b border-sakti-mist p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                {t("recommendations.eyebrow")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
                {t("recommendations.title")}
              </h2>
            </div>
            <div className="space-y-4 p-5">
              {recommendedStories.map((story) => (
                <article key={story.slug} className="overflow-hidden rounded-sakti border border-sakti-mist/80">
                  <div className="relative aspect-square bg-sakti-paper">
                    <Image
                      src={story.coverUrl}
                      alt={t("recommendations.coverAlt", { title: story.title })}
                      fill
                      sizes="(min-width: 1024px) 320px, 100vw"
                      className="object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-display text-lg font-semibold leading-snug text-sakti-forestDark">
                      {story.title}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                      {story.originCountry} - {t("recommendations.minutes", { count: story.readingEstimateMinutes })}
                    </p>
                    <Link
                      href={`/cerita/${story.slug}`}
                      className="mt-3 inline-flex rounded-full border border-sakti-forest px-4 py-2 text-sm font-semibold text-sakti-forest"
                    >
                      {t("recommendations.reviewStory")}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
