"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Fingerprint } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { CountryBadge, DeviceAttributesDetails, DeviceSummaryCell } from "@/components/DeviceAttributesSummary";
import type { DeviceSignal } from "./actions";
import type { PaginatedResult } from "../../transactions/actions";

const ACTION_COLOR: Record<string, string> = {
  allow: "bg-emerald-500/15 text-emerald-600",
  soft_challenge: "bg-amber-500/15 text-amber-600",
  hard_challenge: "bg-orange-500/15 text-orange-600",
  block: "bg-destructive/15 text-destructive",
};

export function DeviceSignalsClient({
  result,
  page,
  initialCustomer,
  initialAction,
}: {
  result: PaginatedResult<DeviceSignal>;
  page: number;
  initialCustomer: string;
  initialAction: string;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [customer, setCustomer] = useState(initialCustomer);
  const [action, setAction] = useState(initialAction);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const actionLabel: Record<string, string> = {
    allow: t("deviceActionAllow"),
    soft_challenge: t("deviceActionSoftChallenge"),
    hard_challenge: t("deviceActionHardChallenge"),
    block: t("deviceActionBlock"),
  };

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (customer) params.set("customer", customer);
    if (action !== "all") params.set("action", action);
    startTransition(() => router.push(`/pan-guard/device-signals?${params.toString()}`));
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("deviceSignalsPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("deviceSignalsPageSubtitle")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("signalsFilterCustomerLabel")}</label>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={t("signalsFilterCustomerPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("deviceSignalsFilterActionLabel")}</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("txFilterAllOption")}</option>
            <option value="allow">{t("deviceActionAllow")}</option>
            <option value="soft_challenge">{t("deviceActionSoftChallenge")}</option>
            <option value="hard_challenge">{t("deviceActionHardChallenge")}</option>
            <option value="block">{t("deviceActionBlock")}</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => applyFilters()}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          {t("txFilterApply")}
        </button>
      </div>

      {result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <Fingerprint className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("deviceSignalsEmpty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-8 px-4 py-2.5" />
                <th className="px-4 py-2.5 font-medium">{t("signalsColWhen")}</th>
                <th className="px-4 py-2.5 font-medium">{t("signalsColCustomer")}</th>
                <th className="px-4 py-2.5 font-medium">{t("deviceSignalsColSource")}</th>
                <th className="px-4 py-2.5 font-medium">{t("deviceSignalsColAction")}</th>
                <th className="px-4 py-2.5 font-medium">{t("deviceSignalsColRiskScore")}</th>
                <th className="px-4 py-2.5 font-medium">{t("deviceSignalsColDevice")}</th>
                <th className="px-4 py-2.5 font-medium">{t("deviceSignalsColCountry")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((signal) => {
                const expanded = expandedId === signal.id;
                return (
                  <Fragment key={signal.id}>
                    <tr onClick={() => setExpandedId(expanded ? null : signal.id)} className="cursor-pointer hover:bg-muted/50">
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(signal.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{signal.externalCustomerId ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {signal.source === "webhook" ? t("deviceSignalsSourceWebhook") : t("deviceSignalsSourceDeviceEvent")}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLOR[signal.action] ?? "bg-muted text-muted-foreground"}`}>
                          {actionLabel[signal.action] ?? signal.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{signal.riskScore}</td>
                      <td className="px-4 py-2.5">
                        <DeviceSummaryCell attributes={signal.deviceAttributes} />
                      </td>
                      <td className="px-4 py-2.5">
                        <CountryBadge ipCountry={signal.ipCountry} />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-muted/30">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                              <span className="text-muted-foreground">
                                {t("deviceSignalsColEventId")}: <span className="font-mono text-foreground">{signal.eventId}</span>
                              </span>
                              <span className="text-muted-foreground">
                                {t("deviceSignalsColReasons")}: <span className="text-foreground">{signal.reasons?.join(", ") || "—"}</span>
                              </span>
                            </div>
                            <DeviceAttributesDetails attributes={signal.deviceAttributes} ipHash={signal.ipHash} />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={applyFilters} />
    </div>
  );
}
