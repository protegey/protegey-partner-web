import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClient } from "../actions";
import { ClientDecisionActions } from "./ClientDecisionActions";
import { ClientDocumentPreview } from "./ClientDocumentPreview";
import { ComplianceInfoButton } from "./ComplianceInfoButton";

export const metadata: Metadata = {
  title: "Client application — Protegey Partner",
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value === null || value === undefined || value === "" ? "—" : value}</p>
    </div>
  );
}

function YesNo({ value }: { value: { answer: boolean; details?: string | null } | null | undefined }) {
  if (!value) return <span className="text-sm text-foreground">—</span>;
  return (
    <span className="text-sm text-foreground">
      {value.answer ? "Yes" : "No"}
      {value.answer && value.details ? ` — ${value.details}` : ""}
    </span>
  );
}

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  const submission = client.submission;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link href="/clients" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Back to clients
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground">{client.legalName ?? client.contactName}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[client.status]}`}>
              {STATUS_LABELS[client.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{client.contactEmail}</p>
        </div>
        <ComplianceInfoButton businessName={client.legalName ?? client.contactName} />
      </div>

      {client.status === "rejected" && client.rejectionReason ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">Application rejected</p>
          <p className="mt-1 text-sm text-destructive">{client.rejectionReason}</p>
        </div>
      ) : null}

      {client.status === "more_info_required" && submission?.moreInfoNote ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-700">Waiting on more information from the client</p>
          <p className="mt-1 text-sm text-amber-700">{submission.moreInfoNote}</p>
        </div>
      ) : null}

      {!submission || submission.status === "pending" ? (
        <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          This business hasn&apos;t started their application yet.
        </div>
      ) : (
        <>
          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">General information</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Legal name" value={submission.generalInfo?.legalName} />
              <Field label="Trading name" value={submission.generalInfo?.tradingName} />
              <Field
                label="Country"
                value={
                  submission.generalInfo?.country
                    ? (new Intl.DisplayNames(["en"], { type: "region" }).of(submission.generalInfo.country) ?? submission.generalInfo.country)
                    : null
                }
              />
              <Field label="Legal status" value={submission.generalInfo?.legalStatus} />
              <Field label="Trading address" value={submission.generalInfo?.tradingAddress} />
              <Field label="Mailing address" value={submission.generalInfo?.mailingAddress} />
              <Field label="Incorporation date" value={submission.generalInfo?.incorporationDate} />
              <Field label="Registration number" value={submission.generalInfo?.registrationNumber} />
              <Field label="Website" value={submission.generalInfo?.website} />
              <Field label="Phone" value={submission.generalInfo?.phone} />
              <Field label="Contact person" value={submission.generalInfo?.contactPerson} />
            </div>
            {submission.generalInfo?.owners && submission.generalInfo.owners.length > 0 ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Owners</p>
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
            <p className="mb-3 text-sm font-semibold text-foreground">Business description</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Years in operation" value={submission.businessDescription?.yearsInOperation} />
              <Field label="Countries of operation" value={submission.businessDescription?.countriesOfOperation} />
              <Field label="Primary business focus" value={submission.businessDescription?.primaryBusinessFocus} />
              <Field label="Main revenue activity" value={submission.businessDescription?.mainRevenueActivity} />
              <Field label="Est. monthly transaction count" value={submission.businessDescription?.estimatedMonthlyTransactionCount} />
              <Field label="Est. monthly transaction value" value={submission.businessDescription?.estimatedMonthlyTransactionValue} />
              <Field
                label="Relationships with shell banks"
                value={
                  submission.businessDescription?.hasShellBankRelationships
                    ? `Yes — ${submission.businessDescription?.shellBankDetails ?? ""}`
                    : "No"
                }
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">Payment services</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Years providing payment services" value={submission.paymentServices?.yearsProvidingPaymentServices} />
              <Field label="Focus" value={submission.paymentServices?.focusType} />
              <Field label="Services offered" value={submission.paymentServices?.servicesOffered?.join(", ")} />
              <Field label="Uses agents" value={submission.paymentServices?.usesAgents ? "Yes" : "No"} />
              <Field label="Total agents" value={submission.paymentServices?.totalAgents} />
              <Field
                label="Affiliate of another FI"
                value={
                  submission.paymentServices?.isAffiliateOfOtherFi
                    ? [submission.paymentServices?.affiliateType, submission.paymentServices?.affiliateName].filter(Boolean).join(" — ")
                    : "No"
                }
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">Disclosure questions</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">License denied, suspended or revoked?</p>
                <YesNo value={submission.disclosures?.licenseDeniedSuspendedRevoked} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Filed for bankruptcy?</p>
                <YesNo value={submission.disclosures?.bankruptcy} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Criminal conviction?</p>
                <YesNo value={submission.disclosures?.criminalConviction} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">AML civil or criminal proceedings?</p>
                <YesNo value={submission.disclosures?.amlCivilOrCriminalProceedings} />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">Supporting document</p>
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
