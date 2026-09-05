import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

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
  const [user, partner] = await Promise.all([getSessionUser(), loadPartner()]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
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

      {partner ? (
        <div className="rounded-md border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Your organization</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{partner.name}</h2>
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
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
    </div>
  );
}
