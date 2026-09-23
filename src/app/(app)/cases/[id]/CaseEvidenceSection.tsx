"use client";

import { useRef, useState } from "react";
import { Download, File, FileText, Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useLang } from "@/lib/i18n/LangProvider";
import { addCaseEvidenceAction, deleteCaseEvidenceAction, type CaseEvidence } from "../actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

function iconForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** File attachments on a case — the old platform's Evidence tab. Deliberately no MIME allowlist
 * client-side either: evidence can legitimately be almost anything. */
export function CaseEvidenceSection({ caseId, initialEvidence, disabled }: { caseId: string; initialEvidence: CaseEvidence[]; disabled: boolean }) {
  const guard = useSessionGuard();
  const { t, lang } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (description.trim()) formData.append("description", description.trim());
      const result = await guard(() => addCaseEvidenceAction(caseId, formData));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setEvidence((prev) => [result, ...prev]);
      setSelectedFile(null);
      setDescription("");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(evidenceId: string) {
    setDeletingId(evidenceId);
    setError(null);
    try {
      const result = await guard(() => deleteCaseEvidenceAction(caseId, evidenceId));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setEvidence((prev) => prev.filter((e) => e.id !== evidenceId));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">{t("caseEvidenceTitle")}</p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {evidence.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("caseEvidenceEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {evidence.map((item) => {
            const Icon = iconForMime(item.mimeType);
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                <Icon className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.fileName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.description ? `${item.description} · ` : ""}
                    {formatFileSize(item.fileSizeBytes)} · {new Date(item.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                  </p>
                </div>
                <a
                  href={`/api/case-evidence/${caseId}/${item.id}`}
                  download={item.fileName}
                  className="flex shrink-0 items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={t("caseEvidenceDownload")}
                >
                  <Download className="size-4" />
                </a>
                {!disabled ? (
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    title={t("caseEvidenceDelete")}
                  >
                    {deletingId === item.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {!disabled ? (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
          <input
            ref={inputRef}
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("caseEvidenceDescriptionPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            disabled={!selectedFile || uploading}
            onClick={handleUpload}
            className="flex w-fit items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {t("caseEvidenceUploadButton")}
          </button>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title={t("caseEvidenceDeleteDialogTitle")}
        description={t("caseEvidenceDeleteDialogDescription")}
        confirmLabel={t("caseEvidenceDelete")}
        pending={deletingId !== null}
        variant="destructive"
      />
    </div>
  );
}
