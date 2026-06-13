"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  ArrowUpRight,
  Calendar,
  Receipt,
  AlertTriangle,
  Check,
  Download,
  ChevronRight,
  Sparkles,
  Shield,
} from "lucide-react";
import { cn } from "@oruclass/utils";
import { plans, formatPrice, getPeriodLabel } from "@/config/plans";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStore } from "@/store/subscription";
import { useRouter } from "next/navigation";

type Tab = "overview" | "invoices";

export function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { planId: subPlanId, status: subStatus, subscribedAt, expiresAt, transactionId, cancel } = useSubscriptionStore();
  const isPro = subStatus === "active";

  useEffect(() => {
    if (!isPro || !subPlanId) {
      router.push("/subscription");
    }
  }, [isPro, subPlanId, router]);

  if (!isPro || !subPlanId) {
    return null;
  }

  const currentPlan = plans.find((p) => p.id === subPlanId)!;
  const gstAmount = Math.round(currentPlan.price * 0.18);
  const totalWithGst = currentPlan.price + gstAmount;

  const invoices = subscribedAt
    ? [
        {
          id: transactionId || "INV-001",
          date: subscribedAt,
          amount: totalWithGst,
          status: "paid" as const,
          plan: `${currentPlan.name} (${getPeriodLabel(currentPlan.period)})`,
        },
      ]
    : [];

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(expiresAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-800 text-gray-900 tracking-[-0.02em] mb-1">
          Billing & Subscription
        </h1>
        <p className="text-[13.5px] text-gray-500">Manage your plan, payment methods, and invoices</p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-brand-600 rounded-xl p-5 md:p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <currentPlan.icon size={18} strokeWidth={2} />
              <span className="text-[13px] font-600 text-white/80">Current Plan</span>
            </div>
            <h2 className="text-[22px] font-800 mb-1">{currentPlan.name}</h2>
            <p className="text-[13px] text-white/70">
              ₹{formatPrice(currentPlan.perMonth)}/mo · Billed {getPeriodLabel(currentPlan.period).toLowerCase()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm">
              <p className="text-[22px] font-800">{daysRemaining}</p>
              <p className="text-[11px] text-white/70 font-500">days left</p>
            </div>
            <Link
              href="/subscription"
              className="bg-white text-brand-600 px-4 py-2.5 rounded-xl text-[13px] font-600 hover:bg-white/90 transition-all flex items-center gap-1.5"
            >
              Change Plan
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[
          { id: "overview" as const, label: "Overview", icon: CreditCard },
          { id: "invoices" as const, label: "Invoices", icon: Receipt },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-500 transition-all",
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm font-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Subscription Details */}
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
            <div className="p-5">
              <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em] mb-4">
                Subscription Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Plan</span>
                  <span className="text-gray-800 font-500">
                    {currentPlan.name} ({getPeriodLabel(currentPlan.period)})
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Billing amount</span>
                  <span className="text-gray-800 font-500">
                    ₹{formatPrice(totalWithGst)} (incl. GST)
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Current period</span>
                  <span className="text-gray-800 font-500">
                    {new Date(subscribedAt!).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    –{" "}
                    {new Date(expiresAt!).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Auto-renewal</span>
                  <span className="text-gray-800 font-500 flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-500" />
                    Enabled
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-5">
              <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em] mb-4">
                Payment Method
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <CreditCard size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-600 text-gray-800">UPI</p>
                    <p className="text-[12px] text-gray-400">
                      {user?.email?.split("@")[0] || "user"}@upi
                    </p>
                  </div>
                </div>
                <button className="text-[12.5px] text-brand-500 hover:text-brand-600 font-500">
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em] mb-4">
              Plan Usage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Trainings Created",
                  value: "—",
                  limit: currentPlan.id === "monthly" ? "Unlimited" : "Unlimited",
                },
                {
                  label: "Participants / Session",
                  value: "—",
                  limit:
                    currentPlan.id === "monthly"
                      ? "50 max"
                      : currentPlan.id === "quarterly"
                        ? "200 max"
                        : "Unlimited",
                },
                {
                  label: "Workspaces",
                  value: "—",
                  limit: currentPlan.id === "monthly" ? "1" : "Unlimited",
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[11.5px] text-gray-400 font-500 mb-1">{stat.label}</p>
                  <p className="text-[20px] font-700 text-gray-900">{stat.value}</p>
                  <p className="text-[11px] text-gray-400">of {stat.limit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA (show if not on yearly) */}
          {currentPlan.id !== "yearly" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-600 text-gray-900">
                  Save more with the {currentPlan.id === "monthly" ? "Quarterly" : "Yearly"} plan
                </p>
                <p className="text-[12.5px] text-gray-500">
                  {currentPlan.id === "monthly"
                    ? "Save 17% — ₹1,666/mo instead of ₹1,999/mo"
                    : "Save 37% — ₹1,250/mo instead of ₹1,666/mo"}
                </p>
              </div>
              <Link
                href="/subscription"
                className="px-4 py-2 rounded-xl text-[12.5px] font-600 bg-amber-500 text-white hover:bg-amber-600 transition-all flex-shrink-0"
              >
                Upgrade
              </Link>
            </div>
          )}

          {/* Cancel */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-600 text-gray-900">Cancel Subscription</p>
                <p className="text-[12.5px] text-gray-400">
                  You&apos;ll retain access until{" "}
                  {new Date(expiresAt!).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 rounded-xl text-[12.5px] font-600 border border-red-200 text-red-500 hover:bg-red-50 transition-all"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-white border border-gray-100 rounded-xl">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em]">
              Billing History
            </h3>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] text-gray-500 font-500">No invoices yet</p>
              <p className="text-[12.5px] text-gray-400">
                Your billing history will appear here after your first payment
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Receipt size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-600 text-gray-800">{invoice.plan}</p>
                      <p className="text-[12px] text-gray-400">
                        {new Date(invoice.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {invoice.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[13px] font-600 text-gray-800">
                        ₹{formatPrice(invoice.amount)}
                      </p>
                      <span className="text-[11px] font-500 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Paid
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-md">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="text-[18px] font-700 text-gray-900 text-center mb-2">
              Cancel your subscription?
            </h3>
            <p className="text-[13.5px] text-gray-500 text-center mb-6 leading-relaxed">
              You&apos;ll lose access to {currentPlan.name} features at the end of your current billing
              period. You can resubscribe anytime.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-[12.5px] text-gray-600 mb-2 font-500">You&apos;ll lose access to:</p>
              <div className="space-y-1.5">
                {currentPlan.features.slice(0, 4).map((f) => (
                  <p key={f} className="text-[12px] text-gray-400 flex items-center gap-2">
                    <span className="text-red-400">×</span> {f}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-600 bg-brand-500 text-white hover:bg-brand-600 transition-all"
              >
                Keep My Plan
              </button>
              <button
                onClick={() => {
                  cancel();
                  setShowCancelModal(false);
                  router.push("/subscription");
                }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-600 border border-gray-100 text-gray-600 hover:bg-gray-50 transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
