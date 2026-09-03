import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export interface RoleWorkspaceCard {
  title: string;
  body: string;
}

export default function RoleWorkspace({
  eyebrow,
  title,
  description,
  cards,
  primaryHref,
  primaryLabel,
  relatedLinks = [],
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cards: RoleWorkspaceCard[];
  primaryHref?: string;
  primaryLabel?: string;
  relatedLinks?: Array<{
    href: string;
    label: string;
    detail: string;
  }>;
  note: string;
  children?: React.ReactNode;
}) {
  const tPromise = getTranslations("roleWorkspace");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <RoleWorkspaceContent
        tPromise={tPromise}
        eyebrow={eyebrow}
        title={title}
        description={description}
        cards={cards}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        relatedLinks={relatedLinks}
        note={note}
      >
        {children}
      </RoleWorkspaceContent>
    </div>
  );
}

async function RoleWorkspaceContent({
  tPromise,
  eyebrow,
  title,
  description,
  cards,
  primaryHref,
  primaryLabel,
  relatedLinks,
  note,
  children,
}: {
  tPromise: ReturnType<typeof getTranslations>;
  eyebrow: string;
  title: string;
  description: string;
  cards: RoleWorkspaceCard[];
  primaryHref?: string;
  primaryLabel?: string;
  relatedLinks: Array<{
    href: string;
    label: string;
    detail: string;
  }>;
  note: string;
  children?: React.ReactNode;
}) {
  const t = await tPromise;

  return (
    <>
      <section className="rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-sakti-forestDark sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-sakti-forestDark/75">
          {description}
        </p>
        {primaryHref && primaryLabel ? (
          <Link
            href={primaryHref}
            className="mt-6 inline-flex rounded-full bg-sakti-forest px-5 py-3 text-sm font-semibold text-white"
          >
            {primaryLabel}
          </Link>
        ) : null}
      </section>

      {relatedLinks.length > 0 ? (
        <section className="mt-8 rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("integrationEyebrow")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
            {t("integrationTitle")}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4 transition hover:border-sakti-forest hover:bg-white"
              >
                <p className="font-semibold text-sakti-forestDark">{link.label}</p>
                <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">{link.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-sakti-forestDark">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-sakti-forestDark/70">{card.body}</p>
          </article>
        ))}
      </section>

      {children ? <div className="mt-8">{children}</div> : null}

      <section className="mt-8 rounded-sakti border border-sakti-gold/40 bg-sakti-gold/10 p-5">
        <h2 className="font-display text-xl font-semibold text-sakti-forestDark">{t("safeBoundary")}</h2>
        <p className="mt-3 text-sm leading-7 text-sakti-forestDark/75">{note}</p>
      </section>
    </>
  );
}
