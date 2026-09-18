import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClient } from "../actions";
import { ClientDecisionActions } from "./ClientDecisionActions";
import { ClientDocumentPreview } from "./ClientDocumentPreview";
import { ComplianceInfoButton } from "./ComplianceInfoButton";
import { getLang } from "@/lib/i18n/lang";
import { t, type Lang, type StringKey } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Client application — Protegey Partner",
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value === null || value === undefined || value === "" ? "—" : value}</p>
    </div>
  );
}

function YesNo({ lang, value }: { lang: Lang; value: { answer: boolean; details?: string | null } | null | undefined }) {
  if (!value) return <span className="text-sm text-foreground">—</span>;
  return (
    <span className="text-sm text-foreground">
      {value.answer ? t(lang, "commonYes") : t(lang, "commonNo")}
      {value.answer && value.details ? ` — ${value.details}` : ""}
    </span>
  );
}

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const [client, lang] = await Promise.all([getClient(clientId), getLang()]);
  const submission = client.submission;
  const countryName = submission?.generalInfo?.country
    ? (new Intl.DisplayNames([lang], { type: "region" }).of(submission.generalInfo.country) ?? submission.generalInfo.country)
    : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link href="/clients" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        {t(lang, "clientsBackToClients")}
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground">{client.legalName ?? client.contactName}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[client.status]}`}>
              {t(lang, STATUS_LABEL_KEYS[client.status])}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{client.contactEmail}</p>
        </div>
        <ComplianceInfoButton clientId={client.id} businessName={client.legalName ?? client.contactName} />
      </div>

      {client.status === "rejected" && client.rejectionReason ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">{t(lang, "clientsApplicationRejectedTitle")}</p>
          <p className="mt-1 text-sm text-destructive">{client.rejectionReason}</p>
        </div>
      ) : null}

      {client.status === "more_info_required" && submission?.moreInfoNote ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-700">{t(lang, "clientsWaitingMoreInfoTitle")}</p>
          <p className="mt-1 text-sm text-amber-700">{submission.moreInfoNote}</p>
        </div>
      ) : null}

      {!submission || submission.status === "pending" ? (
        <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          {t(lang, "clientsNotStarted")}
        </div>
      ) : (
        <>
          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "clientsSectionGeneralInfo")}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label={t(lang, "clientsFieldLegalName")} value={submission.generalInfo?.legalName} />
              <Field label={t(lang, "clientsFieldTradingName")} value={submission.generalInfo?.tradingName} />
              <Field label={t(lang, "clientsFieldCountry")} value={countryName} />
              <Field label={t(lang, "clientsFieldLegalStatus")} value={submission.generalInfo?.legalStatus} />
              <Field label={t(lang, "clientsFieldTradingAddress")} value={submission.generalInfo?.tradingAddress} />
              <Field label={t(lang, "clientsFieldMailingAddress")} value={submission.generalInfo?.mailingAddress} />
              <Field label={t(lang, "clientsFieldIncorporationDate")} value={submission.generalInfo?.incorporationDate} />
              <Field label={t(lang, "clientsFieldRegistrationNumber")} value={submission.generalInfo?.registrationNumber} />
              <Field label={t(lang, "clientsFieldWebsite")} value={submission.generalInfo?.website} />
              <Field label={t(lang, "clientsFieldPhone")} value={submission.generalInfo?.phone} />
              <Field label={t(lang, "clientsFieldContactPerson")} value={submission.generalInfo?.contactPerson} />
            </div>
            {submission.generalInfo?.owners && submission.generalInfo.owners.length > 0 ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">{t(lang, "clientsOwnersTitle")}</p>
                <div className="flex flex-col gap-2">
                  {submission.generalInfo.owners.map((owner, index) => (
                    <div key={index} className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">
                      {owner.name}
                      {owner.ownershipPercent != null ? ` — ${owner.ownershipPercent}%` : ""}
                      {owner.address ? ` · ${owner.address}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "clientsSectionBusinessDescription")}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label={t(lang, "clientsFieldYearsInOperation")} value={submission.businessDescription?.yearsInOperation} />
              <Field label={t(lang, "clientsFieldCountriesOfOperation")} value={submission.businessDescription?.countriesOfOperation} />
              <Field label={t(lang, "clientsFieldPrimaryBusinessFocus")} value={submission.businessDescription?.primaryBusinessFocus} />
              <Field label={t(lang, "clientsFieldMainRevenueActivity")} value={submission.businessDescription?.mainRevenueActivity} />
              <Field label={t(lang, "clientsFieldEstMonthlyTxCount")} value={submission.businessDescription?.estimatedMonthlyTransactionCount} />
              <Field label={t(lang, "clientsFieldEstMonthlyTxValue")} value={submission.businessDescription?.estimatedMonthlyTransactionValue} />
              <Field
                label={t(lang, "clientsFieldShellBankRelationships")}
                value={
                  submission.businessDescription?.hasShellBankRelationships
                    ? `${t(lang, "commonYes")} — ${submission.businessDescription?.shellBankDetails ?? ""}`
                    : t(lang, "commonNo")
                }
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "clientsSectionPaymentServices")}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label={t(lang, "clientsFieldYearsProvidingPaymentServices")} value={submission.paymentServices?.yearsProvidingPaymentServices} />
              <Field label={t(lang, "clientsFieldFocus")} value={submission.paymentServices?.focusType} />
              <Field label={t(lang, "clientsFieldServicesOffered")} value={submission.paymentServices?.servicesOffered?.join(", ")} />
              <Field label={t(lang, "clientsFieldUsesAgents")} value={submission.paymentServices?.usesAgents ? t(lang, "commonYes") : t(lang, "commonNo")} />
              <Field label={t(lang, "clientsFieldTotalAgents")} value={submission.paymentServices?.totalAgents} />
              <Field
                label={t(lang, "clientsFieldAffiliateOfOtherFi")}
                value={
                  submission.paymentServices?.isAffiliateOfOtherFi
                    ? [submission.paymentServices?.affiliateType, submission.paymentServices?.affiliateName].filter(Boolean).join(" — ")
                    : t(lang, "commonNo")
                }
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "clientsSectionDisclosures")}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t(lang, "clientsDisclosureLicense")}</p>
                <YesNo lang={lang} value={submission.disclosures?.licenseDeniedSuspendedRevoked} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t(lang, "clientsDisclosureBankruptcy")}</p>
                <YesNo lang={lang} value={submission.disclosures?.bankruptcy} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t(lang, "clientsDisclosureCriminal")}</p>
                <YesNo lang={lang} value={submission.disclosures?.criminalConviction} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t(lang, "clientsDisclosureAml")}</p>
                <YesNo lang={lang} value={submission.disclosures?.amlCivilOrCriminalProceedings} />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "clientsSectionSupportingDocument")}</p>
            <ClientDocumentPreview
              clientId={client.id}
              fileName={submission.documentFileName}
              mimeType={submission.documentMimeType}
            />
          </div>

          {client.status === "pending_review" ? <ClientDecisionActions clientId={client.id} /> : null}
        </>
      )}
    </div>
  );
}
