"use client";

import { Zap, CheckCircle2, TrendingUp, ChevronDown } from "lucide-react";
import Button from "../components/button";

export default function HeroSection() {
  const scrollToNext = () => {
    const problemsSection = document.getElementById("problems-section");
    problemsSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="  id=hero relative min-h-[40vh] bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center px-4 py-10 overflow-hidden">

      {/* Background decoration (soft neutral) */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-200 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-300 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
          Turn WhatsApp Into Your Hotel’s Best Salesperson
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl mx-auto">
          Respond to booking inquiries instantly. Capture every lead. Convert conversations into confirmed reservations.
        </p>

        {/* CTA */}
        <div className="mb-8">
          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              const demoSection = document.getElementById("demo-form-section");
              demoSection?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Get Demo
          </Button>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

          <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Zap className="w-6 h-6 text-gray-700" />
            <span className="text-gray-900 font-semibold">Respond in Seconds</span>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-gray-700" />
            <span className="text-gray-900 font-semibold">Never Miss a Lead</span>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <TrendingUp className="w-6 h-6 text-gray-700" />
            <span className="text-gray-900 font-semibold">Increase Revenue</span>
          </div>

        </div>

        {/* Scroll */}
        {/* <button
          onClick={scrollToNext}
          className="mx-auto flex flex-col items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors animate-bounce"
          aria-label="Scroll to next section"
        >
          <span className="text-sm font-medium">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </button> */}

      </div>
    </section>
  );
}
