"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ApiError, onboardHotel } from "@/lib/api";
import { OnboardHotelRequest, OnboardHotelResponse } from "@/types";

type OnboardingErrors = Partial<Record<keyof OnboardHotelRequest, string>>;

function mapOnboardingError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Please review required fields and try again.";
      case 401:
        return "You are not authorized for this action. Sign in and retry.";
      case 403:
        return "You do not have permission to onboard a hotel.";
      case 409:
        return "This hotel or admin email already exists. Use another email or contact support.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Hotel onboarding failed. Please try again.";
}

function validatePayload(payload: OnboardHotelRequest): OnboardingErrors {
  const errors: OnboardingErrors = {};

  if (!payload.hotelName.trim()) errors.hotelName = "Hotel name is required.";
  if (!payload.contactPhone.trim()) errors.contactPhone = "Contact phone is required.";
  if (!payload.location.trim()) errors.location = "Location is required.";
  if (!payload.whatsappNumber.trim()) errors.whatsappNumber = "WhatsApp number is required.";
  if (!payload.whatsappPhoneNumberId.trim()) errors.whatsappPhoneNumberId = "Phone number ID is required.";
  if (!payload.whatsappAccessToken.trim()) errors.whatsappAccessToken = "WhatsApp access token is required.";
  if (!payload.adminEmail.trim()) errors.adminEmail = "Admin email is required.";
  if (!payload.knowledge_text?.trim()) errors.knowledge_text = "Knowledge base is required.";

  return errors;
}

const initialForm: OnboardHotelRequest = {
  hotelName: "",
  contactName: "",
  contactPhone: "",
  location: "",
  whatsappNumber: "",
  whatsappPhoneNumberId: "",
  whatsappAccessToken: "",
  adminEmail: "",
  knowledge_text: "",
};

