"use client";

import { useRouter } from "next/navigation";
import { PricingPage } from "./PricingPage";
import type { PlanId } from "@/config/plans";

export function PublicPricingPage() {
  const router = useRouter();
  function handleGetStarted(planId: PlanId) {
    router.push(`/signup?returnTo=${encodeURIComponent(`/subscription/checkout?plan=${planId}`)}`);
  }
  return <PricingPage onGetStarted={handleGetStarted} />;
}
