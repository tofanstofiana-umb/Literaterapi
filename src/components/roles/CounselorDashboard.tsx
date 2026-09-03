import { getTranslations } from "next-intl/server";
import type { FacilitatorDashboardData } from "@/lib/facilitator/dashboardData";
import { createCounselorFollowUp } from "@/app/[locale]/(facilitator)/konselor/actions";
import RoleWorkspace from "./RoleWorkspace";

const toneClass = {
  green: "bg-sakti-forest/10 text-sakti-forest",
  coral: "bg-red-100 text-red-700",
  blue: "bg-sky-100 text-sky-700",
};

export default async function CounselorDashboard({ data }: { data: FacilitatorDashboardData }) {
  const t = await getTranslations("rolePages.counselor");
  const tFacilitator = await getTranslations("facilitatorDashboard");
  const priorityLearners = data.learners.filter(
    (learner) => learner.signalTone === "coral" || learner.signalKey === "reflectionReceived",
  );

  return (
    <RoleWorkspace
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      primaryHref="/fasilitator"
      primaryLabel={t("primaryLabel")}
      relatedLinks={[
        {
          href: "/fasilitator",
          label: t("links.facilitator.label"),
          detail: t("links.facilitator.detail"),
        },
        {
          href: "/moderator",
          label: t("links.moderator.label"),
          detail: t("links.moderator.detail"),
        },
        {
          href: "/admin",
          label: t("links.admin.label"),
          detail: t("links.admin.detail"),
        },
      ]}
      cards={[
        {
          title: t("cards.priority.title"),
          body: t("cards.priority.body", { count: priorityLearners.length }),
        },
        {
          title: t("cards.classes.title"),
          body: t("cards.classes.body", { count: data.classes.length }),
        },
        {
          title: t("cards.activeStories.title"),
          body: t("cards.activeStories.body"),
        },
      ]}
      note={t("note")}
    >
      <section className="mb-8 rounded-sakti border border-sakti-gold/35 bg-sakti-gold/10 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
          {t("protocol.eyebrow")}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-sakti bg-white p-4">
            <h2 className="font-display text-xl font-semibold text-sakti-forestDark">{t("protocol.safeGreeting.title")}</h2>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
              {t("protocol.safeGreeting.body")}
            </p>
          </article>
          <article className="rounded-sakti bg-white p-4">
            <h2 className="font-display text-xl font-semibold text-sakti-forestDark">{t("protocol.escalation.title")}</h2>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
              {t("protocol.escalation.body")}
            </p>
          </article>
          <article className="rounded-sakti bg-white p-4">
            <h2 className="font-display text-xl font-semibold text-sakti-forestDark">{t("protocol.boundary.title")}</h2>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
              {t("protocol.boundary.body")}
            </p>
          </article>
        </div>
      </section>
      <section className="rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
            {t("attention.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("attention.body")}
          </p>
        </div>
        <div className="divide-y divide-sakti-mist">
          {priorityLearners.map((learner) => (
            <article key={`${learner.studentId ?? learner.name}-${learner.story}`} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold text-sakti-forestDark">
                    {learner.name}
                  </h3>
                  <p className="mt-1 text-sm text-sakti-forestDark/65">
                    {learner.className} - {learner.story}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass[learner.signalTone]}`}>
                  {tFacilitator(`learnerSignals.${learner.signalKey}`)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-sakti-forestDark/75">
                {t("attention.followUp", { action: tFacilitator(`learnerActions.${learner.actionKey}`) })}
              </p>
              {learner.studentId ? (
                <form action={createCounselorFollowUp} className="mt-4 space-y-3">
                  <input type="hidden" name="student_id" value={learner.studentId} />
                  <input type="hidden" name="class_id" value={learner.classId ?? ""} />
                  <textarea
                    name="body"
                    rows={3}
                    placeholder={t("attention.placeholder")}
                    className="w-full rounded-sakti border border-sakti-mist bg-white px-3 py-2 text-sm outline-none focus:border-sakti-forest"
                  />
                  <button type="submit" className="rounded-full bg-sakti-forest px-4 py-2 text-sm font-semibold text-white">
                    {t("attention.save")}
                  </button>
                </form>
              ) : null}
            </article>
          ))}
          {priorityLearners.length === 0 ? (
            <p className="p-5 text-sm leading-6 text-sakti-forestDark/70">
              {t("attention.empty")}
            </p>
          ) : null}
        </div>
      </section>
    </RoleWorkspace>
  );
}
