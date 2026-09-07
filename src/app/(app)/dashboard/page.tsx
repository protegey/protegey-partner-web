import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { getTeamMembers } from "../team/actions";
import { getClients } from "../clients/actions";
import { DashboardCharts } from "./DashboardCharts";

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

export default async function DashboardPage() {
  const [user, partner, team, clients] = await Promise.all([
    getSessionUser(),
    loadPartner(),
    getTeamMembers().catch(() => []),
    getClients().catch(() => []),
  ]);
  const pendingClientReviews = clients.filter((client) => client.status === "pending_review").length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {partner?.status === "rejected" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-5">
          <p className="text-sm font-semibold text-destructive">Your application was not approved</p>
          {partner.rejectionReason ? (
            <p className="mt-1 text-sm text-destructive">{partner.rejectionReason}</p>
          ) : null}
          <p className="mt-2 text-xs text-destructive/80">
            Contact your Protegey representative if you believe this is a mistake.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts />
        </div>

        <div className="flex flex-col gap-6">
          {partner ? (
            <div className="rounded-md border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">Your organization</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{partner.name}</h2>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="text-foreground">{formatLabel(partner.type)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      partner.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {formatLabel(partner.status)}
                  </span>
                </div>
                {partner.country ? (
                  <div>
                    <span className="text-muted-foreground">Country: </span>
                    <span className="text-foreground">{partner.country}</span>
                  </div>
                ) : null}
                {partner.contactEmail ? (
                  <div>
                    <span className="text-muted-foreground">Contact: </span>
                    <span className="text-foreground">{partner.contactEmail}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
              Organization details are not available for this account.
            </div>
          )}

          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Your role</p>
            <p className="mt-1 text-sm text-foreground">
              {user?.roles.map(formatLabel).join(", ") || "—"}
            </p>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Clients</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{clients.length}</p>
            <p className="text-xs text-muted-foreground">
              {clients.length === 1 ? "business" : "businesses"} invited to onboard
              {pendingClientReviews > 0 ? (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">
                  {pendingClientReviews} awaiting review
                </span>
              ) : null}
            </p>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Team</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{team.length}</p>
            <p className="text-xs text-muted-foreground">agent{team.length === 1 ? "" : "s"} in your organization</p>
            {team.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-foreground">
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {member.roles.map((role) => role.displayName).join(", ") || "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
