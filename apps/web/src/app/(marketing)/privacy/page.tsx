import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — OruLabs",
  description: "How OruLabs collects, uses, and protects your personal data. Compliant with India's DPDP Act 2023.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: June 10, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Who We Are</h2>
          <p className="text-gray-600 leading-relaxed">
            OruLabs (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an online training and live session platform operated
            by OruLabs Technologies, accessible at orulabs.in. This Privacy Policy explains how we
            collect, use, store, and share your personal data in accordance with India&apos;s Digital
            Personal Data Protection Act, 2023 (DPDP Act).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Data We Collect</h2>
          <p className="text-gray-600 leading-relaxed mb-3">We collect the following categories of data:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Account data:</strong> Name, email address, and password (stored as a bcrypt hash).</li>
            <li><strong>Session data:</strong> IP address, browser/device type, and session timestamps for security purposes.</li>
            <li><strong>Training data:</strong> Training sessions you create or attend, modules, participant lists, and activity logs.</li>
            <li><strong>Usage data:</strong> Pages visited, features used, and error logs to improve the service.</li>
            <li><strong>Payment data:</strong> Billing address and payment method details (processed by our payment provider; we do not store card numbers).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>To provide, operate, and improve the OruLabs platform.</li>
            <li>To authenticate you and maintain session security.</li>
            <li>To send transactional emails (verification, invitations, receipts).</li>
            <li>To process subscription payments and issue invoices.</li>
            <li>To detect and prevent fraud, abuse, and security incidents.</li>
            <li>To comply with applicable legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your account data for as long as your account is active. If you delete your
            account, your personal data is deleted within 30 days, except where retention is required
            by law (e.g., financial records for 7 years under the Income Tax Act). Anonymised
            aggregate usage statistics may be retained indefinitely.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data Sharing</h2>
          <p className="text-gray-600 leading-relaxed mb-3">We do not sell your personal data. We share data only with:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Infrastructure providers:</strong> Cloud hosting and storage (data remains within our control).</li>
            <li><strong>Email delivery:</strong> Transactional email service to send you notifications you request.</li>
            <li><strong>Payment processors:</strong> To complete subscription billing.</li>
            <li><strong>Legal authorities:</strong> When required by a valid court order or applicable law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights (DPDP Act 2023)</h2>
          <p className="text-gray-600 leading-relaxed mb-3">Under India&apos;s DPDP Act, you have the right to:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Erasure:</strong> Request deletion of your account and associated data.</li>
            <li><strong>Grievance redressal:</strong> File a complaint if you believe your data rights have been violated.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            To exercise these rights, email{" "}
            <a href="mailto:privacy@orulabs.in" className="text-brand-600 hover:underline">
              privacy@orulabs.in
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use cookies for authentication (httpOnly session cookie) and basic analytics. See our{" "}
            <a href="/cookie-policy" className="text-brand-600 hover:underline">Cookie Policy</a>{" "}
            for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We use industry-standard security measures including TLS encryption in transit, bcrypt
            password hashing, and httpOnly cookies to protect your data. No system is 100% secure;
            please use a strong, unique password.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this policy from time to time. Material changes will be communicated via
            email or a notice on our website at least 14 days before they take effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For privacy inquiries or to exercise your rights, contact our Data Protection Officer at{" "}
            <a href="mailto:privacy@orulabs.in" className="text-brand-600 hover:underline">
              privacy@orulabs.in
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
