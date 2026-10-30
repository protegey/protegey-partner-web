"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { exportTeamMembersAction, type AssignableRole } from "./actions";

export function TeamMembersToolbar({
  roles,
  initialSearch,
  initialRoleId,
  initialStatus,
  invitationsPage,
  rolesPage,
}: {
  roles: AssignableRole[];
  initialSearch: string;
  initialRoleId: string;
  initialStatus: string;
  invitationsPage: number;
  rolesPage: number;
}) {
  const router = useRouter();
  const { t } = useLang();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [roleId, setRoleId] = useState(initialRoleId);
  const [status, setStatus] = useState(initialStatus);

  function applyFilters(nextSearch: string, nextRoleId: string, nextStatus: string) {
    const params = new URLSearchParams({ invitationsPage: String(invitationsPage), rolesPage: String(rolesPage), membersPage: "1" });
    if (nextSearch.trim()) params.set("membersSearch", nextSearch.trim());
    if (nextRoleId) params.set("membersRoleId", nextRoleId);
    if (nextStatus) params.set("membersStatus", nextStatus);
    startTransition(() => router.push(`/team?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(search, roleId, status);
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
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("teamFilterRoleLabel")}</label>
        <select
          value={roleId}
          onChange={(e) => {
            setRoleId(e.target.value);
            applyFilters(search, e.target.value, status);
          }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("txFilterAllOption")}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.displayName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("teamFilterStatusLabel")}</label>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            applyFilters(search, roleId, e.target.value);
          }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("txFilterAllOption")}</option>
          <option value="active">{t("clientStatusActive")}</option>
          <option value="suspended">{t("teamStatusBlocked")}</option>
        </select>
      </div>
      <div className="ml-auto">
        <ExportCsvButton
          filename="team-members-export.csv"
          onExport={() =>
            exportTeamMembersAction({
              search: search.trim() || undefined,
              roleId: roleId || undefined,
              status: (status as "active" | "suspended") || undefined,
            })
          }
        />
      </div>
    </div>
  );
}
