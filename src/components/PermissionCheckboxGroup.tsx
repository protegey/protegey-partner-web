"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";

export interface SelectablePermission {
  id: string;
  displayName: string;
  description: string | null;
  group: string;
}

/** Renders every selectable permission grouped by `group`, with checkboxes and hidden inputs so a
 * plain <form> still picks up `permissionIds` via FormData — same convention as RoleMultiSelect. */
export function PermissionCheckboxGroup({
  permissions,
  defaultSelectedIds = [],
  name = "permissionIds",
}: {
  permissions: SelectablePermission[];
  defaultSelectedIds?: string[];
  name?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelectedIds));
  const { t } = useLang();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const groups = new Map<string, SelectablePermission[]>();
  for (const permission of permissions) {
    const list = groups.get(permission.group) ?? [];
    list.push(permission);
    groups.set(permission.group, list);
  }

  return (
    <div className="flex flex-col gap-4">
      {[...selected].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <p className="text-xs text-muted-foreground">
        {selected.size} {t("rolesPermissionsSelectedSuffix")}
      </p>
      <div className="flex max-h-80 flex-col gap-4 overflow-y-auto rounded-md border border-border p-3">
        {[...groups.entries()].map(([group, groupPermissions]) => (
          <div key={group} className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
            {groupPermissions.map((permission) => (
              <label
                key={permission.id}
                className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm text-foreground hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.has(permission.id)}
                  onChange={() => toggle(permission.id)}
                  className="mt-0.5 size-4 shrink-0 rounded border-border"
                />
                <span>
                  {permission.displayName}
                  {permission.description ? (
                    <span className="block text-xs text-muted-foreground">{permission.description}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
