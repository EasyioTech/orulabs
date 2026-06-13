"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Download, Calendar, Sparkles } from "lucide-react";
import { getPlan, formatPrice, getPeriodLabel, type PlanId } from "@/config/plans";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStore } from "@/store/subscription";

export function SuccessPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activate, status } = useSubscriptionStore();

  const planId = (searchParams.get("plan") as PlanId) || "quarterly";
  const amount = searchParams.get("amount") || "0";
  const txnId = searchParams.get("txn") || "—";

  // Activate subscription on mount — the moment they land here, they're PRO
  useEffect(() => {
    if (status !== "active") {
      activate(planId, txnId);
    }
  }, [planId, txnId, activate, status]);
  const plan = getPlan(planId);

  if (!plan) return null;

  const today = new Date();
  const renewDate = new Date(today);
  if (plan.period === "month") renewDate.setMonth(renewDate.getMonth() + 1);
  else if (plan.period === "quarter") renewDate.setMonth(renewDate.getMonth() + 3);
  else renewDate.setFullYear(renewDate.getFullYear() + 1);

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-[26px] font-800 text-gray-900 tracking-[-0.02em] mb-2">
          You&apos;re all set!
        </h1>
        <p className="text-[14px] text-gray-500">
          Welcome to OruLabs <span className="font-600 text-brand-600">{plan.name}</span>
        </p>
      </div>

      {/* Receipt Card */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 text-left mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em]">
            Payment Receipt
          </h3>
          <button className="flex items-center gap-1.5 text-[12px] text-brand-500 hover:text-brand-600 font-500">
            <Download size={12} />
            Download
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-[13px]">
            <span className="text-gray-500">Plan</span>
            <span className="text-gray-800 font-600">
              {plan.name} ({getPeriodLabel(plan.period)})
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-gray-500">Amount paid</span>
            <span className="text-gray-800 font-600">₹{formatPrice(Number(amount))}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-gray-500">Transaction ID</span>
            <span className="text-gray-800 font-500 font-mono text-[12px]">{txnId}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-gray-500">Billed to</span>
            <span className="text-gray-800 font-500">{user?.email || "—"}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-800 font-500">
              {today.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between text-[13px]">
            <span className="text-gray-500">Next renewal</span>
            <span className="text-gray-800 font-500">
              {renewDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-brand-50 rounded-xl p-5 mb-6 text-left">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={15} className="text-brand-500" />
          <h3 className="text-[14px] font-700 text-gray-900">What&apos;s next?</h3>
        </div>
        <div className="space-y-2.5">
          {[
            "Create your first training from the dashboard",
            "Invite participants via link, QR code, or 6-digit code",
            "Go live and engage with interactive tools",
          ].map((step, i) => (
            <div key={step} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-[13px] text-gray-700">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="flex-1 py-2.5 rounded-xl text-[13.5px] font-600 bg-brand-500 text-white hover:bg-brand-600 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          Go to Dashboard
          <ArrowRight size={14} />
        </Link>
        <Link
          href="/subscription/billing"
          className="flex-1 py-2.5 rounded-xl text-[13.5px] font-600 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          <Calendar size={14} />
          Manage Billing
        </Link>
      </div>
    </div>
  );
}
