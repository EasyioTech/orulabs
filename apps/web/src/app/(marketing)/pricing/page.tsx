import type { Metadata } from "next";
import { PublicPricingPage } from "@/components/subscription/PublicPricingPage";

export const metadata: Metadata = {
  title: "Pricing — OruLabs",
  description: "Simple, transparent pricing for OruLabs. Choose monthly, quarterly, or annual plans for your live training needs.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <PublicPricingPage />
    </div>
  );
}
