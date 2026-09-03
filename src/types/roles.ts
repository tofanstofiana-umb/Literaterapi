// Delapan peran dari PRD bagian 4 "Target Pengguna dan Role". Nilai literal
// snake_case ini yang dipakai persis di kolom `user_roles.role` (lihat
// supabase/migrations/0001_core_schema.sql).
export const APP_ROLES = [
  "siswa",
  "fasilitator",
  "konselor",
  "moderator",
  "editor_konten",
  "ahli",
  "peneliti",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABEL_ID: Record<AppRole, string> = {
  siswa: "Siswa",
  fasilitator: "Fasilitator",
  konselor: "Konselor/Pendamping Psikologis",
  moderator: "Moderator",
  editor_konten: "Editor Konten",
  ahli: "Ahli",
  peneliti: "Peneliti",
  admin: "Administrator",
};

export const ROLE_HOME_PATH: Record<AppRole, string> = {
  siswa: "/dashboard",
  fasilitator: "/fasilitator",
  konselor: "/konselor",
  moderator: "/moderator",
  editor_konten: "/editor-konten",
  ahli: "/ahli",
  peneliti: "/peneliti",
  admin: "/admin",
};

export const ROLE_PRIORITY: AppRole[] = [
  "admin",
  "moderator",
  "editor_konten",
  "ahli",
  "peneliti",
  "konselor",
  "fasilitator",
  "siswa",
];

export function getPrimaryRoleHome(roles: UserRoles): string {
  const primaryRole = ROLE_PRIORITY.find((role) => roles.includes(role));
  return primaryRole ? ROLE_HOME_PATH[primaryRole] : ROLE_HOME_PATH.siswa;
}

// PRD bagian 15/18 menyiratkan satu akun BISA punya lebih dari satu peran
// (tabel `user_roles` terpisah dari `profiles`, bukan satu kolom role
// tunggal seperti proyek Vite sebelumnya) — mis. seorang Ahli yang juga
// Editor Konten. Tipe & helper di sini SENGAJA bekerja dengan
// `AppRole[]` (jamak), bukan `AppRole` tunggal.
export type UserRoles = AppRole[];

export function hasRole(roles: UserRoles, role: AppRole): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: UserRoles, allowed: AppRole[]): boolean {
  return allowed.some((role) => roles.includes(role));
}
