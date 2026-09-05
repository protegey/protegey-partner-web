"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { setAgentStatusAction } from "./actions";

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
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">You</span>;
  }

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await setAgentStatusAction(userId, !isActive);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
          isActive
            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
            : "border-border text-foreground hover:bg-muted"
        }`}
      >
        {isActive ? "Block" : "Unblock"}
      </button>
      <ConfirmActionDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={isActive ? "Block this agent?" : "Unblock this agent?"}
        description={
          isActive
            ? "They will no longer be able to sign in or do anything in the organization."
            : "They will regain access to the organization."
        }
        confirmLabel={isActive ? "Block" : "Unblock"}
        pendingLabel={isActive ? "Blocking…" : "Unblocking…"}
        pending={pending}
        variant={isActive ? "destructive" : "primary"}
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </>
  );
}
