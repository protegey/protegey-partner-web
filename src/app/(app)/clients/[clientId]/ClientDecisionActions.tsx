"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { decideClientSubmissionAction } from "../actions";

type Decision = "approve" | "reject" | "request_more_info" | null;

export function ClientDecisionActions({ clientId }: { clientId: string }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [confirmDecision, setConfirmDecision] = useState<Decision>(null);
  const [detail, setDetail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setConfirmDecision(null);
    setDetail("");
    setError(null);
  }

  async function handleConfirm() {
    if (!confirmDecision) return;
    setPending(true);
    setError(null);
    const result = await guard(() => decideClientSubmissionAction(clientId, confirmDecision, detail.trim() || undefined));
    setPending(false);
    if (!result) return; // dialog was cancelled — leave the confirm dialog open as-is
    if (result.error) {
      setError(result.error);
      return;
    }
    close();
    router.refresh();
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">{t("clientsDecisionTitle")}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setConfirmDecision("approve")}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("clientsDecisionApprove")}
        </button>
        <button
          type="button"
          onClick={() => setConfirmDecision("request_more_info")}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          {t("clientsDecisionRequestMoreInfo")}
        </button>
        <button
          type="button"
          onClick={() => setConfirmDecision("reject")}
          className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          {t("clientsDecisionReject")}
        </button>
      </div>

      <ConfirmActionDialog
        open={confirmDecision === "approve"}
        onClose={close}
        onConfirm={handleConfirm}
        title={t("clientsApproveDialogTitle")}
        description={t("clientsApproveDialogDescription")}
        confirmLabel={t("clientsDecisionApprove")}
        pendingLabel={t("clientsApprovePendingLabel")}
        pending={pending}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </ConfirmActionDialog>

      <ConfirmActionDialog
        open={confirmDecision === "request_more_info"}
        onClose={close}
        onConfirm={handleConfirm}
        title={t("clientsMoreInfoDialogTitle")}
        description={t("clientsMoreInfoDialogDescription")}
        confirmLabel={t("clientsMoreInfoConfirmLabel")}
        pendingLabel={t("clientsMoreInfoPendingLabel")}
        pending={pending}
        confirmDisabled={detail.trim().length < 5}
      >
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t("clientsMoreInfoPlaceholder")}
          rows={3}
          autoFocus
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </ConfirmActionDialog>

      <ConfirmActionDialog
        open={confirmDecision === "reject"}
        onClose={close}
        onConfirm={handleConfirm}
        title={t("clientsRejectDialogTitle")}
        description={t("clientsRejectDialogDescription")}
        confirmLabel={t("clientsRejectConfirmLabel")}
        pendingLabel={t("clientsRejectPendingLabel")}
        pending={pending}
        confirmDisabled={detail.trim().length < 5}
        variant="destructive"
      >
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t("clientsRejectPlaceholder")}
          rows={3}
          autoFocus
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </ConfirmActionDialog>
    </div>
  );
}
