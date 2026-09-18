"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyRevealField } from "@/components/CopyRevealField";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { configureWebhookAction, type WebhookSummary } from "./actions";

export function WebhookCard({ credentials, canManage }: { credentials: WebhookSummary; canManage: boolean }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [webhookUrl, setWebhookUrl] = useState(credentials.webhookUrl ?? "");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setSavingWebhook(true);
    setError(null);
    const result = await guard(() => configureWebhookAction(webhookUrl));
    setSavingWebhook(false);
    if (!result) return;
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setRevealedSecret(result.webhookSecret);
    router.refresh();
  }

  if (!canManage) {
    return (
      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold text-foreground">{t("settingsWebhookNoPermissionTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("settingsNoPermissionManage")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{t("settingsWebhookLabel")}</p>
      <form onSubmit={handleSaveWebhook} className="flex items-center gap-2">
        <input
          type="url"
          required
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder={t("settingsWebhookPlaceholder")}
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={savingWebhook}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {savingWebhook ? t("settingsSavingWebhook") : t("settingsSaveRegenerateSecret")}
        </button>
      </form>
      {credentials.hasWebhookSecret && !revealedSecret ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{t("settingsSecretAlreadyConfigured")}</p>
      ) : null}
      {revealedSecret ? <div className="mt-2"><CopyRevealField label={t("settingsWebhookSecretLabel")} value={revealedSecret} /></div> : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
