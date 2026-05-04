"use client";

import Navbar from "./components/navbar";
import HeroSection from "./sections/hero";
import ValuesSection from "./sections/values";
import ProblemsSection from "./sections/problems";
import HowItWorksSection from "./sections/how-it-works";
import SocialProofSection from "./sections/social-proof";
import DemoFormSection from "./sections/demo-form";
import FooterSection from "./sections/footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <ValuesSection />
      <ProblemsSection />
      <HowItWorksSection />
      <SocialProofSection />
      <DemoFormSection />
      <FooterSection />
    </main>
  );
}
