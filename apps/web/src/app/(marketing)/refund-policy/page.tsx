import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — OruLabs",
  description: "OruLabs refund and cancellation policy for subscriptions and paid plans.",
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: June 10, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Overview</h2>
          <p className="text-gray-600 leading-relaxed">
            OruLabs (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is operated by OruLabs Technologies. This Refund Policy
            governs all purchases made on orulabs.in and is governed by the Consumer Protection
            Act, 2019 (India).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Subscription Plans</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            OruLabs offers monthly and annual subscription plans. All subscriptions are billed in
            advance and provide access to the platform for the duration of the billing period.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>
              <strong>Monthly plans:</strong> You may cancel at any time. Your access continues
              until the end of the current billing period. No partial refunds are issued for unused
              days within a monthly cycle.
            </li>
            <li>
              <strong>Annual plans:</strong> If you cancel within 7 days of purchase and have not
              used the platform (zero training sessions conducted), you are eligible for a full
              refund. After 7 days or after any usage, annual plans are non-refundable.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Eligibility for Refund</h2>
          <p className="text-gray-600 leading-relaxed mb-3">You may be eligible for a refund if:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>You were charged twice for the same billing period (duplicate charge).</li>
            <li>
              You were charged after cancelling your subscription and we have confirmed the
              cancellation was processed before the charge date.
            </li>
            <li>
              A technical failure on our platform prevented you from accessing core features for
              more than 72 consecutive hours and we were unable to resolve it.
            </li>
            <li>
              You are on an annual plan and request a refund within 7 days of purchase with zero
              usage.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Non-Refundable Situations</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Change of mind after purchase.</li>
            <li>Failure to cancel before the next billing cycle renews.</li>
            <li>Partial use of the subscription period.</li>
            <li>Violation of our Terms of Service resulting in account suspension.</li>
            <li>Free trial periods (no charge applies).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. How to Request a Refund</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            To request a refund, email us at{" "}
            <a href="mailto:support@orulabs.in" className="text-brand-600 hover:underline">
              support@orulabs.in
            </a>{" "}
            with:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Your registered email address.</li>
            <li>The date of the charge and the amount.</li>
            <li>The reason for the refund request.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            We will respond within 3 business days. Approved refunds are processed within 7–10
            business days and credited back to your original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Cancellation</h2>
          <p className="text-gray-600 leading-relaxed">
            You can cancel your subscription at any time from your account settings under
            Billing. Cancellation stops future charges. You retain access until the end of the
            current paid period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            For any billing or refund queries, contact us at{" "}
            <a href="mailto:support@orulabs.in" className="text-brand-600 hover:underline">
              support@orulabs.in
            </a>
            . We aim to resolve all disputes fairly and promptly in accordance with applicable
            Indian consumer protection law.
          </p>
        </section>
      </div>
    </div>
  );
}
