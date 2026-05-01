"use client";

import HeroSection from "./sections/hero";
import ProblemsSection from "./sections/problems";
import HowItWorksSection from "./sections/how-it-works";
import SocialProofSection from "./sections/social-proof";
import DemoFormSection from "./sections/demo-form";
import FooterSection from "./sections/footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <ProblemsSection />
      <HowItWorksSection />
      <SocialProofSection />
      <DemoFormSection />
      <FooterSection />
    </main>
  );
}
