"use client";

import { useTranslations } from "next-intl";
import { deleteUserAccount } from "@/app/[locale]/(admin)/admin/actions";

export default function DeleteUserAccountForm({
  userId,
  email,
  disabled = false,
}: {
  userId: string;
  email: string;
  disabled?: boolean;
}) {
  const t = useTranslations("adminDashboard");

  return (
    <form
      action={deleteUserAccount}
      onSubmit={(event) => {
        const confirmed = window.confirm(t("deleteAccountConfirm", { email }));
        if (!confirmed) event.preventDefault();
      }}
      className="mt-3 flex justify-end"
    >
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        title={disabled ? t("deleteSelfDisabled") : t("deleteAccountTitle")}
      >
        {t("deleteAccount")}
      </button>
    </form>
  );
}
