"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NICHE_TEMPLATES } from "@/lib/niches";
import type { DemoFormValues } from "@/types";

const E164_REGEX = /^\+1[2-9]\d{9}$/;

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits.startsWith("1") && digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return raw;
}

export default function IntakeForm() {
  const router = useRouter();
  const [values, setValues] = useState<DemoFormValues>({
    business_name: "",
    niche_key: "",
    phone_number: "",
    consent_given: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DemoFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!values.business_name.trim()) next.business_name = "Business name is required.";
    if (!values.niche_key) next.niche_key = "Please select an industry.";
    const formatted = formatPhone(values.phone_number);
    if (!E164_REGEX.test(formatted)) {
      next.phone_number = "Enter a valid US phone number (e.g. 555-867-5309).";
    }
    if (!values.consent_given) next.consent_given = "You must agree before we can call you.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);

    const payload = { ...values, phone_number: formatPhone(values.phone_number) };

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push(`/success?business=${encodeURIComponent(values.business_name)}&id=${data.id}`);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Unexpected error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Hear your AI receptionist in action</h1>
          <p className="mt-2 text-slate-500 text-sm">
            Enter your business info and we&apos;ll call you right now with a live demo — no app, no setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Business name */}
          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-slate-700 mb-1">
              Business name
            </label>
            <input
              id="business_name"
              type="text"
              autoComplete="organization"
              placeholder="Bloom Med Spa"
              value={values.business_name}
              onChange={(e) => setValues({ ...values, business_name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.business_name && <p className="mt-1 text-xs text-red-600">{errors.business_name}</p>}
          </div>

          {/* Niche dropdown */}
          <div>
            <label htmlFor="niche_key" className="block text-sm font-medium text-slate-700 mb-1">
              Industry
            </label>
            <select
              id="niche_key"
              value={values.niche_key}
              onChange={(e) => setValues({ ...values, niche_key: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">Select your industry…</option>
              {NICHE_TEMPLATES.map((t) => (
                <option key={t.niche_key} value={t.niche_key}>
                  {t.display_name}
                </option>
              ))}
            </select>
            {errors.niche_key && <p className="mt-1 text-xs text-red-600">{errors.niche_key}</p>}
          </div>

          {/* Phone number */}
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-slate-700 mb-1">
              Your phone number
            </label>
            <input
              id="phone_number"
              type="tel"
              autoComplete="tel"
              placeholder="(555) 867-5309"
              value={values.phone_number}
              onChange={(e) => setValues({ ...values, phone_number: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-400">US numbers only for now.</p>
            {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>}
          </div>

          {/* Consent checkbox */}
          <div className="flex items-start gap-3 pt-1">
            <input
              id="consent_given"
              type="checkbox"
              checked={values.consent_given}
              onChange={(e) => setValues({ ...values, consent_given: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="consent_given" className="text-sm text-slate-600 cursor-pointer">
              I consent to receive an automated AI demo call at the number above. This is a demonstration only — not
              a sales call. Standard call rates may apply.
            </label>
          </div>
          {errors.consent_given && <p className="-mt-3 text-xs text-red-600">{errors.consent_given}</p>}

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Placing your call…" : "Call me now →"}
          </button>
        </form>
      </div>
    </main>
  );
}
