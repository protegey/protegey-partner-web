"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { InviteClientForm } from "./InviteClientForm";

export function InviteClientDialogButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        Invite client
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Invite a business client"
        description="They'll receive an email with a link to complete their own business application — no Protegey account required."
      >
        <InviteClientForm onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
