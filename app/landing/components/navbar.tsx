"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Button from "./button";
import HoscoverLogo from "../../components/hoscover-logo";
import Link from "next/link";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth" });
        setIsOpen(false);
    };

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="#hero">
                        <HoscoverLogo className="flex items-center gap-3" textClassName="flex flex-col" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => scrollToSection("problems-section")}
                            className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            FEATURES
                        </button>
                        <button
                            onClick={() => scrollToSection("how-it-works-section")}
                            className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            HOW IT WORKS
                        </button>
                        <button
                            onClick={() => scrollToSection("social-proof-section")}
                            className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            TESTMONIALS
                        </button>
                    </div>

                    {/* CTA and Menu Toggle */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* <span className="text-sm text-slate-600">Live with AI + Staff</span> */}
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                                const demoSection = document.getElementById("demo-form-section");
                                demoSection?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Book Demo
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={toggleMenu}
                        className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? (
                            <X className="w-6 h-6 text-slate-900" />
                        ) : (
                            <Menu className="w-6 h-6 text-slate-900" />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-slate-200 pt-4">
                        <button
                            onClick={() => scrollToSection("problems-section")}
                            className="block w-full text-left text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium py-2"
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollToSection("how-it-works-section")}
                            className="block w-full text-left text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium py-2"
                        >
                            How It Works
                        </button>
                        <button
                            onClick={() => scrollToSection("social-proof-section")}
                            className="block w-full text-left text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium py-2"
                        >
                            Testimonials
                        </button>
                        <div className="flex gap-3 pt-3">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    scrollToSection("demo-form-section");
                                }}
                            >
                                Login
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                className="flex-1"
                                onClick={() => {
                                    scrollToSection("demo-form-section");
                                }}
                            >
                                Staff Sign In
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
