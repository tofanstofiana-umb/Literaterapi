"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Tombol keluar minimal dipakai di seluruh area beratap (siswa/fasilitator,
// admin, dan penelitian). Sengaja tidak menampilkan dialog konfirmasi.
export default function SignOutButton() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    setPending(true);
    await supabase.auth.signOut();
    setPending(false);
    window.location.assign(locale === "id-ID" ? "/" : `/${locale}`);
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="tap-target shrink-0 rounded-full border-2 border-sakti-forest bg-white px-3 py-2 text-sm font-black text-sakti-forest shadow-sm transition hover:bg-sakti-mist/35 disabled:opacity-60 sm:px-4"
    >
      {pending ? tCommon("processing") : t("logout")}
    </button>
  );
}
