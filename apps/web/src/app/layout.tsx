import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL || "https://orulabs.in"),
  title: { default: "OruLabs | Real-Time Live Training Platform for Educators", template: "%s | OruLabs" },
  description: "OruLabs is the leading real-time live training platform for teacher professional development. Interactive virtual classrooms, real-time analytics, and seamless learning.",
  keywords: ["OruLabs", "EdTech", "Live Training Platform", "Teacher Professional Development", "Virtual Classrooms", "Interactive Learning for Educators"],
  authors: [{ name: "OruLabs Expert Team", url: "https://orulabs.in/about" }],
  creator: "OruLabs",
  publisher: "OruLabs",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "OruLabs | Real-Time Live Training Platform for Educators",
    description: "OruLabs is the leading real-time live training platform for teacher professional development. Interactive virtual classrooms, real-time analytics, and seamless learning.",
    url: "https://orulabs.in",
    siteName: "OruLabs",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OruLabs Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OruLabs | Real-Time Live Training Platform for Educators",
    description: "OruLabs is the leading real-time live training platform for teacher professional development.",
    creator: "@orulabs",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://orulabs.in/#organization",
        "name": "OruLabs",
        "url": "https://orulabs.in",
        "logo": "https://orulabs.in/logo.png",
        "description": "OruLabs is the leading real-time live training platform for teacher professional development.",
        "sameAs": [
          "https://twitter.com/orulabs",
          "https://linkedin.com/company/orulabs"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "support@orulabs.in"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://orulabs.in/#website",
        "url": "https://orulabs.in",
        "name": "OruLabs",
        "publisher": {
          "@id": "https://orulabs.in/#organization"
        }
      }
    ]
  };

  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
