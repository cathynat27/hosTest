"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Footer main content */}
        <div className="flex flex-cols-1 md:flex-cols-4 gap-12 mb-12 justify-between">
          {/* Brand */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3">Hoscover</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Run guest messaging like a premium concierge desk. Keep every escalation visible.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">COMPANY</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-slate-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">GET IN TOUCH</h4>
            <a
              href="mailto:info@juryatechnologies.com"
              className="text-sm text-slate-400 hover:text-white transition-colors block mb-2"
            >
              info@juryatechnologies.com
            </a>
            <p className="text-sm text-slate-400">24/7 Support Available</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-8" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <p className="text-sm text-slate-400">
            &copy; {currentYear} Hoscover by Jurya Technologies Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
