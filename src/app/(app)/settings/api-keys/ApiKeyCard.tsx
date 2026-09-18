"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { CopyRevealField } from "@/components/CopyRevealField";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { generateApiKeyAction, type ApiKeySummary } from "./actions";

export function ApiKeyCard({ credentials, canManage }: { credentials: ApiKeySummary; canManage: boolean }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const result = await guard(() => generateApiKeyAction());
    setGenerating(false);
    setConfirmRegenerateOpen(false);
    if (!result) return;
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setRevealedKey(result.apiKey);
    router.refresh();
  }

  if (!canManage) {
    return (
      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold text-foreground">{t("settingsApiAccessTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("settingsNoPermissionManage")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{t("settingsApiKeyLabel")}</p>
      {revealedKey ? (
        <CopyRevealField label={t("settingsNewApiKeyLabel")} value={revealedKey} />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            {credentials.apiKeyPrefix ? (
              <>
                <span className="font-mono">{credentials.apiKeyPrefix}…</span>
                {credentials.apiKeyCreatedAt ? (
                  <span className="text-muted-foreground"> — {t("settingsGeneratedPrefix")} {new Date(credentials.apiKeyCreatedAt).toLocaleDateString()}</span>
                ) : null}
              </>
            ) : (
              <span className="text-muted-foreground">{t("settingsNoKeyYet")}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => (credentials.apiKeyPrefix ? setConfirmRegenerateOpen(true) : handleGenerate())}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {credentials.apiKeyPrefix ? t("settingsRegenerateButton") : t("settingsGenerateKeyButton")}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <ConfirmActionDialog
        open={confirmRegenerateOpen}
        onClose={() => setConfirmRegenerateOpen(false)}
        onConfirm={handleGenerate}
        title={t("settingsRegenerateDialogTitle")}
        description={t("settingsRegenerateDialogDescription")}
        confirmLabel={t("settingsRegenerateButton")}
        pendingLabel={t("settingsRegenerating")}
        pending={generating}
        variant="destructive"
      />
    </div>
  );
}
