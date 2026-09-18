"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useLang } from "@/lib/i18n/LangProvider";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLang();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t("sessionExpiredSigningIn") : t("sessionExpiredSignIn")}
    </button>
  );
}

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const { t } = useLang();
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {t("loginEmailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("loginEmailPlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {t("loginPasswordLabel")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
