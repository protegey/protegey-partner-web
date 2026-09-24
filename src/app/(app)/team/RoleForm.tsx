"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PermissionCheckboxGroup } from "@/components/PermissionCheckboxGroup";
import { useLang } from "@/lib/i18n/LangProvider";
import { createRoleAction, updateRoleAction, type PermissionOption, type PartnerRole, type RoleFormState } from "./actions";

const initialState: RoleFormState = {};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  const { t } = useLang();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t("rolesSaving") : isEdit ? t("rolesSaveChangesButton") : t("rolesCreateButton")}
    </button>
  );
}

export function RoleForm({
  permissions,
  existingRole,
  onSuccess,
}: {
  permissions: PermissionOption[];
  existingRole?: PartnerRole;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { t } = useLang();
  const action = existingRole ? updateRoleAction.bind(null, existingRole.id) : createRoleAction;
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(existingRole ? t("roleUpdatedToast") : t("roleCreatedToast"));
      formRef.current?.reset();
      router.refresh();
      const timeout = setTimeout(() => onSuccess?.(), 1000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <input
          name="displayName"
          type="text"
          placeholder={t("rolesNamePlaceholder")}
          defaultValue={existingRole?.displayName}
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <textarea
          name="description"
          placeholder={t("rolesDescriptionPlaceholder")}
          defaultValue={existingRole?.description ?? ""}
          rows={2}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("rolesPermissionsLabel")}</p>
        <PermissionCheckboxGroup
          permissions={permissions}
          defaultSelectedIds={existingRole?.permissions.map((permission) => permission.id) ?? []}
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-primary">{t("rolesSavedSuccess")}</p> : null}

      <div className="flex justify-end">
        <SubmitButton isEdit={Boolean(existingRole)} />
      </div>
    </form>
  );
}
