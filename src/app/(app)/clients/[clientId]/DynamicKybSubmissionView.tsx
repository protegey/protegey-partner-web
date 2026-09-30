import { FileText } from "lucide-react";
import type { ClientKybSubmission } from "../actions";
import type { Lang } from "@/lib/i18n/strings";

function formatAnswer(value: unknown, lang: Lang): string {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return "—";
  if (typeof value === "boolean") return value ? (lang === "fr" ? "Oui" : "Yes") : lang === "fr" ? "Non" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/** Read-only rendering of a dynamic-template submission's answers for the partner's review page — the counterpart of `DynamicKybField` for a partner reading, not filling, a form. */
export function DynamicKybSubmissionView({ submission, lang, clientId }: { submission: ClientKybSubmission; lang: Lang; clientId: string }) {
  const schema = submission.templateSchemaSnapshot ?? [];
  const answers = submission.answers ?? {};

  return (
    <>
      {schema.map((section) => (
        <div key={section.id} className="rounded-md border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">{lang === "fr" ? section.titleFr : section.title}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {section.fields.map((field) => {
              const label = lang === "fr" ? field.labelFr : field.label;
              if (field.fieldType === "document") {
                return (
                  <div key={field.id}>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <a
                      href={`/api/client-kyb-field-document/${clientId}/${field.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="size-3.5" />
                      {lang === "fr" ? "Voir le document" : "View document"}
                    </a>
                  </div>
                );
              }
              return (
                <div key={field.id}>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-sm text-foreground">{formatAnswer(answers[field.id], lang)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
