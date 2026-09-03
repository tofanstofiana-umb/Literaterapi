import { getTranslations } from "next-intl/server";
import { getAllCategorySlugs, getStoryCountries } from "@/content/stories";
import type { ChartDatum, ResearchAggregateData } from "@/lib/research/dashboardData";
import RoleWorkspace from "./RoleWorkspace";

export default function ResearcherDashboard({ data }: { data: ResearchAggregateData }) {
  const tPromise = getTranslations("rolePages.researcher");
  return <ResearcherDashboardContent data={data} tPromise={tPromise} />;
}

function BarChartCard({
  title,
  body,
  empty,
  data,
}: {
  title: string;
  body: string;
  empty: string;
  data: ChartDatum[];
}) {
  const maxValue = Math.max(1, ...data.map((row) => row.value));

  return (
    <article className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
      <h3 className="font-display text-xl font-semibold leading-tight text-sakti-forestDark">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">{body}</p>
      <div className="mt-5 space-y-4">
        {data.map((row) => {
          const width = Math.max(8, Math.round((row.value / maxValue) * 100));
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="min-w-0 truncate font-semibold text-sakti-forestDark">{row.label}</p>
                <p className="shrink-0 font-display text-lg font-semibold text-sakti-forest">{row.value}</p>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-sakti-mist">
                <div
                  className="h-full rounded-full bg-sakti-forest"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-sakti-mist bg-sakti-paper/70 p-4 text-sm leading-6 text-sakti-forestDark/65">
            {empty}
          </p>
        ) : null}
      </div>
    </article>
  );
}

async function ResearcherDashboardContent({
  data,
  tPromise,
}: {
  data: ResearchAggregateData;
  tPromise: ReturnType<typeof getTranslations>;
}) {
  const t = await tPromise;
  const tCategories = await getTranslations("categories");

  return (
    <RoleWorkspace
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      relatedLinks={[
        {
          href: "/ahli",
          label: t("links.expert.label"),
          detail: t("links.expert.detail"),
        },
        {
          href: "/editor-konten",
          label: t("links.editor.label"),
          detail: t("links.editor.detail"),
        },
        {
          href: "/admin",
          label: t("links.admin.label"),
          detail: t("links.admin.detail"),
        },
      ]}
      cards={[
        {
          title: t("cards.students.title"),
          body: t("cards.students.body", { count: data.totals.students }),
        },
        {
          title: t("cards.classes.title"),
          body: t("cards.classes.body", { count: data.totals.classes }),
        },
        {
          title: t("cards.traces.title"),
          body: t("cards.traces.body", {
            progress: data.totals.readingProgress,
            reflections: data.totals.reflections,
          }),
        },
      ]}
      note={t("note")}
    >
      <section className="rounded-sakti border border-sakti-mist bg-white shadow-sm">
        <div className="border-b border-sakti-mist p-5">
          <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
            {t("aggregate.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
            {t("aggregate.body")}
          </p>
        </div>
        <form className="grid gap-4 border-b border-sakti-mist p-5 md:grid-cols-5">
          <label className="text-sm font-semibold text-sakti-forestDark">
            {t("filters.dateFrom")}
            <input
              type="date"
              name="dateFrom"
              defaultValue={data.filters.dateFrom ?? ""}
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-sakti-forestDark">
            {t("filters.dateTo")}
            <input
              type="date"
              name="dateTo"
              defaultValue={data.filters.dateTo ?? ""}
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-sakti-forestDark">
            {t("filters.country")}
            <select
              name="country"
              defaultValue={data.filters.country ?? ""}
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm"
            >
              <option value="">{t("filters.all")}</option>
              {getStoryCountries().map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-sakti-forestDark">
            {t("filters.category")}
            <select
              name="category"
              defaultValue={data.filters.category ?? ""}
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm"
            >
              <option value="">{t("filters.all")}</option>
              {getAllCategorySlugs().map((category) => (
                <option key={category} value={category}>
                  {tCategories(category)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-sakti-forestDark">
            {t("filters.class")}
            <select
              name="classId"
              defaultValue={data.filters.classId ?? ""}
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-3 py-2 text-sm"
            >
              <option value="">{t("filters.all")}</option>
              {data.classOptions.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-3 md:col-span-5">
            <button type="submit" className="rounded-full bg-sakti-forest px-5 py-2 text-sm font-semibold text-white">
              {t("filters.apply")}
            </button>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(data.csv)}`}
              download="literaterapi-agregat-anonim.csv"
              className="rounded-full border border-sakti-forest px-5 py-2 text-sm font-semibold text-sakti-forest"
            >
              {t("filters.export")}
            </a>
          </div>
        </form>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            [t("totals.stories"), data.totals.stories],
            [t("totals.students"), data.totals.students],
            [t("totals.classes"), data.totals.classes],
            [t("totals.progress"), data.totals.readingProgress],
            [t("totals.reflections"), data.totals.reflections],
          ].map(([label, value]) => (
            <div key={label} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">{label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-sakti-forestDark">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 border-t border-sakti-mist p-5 lg:grid-cols-2">
          <BarChartCard
            title={t("charts.saktiStages.title")}
            body={t("charts.saktiStages.body")}
            empty={t("charts.empty")}
            data={data.charts.saktiStages}
          />
          <BarChartCard
            title={t("charts.progressBuckets.title")}
            body={t("charts.progressBuckets.body")}
            empty={t("charts.empty")}
            data={data.charts.progressBuckets}
          />
          <BarChartCard
            title={t("charts.storyCountries.title")}
            body={t("charts.storyCountries.body")}
            empty={t("charts.empty")}
            data={data.charts.storyCountries}
          />
          <BarChartCard
            title={t("charts.publicCategories.title")}
            body={t("charts.publicCategories.body")}
            empty={t("charts.empty")}
            data={data.charts.publicCategories}
          />
        </div>
        <div className="border-t border-sakti-mist p-5">
          <h3 className="font-display text-xl font-semibold text-sakti-forestDark">
            {t("popular.title")}
          </h3>
          <div className="mt-4 space-y-3">
            {data.popularStories.map((story) => (
              <div key={story.slug} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4">
                <p className="font-semibold text-sakti-forestDark">{story.title}</p>
                <p className="mt-1 text-sm text-sakti-forestDark/70">
                  {t("popular.count", { count: story.count })}
                </p>
              </div>
            ))}
            {data.popularStories.length === 0 ? (
              <p className="text-sm leading-6 text-sakti-forestDark/70">
                {t("popular.empty")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="border-t border-sakti-mist p-5">
          <BarChartCard
            title={t("charts.popularStories.title")}
            body={t("charts.popularStories.body")}
            empty={t("popular.empty")}
            data={data.charts.popularStories}
          />
        </div>
        {!data.configured ? (
          <p className="border-t border-sakti-mist p-5 text-sm leading-6 text-sakti-forestDark/70">
            {t("aggregate.unconfigured")}
          </p>
        ) : null}
      </section>
    </RoleWorkspace>
  );
}
