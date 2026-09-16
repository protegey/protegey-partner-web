"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { generateApiKeyAction, configureWebhookAction, type ApiCredentialSummary } from "./actions";

function CopyRevealField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied — the value is still selectable below.
    }
  }

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
      <p className="text-xs font-medium text-amber-700">{label} — shown once, copy it now</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function ApiAccessSection({
  credentials,
  canManage,
}: {
  credentials: ApiCredentialSummary;
  canManage: boolean;
}) {
  const router = useRouter();
  const guard = useSessionGuard();
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState(credentials.webhookUrl ?? "");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const result = await guard(() => generateApiKeyAction());
    setGenerating(false);
    setConfirmRegenerateOpen(false);
    if (!result) return;
    if (result.error || !result.apiKey) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setRevealedKey(result.apiKey);
    router.refresh();
  }

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setSavingWebhook(true);
    setError(null);
    const result = await guard(() => configureWebhookAction(webhookUrl));
    setSavingWebhook(false);
    if (!result) return;
    if (result.error || !result.webhookSecret) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setRevealedSecret(result.webhookSecret);
    router.refresh();
  }

  if (!canManage) {
    return (
      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold text-foreground">API access</p>
        <p className="text-xs text-muted-foreground">You don&apos;t have permission to manage this.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="mb-1 text-sm font-semibold text-foreground">API access</p>
      <p className="mb-4 text-sm text-muted-foreground">
        Let your own backend call Protegey directly to start KYC verifications and receive status updates.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">API key</p>
          {revealedKey ? (
            <CopyRevealField label="New API key" value={revealedKey} />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-foreground">
                {credentials.apiKeyPrefix ? (
                  <>
                    <span className="font-mono">{credentials.apiKeyPrefix}…</span>
                    {credentials.apiKeyCreatedAt ? (
                      <span className="text-muted-foreground"> — generated {new Date(credentials.apiKeyCreatedAt).toLocaleDateString()}</span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted-foreground">No key generated yet</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => (credentials.apiKeyPrefix ? setConfirmRegenerateOpen(true) : handleGenerate())}
                className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {credentials.apiKeyPrefix ? "Regenerate" : "Generate key"}
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Webhook</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Protegey will POST a signed notification here whenever a KYC session&apos;s status changes.
          </p>
          <form onSubmit={handleSaveWebhook} className="flex items-center gap-2">
            <input
              type="url"
              required
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-app.example.com/webhooks/protegey"
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={savingWebhook}
              className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              {savingWebhook ? "Saving…" : "Save & regenerate secret"}
            </button>
          </form>
          {credentials.hasWebhookSecret && !revealedSecret ? (
            <p className="mt-1.5 text-xs text-muted-foreground">A signing secret is already configured.</p>
          ) : null}
          {revealedSecret ? <div className="mt-2"><CopyRevealField label="Webhook signing secret" value={revealedSecret} /></div> : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <ConfirmActionDialog
        open={confirmRegenerateOpen}
        onClose={() => setConfirmRegenerateOpen(false)}
        onConfirm={handleGenerate}
        title="Regenerate your API key?"
        description="Your current key will stop working immediately — any integration still using it will break until you update it."
        confirmLabel="Regenerate"
        pendingLabel="Regenerating…"
        pending={generating}
        variant="destructive"
      />
    </div>
  );
}
