"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";

export function FinalCTASection() {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.1 }}
      className="min-h-[100dvh] w-full  relative flex items-center justify-center bg-gray-50 overflow-hidden py-20"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            whileHover={{ scale: 1.05 , transition: { duration: 0.2 }} }
            className="inline-flex items-center justify-center p-4 mb-8 rounded-full bg-white border border-gray-100 shadow-sm cursor-default"
          >
            <Rocket className="w-8 h-8 text-brand-600" />
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.05] mb-6">
            Ready to teach <br className="hidden md:block" />
            <span className="text-gray-400">differently?</span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-light px-2">
            Join thousands of educators who have already transformed their classrooms into engaging, interactive learning experiences.
          </p>
          
          <Link href="/login" className="inline-block">
            <motion.div
              whileHover={{ scale: 1.05 , transition: { duration: 0.2 }} }
              whileTap={{ scale: 0.95 }}
              className="inline-flex px-10 py-5 rounded-full bg-brand-600 text-white font-medium items-center justify-center gap-3 group shadow-xl hover:bg-brand-700 transition-colors"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
