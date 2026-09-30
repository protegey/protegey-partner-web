import type { ReactNode } from "react";
import type { SessionUser } from "./session";
import type { Lang } from "./i18n/strings";
import { AccessDeniedMessage } from "@/components/AccessDeniedMessage";

/**
 * Drop this at the top of a server page to enforce the fixed-role access matrix
 * (`protegey_role_access_matrix.pdf`) at the screen level, not just on individual actions:
 *
 * ```ts
 * const denied = requirePageAccess(user, "partners.manage_billing", lang);
 * if (denied) return denied;
 * ```
 *
 * Returns `null` when the user may see the page, or a ready-to-render explanation otherwise —
 * the backend's own guard would just throw a raw 403, which is not what the user asked for here.
 */
export function requirePageAccess(user: SessionUser | null, permission: string, lang: Lang): ReactNode | null {
  if (user?.permissions.includes(permission)) return null;
  return <AccessDeniedMessage permission={permission} userRoles={user?.roles ?? []} lang={lang} />;
}
