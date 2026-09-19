"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { generateSarReportAction } from "../actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

export function NewSarReportClient({ caseId }: { caseId: string }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [countryCode, setCountryCode] = useState("TG");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await guard(() => generateSarReportAction(caseId, countryCode));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      router.push(`/sar-str/${result.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!caseId) {
    return <p className="mx-auto max-w-lg text-sm text-destructive">{t("sarNewMissingCase")}</p>;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("sarNewPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("sarNewPageSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">{t("sarNewCountryLabel")}</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="TG">Togo — CENTIF-Togo</option>
          </select>
          <p className="text-xs text-muted-foreground">{t("sarNewCountryHint")}</p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("sarNewSubmitButton")}
        </button>
      </form>
    </div>
  );
}
