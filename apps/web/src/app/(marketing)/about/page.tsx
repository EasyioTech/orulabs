import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — OruLabs",
  description: "Learn about OruLabs — the live training platform built for modern facilitators and trainers.",
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      {/* Hero */}
      <div className="mb-14">
        <p className="text-[11px] font-700 text-emerald-600 tracking-[0.1em] uppercase mb-3">About OruLabs</p>
        <h1 className="text-[36px] font-800 text-gray-900 tracking-[-0.02em] leading-tight mb-4">
          Live training, built for people who teach for real.
        </h1>
        <p className="text-[16px] text-gray-500 leading-relaxed">
          OruLabs is a live training platform designed for facilitators, corporate trainers, and educators
          who run structured sessions — not just video calls. Every feature exists to make live instruction
          smoother: from interactive modules and real-time responses to analytics that tell you what actually landed.
        </p>
      </div>

      {/* Story */}
      <section className="mb-12">
        <h2 className="text-[20px] font-700 text-gray-900 mb-3">Why we built this</h2>
        <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
          <p>
            Most training tools are built for meetings, not learning. Trainers working in corporate L&amp;D,
            coaching, or vocational education end up stitching together Zoom, Google Forms, spreadsheets,
            and email — losing participant engagement at every seam.
          </p>
          <p>
            We built OruLabs to be the single place where a facilitator can design a training, run it live
            with real-time interaction, track who&apos;s following along, and export everything they need for
            reporting — without switching tabs.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-12">
        <h2 className="text-[20px] font-700 text-gray-900 mb-5">What we stand for</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              title: "Facilitation-first",
              body: "Every design decision starts with the facilitator, not the attendee. If it slows you down on stage, it doesn't ship.",
            },
            {
              title: "Real interaction, not polls",
              body: "Responses, whiteboards, and live progress — not just thumbs up reactions bolted on top of a slide deck.",
            },
            {
              title: "Honest pricing",
              body: "No per-seat pricing that punishes you for having a large class. One trainer, one subscription.",
            },
            {
              title: "Built in India, for India",
              body: "INR pricing, UPI payments, DPDP Act compliance, and support in your timezone — not a US product with an Indian sales page.",
            },
          ].map((v) => (
            <div key={v.title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <h3 className="text-[14px] font-700 text-gray-900 mb-1.5">{v.title}</h3>
              <p className="text-[13.5px] text-gray-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="border-t border-gray-100 pt-10">
        <h2 className="text-[18px] font-700 text-gray-900 mb-2">Get in touch</h2>
        <p className="text-[14.5px] text-gray-500 mb-4">
          Questions, partnerships, or feedback — we read every email.
        </p>
        <a
          href="mailto:hello@orulabs.in"
          className="inline-flex items-center gap-2 text-[14px] font-600 text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          hello@orulabs.in
        </a>
      </section>
    </main>
  );
}