export default function HotelOnboardingPage() {
  const [form, setForm] = useState<OnboardHotelRequest>(initialForm);
  const [errors, setErrors] = useState<OnboardingErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OnboardHotelResponse | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validatePayload(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setError(null);
    setErrors({});
    setSuccess(null);

    try {
      const response = await onboardHotel({
        ...form,
        hotelName: form.hotelName.trim(),
        contactName: form.contactName?.trim() || undefined,
        contactPhone: form.contactPhone.trim(),
        location: form.location.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        whatsappPhoneNumberId: form.whatsappPhoneNumberId.trim(),
        whatsappAccessToken: form.whatsappAccessToken.trim(),
        adminEmail: form.adminEmail.trim(),
      });

      setSuccess(response);
      setForm(initialForm);
    } catch (err) {
      setError(mapOnboardingError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-5xl">
        <div className="glass-card rounded-[2rem] p-5 sm:p-8">
        <div className="mb-6">
          <p className="pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">Hoscover Setup</p>
          <h1 className="card-title mt-3 text-3xl font-semibold tracking-tight">Hotel Onboarding</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Complete onboarding details to create your hotel and trigger the admin invite email.
          </p>
        </div>

        {success && (
          <section className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Onboarding Complete</p>
            <p className="mt-1 text-sm text-emerald-800">{success.message}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-emerald-700">Hotel Code</p>
            <p className="mt-1 text-3xl font-black tracking-[0.08em] text-emerald-900">{success.hotelCode}</p>
            <p className="mt-2 text-sm text-emerald-800">
              An invite email has been sent to the admin. Ask them to open the invite link and complete signup.
            </p>
          </section>
        )}

        <form onSubmit={onSubmit} className="rounded-2xl border border-white/70 bg-white/60 p-5 shadow-[0_20px_50px_rgba(25,40,67,0.12)] md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="hotelName" className="ui-label">
                Hotel Name *
              </label>
              <input
                id="hotelName"
                value={form.hotelName}
                onChange={(event) => setForm((prev) => ({ ...prev, hotelName: event.target.value }))}
                className="ui-input"
              />
              {errors.hotelName && <p className="mt-1 text-xs text-red-600">{errors.hotelName}</p>}
            </div>

            <div>
              <label htmlFor="contactName" className="ui-label">
                Contact Name
              </label>
              <input
                id="contactName"
                value={form.contactName}
                onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="contactPhone" className="ui-label">
                Contact Phone *
              </label>
              <input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                className="ui-input"
              />
              {errors.contactPhone && <p className="mt-1 text-xs text-red-600">{errors.contactPhone}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="location" className="ui-label">
                Location *
              </label>
              <input
                id="location"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                className="ui-input"
              />
              {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
            </div>

            <div>
              <label htmlFor="whatsappNumber" className="ui-label">
                WhatsApp Number *
              </label>
              <input
                id="whatsappNumber"
                value={form.whatsappNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                className="ui-input"
              />
              {errors.whatsappNumber && <p className="mt-1 text-xs text-red-600">{errors.whatsappNumber}</p>}
            </div>

            <div>
              <label htmlFor="whatsappPhoneNumberId" className="ui-label">
                WhatsApp Phone Number ID *
              </label>
              <input
                id="whatsappPhoneNumberId"
                value={form.whatsappPhoneNumberId}
                onChange={(event) => setForm((prev) => ({ ...prev, whatsappPhoneNumberId: event.target.value }))}
                className="ui-input"
              />
              {errors.whatsappPhoneNumberId && <p className="mt-1 text-xs text-red-600">{errors.whatsappPhoneNumberId}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="whatsappAccessToken" className="ui-label">
                WhatsApp Access Token *
              </label>
              <input
                id="whatsappAccessToken"
                type="password"
                value={form.whatsappAccessToken}
                onChange={(event) => setForm((prev) => ({ ...prev, whatsappAccessToken: event.target.value }))}
                className="ui-input"
              />
              {errors.whatsappAccessToken && <p className="mt-1 text-xs text-red-600">{errors.whatsappAccessToken}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="adminEmail" className="ui-label">
                Admin Email *
              </label>
              <input
                id="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={(event) => setForm((prev) => ({ ...prev, adminEmail: event.target.value }))}
                className="ui-input"
              />
              {errors.adminEmail && <p className="mt-1 text-xs text-red-600">{errors.adminEmail}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="knowledge_text" className="ui-label">
                Hotel Knowledge Base *
              </label>
              <p className="mb-2 text-xs text-slate-500 leading-relaxed">
                This is the information your AI assistant uses to answer guest questions over WhatsApp.
                Write it in plain English — the more detail you provide, the better the AI will perform.
                Cover things like:
              </p>
              <ul className="mb-2 list-disc pl-4 text-xs text-slate-500 space-y-0.5">
                <li><span className="font-medium text-slate-600">Check-in / check-out</span> — times, early check-in policy, late check-out fees</li>
                <li><span className="font-medium text-slate-600">Room types & amenities</span> — what each room includes, bed types, views, capacity</li>
                <li><span className="font-medium text-slate-600">Pricing & offers</span> — room rates, seasonal deals, what&apos;s included in the rate</li>
                <li><span className="font-medium text-slate-600">Facilities</span> — pool, gym, spa, restaurant hours, parking, Wi-Fi details</li>
                <li><span className="font-medium text-slate-600">Policies</span> — cancellation, pets, children, smoking, extra guests</li>
                <li><span className="font-medium text-slate-600">Location & transport</span> — address, nearest airport, taxi/shuttle options, landmarks nearby</li>
                <li><span className="font-medium text-slate-600">Common FAQs</span> — anything guests ask repeatedly at front desk or via WhatsApp</li>
              </ul>
              <textarea
                id="knowledge_text"
                rows={8}
                value={form.knowledge_text ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, knowledge_text: event.target.value }))}
                placeholder={`Example:\nCheck-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in can be arranged for an extra $20 subject to availability.\n\nWe have 3 room types: Standard (1 queen bed), Deluxe (1 king bed, garden view), and Suite (king bed, living area, sea view). All rooms include free Wi-Fi, air conditioning, flat-screen TV, and daily housekeeping.\n\nThe swimming pool is open 7 AM – 9 PM. The restaurant serves breakfast (7–10 AM), lunch (12–3 PM), and dinner (6–10 PM).\n\nWe are located at 12 Palm Avenue, 5 km from Entebbe International Airport. Free airport shuttle available on request.`}
                className="ui-input min-h-44 resize-y"
              />
              {errors.knowledge_text && <p className="mt-1 text-xs text-red-600">{errors.knowledge_text}</p>}
              <p className="mt-1 text-xs text-slate-400">
                The more complete this is, the fewer guest questions will need human intervention.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Back to login
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Submitting..." : "Onboard Hotel"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </main>
  );
}
