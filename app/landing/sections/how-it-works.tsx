"use client";

import { CheckCircle2, ArrowRight } from "lucide-react";
import Button from "../components/button";
import AnimateOnScroll from "../components/animate-on-scroll";

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
    <section id="how-it-works-section" className="py-20 px-4 bg-gray-50 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section title */}
        <AnimateOnScroll animation="animate__fadeIn">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How Hoscover Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your WhatsApp into a 24/7 booking machine.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {steps.map((step, index) => (
            <AnimateOnScroll
              key={index}
              animation="animate__fadeInUp"
              delay={`${index * 0.2}s`}
            >
              <div className="relative h-full">
                {/* Step card */}
                <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-all h-full relative pt-12">
                  {/* Step number badge */}
                  <div className="absolute top-0 left-8 w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-md">
                    {step.number}
                  </div>

                  {/* Step title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>

                  {/* Step description */}
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm">{step.description}</p>

                  {/* Features list */}
                  <ul className="space-y-3">
                    {step.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500/60 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
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
            </AnimateOnScroll>
          ))}
        </div>

        {/* CTA */}
        <AnimateOnScroll animation="animate__fadeInUp" delay="0.4s">
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6 text-lg">
              Ready to see it in action? Get a personalized demo and discover how Hoscover can transform your bookings.
            </p>
            <Button
              size="lg"
              variant="primary"
              onClick={() => {
                const demoSection = document.getElementById("demo-form-section");
                demoSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Schedule Your Demo
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

