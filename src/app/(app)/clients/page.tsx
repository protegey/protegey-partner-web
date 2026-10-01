import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getClientsPage, listKybTemplates, listPublishedKybTemplates, type ClientStage, type ClientBusinessStatus } from "./actions";
import { ClientsFilters } from "./ClientsFilters";
import { InviteClientDialogButton } from "./InviteClientDialogButton";
import { ResendClientInvitationButton } from "./ResendClientInvitationButton";
import { QuestionnairesListClient } from "./questionnaires/QuestionnairesListClient";
import { PaginationControls } from "@/components/PaginationControls";
import { getLang } from "@/lib/i18n/lang";
import { t, type StringKey } from "@/lib/i18n/strings";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const CLIENTS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "KYB — Clients",
    explanation:
      "Ici, « client » veut dire les entreprises que TOI, le partenaire, invites à s'inscrire — pas les utilisateurs finaux de ton produit. C'est le contrôle « connaître son client professionnel » (KYB) : chaque entreprise que tu invites reçoit un lien pour remplir un questionnaire et déposer ses documents.\n\nUne fois répondu, l'entreprise passe par les statuts : invitée → en revue → informations complémentaires demandées → active (approuvée) ou rejetée. Dès qu'une soumission arrive, elle est automatiquement vérifiée contre les listes de sanctions et de personnes politiquement exposées (PPE), avant même que tu ne la regardes.\n\nC'est toi qui prends la décision finale d'approuver, rejeter, ou demander un complément d'information sur chaque dossier.",
    diagram: [
      [{ label: "Invitation envoyée", note: "par toi, le partenaire" }],
      [{ label: "Questionnaire + documents", note: "remplis par l'entreprise" }],
      [{ label: "Clients (KYB)", note: "liste des soumissions", current: true }],
      [{ label: "Criblage sanctions / PPE", note: "automatique" }],
      [{ label: "Décision", note: "actif / rejeté / infos demandées" }],
    ],
  },
  en: {
    title: "KYB — Clients",
    explanation:
      "Here, \"client\" means the businesses YOU, the partner, invite to sign up — not your product's end users. This is \"know your business\" (KYB) screening: every business you invite gets a link to fill out a questionnaire and upload documents.\n\nOnce they respond, the business moves through statuses: invited → pending review → more info required → active (approved) or rejected. As soon as a submission comes in, it's automatically checked against sanctions and Politically Exposed Person (PEP) lists — before you even look at it.\n\nYou make the final call to approve, reject, or ask for more information on each application.",
    diagram: [
      [{ label: "Invitation sent", note: "by you, the partner" }],
      [{ label: "Questionnaire + documents", note: "filled by the business" }],
      [{ label: "Clients (KYB)", note: "list of submissions", current: true }],
      [{ label: "Sanctions / PEP screening", note: "automatic" }],
      [{ label: "Decision", note: "active / rejected / more info requested" }],
    ],
  },
};

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

const TABS: { value: ClientStage | "questionnaires"; labelKey: StringKey }[] = [
  { value: "invited", labelKey: "clientsTabInvited" },
  { value: "responded", labelKey: "clientsTabResponded" },
  { value: "questionnaires", labelKey: "clientsTabQuestionnaires" },
];

function tabHref(tab: string): string {
  return `/clients?tab=${tab}`;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; search?: string; status?: string }>;
}) {
  const { tab, page: pageParam, search: searchParam, status: statusParam } = await searchParams;
  const activeTab = tab === "responded" ? "responded" : tab === "questionnaires" ? "questionnaires" : "invited";
  const page = Math.max(1, Number(pageParam) || 1);
  const search = searchParam ?? "";
  const status = (statusParam as ClientBusinessStatus | undefined) ?? undefined;
  const lang = await getLang();

  const user = await getSessionUser();
  const denied = requirePageAccess(user, "partners.manage_clients", lang);
  if (denied) return denied;

  const result =
    activeTab !== "questionnaires" ? await getClientsPage({ stage: activeTab as ClientStage, page, search: search || undefined, status }) : null;
  const templates = activeTab === "questionnaires" ? await listKybTemplates() : null;
  const publishedTemplates = await listPublishedKybTemplates();

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">KYB</h1>
            <PageGuideButton content={CLIENTS_GUIDE[lang]} />
          </div>
          <p className="text-sm text-muted-foreground">{t(lang, "clientsSubtitle")}</p>
        </div>
        <InviteClientDialogButton templates={publishedTemplates} />
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
      </div>

      {activeTab === "questionnaires" ? (
        <QuestionnairesListClient initialTemplates={templates ?? []} lang={lang} />
      ) : (
        <>
          <ClientsFilters activeTab={activeTab} initialSearch={search} initialStatus={status ?? ""} />

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
              href={(nextPage) =>
                `/clients?tab=${activeTab}&page=${nextPage}${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}`
              }
            />
          ) : null}
        </>
      )}
    </div>
  );
}
