import "server-only";
import { cookies } from "next/headers";

// Not httpOnly — it's a display preference, not a credential: toggling it only changes WHICH
// already-authorized data this session sees (sandbox vs live), never what it's allowed to see.
export const SANDBOX_MODE_COOKIE = "protegey_partner_sandbox_mode";

export async function getSandboxMode(): Promise<boolean> {
  const store = await cookies();
  return store.get(SANDBOX_MODE_COOKIE)?.value === "true";
}
