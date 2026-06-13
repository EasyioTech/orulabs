"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@oruclass/utils";
import { plans, formatPrice, type PlanId } from "@/config/plans";

const tierStyle: Record<PlanId, {
  accent: string;
  accentLight: string;
  badge: string;
  iconBg: string;
  iconColor: string;
  cta: string;
  ctaHover: string;
  check: string;
  checkBg: string;
  savings: string;
  ring: string;
  cardBg: string;
}> = {
  monthly: {
    accent: "text-gray-900",
    accentLight: "text-gray-500",
    badge: "",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    cta: "bg-brand-600 text-white",
    ctaHover: "hover:bg-brand-700",
    check: "text-gray-500",
    checkBg: "bg-gray-100",
    savings: "",
    ring: "border-gray-200 hover:border-gray-300",
    cardBg: "bg-white",
  },
  quarterly: {
    accent: "text-emerald-700",
    accentLight: "text-emerald-600",
    badge: "bg-emerald-600 text-white",
    iconBg: "bg-emerald-600",
    iconColor: "text-white",
    cta: "bg-emerald-600 text-white",
    ctaHover: "hover:bg-emerald-700",
    check: "text-emerald-600",
    checkBg: "bg-emerald-50",
    savings: "text-emerald-700 bg-emerald-50",
    ring: "border-emerald-300 shadow-sm",
    cardBg: "bg-white",
  },
  yearly: {
    accent: "text-gray-900",
    accentLight: "text-gray-600",
    badge: "bg-gray-700 text-white",
    iconBg: "bg-gray-700",
    iconColor: "text-white",
    cta: "bg-brand-600 text-white",
    ctaHover: "hover:bg-brand-700",
    check: "text-gray-600",
    checkBg: "bg-gray-100",
    savings: "text-gray-700 bg-gray-100",
    ring: "border-gray-300 hover:border-gray-400",
    cardBg: "bg-gray-50/40",
  },
};

function StarterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function ProIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function EnterpriseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

const tierIcons: Record<PlanId, () => ReactElement> = {
  monthly: StarterIcon,
  quarterly: ProIcon,
  yearly: EnterpriseIcon,
};

export function PricingPage({ onGetStarted }: { onGetStarted?: (planId: PlanId) => void } = {}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("quarterly");
  const router = useRouter();

  function handleGetStarted(planId: PlanId) {
    if (onGetStarted) { onGetStarted(planId); return; }
    router.push(`/subscription/checkout?plan=${planId}`);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[12px] font-600 text-emerald-600 tracking-[0.08em] uppercase mb-3">
          Pricing
        </p>
        <h1 className="text-[28px] md:text-[36px] font-800 text-gray-900 tracking-[-0.02em] mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-[15px] text-gray-500 max-w-md mx-auto leading-relaxed">
          Choose the plan that fits your training needs. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isPopular = plan.badge === "Most Popular";
          const style = tierStyle[plan.id];
          const TierIcon = tierIcons[plan.id];

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-200",
                style.cardBg,
                isPopular
                  ? style.ring
                  : isSelected
                    ? "border-gray-300 shadow-md"
                    : style.ring
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-700 px-3.5 py-1 rounded-full tracking-wide",
                    style.badge
                  )}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      style.iconBg, style.iconColor
                    )}
                  >
                    <TierIcon />
                  </div>
                  <div>
                    <h3 className={cn("text-[15px] font-700", style.accent)}>{plan.name}</h3>
                    <p className="text-[11.5px] text-gray-400">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[13px] text-gray-400 font-500">₹</span>
                  <span className={cn("text-[38px] font-800 tracking-[-0.03em] leading-none", style.accent)}>
                    {formatPrice(plan.perMonth)}
                  </span>
                  <span className="text-[13px] text-gray-400 font-500">/mo</span>
                </div>

                {/* Billing info */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[12.5px] text-gray-500">
                    {plan.period === "month"
                      ? "Billed monthly"
                      : plan.period === "quarter"
                        ? `₹${formatPrice(plan.price)} billed quarterly`
                        : `₹${formatPrice(plan.price)} billed yearly`}
                  </span>
                  {plan.savings && (
                    <span className={cn("text-[11px] font-600 px-2 py-0.5 rounded-full", style.savings)}>
                      Save {plan.savings}%
                    </span>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGetStarted(plan.id);
                }}
                className={cn(
                  "w-full py-2.5 rounded-xl text-[13.5px] font-600 transition-all duration-200 flex items-center justify-center gap-2 mb-5",
                  style.cta, style.ctaHover
                )}
              >
                Get Started
                <ArrowRight size={14} />
              </button>

              {/* Features */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-600 text-gray-400 uppercase tracking-[0.06em]">
                  What&apos;s included
                </p>
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", style.checkBg)}>
                      <Check size={10} className={style.check} strokeWidth={3} />
                    </div>
                    <span className="text-[13px] text-gray-600 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Signals */}
      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-6 text-[12.5px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-500" strokeWidth={2.5} />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-500" strokeWidth={2.5} />
            Cancel anytime
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-500" strokeWidth={2.5} />
            7-day free trial
          </span>
        </div>
      </div>

      {/* FAQ-lite */}
      <div className="mt-12 bg-gray-50 rounded-xl p-6 md:p-8">
        <h2 className="text-[18px] font-700 text-gray-900 mb-5">Common questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              q: "Can I switch plans later?",
              a: "Yes! Upgrade or downgrade anytime. We'll prorate the difference.",
            },
            {
              q: "Is there a free trial?",
              a: "Every plan comes with a 7-day free trial. No payment required to start.",
            },
            {
              q: "What payment methods do you accept?",
              a: "UPI, credit/debit cards, net banking, and all major wallets.",
            },
            {
              q: "Can I get a refund?",
              a: "Yes, we offer a full refund within 14 days of purchase. No questions asked.",
            },
          ].map((item) => (
            <div key={item.q}>
              <h4 className="text-[13.5px] font-600 text-gray-800 mb-1">{item.q}</h4>
              <p className="text-[13px] text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
