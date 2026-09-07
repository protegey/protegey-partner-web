"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { OrganizationLogo } from "@/components/OrganizationLogo";
import { LanguageToggle } from "./LanguageToggle";
import { CountrySelect } from "./CountrySelect";
import { SuccessIllustration } from "./SuccessIllustration";
import { t, type Lang } from "./i18n";
import {
  saveDraftAction,
  submitApplicationAction,
  uploadApplicationDocumentAction,
  type ClientApplicationView,
} from "./actions";
import type {
  BusinessDescriptionSection,
  ClientBusinessOwner,
  DisclosuresSection,
  GeneralInfoSection,
  PaymentServicesSection,
  YesNoAnswer,
} from "../(app)/clients/actions";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

const STEP_KEYS = ["generalInfo", "businessDescription", "paymentServices", "disclosures", "document"] as const;
type StepKey = (typeof STEP_KEYS)[number];

function TextField({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  /** Defaults to the label itself — every field should have a placeholder hint. */
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {textarea ? (
        <textarea rows={2} value={value} placeholder={placeholder ?? label} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      ) : (
        <input type="text" value={value} placeholder={placeholder ?? label} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
  lang,
}: {
  label: string;
  value: YesNoAnswer | null | undefined;
  onChange: (value: YesNoAnswer) => void;
  lang: Lang;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input type="radio" checked={value?.answer === true} onChange={() => onChange({ answer: true, details: value?.details ?? "" })} />
          {t(lang, "yes")}
        </label>
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input type="radio" checked={value?.answer === false} onChange={() => onChange({ answer: false, details: null })} />
          {t(lang, "no")}
        </label>
      </div>
      {value?.answer ? (
        <input
          type="text"
          placeholder={t(lang, "detailsIfYes")}
          value={value?.details ?? ""}
          onChange={(e) => onChange({ answer: true, details: e.target.value })}
          className={`${inputClass} mt-2`}
        />
      ) : null}
    </div>
  );
}

function StepIndicator({ lang, stepIndex }: { lang: Lang; stepIndex: number }) {
  const labels: string[] = [
    t(lang, "sectionGeneralInfo"),
    t(lang, "sectionBusinessDescription"),
    t(lang, "sectionPaymentServices"),
    t(lang, "sectionDisclosures"),
    t(lang, "sectionDocument"),
  ];
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {labels.map((label, index) => (
        <div key={label} className="flex items-center gap-1.5">
          <div
            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
              index < stepIndex
                ? "bg-primary text-primary-foreground"
                : index === stepIndex
                  ? "border-2 border-primary text-primary"
                  : "border border-border text-muted-foreground"
            }`}
          >
            {index < stepIndex ? <Check className="size-3.5" /> : index + 1}
          </div>
          <span className={`hidden text-xs whitespace-nowrap sm:inline ${index === stepIndex ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {label}
          </span>
          {index < labels.length - 1 ? <div className="h-px w-4 shrink-0 bg-border sm:w-8" /> : null}
        </div>
      ))}
    </div>
  );
}

export function ClientApplicationForm({ token, initial }: { token: string; initial: ClientApplicationView }) {
  const [lang, setLang] = useState<Lang>(initial.language ?? "en");
  const [generalInfo, setGeneralInfo] = useState<GeneralInfoSection>(initial.generalInfo ?? {});
  const [businessDescription, setBusinessDescription] = useState<BusinessDescriptionSection>(initial.businessDescription ?? {});
  const [paymentServices, setPaymentServices] = useState<PaymentServicesSection>(initial.paymentServices ?? {});
  const [disclosures, setDisclosures] = useState<DisclosuresSection>(initial.disclosures ?? {});
  const [document, setDocument] = useState(initial.document);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [status, setStatus] = useState(initial.status);

  const editable = status === "pending" || status === "more_info_required";
  const stepKey: StepKey = STEP_KEYS[stepIndex];
  const isLastStep = stepIndex === STEP_KEYS.length - 1;

  function updateOwner(index: number, patch: Partial<ClientBusinessOwner>) {
    const owners = [...(generalInfo.owners ?? [])];
    owners[index] = { ...owners[index], ...patch };
    setGeneralInfo({ ...generalInfo, owners });
  }

  function addOwner() {
    setGeneralInfo({ ...generalInfo, owners: [...(generalInfo.owners ?? []), { name: "" }] });
  }

  function removeOwner(index: number) {
    setGeneralInfo({ ...generalInfo, owners: (generalInfo.owners ?? []).filter((_, i) => i !== index) });
  }

  function toggleService(service: string) {
    const current = paymentServices.servicesOffered ?? [];
    const next = current.includes(service) ? current.filter((s) => s !== service) : [...current, service];
    setPaymentServices({ ...paymentServices, servicesOffered: next });
  }

  function isStepValid(key: StepKey): boolean {
    switch (key) {
      case "generalInfo":
        return Boolean(generalInfo.legalName?.trim() && generalInfo.tradingAddress?.trim() && generalInfo.legalStatus?.trim() && generalInfo.contactPerson?.trim());
      case "businessDescription":
        return Boolean(
          businessDescription.countriesOfOperation?.trim() && businessDescription.primaryBusinessFocus?.trim() && businessDescription.mainRevenueActivity?.trim(),
        );
      case "paymentServices":
        return Boolean(paymentServices.focusType && (paymentServices.servicesOffered?.length ?? 0) > 0);
      case "disclosures":
        return [
          disclosures.licenseDeniedSuspendedRevoked,
          disclosures.bankruptcy,
          disclosures.criminalConviction,
          disclosures.amlCivilOrCriminalProceedings,
        ].every((answer) => answer != null);
      case "document":
        return Boolean(document);
    }
  }

  async function persistDraft(): Promise<boolean> {
    setAutoSaving(true);
    const result = await saveDraftAction(token, { generalInfo, businessDescription, paymentServices, disclosures, language: lang });
    setAutoSaving(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return false;
    }
    return true;
  }

  async function handleNext() {
    if (!isStepValid(stepKey)) {
      setStepError(stepKey === "document" ? t(lang, "documentRequiredError") : t(lang, "validationError"));
      return;
    }
    setStepError(null);
    setMessage(null);
    const saved = await persistDraft();
    if (!saved) return;
    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1));
  }

  function handleBack() {
    setStepError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSaveAndExit() {
    setMessage(null);
    const saved = await persistDraft();
    if (saved) {
      setMessage({ type: "success", text: t(lang, "saved") });
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    setStepError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadApplicationDocumentAction(token, formData);
    setUploading(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setDocument({ fileName: file.name, mimeType: file.type });
    }
  }

  async function handleSubmit() {
    if (!isStepValid("document")) {
      setStepError(t(lang, "documentRequiredError"));
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const saved = await persistDraft();
    if (!saved) {
      setSubmitting(false);
      return;
    }
    const result = await submitApplicationAction(token);
    setSubmitting(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setStatus("submitted");
  }

  const header = (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <OrganizationLogo
          logoUrl={initial.hasPartnerLogo ? `/api/client-application-partner-logo/${token}` : null}
          name={initial.partnerName}
          size={36}
        />
        <p className="text-lg font-bold text-foreground">{initial.partnerName}</p>
      </div>
      <LanguageToggle lang={lang} onChange={setLang} />
    </div>
  );

  if (status === "submitted" || status === "approved" || status === "rejected") {
    const subheading =
      status === "approved" ? t(lang, "subheadingApproved") : status === "rejected" ? t(lang, "subheadingRejected") : t(lang, "subheadingSubmitted");
    return (
      <div className="min-h-svh bg-background">
        {header}
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-16 text-center">
          {status === "submitted" || status === "approved" ? <SuccessIllustration className="mb-2 h-24 w-24" /> : null}
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "heading")}</h1>
          <p className="text-sm text-muted-foreground">{subheading}</p>
          {status === "rejected" && initial.rejectionReason ? (
            <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{initial.rejectionReason}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background pb-16">
      {header}
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "heading")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === "more_info_required" ? t(lang, "subheadingMoreInfo") : t(lang, "subheadingPending")}
          </p>
        </div>

        {status === "more_info_required" && initial.moreInfoNote ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700">{t(lang, "moreInfoNoteLabel")}</p>
            <p className="mt-1 text-sm text-amber-700">{initial.moreInfoNote}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t(lang, "stepLabelPrefix")} {stepIndex + 1} {t(lang, "stepLabelJoiner")} {STEP_KEYS.length}
          </p>
          <StepIndicator lang={lang} stepIndex={stepIndex} />
        </div>

        {stepKey === "generalInfo" ? (
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">{t(lang, "sectionGeneralInfo")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label={t(lang, "legalName")} value={generalInfo.legalName ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, legalName: v })} />
              <TextField label={t(lang, "tradingName")} value={generalInfo.tradingName ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, tradingName: v })} />
              <div>
                <label className={labelClass}>{t(lang, "country")}</label>
                <CountrySelect
                  lang={lang}
                  value={generalInfo.country}
                  placeholder={t(lang, "selectCountry")}
                  onChange={(code) => setGeneralInfo({ ...generalInfo, country: code })}
                />
              </div>
              <TextField label={t(lang, "tradingAddress")} value={generalInfo.tradingAddress ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, tradingAddress: v })} />
              <TextField label={t(lang, "mailingAddress")} value={generalInfo.mailingAddress ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, mailingAddress: v })} />
              <TextField label={t(lang, "legalStatus")} value={generalInfo.legalStatus ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, legalStatus: v })} />
              <div>
                <label className={labelClass}>{t(lang, "incorporationDate")}</label>
                <input
                  type="date"
                  value={generalInfo.incorporationDate ?? ""}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, incorporationDate: e.target.value })}
                  className={inputClass}
                />
              </div>
              <TextField label={t(lang, "registrationNumber")} value={generalInfo.registrationNumber ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, registrationNumber: v })} />
              <TextField
                label={t(lang, "website")}
                placeholder="https://example.com"
                value={generalInfo.website ?? ""}
                onChange={(v) => setGeneralInfo({ ...generalInfo, website: v })}
              />
              <TextField label={t(lang, "phone")} value={generalInfo.phone ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, phone: v })} />
              <TextField label={t(lang, "contactPerson")} value={generalInfo.contactPerson ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, contactPerson: v })} />
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <p className={labelClass}>{t(lang, "owners")}</p>
              <div className="flex flex-col gap-3">
                {(generalInfo.owners ?? []).map((owner, index) => (
                  <div key={index} className="grid grid-cols-1 gap-2 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
                    <input placeholder={t(lang, "ownerName")} value={owner.name} onChange={(e) => updateOwner(index, { name: e.target.value })} className={inputClass} />
                    <input placeholder={t(lang, "ownerTaxpayerNumber")} value={owner.taxpayerNumber ?? ""} onChange={(e) => updateOwner(index, { taxpayerNumber: e.target.value })} className={inputClass} />
                    <input
                      type="date"
                      aria-label={t(lang, "ownerDob")}
                      value={owner.dateOfBirthOrIncorporation ?? ""}
                      onChange={(e) => updateOwner(index, { dateOfBirthOrIncorporation: e.target.value })}
                      className={inputClass}
                    />
                    <input placeholder={t(lang, "ownerAddress")} value={owner.address ?? ""} onChange={(e) => updateOwner(index, { address: e.target.value })} className={inputClass} />
                    <input
                      type="number"
                      placeholder={t(lang, "ownerOwnershipPercent")}
                      value={owner.ownershipPercent ?? ""}
                      onChange={(e) => updateOwner(index, { ownershipPercent: e.target.value ? Number(e.target.value) : null })}
                      className={inputClass}
                    />
                    <label className="flex items-center gap-1.5 text-sm text-foreground">
                      <input type="checkbox" checked={owner.nonEuEntityOrCitizen ?? false} onChange={(e) => updateOwner(index, { nonEuEntityOrCitizen: e.target.checked })} />
                      {t(lang, "ownerNonEu")}
                    </label>
                    <button type="button" onClick={() => removeOwner(index)} className="w-fit text-xs text-destructive hover:underline">
                      {t(lang, "removeOwner")}
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOwner} className="w-fit rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                  + {t(lang, "addOwner")}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {stepKey === "businessDescription" ? (
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">{t(lang, "sectionBusinessDescription")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label={t(lang, "yearsInOperation")} value={businessDescription.yearsInOperation ?? ""} onChange={(v) => setBusinessDescription({ ...businessDescription, yearsInOperation: v })} />
              <TextField label={t(lang, "countriesOfOperation")} value={businessDescription.countriesOfOperation ?? ""} onChange={(v) => setBusinessDescription({ ...businessDescription, countriesOfOperation: v })} />
              <TextField label={t(lang, "primaryBusinessFocus")} value={businessDescription.primaryBusinessFocus ?? ""} onChange={(v) => setBusinessDescription({ ...businessDescription, primaryBusinessFocus: v })} />
              <TextField label={t(lang, "mainRevenueActivity")} value={businessDescription.mainRevenueActivity ?? ""} onChange={(v) => setBusinessDescription({ ...businessDescription, mainRevenueActivity: v })} />
              <TextField label={t(lang, "estimatedMonthlyTransactionCount")} value={businessDescription.estimatedMonthlyTransactionCount ?? ""} onChange={(v) => setBusinessDescription({ ...businessDescription, estimatedMonthlyTransactionCount: v })} />
              <TextField label={t(lang, "estimatedMonthlyTransactionValue")} value={businessDescription.estimatedMonthlyTransactionValue ?? ""} onChange={(v) => setBusinessDescription({ ...businessDescription, estimatedMonthlyTransactionValue: v })} />
            </div>
            <div className="mt-4">
              <label className={labelClass}>{t(lang, "hasShellBankRelationships")}</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input type="radio" checked={businessDescription.hasShellBankRelationships === true} onChange={() => setBusinessDescription({ ...businessDescription, hasShellBankRelationships: true })} />
                  {t(lang, "yes")}
                </label>
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input type="radio" checked={businessDescription.hasShellBankRelationships === false} onChange={() => setBusinessDescription({ ...businessDescription, hasShellBankRelationships: false, shellBankDetails: null })} />
                  {t(lang, "no")}
                </label>
              </div>
              {businessDescription.hasShellBankRelationships ? (
                <input
                  type="text"
                  placeholder={t(lang, "shellBankDetails")}
                  value={businessDescription.shellBankDetails ?? ""}
                  onChange={(e) => setBusinessDescription({ ...businessDescription, shellBankDetails: e.target.value })}
                  className={`${inputClass} mt-2`}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {stepKey === "paymentServices" ? (
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">{t(lang, "sectionPaymentServices")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label={t(lang, "yearsProvidingPaymentServices")}
                value={paymentServices.yearsProvidingPaymentServices ?? ""}
                onChange={(v) => setPaymentServices({ ...paymentServices, yearsProvidingPaymentServices: v })}
              />
              <div>
                <label className={labelClass}>{t(lang, "focusType")}</label>
                <select
                  value={paymentServices.focusType ?? ""}
                  onChange={(e) => setPaymentServices({ ...paymentServices, focusType: e.target.value as PaymentServicesSection["focusType"] })}
                  className={inputClass}
                >
                  <option value="" disabled>
                    —
                  </option>
                  <option value="primary">{t(lang, "focusPrimary")}</option>
                  <option value="convenience">{t(lang, "focusConvenience")}</option>
                  <option value="supplement">{t(lang, "focusSupplement")}</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass}>{t(lang, "servicesOffered")}</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input type="checkbox" checked={(paymentServices.servicesOffered ?? []).includes("money_remittance")} onChange={() => toggleService("money_remittance")} />
                  {t(lang, "serviceMoneyRemittance")}
                </label>
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input type="checkbox" checked={(paymentServices.servicesOffered ?? []).includes("bill_payment")} onChange={() => toggleService("bill_payment")} />
                  {t(lang, "serviceBillPayment")}
                </label>
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input type="checkbox" checked={(paymentServices.servicesOffered ?? []).includes("other")} onChange={() => toggleService("other")} />
                  {t(lang, "serviceOther")}
                </label>
              </div>
              {(paymentServices.servicesOffered ?? []).includes("other") ? (
                <input
                  type="text"
                  placeholder={t(lang, "otherServiceDetails")}
                  value={paymentServices.otherServiceDetails ?? ""}
                  onChange={(e) => setPaymentServices({ ...paymentServices, otherServiceDetails: e.target.value })}
                  className={`${inputClass} mt-2`}
                />
              ) : null}
            </div>

            <div className="mt-4">
              <label className={labelClass}>{t(lang, "usesAgents")}</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input type="radio" checked={paymentServices.usesAgents === true} onChange={() => setPaymentServices({ ...paymentServices, usesAgents: true })} />
                  {t(lang, "yes")}
                </label>
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input type="radio" checked={paymentServices.usesAgents === false} onChange={() => setPaymentServices({ ...paymentServices, usesAgents: false, totalAgents: null, agentsOutsideCountryDetails: null })} />
                  {t(lang, "no")}
                </label>
              </div>
              {paymentServices.usesAgents ? (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="number"
                    placeholder={t(lang, "totalAgents")}
                    value={paymentServices.totalAgents ?? ""}
                    onChange={(e) => setPaymentServices({ ...paymentServices, totalAgents: e.target.value ? Number(e.target.value) : null })}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder={t(lang, "agentsOutsideCountryDetails")}
                    value={paymentServices.agentsOutsideCountryDetails ?? ""}
                    onChange={(e) => setPaymentServices({ ...paymentServices, agentsOutsideCountryDetails: e.target.value })}
                    className={inputClass}
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label className={labelClass}>{t(lang, "isAffiliateOfOtherFi")}</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input type="radio" checked={paymentServices.isAffiliateOfOtherFi === true} onChange={() => setPaymentServices({ ...paymentServices, isAffiliateOfOtherFi: true })} />
                  {t(lang, "yes")}
                </label>
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input
                    type="radio"
                    checked={paymentServices.isAffiliateOfOtherFi === false}
                    onChange={() => setPaymentServices({ ...paymentServices, isAffiliateOfOtherFi: false, affiliateType: null, affiliateName: null, affiliateLicensingCountry: null })}
                  />
                  {t(lang, "no")}
                </label>
              </div>
              {paymentServices.isAffiliateOfOtherFi ? (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input placeholder={t(lang, "affiliateType")} value={paymentServices.affiliateType ?? ""} onChange={(e) => setPaymentServices({ ...paymentServices, affiliateType: e.target.value })} className={inputClass} />
                  <input placeholder={t(lang, "affiliateName")} value={paymentServices.affiliateName ?? ""} onChange={(e) => setPaymentServices({ ...paymentServices, affiliateName: e.target.value })} className={inputClass} />
                  <input placeholder={t(lang, "affiliateLicensingCountry")} value={paymentServices.affiliateLicensingCountry ?? ""} onChange={(e) => setPaymentServices({ ...paymentServices, affiliateLicensingCountry: e.target.value })} className={inputClass} />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {stepKey === "disclosures" ? (
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">{t(lang, "sectionDisclosures")}</h2>
            <div className="flex flex-col gap-4">
              <YesNoField
                lang={lang}
                label={t(lang, "licenseDeniedSuspendedRevoked")}
                value={disclosures.licenseDeniedSuspendedRevoked}
                onChange={(v) => setDisclosures({ ...disclosures, licenseDeniedSuspendedRevoked: v })}
              />
              <YesNoField lang={lang} label={t(lang, "bankruptcy")} value={disclosures.bankruptcy} onChange={(v) => setDisclosures({ ...disclosures, bankruptcy: v })} />
              <YesNoField
                lang={lang}
                label={t(lang, "criminalConviction")}
                value={disclosures.criminalConviction}
                onChange={(v) => setDisclosures({ ...disclosures, criminalConviction: v })}
              />
              <YesNoField
                lang={lang}
                label={t(lang, "amlCivilOrCriminalProceedings")}
                value={disclosures.amlCivilOrCriminalProceedings}
                onChange={(v) => setDisclosures({ ...disclosures, amlCivilOrCriminalProceedings: v })}
              />
            </div>
          </section>
        ) : null}

        {stepKey === "document" ? (
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">{t(lang, "sectionDocument")}</h2>
            <p className="mb-3 text-xs text-muted-foreground">{t(lang, "documentInstructions")}</p>
            {document ? <p className="mb-2 text-sm text-foreground">{t(lang, "documentUploaded")} {document.fileName}</p> : null}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
              className="text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted"
            />
            {uploading ? <p className="mt-2 text-xs text-muted-foreground">{t(lang, "uploading")}</p> : null}
          </section>
        ) : null}

        {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
        {message ? (
          <p className={`text-sm ${message.type === "error" ? "text-destructive" : "text-primary"}`}>{message.text}</p>
        ) : null}

        {editable ? (
          <div className="flex items-center justify-between gap-2">
            <div>
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={autoSaving || submitting}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {t(lang, "back")}
                </button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveAndExit}
                disabled={autoSaving || submitting}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                {autoSaving ? t(lang, "saving") : t(lang, "saveAndExit")}
              </button>
              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={autoSaving || submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? t(lang, "submitting") : t(lang, "submit")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={autoSaving || submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {autoSaving ? t(lang, "saving") : t(lang, "next")}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
