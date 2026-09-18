import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ShieldAlert, Gauge, Building2, Bell } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { OrganizationLogo } from "@/components/OrganizationLogo";
import { getTeamMembers } from "../team/actions";
import { getClients } from "../clients/actions";
import { getTransactionStats } from "../transactions/actions";
import { getAlerts } from "../alerts/actions";
import { getNotifications } from "../notifications/actions";
import { DashboardCharts } from "./DashboardCharts";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { describeEvent } from "@/lib/events";

export const metadata: Metadata = {
  title: "Dashboard — Protegey Partner",
};

interface Partner {
  id: string;
  name: string;
  type: string;
  status: string;
  contactEmail: string | null;
  country: string | null;
  rejectionReason: string | null;
  createdAt: string;
  logoFileName: string | null;
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

async function loadPartner(): Promise<Partner | null> {
  try {
    return await apiFetch<Partner>("/partners/me");
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

function KpiCard({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const [user, partner, team, clients, lang, txStats, openAlerts, notifications] = await Promise.all([
    getSessionUser(),
    loadPartner(),
    getTeamMembers().catch(() => []),
    getClients().catch(() => []),
    getLang(),
    getTransactionStats().catch(() => null),
    getAlerts({ status: "open", limit: 1 }).catch(() => null),
    getNotifications(1).catch(() => null),
  ]);
  const pendingClientReviews = clients.filter((client) => client.status === "pending_review").length;
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "dashboardWelcomeBack")}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {partner?.status === "rejected" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-5">
          <p className="text-sm font-semibold text-destructive">{t(lang, "dashboardApplicationRejectedTitle")}</p>
          {partner.rejectionReason ? <p className="mt-1 text-sm text-destructive">{partner.rejectionReason}</p> : null}
          <p className="mt-2 text-xs text-destructive/80">{t(lang, "dashboardApplicationRejectedContact")}</p>
        </div>
      ) : null}

      {txStats && txStats.totalCount === 0 ? (
        <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-border p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">{t(lang, "dashboardGettingStartedTitle")}</p>
            <p className="text-xs text-muted-foreground">{t(lang, "dashboardGettingStartedBody")}</p>
          </div>
          <Link
            href="/integration-guide"
            className="shrink-0 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t(lang, "dashboardGettingStartedButton")}
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Activity} label={t(lang, "dashboardKpiTransactions")} value={(txStats?.totalCount ?? 0).toLocaleString(locale)} />
        <KpiCard icon={ShieldAlert} label={t(lang, "dashboardKpiOpenAlerts")} value={(openAlerts?.total ?? 0).toLocaleString(locale)} />
        <KpiCard icon={Gauge} label={t(lang, "dashboardKpiAvgRisk")} value={String(txStats?.averageRiskScore ?? 0)} />
        <KpiCard icon={Building2} label={t(lang, "dashboardKpiPendingKyb")} value={pendingClientReviews.toLocaleString(locale)} />
      </div>

      {txStats ? <DashboardCharts stats={txStats} /> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {partner ? (
          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground">{t(lang, "dashboardOrgSectionTitle")}</p>
            <div className="mt-1 flex items-center gap-3">
              <OrganizationLogo logoUrl={partner.logoFileName ? "/api/partner-logo" : null} name={partner.name} size={40} />
              <h2 className="text-lg font-semibold text-foreground">{partner.name}</h2>
            </div>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t(lang, "dashboardOrgTypeLabel")} </span>
                <span className="text-foreground">{formatLabel(partner.type)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t(lang, "dashboardOrgStatusLabel")} </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    partner.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  }`}
                >
                  {formatLabel(partner.status)}
                </span>
              </div>
              {partner.country ? (
                <div>
                  <span className="text-muted-foreground">{t(lang, "dashboardOrgCountryLabel")} </span>
                  <span className="text-foreground">{partner.country}</span>
                </div>
              ) : null}
              {partner.contactEmail ? (
                <div>
                  <span className="text-muted-foreground">{t(lang, "dashboardOrgContactLabel")} </span>
                  <span className="text-foreground">{partner.contactEmail}</span>
                </div>
              ) : null}
            </div>
            <div className="mt-4 border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">{t(lang, "dashboardRoleTitle")}: </span>
              <span className="text-foreground">{user?.roles.map(formatLabel).join(", ") || "—"}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">{t(lang, "dashboardOrgUnavailable")}</div>
        )}

        <div className="rounded-md border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Bell className="size-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">{t(lang, "dashboardRecentActivityTitle")}</p>
          </div>
          {!notifications || notifications.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t(lang, "dashboardRecentActivityEmpty")}</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {notifications.data.slice(0, 5).map((event) => (
                <div key={event.id} className="text-sm">
                  <p className="text-foreground">{describeEvent(lang, event)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString(locale)}</p>
                </div>
              ))}
            </div>
          )}
          <Link href="/notifications" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
            {t(lang, "dashboardViewAllActivity")}
          </Link>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">{t(lang, "dashboardTeamTitle")}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{team.length}</p>
          <p className="text-xs text-muted-foreground">{t(lang, team.length === 1 ? "dashboardTeamAgentSingular" : "dashboardTeamAgentPlural")}</p>
          {team.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {team.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{member.roles.map((role) => role.displayName).join(", ") || "—"}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
