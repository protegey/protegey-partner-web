"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useLang } from "@/lib/i18n/LangProvider";
import { setupAction, type SetupState } from "./actions";
import type { StringKey } from "@/lib/i18n/strings";
import { CountrySelect } from "@/components/CountrySelect";
import { FieldHint } from "@/components/FieldHint";

const initialState: SetupState = {};

function FieldLabel({ htmlFor, hint, children }: { htmlFor?: string; hint: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      {children}
      <FieldHint text={hint} />
    </label>
  );
}

const ORG_TYPES: { value: string; labelKey: StringKey }[] = [
  { value: "bank", labelKey: "setupOrgTypeBank" },
  { value: "fintech", labelKey: "setupOrgTypeFintech" },
  { value: "telco", labelKey: "setupOrgTypeTelco" },
  { value: "regulator", labelKey: "setupOrgTypeRegulator" },
  { value: "other", labelKey: "setupOrgTypeOther" },
];

const inputClassName =
  "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

const STEPS = ["organization", "logo", "admin", "mail", "ai"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABEL_KEYS: Record<Step, StringKey> = {
  organization: "setupOrganizationSectionHeading",
  logo: "setupStepLogoTitle",
  admin: "setupAdminSectionHeading",
  mail: "setupStepMailTitle",
  ai: "setupStepAiTitle",
};

const OPTIONAL_STEPS = new Set<Step>(["logo", "mail", "ai"]);

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLang();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t("setupSubmitting") : t("setupSubmitButton")}
    </button>
  );
}

