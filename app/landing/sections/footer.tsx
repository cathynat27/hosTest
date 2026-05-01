"use client";

import { MessageCircle } from "lucide-react";

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">          {/* Company info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-2">Hoscover by Jurya Technologies</h3>
            <p className="text-sm text-gray-400">
              Turn WhatsApp into your hotels best salesperson.
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>

          {/* Product links 
           <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
         

          {/* Company links 
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div> 
           */}

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message us on WhatsApp
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Hoscover. All rights reserved.
          </p>


        </div>
      </div>
    </footer>
  );
}
