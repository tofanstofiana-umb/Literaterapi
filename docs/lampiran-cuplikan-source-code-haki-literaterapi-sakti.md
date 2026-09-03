# Lampiran Cuplikan Source Code

**Nama ciptaan:** LITERATERAPI-SAKTI  
**Jenis ciptaan:** Program komputer/aplikasi web edukatif  
**Versi lampiran:** v0.1.0-HAKI-draft-2026-08-08  
**Pengembang aplikasi:** Vismaia S. Damaianti; Rosita Rahma; Lira Fessia Damaianti; Tofan Stofiana; Dedi Irawan; Muhammad Pahruroji  
**Catatan versi/commit:** Salinan workspace ini tidak sedang terbaca sebagai repository Git aktif. Kolom versi/commit pada lampiran ini diisi dengan versi aplikasi dan tanggal draft. Jika tersedia, ganti dengan commit produksi dari GitHub/Vercel sebelum pengajuan final.

Lampiran ini berisi cuplikan kode sumber yang representatif untuk menunjukkan rancangan teknis LITERATERAPI-SAKTI. Cuplikan dipilih dari bagian aplikasi yang menunjukkan proteksi akses, pemisahan peran, dashboard siswa, dukungan dua bahasa, alur editor konten, data penelitian agregat, dan skema basis data Supabase.

---

## 1. Proteksi Rute Aplikasi

| Elemen | Isian |
| --- | --- |
| Nama file/path | `src/middleware.ts` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Mengatur proteksi awal rute aplikasi agar halaman cerita, dashboard siswa, dan dashboard role tidak dapat diakses tanpa sesi pengguna. |

```ts
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

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name, value }) => {
    const isSupabaseCookie = name.startsWith("sb-");
    const isAuthCookie = name.includes("auth-token") || name.includes("access-token") || name.includes("refresh-token");
    return isSupabaseCookie && isAuthCookie && value.length > 0;
  });
}

export function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  if (isProtectedPath(request.nextUrl.pathname) && !hasSupabaseAuthCookie(request)) {
    return NextResponse.redirect(new URL(getLocaleAwareLoginPath(request.nextUrl.pathname), request.url));
  }

  return response;
}
```

**Catatan orisinalitas:** Potongan ini menunjukkan rancangan akses privat LITERATERAPI-SAKTI yang membedakan area publik dan area pengguna terdaftar, termasuk dukungan locale Indonesia/Malaysia.

---

## 2. Pengamanan Role Server-Side

| Elemen | Isian |
| --- | --- |
| Nama file/path | `src/lib/permissions/requireRole.ts` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Menjaga akses halaman berdasarkan peran pengguna, seperti siswa, fasilitator, konselor, editor konten, ahli, peneliti, moderator, dan administrator. |

```ts
export async function requireRole(allowed: AppRole[]): Promise<CurrentUser> {
  const locale = await getLocale();
  const user = await getCurrentUser();

  if (!user) {
    redirect({ href: "/masuk", locale });
    throw new Error("unreachable: redirect() seharusnya sudah melempar");
  }

  if (!hasAnyRole(user.roles, [...allowed, "admin"])) {
    redirect({ href: "/", locale });
    throw new Error("unreachable: redirect() seharusnya sudah melempar");
  }

  return user;
}
```

**Catatan orisinalitas:** Potongan ini menunjukkan pola pemisahan dashboard sesuai role dengan administrator sebagai pengawas lintas-peran.

---

## 3. Preferensi Siswa: Avatar, Tema, dan Bahasa

| Elemen | Isian |
| --- | --- |
| Nama file/path | `src/lib/student/actions.ts` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Menyimpan preferensi siswa berupa avatar, tema visual, dan bahasa antarmuka Indonesia/Malaysia. |

```ts
const AVATAR_KEYS = new Set(["laki", "netral", "perempuan"]);
const THEME_KEYS = new Set(["rimba", "mentari", "samudra", "senja"]);
const LOCALE_KEYS = new Set(["id-ID", "ms-MY"]);

export async function saveStudentPreferences(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const t = await getTranslations("actionMessages.student");
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!supabase || !currentUser) {
    return { ok: false, message: t("sessionMissing") };
  }

  const avatarKey = String(formData.get("avatar") ?? "netral");
  const themeKey = String(formData.get("theme") ?? "mentari");
  const interfaceLanguage = String(formData.get("interface_language") ?? "id-ID");

  if (!AVATAR_KEYS.has(avatarKey) || !THEME_KEYS.has(themeKey) || !LOCALE_KEYS.has(interfaceLanguage)) {
    return { ok: false, message: t("invalidPreference") };
  }

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: currentUser.id,
      interface_language: interfaceLanguage,
      avatar_config: { avatar: avatarKey, theme: themeKey },
      theme: themeKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { ok: false, message: t("preferenceSaveFailed") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/id-ID/dashboard");
  revalidatePath("/ms-MY/dashboard");
  return { ok: true, message: t("preferenceSaved") };
}
```

