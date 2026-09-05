"use client";

import { useState } from "react";
import { logoutAction } from "@/lib/auth-actions";
import { ConfirmActionDialog } from "./ConfirmActionDialog";

export function SignOutButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Sign out
      </button>
      <ConfirmActionDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => logoutAction()}
        title="Sign out?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Sign out"
        pendingLabel="Signing out…"
      />
    </>
  );
}
