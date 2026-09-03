import { useLocale, useTranslations } from "next-intl";
import {
  assignStudentToClass,
  createAdminClass,
  grantUserRole,
  removeStudentFromClass,
  revokeUserRole,
} from "@/app/[locale]/(admin)/admin/actions";
import { Link } from "@/i18n/navigation";
import DeleteUserAccountForm from "@/components/admin/DeleteUserAccountForm";
import type { AdminDashboardData, AdminUserRow } from "@/lib/admin/dashboardData";
import { ROLE_LABEL_ID } from "@/types/roles";

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function UserRoleManager({ user, data }: { user: AdminUserRow; data: AdminDashboardData }) {
  const locale = useLocale();
  const t = useTranslations("adminDashboard");

  return (
    <article className="rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold text-sakti-forestDark">{user.displayName}</p>
          <p className="mt-1 break-all text-sm text-sakti-forestDark/70">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <form key={role} action={revokeUserRole}>
                  <input type="hidden" name="user_id" value={user.id} />
                  <input type="hidden" name="role" value={role} />
                  <button
                    type="submit"
                    className="rounded-full bg-sakti-forest/10 px-3 py-1 text-xs font-semibold text-sakti-forest"
                    title={t("revokeRoleTitle")}
                  >
                    {ROLE_LABEL_ID[role]}
                  </button>
                </form>
              ))
            ) : (
              <span className="rounded-full bg-sakti-mist px-3 py-1 text-xs font-semibold text-sakti-forestDark/60">
                {t("noRole")}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-2 text-sm text-sakti-forestDark/70 sm:grid-cols-2 lg:min-w-[260px]">
          <div className="rounded-xl bg-sakti-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">{t("created")}</p>
            <p className="mt-1">{formatDate(user.createdAt, locale, t("notYet"))}</p>
          </div>
          <div className="rounded-xl bg-sakti-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
              {t("emailVerification")}
            </p>
            <p className="mt-1">{formatDate(user.confirmedAt, locale, t("notVerified"))}</p>
          </div>
        </div>
      </div>

      <form action={grantUserRole} className="mt-5 flex flex-col gap-3 border-t border-sakti-mist pt-4 sm:flex-row">
        <input type="hidden" name="user_id" value={user.id} />
        <select
          name="role"
          className="min-w-0 flex-1 rounded-full border border-sakti-mist bg-white px-4 py-2 text-sm text-sakti-forestDark outline-none focus:border-sakti-forest"
        >
          {data.roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-sakti-forest px-5 py-2 text-sm font-semibold text-white"
        >
          {t("addRole")}
        </button>
      </form>
      <DeleteUserAccountForm
        userId={user.id}
        email={user.email}
        disabled={user.id === data.currentUserId}
      />
    </article>
  );
}

