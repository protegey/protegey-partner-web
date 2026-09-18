"use client";

import { useState } from "react";
import { logoutAction } from "@/lib/auth-actions";
import { useLang } from "@/lib/i18n/LangProvider";
import { ConfirmActionDialog } from "./ConfirmActionDialog";

export function SignOutButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {t("signOut")}
      </button>
      <ConfirmActionDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => logoutAction()}
        title={t("signOutConfirmTitle")}
        description={t("signOutConfirmDescription")}
        confirmLabel={t("signOut")}
        pendingLabel={t("signOutPendingLabel")}
      />
    </>
  );
}
