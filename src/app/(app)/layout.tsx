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
} from "lucide-react";
import { Sidebar, type NavItem } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { NotificationBellLink } from "@/components/NotificationBellLink";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { ActivationProgress } from "./ActivationProgress";
import { KybWelcomeModal } from "./KybWelcomeModal";
import { getSessionUser } from "@/lib/session";
import { apiFetch, ApiError } from "@/lib/api";
import { OrganizationLogo } from "@/components/OrganizationLogo";
import { SessionExpiredProvider } from "@/components/SessionExpiredProvider";
import { getLang } from "@/lib/i18n/lang";
import { t, type Lang } from "@/lib/i18n/strings";
import { getUnreadNotificationsCount } from "./notifications/actions";

interface PartnerSummary {
  name: string;
  status: string;
  logoFileName: string | null;
}

async function loadPartner(): Promise<PartnerSummary | null> {
  try {
    return await apiFetch<PartnerSummary>("/partners/me");
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

// Only "KYC" (UI-only, no backend enrollment data yet), "Applications"/"Invites" (both -> the
// Clients KYB feature), "Organization Profile" and "Team Management" have real pages today.
// Everything else here is shown for the navigation structure the product is heading towards,
// but marked disabled ("Soon") rather than faked with a redirect to a page that doesn't exist yet.
function buildNavItems(lang: Lang): NavItem[] {
  const tt = (key: Parameters<typeof t>[1]) => t(lang, key);
  return [
    { href: "/dashboard", label: tt("navDashboard"), icon: <LayoutDashboard className="size-4" /> },
    {
      label: tt("navPanGuard"),
      icon: <Fingerprint className="size-4" />,
      children: [
        { href: "/pan-guard/device-signals", label: tt("navDeviceSignals") },
        { href: "/pan-guard/behavioral-signals", label: tt("navBehavioralSignals") },
        { href: "/pan-guard/risk-profiles", label: tt("navRiskProfiles") },
        { label: tt("navSignalAnalytics"), disabled: true },
        { label: tt("navIntelligenceFeed"), disabled: true },
      ],
    },
    {
      label: tt("navPanId"),
      icon: <IdCard className="size-4" />,
      children: [
        { href: "/kyc", label: tt("navKyc") },
        { href: "/clients", label: tt("navKyb") },
      ],
    },
    {
      label: tt("navPanRisk"),
      icon: <ShieldCheck className="size-4" />,
      children: [
        { href: "/sanctions", label: tt("navSanctionsList") },
        { href: "/alert-rules#pan-studio", label: tt("navPanStudio") },
        { label: tt("navComplianceDashboard"), disabled: true },
        { label: tt("navComplianceRules"), disabled: true },
        { label: tt("navPepControl"), disabled: true },
        { label: tt("navAmlSurveillance"), disabled: true },
        { label: tt("navSarStr"), disabled: true },
        { label: tt("navRegulatoryReports"), disabled: true },
        { label: tt("navComplianceCalendar"), disabled: true },
      ],
    },
    {
      label: tt("navPanMonitor"),
      icon: <Activity className="size-4" />,
      children: [
        { href: "/transactions", label: tt("navTransactions") },
        { href: "/transactions/analytics", label: tt("navTransactionAnalytics") },
        { href: "/alerts", label: tt("navAlerts") },
        { href: "/alert-rules", label: tt("navAlertRules") },
        { label: tt("navCases"), disabled: true },
        { label: tt("navAdvisories"), disabled: true },
      ],
    },
    {
      label: tt("navPartnerIntegrations"),
      icon: <KeyRound className="size-4" />,
      children: [
        { label: tt("navApiKeys"), href: "/settings/api-keys" },
        { label: tt("navWebhooks"), href: "/settings/webhooks" },
        { label: tt("navIntegrationGuide"), href: "/integration-guide" },
        { label: tt("navIntegrationHealth"), disabled: true },
        { label: tt("navDocumentation"), href: "/documentation" },
      ],
    },
    {
      label: tt("navPlatformAdministration"),
      icon: <SettingsIcon className="size-4" />,
      children: [
        { href: "/settings/profile", label: tt("navOrganizationProfile") },
        { href: "/settings/billing", label: tt("navBillingPlans") },
        { href: "/settings/usage", label: tt("navUsageQuotas") },
        { href: "/team", label: tt("navTeamManagement") },
        { href: "/settings/security", label: tt("navSecurity") },
        { href: "/audit-logs", label: tt("navAuditLogs") },
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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, partner, lang, unreadCount] = await Promise.all([
    getSessionUser(),
    loadPartner(),
    getLang(),
    getUnreadNotificationsCount(),
  ]);
  const active = partner?.status === "active";

  return (
    <SessionExpiredProvider>
      <div className="flex h-svh bg-background">
        <Sidebar
          navItems={buildNavItems(lang)}
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
                <div className="flex items-center gap-2">
                  <NotificationBellLink unreadCount={unreadCount} ariaLabel={t(lang, "notificationsBellAria")} />
                  <ThemeToggle />
                  <LangToggle />
                  <SignOutButton className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted" />
                </div>
              </div>
            </div>
          }
        />
        <main className="relative flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </SessionExpiredProvider>
  );
}