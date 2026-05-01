import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hoscover - WhatsApp Booking Automation for Hotels",
  description:
    "Turn WhatsApp into your hotel's best salesperson. Respond faster, capture missed leads, and convert conversations into confirmed bookings.",
  keywords: [
    "hotel booking",
    "WhatsApp automation",
    "guest communication",
    "booking management",
    "hotel technology",
    "revenue management",
  ],
  authors: [{ name: "Hoscover" }],
  creator: "Hoscover",
  publisher: "Hoscover",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hoscover.com",
    siteName: "Hoscover",
    title: "Hoscover - WhatsApp Booking Automation for Hotels",
    description:
      "Turn WhatsApp into your hotel's best salesperson. Respond faster, capture missed leads, and convert conversations into confirmed bookings.",
    images: [
      {
        url: "https://hoscover.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hoscover - WhatsApp Booking Automation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoscover - WhatsApp Booking Automation for Hotels",
    description:
      "Turn WhatsApp into your hotel's best salesperson. Respond faster, capture missed leads, and convert conversations into confirmed bookings.",
    images: ["https://hoscover.com/twitter-image.png"],
    creator: "@hoscover",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#1e40af",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://hoscover.com" />
        
        {/* Additional meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>{children}</body>
    </html>
  );
}
