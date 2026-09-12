"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye } from "lucide-react";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { submitDocumentAction, type PartnerDocument, type SubmitDocumentState } from "./actions";

const DOCUMENT_LABELS: Record<string, string> = {
  business_registration: "Business registration certificate",
  tax_certificate: "Tax identification certificate",
  proof_of_address: "Proof of address",
  director_id: "Director / owner ID",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  submitted: "In review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

const initialState: SubmitDocumentState = {};

function UploadingIndicator() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>;
}

export function DocumentUploadRow({ document }: { document: PartnerDocument }) {
  const router = useRouter();
  const action = submitDocumentAction.bind(null, document.id);
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const canUpload = document.status === "pending" || document.status === "rejected";

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {DOCUMENT_LABELS[document.type] ?? formatLabel(document.type)}
            <span className="ml-0.5 text-destructive" title="Required">
              *
            </span>
          </p>
          {document.fileName ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              <Eye className="size-3" />
              Preview {document.fileName}
            </button>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">No file submitted yet</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[document.status]}`}>
          {STATUS_LABELS[document.status] ?? formatLabel(document.status)}
        </span>
      </div>

      {document.status === "rejected" && document.rejectionReason ? (
        <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span className="font-medium">Why this was rejected: </span>
          {document.rejectionReason}
        </p>
      ) : null}

      {canUpload ? (
        <form ref={formRef} action={formAction} className="mt-3">
          <input
            type="file"
            name="file"
            accept="application/pdf,image/jpeg,image/png"
            required
            onChange={(event) => {
              // Uploads the moment a file is picked — no separate "Upload" click needed.
              if (event.target.files && event.target.files.length > 0) {
                formRef.current?.requestSubmit();
              }
            }}
            className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted"
          />
          <UploadingIndicator />
        </form>
      ) : null}

      {state.error ? <p className="mt-2 text-xs text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-primary">
          <CheckCircle2 className="size-3.5" />
          Uploaded — you can continue.
        </p>
      ) : null}

      {document.fileName ? (
        <DocumentPreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileName={document.fileName}
          fileUrl={`/api/documents/${document.id}/download`}
          mimeType={document.mimeType}
        />
      ) : null}
    </div>
  );
}
