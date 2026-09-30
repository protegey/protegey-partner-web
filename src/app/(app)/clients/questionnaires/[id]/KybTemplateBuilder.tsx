"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowDown, ArrowUp, Eye, FilePenLine, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DynamicKybField } from "@/components/kyb/DynamicKybField";
import { KybStepIndicator } from "@/components/kyb/KybStepIndicator";
import { updateKybTemplate, type KybFieldDef, type KybFieldType, type KybFormLayout, type KybFormTemplate, type KybSectionDef } from "../../actions";

const inputClass = "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const OPTIONS_FIELD_TYPES: KybFieldType[] = ["select", "checkbox_group"];

const FIELD_TYPES: { value: KybFieldType; labelEn: string; labelFr: string }[] = [
  { value: "text", labelEn: "Text", labelFr: "Texte" },
  { value: "textarea", labelEn: "Long text", labelFr: "Texte long" },
  { value: "number", labelEn: "Number", labelFr: "Nombre" },
  { value: "date", labelEn: "Date", labelFr: "Date" },
  { value: "select", labelEn: "Choice list (dropdown)", labelFr: "Liste de choix (menu)" },
  { value: "checkbox_group", labelEn: "Multiple checkboxes", labelFr: "Cases à cocher multiples" },
  { value: "yes_no", labelEn: "Yes / No", labelFr: "Oui / Non" },
  { value: "checkbox", labelEn: "Single checkbox", labelFr: "Case à cocher unique" },
  { value: "document", labelEn: "Document", labelFr: "Document" },
];

function uid(prefix: string): string {
  return `${prefix}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8)}`;
}

/** Empty on purpose — the builder saves as a lenient draft (see kyb-form-schema-validator's
 * `strict: false` path), so a fresh question doesn't need placeholder-looking fake text just to
 * pass validation; the real placeholders below already show the user what belongs in each field. */
function emptyField(): KybFieldDef {
  return { id: uid("field"), label: "", labelFr: "", fieldType: "text", required: false };
}

function emptySection(): KybSectionDef {
  return { id: uid("section"), title: "", titleFr: "", fields: [emptyField()] };
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Deliberately uncontrolled-by-the-schema while typing: if this input re-derived its value from
 * `field.options` on every keystroke (join on change, split on read), a trailing comma the user
 * just typed would vanish immediately — `"a,".split(",")` drops the empty tail — making it
 * impossible to ever type a second option. Keeping local text state and only committing the
 * parsed array on blur fixes that outright.
 */
function OptionsEditor({ field, onCommit, lang }: { field: KybFieldDef; onCommit: (options: string[]) => void; lang: "en" | "fr" }) {
  const [text, setText] = useState((field.options ?? []).join(", "));
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(text.split(",").map((o) => o.trim()).filter(Boolean))}
      placeholder={lang === "fr" ? "Options séparées par des virgules, ex : Oui, Non, Peut-être" : "Options, comma-separated, e.g. Yes, No, Maybe"}
      className={inputClass}
    />
  );
}

