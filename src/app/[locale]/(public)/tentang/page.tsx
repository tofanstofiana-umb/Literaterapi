import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const principleKeys = ["reflective", "nonClinical", "safeCompanion"] as const;
const saktiSteps = [
  ["S", "sadar"],
  ["A", "aktif"],
  ["K", "kritis"],
  ["T", "terbuka"],
  ["I", "imersif"],
] as const;

export default function TentangPage() {
  const t = useTranslations("aboutPage");
  const tPublicHome = useTranslations("publicHome");
  const tSakti = useTranslations("sakti");

  return (
    <div className="bg-sakti-paper">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-sakti-forestDark sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-base leading-8 text-sakti-forestDark/75">
            {t("body")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/daftar"
              className="rounded-full bg-sakti-forest px-6 py-3 font-semibold text-white"
            >
              {t("register")}
            </Link>
            <Link
              href="/panduan"
              className="rounded-full border border-sakti-forest px-6 py-3 font-semibold text-sakti-forest"
            >
              {t("guide")}
            </Link>
          </div>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-sakti border border-sakti-mist bg-white shadow-sm">
          <Image
            src="/assets/avatars/avatar-netral.png"
            alt={t("avatarAlt")}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="border-y border-sakti-mist/70 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {principleKeys.map((key) => (
            <article key={key} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-5">
              <h2 className="font-display text-xl font-semibold text-sakti-forestDark">
                {t(`principles.${key}.title`)}
              </h2>
              <p className="mt-3 text-sm leading-6 text-sakti-forestDark/70">
                {t(`principles.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("flowEyebrow")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-sakti-forestDark">
            {tPublicHome("stepEyebrow")}
          </h2>
          <p className="mt-4 text-base leading-7 text-sakti-forestDark/75">
            {t("flowBody")}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {saktiSteps.map(([letter, step]) => (
            <article key={letter} className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sakti-forest font-display text-lg font-semibold text-white">
                {letter}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-sakti-forestDark">
                {tSakti(step)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
                {tPublicHome(`steps.${step}`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-sakti-forest text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">{t("boundaryTitle")}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85">
            {t("boundaryBody")}
          </p>
        </div>
      </section>
    </div>
  );
}
