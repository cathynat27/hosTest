"use client";

import { Shield, Zap, Users, TrendingUp } from "lucide-react";

export default function ValuesSection() {
    const values = [
        {
            icon: Shield,
            title: "Trust & Security",
            description: "Your hotel data and guest information are protected with enterprise-grade security.",
        },
        {
            icon: Zap,
            title: "Instant Responses",
            description: "AI-powered automation responds to guests 24/7, even when your team is offline.",
        },
        {
            icon: Users,
            title: "Expert Support",
            description: "Our dedicated support team is here to help you succeed every step of the way.",
        },
        {
            icon: TrendingUp,
            title: "Proven Results",
            description: "Hotels see an average 35% increase in bookings within the first month.",
        },
    ];

    return (
        <section className="py-20 px-4 bg-blue-50">
            <div className="max-w-6xl mx-auto">
                {/* Section title */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        Why Choose Hoscover
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        We're committed to helping hotels automate their booking process and grow their revenue.
                    </p>
                </div>

                {/* Values grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {values.map((value, index) => {
                        const Icon = value.icon;
                        return (
                            <div key={index} className="text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-white shadow-sm">
                                        <Icon className="h-8 w-8 text-blue-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{value.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
