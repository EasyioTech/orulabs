"use client";

import { motion, type Variants } from "framer-motion";

export function QuoteSection() {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.5,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(12px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section className="min-h-[100dvh] w-full  relative flex flex-col justify-center items-center bg-gray-50 overflow-hidden py-24 px-6 md:px-12">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-100/50 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.4 }}
        className="max-w-4xl mx-auto z-10 w-full flex flex-col items-center text-center"
      >
        <motion.div
          variants={itemVariants}
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-10"
        >
          How do we train our teachers?
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="text-xl sm:text-2xl md:text-3xl text-gray-500 font-light mb-12 space-y-4 px-2"
        >
          <p>Not with <span className="text-gray-400 line-through decoration-red-400/60">passive recorded videos.</span></p>
          <p>Not through <span className="text-gray-400 line-through decoration-red-400/60">silent webinars.</span></p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="text-3xl sm:text-4xl md:text-6xl font-semibold text-gray-900 leading-[1.15] tracking-tight"
        >
          With <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-500">real-time, interactive</span> live classrooms.
        </motion.div>
      </motion.div>
    </section>
  );
}
