"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Play } from "lucide-react";
import { useRef } from "react";

export function DashboardPreview() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.95]);

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.1 }}
      className="md:min-h-screen w-full  relative flex flex-col items-center justify-center overflow-hidden bg-white py-12 md:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10 w-full flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6 max-w-3xl"
        >
          <motion.div 
            whileHover={{ scale: 1.05 , transition: { duration: 0.2 }} }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-gray-900 text-xs md:text-sm font-medium mb-4 border border-gray-100 cursor-default"
          >
            <Play className="w-3 h-3 md:w-4 md:h-4" />
            Premium Course Experience
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.15] md:leading-[1.1] px-4 md:px-0">
            Immersive learning, <span className="text-gray-400 transition-colors duration-500 hover:text-gray-600 block sm:inline">designed for focus.</span>
          </h2>
        </motion.div>

        <motion.div
          style={{ scale }}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-gray-100 border border-gray-100 aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9]"
        >
          {/* Main Dashboard Image */}
          <img
            src="https://images.unsplash.com/photo-1618761714954-0b8cd0026356?q=80&w=2940&auto=format&fit=crop"
            alt="Platform Interface"
            className="w-full h-full object-cover"
          />
          
          {/* Layered Glass UI Elements */}
          <motion.div 
            initial={{ opacity: 0, y: 40, x: -20 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, scale: 1.02 , transition: { duration: 0.2 }} }
            className="absolute bottom-10 left-10 hidden md:block cursor-default"
          >
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-6 w-72">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-black/5 animate-pulse" />
                <div>
                  <div className="h-4 w-24 bg-black/10 rounded mb-2" />
                  <div className="h-3 w-16 bg-black/5 rounded" />
                </div>
              </div>
              <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  whileInView={{ width: "65%" }}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                  className="h-full bg-brand-600 rounded-full" 
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40, x: 20 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, scale: 1.02 , transition: { duration: 0.2 }} }
            className="absolute top-10 right-10 hidden lg:block cursor-default"
          >
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-5 w-64">
               <p className="text-sm font-medium text-gray-900 mb-1">Upcoming Live Session</p>
               <p className="text-xs text-gray-500 mb-3">Starts in 15 minutes</p>
               <button className="w-full py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">Join Now</button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
