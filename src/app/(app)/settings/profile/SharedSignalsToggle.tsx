"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { updateSharedSignalsAction } from "./actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

export function SharedSignalsToggle({ initialEnabled, canManage }: { initialEnabled: boolean; canManage: boolean }) {
  const guard = useSessionGuard();
  const { t } = useLang();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const next = !enabled;
    setSaving(true);
    setError(null);
    try {
      const result = await guard(() => updateSharedSignalsAction(next));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setEnabled(next);
      toast.success(next ? t("sharedSignalsEnabledToast") : t("sharedSignalsDisabledToast"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{t("sharedSignalsToggleLabel")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("sharedSignalsToggleHint")}</p>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={!canManage || saving}
        onClick={handleToggle}
        className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
      >
        {saving ? (
          <Loader2 className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary-foreground" />
        ) : (
          <span className={`inline-block size-4 transform rounded-full bg-background shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
        )}
      </button>
    </div>
  );
}
