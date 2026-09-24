import type { Lang, StringKey } from "./i18n/strings";
import { t } from "./i18n/strings";

export interface NotificationEvent {
  id: string;
  partnerId: string;
  actorUserId: string | null;
  actorLabel: string | null;
  type: string;
  metadata: Record<string, string | number> | null;
  createdAt: string;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => vars[key] ?? "");
}

const STATUS_KEY: Record<string, StringKey> = {
  open: "alertsStatusOpen",
  confirmed: "alertsStatusConfirmed",
  more_info_requested: "alertsStatusMoreInfo",
  dismissed: "alertsStatusDismissed",
};

const DEVICE_ACTION_KEY: Record<string, StringKey> = {
  soft_challenge: "deviceActionSoftChallenge",
  hard_challenge: "deviceActionHardChallenge",
  block: "deviceActionBlock",
};

const CASE_STATUS_KEY: Record<string, StringKey> = {
  open: "caseStatusOpen",
  investigating: "caseStatusInvestigating",
  closed: "caseStatusClosed",
};

const CASE_OUTCOME_KEY: Record<string, StringKey> = {
  no_action: "caseOutcomeNoAction",
  false_positive: "caseOutcomeFalsePositive",
  sar_filed: "caseOutcomeSarFiled",
};

/** Where clicking this notification should navigate — null when no detail page exists for this
 * event type, in which case the notification renders as plain text instead of a link. Only ever
 * points at a route that genuinely exists; never a guessed/fabricated deep link. */
export function eventHref(event: NotificationEvent): string | null {
  const m = event.metadata ?? {};
  const str = (key: string) => (m[key] !== undefined ? String(m[key]) : null);

  const caseId = str("caseId");
  if (event.type.startsWith("case.") && caseId) return `/cases/${caseId}`;

  if (event.type === "sar.submitted") {
    const reportId = str("reportId");
    return reportId ? `/sar-str/${reportId}` : null;
  }

  const clientId = str("clientId");
  if (event.type.startsWith("kyb.") && clientId) return `/clients/${clientId}`;

  if (event.type === "device.signal_flagged") {
    const customerLabel = str("customerLabel");
    return customerLabel && customerLabel !== "unknown" ? `/pan-guard/device-signals?customer=${encodeURIComponent(customerLabel)}` : "/pan-guard/device-signals";
  }

  if (event.type === "alert.status_changed") return "/alerts";
  if (event.type.startsWith("rule.")) return "/alert-rules";
  if (event.type.startsWith("kyc.")) return "/kyc";
  if (event.type === "shared_signal.reported") return "/pan-risk/shared-signal-network";
  if (event.type.startsWith("team.")) return "/team";
  if (event.type === "settings.password_changed") return "/settings/security";
  if (event.type === "settings.logo_changed" || event.type === "settings.logo_removed") return "/settings/profile";
  if (event.type === "api_key.generated") return "/settings/api-keys";
  if (event.type === "webhook.configured") return "/settings/webhooks";

  return null;
}

