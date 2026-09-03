import "server-only";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { STORIES, getStoryBySlug, type PreparedStory } from "@/content/stories";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";

export interface StudentProgressItem {
  slug: string;
  title: string;
  progress: number;
  updatedAt: string | null;
  story: PreparedStory | null;
}

export interface StudentReflectionItem {
  slug: string;
  title: string;
  stage: string;
  response: string;
  updatedAt: string | null;
}

export interface StudentBadge {
  label: string;
  detail: string;
  earned: boolean;
}

export interface StudentMission {
  label: string;
  detail: string;
  xp: number;
  completed: boolean;
}

export interface StudentLeaderboardEntry {
  rank: number;
  label: string;
  xp: number;
  isCurrentUser: boolean;
}

export interface StudentGamification {
  streakDays: number;
  todayXp: number;
  levelProgress: number;
  mysteryReward: {
    label: string;
    detail: string;
    unlocked: boolean;
  };
  missions: StudentMission[];
  leaderboard: StudentLeaderboardEntry[];
}

export interface StudentDashboardData {
  displayName: string;
  classNames: string[];
  preferences: {
    avatarKey: string;
    themeKey: string;
  };
  stats: {
    exploredStories: number;
    totalStories: number;
    averageProgress: number;
    reflectionCount: number;
    points: number;
    level: number;
    pointsToNextLevel: number;
  };
  latestProgress: StudentProgressItem[];
  latestReflections: StudentReflectionItem[];
  availableStories: PreparedStory[];
  badges: StudentBadge[];
  gamification: StudentGamification;
}

interface ProfileRow {
  display_name: string | null;
}

interface ProgressRow {
  story_slug: string;
  story_title: string | null;
  progress_percent: number | null;
  updated_at: string | null;
  last_read_at?: string | null;
}

interface ReflectionRow {
  story_slug: string;
  story_title: string | null;
  stage: string | null;
  response: string | null;
  updated_at: string | null;
}

interface ClassMemberRow {
  class_id: string;
}

interface ClassRow {
  id: string;
  name: string;
}

interface PreferencesRow {
  avatar_config: Record<string, unknown> | null;
  theme: string | null;
}

interface LeaderboardProgressRow {
  student_id: string;
  progress_percent: number | null;
}

interface LeaderboardReflectionRow {
  student_id: string;
}

function byNewest<T extends { updatedAt: string | null }>(a: T, b: T) {
  return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
}

function clampProgress(value: number | null | undefined) {
  return Math.min(100, Math.max(0, Math.round(value ?? 0)));
}

function makeProgressItem(row: ProgressRow): StudentProgressItem {
  const story = getStoryBySlug(row.story_slug) ?? null;
  return {
    slug: row.story_slug,
    title: story?.title ?? row.story_title ?? "Cerita",
    progress: clampProgress(row.progress_percent),
    updatedAt: row.updated_at ?? row.last_read_at ?? null,
    story,
  };
}

function makeReflectionItem(row: ReflectionRow): StudentReflectionItem {
  const story = getStoryBySlug(row.story_slug);
  return {
    slug: row.story_slug,
    title: story?.title ?? row.story_title ?? "Cerita",
    stage: row.stage ?? "refleksi",
    response: row.response ?? "",
    updatedAt: row.updated_at,
  };
}

function makeBadges(exploredStories: number, reflectionCount: number, averageProgress: number) {
  return [
    {
      label: "Langkah Pertama",
      detail: "Mulai menjelajahi satu cerpen.",
      earned: exploredStories >= 1,
    },
    {
      label: "Penulis Refleksi",
      detail: "Menyimpan tiga catatan S-A-K-T-I.",
      earned: reflectionCount >= 3,
    },
    {
      label: "Penjelajah Tekun",
      detail: "Rata-rata progres layar mencapai 60%.",
      earned: averageProgress >= 60,
    },
  ];
}

