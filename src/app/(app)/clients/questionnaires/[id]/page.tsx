import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getKybTemplate } from "../../actions";
import { KybTemplateBuilder } from "./KybTemplateBuilder";
import { getLang } from "@/lib/i18n/lang";

export const metadata: Metadata = {
  title: "KYB Form Builder — Protegey Partner",
};

export default async function KybTemplateBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();

  const template = await getKybTemplate(id).catch(() => null);
  if (!template) notFound();

  if (template.partnerId === null) {
    // The system default is read-only in this editor — the list page only ever links here for a
    // partner's own template; landing here directly for the default is a dead end, not an error.
    notFound();
  }

  return <KybTemplateBuilder template={template} lang={lang} />;
}
