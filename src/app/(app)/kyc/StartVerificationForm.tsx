"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy } from "lucide-react";
import { startKycSessionAction, type StartKycSessionState } from "./actions";

const initialState: StartKycSessionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Starting…" : "Start verification"}
    </button>
  );
}

function CopyLinkField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied — the link is still selectable/openable below.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground">
        Verification link ready — send it to the user however you like (SMS, email, in-app).
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-foreground outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-primary hover:underline"
      >
        Open verification page →
      </a>
    </div>
  );
}

export function StartVerificationForm() {
  const [state, formAction] = useActionState(startKycSessionAction, initialState);

  if (state.url) {
    return <CopyLinkField url={state.url} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        name="fullName"
        type="text"
        placeholder="Full name (optional label — Didit fills this in from the ID document)"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
