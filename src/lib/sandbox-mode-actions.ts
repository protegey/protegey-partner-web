"use server";

import { cookies } from "next/headers";
import { SANDBOX_MODE_COOKIE } from "./sandbox-mode";

export async function setSandboxModeAction(enabled: boolean): Promise<void> {
  const store = await cookies();
  store.set(SANDBOX_MODE_COOKIE, String(enabled), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
