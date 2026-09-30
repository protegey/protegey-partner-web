"use client";

import { useLang } from "@/lib/i18n/LangProvider";

export interface SelectableRole {
  id: string;
  name: string;
  displayName: string;
}

/**
 * Single-role picker for the invite/edit-invitation forms — the fixed 6-role catalogue
 * (`protegey_role_access_matrix.pdf`) maps one role per person, so there is no more multi-select
 * here. Renders a plain `<select name="roleIds">` so the existing server actions (which read
 * `roleIds` as a list via `formData.getAll`) keep working unchanged with a single value.
 */
export function RoleSelect({ roles, defaultRoleId, name = "roleIds" }: { roles: SelectableRole[]; defaultRoleId?: string; name?: string }) {
  const { t } = useLang();

  return (
    <select
      name={name}
      required
      defaultValue={defaultRoleId ?? ""}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="" disabled>
        {t("roleSelectPlaceholder")}
      </option>
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          {role.displayName}
        </option>
      ))}
    </select>
  );
}
