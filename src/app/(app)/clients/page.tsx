import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getClientsPage, type ClientStage } from "./actions";
import { InviteClientDialogButton } from "./InviteClientDialogButton";
import { ResendClientInvitationButton } from "./ResendClientInvitationButton";
import { PaginationControls } from "@/components/PaginationControls";
import { getLang } from "@/lib/i18n/lang";
import { t, type StringKey } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "KYB — Protegey Partner",
};

const STATUS_LABEL_KEYS: Record<string, StringKey> = {
  invited: "clientStatusInvited",
  pending_review: "clientStatusPendingReview",
  more_info_required: "clientStatusMoreInfoRequired",
  active: "clientStatusActive",
  rejected: "clientStatusRejected",
};

const STATUS_STYLES: Record<string, string> = {
  invited: "bg-muted text-muted-foreground",
  pending_review: "bg-primary/10 text-primary",
  more_info_required: "bg-amber-500/10 text-amber-600",
  active: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const TABS: { value: ClientStage; labelKey: StringKey }[] = [
  { value: "invited", labelKey: "clientsTabInvited" },
  { value: "responded", labelKey: "clientsTabResponded" },
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
  const lang = await getLang();

  const user = await getSessionUser();
  const canManageClients = user?.permissions.includes("partners.manage_clients") ?? false;

  if (!canManageClients) {
    return (
      <div className="flex w-full flex-col gap-6">
        <h1 className="text-xl font-semibold text-foreground">KYB</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "clientsNoPermission")}</p>
      </div>
    );
  }

  const result =
    activeTab !== "questionnaires" ? await getClientsPage({ stage: activeTab as ClientStage, page }) : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">KYB</h1>
          <p className="text-sm text-muted-foreground">{t(lang, "clientsSubtitle")}</p>
        </div>
        <InviteClientDialogButton />
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tabHref(tab.value)}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === tab.value ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(lang, tab.labelKey)}
          </Link>
        ))}
        <span className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground/50">
          {t(lang, "clientsTabQuestionnaires")}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{t(lang, "soonBadge")}</span>
        </span>
      </div>

      {activeTab === "questionnaires" ? (
        <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t(lang, "clientsQuestionnairesComingSoon")}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t(lang, "clientsColBusiness")}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, "clientsColStatus")}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, "clientsColCountry")}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, "clientsColActivatedDate")}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, "clientsColRejectedDate")}</th>
                  <th className="px-4 py-2.5 font-medium">
                    {t(lang, activeTab === "invited" ? "clientsColInvitedDate" : "clientsColSubmittedDate")}
                  </th>
                  <th className="px-4 py-2.5 font-medium text-right">{t(lang, "clientsColActions")}</th>
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
                        {t(lang, STATUS_LABEL_KEYS[client.status])}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{client.submission?.generalInfo?.country ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{client.activatedAt ? new Date(client.activatedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{client.rejectedAt ? new Date(client.rejectedAt).toLocaleDateString() : "—"}</td>
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
                          {t(lang, "commonReview")}
                        </Link>
                      ) : client.status === "invited" || client.status === "more_info_required" ? (
                        <ResendClientInvitationButton clientId={client.id} />
                      ) : (
                        <Link href={`/clients/${client.id}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">
                          {t(lang, "commonView")}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {result?.data.length === 0 ? (
                  <tr>
                     <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      {t(lang, activeTab === "invited" ? "clientsEmptyInvited" : "clientsEmptyResponded")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {result ? (
            <PaginationControls
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              href={(nextPage) => `/clients?tab=${activeTab}&page=${nextPage}`}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
