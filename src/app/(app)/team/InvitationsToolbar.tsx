"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { exportPendingInvitationsAction } from "./actions";

export function InvitationsToolbar({
  initialSearch,
  membersPage,
  rolesPage,
}: {
  initialSearch: string;
  membersPage: number;
  rolesPage: number;
}) {
  const router = useRouter();
  const { t } = useLang();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  function applyFilters(nextSearch: string) {
    const params = new URLSearchParams({ membersPage: String(membersPage), rolesPage: String(rolesPage), invitationsPage: "1" });
    if (nextSearch.trim()) params.set("invitationsSearch", nextSearch.trim());
    startTransition(() => router.push(`/team?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(search);
        }}
        className="flex flex-col gap-1"
      >
        <label className="text-xs font-medium text-muted-foreground">{t("teamFilterSearchLabel")}</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("teamFilterSearchPlaceholder")}
          className="w-56 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </form>
      <div className="ml-auto">
        <ExportCsvButton filename="team-invitations-export.csv" onExport={() => exportPendingInvitationsAction(search.trim() || undefined)} />
      </div>
    </div>
  );
}
