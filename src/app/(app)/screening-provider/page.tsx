import type { Metadata } from "next";
import { getScreeningProviderStatus } from "./actions";
import { getSessionUser } from "@/lib/session";
import { ScreeningProviderClient } from "./ScreeningProviderClient";

export const metadata: Metadata = {
  title: "Screening Provider — Protegey Partner",
};

export default async function ScreeningProviderPage() {
  const [status, sessionUser] = await Promise.all([getScreeningProviderStatus(), getSessionUser()]);
  const canManage = sessionUser?.permissions.includes("partners.manage_settings") ?? false;

  return <ScreeningProviderClient initialStatus={status} canManage={canManage} />;
}