export function SetupForm() {
  const { t, lang } = useLang();
  const [state, formAction] = useActionState(setupAction, initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [country, setCountry] = useState("");
  const [countryError, setCountryError] = useState(false);
  const [hasLogoFile, setHasLogoFile] = useState(false);
  const [hasMailInput, setHasMailInput] = useState(false);
  const [hasAiInput, setHasAiInput] = useState(false);
  const [partnerPortalUrl, setPartnerPortalUrl] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Pre-filled with wherever this page is actually being loaded from — correct in the vast
  // majority of cases, since this wizard is itself served from the partner portal's own public
  // URL. Still fully editable: a reverse proxy that exposes a different public domain than the
  // one used to reach this page internally is the one case where it needs to be changed. Has to
  // be an effect, not a lazy useState initializer: this is server-rendered first (no `window`
  // there), so the value is only knowable once mounted in the browser.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPartnerPortalUrl(window.location.origin);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  // An optional step only reads as "skippable" while it's actually empty — once the user has
  // provided something for it (a logo file chosen, a key typed in), the button must say "Next",
  // not "Skip this step": clicking a button literally labeled "skip" after providing something is
  // a reasonable thing to distrust, and it shouldn't be the only way forward once there's
  // something to carry along.
  const STEP_HAS_CONTENT: Partial<Record<Step, boolean>> = { logo: hasLogoFile, mail: hasMailInput, ai: hasAiInput };
  const currentStepIsSkippable = OPTIONAL_STEPS.has(step) && !STEP_HAS_CONTENT[step];

  /** Only the CURRENT step's inputs are checked — fields on steps not yet reached stay out of
   * the way, even though every field lives in this same single <form> (one submit, at the very
   * end, is what setupAction expects). A field on a `hidden` step is automatically excluded from
   * the browser's own constraint validation, so hopping between steps never blocks on a
   * not-yet-visible required field — only on the one the user is actually looking at. Country
   * is checked separately: CountrySelect isn't a native input (its FormData value rides on a
   * hidden input, which browsers never validate), so it needs its own manual required check. */
  function goToStep(nextIndex: number) {
    if (nextIndex > stepIndex) {
      if (step === "organization" && !country) {
        setCountryError(true);
        return;
      }
      const current = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
      const inputs = current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select") ?? [];
      for (const input of inputs) {
        if (!input.reportValidity()) return;
      }
    }
    setStepIndex(nextIndex);
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 ? (
              <div className={`h-0.5 flex-1 ${i < stepIndex ? "bg-primary" : "bg-muted"}`} />
            ) : null}
          </div>
        ))}
      </div>
      <div className="-mt-3 text-center text-xs text-muted-foreground">
        {t("setupStepIndicator")
          .replace("{current}", String(stepIndex + 1))
          .replace("{total}", String(STEPS.length))}
        {" — "}
        {t(STEP_LABEL_KEYS[step])}
        {OPTIONAL_STEPS.has(step) ? ` (${t("setupOptionalBadge")})` : ""}
      </div>

      <div data-step="organization" hidden={step !== "organization"} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="organizationName" hint={t("setupOrganizationNameHint")}>
            {t("setupOrganizationNameLabel")}
          </FieldLabel>
          <input
            id="organizationName"
            name="organizationName"
            type="text"
            required
            minLength={2}
            className={inputClassName}
            placeholder={t("setupOrganizationNamePlaceholder")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="organizationType" hint={t("setupOrganizationTypeHint")}>
              {t("setupOrganizationTypeLabel")}
            </FieldLabel>
            <select id="organizationType" name="organizationType" required defaultValue="bank" className={inputClassName}>
              {ORG_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel hint={t("setupCountryHint")}>{t("setupCountryLabel")}</FieldLabel>
            <CountrySelect
              value={country}
              lang={lang}
              placeholder={t("setupCountryPlaceholder")}
              onChange={(code) => {
                setCountry(code);
                setCountryError(false);
              }}
            />
            <input type="hidden" name="country" value={country} />
            {countryError ? <p className="text-xs text-destructive">{t("setupCountryRequiredError")}</p> : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="partnerPortalUrl" hint={t("setupPortalUrlHint")}>
            {t("setupPortalUrlLabel")}
          </FieldLabel>
          <input
            id="partnerPortalUrl"
            name="partnerPortalUrl"
            type="url"
            required
            value={partnerPortalUrl}
            onChange={(e) => setPartnerPortalUrl(e.target.value)}
            className={inputClassName}
            placeholder="https://partner.votre-banque.com"
          />
          <p className="text-xs text-muted-foreground">{t("setupPortalUrlHint")}</p>
        </div>
      </div>

      <div data-step="logo" hidden={step !== "logo"} className="flex flex-col gap-1.5">
        <p className="mb-2 text-xs text-muted-foreground">{t("setupOrganizationLogoHint")}</p>
        <FieldLabel htmlFor="logo" hint={t("setupOrganizationLogoHint")}>
          {t("setupOrganizationLogoLabel")}
        </FieldLabel>
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg"
          className={inputClassName}
          onChange={(e) => setHasLogoFile((e.target.files?.length ?? 0) > 0)}
        />
      </div>

      <div data-step="admin" hidden={step !== "admin"} className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">{t("setupAdminSectionSubtitle")}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="adminFirstName" hint={t("setupAdminFirstNameHint")}>
              {t("setupAdminFirstNameLabel")}
            </FieldLabel>
            <input id="adminFirstName" name="adminFirstName" type="text" required className={inputClassName} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="adminLastName" hint={t("setupAdminLastNameHint")}>
              {t("setupAdminLastNameLabel")}
            </FieldLabel>
            <input id="adminLastName" name="adminLastName" type="text" required className={inputClassName} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="adminEmail" hint={t("setupAdminEmailHint")}>
            {t("setupAdminEmailLabel")}
          </FieldLabel>
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            autoComplete="email"
            required
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="adminPassword" hint={t("setupAdminPasswordHint")}>
            {t("setupAdminPasswordLabel")}
          </FieldLabel>
          <input
            id="adminPassword"
            name="adminPassword"
            type="password"
            autoComplete="new-password"
            data-1p-ignore
            data-lpignore="true"
            minLength={10}
            required
            className={inputClassName}
            placeholder={t("setupAdminPasswordPlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="adminPasswordConfirm" hint={t("setupAdminPasswordConfirmHint")}>
            {t("setupAdminPasswordConfirmLabel")}
          </FieldLabel>
          <input
            id="adminPasswordConfirm"
            name="adminPasswordConfirm"
            type="password"
            autoComplete="new-password"
            data-1p-ignore
            data-lpignore="true"
            minLength={10}
            required
            className={inputClassName}
            placeholder={t("setupAdminPasswordConfirmPlaceholder")}
          />
        </div>
      </div>

      <div data-step="mail" hidden={step !== "mail"} className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">{t("setupMailSectionSubtitle")}</p>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="resendApiKey" hint={t("setupResendApiKeyHint")}>
            {t("setupResendApiKeyLabel")}
          </FieldLabel>
          <input
            id="resendApiKey"
            name="resendApiKey"
            type="password"
            autoComplete="off"
            className={inputClassName}
            placeholder="re_..."
            onChange={(e) => setHasMailInput(Boolean(e.target.value) || hasMailInput)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="mailFromAddress" hint={t("setupMailFromAddressHint")}>
              {t("setupMailFromAddressLabel")}
            </FieldLabel>
            <input
              id="mailFromAddress"
              name="mailFromAddress"
              type="email"
              className={inputClassName}
              placeholder="noreply@votre-banque.com"
              onChange={(e) => setHasMailInput(Boolean(e.target.value) || hasMailInput)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="mailFromName" hint={t("setupMailFromNameHint")}>
              {t("setupMailFromNameLabel")}
            </FieldLabel>
            <input
              id="mailFromName"
              name="mailFromName"
              type="text"
              className={inputClassName}
              onChange={(e) => setHasMailInput(Boolean(e.target.value) || hasMailInput)}
            />
          </div>
        </div>
      </div>

      <div data-step="ai" hidden={step !== "ai"} className="flex flex-col gap-1.5">
        <p className="mb-2 text-xs text-muted-foreground">{t("setupAiSectionSubtitle")}</p>
        <FieldLabel htmlFor="deepseekApiKey" hint={t("setupDeepseekApiKeyHint")}>
          {t("setupDeepseekApiKeyLabel")}
        </FieldLabel>
        <input
          id="deepseekApiKey"
          name="deepseekApiKey"
          type="password"
          autoComplete="off"
          className={inputClassName}
          placeholder="sk-..."
          onChange={(e) => setHasAiInput(Boolean(e.target.value))}
        />
      </div>

      {state.error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <button
          type="button"
          onClick={() => goToStep(stepIndex - 1)}
          disabled={stepIndex === 0}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("setupPreviousButton")}
        </button>

        <div className="flex items-center gap-2">
          {isLastStep ? (
            <SubmitButton />
          ) : (
            <button
              type="button"
              onClick={() => goToStep(stepIndex + 1)}
              className={
                currentStepIsSkippable
                  ? "rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  : "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              }
            >
              {currentStepIsSkippable ? t("setupSkipStepButton") : t("setupNextButton")}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
