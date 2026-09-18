"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { inviteClientAction, type InviteClientState } from "./actions";
import { useLang } from "@/lib/i18n/LangProvider";

const initialState: InviteClientState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLang();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t("clientsInviteFormSending") : t("clientsInviteButton")}
    </button>
  );
}

export function InviteClientForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { t } = useLang();
  const [state, formAction] = useActionState(inviteClientAction, initialState);
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
      <div className="flex flex-col gap-3">
        <input
          name="contactName"
          type="text"
          placeholder={t("clientsInviteFormNamePlaceholder")}
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          name="contactEmail"
          type="email"
          placeholder={t("clientsInviteFormEmailPlaceholder")}
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-primary">{t("clientsInviteFormSuccess")}</p> : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
