/**
 * Mirrors the 6 fixed partner roles and their permissions from the backend's
 * `src/database/seeds/seed-data/roles.data.ts` (see `protegey_role_access_matrix.pdf`). The role
 * catalogue is closed — no partner or agent can create a custom role — so this small table is
 * cheap to keep in sync and lets the frontend explain an access-denied page without an extra
 * round trip. Update this alongside any backend role/permission change.
 */
export const ROLE_LABELS: Record<string, { en: string; fr: string }> = {
  analyst_kyc_kyb: { en: "Analyst — KYC/KYB", fr: "Analyste — KYC/KYB" },
  analyst_payment_fraud: { en: "Analyst — Payment Fraud", fr: "Analyste — Fraude paiement" },
  head_of_risk_and_compliance: { en: "Head of Risk & Compliance", fr: "Responsable risque & conformité" },
  mlro: { en: "MLRO", fr: "MLRO" },
  technical_integrations: { en: "Technical / Integrations", fr: "Technique / Intégrations" },
  platform_administrator: { en: "Platform Administrator", fr: "Administrateur plateforme" },
  partner_super_admin: { en: "Super Admin (CEO)", fr: "Super admin (PDG)" },
};

const PLATFORM_ADMIN_PERMISSIONS = [
  "users.view",
  "users.create",
  "users.update",
  "partners.manage_team",
  "partners.manage_clients",
  "partners.manage_organization",
  "partners.manage_billing",
  "partners.manage_security",
  "partners.manage_integrations",
  "partners.manage_kyc",
  "partners.manage_alert_rules",
  "partners.view_transactions",
  "partners.manage_alerts",
  "partners.manage_cases",
  "partners.manage_compliance_cases",
  "partners.submit_sar",
  "partners.share_fraud_signal",
  "partners.view_audit_logs",
  "sanctions.view",
  "sanctions.manage",
  "roles.view",
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  analyst_kyc_kyb: ["partners.manage_kyc", "partners.manage_clients", "partners.manage_cases"],
  analyst_payment_fraud: ["partners.view_transactions", "partners.manage_alerts", "partners.manage_cases"],
  head_of_risk_and_compliance: [
    "partners.manage_kyc",
    "partners.manage_clients",
    "partners.view_transactions",
    "partners.manage_alerts",
    "partners.manage_alert_rules",
    "partners.manage_cases",
    "partners.manage_compliance_cases",
    "partners.submit_sar",
    "partners.share_fraud_signal",
    "sanctions.view",
    "sanctions.manage",
  ],
  mlro: ["partners.manage_cases", "partners.manage_compliance_cases", "partners.submit_sar"],
  technical_integrations: ["partners.manage_integrations"],
  // Platform Administrator and Super Admin (CEO) see everything — the top of the 6 fixed roles.
  platform_administrator: PLATFORM_ADMIN_PERMISSIONS,
  partner_super_admin: PLATFORM_ADMIN_PERMISSIONS,
};

/** Every fixed role name that grants the given permission — used to explain an access-denied page. */
export function rolesAllowedFor(permission: string): string[] {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, perms]) => perms.includes(permission))
    .map(([role]) => role);
}

export function roleLabel(roleName: string, lang: "en" | "fr"): string {
  return ROLE_LABELS[roleName]?.[lang] ?? roleName;
}
