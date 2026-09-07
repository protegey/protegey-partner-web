import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getClientsPage, type ClientStage } from "./actions";
import { InviteClientDialogButton } from "./InviteClientDialogButton";
import { ResendClientInvitationButton } from "./ResendClientInvitationButton";

export const metadata: Metadata = {
  title: "KYB — Protegey Partner",
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

const TABS: { value: ClientStage; label: string }[] = [
  { value: "invited", label: "Invited" },
  { value: "responded", label: "Responded" },
];

function tabHref(tab: string): string {
  return `/clients?tab=${tab}`;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { tab, page: pageParam } = await searchParams;
  const activeTab = tab === "responded" ? "responded" : tab === "questionnaires" ? "questionnaires" : "invited";
  const page = Math.max(1, Number(pageParam) || 1);

  const user = await getSessionUser();
  const canManageClients = user?.permissions.includes("partners.manage_clients") ?? false;

  if (!canManageClients) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <h1 className="text-xl font-semibold text-foreground">KYB</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage clients. Ask a colleague with the right role to grant you access.
        </p>
      </div>
    );
  }

  const result =
    activeTab !== "questionnaires" ? await getClientsPage({ stage: activeTab as ClientStage, page }) : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">KYB</h1>
          <p className="text-sm text-muted-foreground">
            The businesses you&apos;ve invited to complete their own onboarding on your platform.
          </p>
        </div>
        <InviteClientDialogButton />
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={tabHref(t.value)}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === t.value ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
        <span className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground/50">
          Questionnaires
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Soon</span>
        </span>
      </div>

      {activeTab === "questionnaires" ? (
        <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Custom, dynamic questionnaires are coming soon — you&apos;ll be able to build and tailor your own KYB
          form here instead of the fixed one used today.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Business</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">{activeTab === "invited" ? "Invited" : "Submitted"}</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result?.data.map((client) => (
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
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {activeTab === "invited"
                        ? new Date(client.createdAt).toLocaleDateString()
                        : client.submission?.submittedAt
                          ? new Date(client.submission.submittedAt).toLocaleDateString()
                          : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {client.status === "pending_review" ? (
                        <Link
                          href={`/clients/${client.id}`}
                          className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          Review
                        </Link>
                      ) : client.status === "invited" || client.status === "more_info_required" ? (
                        <ResendClientInvitationButton clientId={client.id} />
                      ) : (
                        <Link href={`/clients/${client.id}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {result?.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      {activeTab === "invited"
                        ? "No pending invites — everyone you've invited has started their application."
                        : "No one has responded yet."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {result && result.totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Page {result.page} of {result.totalPages} — {result.total} total
              </p>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Link
                    href={`/clients?tab=${activeTab}&page=${result.page - 1}`}
                    className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Link>
                ) : (
                  <span className="flex cursor-not-allowed items-center gap-1 rounded-md border border-border px-3 py-1.5 opacity-40">
                    <ChevronLeft className="size-4" />
                    Previous
                  </span>
                )}
                {result.page < result.totalPages ? (
                  <Link
                    href={`/clients?tab=${activeTab}&page=${result.page + 1}`}
                    className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Link>
                ) : (
                  <span className="flex cursor-not-allowed items-center gap-1 rounded-md border border-border px-3 py-1.5 opacity-40">
                    Next
                    <ChevronRight className="size-4" />
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
