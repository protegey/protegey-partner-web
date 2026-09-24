"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { setAgentStatusAction, sendPasswordResetAction } from "./actions";

export function TeamMemberActions({
  userId,
  isActive,
  isSelf,
}: {
  userId: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">{t("teamYouLabel")}</span>;
  }

  async function handleStatusConfirm() {
    setStatusPending(true);
    setStatusError(null);
    const result = await guard(() => setAgentStatusAction(userId, !isActive));
    setStatusPending(false);
    if (!result) return;
    if (result.error) {
      setStatusError(result.error);
      toast.error(result.error);
      return;
    }
    setStatusOpen(false);
    router.refresh();
    toast.success(isActive ? t("teamMemberBlockedToast") : t("teamMemberUnblockedToast"));
  }

  async function handleResetConfirm() {
    setResetPending(true);
    setResetError(null);
    const result = await guard(() => sendPasswordResetAction(userId));
    setResetPending(false);
    if (!result) return;
    if (result.error) {
      setResetError(result.error);
      toast.error(result.error);
      return;
    }
    setResetSent(true);
    toast.success(t("teamPasswordResetSentToast"));
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => {
          setResetSent(false);
          setResetError(null);
          setResetOpen(true);
        }}
        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        {t("teamResetPasswordButton")}
      </button>
      <button
        type="button"
        onClick={() => setStatusOpen(true)}
        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
          isActive
            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
            : "border-border text-foreground hover:bg-muted"
        }`}
      >
        {isActive ? t("teamBlockButton") : t("teamUnblockButton")}
      </button>

      <ConfirmActionDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={handleStatusConfirm}
        title={isActive ? t("teamBlockDialogTitle") : t("teamUnblockDialogTitle")}
        description={isActive ? t("teamBlockDialogDescription") : t("teamUnblockDialogDescription")}
        confirmLabel={isActive ? t("teamBlockButton") : t("teamUnblockButton")}
        pendingLabel={isActive ? t("teamBlocking") : t("teamUnblocking")}
        pending={statusPending}
        variant={isActive ? "destructive" : "primary"}
      >
        {statusError ? <p className="text-sm text-destructive">{statusError}</p> : null}
      </ConfirmActionDialog>

      <ConfirmActionDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetConfirm}
        title={t("teamSendResetDialogTitle")}
        description={t("teamSendResetDialogDescription")}
        confirmLabel={t("teamSendButton")}
        pendingLabel={t("teamSending")}
        pending={resetPending}
        confirmDisabled={resetSent}
      >
        {resetError ? <p className="text-sm text-destructive">{resetError}</p> : null}
        {resetSent ? <p className="text-sm text-primary">{t("teamResetEmailSent")}</p> : null}
      </ConfirmActionDialog>
    </div>
  );
}
