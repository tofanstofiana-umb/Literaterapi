import "server-only";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { supabaseUrl } from "@/lib/supabase/env";
import { APP_ROLES, ROLE_HOME_PATH, ROLE_LABEL_ID, hasRole, type AppRole } from "@/types/roles";

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  createdAt: string | null;
  confirmedAt: string | null;
  roles: AppRole[];
}

export interface AdminClassRow {
  id: string;
  name: string;
  joinCode: string;
  schoolName: string;
  country: "Indonesia" | "Malaysia";
  facilitatorId: string;
  facilitatorName: string;
  memberCount: number;
}

export interface AdminClassMemberRow {
  classId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export interface AdminSystemHealthItem {
  key:
    | "totalUsers"
    | "studentsWithoutClass"
    | "emptyClasses"
    | "openReports"
    | "openCompanionNotes"
    | "storiesNeedReview";
  value: number;
}

export interface AdminDashboardData {
  isAdmin: boolean;
  currentUserId: string | null;
  currentUserRoles: Array<{
    value: AppRole;
    label: string;
    href: string;
  }>;
  users: AdminUserRow[];
  classes: AdminClassRow[];
  classMembers: AdminClassMemberRow[];
  systemHealth: AdminSystemHealthItem[];
  roles: Array<{
    value: AppRole;
    label: string;
  }>;
  message?: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
}

interface RoleRow {
  user_id: string;
  role: AppRole;
}

interface AuthUserRow {
  id: string;
  email?: string;
  created_at?: string;
  confirmed_at?: string;
}

interface SchoolRow {
  id: string;
  name: string;
  country: "Indonesia" | "Malaysia";
}

interface ClassRow {
  id: string;
  school_id: string;
  facilitator_id: string;
  name: string;
  join_code: string;
}

interface MemberRow {
  class_id: string;
  student_id: string;
}

interface StatusRow {
  status: string;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const t = await getTranslations("adminDashboard.messages");
  const currentUser = await getCurrentUser();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const roles = APP_ROLES.map((role) => ({ value: role, label: ROLE_LABEL_ID[role] }));

  if (!currentUser || !hasRole(currentUser.roles, "admin")) {
    return {
      isAdmin: false,
      currentUserId: currentUser?.id ?? null,
      currentUserRoles: [],
      users: [],
      classes: [],
      classMembers: [],
      systemHealth: [],
      roles,
      message: t("adminOnly"),
    };
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      isAdmin: true,
      currentUserId: currentUser.id,
      currentUserRoles: currentUser.roles.map((role) => ({
        value: role,
        label: ROLE_LABEL_ID[role],
        href: ROLE_HOME_PATH[role],
      })),
      users: [],
      classes: [],
      classMembers: [],
      systemHealth: [],
      roles,
      message: t("serviceRoleMissing"),
    };
  }

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const [
    { data: authData },
    { data: profileRows },
    { data: roleRows },
    { data: schoolRows },
    { data: classRows },
    { data: memberRows },
    { data: reportRows },
    { data: companionNoteRows },
    { data: storyReviewRows },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin.from("profiles").select("id,display_name"),
    admin.from("user_roles").select("user_id,role"),
    admin.from("schools").select("id,name,country"),
    admin.from("classes").select("id,school_id,facilitator_id,name,join_code").order("created_at", { ascending: false }),
    admin.from("class_members").select("class_id,student_id"),
    admin.from("content_safety_reports").select("status"),
    admin.from("companion_notes").select("status"),
    admin.from("story_review_statuses").select("status"),
  ]);

  const profileById = new Map(((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  const rolesByUserId = new Map<string, AppRole[]>();

  ((roleRows ?? []) as RoleRow[]).forEach((row) => {
    const current = rolesByUserId.get(row.user_id) ?? [];
    current.push(row.role);
    rolesByUserId.set(row.user_id, current);
  });

  const users = ((authData?.users ?? []) as AuthUserRow[]).map((user) => ({
    id: user.id,
    email: user.email ?? "email tidak tersedia",
    displayName: profileById.get(user.id)?.display_name || "Tanpa nama",
    createdAt: user.created_at ?? null,
    confirmedAt: user.confirmed_at ?? null,
    roles: rolesByUserId.get(user.id) ?? [],
  }));
  const emailById = new Map(users.map((user) => [user.id, user.email]));
  const schoolById = new Map(((schoolRows ?? []) as SchoolRow[]).map((school) => [school.id, school]));
  const memberCountByClassId = new Map<string, number>();
  ((memberRows ?? []) as MemberRow[]).forEach((member) => {
    memberCountByClassId.set(member.class_id, (memberCountByClassId.get(member.class_id) ?? 0) + 1);
  });

  const classes = ((classRows ?? []) as ClassRow[]).map((classItem) => {
    const school = schoolById.get(classItem.school_id);
    return {
      id: classItem.id,
      name: classItem.name,
      joinCode: classItem.join_code,
      schoolName: school?.name ?? "Sekolah",
      country: school?.country ?? "Indonesia",
      facilitatorId: classItem.facilitator_id,
      facilitatorName: profileById.get(classItem.facilitator_id)?.display_name || "Fasilitator",
      memberCount: memberCountByClassId.get(classItem.id) ?? 0,
    };
  });

  const classMembers = ((memberRows ?? []) as MemberRow[]).map((member) => ({
    classId: member.class_id,
    studentId: member.student_id,
    studentName: profileById.get(member.student_id)?.display_name || "Siswa tanpa nama",
    studentEmail: emailById.get(member.student_id) ?? "email tidak tersedia",
  }));
  const studentIds = new Set(
    users.filter((user) => user.roles.includes("siswa")).map((user) => user.id),
  );
  const memberStudentIds = new Set(((memberRows ?? []) as MemberRow[]).map((member) => member.student_id));
  const studentsWithoutClass = Array.from(studentIds).filter((studentId) => !memberStudentIds.has(studentId)).length;
  const emptyClasses = classes.filter((classItem) => classItem.memberCount === 0).length;
  const openReports = ((reportRows ?? []) as StatusRow[]).filter((row) => row.status !== "resolved").length;
  const openCompanionNotes = ((companionNoteRows ?? []) as StatusRow[]).filter((row) => row.status === "open").length;
  const storiesNeedReview = ((storyReviewRows ?? []) as StatusRow[]).filter((row) =>
    ["perlu_revisi_gambar", "perlu_tinjauan_ahli"].includes(row.status),
  ).length;
  const systemHealth: AdminSystemHealthItem[] = [
    { key: "totalUsers", value: users.length },
    { key: "studentsWithoutClass", value: studentsWithoutClass },
    { key: "emptyClasses", value: emptyClasses },
    { key: "openReports", value: openReports },
    { key: "openCompanionNotes", value: openCompanionNotes },
    { key: "storiesNeedReview", value: storiesNeedReview },
  ];

  return {
    isAdmin: true,
    currentUserId: currentUser.id,
    currentUserRoles: currentUser.roles.map((role) => ({
      value: role,
      label: ROLE_LABEL_ID[role],
      href: ROLE_HOME_PATH[role],
    })),
    users,
    classes,
    classMembers,
    systemHealth,
    roles,
  };
}
