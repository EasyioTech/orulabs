"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@oruclass/utils";
import { plans, formatPrice, type PlanId } from "@/config/plans";

// Google pricing style configuration
const tierStyle: Record<PlanId, {
  badge: string;
  ring: string;
  button: string;
  iconColor: string;
}> = {
  monthly: {
    badge: "",
    ring: "border-gray-200 hover:shadow-md",
    button: "border border-gray-300 text-[#1a73e8] hover:bg-gray-50",
    iconColor: "text-gray-600",
  },
  quarterly: {
    badge: "bg-[#1a73e8] text-white",
    ring: "border-[#1a73e8] border-2 shadow-sm relative z-10",
    button: "bg-[#1a73e8] text-white hover:bg-[#1557b0]",
    iconColor: "text-[#1a73e8]",
  },
  yearly: {
    badge: "bg-gray-600 text-white",
    ring: "border-gray-200 hover:shadow-md",
    button: "border border-gray-300 text-[#1a73e8] hover:bg-gray-50",
    iconColor: "text-gray-600",
  },
};

export function PricingPage({ onGetStarted }: { onGetStarted?: (planId: PlanId) => void } = {}) {
  const router = useRouter();

  function handleGetStarted(planId: PlanId) {
    if (onGetStarted) { onGetStarted(planId); return; }
    router.push(`/subscription/checkout?plan=${planId}`);
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 font-sans">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-[36px] font-normal text-gray-900 tracking-tight mb-4">
          Choose the right plan for you
        </h1>
        <p className="text-[16px] text-gray-600 max-w-xl mx-auto">
          Simple, transparent pricing. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const style = tierStyle[plan.id];
          const TierIcon = plan.icon;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative bg-white rounded-xl p-6 md:p-8 cursor-pointer transition-all duration-200 border flex flex-col",
                style.ring
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 text-[12px] font-medium px-4 py-1 rounded-full whitespace-nowrap",
                    style.badge
                  )}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6 flex-grow">
                <div className="flex items-center gap-3 mb-4">
                  <TierIcon className={style.iconColor} size={24} strokeWidth={1.5} />
                  <h3 className="text-[20px] font-medium text-gray-900">{plan.name}</h3>
                </div>
                
                <p className="text-[14px] text-gray-600 mb-6 min-h-[40px]">{plan.description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[16px] text-gray-900 font-normal">₹</span>
                  <span className="text-[44px] font-normal tracking-tight text-gray-900 leading-none">
                    {formatPrice(plan.perMonth)}
                  </span>
                  <span className="text-[14px] text-gray-600">/mo</span>
                </div>

                {/* Billing info */}
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-500">
                    {plan.period === "month"
                      ? "Billed monthly"
                      : plan.period === "quarter"
                        ? `₹${formatPrice(plan.price)} billed quarterly`
                        : `₹${formatPrice(plan.price)} billed yearly`}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGetStarted(plan.id);
                }}
                className={cn(
                  "w-full py-2.5 rounded text-[14px] font-medium transition-colors duration-200 mb-8",
                  style.button
                )}
              >
                Get Started
              </button>

              <hr className="border-gray-200 mb-6" />

              {/* Features */}
              <div className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check size={18} className="text-[#1e8e3e] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-[14px] text-gray-700 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-[24px] font-normal text-gray-900 mb-8 text-center">Frequently asked questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {[
            {
              q: "Can I switch plans later?",
              a: "Yes. You can upgrade or downgrade your plan at any time. We will prorate the difference.",
            },
            {
              q: "Is there a free trial?",
              a: "Every plan comes with a 7-day free trial. You won't be charged until the trial ends.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept UPI, credit/debit cards, net banking, and all major digital wallets.",
            },
            {
              q: "Can I get a refund?",
              a: "We offer a full refund within 14 days of your initial purchase. No questions asked.",
            },
          ].map((item) => (
            <div key={item.q} className="mb-4">
              <h4 className="text-[15px] font-medium text-gray-900 mb-2">{item.q}</h4>
              <p className="text-[14px] text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
