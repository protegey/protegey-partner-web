"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import type { DiditSessionStatus } from "./actions";

const STATUSES: DiditSessionStatus[] = [
  "Not Started",
  "In Progress",
  "Awaiting User",
  "In Review",
  "Approved",
  "Declined",
  "Resubmitted",
  "Abandoned",
  "Expired",
  "Kyc Expired",
];

const STATUS_LABEL_KEY: Record<DiditSessionStatus, string> = {
  "Not Started": "kycStatusNotStarted",
  "In Progress": "kycStatusInProgress",
  "Awaiting User": "kycStatusAwaitingUser",
  "In Review": "kycStatusInReview",
  Approved: "kycStatusApproved",
  Declined: "kycStatusDeclined",
  Resubmitted: "kycStatusResubmitted",
  Abandoned: "kycStatusAbandoned",
  Expired: "kycStatusExpired",
  "Kyc Expired": "kycStatusKycExpired",
};

export function KycFilters({ initialStatus, initialSearch }: { initialStatus: DiditSessionStatus | ""; initialSearch: string }) {
  const router = useRouter();
  const { t } = useLang();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);

  function applyFilters(nextStatus: DiditSessionStatus | "", nextSearch: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextSearch) params.set("search", nextSearch);
    startTransition(() => router.push(`/kyc?${params.toString()}`));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters(status, search);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("kycFilterSearchLabel")}</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("kycFilterSearchPlaceholder")}
          className="w-56 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("kycFilterStatusLabel")}</label>
        <select
          value={status}
          onChange={(e) => {
            const next = e.target.value as DiditSessionStatus | "";
            setStatus(next);
            applyFilters(next, search);
          }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("txFilterAllOption")}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(STATUS_LABEL_KEY[value] as never)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