**Catatan orisinalitas:** Potongan ini menunjukkan personalisasi siswa yang menghubungkan avatar, tema visual, dan pilihan bahasa.

---

## 4. Dashboard Siswa: Avatar, Tema, Misi, dan Poin

| Elemen | Isian |
| --- | --- |
| Nama file/path | `src/components/student/StudentDashboard.tsx` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Menampilkan dashboard siswa berisi avatar, tema, progres membaca, misi gamifikasi, leaderboard, dan pilihan cerita. |

```tsx
const AVATARS = [
  { key: "laki", image: "/assets/avatars/avatar-laki.png", theme: "samudra" },
  { key: "netral", image: "/assets/avatars/avatar-netral.png", theme: "mentari" },
  { key: "perempuan", image: "/assets/avatars/avatar-perempuan.png", theme: "senja" },
] as const;

const THEMES: Record<string, { label: string; accent: string; accentDark: string; soft: string }> = {
  rimba: { label: "Rimba", accent: "#2F6D5C", accentDark: "#1C3D33", soft: "#E8F1EC" },
  mentari: { label: "Mentari", accent: "#D08A24", accentDark: "#5C3510", soft: "#FFF0D4" },
  samudra: { label: "Samudra", accent: "#2F6EA5", accentDark: "#173A59", soft: "#E6F0FA" },
  senja: { label: "Senja", accent: "#B85C5A", accentDark: "#5A272C", soft: "#FCE7E3" },
};

function MissionList({ missions }: { missions: StudentDashboardData["gamification"]["missions"] }) {
  const t = useTranslations("studentDashboard");

  return (
    <div className="mt-4 space-y-3">
      {missions.map((mission) => (
        <div
          key={mission.label}
          className={`grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 ${
            mission.completed
              ? "border-[var(--student-accent)] bg-[var(--student-soft)]"
              : "border-sakti-mist bg-sakti-paper/60"
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black">
            {mission.completed ? t("missionComplete") : "XP"}
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-sakti-forestDark">{missionLabel(mission.label)}</span>
            <span className="mt-0.5 block text-xs leading-5 text-sakti-forestDark/68">
              {missionDetail(mission.detail)}
            </span>
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[var(--student-accent)]">
            +{mission.xp}
          </span>
        </div>
      ))}
    </div>
  );
}
```

**Catatan orisinalitas:** Potongan ini menunjukkan rancangan gamifikasi LITERATERAPI-SAKTI berupa misi, XP, tema berbasis avatar, dan dashboard progres siswa.

---

## 5. Dukungan Cerita Dua Bahasa

| Elemen | Isian |
| --- | --- |
| Nama file/path | `src/hooks/useAutoTranslatedStory.ts` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Mengatur pemilihan cerita dalam bahasa Indonesia atau Melayu Malaysia melalui terjemahan statis, cache lokal, atau endpoint penerjemahan jika tersedia. |

```ts
function getCacheKey(story: PreparedStory, targetLocale: TranslationLocale, includeParagraphs: boolean) {
  return [
    "literaterapi",
    "auto-translation",
    story.slug,
    story.originalLanguage,
    targetLocale,
    getStorySignature(story, includeParagraphs),
  ].join(":");
}

export function useAutoTranslatedStory(
  story: PreparedStory,
  options: UseAutoTranslatedStoryOptions = {},
) {
  const activeLocale = useLocale();
  const targetLocale =
    options.targetLocale ??
    (isTranslationLocale(activeLocale) ? activeLocale : story.originalLanguage);

  useEffect(() => {
    if (targetLocale === story.originalLanguage) {
      setStatus("original");
      return;
    }

    const staticTranslation = getStaticStoryTranslation(story, targetLocale);
    if (staticTranslation) {
      setTranslatedStory(applyStaticStoryTranslation(story, staticTranslation, includeParagraphs));
      setStatus("static");
      return;
    }

    const cacheKey = getCacheKey(story, targetLocale, includeParagraphs);
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as TranslationCache;
      setTranslatedStory(storyFromFields(story, parsed.fields, includeParagraphs));
      setStatus("ready");
      return;
    }
  }, [fields, includeParagraphs, story, targetLocale]);
}
```

**Catatan orisinalitas:** Potongan ini menunjukkan strategi aplikasi untuk melayani pengguna Indonesia dan Malaysia tanpa memaksa satu bahasa saja.

---

## 6. Editor Konten: Draft Cerita dan Aset Adegan

| Elemen | Isian |
| --- | --- |
| Nama file/path | `src/lib/roles/editorStoryDrafts.ts` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Mengelola draft cerita, status editorial, metadata bahasa, kategori publik, aset sampul, aset adegan, dan prompt S-A-K-T-I. |

```ts
export const EDITOR_STORY_DRAFT_STATUSES = [
  "draft",
  "editing",
  "linguistic_review",
  "literary_review",
  "cultural_review",
  "psychological_review",
  "approved",
  "ready_to_publish",
  "archived",
] as const;

