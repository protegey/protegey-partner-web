"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLang();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t("resetPasswordSubmitting") : t("resetPasswordSubmitButton")}
    </button>
  );
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { t } = useLang();
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  if (!token) {
    return (
      <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {t("resetPasswordInvalidLink")}
      </p>
    );
  }

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-foreground">{t("resetPasswordSuccessMessage")}</p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          {t("resetPasswordGoToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {t("resetPasswordNewPasswordLabel")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("resetPasswordNewPasswordPlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          {t("resetPasswordConfirmLabel")}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("resetPasswordConfirmPlaceholder")}
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
