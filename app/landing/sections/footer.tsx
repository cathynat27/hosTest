"use client";

import { MessageCircle } from "lucide-react";

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Footer main content */}
        <div className="flex flex-cols-1 md:flex-cols-4 gap-12 mb-12 justify-between">
          {/* Brand */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3">Hoscover</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Turn WhatsApp into your hotel&apos;s best salesperson.<br></br> Respond instantly, capture every lead.
            </p>
          </div>

          {/* Quick Links */}
          {/* <div>
            <h4 className="text-white font-semibold mb-4 text-sm">QUICK LINKS</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/landing" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              {/* <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </a>
              </li> */}
          {/* <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </a>
              </li> 
            </ul>
          </div> */}

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">COMPANY</h4>
            <ul className="space-y-2 text-sm">
              {/* <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </a>
              </li> */}
              <li>
                <a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">GET IN TOUCH</h4>
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
            <p className="text-sm text-gray-400 mt-4">24/7 Support Available</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Hoscover by Jurya Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
