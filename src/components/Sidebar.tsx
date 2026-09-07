"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Logo } from "./Logo";

export interface NavChild {
  href?: string;
  label: string;
  /** Not wired up to a page yet — shown for structure, but not clickable. */
  disabled?: boolean;
}

export interface NavItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  children?: NavChild[];
}

function isChildActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  const [path] = href.split("?");
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const hasActiveChild = item.children?.some((child) => isChildActive(pathname, child.href)) ?? false;
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {item.icon}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
      {open ? (
        <div className="ml-3.5 flex flex-col gap-0.5 border-l border-border pl-3.5">
          {item.children?.map((child) => {
            const active = isChildActive(pathname, child.href);
            if (child.disabled || !child.href) {
              return (
                <span
                  key={child.label}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground/50"
                >
                  {child.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Soon</span>
                </span>
              );
            }
            return (
              <Link
                key={child.label}
                href={child.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar({ navItems, footer }: { navItems: NavItem[]; footer: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
      <div className="px-4 py-5">
        <Logo className="h-6" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          if (item.children) {
            return <NavGroup key={item.label} item={item} pathname={pathname} />;
          }

          if (item.disabled || !item.href) {
            return (
              <span
                key={item.label}
                className="flex items-center justify-between gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50"
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Soon</span>
              </span>
            );
          }

          const isActive = isChildActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">{footer}</div>
    </aside>
  );
}
