"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useFormState } from "react-dom";
import { Link, useRouter } from "@/i18n/navigation";
import type { PreparedStory, StoryCategorySlug, StoryOriginCountry } from "@/content/stories";
import { joinFacilitatorClass, saveStudentPreferences, type StudentActionState } from "@/lib/student/actions";
import type { StudentDashboardData, StudentProgressItem } from "@/lib/student/dashboardData";

const AVATARS = [
  {
    key: "laki",
    image: "/assets/avatars/avatar-laki.png",
    theme: "samudra",
  },
  {
    key: "netral",
    image: "/assets/avatars/avatar-netral.png",
    theme: "mentari",
  },
  {
    key: "perempuan",
    image: "/assets/avatars/avatar-perempuan.png",
    theme: "senja",
  },
] as const;

type AvatarThemeKey = (typeof AVATARS)[number]["theme"];

const THEMES: Record<string, { label: string; accent: string; accentDark: string; soft: string }> = {
  rimba: {
    label: "Rimba",
    accent: "#2F6D5C",
    accentDark: "#1C3D33",
    soft: "#E8F1EC",
  },
  mentari: {
    label: "Mentari",
    accent: "#D08A24",
    accentDark: "#5C3510",
    soft: "#FFF0D4",
  },
  samudra: {
    label: "Samudra",
    accent: "#2F6EA5",
    accentDark: "#173A59",
    soft: "#E6F0FA",
  },
  senja: {
    label: "Senja",
    accent: "#B85C5A",
    accentDark: "#5A272C",
    soft: "#FCE7E3",
  },
};

const DEFAULT_AVATAR = AVATARS[0]!;
const DEFAULT_THEME = THEMES.rimba!;
const initialActionState: StudentActionState = {
  ok: false,
  message: "",
};

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-sakti-mist">
      <div className="h-full rounded-full bg-[var(--student-accent)]" style={{ width: `${value}%` }} />
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">{label}</p>
      <p className="mt-3 font-display text-3xl font-semibold text-[var(--student-dark)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">{detail}</p>
    </div>
  );
}

