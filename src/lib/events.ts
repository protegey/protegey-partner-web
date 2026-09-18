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
    default:
      return t(lang, "eventUnknown");
  }
}
