import { Lock } from "lucide-react";
import { t, type Lang } from "@/lib/i18n/strings";
import { roleLabel, rolesAllowedForAny } from "@/lib/roles";

/** Shown in place of a page's content when the signed-in user's role doesn't grant any of the
 * permission(s) that page requires — explains *why*, not just a raw 403, per the fixed 12-role
 * access matrix (see `protegey_role_access_matrix.pdf` v2). Rendered by `requirePageAccess()`. */
export function AccessDeniedMessage({ permission, userRoles, lang }: { permission: string | string[]; userRoles: string[]; lang: Lang }) {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const allowedRoleLabels = rolesAllowedForAny(permissions).map((role) => roleLabel(role, lang));
  const currentRoleLabels = userRoles.map((role) => roleLabel(role, lang));

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <Lock className="size-5 text-destructive" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{t(lang, "accessDeniedTitle")}</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {t(lang, "accessDeniedReservedFor")} <span className="font-medium text-foreground">{allowedRoleLabels.join(", ")}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {t(lang, "accessDeniedYourRole")}{" "}
        <span className="font-medium text-foreground">{currentRoleLabels.length > 0 ? currentRoleLabels.join(", ") : t(lang, "accessDeniedNoRole")}</span>
      </p>
    </div>
  );
}
