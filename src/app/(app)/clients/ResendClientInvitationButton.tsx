"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { resendClientInvitationAction } from "./actions";
import { useLang } from "@/lib/i18n/LangProvider";

export function ResendClientInvitationButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  async function handleConfirm() {
    setPending(true);
    const res = await guard(() => resendClientInvitationAction(clientId));
    setPending(false);
    setResult(res);
    if (res?.success) {
      toast.success(t("clientsInvitationResentToast"));
      setConfirmOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
      >
        {t("clientsResendButton")}
      </button>
      {result?.error ? <p className="text-xs text-destructive">{result.error}</p> : null}
      {result?.success ? <p className="text-xs text-primary">{t("clientsResendSent")}</p> : null}

      <ConfirmActionDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={t("resendInvitationDialogTitle")}
        description={t("resendInvitationDialogDescription")}
        confirmLabel={t("clientsResendButton")}
        pendingLabel={t("clientsResendSending")}
        pending={pending}
      />
    </div>
  );
}
