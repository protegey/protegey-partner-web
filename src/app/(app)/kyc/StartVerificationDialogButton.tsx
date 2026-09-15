"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { StartVerificationForm } from "./StartVerificationForm";

export function StartVerificationDialogButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        Start verification
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Start an identity verification"
        description="Creates a Didit session for one of your end users and returns a link to their hosted verification flow."
      >
        <StartVerificationForm />
      </Dialog>
    </>
  );
}
