import type { Metadata } from "next";
import { getIntegrationHealth } from "./actions";
import { IntegrationHealthClient } from "./IntegrationHealthClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Integration Health — Protegey Partner",
};

export default async function IntegrationHealthPage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_integrations", lang);
  if (denied) return denied;

  const report = await getIntegrationHealth();
  return <IntegrationHealthClient report={report} />;
}