function MissionList({ missions }: { missions: StudentDashboardData["gamification"]["missions"] }) {
  const t = useTranslations("studentDashboard");

  function missionLabel(label: string) {
    const keyByLabel: Record<string, string> = {
      "Jelajah Hari Ini": "readToday",
      "Catatan S-A-K-T-I": "saktiNote",
      "Penjelajah Tekun": "deepExplorer",
      "Tim Pendamping": "companionTeam",
    };
    const key = keyByLabel[label];
    return key ? t(`missions.${key}.label`) : label;
  }

  function missionDetail(detail: string) {
    const keyByDetail: Record<string, string> = {
      "Buka atau lanjutkan satu cerpen.": "readToday",
      "Tulis satu refleksi pendek hari ini.": "saktiNote",
      "Capai 60% bagian dijelajahi pada satu cerita.": "deepExplorer",
      "Hubungkan akun dengan kode kelas.": "companionTeam",
    };
    const key = keyByDetail[detail];
    return key ? t(`missions.${key}.detail`) : detail;
  }

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
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${
              mission.completed
                ? "bg-[var(--student-accent)] text-white"
                : "border border-sakti-mist bg-white text-sakti-forestDark/65"
            }`}
          >
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

function Leaderboard({ entries }: { entries: StudentDashboardData["gamification"]["leaderboard"] }) {
  const t = useTranslations("studentDashboard");

  if (entries.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-sakti-mist bg-sakti-paper/60 p-4 text-sm leading-6 text-sakti-forestDark/70">
        {t("leaderboard.empty")}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {entries.map((entry) => (
        <div
          key={`${entry.rank}-${entry.label}`}
          className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
            entry.isCurrentUser
              ? "border-[var(--student-accent)] bg-[var(--student-soft)]"
              : "border-sakti-mist bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sakti-forest text-sm font-black text-white">
              {entry.rank}
            </span>
            <div>
              <p className="font-semibold text-sakti-forestDark">
                {entry.isCurrentUser ? t("leaderboard.you") : t("leaderboard.friend", { rank: entry.rank })}
              </p>
              <p className="text-xs text-sakti-forestDark/62">{t("leaderboard.anonymous")}</p>
            </div>
          </div>
          <p className="font-display text-lg font-black text-[var(--student-accent)]">{entry.xp} XP</p>
        </div>
      ))}
    </div>
  );
}

function ProgressRow({ item }: { item: StudentProgressItem }) {
  const locale = useLocale();
  const t = useTranslations("studentDashboard");

  return (
    <article className="rounded-sakti border border-sakti-mist bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-sakti-paper sm:w-24">
          {item.story?.coverUrl ? (
            <Image
              src={item.story.coverUrl}
              alt={`Sampul cerpen ${item.title}`}
              fill
              sizes="96px"
              className="object-contain"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("latest")}: {formatDate(item.updatedAt, locale, t("notSaved"))}
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-sakti-forestDark">{item.title}</h3>
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-sm text-sakti-forestDark/70">
              <span>{t("screenProgress")}</span>
              <span className="font-semibold text-[var(--student-accent)]">{item.progress}%</span>
            </div>
            <ProgressBar value={item.progress} />
          </div>
        </div>
        <Link
          href={`/cerita/${item.slug}/baca`}
          className="tap-target inline-flex w-full shrink-0 items-center justify-center rounded-full bg-[var(--student-accent)] px-4 py-2 text-sm font-semibold text-white sm:w-auto"
        >
          {t("continueReading")}
        </Link>
      </div>
    </article>
  );
}

function StoryChoiceCard({
  story,
  progress,
}: {
  story: PreparedStory;
  progress: StudentProgressItem | undefined;
}) {
  const t = useTranslations("studentDashboard");
  const tCategories = useTranslations("categories");
  const actionLabel = progress ? t("continueReading") : t("chooseStory");
  const actionHref = progress ? `/cerita/${story.slug}/baca` : `/cerita/${story.slug}`;

  return (
    <article className="overflow-hidden rounded-sakti border border-sakti-mist bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-sakti-paper sm:aspect-square">
        <Image
          src={story.coverUrl}
          alt={`Sampul cerpen ${story.title}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain"
        />
      </div>
      <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {story.originCountry} - {t("minutes", { count: story.readingEstimateMinutes })}
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-sakti-forestDark sm:text-xl">
            {story.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {story.publicCategorySlugs.slice(0, 3).map((category) => (
            <span
              key={category}
              className="rounded-full bg-[var(--student-soft)] px-3 py-1 text-xs font-semibold text-[var(--student-dark)]"
            >
              {tCategories(category)}
            </span>
          ))}
        </div>
        {progress ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-sakti-forestDark/70">
              <span>{t("screenProgress")}</span>
              <span className="font-semibold text-[var(--student-accent)]">{progress.progress}%</span>
            </div>
            <ProgressBar value={progress.progress} />
          </div>
        ) : (
          <p className="line-clamp-2 text-sm leading-6 text-sakti-forestDark/70">{story.excerpt}</p>
        )}
        <Link
          href={actionHref}
          className="tap-target inline-flex w-full items-center justify-center rounded-full bg-[var(--student-accent)] px-4 py-2 text-sm font-semibold text-white sm:w-auto"
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}

