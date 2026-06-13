import { Metadata } from "next";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compare OruLabs | Alternatives to Zoom and Teams",
  description: "See how OruLabs compares to generic meeting tools like Zoom and Microsoft Teams for teacher professional development.",
};

const compareHubSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Compare OruLabs",
  "description": "See how OruLabs compares to generic meeting tools for educational training.",
  "url": "https://orulabs.in/compare"
};

export default function CompareHubPage() {
  return (
    <div className="w-full bg-white relative">
      <SchemaMarkup schema={compareHubSchema} />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gray-50">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-white" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-100/50 to-transparent blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl lg:text-7xl">
            Compare <span className="text-brand-600">OruLabs</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 font-light leading-relaxed">
            Discover why educational institutions are switching from generic video conferencing to specialized live training platforms.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/compare/orulabs-vs-zoom" className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md hover:border-brand-200 transition-all group">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">OruLabs vs. Zoom</h2>
            <p className="text-gray-600 leading-relaxed text-lg">Learn why Zoom's generic features fall short for professional development and how OruLabs provides a specialized educational environment.</p>
          </Link>

          <Link href="/compare/orulabs-vs-microsoft-teams" className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md hover:border-brand-200 transition-all group">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">OruLabs vs. Microsoft Teams</h2>
            <p className="text-gray-600 leading-relaxed text-lg">See the difference between Teams' enterprise communication focus and OruLabs' pedagogical, interactive training approach.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
