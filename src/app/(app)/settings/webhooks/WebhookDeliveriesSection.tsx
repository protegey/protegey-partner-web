import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import type { WebhookDelivery, WebhookDeliveryStatus } from "./actions";

const STATUS_STYLE: Record<WebhookDeliveryStatus, string> = {
  delivered: "bg-primary/10 text-primary",
  pending: "bg-amber-500/15 text-amber-600",
  failed: "bg-destructive/10 text-destructive",
};

export async function WebhookDeliveriesSection({ deliveries }: { deliveries: WebhookDelivery[] }) {
  const lang = await getLang();
  const statusLabel: Record<WebhookDeliveryStatus, string> = {
    pending: t(lang, "webhookDeliveryStatusPending"),
    delivered: t(lang, "webhookDeliveryStatusDelivered"),
    failed: t(lang, "webhookDeliveryStatusFailed"),
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{t(lang, "webhookDeliveriesTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t(lang, "webhookDeliveriesSubtitle")}</p>
      </div>

      {deliveries.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">{t(lang, "webhookDeliveriesEmpty")}</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t(lang, "webhookDeliveryColEvent")}</th>
                <th className="px-4 py-2.5 font-medium">{t(lang, "webhookDeliveryColStatus")}</th>
                <th className="px-4 py-2.5 font-medium">{t(lang, "webhookDeliveryColAttempts")}</th>
                <th className="px-4 py-2.5 font-medium">{t(lang, "webhookDeliveryColDate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-4 py-2.5 text-foreground">
                    {delivery.eventType}
                    <span className="block text-xs text-muted-foreground">{delivery.eventId}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[delivery.status]}`}>
                      {statusLabel[delivery.status]}
                    </span>
                    {delivery.status === "failed" && delivery.lastError ? (
                      <span className="block max-w-xs truncate text-xs text-muted-foreground" title={delivery.lastError}>
                        {delivery.lastError}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{delivery.attempts}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(delivery.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
