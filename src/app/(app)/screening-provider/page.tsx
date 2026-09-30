import type { Metadata } from "next";
import { getScreeningProviderStatus } from "./actions";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { ScreeningProviderClient } from "./ScreeningProviderClient";

export const metadata: Metadata = {
  title: "Screening Provider — Protegey Partner",
};

export default async function ScreeningProviderPage() {
  const [sessionUser, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(sessionUser, "sanctions.view", lang);
  if (denied) return denied;

  const status = await getScreeningProviderStatus();
  const canManage = sessionUser?.permissions.includes("sanctions.manage") ?? false;

  return <ScreeningProviderClient initialStatus={status} canManage={canManage} />;
}
