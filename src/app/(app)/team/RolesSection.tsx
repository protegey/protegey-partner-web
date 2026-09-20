"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { RoleForm } from "./RoleForm";
import { deleteRoleAction, type PartnerRole, type PermissionOption } from "./actions";

function RoleActions({ role }: { role: PartnerRole }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteConfirm() {
    setPending(true);
    setError(null);
    const result = await guard(() => deleteRoleAction(role.id));
    setPending(false);
    if (!result) return;
    if (result.error) {
      setError(result.error);
      return;
    }
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label={t("rolesDeleteButton")}
      >
        <Trash2 className="size-4" />
      </button>
      <ConfirmActionDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t("rolesDeleteDialogTitle")}
        description={t("rolesDeleteDialogDescription")}
        confirmLabel={t("rolesDeleteButton")}
        pendingLabel={t("rolesDeleting")}
        pending={pending}
        variant="destructive"
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </ConfirmActionDialog>
    </div>
  );
}

function EditRoleDialogButton({ role, permissions }: { role: PartnerRole; permissions: PermissionOption[] }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t("rolesEditButton")}
      >
        <Pencil className="size-4" />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={role.displayName} description={t("rolesEditDialogDescription")}>
        <RoleForm permissions={permissions} existingRole={role} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function CreateRoleDialogButton({ permissions }: { permissions: PermissionOption[] }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <Plus className="size-4" />
        {t("rolesCreateButton")}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("rolesCreateDialogTitle")} description={t("rolesCreateDialogDescription")}>
        <RoleForm permissions={permissions} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

export function RolesSection({
  roles,
  permissions,
  canManageRoles,
}: {
  roles: PartnerRole[];
  permissions: PermissionOption[];
  canManageRoles: boolean;
}) {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("rolesSectionTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("rolesSectionSubtitle")}</p>
        </div>
        {canManageRoles ? <CreateRoleDialogButton permissions={permissions} /> : null}
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">{t("rolesColName")}</th>
              <th className="px-4 py-2.5 font-medium">{t("rolesColPermissions")}</th>
              <th className="px-4 py-2.5 font-medium">{t("rolesColType")}</th>
              {canManageRoles ? <th className="px-4 py-2.5 font-medium text-right">{t("teamColActions")}</th> : null}
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
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      role.partnerId === null ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {role.partnerId === null ? t("rolesTypeSystem") : t("rolesTypeCustom")}
                  </span>
                </td>
                {canManageRoles ? (
                  <td className="px-4 py-2.5">
                    {role.partnerId === null ? (
                      <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground">{t("rolesSystemNotEditable")}</span>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <EditRoleDialogButton role={role} permissions={permissions} />
                        <RoleActions role={role} />
                      </div>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
