import type { KybFieldDef, KybSectionDef } from "@/app/(app)/clients/actions";

/**
 * Client-side mirror of the backend's schema-driven `assertCompleteDynamic` check — immediate
 * feedback only, never the source of truth (a submit still re-validates server-side, since client
 * validation is always bypassable). Both sides check the exact same `field.required`/`fieldType`
 * from the same schema, so they can never silently disagree about what "complete" means.
 */
export function validateKybFields(
  fields: KybFieldDef[],
  answers: Record<string, unknown>,
  uploadedFieldIds: Set<string>,
  lang: "en" | "fr",
): Record<string, string> {
  const errors: Record<string, string> = {};
  const requiredMessage = lang === "fr" ? "Ce champ est obligatoire" : "This field is required";

  for (const field of fields) {
    if (!field.required) continue;
    if (field.fieldType === "document") {
      if (!uploadedFieldIds.has(field.id)) errors[field.id] = lang === "fr" ? "Un document est requis" : "A document is required";
      continue;
    }
    const value = answers[field.id];
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim().length === 0) ||
      (field.fieldType === "checkbox" && value !== true) ||
      (field.fieldType === "checkbox_group" && (!Array.isArray(value) || value.length === 0)) ||
      (field.fieldType === "yes_no" && typeof value !== "boolean");
    if (isEmpty) errors[field.id] = requiredMessage;
  }
  return errors;
}

export function validateKybSection(section: KybSectionDef, answers: Record<string, unknown>, uploadedFieldIds: Set<string>, lang: "en" | "fr") {
  return validateKybFields(section.fields, answers, uploadedFieldIds, lang);
}
