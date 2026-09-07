import Link from "next/link";
import {
  LayoutDashboard,
  BrainCircuit,
  IdCard,
  Activity,
  KeyRound,
  Settings as SettingsIcon,
  MoreHorizontal,
} from "lucide-react";
import { Sidebar, type NavItem } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { ActivationProgress } from "./ActivationProgress";
import { KybWelcomeModal } from "./KybWelcomeModal";
import { getSessionUser } from "@/lib/session";
import { apiFetch, ApiError } from "@/lib/api";
import { OrganizationLogo } from "@/components/OrganizationLogo";

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

// Only "Applications", "Invites" (both -> the Clients KYB feature), "Organization Profile" and
// "Team Management" have real pages today. Everything else here is shown for the navigation
// structure the product is heading towards, but marked disabled ("Soon") rather than faked with
// a redirect to a page that doesn't exist yet.
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  {
    label: "Intelligence",
    icon: <BrainCircuit className="size-4" />,
    children: [
      { label: "Signal Logs", disabled: true },
      { label: "Signal Analytics", disabled: true },
      { label: "Entity Intelligence", disabled: true },
      { label: "Intelligence Feed", disabled: true },
    ],
  },
  {
    label: "Pan-ID™",
    icon: <IdCard className="size-4" />,
    children: [
      { label: "KYC", disabled: true },
      { href: "/clients", label: "KYB" },
    ],
  },
  {
    label: "Pan-Monitor™",
    icon: <Activity className="size-4" />,
    children: [
      { label: "Transactions", disabled: true },
      { label: "Transaction Analytics", disabled: true },
      { label: "Alerts", disabled: true },
      { label: "Alert Rules", disabled: true },
      { label: "Cases", disabled: true },
      { label: "Advisories", disabled: true },
    ],
  },
  {
    label: "Partner Integrations",
    icon: <KeyRound className="size-4" />,
    children: [
      { label: "API Keys", disabled: true },
      { label: "Integration Guide", disabled: true },
      { label: "Integration Health", disabled: true },
      { label: "Webhooks", disabled: true },
      { label: "Quota & Status", disabled: true },
      { label: "Documentation", disabled: true },
    ],
  },
  {
    label: "Platform Administration",
    icon: <SettingsIcon className="size-4" />,
    children: [
      { href: "/settings", label: "Organization Profile" },
      { label: "Billing & Plans", disabled: true },
      { label: "Usage & Quotas", disabled: true },
      { href: "/team", label: "Team Management" },
      { label: "Security", disabled: true },
      { label: "Audit Logs", disabled: true },
    ],
  },
  {
    label: "Others",
    icon: <MoreHorizontal className="size-4" />,
    children: [
      { label: "Notifications", disabled: true },
      { label: "Support", disabled: true },
      { label: "Sandbox", disabled: true },
    ],
  },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, partner] = await Promise.all([getSessionUser(), loadPartner()]);
  const active = partner?.status === "active";

  // While KYB verification is pending or rejected, there is nothing else to navigate to —
  // drop the sidebar entirely and show a plain top bar around the KYB submission screen.
  if (!active) {
    return (
      <div className="flex h-svh flex-col bg-background">
        <KybWelcomeModal />
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <Logo className="h-6" />
          <div className="flex items-center gap-3">
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{user?.email}</p>
            <Link
              href="/settings"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Settings
            </Link>
            <ThemeToggle />
            <SignOutButton className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted" />
          </div>
        </header>
        <main className="relative flex-1 overflow-y-auto px-8 py-10">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-svh bg-background">
      <Sidebar
        navItems={NAV_ITEMS}
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
                <ThemeToggle />
                <SignOutButton className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted" />
              </div>
            </div>
          </div>
        }
      />
      <main className="relative flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
