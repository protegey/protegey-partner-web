"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { generateAlertRule, type AlertRule } from "./actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

/**
 * Pan-Studio: describe a monitoring scenario in plain language, DeepSeek proposes one rule in
 * the closed DSL grammar. It's always saved as a draft — never activated automatically — so it
 * shows up in the table below for review, exactly like a hand-authored draft would.
 */
export function PanStudioPanel({ onGenerated }: { onGenerated: (rule: AlertRule) => void }) {
  const guard = useSessionGuard();
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AlertRule | null>(null);

  async function handleGenerate() {
    if (description.trim().length < 10) {
      setError("Describe the scenario in a bit more detail (at least 10 characters).");
      return;
    }
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await guard(() => generateAlertRule(description));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setSuccess(result);
      setDescription("");
      onGenerated(result);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Pan-Studio — describe a rule in plain language</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Only produces payment-monitoring rules — anything else is declined. Every proposal is saved as a draft for
        you to review and activate below; nothing goes live automatically.
      </p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="e.g. Flag any KYC1 customer who receives more than 5 incoming transfers from 5 different people within 2 days totaling more than 1,000,000 XOF"
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {success ? (
        <p className="mt-2 text-sm text-primary">
          Draft rule &ldquo;{success.name}&rdquo; ({success.code}) created — review and activate it in the table below.
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="mt-3 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {pending ? "Generating…" : "Generate rule"}
      </button>
    </div>
  );
}
