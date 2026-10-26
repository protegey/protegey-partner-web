"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { updatePortalUrlAction } from "./actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

export function PortalUrlForm({ initialUrl, canManage }: { initialUrl: string; canManage: boolean }) {
  const guard = useSessionGuard();
  const { t } = useLang();
  const [value, setValue] = useState(initialUrl);
  const [saved, setSaved] = useState(initialUrl);
  const [saving, setSaving] = useState(false);
  const dirty = value.trim() !== saved;

  async function handleSave() {
    const url = value.trim();
    if (!url) return;
    setSaving(true);
    try {
      const result = await guard(() => updatePortalUrlAction(url));
      if (result === null) return;
      if (isError(result)) {
        toast.error(result.error);
        return;
      }
      setSaved(url);
      toast.success(t("portalUrlSavedToast"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-foreground">{t("portalUrlLabel")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("portalUrlHint")}</p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!canManage || saving}
          className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
        <button
          type="button"
          disabled={!canManage || !dirty || saving}
          onClick={handleSave}
          className="shrink-0 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t("portalUrlSavingEllipsis") : t("portalUrlSaveButton")}
        </button>
      </div>
    </div>
  );
}
