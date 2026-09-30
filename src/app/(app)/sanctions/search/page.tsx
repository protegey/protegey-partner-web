import type { Metadata } from "next";
import { SanctionsSearchClient } from "./SanctionsSearchClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Sanctions & PEP Search — Protegey Partner",
};

export default async function SanctionsSearchPage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "sanctions.view", lang);
  if (denied) return denied;

  return <SanctionsSearchClient />;
}
