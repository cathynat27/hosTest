"use client";

import { CheckCircle2, ArrowRight } from "lucide-react";
import Button from "../components/button";

export default function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Connect Your WhatsApp Business Account",
      description: "Link your WhatsApp Business account to Hoscover in minutes. No technical setup required.",
      features: [
        "One-click integration",
        "Secure authentication",
        "Instant activation",
      ],
    },
    {
      number: 2,
      title: "Hoscover Responds Automatically",
      description: "AI-powered responses answer guest questions instantly. Capture leads 24/7 without staff.",
      features: [
        "Instant guest responses",
        "Lead capture automation",
        "Smart conversation routing",
      ],
    },
    {
      number: 3,
      title: "Convert Inquiries Into Bookings",
      description: "Track conversations, follow up automatically, and close bookings faster than ever.",
      features: [
        "Conversation tracking",
        "Automated follow-ups",
        "Booking confirmation",
      ],
    },
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            3 Steps to More Bookings
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple setup. Powerful results. Start capturing more bookings today.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Desktop arrows */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step card */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-8 border border-blue-100 h-full">
                {/* Step number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  {step.number}
                </div>

                {/* Step title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 mt-4">{step.title}</h3>

                {/* Step description */}
                <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>

                {/* Features list */}
                <ul className="space-y-3">
                  {step.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile arrow */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4">
                  <ArrowRight className="w-6 h-6 text-blue-400 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Ready to see it in action? Schedule a personalized demo with our team.
          </p>
          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              const demoSection = document.getElementById("demo-form-section");
              demoSection?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
}
