"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { updateAiConfigAction, type AiConfig } from "./actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

export function AiConfigForm({ initial, canManage }: { initial: AiConfig; canManage: boolean }) {
  const guard = useSessionGuard();
  const { t } = useLang();
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [hasDeepseekApiKey, setHasDeepseekApiKey] = useState(initial.hasDeepseekApiKey);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!deepseekApiKey.trim()) return;
    setSaving(true);
    try {
      const result = await guard(() => updateAiConfigAction(deepseekApiKey.trim()));
      if (result === null) return;
      if (isError(result)) {
        toast.error(result.error);
        return;
      }
      setHasDeepseekApiKey(true);
      setDeepseekApiKey("");
      toast.success(t("aiSettingsSavedToast"));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className={`size-2 rounded-full ${hasDeepseekApiKey ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
        <span className="text-muted-foreground">{hasDeepseekApiKey ? t("aiSettingsStatusActive") : t("aiSettingsStatusInactive")}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="deepseekApiKey" className="text-sm font-medium text-foreground">
          {t("aiSettingsApiKeyLabel")}
        </label>
        <input
          id="deepseekApiKey"
          type="password"
          autoComplete="off"
          value={deepseekApiKey}
          onChange={(e) => setDeepseekApiKey(e.target.value)}
          disabled={!canManage || saving}
          placeholder={hasDeepseekApiKey ? t("aiSettingsApiKeyAlreadySet") : "sk-..."}
          className={inputClass}
        />
      </div>

      <button
        type="button"
        disabled={!canManage || saving || !deepseekApiKey.trim()}
        onClick={handleSave}
        className="w-fit rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? t("aiSettingsSavingEllipsis") : t("aiSettingsSaveButton")}
      </button>
    </div>
  );
}
