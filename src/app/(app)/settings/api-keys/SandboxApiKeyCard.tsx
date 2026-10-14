"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { CopyRevealField } from "@/components/CopyRevealField";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { generateSandboxApiKeyAction, type ApiKeySummary } from "./actions";

/** Mirrors ApiKeyCard exactly — kept as its own component rather than a parameterized one
 * since the two keys have independent lifecycles (regenerating one never touches the other). */
export function SandboxApiKeyCard({ credentials, canManage }: { credentials: ApiKeySummary; canManage: boolean }) {
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
    const result = await guard(() => generateSandboxApiKeyAction());
    setGenerating(false);
    setConfirmRegenerateOpen(false);
    if (!result) return;
    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    setRevealedKey(result.sandboxApiKey);
    router.refresh();
    toast.success(t("apiKeyGeneratedToast"));
  }

  if (!canManage) return null;

  return (
    <div className="rounded-md border border-amber-500/30 bg-card p-5">
      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{t("sandboxKeyTitle")}</p>
      <p className="mb-3 text-xs text-muted-foreground">{t("sandboxKeyHint")}</p>
      {revealedKey ? (
        <CopyRevealField label={t("settingsNewApiKeyLabel")} value={revealedKey} />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            {credentials.sandboxApiKeyPrefix ? (
              <>
                <span className="font-mono">{credentials.sandboxApiKeyPrefix}…</span>
                {credentials.sandboxApiKeyCreatedAt ? (
                  <span className="text-muted-foreground"> — {t("settingsGeneratedPrefix")} {new Date(credentials.sandboxApiKeyCreatedAt).toLocaleDateString()}</span>
                ) : null}
              </>
            ) : (
              <span className="text-muted-foreground">{t("settingsNoKeyYet")}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => (credentials.sandboxApiKeyPrefix ? setConfirmRegenerateOpen(true) : handleGenerate())}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {credentials.sandboxApiKeyPrefix ? t("settingsRegenerateButton") : t("settingsGenerateKeyButton")}
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
