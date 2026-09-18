import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "./strings";

// Not namespaced per-app like the auth cookies (ACCESS_TOKEN_COOKIE etc.) — a language
// preference isn't sensitive and there's no harm in admin-web and partner-web sharing the
// same default if a browser ever visits both, so the name stays simple.
export const LANG_COOKIE = "protegey_lang";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "fr" ? "fr" : "en";
}
