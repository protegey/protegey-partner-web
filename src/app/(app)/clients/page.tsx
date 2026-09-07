import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getClients } from "./actions";
import { InviteClientDialogButton } from "./InviteClientDialogButton";
import { ResendClientInvitationButton } from "./ResendClientInvitationButton";

export const metadata: Metadata = {
  title: "Clients — Protegey Partner",
};

const STATUS_LABELS: Record<string, string> = {
  invited: "Invited",
  pending_review: "Needs review",
  more_info_required: "More info requested",
  active: "Active",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  invited: "bg-muted text-muted-foreground",
  pending_review: "bg-primary/10 text-primary",
  more_info_required: "bg-amber-500/10 text-amber-600",
  active: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const showInvitesOnly = tab === "invites";

  const user = await getSessionUser();
  const canManageClients = user?.permissions.includes("partners.manage_clients") ?? false;

  const clients = canManageClients ? await getClients() : [];
  const needsReview = clients.filter((client) => client.status === "pending_review");
  const invited = clients.filter((client) => client.status === "invited" || client.status === "more_info_required");

  if (!canManageClients) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <h1 className="text-xl font-semibold text-foreground">Clients</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage clients. Ask a colleague with the right role to grant you access.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{showInvitesOnly ? "Invites" : "Applications"}</h1>
          <p className="text-sm text-muted-foreground">
            The businesses you&apos;ve invited to complete their own onboarding on your platform.
          </p>
        </div>
        <InviteClientDialogButton />
      </div>

      <div className="flex gap-1 border-b border-border">
        <Link
          href="/clients"
          className={`px-3 py-2 text-sm font-medium ${
            !showInvitesOnly ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Applications
        </Link>
        <Link
          href="/clients?tab=invites"
          className={`px-3 py-2 text-sm font-medium ${
            showInvitesOnly ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Invites {invited.length > 0 ? `(${invited.length})` : ""}
        </Link>
      </div>

      {showInvitesOnly ? (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Business</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Invited</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invited.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-2.5">
                    <Link href={`/clients/${client.id}`} className="text-foreground hover:text-primary hover:underline">
                      {client.legalName ?? client.contactName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{client.contactEmail}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[client.status]}`}>
                      {STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{new Date(client.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    <ResendClientInvitationButton clientId={client.id} />
                  </td>
                </tr>
              ))}
              {invited.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No pending invites — everyone you&apos;ve invited has started their application.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {needsReview.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Needs your review ({needsReview.length})</p>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Business</th>
                      <th className="px-4 py-2.5 font-medium">Submitted</th>
                      <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {needsReview.map((client) => (
                      <tr key={client.id}>
                        <td className="px-4 py-2.5">
                          <p className="text-foreground">{client.legalName ?? client.contactName}</p>
                          <p className="text-xs text-muted-foreground">{client.contactEmail}</p>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {client.submission?.submittedAt ? new Date(client.submission.submittedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            href={`/clients/${client.id}`}
                            className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">All clients</p>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Business</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Invited</th>
                    <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-4 py-2.5">
                        <Link href={`/clients/${client.id}`} className="text-foreground hover:text-primary hover:underline">
                          {client.legalName ?? client.contactName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{client.contactEmail}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[client.status]}`}>
                          {STATUS_LABELS[client.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{new Date(client.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-right">
                        {invited.some((c) => c.id === client.id) ? (
                          <ResendClientInvitationButton clientId={client.id} />
                        ) : (
                          <Link href={`/clients/${client.id}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        No clients yet — invite your first business above.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
