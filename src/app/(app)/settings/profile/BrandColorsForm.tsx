"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { updateBrandingColorsAction } from "./actions";
import { DEFAULT_BRAND_COLORS } from "@/lib/brandColors";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface ColorFieldProps {
  label: string;
  hint: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
  canManage: boolean;
}

function ColorField({ label, hint, value, defaultValue, onChange, canManage }: ColorFieldProps) {
  const { t } = useLang();
  const isDefault = value.toLowerCase() === defaultValue.toLowerCase();
  const valid = HEX_PATTERN.test(value);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : defaultValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={!canManage}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!canManage}
          placeholder={defaultValue}
          className={`w-32 rounded-md border bg-background px-2.5 py-1.5 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
            valid ? "border-border" : "border-destructive"
          }`}
        />
        {!isDefault ? (
          <button
            type="button"
            onClick={() => onChange(defaultValue)}
            disabled={!canManage}
            title={t("brandColorsResetOne")}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            {t("brandColorsResetOne")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function BrandColorsForm({
  initialPrimary,
  initialSecondary,
  initialTertiary,
  canManage,
}: {
  initialPrimary: string | null;
  initialSecondary: string | null;
  initialTertiary: string | null;
  canManage: boolean;
}) {
  const guard = useSessionGuard();
  const { t } = useLang();
  const initial = {
    primary: initialPrimary ?? DEFAULT_BRAND_COLORS.primary,
    secondary: initialSecondary ?? DEFAULT_BRAND_COLORS.secondary,
    tertiary: initialTertiary ?? DEFAULT_BRAND_COLORS.tertiary,
  };
  const [primary, setPrimary] = useState(initial.primary);
  const [secondary, setSecondary] = useState(initial.secondary);
  const [tertiary, setTertiary] = useState(initial.tertiary);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);

  const current = { primary, secondary, tertiary };
  const dirty = current.primary !== saved.primary || current.secondary !== saved.secondary || current.tertiary !== saved.tertiary;
  const allValid = HEX_PATTERN.test(primary) && HEX_PATTERN.test(secondary) && HEX_PATTERN.test(tertiary);

  async function handleSave() {
    if (!allValid) return;
    setSaving(true);
    try {
      // Only a color that actually changed is sent, and a value put back to the default is sent
      // as `null` (reset), never re-sent as that same hex string — keeps "never explicitly set"
      // and "explicitly set to the default's own hex value" distinct server-side.
      const body: { primaryColor?: string | null; secondaryColor?: string | null; tertiaryColor?: string | null } = {};
      if (current.primary !== saved.primary) body.primaryColor = current.primary === DEFAULT_BRAND_COLORS.primary ? null : current.primary;
      if (current.secondary !== saved.secondary) body.secondaryColor = current.secondary === DEFAULT_BRAND_COLORS.secondary ? null : current.secondary;
      if (current.tertiary !== saved.tertiary) body.tertiaryColor = current.tertiary === DEFAULT_BRAND_COLORS.tertiary ? null : current.tertiary;

      const result = await guard(() => updateBrandingColorsAction(body));
      if (result === null) return;
      if (isError(result)) {
        toast.error(result.error);
        return;
      }
      setSaved(current);
      toast.success(t("brandColorsUpdatedToast"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted-foreground">{t("brandColorsHint")}</p>
      <ColorField
        label={t("brandColorsPrimaryLabel")}
        hint={t("brandColorsPrimaryHint")}
        value={primary}
        defaultValue={DEFAULT_BRAND_COLORS.primary}
        onChange={setPrimary}
        canManage={canManage}
      />
      <ColorField
        label={t("brandColorsSecondaryLabel")}
        hint={t("brandColorsSecondaryHint")}
        value={secondary}
        defaultValue={DEFAULT_BRAND_COLORS.secondary}
        onChange={setSecondary}
        canManage={canManage}
      />
      <ColorField
        label={t("brandColorsTertiaryLabel")}
        hint={t("brandColorsTertiaryHint")}
        value={tertiary}
        defaultValue={DEFAULT_BRAND_COLORS.tertiary}
        onChange={setTertiary}
        canManage={canManage}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canManage || !dirty || !allValid || saving}
          onClick={handleSave}
          className="rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t("brandColorsSavingEllipsis") : t("brandColorsSaveButton")}
        </button>
        {!allValid ? <p className="text-xs text-destructive">{t("brandColorsInvalidHex")}</p> : null}
      </div>
    </div>
  );
}
