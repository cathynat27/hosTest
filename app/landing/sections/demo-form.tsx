"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Button from "../components/button";

interface FormData {
  fullName: string;
  propertyName: string;
  email: string;
  whatsappNumber: string;
  averageRooms: string;
}

interface FormErrors {
  fullName?: string;
  propertyName?: string;
  email?: string;
  whatsappNumber?: string;
  averageRooms?: string;
}

export default function DemoFormSection() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    propertyName: "",
    email: "",
    whatsappNumber: "",
    averageRooms: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.propertyName.trim()) {
      newErrors.propertyName = "Property name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = "WhatsApp number is required";
    } else if (!/^\+\d{1,3}\d{6,14}$/.test(formData.whatsappNumber.replace(/\s/g, ""))) {
      newErrors.whatsappNumber = "Please enter a valid number starting with +";
    }

    if (!formData.averageRooms.trim()) {
      newErrors.averageRooms = "Average rooms is required";
    } else if (parseInt(formData.averageRooms) < 1) {
      newErrors.averageRooms = "Please enter a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit form");
      }

      setSuccess(true);
      setFormData({
        fullName: "",
        propertyName: "",
        email: "",
        whatsappNumber: "",
        averageRooms: "",
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="demo-form-section" className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Bookings?
          </h2>
          <p className="text-lg text-gray-600">
            Schedule a personalized demo and see how Hoscover can increase your bookings.
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Demo scheduled!</h3>
              <p className="text-green-800">
                We will reach out on WhatsApp within 24 hours to confirm your demo time.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {apiError && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-800">{apiError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-8 border border-gray-200">
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Smith"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${errors.fullName
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                  } focus:outline-none focus:ring-2`}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Property Name */}
            <div>
              <label htmlFor="propertyName" className="block text-sm font-semibold text-gray-900 mb-2">
                Property Name *
              </label>
              <input
                id="propertyName"
                name="propertyName"
                type="text"
                value={formData.propertyName}
                onChange={handleChange}
                placeholder="Sunset Beach Resort"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${errors.propertyName
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                  } focus:outline-none focus:ring-2`}
              />
              {errors.propertyName && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.propertyName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@hotel.com"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${errors.email
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                  } focus:outline-none focus:ring-2`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div>
              <label htmlFor="whatsappNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                WhatsApp Number *
              </label>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${errors.whatsappNumber
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                  } focus:outline-none focus:ring-2`}
              />
              {errors.whatsappNumber && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.whatsappNumber}
                </p>
              )}
            </div>

            {/* Average Rooms */}
            <div>
              <label htmlFor="averageRooms" className="block text-sm font-semibold text-gray-900 mb-2">
                Average Rooms per Night *
              </label>
              <input
                id="averageRooms"
                name="averageRooms"
                type="number"
                min="1"
                value={formData.averageRooms}
                onChange={handleChange}
                placeholder="50"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${errors.averageRooms
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                  } focus:outline-none focus:ring-2`}
              />
              {errors.averageRooms && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.averageRooms}
                </p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={loading}
              disabled={loading}
              className="w-full"
            >
              Schedule My Demo
            </Button>

            <p className="text-center text-sm text-gray-600">
              We will reach out on WhatsApp within 24 hours to confirm your demo time.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