/** Turns a stable event `type` + `metadata` into the sentence shown in Notifications/Audit Logs — the one place this translation happens, see NotificationEvent's backend docstring for why. */
export function describeEvent(lang: Lang, event: NotificationEvent): string {
  const actor = event.actorLabel ?? t(lang, "eventSystemActor");
  const m = event.metadata ?? {};
  const str = (key: string) => String(m[key] ?? "");

  switch (event.type) {
    case "team.invite_sent":
      return interpolate(t(lang, "eventTeamInviteSent"), { actor, agentEmail: str("agentEmail") });
    case "team.invite_accepted":
      return interpolate(t(lang, "eventTeamInviteAccepted"), { agentName: str("agentName"), agentEmail: str("agentEmail") });
    case "kyc.session_approved":
      return interpolate(t(lang, "eventKycApproved"), { customerLabel: str("customerLabel") });
    case "kyc.session_declined":
      return interpolate(t(lang, "eventKycDeclined"), { customerLabel: str("customerLabel") });
    case "kyb.application_submitted":
      return interpolate(t(lang, "eventKybSubmitted"), { businessName: str("businessName") });
    case "kyb.decision_approved":
      return interpolate(t(lang, "eventKybApproved"), { actor, businessName: str("businessName") });
    case "kyb.decision_rejected":
      return interpolate(t(lang, "eventKybRejected"), { actor, businessName: str("businessName") });
    case "kyb.decision_more_info":
      return interpolate(t(lang, "eventKybMoreInfo"), { actor, businessName: str("businessName") });
    case "rule.created":
      return interpolate(t(lang, "eventRuleCreated"), { actor, ruleName: str("ruleName") });
    case "rule.activated":
      return interpolate(t(lang, "eventRuleActivated"), { actor, ruleName: str("ruleName") });
    case "rule.disabled":
      return interpolate(t(lang, "eventRuleDisabled"), { actor, ruleName: str("ruleName") });
    case "alert.status_changed": {
      const statusKey = STATUS_KEY[str("status")];
      const statusLabel = statusKey ? t(lang, statusKey) : str("status");
      return interpolate(t(lang, "eventAlertStatusChanged"), { actor, ruleName: str("ruleName"), status: statusLabel });
    }
    case "api_key.generated":
      return interpolate(t(lang, "eventApiKeyGenerated"), { actor });
    case "webhook.configured":
      return interpolate(t(lang, "eventWebhookConfigured"), { actor });
    case "device.signal_flagged": {
      const actionKey = DEVICE_ACTION_KEY[str("deviceAction")];
      const actionLabel = actionKey ? t(lang, actionKey) : str("deviceAction");
      return interpolate(t(lang, "eventDeviceSignalFlagged"), { customerLabel: str("customerLabel"), deviceAction: actionLabel });
    }
    case "case.created":
      return interpolate(t(lang, "eventCaseCreated"), { actor, customerLabel: str("customerLabel"), title: str("title") });
    case "case.note_added":
      return interpolate(t(lang, "eventCaseNoteAdded"), { actor, title: str("title") });
    case "case.assigned":
      return interpolate(t(lang, "eventCaseAssigned"), { actor, title: str("title") });
    case "case.status_changed": {
      const statusKey = CASE_STATUS_KEY[str("status")];
      const statusLabel = statusKey ? t(lang, statusKey) : str("status");
      return interpolate(t(lang, "eventCaseStatusChanged"), { actor, title: str("title"), status: statusLabel });
    }
    case "case.closed": {
      const outcomeKey = CASE_OUTCOME_KEY[str("outcome")];
      const outcomeLabel = outcomeKey ? t(lang, outcomeKey) : str("outcome");
      return interpolate(t(lang, "eventCaseClosed"), { actor, title: str("title"), outcome: outcomeLabel });
    }
    case "sar.submitted":
      return interpolate(t(lang, "eventSarSubmitted"), { actor });
    case "shared_signal.reported": {
      const categoryKey: Record<string, StringKey> = {
        confirmed_fraud: "sharedSignalCategoryConfirmedFraud",
        identity_theft: "sharedSignalCategoryIdentityTheft",
        money_laundering: "sharedSignalCategoryMoneyLaundering",
        other: "sharedSignalCategoryOther",
      };
      const key = categoryKey[str("category")];
      const categoryLabel = key ? t(lang, key) : str("category");
      return interpolate(t(lang, "eventSharedSignalReported"), { actor, title: str("title"), category: categoryLabel });
    }
    case "settings.password_changed":
      return interpolate(t(lang, "eventPasswordChanged"), { actor });
    case "settings.logo_changed":
      return interpolate(t(lang, "eventLogoChanged"), { actor });
    case "settings.logo_removed":
      return interpolate(t(lang, "eventLogoRemoved"), { actor });
    case "team.agent_activated":
      return interpolate(t(lang, "eventAgentActivated"), { actor, agentEmail: str("agentEmail") });
    case "team.agent_deactivated":
      return interpolate(t(lang, "eventAgentDeactivated"), { actor, agentEmail: str("agentEmail") });
    case "team.invitation_updated":
      return interpolate(t(lang, "eventInvitationUpdated"), { actor, agentEmail: str("agentEmail") });
    case "team.password_reset_sent":
      return interpolate(t(lang, "eventPasswordResetSent"), { actor, agentEmail: str("agentEmail") });
    default:
      return t(lang, "eventUnknown");
  }
}
