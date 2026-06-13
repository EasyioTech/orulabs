import { Zap, Sparkles, Crown } from "lucide-react";

export type PlanId = "monthly" | "quarterly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  period: "month" | "quarter" | "year";
  perMonth: number;
  savings: number | null;
  description: string;
  badge: string | null;
  features: string[];
  icon: typeof Zap;
}

export const plans: Plan[] = [
  {
    id: "monthly",
    name: "Starter",
    price: 1999,
    period: "month",
    perMonth: 1999,
    savings: null,
    description: "Perfect for getting started",
    badge: null,
    features: [
      "Unlimited trainings",
      "Up to 50 participants per session",
      "All interactive tools (polls, quizzes, whiteboard)",
      "Session analytics & reports",
      "Calendar integration",
      "Email support",
    ],
    icon: Zap,
  },
  {
    id: "quarterly",
    name: "Professional",
    price: 4999,
    period: "quarter",
    perMonth: 1666,
    savings: 17,
    description: "Most chosen by trainers",
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Up to 200 participants per session",
      "Advanced analytics dashboard",
      "Export data to Excel/CSV",
      "Custom branding",
      "Priority support",
      "Multi-workspace access",
    ],
    icon: Sparkles,
  },
  {
    id: "yearly",
    name: "Enterprise",
    price: 14999,
    period: "year",
    perMonth: 1250,
    savings: 37,
    description: "Best value for serious trainers",
    badge: "Best Value",
    features: [
      "Everything in Professional",
      "Unlimited participants",
      "White-label branding",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "Team collaboration tools",
      "SLA guarantee",
    ],
    icon: Crown,
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return plans.find((p) => p.id === id);
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN").format(amount);
}

export function getPeriodLabel(period: Plan["period"]) {
  switch (period) {
    case "month": return "Monthly";
    case "quarter": return "Quarterly";
    case "year": return "Yearly";
  }
}
