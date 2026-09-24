"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { createCaseAction, type CasePriority } from "../actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

export function NewCaseClient({ initialCustomer, initialAlertId }: { initialCustomer: string; initialAlertId: string }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [externalCustomerId, setExternalCustomerId] = useState(initialCustomer);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<CasePriority>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const alertIds = initialAlertId ? [initialAlertId] : [];
      const result = await guard(() => createCaseAction(externalCustomerId, title, alertIds, priority));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      router.push(`/cases/${result.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("caseNewPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("caseNewPageSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">{t("signalsFilterCustomerLabel")}</label>
          <input
            required
            value={externalCustomerId}
            onChange={(e) => setExternalCustomerId(e.target.value)}
            placeholder={t("signalsFilterCustomerPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">{t("caseNewTitleLabel")}</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("caseNewTitlePlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">{t("casesColPriority")}</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as CasePriority)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="critical">{t("casePriorityCritical")}</option>
            <option value="high">{t("casePriorityHigh")}</option>
            <option value="medium">{t("casePriorityMedium")}</option>
            <option value="low">{t("casePriorityLow")}</option>
          </select>
        </div>

        {initialAlertId ? (
          <p className="text-xs text-muted-foreground">{t("caseNewAlertAttachedNote")}</p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("caseNewSubmitButton")}
        </button>
      </form>
    </div>
  );
}
