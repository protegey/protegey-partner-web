"use client";

import { logoutAction } from "@/lib/auth-actions";

export function SignOutButton({ className }: { className?: string }) {
  function handleClick() {
    if (window.confirm("Are you sure you want to sign out?")) {
      logoutAction();
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      Sign out
    </button>
  );
}
