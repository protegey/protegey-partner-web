"use client";

import { useState } from "react";
import { OrganizationLogo } from "@/components/OrganizationLogo";
import { LanguageToggle } from "./LanguageToggle";
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

function TextField({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {textarea ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
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
  const answer = value?.answer ?? false;
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input type="radio" checked={answer === true} onChange={() => onChange({ answer: true, details: value?.details ?? "" })} />
          {t(lang, "yes")}
        </label>
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input type="radio" checked={answer === false} onChange={() => onChange({ answer: false, details: null })} />
          {t(lang, "no")}
        </label>
      </div>
      {answer ? (
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

export function ClientApplicationForm({ token, initial }: { token: string; initial: ClientApplicationView }) {
  const [lang, setLang] = useState<Lang>(initial.language ?? "en");
  const [generalInfo, setGeneralInfo] = useState<GeneralInfoSection>(initial.generalInfo ?? {});
  const [businessDescription, setBusinessDescription] = useState<BusinessDescriptionSection>(initial.businessDescription ?? {});
  const [paymentServices, setPaymentServices] = useState<PaymentServicesSection>(initial.paymentServices ?? {});
  const [disclosures, setDisclosures] = useState<DisclosuresSection>(initial.disclosures ?? {});
  const [document, setDocument] = useState(initial.document);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [status, setStatus] = useState(initial.status);

  const editable = status === "pending" || status === "more_info_required";

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

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveDraftAction(token, { generalInfo, businessDescription, paymentServices, disclosures, language: lang });
    setSaving(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: t(lang, "saved") });
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
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
    setSubmitting(true);
    setMessage(null);
    const saveResult = await saveDraftAction(token, { generalInfo, businessDescription, paymentServices, disclosures, language: lang });
    if (saveResult.error) {
      setSubmitting(false);
      setMessage({ type: "error", text: saveResult.error });
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

        {/* General Information */}
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">{t(lang, "sectionGeneralInfo")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label={t(lang, "legalName")} value={generalInfo.legalName ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, legalName: v })} />
            <TextField label={t(lang, "tradingName")} value={generalInfo.tradingName ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, tradingName: v })} />
            <TextField label={t(lang, "tradingAddress")} value={generalInfo.tradingAddress ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, tradingAddress: v })} />
            <TextField label={t(lang, "mailingAddress")} value={generalInfo.mailingAddress ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, mailingAddress: v })} />
            <TextField label={t(lang, "legalStatus")} value={generalInfo.legalStatus ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, legalStatus: v })} />
            <TextField label={t(lang, "incorporationDate")} value={generalInfo.incorporationDate ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, incorporationDate: v })} />
            <TextField label={t(lang, "registrationNumber")} value={generalInfo.registrationNumber ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, registrationNumber: v })} />
            <TextField label={t(lang, "website")} value={generalInfo.website ?? ""} onChange={(v) => setGeneralInfo({ ...generalInfo, website: v })} />
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
                  <input placeholder={t(lang, "ownerDob")} value={owner.dateOfBirthOrIncorporation ?? ""} onChange={(e) => updateOwner(index, { dateOfBirthOrIncorporation: e.target.value })} className={inputClass} />
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

        {/* Business Description */}
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
                <input type="radio" checked={!businessDescription.hasShellBankRelationships} onChange={() => setBusinessDescription({ ...businessDescription, hasShellBankRelationships: false, shellBankDetails: null })} />
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

        {/* Payment Services */}
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
                <input type="radio" checked={!paymentServices.usesAgents} onChange={() => setPaymentServices({ ...paymentServices, usesAgents: false, totalAgents: null, agentsOutsideCountryDetails: null })} />
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
                  checked={!paymentServices.isAffiliateOfOtherFi}
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

        {/* Disclosures */}
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

        {/* Document */}
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

        {message ? (
          <p className={`text-sm ${message.type === "error" ? "text-destructive" : "text-primary"}`}>{message.text}</p>
        ) : null}

        {editable ? (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || submitting}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              {saving ? t(lang, "saving") : t(lang, "saveProgress")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? t(lang, "submitting") : t(lang, "submit")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
