import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES, routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = [
  "/pustaka",
  "/cerita",
  "/dashboard",
  "/fasilitator",
  "/konselor",
  "/moderator",
  "/editor-konten",
  "/ahli",
  "/peneliti",
  "/admin",
  "/penelitian",
  "/pendamping-preview",
];

function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/, "") || "/";
}

function isProtectedPath(pathname: string) {
  const pathWithoutLocale = stripLocalePrefix(pathname);
  return PROTECTED_PREFIXES.some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

function getLocaleAwareLoginPath(pathname: string) {
  const locale = LOCALES.find((item) => pathname === `/${item}` || pathname.startsWith(`/${item}/`));
  return locale && locale !== routing.defaultLocale ? `/${locale}/masuk` : "/masuk";
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name, value }) => {
    const isSupabaseCookie = name.startsWith("sb-");
    const isAuthCookie = name.includes("auth-token") || name.includes("access-token") || name.includes("refresh-token");
    return isSupabaseCookie && isAuthCookie && value.length > 0;
  });
}

// next-intl menentukan locale URL, lalu guard ringan memantulkan pengunjung
// yang jelas belum punya cookie sesi dari area privat. Validasi user dan role
// yang otoritatif tetap berada di Server Component melalui requireRole().
// Dengan pola ini middleware tetap kompatibel dengan Edge Runtime tanpa
// membawa @supabase/supabase-js ke bundle middleware.
export function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  if (isProtectedPath(request.nextUrl.pathname) && !hasSupabaseAuthCookie(request)) {
    return NextResponse.redirect(new URL(getLocaleAwareLoginPath(request.nextUrl.pathname), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