function ClassManager({ data }: { data: AdminDashboardData }) {
  const t = useTranslations("adminDashboard");
  const facilitatorUsers = data.users.filter((user) =>
    user.roles.some((role) => role === "fasilitator" || role === "konselor" || role === "admin"),
  );
  const studentUsers = data.users.filter((user) => user.roles.includes("siswa"));
  const classMembersByClassId = new Map<string, typeof data.classMembers>();

  data.classMembers.forEach((member) => {
    const members = classMembersByClassId.get(member.classId) ?? [];
    members.push(member);
    classMembersByClassId.set(member.classId, members);
  });

  return (
    <section className="mt-8 rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("classAdminEyebrow")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
            {t("classAdminTitle")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-sakti-forestDark/70">
            {t("classAdminBody")}
          </p>
        </div>
        <p className="text-sm font-semibold text-sakti-forest">
          {t("classCount", { count: data.classes.length })}
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <form action={createAdminClass} className="rounded-sakti border border-sakti-mist bg-sakti-paper/70 p-5">
          <h3 className="font-display text-xl font-semibold text-sakti-forestDark">
            {t("createClassTitle")}
          </h3>
          <label className="mt-4 block text-sm font-semibold text-sakti-forestDark">
            {t("schoolName")}
            <input
              name="school_name"
              required
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-4 py-2 text-sm outline-none focus:border-sakti-forest"
              placeholder={t("schoolNamePlaceholder")}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-sakti-forestDark">
            {t("country")}
            <select
              name="country"
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-4 py-2 text-sm outline-none focus:border-sakti-forest"
            >
              <option value="Indonesia">Indonesia</option>
              <option value="Malaysia">Malaysia</option>
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold text-sakti-forestDark">
            {t("className")}
            <input
              name="class_name"
              required
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-4 py-2 text-sm outline-none focus:border-sakti-forest"
              placeholder={t("classNamePlaceholder")}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-sakti-forestDark">
            {t("facilitator")}
            <select
              name="facilitator_id"
              required
              className="mt-2 w-full rounded-full border border-sakti-mist bg-white px-4 py-2 text-sm outline-none focus:border-sakti-forest"
            >
              <option value="">{t("chooseFacilitator")}</option>
              {facilitatorUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} - {user.email}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-sakti-forest px-5 py-2 text-sm font-semibold text-white"
          >
            {t("createClassSubmit")}
          </button>
        </form>

        <div className="rounded-sakti border border-sakti-mist bg-white">
          <div className="border-b border-sakti-mist p-5">
            <h3 className="font-display text-xl font-semibold text-sakti-forestDark">
              {t("assignStudentTitle")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
              {t("assignStudentBody")}
            </p>
          </div>
          <form action={assignStudentToClass} className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto]">
            <select
              name="class_id"
              required
              className="rounded-full border border-sakti-mist bg-white px-4 py-2 text-sm outline-none focus:border-sakti-forest"
            >
              <option value="">{t("chooseClass")}</option>
              {data.classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.joinCode}
                </option>
              ))}
            </select>
            <select
              name="student_id"
              required
              className="rounded-full border border-sakti-mist bg-white px-4 py-2 text-sm outline-none focus:border-sakti-forest"
            >
              <option value="">{t("chooseStudent")}</option>
              {studentUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} - {user.email}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-full bg-sakti-forest px-5 py-2 text-sm font-semibold text-white">
              {t("assignStudentSubmit")}
            </button>
          </form>

          <div className="space-y-4 border-t border-sakti-mist p-5">
            {data.classes.map((classItem) => {
              const members = classMembersByClassId.get(classItem.id) ?? [];
              return (
                <article key={classItem.id} className="rounded-sakti border border-sakti-mist bg-sakti-paper/70 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                        {classItem.schoolName} - {classItem.country}
                      </p>
                      <h4 className="mt-1 font-display text-lg font-semibold text-sakti-forestDark">
                        {classItem.name}
                      </h4>
                      <p className="mt-1 text-sm text-sakti-forestDark/70">
                        {t("classFacilitator", { name: classItem.facilitatorName })}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sakti-forest">
                      {classItem.joinCode}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {members.map((member) => (
                      <div
                        key={`${member.classId}-${member.studentId}`}
                        className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sakti-forestDark">{member.studentName}</p>
                          <p className="break-all text-xs text-sakti-forestDark/60">{member.studentEmail}</p>
                        </div>
                        <form action={removeStudentFromClass}>
                          <input type="hidden" name="class_id" value={member.classId} />
                          <input type="hidden" name="student_id" value={member.studentId} />
                          <button
                            type="submit"
                            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700"
                          >
                            {t("removeStudent")}
                          </button>
                        </form>
                      </div>
                    ))}
                    {members.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-sakti-mist bg-white p-3 text-sm text-sakti-forestDark/65">
                        {t("emptyClassMembers")}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {data.classes.length === 0 ? (
              <p className="rounded-sakti border border-dashed border-sakti-mist bg-sakti-paper/70 p-5 text-sm text-sakti-forestDark/65">
                {t("emptyClasses")}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function SystemHealthPanel({ data }: { data: AdminDashboardData }) {
  const t = useTranslations("adminDashboard");

  return (
    <section className="mt-8 rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("healthEyebrow")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
            {t("healthTitle")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-sakti-forestDark/70">
            {t("healthBody")}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.systemHealth.map((item) => (
          <article key={item.key} className="rounded-sakti border border-sakti-mist bg-sakti-paper/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
              {t(`health.${item.key}.label`)}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-sakti-forestDark">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
              {t(`health.${item.key}.detail`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AdminDashboard({
  data,
  searchQuery = "",
  roleFilter = "",
}: {
  data: AdminDashboardData;
  searchQuery?: string;
  roleFilter?: string;
}) {
  const t = useTranslations("adminDashboard");
  const availableRoles = data.roles;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = data.users.filter((user) => {
    const matchesQuery =
      !normalizedQuery ||
      user.displayName.toLowerCase().includes(normalizedQuery) ||
      user.email.toLowerCase().includes(normalizedQuery);
    const matchesRole = !roleFilter || user.roles.includes(roleFilter as never);
    return matchesQuery && matchesRole;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-sakti-forestDark sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-sakti-forestDark/75">
          {t("description")}
        </p>
        {data.message ? (
          <p className="mt-5 rounded-sakti border border-sakti-gold/40 bg-sakti-gold/10 p-4 text-sm leading-6 text-sakti-forestDark/75">
            {data.message}
          </p>
        ) : null}
      </section>

      {data.isAdmin ? (
        <>
          <section className="mt-8 rounded-sakti border border-sakti-mist bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
                  {t("myRolesEyebrow")}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
                  {t("myRolesTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-sakti-forestDark/70">
                  {t("myRolesBody")}
                </p>
              </div>
              <p className="text-sm font-semibold text-sakti-forest">
                {t("activeRoles", { count: data.currentUserRoles.length })}
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.currentUserRoles.map((role) => (
                <Link
                  key={role.value}
                  href={role.href}
                  className="rounded-sakti border border-sakti-mist bg-sakti-paper p-4 transition hover:border-sakti-forest hover:bg-white"
                >
                  <p className="font-display text-lg font-semibold text-sakti-forestDark">
                    {role.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-sakti-forest">{role.href}</p>
                </Link>
              ))}
            </div>
          </section>

          <SystemHealthPanel data={data} />

          <ClassManager data={data} />

          <section className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-sakti-forestDark">
                {t("accountListTitle")}
              </h2>
              <p className="mt-2 text-sm text-sakti-forestDark/70">
                {t("accountListBody")}
              </p>
            </div>
            <p className="text-sm font-semibold text-sakti-forest">
              {t("accountCount", { filtered: filteredUsers.length, total: data.users.length })}
            </p>
          </div>
          <form className="mt-5 grid gap-3 rounded-sakti border border-sakti-mist bg-white p-4 sm:grid-cols-[1fr_220px_auto]">
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder={t("searchPlaceholder")}
              className="rounded-full border border-sakti-mist px-4 py-2 text-sm outline-none focus:border-sakti-forest"
            />
            <select
              name="role"
              defaultValue={roleFilter}
              className="rounded-full border border-sakti-mist bg-white px-4 py-2 text-sm outline-none focus:border-sakti-forest"
            >
              <option value="">{t("allRoles")}</option>
              {availableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-full bg-sakti-forest px-5 py-2 text-sm font-semibold text-white">
              {t("filter")}
            </button>
          </form>
          <div className="mt-5 space-y-4">
            {filteredUsers.map((user) => (
              <UserRoleManager key={user.id} user={user} data={data} />
            ))}
            {filteredUsers.length === 0 ? (
              <div className="rounded-sakti border border-dashed border-sakti-mist bg-white p-6 text-sm text-sakti-forestDark/70">
                {t("emptyUsers")}
              </div>
            ) : null}
          </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
