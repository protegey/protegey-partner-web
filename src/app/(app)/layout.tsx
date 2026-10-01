import Link from "next/link";
import {
  LayoutDashboard,
  Fingerprint,
  IdCard,
  Activity,
  KeyRound,
  ShieldCheck,
  Settings as SettingsIcon,
  MoreHorizontal,
  Package,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Sidebar, type NavItem, type NavChild } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { NotificationBellLink } from "@/components/NotificationBellLink";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { ActivationProgress } from "./ActivationProgress";
import { KybWelcomeModal } from "./KybWelcomeModal";
import { OnboardingTour } from "./OnboardingTour";
import { PageTransitionOverlay } from "@/components/PageTransitionOverlay";
import { NetworkStatusToast } from "@/components/NetworkStatusToast";
import { getSessionUser, type SessionUser } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { OrganizationLogo } from "@/components/OrganizationLogo";
import { SessionExpiredProvider } from "@/components/SessionExpiredProvider";
import { getLang } from "@/lib/i18n/lang";
import { t, type Lang } from "@/lib/i18n/strings";
import { RefreshButton } from "@/components/RefreshButton";
import { RouteFadeIn } from "@/components/RouteFadeIn";

interface PartnerSummary {
  name: string;
  status: string;
  logoFileName: string | null;
  suspensionReason: string | null;
}

async function loadPartner(): Promise<PartnerSummary | null> {
  try {
    return await apiFetch<PartnerSummary>("/partners/me");
  } catch {
    // Any failure here (a structured 4xx/5xx, or the backend being unreachable entirely — a raw
    // network TypeError, not an ApiError) must never take down the whole authenticated shell:
    // every page renders under this layout, so a crash here breaks every page, not just this banner.
    return null;
  }
}

async function loadHasContract(): Promise<boolean> {
  try {
    const contract = await apiFetch<unknown | null>("/partners/me/contract");
    return contract !== null;
  } catch {
    return true; // Fail open on the banner — never block rendering over this check, for the same reason as loadPartner above.
  }
}

type RequiredPermission = string | string[];
type NavChildDef = NavChild & { requiredPermission?: RequiredPermission };
type NavItemDef = Omit<NavItem, "children"> & { requiredPermission?: RequiredPermission; children?: NavChildDef[] };

// Only "KYC" (UI-only, no backend enrollment data yet), "Applications"/"Invites" (both -> the
// Clients KYB feature), "Organization Profile" and "Team Management" have real pages today.
// Everything else here is shown for the navigation structure the product is heading towards,
// but marked disabled ("Soon") rather than faked with a redirect to a page that doesn't exist yet.
//
// `requiredPermission` mirrors the fixed 12-role access matrix (protegey_role_access_matrix.pdf
// v2) — an item/group with no `requiredPermission` is visible to every signed-in partner user. An
// array means "any of these" — used for pages split into a view/manage permission pair so a
// read-only role (Tuning/Risk Data Analyst, QA/Quality Control) still sees the page in nav.
function buildNavItemDefs(lang: Lang): NavItemDef[] {
  const tt = (key: Parameters<typeof t>[1]) => t(lang, key);
  return [
    { href: "/dashboard", label: tt("navDashboard"), icon: <LayoutDashboard className="size-4" /> },
    {
      label: tt("navIntelligence"),
      icon: <Fingerprint className="size-4" />,
      children: [
        { href: "/pan-guard/device-signals", label: tt("navDeviceSignals"), requiredPermission: "partners.view_transactions" },
        { href: "/pan-guard/behavioral-signals", label: tt("navBehavioralSignals"), requiredPermission: "partners.view_transactions" },
        { href: "/pan-guard/risk-profiles", label: tt("navRiskProfiles"), requiredPermission: "partners.view_transactions" },
        // Temporarily hidden — not built yet. Uncomment when ready to ship these as real pages.
        // { label: tt("navSignalAnalytics"), disabled: true },
        // { label: tt("navIntelligenceFeed"), disabled: true },
      ],
    },
    {
      label: tt("navPanId"),
      icon: <IdCard className="size-4" />,
      children: [
        { href: "/kyc", label: tt("navKyc"), requiredPermission: "partners.manage_kyc" },
        { href: "/clients", label: tt("navKyb"), requiredPermission: "partners.manage_clients" },
      ],
    },
    {
      label: tt("navPanRisk"),
      icon: <ShieldCheck className="size-4" />,
      children: [
        { href: "/sanctions", label: tt("navSanctionsList"), requiredPermission: "sanctions.view" },
        { href: "/sanctions/search", label: tt("sanctionsSearchToolLink"), requiredPermission: "sanctions.view" },
        { href: "/screening-provider", label: tt("navScreeningProvider"), requiredPermission: "sanctions.view" },
        { href: "/pan-risk/shared-signal-network", label: tt("navSharedSignalNetwork"), requiredPermission: "partners.share_fraud_signal" },
        { href: "/pep", label: tt("navPepControl"), requiredPermission: "sanctions.view" },
        { href: "/edd", label: tt("navEdd"), requiredPermission: "sanctions.view" },
        { href: "/sar-str", label: tt("navSarStr"), requiredPermission: ["partners.manage_compliance_cases", "partners.view_compliance_cases"] },
        { href: "/ctr", label: tt("navCtr"), requiredPermission: "partners.manage_compliance_cases" },
      ],
    },
    {
      label: tt("navPanMonitor"),
      icon: <Activity className="size-4" />,
      children: [
        { href: "/transactions", label: tt("navTransactions"), requiredPermission: "partners.view_transactions" },
        { href: "/transactions/analytics", label: tt("navTransactionAnalytics"), requiredPermission: "partners.view_transactions" },
        { href: "/alerts", label: tt("navAlerts"), requiredPermission: ["partners.manage_alerts", "partners.view_alerts"] },
        { href: "/cases", label: tt("navCases"), requiredPermission: ["partners.manage_cases", "partners.view_cases"] },
      ],
    },
    { href: "/alert-rules", label: tt("navAlertRules"), icon: <SlidersHorizontal className="size-4" />, requiredPermission: ["partners.manage_alert_rules", "partners.view_alert_rules"] },
    {
      label: tt("navPartnerIntegrations"),
      icon: <KeyRound className="size-4" />,
      requiredPermission: "partners.manage_integrations",
      children: [
        { label: tt("navApiKeys"), href: "/settings/api-keys" },
        { label: tt("navWebhooks"), href: "/settings/webhooks" },
        { label: tt("navIntegrationGuide"), href: "/integration-guide" },
        { href: "/integration-health", label: tt("navIntegrationHealth") },
        { label: tt("navDocumentation"), href: "/documentation" },
      ],
    },
    {
      label: tt("navSdks"),
      icon: <Package className="size-4" />,
      requiredPermission: "partners.manage_integrations",
      children: [
        { label: tt("navSdkJs"), href: "/sdks/js" },
        { label: tt("navSdkFlutter"), href: "/sdks/flutter" },
      ],
    },
    {
      label: tt("navPlatformAdministration"),
      icon: <SettingsIcon className="size-4" />,
      children: [
        { href: "/settings/profile", label: tt("navOrganizationProfile"), requiredPermission: "partners.manage_organization" },
        { href: "/settings/billing", label: tt("navBillingPlans"), requiredPermission: "partners.manage_billing" },
        { href: "/settings/usage", label: tt("navUsageQuotas"), requiredPermission: "partners.manage_billing" },
        { href: "/team", label: tt("navTeamManagement"), requiredPermission: "partners.manage_team" },
        // Every signed-in user can change their own password here regardless of role — this is
        // personal account security, not an org-wide setting, so it's never permission-gated
        // (matches the backend's `PATCH /auth/me/password`, which has no permission guard).
        { href: "/settings/security", label: tt("navSecurity") },
        { href: "/audit-logs", label: tt("navAuditLogs"), requiredPermission: "partners.view_audit_logs" },
      ],
    },
    {
      label: tt("navOthers"),
      icon: <MoreHorizontal className="size-4" />,
      children: [
        { href: "/notifications", label: tt("navNotifications") },
        { href: "/support", label: tt("navSupport") },
      ],
    },
  ];
}

