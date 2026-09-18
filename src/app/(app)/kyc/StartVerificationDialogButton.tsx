"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { useLang } from "@/lib/i18n/LangProvider";
import { StartVerificationForm } from "./StartVerificationForm";

export function StartVerificationDialogButton() {
  const [open, setOpen] = useState(false);
  const { t } = useLang();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        {t("kycStartVerificationButton")}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("kycStartVerificationDialogTitle")}
        description={t("kycStartVerificationDialogDescription")}
      >
        <StartVerificationForm />
      </Dialog>
    </>
  );
}
