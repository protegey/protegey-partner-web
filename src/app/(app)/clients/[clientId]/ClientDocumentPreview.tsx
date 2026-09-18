"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { useLang } from "@/lib/i18n/LangProvider";

export function ClientDocumentPreview({
  clientId,
  fileName,
  mimeType,
}: {
  clientId: string;
  fileName: string | null;
  mimeType: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();

  if (!fileName) {
    return <p className="text-sm text-muted-foreground">{t("clientsNoDocumentUploaded")}</p>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary hover:underline"
      >
        <Eye className="size-4" />
        {t("clientsPreviewDocumentPrefix")} {fileName}
      </button>
      <DocumentPreviewDialog
        open={open}
        onClose={() => setOpen(false)}
        fileName={fileName}
        fileUrl={`/api/client-documents/${clientId}/download`}
        mimeType={mimeType}
      />
    </>
  );
}
