"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { useRef } from "react";

const MotionLink = motion.create(Link);

export function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const handleScrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="min-h-[100dvh] w-full  relative flex items-center justify-center overflow-hidden bg-white py-20"
    >
      {/* Background Image with Parallax */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 z-0 scale-110 origin-center">
        <Image
          src="/hero-bg.gif"
          alt="Modern bright learning environment for OruLabs live training"
          fill
          priority
          unoptimized // Preserve GIF animation
          className="object-cover opacity-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/90" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 max-w-5xl"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 leading-[1.05]">
            Bring Your Classroom <span className="text-gray-400 transition-colors duration-500 hover:text-gray-600">to Life.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-light mt-6 px-4">
            Engaging, interactive, and beautifully simple. Deliver courses that your students will actually love.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 pt-8 w-full px-4"
          >
            <MotionLink
              href="/login"
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-brand-600 text-white font-medium flex items-center justify-center gap-2 group shadow-lg hover:bg-brand-700 transition-colors text-sm sm:text-base"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </MotionLink>
            <MotionLink
              href="#platform"
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-white/70 backdrop-blur-lg text-gray-900 font-medium border border-white/50 flex items-center justify-center gap-2 group shadow-sm text-sm sm:text-base"
            >
              <Play className="w-4 h-4 text-gray-900 group-hover:scale-110 transition-transform" />
              See How It Works
            </MotionLink>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.button
        onClick={handleScrollToFeatures}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer z-20 flex flex-col items-center justify-center group"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-8 h-8 text-gray-400 group-hover:text-gray-900 transition-colors" />
        </motion.div>
      </motion.button>
    </motion.section>
  );
}
