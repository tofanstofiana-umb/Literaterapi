import "server-only";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";
import { hasAnyRole } from "@/types/roles";
import { STORIES } from "@/content/stories";

export interface FacilitatorLearnerRow {
  studentId?: string;
  classId?: string;
  name: string;
  className: string;
  progress: number;
  story: string;
  signal: string;
  signalKey: "notStarted" | "reflectionReceived" | "stoppedEarly" | "awaitingReflection";
  signalTone: "green" | "coral" | "blue";
  action: string;
  actionKey: "gentleReminder" | "briefFeedback" | "lightGreeting" | "inviteReflection";
}

export interface FacilitatorClassCard {
  id?: string;
  name: string;
  schoolName: string;
  country: "Indonesia" | "Malaysia";
  joinCode: string;
  memberCount: number;
}

export interface CompanionNoteHistoryItem {
  id: string;
  studentId: string;
  classId: string | null;
  noteType: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface FacilitatorDashboardData {
  isDemo: boolean;
  dataWarning?: string;
  dataWarningKey?: "sessionUnavailable" | "classReadFailed";
  signals: Array<{
    key: "needsGreeting" | "newReflections" | "activeStories" | "trackedClasses";
    label: string;
    value: string;
    detail: string;
    detailCount?: number;
  }>;
  classes: FacilitatorClassCard[];
  learners: FacilitatorLearnerRow[];
  companionNotes: CompanionNoteHistoryItem[];
  recommendedStorySlugs: string[];
}

interface ClassRow {
  id: string;
  school_id: string;
  name: string;
  join_code: string;
}

interface SchoolRow {
  id: string;
  name: string;
  country: "Indonesia" | "Malaysia";
}

interface MemberRow {
  class_id: string;
  student_id: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
}

interface ProgressRow {
  student_id: string;
  story_slug: string;
  story_title: string;
  progress_percent: number;
  updated_at: string;
}

interface ReflectionRow {
  student_id: string;
  story_slug: string;
  stage: string;
  response: string;
  updated_at: string;
}

interface CompanionNoteRow {
  id: string;
  student_id: string;
  class_id: string | null;
  note_type: string;
  body: string;
  status: string;
  created_at: string;
}

function getEmptyRealData(classes: FacilitatorClassCard[] = []): FacilitatorDashboardData {
  return {
    isDemo: false,
    classes,
    signals: [
      {
        key: "needsGreeting",
        label: "Perlu Sapaan",
        value: "0",
        detail: "Belum ada siswa yang perlu tindak lanjut.",
      },
      {
        key: "newReflections",
        label: "Refleksi Baru",
        value: "0",
        detail: "Belum ada catatan refleksi dari siswa.",
      },
      {
        key: "activeStories",
        label: "Cerita Aktif",
        value: String(STORIES.length),
        detail: "Cerpen siap dipakai.",
      },
      {
        key: "trackedClasses",
        label: "Kelas Terpantau",
        value: String(classes.length),
        detail: "Kelas yang terhubung ke akun ini.",
      },
    ],
    learners: [],
    companionNotes: [],
    recommendedStorySlugs: STORIES.filter((story) => story.facilitatorRequirement !== "restricted")
      .slice(0, 2)
      .map((story) => story.slug),
  };
}

function getUnavailableData(message: string, dataWarningKey?: FacilitatorDashboardData["dataWarningKey"]): FacilitatorDashboardData {
  return {
    ...getEmptyRealData(),
    dataWarning: message,
    dataWarningKey,
  };
}

function pickLatestProgress(progressRows: ProgressRow[]) {
  return progressRows.reduce<ProgressRow | undefined>((latest, row) => {
    if (!latest) return row;
    return new Date(row.updated_at).getTime() > new Date(latest.updated_at).getTime()
      ? row
      : latest;
  }, undefined);
}

function makeLearnerSignal(progress: ProgressRow | undefined, reflections: ReflectionRow[]) {
  if (!progress) {
    return {
      signal: "Belum mulai",
      signalKey: "notStarted" as const,
      signalTone: "coral" as const,
      action: "Kirim pengingat lembut",
      actionKey: "gentleReminder" as const,
    };
  }

  if (reflections.length > 0) {
    return {
      signal: "Refleksi masuk",
      signalKey: "reflectionReceived" as const,
      signalTone: "green" as const,
      action: "Beri umpan balik singkat",
      actionKey: "briefFeedback" as const,
    };
  }

  if (progress.progress_percent < 40) {
    return {
      signal: "Berhenti awal",
      signalKey: "stoppedEarly" as const,
      signalTone: "coral" as const,
      action: "Tawarkan sapaan ringan",
      actionKey: "lightGreeting" as const,
    };
  }

  return {
    signal: "Belum refleksi",
    signalKey: "awaitingReflection" as const,
    signalTone: "blue" as const,
    action: "Ajak menulis catatan",
    actionKey: "inviteReflection" as const,
  };
}

export async function getFacilitatorDashboardData(scope: "facilitator" | "counselor" = "facilitator"): Promise<FacilitatorDashboardData> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!supabase || !currentUser) {
    return getUnavailableData(
      "Data pendamping belum bisa dibaca karena sesi atau konfigurasi Supabase tidak tersedia.",
      "sessionUnavailable",
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin =
    scope === "counselor" && supabaseUrl && serviceRoleKey
      ? createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        })
      : null;
  const dataClient = admin ?? supabase;

  if (scope === "counselor" && !hasAnyRole(currentUser.roles, ["konselor", "admin"])) {
    return getEmptyRealData();
  }

  let classQuery = dataClient.from("classes").select("id,school_id,name,join_code");
  if (scope !== "counselor") {
    classQuery = classQuery.eq("facilitator_id", currentUser.id);
  }

  const { data: classRows, error: classError } = await classQuery;

  if (classError) {
    return getUnavailableData("Data kelas belum bisa dibaca.", "classReadFailed");
  }
  if (!classRows?.length) return getEmptyRealData();

  const classes = classRows as ClassRow[];
  const classIds = classes.map((item) => item.id);
  const classNameById = new Map(classes.map((item) => [item.id, item.name]));
  const schoolIds = Array.from(new Set(classes.map((item) => item.school_id)));

  const [{ data: schoolRows }, { data: memberRows, error: memberError }] = await Promise.all([
    dataClient.from("schools").select("id,name,country").in("id", schoolIds),
    dataClient
    .from("class_members")
    .select("class_id,student_id")
      .in("class_id", classIds),
  ]);

  const schools = (schoolRows ?? []) as SchoolRow[];
  const schoolById = new Map(schools.map((item) => [item.id, item]));
  const members = (memberRows ?? []) as MemberRow[];
  const memberCountByClassId = new Map<string, number>();

  members.forEach((member) => {
    memberCountByClassId.set(member.class_id, (memberCountByClassId.get(member.class_id) ?? 0) + 1);
  });

  const classCards = classes.map((item) => {
    const school = schoolById.get(item.school_id);
    return {
      id: item.id,
      name: item.name,
      schoolName: school?.name ?? "Sekolah",
      country: school?.country ?? "Indonesia",
      joinCode: item.join_code,
      memberCount: memberCountByClassId.get(item.id) ?? 0,
    };
  });

  if (memberError || !members.length) {
    return getEmptyRealData(classCards);
  }

  const studentIds = Array.from(new Set(members.map((item) => item.student_id)));

  const [{ data: profileRows }, { data: progressRows }, { data: reflectionRows }, { data: companionNoteRows }] =
    await Promise.all([
      dataClient.from("profiles").select("id,display_name").in("id", studentIds),
      dataClient
        .from("reading_progress")
        .select("student_id,story_slug,story_title,progress_percent,updated_at")
        .in("student_id", studentIds),
      dataClient
        .from("reflection_entries")
        .select("student_id,story_slug,stage,response,updated_at")
        .in("student_id", studentIds),
      dataClient
        .from("companion_notes")
        .select("id,student_id,class_id,note_type,body,status,created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const profiles = (profileRows ?? []) as ProfileRow[];
  const progress = (progressRows ?? []) as ProgressRow[];
  const reflections = (reflectionRows ?? []) as ReflectionRow[];
  const companionNotes = ((companionNoteRows ?? []) as CompanionNoteRow[]).map((note) => ({
    id: note.id,
    studentId: note.student_id,
    classId: note.class_id,
    noteType: note.note_type,
    body: note.body,
    status: note.status,
    createdAt: note.created_at,
  }));

  const profileById = new Map(profiles.map((item) => [item.id, item]));
  const progressByStudent = new Map<string, ProgressRow[]>();
  const reflectionsByStudent = new Map<string, ReflectionRow[]>();

  progress.forEach((item) => {
    const items = progressByStudent.get(item.student_id) ?? [];
    items.push(item);
    progressByStudent.set(item.student_id, items);
  });

  reflections.forEach((item) => {
    const items = reflectionsByStudent.get(item.student_id) ?? [];
    items.push(item);
    reflectionsByStudent.set(item.student_id, items);
  });

  const learners = members.map((member) => {
    const profile = profileById.get(member.student_id);
    const latestProgress = pickLatestProgress(progressByStudent.get(member.student_id) ?? []);
    const studentReflections = reflectionsByStudent.get(member.student_id) ?? [];
    const signal = makeLearnerSignal(latestProgress, studentReflections);

    return {
      studentId: member.student_id,
      classId: member.class_id,
      name: profile?.display_name || "Siswa tanpa nama",
      className: classNameById.get(member.class_id) ?? "Kelas",
      progress: latestProgress?.progress_percent ?? 0,
      story: latestProgress?.story_title ?? "Belum memilih cerita",
      ...signal,
    };
  });

  const needsGreeting = learners.filter((item) => item.signalTone === "coral").length;
  const reflectedStudents = new Set(reflections.map((item) => item.student_id)).size;

  return {
    isDemo: false,
    classes: classCards,
    learners,
    companionNotes,
    recommendedStorySlugs: STORIES.filter((story) => story.facilitatorRequirement !== "restricted")
      .slice(0, 2)
      .map((story) => story.slug),
    signals: [
      {
        key: "needsGreeting",
        label: "Perlu Sapaan",
        value: String(needsGreeting),
        detail: "Siswa dengan progres rendah atau refleksi belum selesai.",
      },
      {
        key: "newReflections",
        label: "Refleksi Baru",
        value: String(reflections.length),
        detail: `${reflectedStudents} siswa sudah menulis catatan S-A-K-T-I.`,
        detailCount: reflectedStudents,
      },
      {
        key: "activeStories",
        label: "Cerita Aktif",
        value: String(STORIES.length),
        detail: "Cerpen Indonesia dan Malaysia siap dipakai.",
      },
      {
        key: "trackedClasses",
        label: "Kelas Terpantau",
        value: String(classes.length),
        detail: "Kelas yang terhubung dengan akun fasilitator ini.",
      },
    ],
  };
}
