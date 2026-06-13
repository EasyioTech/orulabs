import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — OruLabs",
  description: "How OruLabs uses cookies and similar tracking technologies.",
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: June 10, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. What Are Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            Cookies are small text files placed on your device when you visit a website. They help
            websites remember your preferences, keep you logged in, and understand how you use the
            site. OruLabs uses cookies and similar technologies to provide and improve our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Cookies We Use</h2>

          <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">Strictly Necessary</h3>
          <p className="text-gray-600 leading-relaxed mb-2">
            These cookies are required for the platform to function. You cannot opt out of them.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>
              <strong>refresh_token</strong> — httpOnly cookie storing your authentication session.
              Expires after 365 days or when you log out.
            </li>
          </ul>

          <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">Functional</h3>
          <p className="text-gray-600 leading-relaxed mb-2">
            These cookies remember your preferences to improve your experience.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>
              <strong>Workspace preference</strong> — remembers your last selected workspace across
              sessions (localStorage).
            </li>
          </ul>

          <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">Analytics (Optional)</h3>
          <p className="text-gray-600 leading-relaxed">
            We do not currently use third-party analytics or advertising cookies. If we add
            analytics in the future, we will update this policy and request your consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Managing Cookies</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            You can control cookies through your browser settings. Note that disabling necessary
            cookies (like the authentication cookie) will prevent you from staying logged in.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To log out and clear your session cookie, use the logout option in your account menu.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed">
            When you make a payment, Razorpay may set cookies on their payment page. Please refer
            to{" "}
            <a
              href="https://razorpay.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Razorpay&apos;s Privacy Policy
            </a>{" "}
            for details on their cookie use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Cookie Policy from time to time. We will notify you of significant
            changes by updating the date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            Questions about our cookie use? Email us at{" "}
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