export interface EditorSceneAsset {
  url: string;
  alt: string;
  placement: string;
}

export interface EditorSaktiPrompts {
  sadar?: string;
  aktif?: string;
  kritis?: string;
  terbuka?: string;
  imersif?: string;
}

export interface EditorStoryDraft {
  id: string;
  slug: string;
  titleId: string;
  titleMs: string | null;
  synopsisId: string;
  synopsisMs: string | null;
  originCountry: "Indonesia" | "Malaysia";
  originalLanguage: "id-ID" | "ms-MY";
  publicCategorySlugs: string[];
  coverImageUrl: string | null;
  sceneAssets: EditorSceneAsset[];
  saktiPrompts: EditorSaktiPrompts;
  editorialStatus: EditorStoryDraftStatus;
}
```

**Catatan orisinalitas:** Potongan ini menunjukkan sistem editorial internal untuk membuat konten cerita lengkap dengan gambar adegan dan prompt refleksi.

---

## 7. Dashboard Peneliti: Data Agregat Anonim

| Elemen | Isian |
| --- | --- |
| Nama file/path | `src/lib/research/dashboardData.ts` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Menyusun data penelitian agregat tanpa menampilkan identitas siswa, termasuk filter tanggal, negara, kategori cerita, kelas, grafik, dan ekspor CSV. |

```ts
export interface ResearchAggregateFilters {
  dateFrom?: string;
  dateTo?: string;
  country?: StoryOriginCountry;
  category?: StoryCategorySlug;
  classId?: string;
}

export interface ResearchAggregateData {
  configured: boolean;
  filters: ResearchAggregateFilters;
  classOptions: ResearchClassOption[];
  csv: string;
  totals: {
    students: number;
    classes: number;
    readingProgress: number;
    reflections: number;
    stories: number;
  };
  popularStories: Array<{
    slug: string;
    title: string;
    count: number;
  }>;
  charts: {
    saktiStages: ChartDatum[];
    storyCountries: ChartDatum[];
    publicCategories: ChartDatum[];
    progressBuckets: ChartDatum[];
    popularStories: ChartDatum[];
  };
}

function buildCsv(rows: ResearchAggregateData["popularStories"]) {
  const header = ["story_slug", "judul", "jumlah_progres_anonim"];
  return [
    header.map(csvEscape).join(","),
    ...rows.map((row) => [row.slug, row.title, row.count].map(csvEscape).join(",")),
  ].join("\n");
}
```

**Catatan orisinalitas:** Potongan ini menunjukkan desain penelitian agregat yang menjaga data siswa tetap anonim dan hanya menampilkan ringkasan.

---

## 8. Skema Supabase: Role, Profil, dan RLS

| Elemen | Isian |
| --- | --- |
| Nama file/path | `supabase/migrations/0001_core_schema.sql` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Membuat struktur awal basis data, fungsi peran, trigger akun baru, dan Row Level Security. |

```sql
create or replace function public.has_role(p_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = p_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.has_role('admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'siswa')
  on conflict (user_id, role) do nothing;

  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_preferences enable row level security;
```

**Catatan orisinalitas:** Potongan ini menunjukkan rancangan basis data LITERATERAPI-SAKTI untuk role, akun siswa otomatis, preferensi pengguna, dan pembatasan akses data.

---

## Checklist Finalisasi Lampiran

- [ ] Ganti `v0.1.0-HAKI-draft-2026-08-08` dengan commit produksi apabila tersedia.
- [ ] Pastikan tidak ada rahasia aplikasi seperti `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, atau `OPENAI_API_KEY`.
- [ ] Pastikan cuplikan kode tidak memuat data pribadi siswa.
- [ ] Cetak/lampirkan bersama screenshot aplikasi dan naskah akademik.
- [ ] Simpan versi final lampiran dalam format DOCX/PDF.
