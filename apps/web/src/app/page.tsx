import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { LearnByBuildingSection } from "@/components/marketing/LearnByBuildingSection";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { FinalCTASection } from "@/components/marketing/FinalCTASection";
import { Footer } from "@/components/marketing/Footer";

import { FAQSection } from "@/components/marketing/FAQSection";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { QuoteSection } from "@/components/marketing/QuoteSection";

const faqs = [
  {
    question: "What is OruLabs?",
    answer: "OruLabs is a real-time live training platform specifically designed for teacher professional development. It provides interactive virtual classrooms, seamless integrations, and real-time analytics to make training effective and engaging."
  },
  {
    question: "How is OruLabs different from Zoom or Google Meet?",
    answer: "Unlike generic meeting tools, OruLabs is built exclusively for educational professional development. It features specialized pedagogical tools, structured learning paths, built-in assessments, and deep analytics on participant engagement."
  },
  {
    question: "Do I need to download software to use OruLabs?",
    answer: "No, OruLabs is completely browser-based. Both trainers and participants can join live sessions directly from any modern web browser without downloading any external applications."
  }
];

const landingSchema = {
  "@context": "https://schema.org",
  "@type": ["WebPage", "FAQPage"],
  "name": "OruLabs | Real-Time Live Training Platform",
  "description": "OruLabs is the leading real-time live training platform for teacher professional development.",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};

export default function LandingPage() {
  return (
    <main id="main-scroller" className="w-full overflow-x-hidden bg-white selection:bg-gray-200 selection:text-black">
      <SchemaMarkup schema={landingSchema} />
      <MarketingNavbar />
      <HeroSection />
      
      <FeaturesSection />
      <LearnByBuildingSection />
      <DashboardPreview />
      <HowItWorksSection />
      
      <QuoteSection />

      <FAQSection faqs={faqs} />
      
      <FinalCTASection />
      <Footer />
    </main>
  );
}
