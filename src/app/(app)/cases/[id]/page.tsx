import type { Metadata } from "next";
import { getCase, getCaseSignalStatus, getCaseTimeline, getCaseCrossModuleEvidence } from "../actions";
import { getAssignableTeamMembers } from "../../team/actions";
import { getPartnerSettings } from "../../settings/profile/actions";
import { getDeviceSignals } from "../../pan-guard/device-signals/actions";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { CaseDetailClient } from "./CaseDetailClient";

export const metadata: Metadata = {
  title: "Case — Protegey Partner",
};

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionUser, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(sessionUser, "partners.manage_cases", lang);
  if (denied) return denied;

  const { id } = await params;
  const [kase, teamMembers, partner, signalStatus, timeline, crossModuleEvidence] = await Promise.all([
    getCase(id),
    getAssignableTeamMembers("partners.manage_cases"),
    getPartnerSettings(),
    getCaseSignalStatus(id),
    getCaseTimeline(id),
    getCaseCrossModuleEvidence(id),
  ]);
  const canShareSignal = sessionUser?.permissions.includes("partners.share_fraud_signal") ?? false;
  const canViewTransactions = sessionUser?.permissions.includes("partners.view_transactions") ?? false;

  // Known devices for this case's customer — offered as an extra identifier in the share dialog,
  // never fetched (or shown) unless the caller already has permission to see device signals.
  const knownDeviceSignals =
    canShareSignal && canViewTransactions ? await getDeviceSignals({ externalCustomerId: kase.externalCustomerId }) : null;
  const knownVisitorIds = [...new Set((knownDeviceSignals?.data ?? []).map((signal) => signal.visitorId).filter((id): id is string => Boolean(id)))];

  return (
    <CaseDetailClient
      kase={kase}
      teamMembers={teamMembers}
      sharedSignalsEnabled={partner.sharedSignalsEnabled}
      canShareSignal={canShareSignal}
      initialAlreadyShared={signalStatus.shared}
      knownVisitorIds={knownVisitorIds}
      timeline={timeline}
      crossModuleEvidence={crossModuleEvidence}
    />
  );
}
