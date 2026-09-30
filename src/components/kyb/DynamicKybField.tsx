"use client";

import { useRef } from "react";
import { AlertCircle, FileText, Loader2, Upload } from "lucide-react";
import type { KybFieldDef } from "@/app/(app)/clients/actions";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring";

/**
 * Renders exactly one field from a partner-built KYB form — shared verbatim between the partner's
 * own live preview (`KybTemplateBuilder`) and the real applicant-facing form
 * (`DynamicClientApplicationForm`), so there is never a gap between what a partner previews and
 * what their client actually sees.
 */
export function DynamicKybField({
  field,
  lang,
  value,
  onChange,
  error,
  documentInfo,
  onUploadDocument,
  uploadingDocument,
  downloadDocumentHref,
  disabled,
}: {
  field: KybFieldDef;
  lang: "en" | "fr";
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  documentInfo?: { fileName: string; mimeType: string } | null;
  onUploadDocument?: (file: File) => void | Promise<void>;
  uploadingDocument?: boolean;
  downloadDocumentHref?: string;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const label = lang === "fr" ? field.labelFr : field.label;
  const yesLabel = lang === "fr" ? "Oui" : "Yes";
  const noLabel = lang === "fr" ? "Non" : "No";

  const fieldLabel = (
    <label className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-foreground">
      {label}
      {field.required ? <span className="text-destructive">*</span> : null}
    </label>
  );

  // A generic hint, not the label repeated — the label already sits right above the field, so
  // echoing it again as a placeholder would just be noise rather than useful guidance.
  const genericPlaceholder =
    field.fieldType === "number"
      ? lang === "fr"
        ? "Entrez un nombre"
        : "Enter a number"
      : lang === "fr"
        ? "Entrez votre réponse"
        : "Enter your answer";

  const errorNode = error ? (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertCircle className="size-3.5 shrink-0" />
      {error}
    </p>
  ) : null;

  if (field.fieldType === "text" || field.fieldType === "number" || field.fieldType === "date") {
    return (
      <div>
        {fieldLabel}
        <input
          type={field.fieldType}
          value={(value as string | number | undefined) ?? ""}
          disabled={disabled}
          placeholder={field.fieldType === "date" ? undefined : genericPlaceholder}
          onChange={(e) => onChange(field.fieldType === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
          className={`${inputClass} ${error ? "ring-2 ring-destructive/40" : ""}`}
        />
        {errorNode}
      </div>
    );
  }

  if (field.fieldType === "textarea") {
    return (
      <div>
        {fieldLabel}
        <textarea
          rows={3}
          value={(value as string | undefined) ?? ""}
          disabled={disabled}
          placeholder={genericPlaceholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-y ${error ? "ring-2 ring-destructive/40" : ""}`}
        />
        {errorNode}
      </div>
    );
  }

  if (field.fieldType === "select") {
    return (
      <div>
        {fieldLabel}
        <select
          value={(value as string | undefined) ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${error ? "ring-2 ring-destructive/40" : ""}`}
        >
          <option value="" disabled>
            {lang === "fr" ? "Sélectionner…" : "Select…"}
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errorNode}
      </div>
    );
  }

  if (field.fieldType === "checkbox") {
    return (
      <div>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={value === true}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm font-medium text-foreground">
            {label}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </span>
        </label>
        {errorNode}
      </div>
    );
  }

  if (field.fieldType === "checkbox_group") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        {fieldLabel}
        <div className="flex flex-col gap-2">
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked ? [...selected, option] : selected.filter((o) => o !== option))}
                className="size-4 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}
        </div>
        {errorNode}
      </div>
    );
  }

  if (field.fieldType === "yes_no") {
    return (
      <div>
        {fieldLabel}
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(true)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              value === true ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {yesLabel}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(false)}
            className={`border-l border-border px-4 py-2 text-sm font-medium transition-colors ${
              value === false ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {noLabel}
          </button>
        </div>
        {errorNode}
      </div>
    );
  }

  // fieldType === "document"
  return (
    <div>
      {fieldLabel}
      <div className={`rounded-md border border-dashed p-4 transition-colors ${error ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/20"}`}>
        {documentInfo ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <FileText className="size-5 shrink-0 text-primary" />
              <span className="truncate text-sm font-medium text-foreground">{documentInfo.fileName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {downloadDocumentHref ? (
                <a href={downloadDocumentHref} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                  {lang === "fr" ? "Voir" : "View"}
                </a>
              ) : null}
              <button
                type="button"
                disabled={disabled || uploadingDocument}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {lang === "fr" ? "Remplacer" : "Replace"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || uploadingDocument}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-1.5 py-2 text-center"
          >
            {uploadingDocument ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="size-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">
              {uploadingDocument ? (lang === "fr" ? "Envoi…" : "Uploading…") : lang === "fr" ? "Cliquer pour téléverser" : "Click to upload"}
            </span>
            <span className="text-xs text-muted-foreground">PDF, JPEG, PNG — 10MB max</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onUploadDocument) void onUploadDocument(file);
            e.target.value = "";
          }}
        />
      </div>
      {errorNode}
    </div>
  );
}
