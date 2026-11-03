"use client";

import { useEffect, useState } from "react";
import { HelpCircle, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { getKycSettingsAction, updateKycSettingsAction } from "./actions";

// FaceTec's own documented false-accept rate per level — shown in the explanation popup so the
// level numbers mean something concrete instead of an arbitrary 1-7 scale.
const MATCH_LEVEL_FAR: Record<number, string> = {
  1: "≈ 1 / 10",
  2: "≈ 1 / 100",
  3: "≈ 1 / 1 000 (approximatif)",
  4: "1 / 1 000",
  5: "1 / 10 000",
  6: "1 / 100 000 (approximatif)",
  7: "1 / 500 000 (99.9998%) — maximum",
};

export function KycSeverityCard() {
  const { t } = useLang();
  const guard = useSessionGuard();
  const [current, setCurrent] = useState<number | null>(null);
  const [platformDefault, setPlatformDefault] = useState(4);
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<number | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await guard(() => getKycSettingsAction());
      if (result) {
        setCurrent(result.kycAutoApproveMinMatchLevel);
        setPlatformDefault(result.platformDefault);
      }
      setLoading(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- fetched once on mount
    })();
  }, []);

  async function confirmChange() {
    if (pendingLevel === undefined) return;
    setSaving(true);
    setError(null);
    const result = await guard(() => updateKycSettingsAction(pendingLevel));
    setSaving(false);
    if (!result) return;
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setCurrent(result.kycAutoApproveMinMatchLevel);
    setPendingLevel(undefined);
  }

  if (loading) return null;

  const effectiveLevel = current ?? platformDefault;

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("kycSeverityCardTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("kycSeverityCardSubtitle")}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <select
          value={effectiveLevel}
          onChange={(e) => setPendingLevel(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((level) => (
            <option key={level} value={level}>
              {t("kycSeverityLevelLabel").replace("{level}", String(level))}
              {level === platformDefault ? ` (${t("kycSeverityDefaultSuffix")})` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          aria-label={t("pageGuideButtonAria")}
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HelpCircle className="size-4" />
        </button>
      </div>

      <Dialog open={guideOpen} onClose={() => setGuideOpen(false)} title={t("kycSeverityGuideTitle")} maxWidthClassName="max-w-xl" closeAriaLabel={t("closeDialogAria")}>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground">
          <p>{t("kycSeverityGuideIntro")}</p>
          <div className="flex flex-col gap-1.5 rounded-md border border-border p-3 text-xs">
            {[1, 2, 3, 4, 5, 6, 7].map((level) => (
              <div key={level} className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{t("kycSeverityLevelLabel").replace("{level}", String(level))}</span>
                <span className="text-muted-foreground">{MATCH_LEVEL_FAR[level]}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground">{t("kycSeverityGuideFloorNote")}</p>
          <p className="text-muted-foreground">{t("kycSeverityGuideHistoryNote")}</p>
        </div>
      </Dialog>

      <ConfirmActionDialog
        open={pendingLevel !== undefined}
        onClose={() => setPendingLevel(undefined)}
        onConfirm={confirmChange}
        title={t("kycSeverityConfirmTitle")}
        description={pendingLevel != null ? t("kycSeverityConfirmBody").replace("{level}", String(pendingLevel)) : undefined}
        confirmLabel={t("kycEditSave")}
        pendingLabel={t("kycEditSaving")}
        pending={saving}
      >
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </ConfirmActionDialog>
    </div>
  );
}
