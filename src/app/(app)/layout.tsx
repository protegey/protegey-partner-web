import { LayoutDashboard, FileText } from "lucide-react";
import { Sidebar, type NavItem } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";
import { apiFetch, ApiError } from "@/lib/api";

async function isPartnerActive(): Promise<boolean> {
  try {
    const partner = await apiFetch<{ status: string }>("/partners/me");
    return partner.status === "active";
  } catch (error) {
    if (error instanceof ApiError) return false;
    throw error;
  }
}

function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
      >
        Sign out
      </button>
    </form>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, active] = await Promise.all([getSessionUser(), isPartnerActive()]);

  // While KYB verification is pending or rejected, there is nothing else to navigate to —
  // drop the sidebar entirely and show a plain top bar around the KYB submission screen.
  if (!active) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <Logo className="h-6" />
          <div className="flex items-center gap-3">
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{user?.email}</p>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-10">{children}</main>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { href: "/documents", label: "Documents", icon: <FileText className="size-4" /> },
  ];

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar
        navItems={navItems}
        footer={
          <div className="flex flex-col gap-3">
            <p className="truncate px-1 text-xs text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action={logoutAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        }
      />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
