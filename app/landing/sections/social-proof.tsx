"use client";

import { Star } from "lucide-react";

export default function SocialProofSection() {
  const testimonials = [
    {
      name: "Maria Rodriguez",
      property: "Sunset Beach Resort",
      role: "General Manager",
      rating: 5,
      quote: "Hoscover increased our bookings by 40% in just 2 months. Our guests love the instant responses.",
    },
    {
      name: "James Chen",
      property: "Mountain View Hotel",
      role: "Owner",
      rating: 5,
      quote: "We've cut our response time from hours to seconds. The ROI was immediate and impressive.",
    },
    {
      name: "Sophie Laurent",
      property: "Boutique Paris Hotel",
      role: "Front Office Manager",
      rating: 5,
      quote: "Finally, a solution that actually works. Our team has more time for guests, and we're closing more deals.",
    },
    {
      name: "Ahmed Hassan",
      property: "Desert Oasis Resort",
      role: "Sales Director",
      rating: 5,
      quote: "The automation is seamless. We're capturing leads we would have missed completely before.",
    },
  ];

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Trusted by Hotels Worldwide
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See what hotel managers and owners are saying about Hoscover.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Star rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 mb-6 flex-grow leading-relaxed italic">
                {testimonial.quote}
              </p>

              {/* Author info */}
              <div className="border-t border-gray-200 pt-4">
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
                <p className="text-sm text-blue-600 font-medium">{testimonial.property}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-blue-600 mb-2">500+</p>
            <p className="text-gray-600">Hotels using Hoscover</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-blue-600 mb-2">2M+</p>
            <p className="text-gray-600">Bookings processed</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-blue-600 mb-2">35%</p>
            <p className="text-gray-600">Average booking increase</p>
          </div>
        </div>
      </div>
    </section>
  );
}
