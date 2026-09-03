import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Pembungkus next/navigation & next/link yang locale-aware — pakai ini
// (bukan langsung dari "next/navigation"/"next/link") di seluruh komponen
// supaya perpindahan halaman selalu mempertahankan locale aktif.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
