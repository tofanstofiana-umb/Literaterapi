import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

export default async function BantuanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({ locale, namespace: "helpPage" });

  const cards = ["student", "facilitator", "parent"] as const;
  const safetyItems = ["pause", "trustedAdult", "emergency"] as const;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight text-sakti-forestDark sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-sakti-forestDark/75">
        {t("body")}
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card} className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
              {t(`cards.${card}.title`)}
            </h2>
            <p className="mt-3 text-sm leading-7 text-sakti-forestDark/72">
              {t(`cards.${card}.body`)}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-sakti border border-sakti-gold/35 bg-sakti-gold/10 p-5">
        <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
          {t("safetyTitle")}
        </h2>
        <div className="mt-4 grid gap-3">
          {safetyItems.map((item) => (
            <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm leading-7 text-sakti-forestDark/75">
              <span className="font-semibold text-sakti-forestDark">{t(`safety.${item}.title`)}</span>{" "}
              {t(`safety.${item}.body`)}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
