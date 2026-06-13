import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — OruLabs",
  description: "Terms and conditions governing use of the OruLabs platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: June 10, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By creating an account or using the OruLabs platform (&quot;Service&quot;), you agree to these
            Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Service. These Terms
            are governed by the laws of India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Service Description</h2>
          <p className="text-gray-600 leading-relaxed">
            OruLabs is an online platform for creating and conducting live training sessions,
            workshops, and interactive modules. Features include live rooms, participant management,
            module libraries, and facilitation tools.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Account Registration</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the security of your password.</li>
            <li>You must be at least 18 years old or have parental/guardian consent to use the Service.</li>
            <li>One person may not maintain more than one free account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Acceptable Use</h2>
          <p className="text-gray-600 leading-relaxed mb-3">You agree not to:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Use the Service for any unlawful purpose or in violation of applicable Indian law.</li>
            <li>Upload or share content that is illegal, harmful, harassing, defamatory, or infringes third-party rights.</li>
            <li>Attempt to gain unauthorised access to any part of the Service or another user&apos;s account.</li>
            <li>Reverse-engineer, decompile, or disassemble any part of the Service.</li>
            <li>Use automated scripts to access or scrape the Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Subscriptions and Billing</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Paid features require a subscription. By subscribing, you authorise us to charge your
            payment method on a recurring basis until you cancel. Prices are in Indian Rupees (INR)
            and inclusive of applicable taxes.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Refunds are governed by our{" "}
            <a href="/refund-policy" className="text-brand-600 hover:underline">Refund Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            OruLabs and its content (excluding user-generated content) are owned by OruLabs
            Technologies and protected by applicable intellectual property law. You retain ownership
            of content you create using the Service, and grant OruLabs a limited licence to host and
            display that content as necessary to provide the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Termination</h2>
          <p className="text-gray-600 leading-relaxed">
            We may suspend or terminate your account if you violate these Terms, engage in fraudulent
            activity, or misuse the Service. You may delete your account at any time from your
            account settings. Upon termination, your right to use the Service ceases immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Disclaimers and Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent
            permitted by applicable law, OruLabs shall not be liable for indirect, incidental,
            special, or consequential damages arising from use of the Service.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our total liability to you for any claim shall not exceed the amount paid by you to
            OruLabs in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Governing Law and Disputes</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms are governed by the laws of India. Any disputes shall be subject to the
            exclusive jurisdiction of the courts of Aligarh, Uttar Pradesh, India. We encourage you
            to contact us first to resolve any issues amicably.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update these Terms. Continued use of the Service after changes take effect
            constitutes acceptance of the revised Terms. Material changes will be communicated with
            at least 14 days notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For any questions about these Terms, email{" "}
            <a href="mailto:support@orulabs.in" className="text-brand-600 hover:underline">
              support@orulabs.in
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
