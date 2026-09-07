"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { decideClientSubmissionAction } from "../actions";

type Decision = "approve" | "reject" | "request_more_info" | null;

export function ClientDecisionActions({ clientId }: { clientId: string }) {
  const router = useRouter();
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
    const result = await decideClientSubmissionAction(clientId, confirmDecision, detail.trim() || undefined);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    close();
    router.refresh();
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Decision</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setConfirmDecision("approve")}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => setConfirmDecision("request_more_info")}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Request more info
        </button>
        <button
          type="button"
          onClick={() => setConfirmDecision("reject")}
          className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          Reject
        </button>
      </div>

      <ConfirmActionDialog
        open={confirmDecision === "approve"}
        onClose={close}
        onConfirm={handleConfirm}
        title="Approve this business?"
        description="They'll become an active client and receive an email confirming approval."
        confirmLabel="Approve"
        pendingLabel="Approving…"
        pending={pending}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </ConfirmActionDialog>

      <ConfirmActionDialog
        open={confirmDecision === "request_more_info"}
        onClose={close}
        onConfirm={handleConfirm}
        title="Request more information?"
        description="Their application reopens for edits and they'll receive an email with your note."
        confirmLabel="Send request"
        pendingLabel="Sending…"
        pending={pending}
        confirmDisabled={detail.trim().length < 5}
      >
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Explain what information is still needed…"
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
        title="Reject this application?"
        description="This is final — they'll receive an email with your reason."
        confirmLabel="Confirm rejection"
        pendingLabel="Rejecting…"
        pending={pending}
        confirmDisabled={detail.trim().length < 5}
        variant="destructive"
      >
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Explain why this application is being rejected…"
          rows={3}
          autoFocus
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </ConfirmActionDialog>
    </div>
  );
}
