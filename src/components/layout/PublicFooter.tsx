import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import SaktiLogo from "@/components/layout/SaktiLogo";

export default function PublicFooter() {
  const t = useTranslations("publicHome");
  const tFooter = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tSakti = useTranslations("sakti");

  return (
    <footer className="mt-16 border-t border-sakti-mist/70 bg-sakti-mist/20">
      <div className="h-1 bg-sakti-gold" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 text-sm text-sakti-forestDark/80 sm:px-6 lg:grid-cols-[1fr_1.2fr_0.8fr]">
        <div>
          <SaktiLogo />
          <p className="mt-4 max-w-sm leading-6">
            {tFooter("description")}
          </p>
        </div>

        <section className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
          <p className="font-display text-xl font-black text-sakti-forestDark">
            {t("safetyNoteTitle")}
          </p>
          <p className="mt-3 leading-6 text-sakti-forestDark/76">{t("safetyNoteBody")}</p>
        </section>

        <nav aria-label={tFooter("navLabel")} className="lg:justify-self-end">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sakti-gold">
            {tFooter("explore")}
          </p>
          <div className="mt-3 grid gap-2">
            <Link className="tap-target inline-flex items-center rounded-full px-3 py-2 font-semibold hover:bg-sakti-mist/45" href="/pustaka">
              {tNav("library")}
            </Link>
            <Link className="tap-target inline-flex items-center rounded-full px-3 py-2 font-semibold hover:bg-sakti-mist/45" href="/tentang">
              {tNav("about")}
            </Link>
            <Link className="tap-target inline-flex items-center rounded-full px-3 py-2 font-semibold hover:bg-sakti-mist/45" href="/panduan">
              {tNav("guide")}
            </Link>
            <Link className="tap-target inline-flex items-center rounded-full px-3 py-2 font-semibold hover:bg-sakti-mist/45" href="/privasi">
              {tNav("privacy")}
            </Link>
          </div>
        </nav>
      </div>

      <div className="border-t border-sakti-mist/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-sakti-forestDark/62 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>LITERATERAPI-SAKTI</p>
          <div className="flex flex-wrap gap-2">
            {(["sadar", "aktif", "kritis", "terbuka", "imersif"] as const).map((stage) => (
              <span key={stage} className="rounded-full bg-white px-3 py-1 text-[11px] text-sakti-forest">
                {tSakti(stage)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
