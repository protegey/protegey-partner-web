/**
 * Mirrors the 12 fixed partner roles and their permissions from the backend's
 * `src/database/seeds/seed-data/roles.data.ts` (see `protegey_role_access_matrix.pdf` v2). This
 * is only the closed FLOOR every partner starts with — a partner may additionally build its own
 * custom role (via `roles.manage`), which this table has no knowledge of; a custom role's access
 * is explained by the role names the signed-in user actually holds, not by this static list. Kept
 * here (cheap to keep in sync) so the frontend can explain an access-denied page without an extra
 * round trip. Update this alongside any backend role/permission change.
 */
export const ROLE_LABELS: Record<string, { en: string; fr: string }> = {
  aml_analyst: { en: "AML Analyst", fr: "Analyste AML" },
  payment_fraud_analyst: { en: "Payment Fraud Analyst", fr: "Analyste — Fraude paiement" },
  kyc_kyb_analyst: { en: "KYC/KYB Analyst", fr: "Analyste — KYC/KYB" },
  sanctions_analyst: { en: "Sanctions Analyst", fr: "Analyste sanctions" },
  tuning_risk_data_analyst: { en: "Tuning / Risk Data Analyst", fr: "Analyste données de risque" },
  qa_quality_control_analyst: { en: "QA / Quality Control Analyst", fr: "Analyste QA / Contrôle qualité" },
  head_of_compliance: { en: "Head of Compliance", fr: "Responsable conformité" },
  mlro: { en: "MLRO", fr: "MLRO" },
  regulatory_compliance_analyst: { en: "Regulatory Compliance Analyst", fr: "Analyste conformité réglementaire" },
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
  "partners.view_alert_rules",
  "partners.view_transactions",
  "partners.manage_alerts",
  "partners.view_alerts",
  "partners.manage_cases",
  "partners.view_cases",
  "partners.manage_compliance_cases",
  "partners.view_compliance_cases",
  "partners.submit_sar",
  "partners.share_fraud_signal",
  "partners.view_audit_logs",
  "sanctions.view",
  "sanctions.manage",
  "roles.view",
  "roles.manage",
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  aml_analyst: ["partners.manage_alerts", "partners.view_alerts", "partners.manage_cases", "partners.view_cases", "partners.view_transactions", "partners.view_compliance_cases"],
  payment_fraud_analyst: ["partners.view_transactions", "partners.manage_alerts", "partners.view_alerts", "partners.manage_cases", "partners.view_cases"],
  kyc_kyb_analyst: ["partners.manage_kyc", "partners.manage_clients", "partners.manage_cases", "partners.view_cases"],
  sanctions_analyst: ["sanctions.view", "partners.manage_compliance_cases", "partners.view_compliance_cases", "partners.manage_cases", "partners.view_cases"],
  tuning_risk_data_analyst: ["partners.view_alert_rules", "partners.view_transactions"],
  qa_quality_control_analyst: ["partners.view_cases", "partners.view_alerts", "partners.view_compliance_cases"],
  head_of_compliance: [
    "partners.manage_kyc",
    "partners.manage_clients",
    "partners.view_transactions",
    "partners.manage_alerts",
    "partners.view_alerts",
    "partners.manage_alert_rules",
    "partners.view_alert_rules",
    "partners.manage_cases",
    "partners.view_cases",
    "partners.manage_compliance_cases",
    "partners.view_compliance_cases",
    "partners.submit_sar",
    "partners.share_fraud_signal",
    "sanctions.view",
    "sanctions.manage",
  ],
  mlro: ["partners.manage_cases", "partners.view_cases", "partners.manage_compliance_cases", "partners.view_compliance_cases", "partners.submit_sar"],
  regulatory_compliance_analyst: ["partners.view_compliance_cases"],
  technical_integrations: ["partners.manage_integrations"],
  // Platform Administrator and Super Admin (CEO) see everything — the top of the 12 fixed roles.
  platform_administrator: PLATFORM_ADMIN_PERMISSIONS,
  partner_super_admin: PLATFORM_ADMIN_PERMISSIONS,
};

/** Every fixed role name that grants the given permission — used to explain an access-denied page. */
export function rolesAllowedFor(permission: string): string[] {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, perms]) => perms.includes(permission))
    .map(([role]) => role);
}

/** Union of fixed role names that grant ANY of the given permissions — for pages whose guard
 * accepts a view-or-manage permission pair. */
export function rolesAllowedForAny(permissions: string[]): string[] {
  const names = new Set<string>();
  for (const permission of permissions) {
    for (const role of rolesAllowedFor(permission)) names.add(role);
  }
  return [...names];
}

export function roleLabel(roleName: string, lang: "en" | "fr"): string {
  return ROLE_LABELS[roleName]?.[lang] ?? roleName;
}
