import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const dataItems = ["account", "preferences", "reading", "companionNotes"] as const;
const purposes = ["access", "dashboard", "companion", "security"] as const;
const rights = ["explanation", "correction", "deletion", "refusal"] as const;
const notDoing = ["noSale", "noAds", "noPeerReflection", "noProgressClaim"] as const;

export default function PrivasiPage() {
  const t = useTranslations("privacyPage");

  return (
    <div className="bg-sakti-paper">
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-sakti-forestDark sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-sakti-forestDark/75">
          {t("body")}
        </p>
      </section>

      <section className="border-y border-sakti-mist/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-sakti-forestDark">
            {t("dataTitle")}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {dataItems.map((item) => (
              <article key={item} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-5">
                <h3 className="font-display text-xl font-semibold text-sakti-forestDark">{t(`dataItems.${item}.title`)}</h3>
                <p className="mt-3 text-sm leading-6 text-sakti-forestDark/70">{t(`dataItems.${item}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div className="rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
          <h2 className="font-display text-3xl font-semibold text-sakti-forestDark">
            {t("purposesTitle")}
          </h2>
          <ul className="mt-5 space-y-3">
            {purposes.map((item) => (
              <li key={item} className="rounded-xl bg-sakti-paper p-4 text-sm leading-6 text-sakti-forestDark/75">
                {t(`purposes.${item}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
          <h2 className="font-display text-3xl font-semibold text-sakti-forestDark">
            {t("rightsTitle")}
          </h2>
          <ul className="mt-5 space-y-3">
            {rights.map((item) => (
              <li key={item} className="rounded-xl bg-sakti-paper p-4 text-sm leading-6 text-sakti-forestDark/75">
                {t(`rights.${item}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
              {t("notDoingTitle")}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-sakti-forestDark/75">
              {notDoing.map((item) => (
                <p key={item}>{t(`notDoing.${item}`)}</p>
              ))}
            </div>
          </div>

          <div className="rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
              {t("storageTitle")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-sakti-forestDark/75">
              {t("storageBody1")}
            </p>
            <p className="mt-3 text-sm leading-7 text-sakti-forestDark/75">
              {t("storageBody2")}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sakti-forest text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">{t("principlesTitle")}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85">
            {t("principlesBody")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022"
              className="rounded-full border border-white px-5 py-2 text-sm font-semibold text-white"
            >
              UU PDP Indonesia
            </a>
            <a
              href="https://www.oecd.org/en/publications/oecd-guidelines-on-the-protection-of-privacy-and-transborder-flows-of-personal-data_9789264196391-en.html"
              className="rounded-full border border-white px-5 py-2 text-sm font-semibold text-white"
            >
              OECD Privacy Guidelines
            </a>
            <Link
              href="/panduan"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-sakti-forest"
            >
              {t("readGuide")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
