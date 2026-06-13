"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
const testimonials = [
  {
    quote: "OruLabs completely changed how I deliver my workshops. The engagement level is off the charts.",
    author: "Aadil Bhat",
    role: "Corporate Trainer",
  },
  {
    quote: "I used to spend hours grading paper quizzes after a session. Now I get instant analytics before I even leave the room.",
    author: "Priya Sharma",
    role: "Lead Instructor",
  },
  {
    quote: "The seamless experience without needing participants to download an app is a game changer for quick onboarding.",
    author: "Tariq Dar",
    role: "Facilitator",
  },
  {
    quote: "It's so simple to use, yet incredibly powerful. My students actually look forward to our interactive sessions now.",
    author: "Dr. Rajesh Kumar",
    role: "University Professor",
  },
  {
    quote: "I've tried every platform out there. Nothing comes close to the elegance and reliability of OruLabs.",
    author: "Meenakshi Iyer",
    role: "Learning & Development Manager",
  },
  {
    quote: "The ability to instantly see who is falling behind during a live lecture has completely transformed my teaching.",
    author: "Dr. Sameer Wani",
    role: "Senior Lecturer",
  },
  {
    quote: "An absolute lifesaver for hybrid training environments. Remote students feel just as involved as those in the room.",
    author: "Ananya Desai",
    role: "Hybrid Coach",
  },
  {
    quote: "I was skeptical at first, but the interactive widgets and polls keep my audience glued to their screens.",
    author: "Imran Lone",
    role: "Workshop Creator",
  },
  {
    quote: "The best investment our university has made this year. Student satisfaction scores have skyrocketed.",
    author: "Dr. Kavita Reddy",
    role: "Dean of Innovation",
  },
  {
    quote: "Finally, a platform that doesn't feel like it was built in the 90s. The design and UX are simply gorgeous.",
    author: "Rohan Mehta",
    role: "Design Lead",
  }
];

export function HowItWorksSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.1 }}
      className="min-h-[100dvh] w-full  relative flex flex-col items-center justify-center overflow-hidden bg-[#fafafa] py-20"
    >
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 md:mb-16 text-center px-6 md:px-12"
        >
          <motion.div
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm cursor-default"
          >
            <MessageSquare className="w-6 h-6 text-brand-600" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1]">
            Don't just take our word for it. <br className="hidden md:block" />
            <span className="text-gray-400 transition-colors duration-500 hover:text-gray-600">See what students say.</span>
          </h2>
        </motion.div>

        {/* Horizontal Snapping Carousel */}
        <div className="w-full relative">
          <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 px-6 md:px-12 pb-12 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: false, margin: "-10%" }}
                transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.02, y: -5, transition: { duration: 0.2 } }}
                className="snap-center shrink-0 w-[85vw] sm:w-[400px] md:w-[500px] flex flex-col justify-between p-8 md:p-10 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-lg md:text-xl text-gray-800 font-light leading-relaxed mb-8">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-medium text-lg">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">{testimonial.author}</h4>
                    <p className="text-xs md:text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {/* Spacer for proper right padding on scroll */}
            <div className="w-2 md:w-6 shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
