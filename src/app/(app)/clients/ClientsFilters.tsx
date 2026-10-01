"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import type { ClientStage, ClientBusinessStatus } from "./actions";

const RESPONDED_STATUSES: ClientBusinessStatus[] = ["pending_review", "more_info_required", "active", "rejected"];

const STATUS_LABEL_KEY: Record<ClientBusinessStatus, string> = {
  invited: "clientStatusInvited",
  pending_review: "clientStatusPendingReview",
  more_info_required: "clientStatusMoreInfoRequired",
  active: "clientStatusActive",
  rejected: "clientStatusRejected",
};

export function ClientsFilters({
  activeTab,
  initialSearch,
  initialStatus,
}: {
  activeTab: ClientStage;
  initialSearch: string;
  initialStatus: ClientBusinessStatus | "";
}) {
  const router = useRouter();
  const { t } = useLang();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);

  function applyFilters(nextSearch: string, nextStatus: ClientBusinessStatus | "") {
    const params = new URLSearchParams({ tab: activeTab });
    if (nextSearch) params.set("search", nextSearch);
    if (nextStatus) params.set("status", nextStatus);
    startTransition(() => router.push(`/clients?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(search, status);
        }}
        className="flex flex-col gap-1"
      >
        <label className="text-xs font-medium text-muted-foreground">{t("clientsFilterSearchLabel")}</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("clientsFilterSearchPlaceholder")}
          className="w-64 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      {activeTab === "responded" ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("clientsFilterStatusLabel")}</label>
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value as ClientBusinessStatus | "";
              setStatus(next);
              applyFilters(search, next);
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("txFilterAllOption")}</option>
            {RESPONDED_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(STATUS_LABEL_KEY[value] as never)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
