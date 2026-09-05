import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import { getMyDocuments } from "./actions";
import { DocumentUploadRow } from "./DocumentUploadRow";

export const metadata: Metadata = {
  title: "Documents — Protegey Partner",
};

interface Partner {
  status: string;
  rejectionReason: string | null;
}

async function loadPartner(): Promise<Partner | null> {
  try {
    return await apiFetch<Partner>("/partners/me");
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

export default async function DocumentsPage() {
  const [documents, partner] = await Promise.all([getMyDocuments(), loadPartner()]);
  const allApproved = documents.length > 0 && documents.every((d) => d.status === "approved");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Verification documents</h1>
        <p className="text-sm text-muted-foreground">
          Protegey needs these documents to verify your organization before activating your account. Until your
          verification is approved, the rest of the portal stays locked — you&rsquo;ll get an email as soon as a
          decision is made.
        </p>
      </div>

      {partner?.status === "rejected" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">Your application was not approved</p>
          {partner.rejectionReason ? (
            <p className="mt-1 text-sm text-destructive">{partner.rejectionReason}</p>
          ) : null}
          <p className="mt-2 text-xs text-destructive/80">
            Resubmit the documents below or contact your Protegey representative if you believe this is a mistake.
          </p>
        </div>
      ) : null}

      {allApproved ? (
        <div className="rounded-md border border-border bg-primary/10 px-4 py-3 text-sm text-primary">
          All documents have been approved. Your application is under final review.
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {documents.map((document) => (
          <DocumentUploadRow key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
}
