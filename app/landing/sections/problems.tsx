"use client";

import { Clock, AlertCircle, Inbox } from "lucide-react";

export default function ProblemsSection() {
  const problems = [
    {
      icon: Clock,
      title: "Guests Wait Hours for Responses",
      description: "Manual WhatsApp management means slow replies. Guests get frustrated and book elsewhere.",
    },
    {
      icon: AlertCircle,
      title: "Missed Inquiries = Lost Revenue",
      description: "Messages get lost in the chaos. Potential bookings slip through the cracks unnoticed.",
    },
    {
      icon: Inbox,
      title: "Manual Follow-ups Don't Scale",
      description: "Your team can't keep up with volume. Repetitive tasks waste time and resources.",
    },
  ];

  return (
    <section id="problems-section" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Hotels Are Losing Bookings on WhatsApp
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every unanswered message is a missed opportunity. Here's what's really happening.
          </p>
        </div>

        {/* Problem cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-red-100">
                      <Icon className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{problem.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{problem.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Impact statement */}
        <div className="mt-16 bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-lg text-gray-900">
            <span className="font-bold text-red-600">The result?</span> Hotels lose an average of{" "}
            <span className="font-bold">30-40% of potential bookings</span> due to slow or missed WhatsApp responses.
          </p>
        </div>
      </div>
    </section>
  );
}