function getDayKey(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDayKey(dayKey: string, offset: number) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function makeStreakDays(dayKeys: Set<string>) {
  const today = getTodayKey();
  let cursor = dayKeys.has(today) ? today : shiftDayKey(today, -1);
  let streak = 0;

  while (dayKeys.has(cursor)) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  return streak;
}

function makeGamification({
  classNames,
  level,
  points,
  pointsToNextLevel,
  progressItems,
  reflectionItems,
  leaderboard,
}: {
  classNames: string[];
  level: number;
  points: number;
  pointsToNextLevel: number;
  progressItems: StudentProgressItem[];
  reflectionItems: StudentReflectionItem[];
  leaderboard: StudentLeaderboardEntry[];
}): StudentGamification {
  const todayKey = getTodayKey();
  const activeDayKeys = new Set<string>();

  progressItems.forEach((item) => {
    const key = getDayKey(item.updatedAt);
    if (key) activeDayKeys.add(key);
  });
  reflectionItems.forEach((item) => {
    const key = getDayKey(item.updatedAt);
    if (key) activeDayKeys.add(key);
  });

  const readToday = progressItems.some((item) => getDayKey(item.updatedAt) === todayKey);
  const reflectedToday = reflectionItems.some((item) => getDayKey(item.updatedAt) === todayKey);
  const exploredDeeply = progressItems.some((item) => item.progress >= 60);
  const connectedToClass = classNames.length > 0;

  const missions: StudentMission[] = [
    {
      label: "Jelajah Hari Ini",
      detail: "Buka atau lanjutkan satu cerpen.",
      xp: 25,
      completed: readToday,
    },
    {
      label: "Catatan S-A-K-T-I",
      detail: "Tulis satu refleksi pendek hari ini.",
      xp: 35,
      completed: reflectedToday,
    },
    {
      label: "Penjelajah Tekun",
      detail: "Capai 60% bagian dijelajahi pada satu cerita.",
      xp: 40,
      completed: exploredDeeply,
    },
    {
      label: "Tim Pendamping",
      detail: "Hubungkan akun dengan kode kelas.",
      xp: 20,
      completed: connectedToClass,
    },
  ];

  const todayXp = missions
    .filter((mission) => mission.completed)
    .reduce((total, mission) => total + mission.xp, 0);

  const levelSize = Math.max(points + pointsToNextLevel - (level - 1) * 100, 100);
  const levelProgress = Math.min(100, Math.max(0, Math.round(((points % levelSize) / levelSize) * 100)));

  return {
    streakDays: makeStreakDays(activeDayKeys),
    todayXp,
    levelProgress,
    mysteryReward: {
      label: points >= 300 ? "Kunci Cerita Rahasia" : points >= 100 ? "Kotak Cerita" : "Kotak Misteri",
      detail:
        points >= 300
          ? "Hadiah level lanjutan terbuka. Teruskan perjalanan S-A-K-T-I."
          : points >= 100
            ? "Hadiah awal terbuka. Kumpulkan XP lagi untuk hadiah berikutnya."
            : "Kumpulkan 100 XP untuk membuka hadiah pertama.",
      unlocked: points >= 100,
    },
    missions,
    leaderboard,
  };
}

function makeEmptyGamification(): StudentGamification {
  return makeGamification({
    classNames: [],
    level: 1,
    points: 0,
    pointsToNextLevel: 100,
    progressItems: [],
    reflectionItems: [],
    leaderboard: [],
  });
}

function emptyDashboard(): StudentDashboardData {
  return {
    displayName: "Siswa",
    classNames: [],
    preferences: {
      avatarKey: "netral",
      themeKey: "mentari",
    },
    stats: {
      exploredStories: 0,
      totalStories: STORIES.length,
      averageProgress: 0,
      reflectionCount: 0,
      points: 0,
      level: 1,
      pointsToNextLevel: 100,
    },
    latestProgress: [],
    latestReflections: [],
    availableStories: STORIES,
    badges: makeBadges(0, 0, 0),
    gamification: makeEmptyGamification(),
  };
}

async function getClassLeaderboard(
  classIds: string[],
  currentUserId: string,
): Promise<StudentLeaderboardEntry[]> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || classIds.length === 0) return [];

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: memberRows } = await admin
    .from("class_members")
    .select("student_id")
    .in("class_id", classIds);

  const studentIds = Array.from(
    new Set(((memberRows ?? []) as Array<{ student_id: string }>).map((row) => row.student_id)),
  );
  if (studentIds.length === 0) return [];

  const [{ data: progressRows }, { data: reflectionRows }] = await Promise.all([
    admin
      .from("reading_progress")
      .select("student_id,progress_percent")
      .in("student_id", studentIds),
    admin
      .from("reflection_entries")
      .select("student_id")
      .in("student_id", studentIds),
  ]);

  const xpByStudent = new Map<string, number>();
  studentIds.forEach((id) => xpByStudent.set(id, 0));

  ((progressRows ?? []) as LeaderboardProgressRow[]).forEach((row) => {
    xpByStudent.set(row.student_id, (xpByStudent.get(row.student_id) ?? 0) + clampProgress(row.progress_percent));
  });

  ((reflectionRows ?? []) as LeaderboardReflectionRow[]).forEach((row) => {
    xpByStudent.set(row.student_id, (xpByStudent.get(row.student_id) ?? 0) + 20);
  });

  return Array.from(xpByStudent.entries())
    .map(([studentId, xp]) => ({ studentId, xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5)
    .map((entry, index) => ({
      rank: index + 1,
      label: entry.studentId === currentUserId ? "Kamu" : `Teman ${index + 1}`,
      xp: entry.xp,
      isCurrentUser: entry.studentId === currentUserId,
    }));
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!supabase || !currentUser) return emptyDashboard();

  const [
    { data: profileRows },
    { data: preferenceRows },
    { data: progressRows },
    { data: reflectionRows },
    { data: memberRows },
  ] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", currentUser.id).limit(1),
      supabase.from("user_preferences").select("avatar_config,theme").eq("user_id", currentUser.id).limit(1),
      supabase
        .from("reading_progress")
        .select("story_slug,story_title,progress_percent,updated_at,last_read_at")
        .eq("student_id", currentUser.id),
      supabase
        .from("reflection_entries")
        .select("story_slug,story_title,stage,response,updated_at")
        .eq("student_id", currentUser.id),
      supabase.from("class_members").select("class_id").eq("student_id", currentUser.id),
    ]);

  const profile = ((profileRows ?? []) as ProfileRow[])[0];
  const preferences = ((preferenceRows ?? []) as PreferencesRow[])[0];
  const avatarConfig = preferences?.avatar_config ?? {};
  const progressItems = ((progressRows ?? []) as ProgressRow[]).map(makeProgressItem).sort(byNewest);
  const reflectionItems = ((reflectionRows ?? []) as ReflectionRow[])
    .map(makeReflectionItem)
    .filter((item) => item.response.trim().length > 0)
    .sort(byNewest);

  const classIds = Array.from(new Set(((memberRows ?? []) as ClassMemberRow[]).map((item) => item.class_id)));
  let classNames: string[] = [];
  if (classIds.length > 0) {
    const { data: classRows } = await supabase.from("classes").select("id,name").in("id", classIds);
    classNames = ((classRows ?? []) as ClassRow[]).map((item) => item.name);
  }
  const leaderboard = await getClassLeaderboard(classIds, currentUser.id);

  const exploredStories = new Set(progressItems.map((item) => item.slug)).size;
  const averageProgress =
    progressItems.length > 0
      ? Math.round(progressItems.reduce((total, item) => total + item.progress, 0) / progressItems.length)
      : 0;
  const points = progressItems.reduce((total, item) => total + item.progress, 0) + reflectionItems.length * 20;
  const level = Math.max(1, Math.floor(points / 100) + 1);
  const pointsToNextLevel = level * 100 - points;

  return {
    displayName: profile?.display_name || "Siswa",
    classNames,
    preferences: {
      avatarKey: typeof avatarConfig.avatar === "string" ? avatarConfig.avatar : "netral",
      themeKey: preferences?.theme || (typeof avatarConfig.theme === "string" ? avatarConfig.theme : "mentari"),
    },
    stats: {
      exploredStories,
      totalStories: STORIES.length,
      averageProgress,
      reflectionCount: reflectionItems.length,
      points,
      level,
      pointsToNextLevel,
    },
    latestProgress: progressItems,
    latestReflections: reflectionItems.slice(0, 3),
    availableStories: STORIES,
    badges: makeBadges(exploredStories, reflectionItems.length, averageProgress),
    gamification: makeGamification({
      classNames,
      level,
      points,
      pointsToNextLevel,
      progressItems,
      reflectionItems,
      leaderboard,
    }),
  };
}