/** Filters the nav tree down to what `permissions` allows — an item/group with no
 * `requiredPermission` stays visible to everyone; a group is dropped once every child of it is. */
function filterNavItems(items: NavItemDef[], permissions: string[]): NavItem[] {
  const allowed = (requiredPermission?: RequiredPermission) => {
    if (!requiredPermission) return true;
    const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    return required.some((permission) => permissions.includes(permission));
  };

  return items.reduce<NavItem[]>((acc, { requiredPermission, children, ...rest }) => {
    if (children) {
      const visibleChildren: NavChild[] = children.filter(({ requiredPermission: childPermission }) => allowed(childPermission));
      if (visibleChildren.length > 0 && allowed(requiredPermission)) {
        acc.push({ ...rest, children: visibleChildren });
      }
      return acc;
    }
    if (allowed(requiredPermission)) acc.push(rest);
    return acc;
  }, []);
}

function buildNavItems(lang: Lang, user: SessionUser | null): NavItem[] {
  return filterNavItems(buildNavItemDefs(lang), user?.permissions ?? []);
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, partner, hasContract, lang] = await Promise.all([getSessionUser(), loadPartner(), loadHasContract(), getLang()]);
  const active = partner?.status === "active";

  return (
    <SessionExpiredProvider>
      <div className="flex h-svh bg-background">
        <Sidebar
          navItems={buildNavItems(lang, user)}
          soonLabel={t(lang, "soonBadge")}
          footer={
            <div className="flex flex-col">
              <ActivationProgress status={partner?.status ?? "active"} />
              <div className="flex flex-col gap-3 pt-3">
                {partner ? (
                  <div className="flex items-center gap-2 px-1">
                    <OrganizationLogo logoUrl={partner.logoFileName ? "/api/partner-logo" : null} name={partner.name} size={28} />
                    <p className="truncate text-sm font-medium text-foreground">{partner.name}</p>
                  </div>
                ) : null}
                <p className="truncate px-1 text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          }
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-end gap-2 border-b border-border px-8 py-3">
            <NotificationBellLink ariaLabel={t(lang, "notificationsBellAria")} />
            <ThemeToggle />
            <LangToggle />
            <SignOutButton className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted" />
          </header>
          <main className="relative flex-1 overflow-y-auto px-8 py-8">
            {partner?.status === "suspended" ? (
              <div className="mb-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">{t(lang, "suspendedBannerTitle")}</p>
                  <p className="mt-1 text-sm text-destructive">{partner.suspensionReason || t(lang, "suspendedBannerFallbackReason")}</p>
                  <p className="mt-1 text-xs text-destructive/80">{t(lang, "suspendedBannerHint")}</p>
                </div>
              </div>
            ) : !hasContract ? (
              <div className="mb-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">{t(lang, "noContractBannerTitle")}</p>
                  <p className="mt-1 text-sm text-destructive">{t(lang, "noContractBannerHint")}</p>
                </div>
              </div>
            ) : null}
            <div className="mb-4 flex justify-end">
              <RefreshButton />
            </div>
            <RouteFadeIn>{children}</RouteFadeIn>
          </main>
        </div>
      </div>
      <OnboardingTour />
      <PageTransitionOverlay />
      <NetworkStatusToast />
    </SessionExpiredProvider>
  );
}
