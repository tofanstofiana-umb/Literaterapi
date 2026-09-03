import { useTranslations } from "next-intl";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { STORIES } from "@/content/stories";
import StoryCard from "@/components/stories/StoryCard";

const saktiSteps = ["sadar", "aktif", "kritis", "terbuka", "imersif"] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("publicHome");
  const tSakti = useTranslations("sakti");
  const featuredStories = STORIES.slice(0, 3);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/general/hero-literaterapi-remaja.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-[0.78] contrast-[1.08]"
          />
          <div className="absolute inset-0 bg-sakti-forestDark/68" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,49,46,0.96)_0%,rgba(2,49,46,0.82)_38%,rgba(2,49,46,0.45)_72%,rgba(2,49,46,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,49,46,0.52)_0%,rgba(2,49,46,0)_42%)]" />
        </div>
        <div className="relative mx-auto flex min-h-[430px] max-w-5xl flex-col justify-center px-4 py-16 text-white sm:min-h-[520px] sm:px-6 sm:py-20">
          <p
            className="font-display text-3xl font-black uppercase tracking-wide text-sakti-gold sm:text-5xl"
            style={{ textShadow: "0 4px 18px rgba(0,0,0,0.72)" }}
          >
            LITERATERAPI SAKTI
          </p>
          <h1
            className="mt-5 w-full font-display text-sm font-black uppercase leading-tight text-white min-[420px]:text-base sm:text-2xl md:text-3xl lg:text-4xl"
            style={{ textShadow: "0 5px 22px rgba(0,0,0,0.82), 0 1px 0 rgba(0,0,0,0.65)" }}
          >
            <span className="block whitespace-nowrap">RUANG MEMBACA REFLEKTIF</span>
            <span className="block whitespace-nowrap">UNTUK MENGENAL DIRI</span>
            <span className="block whitespace-nowrap">DAN SESAMA</span>
          </h1>
          <p
            className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white"
            style={{ textShadow: "0 3px 14px rgba(0,0,0,0.78)" }}
          >
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/pustaka"
              className="tap-target inline-flex items-center justify-center rounded-sakti bg-sakti-gold px-6 py-3 font-semibold text-sakti-forestDark"
            >
              {t("ctaStart")}
            </Link>
            <Link
              href="/pustaka"
              className="tap-target inline-flex items-center justify-center rounded-sakti border border-white/80 px-6 py-3 font-semibold text-white"
            >
              {t("ctaLibrary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-sakti-mist/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-xs font-black uppercase tracking-wide text-sakti-gold">
            {t("stepEyebrow")}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {saktiSteps.map((step) => (
              <article key={step} className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4">
                <h2 className="font-display text-xl font-semibold text-sakti-forestDark">
                  {tSakti(step)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
                  {t(`steps.${step}`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
              {t("libraryEyebrow")}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
              {t("libraryTitle")}
            </h2>
          </div>
          <Link href="/pustaka" className="font-semibold text-sakti-forest underline">
            {t("libraryAll")}
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {featuredStories.map((story) => (
            <StoryCard key={story.slug} story={story} />
          ))}
        </div>
      </section>
    </div>
  );
}
