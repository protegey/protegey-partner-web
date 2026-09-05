"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { RoleMultiSelect } from "@/components/RoleMultiSelect";
import { inviteAgentAction, type AssignableRole, type InviteAgentState } from "./actions";

const initialState: InviteAgentState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Sending invitation…" : "Invite agent"}
    </button>
  );
}

export function InviteAgentForm({ roles, onSuccess }: { roles: AssignableRole[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState(inviteAgentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
      const timeout = setTimeout(() => onSuccess?.(), 1000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="firstName"
          type="text"
          placeholder="First name"
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          name="lastName"
          type="text"
          placeholder="Last name"
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          name="email"
          type="email"
          placeholder="Email address"
          required
          className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Roles</p>
        <RoleMultiSelect roles={roles} defaultSelectedNames={["partner_viewer"]} />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-primary">Invitation sent — they&apos;ll receive an email to set up their account.</p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
