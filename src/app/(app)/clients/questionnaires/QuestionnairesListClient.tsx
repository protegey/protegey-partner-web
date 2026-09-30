"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, FileText, Plus, Trash2 } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import type { KybFormTemplate } from "../actions";
import { createKybTemplate, deleteKybTemplate, duplicateKybTemplate } from "../actions";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-600",
  published: "bg-primary/10 text-primary",
};

// Empty labels are fine here — new templates are always created as a draft, which the backend
// validates leniently (see kyb-form-schema-validator's `strict: false` path), so there's no need
// for placeholder-looking fake text just to get past validation before the partner types anything.
function emptyDraftSchema() {
  return [
    {
      id: `section-${Date.now()}`,
      title: "",
      titleFr: "",
      fields: [
        {
          id: `field-${Date.now()}`,
          label: "",
          labelFr: "",
          fieldType: "text" as const,
          required: false,
        },
      ],
    },
  ];
}

export function QuestionnairesListClient({ initialTemplates, lang }: { initialTemplates: KybFormTemplate[]; lang: "en" | "fr" }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleCreate() {
    setBusyId("__new__");
    setError(null);
    const result = await createKybTemplate({
      name: lang === "fr" ? "Nouveau formulaire" : "New form",
      status: "draft",
      layout: "steps",
      schema: emptyDraftSchema(),
    });
    setBusyId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/clients/questionnaires/${result.id}`);
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    setError(null);
    const result = await duplicateKybTemplate(id);
    setBusyId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/clients/questionnaires/${result.id}`);
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    setBusyId(confirmDeleteId);
    const result = await deleteKybTemplate(confirmDeleteId);
    setBusyId(null);
    setConfirmDeleteId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== confirmDeleteId));
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {lang === "fr"
            ? "Construisez vos propres formulaires KYB — libellés, types de champ, documents requis — et choisissez lequel envoyer à chaque client."
            : "Build your own KYB forms — labels, field types, required documents — and pick which one to send each client."}
        </p>
        <button
          type="button"
          onClick={handleCreate}
          disabled={busyId === "__new__"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-4" />
          {lang === "fr" ? "Nouveau formulaire" : "New form"}
        </button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isSystemDefault = template.partnerId === null;
          return (
            <div key={template.id} className="animate-fade-in-up flex flex-col gap-3 rounded-md border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{template.name}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[template.status]}`}>
                  {template.status === "published" ? (lang === "fr" ? "Publié" : "Published") : lang === "fr" ? "Brouillon" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {template.schema.length} {lang === "fr" ? "section(s)" : "section(s)"} —{" "}
                {isSystemDefault ? (lang === "fr" ? "Formulaire par défaut" : "System default") : lang === "fr" ? "Votre formulaire" : "Your form"}
              </p>
              <div className="mt-1 flex items-center gap-3 border-t border-border pt-3">
                {isSystemDefault ? (
                  <button
                    type="button"
                    onClick={() => handleDuplicate(template.id)}
                    disabled={busyId === template.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    <Copy className="size-3.5" />
                    {lang === "fr" ? "Dupliquer pour personnaliser" : "Duplicate to customize"}
                  </button>
                ) : (
                  <>
                    <a href={`/clients/questionnaires/${template.id}`} className="text-xs font-medium text-primary hover:underline">
                      {lang === "fr" ? "Modifier" : "Edit"}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(template.id)}
                      disabled={busyId === template.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <Copy className="size-3.5" />
                      {lang === "fr" ? "Dupliquer" : "Duplicate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(template.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      {lang === "fr" ? "Supprimer" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmActionDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title={lang === "fr" ? "Supprimer ce formulaire ?" : "Delete this form?"}
        description={
          lang === "fr"
            ? "Cette action est irréversible. Un formulaire déjà envoyé à un client ne peut pas être supprimé."
            : "This can't be undone. A form already sent to a client can't be deleted."
        }
        confirmLabel={lang === "fr" ? "Supprimer" : "Delete"}
        pendingLabel={lang === "fr" ? "Suppression…" : "Deleting…"}
        pending={busyId === confirmDeleteId}
        variant="destructive"
      />
    </div>
  );
}