export default function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const locale = useLocale();
  const t = useTranslations("studentDashboard");
  const tCategories = useTranslations("categories");
  const tSakti = useTranslations("sakti");
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<"semua" | StoryOriginCountry>("semua");
  const [selectedFeeling, setSelectedFeeling] = useState<string>("semua");
  const [selectedAvatar, setSelectedAvatar] = useState(data.preferences.avatarKey);
  const selectedAvatarOption = AVATARS.find((item) => item.key === selectedAvatar) ?? DEFAULT_AVATAR;
  const [selectedTheme, setSelectedTheme] = useState(selectedAvatarOption.theme);
  const [preferenceState, preferenceAction] = useFormState(saveStudentPreferences, initialActionState);
  const [joinState, joinAction] = useFormState(joinFacilitatorClass, initialActionState);

  useEffect(() => {
    if (preferenceState.ok || joinState.ok) router.refresh();
  }, [joinState.ok, preferenceState.ok, router]);

  const theme = THEMES[selectedTheme] ?? DEFAULT_THEME;
  const levelProgress = data.gamification.levelProgress;
  const progressBySlug = useMemo(
    () => new Map(data.latestProgress.map((item) => [item.slug, item])),
    [data.latestProgress],
  );
  const filteredStories = useMemo(() => {
    return data.availableStories.filter((story) => {
      if (selectedCountry !== "semua" && story.originCountry !== selectedCountry) return false;
      if (selectedFeeling !== "semua" && !story.publicCategorySlugs.includes(selectedFeeling as never)) {
        return false;
      }
      return true;
    });
  }, [data.availableStories, selectedCountry, selectedFeeling]);

  const mysteryUnlocked = data.gamification.mysteryReward.unlocked;
  const dashboardStyle = {
    "--student-accent": theme.accent,
    "--student-dark": theme.accentDark,
    "--student-soft": theme.soft,
  } as CSSProperties;

  function chooseAvatar(avatarKey: string, themeKey: AvatarThemeKey) {
    setSelectedAvatar(avatarKey);
    setSelectedTheme(themeKey);
  }

  function avatarLabel(key: string) {
    if (key === "laki" || key === "netral" || key === "perempuan") {
      return t(`avatars.${key}.label`);
    }
    return key;
  }

  function avatarShortLabel(key: string) {
    if (key === "laki" || key === "netral" || key === "perempuan") {
      return t(`avatars.${key}.short`);
    }
    return key;
  }

  function avatarDetail(key: string) {
    if (key === "laki" || key === "netral" || key === "perempuan") {
      return t(`avatars.${key}.detail`);
    }
    return "";
  }

  function badgeLabel(label: string) {
    const keyByLabel: Record<string, string> = {
      "Langkah Pertama": "firstStep",
      "Penulis Refleksi": "reflectionWriter",
      "Penjelajah Tekun": "deepExplorer",
    };
    const key = keyByLabel[label];
    return key ? t(`badges.${key}.label`) : label;
  }

  function badgeDetail(detail: string) {
    const keyByDetail: Record<string, string> = {
      "Mulai menjelajahi satu cerpen.": "firstStep",
      "Menyimpan tiga catatan S-A-K-T-I.": "reflectionWriter",
      "Rata-rata progres layar mencapai 60%.": "deepExplorer",
    };
    const key = keyByDetail[detail];
    return key ? t(`badges.${key}.detail`) : detail;
  }

  function mysteryLabel(label: string, unlocked: boolean) {
    const keyByLabel: Record<string, string> = {
      "Kunci Cerita Rahasia": "secretKey",
      "Kotak Cerita": "storyBox",
      "Kotak Misteri": "mysteryBox",
    };
    const key = keyByLabel[label];
    const translated = key ? t(`mystery.${key}.label`) : label;
    return unlocked ? t("mystery.unlocked", { label: translated }) : translated;
  }

  function mysteryDetail(detail: string) {
    const keyByDetail: Record<string, string> = {
      "Hadiah level lanjutan terbuka. Teruskan perjalanan S-A-K-T-I.": "secretKey",
      "Hadiah awal terbuka. Kumpulkan XP lagi untuk hadiah berikutnya.": "storyBox",
      "Kumpulkan 100 XP untuk membuka hadiah pertama.": "mysteryBox",
    };
    const key = keyByDetail[detail];
    return key ? t(`mystery.${key}.detail`) : detail;
  }

  return (
    <div style={dashboardStyle} className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
        <div className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[var(--student-dark)] sm:text-4xl">
            {t("welcome", { name: data.displayName })}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-sakti-forestDark/75">
            {t("intro")}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--student-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--student-dark)]">{t("steps.chooseSelf.title")}</p>
              <p className="mt-1 text-xs leading-5 text-sakti-forestDark/70">{t("steps.chooseSelf.body")}</p>
            </div>
            <div className="rounded-xl bg-[var(--student-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--student-dark)]">{t("steps.chooseStory.title")}</p>
              <p className="mt-1 text-xs leading-5 text-sakti-forestDark/70">{t("steps.chooseStory.body")}</p>
            </div>
            <div className="rounded-xl bg-[var(--student-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--student-dark)]">{t("steps.writeReflection.title")}</p>
              <p className="mt-1 text-xs leading-5 text-sakti-forestDark/70">{t("steps.writeReflection.body")}</p>
            </div>
          </div>
        </div>

        <form action={preferenceAction} className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm sm:p-6">
          <input type="hidden" name="avatar" value={selectedAvatar} />
          <input type="hidden" name="theme" value={selectedTheme} />
          <input type="hidden" name="interface_language" value={locale} />
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">{t("avatarTheme")}</p>
              <h2 className="mt-2 font-display text-xl font-semibold leading-tight text-[var(--student-dark)] sm:text-2xl">
                {avatarLabel(selectedAvatarOption.key)}
              </h2>
            </div>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-[var(--student-accent)] bg-[var(--student-soft)] sm:h-16 sm:w-16">
              <Image
                src={selectedAvatarOption.image}
                alt={avatarLabel(selectedAvatarOption.key)}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-sakti-forestDark/70">{avatarDetail(selectedAvatarOption.key)}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {AVATARS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.key;
              return (
                <button
                  key={avatar.key}
                  type="button"
                  onClick={() => chooseAvatar(avatar.key, avatar.theme)}
                  className={`tap-target rounded-xl border p-1.5 text-center text-[11px] font-semibold sm:p-2 sm:text-xs ${
                    isSelected
                      ? "border-[var(--student-accent)] bg-[var(--student-soft)] text-[var(--student-dark)]"
                      : "border-sakti-mist bg-white text-sakti-forestDark"
                  }`}
                >
                  <span className="relative mx-auto mb-2 block aspect-square w-full overflow-hidden rounded-lg bg-sakti-paper">
                    <Image
                      src={avatar.image}
                      alt={avatarLabel(avatar.key)}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </span>
                  <span>{avatarShortLabel(avatar.key)}</span>
                </button>
              );
            })}
          </div>
          <button
            type="submit"
            className="tap-target mt-5 w-full rounded-full bg-[var(--student-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            {t("saveAvatar")}
          </button>
          {preferenceState.message ? (
            <p className={`mt-3 text-sm ${preferenceState.ok ? "text-sakti-forest" : "text-red-600"}`}>
              {preferenceState.message}
            </p>
          ) : null}
        </form>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.todayXp")}
          value={`+${data.gamification.todayXp}`}
          detail={t("stats.todayXpDetail")}
        />
        <StatCard
          label={t("stats.streak")}
          value={t("stats.days", { count: data.gamification.streakDays })}
          detail={t("stats.streakDetail")}
        />
        <StatCard
          label={t("stats.exploredStories")}
          value={`${data.stats.exploredStories}/${data.stats.totalStories}`}
          detail={t("stats.exploredStoriesDetail")}
        />
        <StatCard
          label={t("stats.reflections")}
          value={String(data.stats.reflectionCount)}
          detail={t("stats.reflectionsDetail")}
        />
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-8">
          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
                {t("continueSection")}
              </h2>
              <Link href="/pustaka" className="text-sm font-semibold text-[var(--student-accent)] underline">
                {t("openLibrary")}
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {data.latestProgress.length > 0 ? (
                data.latestProgress
                  .slice(0, 4)
                  .map((item) => <ProgressRow key={item.slug} item={item} />)
              ) : (
                <div className="rounded-sakti border border-dashed border-sakti-mist bg-white p-6 text-sakti-forestDark/75">
                  {t("noProgress")}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-sakti border border-sakti-mist bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                  {t("storyPicker.eyebrow")}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
                  {t("storyPicker.title")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
                  {t("storyPicker.body")}
                </p>
              </div>
              <p className="text-sm font-semibold text-[var(--student-accent)]">
                {t("storyPicker.count", { filtered: filteredStories.length, total: data.availableStories.length })}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-sakti-forestDark">{t("storyPicker.country")}</p>
                <div className="mobile-scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                  {["semua", "Indonesia", "Malaysia"].map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => setSelectedCountry(country as "semua" | StoryOriginCountry)}
                      className={`tap-target inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold ${
                        selectedCountry === country
                          ? "bg-[var(--student-accent)] text-white"
                          : "border border-sakti-mist bg-white text-sakti-forestDark"
                      }`}
                    >
                      {country === "semua" ? t("all") : country}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-sakti-forestDark">{t("storyPicker.feeling")}</p>
                <div className="mobile-scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedFeeling("semua")}
                    className={`tap-target inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold ${
                      selectedFeeling === "semua"
                        ? "bg-[var(--student-accent)] text-white"
                        : "border border-sakti-mist bg-white text-sakti-forestDark"
                    }`}
                  >
                    {t("all")}
                  </button>
                  {data.availableStories
                    .flatMap((story) => story.publicCategorySlugs)
                    .filter((slug, index, slugs) => slugs.indexOf(slug) === index)
                    .map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setSelectedFeeling(slug)}
                      className={`tap-target inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold ${
                        selectedFeeling === slug
                          ? "bg-[var(--student-accent)] text-white"
                          : "border border-sakti-mist bg-white text-sakti-forestDark"
                      }`}
                    >
                      {tCategories(slug as StoryCategorySlug)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {filteredStories.map((story) => (
                <StoryChoiceCard key={story.slug} story={story} progress={progressBySlug.get(story.slug)} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section
            id="level-hadiah"
            className="scroll-mt-28 overflow-hidden rounded-sakti border border-sakti-mist bg-white shadow-sm target:ring-4 target:ring-sakti-gold/35"
          >
            <div className="bg-[var(--student-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-wide text-sakti-gold">{t("gamification.eyebrow")}</p>
              <h2 className="mt-2 font-display text-2xl font-black text-[var(--student-dark)]">
                {t("gamification.title")}
              </h2>
            </div>
            <div className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="font-display text-5xl font-black text-[var(--student-dark)]">
                  {data.stats.level}
                </p>
                <p className="text-sm text-sakti-forestDark/70">{t("gamification.currentLevel")}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-lg font-semibold text-[var(--student-accent)]">
                  {t("gamification.points", { count: data.stats.points })}
                </p>
                <p className="text-xs text-sakti-forestDark/65">
                  {t("gamification.pointsToNext", { count: data.stats.pointsToNextLevel })}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={levelProgress} />
              <p className="mt-2 text-xs font-semibold text-sakti-forestDark/65">
                {t("gamification.levelProgress", { progress: levelProgress })}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-[72px_minmax(0,1fr)] gap-4 rounded-xl border border-[var(--student-accent)] bg-[var(--student-soft)] p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--student-accent)] font-display text-xl font-black text-white shadow-sm">
                {mysteryUnlocked ? "B" : "?"}
              </div>
              <div>
              <p className="font-semibold text-[var(--student-dark)]">
                {mysteryLabel(data.gamification.mysteryReward.label, mysteryUnlocked)}
              </p>
              <p className="mt-1 text-sm leading-6 text-sakti-forestDark/70">
                {mysteryDetail(data.gamification.mysteryReward.detail)}
              </p>
              </div>
            </div>
            </div>
          </section>

          <section className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">{t("dailyMissions")}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
              {t("dailyMissionsTitle")}
            </h2>
            <MissionList missions={data.gamification.missions} />
          </section>

          <section className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">{t("leaderboard.eyebrow")}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
              {t("leaderboard.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
              {t("leaderboard.body")}
            </p>
            <Leaderboard entries={data.gamification.leaderboard} />
          </section>

          <section className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">{t("badgesTitle")}</h2>
            <div className="mt-4 space-y-3">
              {data.badges.map((badge) => (
                <div
                  key={badge.label}
                  className={`rounded-xl border p-4 ${
                    badge.earned
                      ? "border-[var(--student-accent)] bg-[var(--student-soft)]"
                      : "border-sakti-mist bg-sakti-paper/60"
                  }`}
                >
                  <p className="font-semibold text-sakti-forestDark">
                    {badge.earned ? t("badgeEarned") : t("badgePending")}
                    {badgeLabel(badge.label)}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-sakti-forestDark/70">{badgeDetail(badge.detail)}</p>
                </div>
              ))}
            </div>
          </section>

          <form action={joinAction} className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">{t("companion.eyebrow")}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
              {t("companion.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
              {t("companion.body")}
            </p>
            <input
              name="join_code"
              placeholder={t("companion.placeholder")}
              className="tap-target mt-4 w-full rounded-full border border-sakti-mist bg-white px-4 py-3 text-sm text-sakti-forestDark outline-none focus:border-[var(--student-accent)]"
            />
            <button
              type="submit"
              className="tap-target mt-3 w-full rounded-full bg-[var(--student-accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              {t("companion.submit")}
            </button>
            {joinState.message ? (
              <p className={`mt-3 text-sm ${joinState.ok ? "text-sakti-forest" : "text-red-600"}`}>
                {joinState.message}
              </p>
            ) : null}
          </form>

          <section className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
              {t("latestReflections")}
            </h2>
            <div className="mt-4 space-y-4">
              {data.latestReflections.length > 0 ? (
                data.latestReflections.map((item) => (
                  <article
                    key={`${item.slug}-${item.stage}`}
                    className="border-b border-sakti-mist pb-4 last:border-0 last:pb-0"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                      {item.stage === "sadar" ||
                      item.stage === "aktif" ||
                      item.stage === "kritis" ||
                      item.stage === "terbuka" ||
                      item.stage === "imersif"
                        ? tSakti(item.stage)
                        : item.stage}{" "}
                      - {formatDate(item.updatedAt, locale, t("notSaved"))}
                    </p>
                    <h3 className="mt-1 font-semibold text-sakti-forestDark">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-sakti-forestDark/70">
                      {item.response}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-sakti-forestDark/70">
                  {t("noReflections")}
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
