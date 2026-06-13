import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanId } from "@/config/plans";

interface SubscriptionState {
  planId: PlanId | null;
  status: "free" | "active" | "cancelled" | "expired";
  subscribedAt: string | null;
  expiresAt: string | null;
  transactionId: string | null;

  activate: (planId: PlanId, txnId: string) => void;
  cancel: () => void;
  reset: () => void;
  isPro: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      planId: null,
      status: "free",
      subscribedAt: null,
      expiresAt: null,
      transactionId: null,

      activate: (planId, txnId) => {
        const now = new Date();
        const expires = new Date(now);
        if (planId === "monthly") expires.setMonth(expires.getMonth() + 1);
        else if (planId === "quarterly") expires.setMonth(expires.getMonth() + 3);
        else expires.setFullYear(expires.getFullYear() + 1);

        set({
          planId,
          status: "active",
          subscribedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          transactionId: txnId,
        });
      },

      cancel: () => set({ status: "cancelled" }),

      reset: () =>
        set({
          planId: null,
          status: "free",
          subscribedAt: null,
          expiresAt: null,
          transactionId: null,
        }),

      isPro: () => get().status === "active",
    }),
    { name: "oruclass-subscription" },
  ),
);
