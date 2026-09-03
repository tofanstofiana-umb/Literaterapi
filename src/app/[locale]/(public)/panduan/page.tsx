import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const schoolSteps = ["prepare", "createClass", "read", "followUp"] as const;
const parentGuidance = ["askStory", "supportWriting", "trustedAdult", "professionalHelp"] as const;
const safetyRules = ["noDiagnosis", "noPunishment", "noForcedSharing", "dataPurpose"] as const;

const avatarPreviewImages = [
  { src: "/assets/avatars/avatar-laki.png", altKey: "male" },
  { src: "/assets/avatars/avatar-netral.png", altKey: "neutral" },
  { src: "/assets/avatars/avatar-perempuan.png", altKey: "female" },
];

export default function PanduanPage() {
  const t = useTranslations("guidePage");

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
              {t("startRegister")}
            </Link>
            <Link
              href="/tentang"
              className="rounded-full border border-sakti-forest px-6 py-3 font-semibold text-sakti-forest"
            >
              {t("aboutProgram")}
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {avatarPreviewImages.map((image) => (
            <div
              key={image.src}
              className="relative aspect-[3/4] overflow-hidden rounded-sakti border border-sakti-mist bg-white shadow-sm"
            >
              <Image src={image.src} alt={t(`avatarAlt.${image.altKey}`)} fill sizes="160px" className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-sakti-mist/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-sakti-forestDark">
            {t("schoolFlowTitle")}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {schoolSteps.map((key) => (
              <article key={key} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-5">
                <h3 className="font-display text-xl font-semibold text-sakti-forestDark">{t(`schoolSteps.${key}.title`)}</h3>
                <p className="mt-3 text-sm leading-6 text-sakti-forestDark/70">{t(`schoolSteps.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("parentEyebrow")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-sakti-forestDark">
            {t("parentTitle")}
          </h2>
          <ul className="mt-5 space-y-3">
            {parentGuidance.map((item) => (
              <li key={item} className="rounded-sakti border border-sakti-mist bg-white p-4 text-sm leading-6 text-sakti-forestDark/75">
                {t(`parentGuidance.${item}`)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("safetyEyebrow")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-sakti-forestDark">
            {t("safetyTitle")}
          </h2>
          <ul className="mt-5 space-y-3">
            {safetyRules.map((item) => (
              <li key={item} className="rounded-sakti border border-sakti-mist bg-white p-4 text-sm leading-6 text-sakti-forestDark/75">
                {t(`safetyRules.${item}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-sakti-forest text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">{t("goalsTitle")}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85">
            {t("goalsBody")}
          </p>
        </div>
      </section>
    </div>
  );
}
