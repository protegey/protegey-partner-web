"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { OrganizationLogo } from "@/components/OrganizationLogo";
import { DynamicKybField } from "@/components/kyb/DynamicKybField";
import { KybStepIndicator } from "@/components/kyb/KybStepIndicator";
import { validateKybFields } from "@/lib/kyb-validation";
import { LanguageToggle } from "./LanguageToggle";
import { SuccessIllustration } from "./SuccessIllustration";
import { t, type Lang } from "./i18n";
import { saveDraftAction, submitApplicationAction, uploadApplicationFieldDocumentAction, type ClientApplicationView } from "./actions";
import type { KybFieldDef } from "../(app)/clients/actions";

function SectionCard({
  field: sectionKey,
  title,
  fields,
  lang,
  answers,
  errors,
  documents,
  uploadingFieldId,
  onChangeField,
  onUploadField,
}: {
  field: string;
  title: string;
  fields: KybFieldDef[];
  lang: Lang;
  answers: Record<string, unknown>;
  errors: Record<string, string>;
  documents: Record<string, { fileName: string; mimeType: string }>;
  uploadingFieldId: string | null;
  onChangeField: (fieldId: string, value: unknown) => void;
  onUploadField: (fieldId: string, file: File) => void;
}) {
  return (
    <section key={sectionKey} className="animate-fade-in-up rounded-md border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.id} className={f.fieldType === "textarea" || f.fieldType === "document" ? "sm:col-span-2" : undefined}>
            <DynamicKybField
              field={f}
              lang={lang}
              value={answers[f.id]}
              onChange={(v) => onChangeField(f.id, v)}
              error={errors[f.id]}
              documentInfo={documents[f.id] ?? null}
              uploadingDocument={uploadingFieldId === f.id}
              onUploadDocument={(file) => onUploadField(f.id, file)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Dynamic-template counterpart of `ClientApplicationForm` — a separate component entirely (never
 * touching the legacy one) so the fixed-questionnaire path stays byte-for-byte untouched. Renders
 * `template.schema` as either a step-by-step wizard or one stacked single page, per the partner's
 * own `template.layout` choice.
 */
export function DynamicClientApplicationForm({ token, initial }: { token: string; initial: ClientApplicationView }) {
  const schema = initial.template?.schema ?? [];
  const layout = initial.template?.layout ?? "steps";

  const [lang, setLang] = useState<Lang>(initial.language ?? "en");
  const [answers, setAnswers] = useState<Record<string, unknown>>(initial.answers ?? {});
  const [documents, setDocuments] = useState(initial.documents);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [status, setStatus] = useState(initial.status);

  const editable = status === "pending" || status === "more_info_required";
  const uploadedFieldIds = useMemo(() => new Set(Object.keys(documents)), [documents]);

  function updateField(fieldId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  async function persistDraft(): Promise<boolean> {
    setAutoSaving(true);
    const result = await saveDraftAction(token, { answers, language: lang });
    setAutoSaving(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return false;
    }
    return true;
  }

  async function uploadField(fieldId: string, file: File) {
    setUploadingFieldId(fieldId);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadApplicationFieldDocumentAction(token, fieldId, formData);
    setUploadingFieldId(null);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setDocuments((prev) => ({ ...prev, [fieldId]: { fileName: file.name, mimeType: file.type } }));
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  async function handleNextStep() {
    const section = schema[stepIndex];
    const stepErrors = validateKybFields(section.fields, answers, uploadedFieldIds, lang);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setMessage(null);
    if (!(await persistDraft())) return;
    setStepIndex((i) => Math.min(i + 1, schema.length - 1));
  }

  function handleBackStep() {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSaveAndExit() {
    setMessage(null);
    if (await persistDraft()) setMessage({ type: "success", text: t(lang, "saved") });
  }

  async function handleSubmit() {
    const allFields = schema.flatMap((s) => s.fields);
    const allErrors = validateKybFields(allFields, answers, uploadedFieldIds, lang);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Land on the first section that actually has a problem, in step mode.
      if (layout === "steps") {
        const firstBadSectionIndex = schema.findIndex((s) => s.fields.some((f) => allErrors[f.id]));
        if (firstBadSectionIndex >= 0) setStepIndex(firstBadSectionIndex);
      }
      setMessage({ type: "error", text: t(lang, "validationError") });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    if (!(await persistDraft())) {
      setSubmitting(false);
      return;
    }
    const result = await submitApplicationAction(token);
    setSubmitting(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setStatus("submitted");
  }

  const header = (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <OrganizationLogo logoUrl={initial.hasPartnerLogo ? `/api/client-application-partner-logo/${token}` : null} name={initial.partnerName} size={36} />
        <p className="text-lg font-bold text-foreground">{initial.partnerName}</p>
      </div>
      <LanguageToggle lang={lang} onChange={setLang} />
    </div>
  );

  if (status === "submitted" || status === "approved" || status === "rejected") {
    const subheading =
      status === "approved" ? t(lang, "subheadingApproved") : status === "rejected" ? t(lang, "subheadingRejected") : t(lang, "subheadingSubmitted");
    return (
      <div className="min-h-svh bg-background">
        {header}
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-16 text-center">
          {status === "submitted" || status === "approved" ? <SuccessIllustration className="mb-2 h-24 w-24" /> : null}
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "heading")}</h1>
          <p className="text-sm text-muted-foreground">{subheading}</p>
          {status === "rejected" && initial.rejectionReason ? (
            <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{initial.rejectionReason}</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (schema.length === 0) {
    return (
      <div className="min-h-svh bg-background">
        {header}
        <p className="mx-auto max-w-lg px-6 py-16 text-center text-sm text-muted-foreground">
          {lang === "fr" ? "Ce formulaire est vide." : "This form is empty."}
        </p>
      </div>
    );
  }

  const bottomBar = editable ? (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
      <div className="flex items-center gap-3">
        {layout === "steps" && stepIndex > 0 ? (
          <button type="button" onClick={handleBackStep} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            {t(lang, "back")}
          </button>
        ) : null}
        <button type="button" onClick={handleSaveAndExit} disabled={autoSaving} className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
          {autoSaving ? t(lang, "saving") : t(lang, "saveAndExit")}
        </button>
      </div>
      {layout === "steps" && stepIndex < schema.length - 1 ? (
        <button
          type="button"
          onClick={handleNextStep}
          disabled={autoSaving}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t(lang, "next")}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {t(lang, "submit")}
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="min-h-svh bg-background pb-16">
      {header}
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "heading")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{status === "more_info_required" ? t(lang, "subheadingMoreInfo") : t(lang, "subheadingPending")}</p>
        </div>

        {status === "more_info_required" && initial.moreInfoNote ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700">{t(lang, "moreInfoNoteLabel")}</p>
            <p className="mt-1 text-sm text-amber-700">{initial.moreInfoNote}</p>
          </div>
        ) : null}

        {layout === "steps" ? (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t(lang, "stepLabelPrefix")} {stepIndex + 1} {t(lang, "stepLabelJoiner")} {schema.length}
              </p>
              <KybStepIndicator sections={schema} stepIndex={stepIndex} />
            </div>
            <SectionCard
              field={schema[stepIndex].id}
              title={lang === "fr" ? schema[stepIndex].titleFr : schema[stepIndex].title}
              fields={schema[stepIndex].fields}
              lang={lang}
              answers={answers}
              errors={errors}
              documents={documents}
              uploadingFieldId={uploadingFieldId}
              onChangeField={updateField}
              onUploadField={uploadField}
            />
          </>
        ) : (
          schema.map((section) => (
            <SectionCard
              key={section.id}
              field={section.id}
              title={lang === "fr" ? section.titleFr : section.title}
              fields={section.fields}
              lang={lang}
              answers={answers}
              errors={errors}
              documents={documents}
              uploadingFieldId={uploadingFieldId}
              onChangeField={updateField}
              onUploadField={uploadField}
            />
          ))
        )}

        {message ? <p className={`text-sm ${message.type === "error" ? "text-destructive" : "text-primary"}`}>{message.text}</p> : null}

        {bottomBar}
      </div>
    </div>
  );
}
