"use client";

import { Zap, CheckCircle2, TrendingUp, ChevronDown } from "lucide-react";
import Button from "../components/button";
import AnimateOnScroll from "../components/animate-on-scroll";

export default function HeroSection() {
  const scrollToNext = () => {
    const problemsSection = document.getElementById("problems-section");
    problemsSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="id=hero relative min-h-[60vh] lg:min-h-[80vh] flex items-center justify-center px-4 py-10 overflow-hidden">

      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 animate-zoom-out object-cover"
          style={{
            backgroundImage: 'url("/image/whatsapp3.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transition: 'transform 0.5s ease-in-out'
          }}
        />
        {/* Soft overlay to ensure readability */}
        <div className="absolute inset-0 bg-white/20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Headline */}
        <AnimateOnScroll animation="animate__fadeInDown">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Turn WhatsApp Into Your Hotel’s Best Salesperson
          </h1>
        </AnimateOnScroll>

        {/* Subheadline */}
        <AnimateOnScroll animation="animate__fadeInUp" delay="0.2s">
          <p className="text-lg sm:text-xl text-gray-900  bg-gray-50/20 mb-6 leading-relaxed max-w-2xl mx-auto">
            Respond to booking inquiries instantly. Capture every lead. Convert conversations into confirmed reservations.
          </p>
        </AnimateOnScroll>

        {/* CTA */}
        <AnimateOnScroll animation="animate__fadeInUp" delay="0.4s">
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
        </AnimateOnScroll>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

          <AnimateOnScroll animation="animate__fadeInUp" delay="0.6s">
            <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <Zap className="w-6 h-6 text-gray-700" />
              <span className="text-gray-900 font-semibold">Respond in Seconds</span>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="animate__fadeInUp" delay="0.7s">
            <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-gray-700" />
              <span className="text-gray-900 font-semibold">Never Miss a Lead</span>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="animate__fadeInUp" delay="0.8s">
            <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <TrendingUp className="w-6 h-6 text-gray-700" />
              <span className="text-gray-900 font-semibold">Increase Revenue</span>
            </div>
          </AnimateOnScroll>

        </div>

      </div>
    </section>
  );
}