export function KybTemplateBuilder({ template, lang }: { template: KybFormTemplate; lang: "en" | "fr" }) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [layout, setLayout] = useState<KybFormLayout>(template.layout);
  const [schema, setSchema] = useState<KybSectionDef[]>(template.schema);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, unknown>>({});
  const [previewStepIndex, setPreviewStepIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  /** Swipe left = next step, swipe right = previous — 40px is enough to distinguish an intentional
   * horizontal swipe from a vertical scroll or a stray tap, without needing a gesture library. */
  function handlePreviewTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handlePreviewTouchEnd(e: React.TouchEvent, sectionCount: number) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 40;
    if (deltaX <= -SWIPE_THRESHOLD) setPreviewStepIndex((i) => Math.min(sectionCount - 1, i + 1));
    else if (deltaX >= SWIPE_THRESHOLD) setPreviewStepIndex((i) => Math.max(0, i - 1));
  }

  const fr = lang === "fr";

  function updateSection(sectionId: string, patch: Partial<KybSectionDef>) {
    setSchema((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  }

  function updateField(sectionId: string, fieldId: string, patch: Partial<KybFieldDef>) {
    setSchema((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) } : s)),
    );
  }

  function addSection() {
    setSchema((prev) => [...prev, emptySection()]);
  }

  function removeSection(sectionId: string) {
    setSchema((prev) => prev.filter((s) => s.id !== sectionId));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setSchema((prev) => moveItem(prev, index, direction));
  }

  function addField(sectionId: string) {
    setSchema((prev) => prev.map((s) => (s.id === sectionId ? { ...s, fields: [...s.fields, emptyField()] } : s)));
  }

  function removeField(sectionId: string, fieldId: string) {
    setSchema((prev) => prev.map((s) => (s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s)));
  }

  function moveField(sectionId: string, index: number, direction: -1 | 1) {
    setSchema((prev) => prev.map((s) => (s.id === sectionId ? { ...s, fields: moveItem(s.fields, index, direction) } : s)));
  }

  async function handleSave(nextStatus: "draft" | "published") {
    setSaving(true);
    setError(null);
    const result = await updateKybTemplate(template.id, { name, status: nextStatus, layout, schema });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.success(
      nextStatus === "published"
        ? fr
          ? "Formulaire publié — disponible dès maintenant pour vos invitations."
          : "Form published — now available for your invitations."
        : fr
          ? "Brouillon enregistré."
          : "Draft saved.",
    );
    router.refresh();
  }

  return (
    <div className="flex w-full flex-col gap-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Link href="/clients?tab=questionnaires" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={fr ? "Nom du formulaire (ex : Formulaire Marchand)" : "Form name (e.g. Merchant Form)"}
              className="w-full max-w-sm rounded-md border border-border bg-card px-3 py-1.5 text-base font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${template.status === "published" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"}`}>
            {template.status === "published" ? (fr ? "Publié" : "Published") : fr ? "Brouillon" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${mode === "edit" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <FilePenLine className="size-3.5" />
              {fr ? "Éditer" : "Edit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewStepIndex(0);
                setMode("preview");
              }}
              className={`inline-flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-xs font-medium transition-colors ${mode === "preview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Eye className="size-3.5" />
              {fr ? "Aperçu" : "Preview"}
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {mode === "edit" ? (
        <>
          <div className="flex flex-wrap items-center gap-6 rounded-md border border-border bg-card p-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{fr ? "Mise en page côté client" : "Client-side layout"}</p>
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setLayout("steps")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${layout === "steps" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  {fr ? "Par étapes" : "Step by step"}
                </button>
                <button
                  type="button"
                  onClick={() => setLayout("single_page")}
                  className={`border-l border-border px-3 py-1.5 text-xs font-medium transition-colors ${layout === "single_page" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  {fr ? "Une seule page" : "Single page"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {schema.map((section, sectionIndex) => (
              <div key={section.id} className="animate-fade-in-up rounded-md border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                    <input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder={fr ? "Titre de la section — en anglais" : "Section title — in English"}
                      className={inputClass}
                    />
                    <input
                      value={section.titleFr}
                      onChange={(e) => updateSection(section.id, { titleFr: e.target.value })}
                      placeholder={fr ? "Titre de la section — en français" : "Section title — in French"}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" disabled={sectionIndex === 0} onClick={() => moveSection(sectionIndex, -1)} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30">
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={sectionIndex === schema.length - 1}
                      onClick={() => moveSection(sectionIndex, 1)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={schema.length <= 1}
                      onClick={() => removeSection(section.id)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={field.id} className="flex flex-col gap-2 rounded-md bg-muted/30 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={field.label}
                          onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                          placeholder={fr ? "Libellé de la question — en anglais" : "Question label — in English"}
                          className={inputClass}
                        />
                        <input
                          value={field.labelFr}
                          onChange={(e) => updateField(section.id, field.id, { labelFr: e.target.value })}
                          placeholder={fr ? "Libellé de la question — en français" : "Question label — in French"}
                          className={inputClass}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {FIELD_TYPES.map((ft) => (
                          <button
                            key={ft.value}
                            type="button"
                            onClick={() => updateField(section.id, field.id, { fieldType: ft.value })}
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                              field.fieldType === ft.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {fr ? ft.labelFr : ft.labelEn}
                          </button>
                        ))}
                      </div>

                      {OPTIONS_FIELD_TYPES.includes(field.fieldType) ? (
                        <OptionsEditor field={field} lang={lang} onCommit={(options) => updateField(section.id, field.id, { options })} />
                      ) : null}

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(section.id, field.id, { required: e.target.checked })}
                          />
                          {fr ? "Obligatoire" : "Required"}
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={fieldIndex === 0}
                            onClick={() => moveField(section.id, fieldIndex, -1)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={fieldIndex === section.fields.length - 1}
                            onClick={() => moveField(section.id, fieldIndex, 1)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={section.fields.length <= 1}
                            onClick={() => removeField(section.id, field.id)}
                            className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField(section.id)}
                    className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    <Plus className="size-3.5" />
                    {fr ? "Ajouter une question" : "Add a question"}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSection}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <Plus className="size-4" />
              {fr ? "Ajouter une section" : "Add a section"}
            </button>
          </div>
        </>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          {layout === "steps" ? (
            <>
              <p className="text-center text-xs font-medium text-muted-foreground">
                {fr ? "Étape" : "Step"} {Math.min(previewStepIndex, schema.length - 1) + 1} {fr ? "sur" : "of"} {schema.length}
              </p>
              <KybStepIndicator sections={schema} stepIndex={Math.min(previewStepIndex, schema.length - 1)} onStepClick={setPreviewStepIndex} />
            </>
          ) : null}

          {(layout === "steps" ? [schema[Math.min(previewStepIndex, schema.length - 1)]] : schema).map((section) => (
            <section
              key={section.id}
              className="animate-fade-in-up rounded-md border border-border bg-card p-5"
              onTouchStart={layout === "steps" ? handlePreviewTouchStart : undefined}
              onTouchEnd={layout === "steps" ? (e) => handlePreviewTouchEnd(e, schema.length) : undefined}
            >
              <h2 className="mb-4 text-base font-semibold text-foreground">
                {(fr ? section.titleFr : section.title) || (fr ? "(Section sans titre)" : "(Untitled section)")}
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.id} className={field.fieldType === "textarea" || field.fieldType === "document" ? "sm:col-span-2" : undefined}>
                    <DynamicKybField
                      field={{ ...field, label: field.label || "(Untitled question)", labelFr: field.labelFr || "(Question sans titre)" }}
                      lang={lang}
                      value={previewAnswers[field.id]}
                      onChange={(v) => setPreviewAnswers((prev) => ({ ...prev, [field.id]: v }))}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {layout === "steps" ? (
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={previewStepIndex === 0}
                onClick={() => setPreviewStepIndex((i) => Math.max(0, i - 1))}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40"
              >
                {fr ? "Précédent" : "Back"}
              </button>
              <button
                type="button"
                disabled={previewStepIndex >= schema.length - 1}
                onClick={() => setPreviewStepIndex((i) => Math.min(schema.length - 1, i + 1))}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {fr ? "Suivant" : "Next"}
              </button>
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">
            {fr ? "Aperçu uniquement — rien n'est enregistré ici." : "Preview only — nothing here is saved."}
          </p>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {fr ? "Enregistrer le brouillon" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (fr ? "Enregistrement…" : "Saving…") : fr ? "Publier" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
