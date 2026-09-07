"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
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
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">You</span>;
  }

  async function handleStatusConfirm() {
    setStatusPending(true);
    setStatusError(null);
    const result = await setAgentStatusAction(userId, !isActive);
    setStatusPending(false);
    if (result.error) {
      setStatusError(result.error);
      return;
    }
    setStatusOpen(false);
    router.refresh();
  }

  async function handleResetConfirm() {
    setResetPending(true);
    setResetError(null);
    const result = await sendPasswordResetAction(userId);
    setResetPending(false);
    if (result.error) {
      setResetError(result.error);
      return;
    }
    setResetSent(true);
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
        Reset password
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
        {isActive ? "Block" : "Unblock"}
      </button>

      <ConfirmActionDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={handleStatusConfirm}
        title={isActive ? "Block this agent?" : "Unblock this agent?"}
        description={
          isActive
            ? "They will no longer be able to sign in or do anything in the organization."
            : "They will regain access to the organization."
        }
        confirmLabel={isActive ? "Block" : "Unblock"}
        pendingLabel={isActive ? "Blocking…" : "Unblocking…"}
        pending={statusPending}
        variant={isActive ? "destructive" : "primary"}
      >
        {statusError ? <p className="text-sm text-destructive">{statusError}</p> : null}
      </ConfirmActionDialog>

      <ConfirmActionDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetConfirm}
        title="Send a password reset email?"
        description="They'll receive a link by email to choose a new password."
        confirmLabel="Send"
        pendingLabel="Sending…"
        pending={resetPending}
        confirmDisabled={resetSent}
      >
        {resetError ? <p className="text-sm text-destructive">{resetError}</p> : null}
        {resetSent ? <p className="text-sm text-primary">Reset email sent.</p> : null}
      </ConfirmActionDialog>
    </div>
  );
}
