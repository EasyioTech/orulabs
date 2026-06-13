"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Shield,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  IndianRupee,
} from "lucide-react";
import { cn } from "@oruclass/utils";
import { plans, getPlan, formatPrice, getPeriodLabel, type PlanId } from "@/config/plans";
import { useAuth } from "@/hooks/useAuth";

type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

const paymentMethods = [
  { id: "upi" as const, label: "UPI", icon: Smartphone, hint: "Google Pay, PhonePe, Paytm" },
  { id: "card" as const, label: "Card", icon: CreditCard, hint: "Credit or Debit card" },
  { id: "netbanking" as const, label: "Net Banking", icon: Building2, hint: "All major banks" },
  { id: "wallet" as const, label: "Wallet", icon: Wallet, hint: "Paytm, Mobikwik, etc." },
];

export function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const planId = (searchParams.get("plan") as PlanId) || "quarterly";
  const plan = getPlan(planId) || plans[1];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const gstRate = 0.18;
  const subtotal = plan.price;
  const gstAmount = Math.round(subtotal * gstRate);
  const total = subtotal + gstAmount;

  function handleApplyCoupon() {
    // Placeholder — will validate via API later
    if (couponCode.trim()) {
      setCouponApplied(true);
    }
  }

  async function handlePayment() {
    setIsProcessing(true);

    // Razorpay integration point —
    // For now, simulate a short delay then redirect to success
    setTimeout(() => {
      router.push(
        `/subscription/success?plan=${plan.id}&amount=${total}&txn=TXN${Date.now()}`
      );
    }, 1500);
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/subscription"
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to plans
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Payment Form */}
        <div className="lg:col-span-3 space-y-5">
          <div>
            <h1 className="text-[24px] font-800 text-gray-900 tracking-[-0.02em] mb-1">
              Complete your purchase
            </h1>
            <p className="text-[13.5px] text-gray-500">
              You&apos;re subscribing to the {plan.name} plan
            </p>
          </div>

          {/* Account Info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em] mb-3">
              Account
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-700 text-[14px]">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-[14px] font-600 text-gray-900">{user?.name || "Trainer"}</p>
                <p className="text-[12.5px] text-gray-400">{user?.email || "trainer@example.com"}</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em] mb-3">
              Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-150 text-left",
                    paymentMethod === method.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <method.icon
                    size={18}
                    className={paymentMethod === method.id ? "text-brand-500" : "text-gray-400"}
                  />
                  <div>
                    <p className="text-[13px] font-600 text-gray-800">{method.label}</p>
                    <p className="text-[11px] text-gray-400">{method.hint}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* UPI ID input (shown when UPI selected) */}
            {paymentMethod === "upi" && (
              <div className="mt-4">
                <label className="text-[12.5px] font-500 text-gray-600 mb-1.5 block">
                  UPI ID
                </label>
                <input
                  type="text"
                  placeholder="yourname@upi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-[13.5px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* Card inputs (shown when Card selected) */}
            {paymentMethod === "card" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[12.5px] font-500 text-gray-600 mb-1.5 block">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-[13.5px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12.5px] font-500 text-gray-600 mb-1.5 block">
                      Expiry
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-[13.5px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[12.5px] font-500 text-gray-600 mb-1.5 block">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-[13.5px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[12.5px] font-500 text-gray-600 mb-1.5 block">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-[13.5px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Coupon */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em] mb-3">
              Have a coupon?
            </h3>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={couponApplied}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-[13.5px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || couponApplied}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-[13px] font-600 transition-all",
                  couponApplied
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-100 disabled:text-gray-400"
                )}
              >
                {couponApplied ? "Applied!" : "Apply"}
              </button>
            </div>
          </div>
        </div>

        {/* Right — Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-xl p-5 lg:sticky lg:top-6">
            <h3 className="text-[13px] font-600 text-gray-400 uppercase tracking-[0.06em] mb-4">
              Order Summary
            </h3>

            {/* Selected Plan */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
                <plan.icon size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-700 text-gray-900">{plan.name}</p>
                <p className="text-[12px] text-gray-400">{getPeriodLabel(plan.period)} plan</p>
              </div>
              {plan.badge && (
                <span
                  className={cn(
                    "text-[10px] font-600 px-2 py-0.5 rounded-full",
                    plan.badge === "Most Popular"
                      ? "bg-brand-50 text-brand-600"
                      : "bg-amber-50 text-amber-600"
                  )}
                >
                  {plan.badge}
                </span>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="py-4 space-y-2.5 border-b border-gray-100">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-800 font-500">₹{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">GST (18%)</span>
                <span className="text-gray-800 font-500">₹{formatPrice(gstAmount)}</span>
              </div>
              {plan.savings && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-emerald-600">You save</span>
                  <span className="text-emerald-600 font-500">{plan.savings}% off monthly</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <span className="text-[14px] font-700 text-gray-900">Total</span>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <IndianRupee size={16} className="text-gray-900" strokeWidth={2.5} />
                  <span className="text-[22px] font-800 text-gray-900">{formatPrice(total)}</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {plan.period === "month"
                    ? "per month"
                    : plan.period === "quarter"
                      ? "every 3 months"
                      : "per year"}
                </p>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className={cn(
                "w-full mt-4 py-3 rounded-xl text-[14px] font-700 transition-all duration-200 flex items-center justify-center gap-2",
                isProcessing
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-md"
              )}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Pay ₹{formatPrice(total)}
                </>
              )}
            </button>

            {/* Trust */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-[11.5px] text-gray-400">
                <Shield size={12} className="text-emerald-500" />
                256-bit SSL encrypted payment
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-gray-400">
                <Check size={12} className="text-emerald-500" />
                14-day money-back guarantee
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-gray-400">
                <Check size={12} className="text-emerald-500" />
                Cancel anytime, no questions asked
              </div>
            </div>

            {/* Change plan link */}
            <div className="mt-4 text-center">
              <Link
                href="/subscription"
                className="text-[12px] text-brand-500 hover:text-brand-600 font-500"
              >
                Change plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
