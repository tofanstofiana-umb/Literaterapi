"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import SignOutButton from "@/components/auth/SignOutButton";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import SaktiLogo from "@/components/layout/SaktiLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { getPrimaryRoleHome, type AppRole } from "@/types/roles";

export default function PublicHeader() {
  const t = useTranslations("nav");
  const [userHomeHref, setUserHomeHref] = useState<string | null>(null);
  const navLinkClass =
    "tap-target inline-flex shrink-0 items-center rounded-full px-3 py-2 font-semibold text-sakti-forestDark/78 transition hover:bg-sakti-mist/55 hover:text-sakti-forestDark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sakti-forest/15 sm:px-3.5";

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    if (!supabase) return;
    const client = supabase;

    async function syncSessionHome() {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!mounted) return;
      if (!user) {
        setUserHomeHref(null);
        return;
      }

      const { data } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (data ?? []).map((row) => row.role as AppRole);
      setUserHomeHref(getPrimaryRoleHome(roles));
    }

    void syncSessionHome();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      void syncSessionHome();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-sakti-mist/70 border-t-4 border-t-sakti-gold bg-sakti-paper/96 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <SaktiLogo href={userHomeHref ?? "/"} />
        </div>
        <nav className="mobile-scroll-row -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 pb-1 text-sm sm:mx-0 sm:w-auto sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0 sm:pb-0">
          <Link href="/pustaka" className={navLinkClass}>{t("library")}</Link>
          <Link href="/tentang" className={navLinkClass}>{t("about")}</Link>
          <Link href="/panduan" className={navLinkClass}>{t("guide")}</Link>
          <Link href="/privasi" className={navLinkClass}>{t("privacy")}</Link>
          {userHomeHref ? (
            <>
              <Link
                href={userHomeHref}
                className="tap-target inline-flex shrink-0 items-center rounded-full bg-sakti-forest px-4 py-2 font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-sakti-forest/90 sm:px-5"
              >
                {t("myDashboard")}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/masuk"
                className="tap-target inline-flex shrink-0 items-center rounded-full border-2 border-sakti-forest bg-white px-4 py-2 font-black text-sakti-forest shadow-sm transition hover:-translate-y-0.5 hover:bg-sakti-mist/35 sm:px-5"
              >
                {t("login")}
              </Link>
              <Link
                href="/daftar"
                className="tap-target inline-flex shrink-0 items-center rounded-full bg-sakti-forest px-4 py-2 font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-sakti-forest/90 sm:px-5"
              >
                {t("register")}
              </Link>
            </>
          )}
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
