"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { exportWebhookDeliveriesAction, type WebhookDeliveryStatus } from "./actions";

export function WebhookDeliveriesToolbar({ initialStatus }: { initialStatus: WebhookDeliveryStatus | "all" }) {
  const router = useRouter();
  const { t } = useLang();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);

  function applyFilter(next: WebhookDeliveryStatus | "all") {
    setStatus(next);
    const params = new URLSearchParams();
    if (next !== "all") params.set("status", next);
    startTransition(() => router.push(`/settings/webhooks?${params.toString()}`));
  }

  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("ctrFilterStatusLabel")}</label>
        <select
          value={status}
          onChange={(e) => applyFilter(e.target.value as WebhookDeliveryStatus | "all")}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">{t("txFilterAllOption")}</option>
          <option value="pending">{t("webhookDeliveryStatusPending")}</option>
          <option value="delivered">{t("webhookDeliveryStatusDelivered")}</option>
          <option value="failed">{t("webhookDeliveryStatusFailed")}</option>
        </select>
      </div>
      <ExportCsvButton
        filename="webhook-deliveries-export.csv"
        onExport={() => exportWebhookDeliveriesAction(status !== "all" ? { status } : {})}
      />
    </div>
  );
}
