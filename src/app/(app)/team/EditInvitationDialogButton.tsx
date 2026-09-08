"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { RoleMultiSelect } from "@/components/RoleMultiSelect";
import { updateInvitationAction, type AssignableRole, type PendingInvitation, type UpdateInvitationState } from "./actions";

const initialState: UpdateInvitationState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function EditInvitationDialogButton({ invitation, roles }: { invitation: PendingInvitation; roles: AssignableRole[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const action = updateInvitationAction.bind(null, invitation.id);
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      const timeout = setTimeout(() => setOpen(false), 800);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Pencil className="size-3" />
        Edit
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Edit invitation" description="Changes apply the next time this invitation is sent.">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="firstName"
              type="text"
              placeholder="First name"
              defaultValue={invitation.firstName}
              required
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              name="lastName"
              type="text"
              placeholder="Last name"
              defaultValue={invitation.lastName}
              required
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              defaultValue={invitation.email}
              required
              className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Roles</p>
            <RoleMultiSelect roles={roles} defaultSelectedNames={invitation.roles.map((role) => role.name)} />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-primary">Saved.</p> : null}

          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </Dialog>
    </>
  );
}
