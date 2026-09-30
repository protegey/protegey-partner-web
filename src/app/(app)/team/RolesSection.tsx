"use client";

import { useLang } from "@/lib/i18n/LangProvider";
import type { PartnerRole } from "./actions";

/**
 * Read-only listing of the 6 fixed partner roles (see `protegey_role_access_matrix.pdf`) — the
 * role catalogue is closed, so there is no more "create/edit/delete role" here, only what each
 * role can see and do.
 */
export function RolesSection({ roles }: { roles: PartnerRole[] }) {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{t("rolesSectionTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("rolesSectionSubtitle")}</p>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">{t("rolesColName")}</th>
              <th className="px-4 py-2.5 font-medium">{t("rolesColPermissions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-4 py-2.5">
                  <p className="text-foreground">{role.displayName}</p>
                  {role.description ? <p className="text-xs text-muted-foreground">{role.description}</p> : null}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{role.permissions.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
