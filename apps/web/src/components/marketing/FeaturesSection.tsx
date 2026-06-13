"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";

// WebGL/canvas eye-candy — heavy (gl-matrix + large shaders) and client-only.
// Code-split so they never ship in the initial bundle or block SSR.
const InfiniteMenu = dynamic(() => import("./InfiniteMenu"), { ssr: false });
const TextPressure = dynamic(() => import("./TextPressure"), { ssr: false });

const features = [
  {
    // Real-time: Students collaborating
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
    link: '#',
    title: 'Real-time',
    description: 'Keep everyone on the same page. Updates instantly for all students.'
  },
  {
    // Anywhere: Learning on the go
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop',
    link: '#',
    title: 'Anywhere',
    description: 'Students join from phone, tablet, or laptop. No apps to download.'
  },
  {
    // Secure: Privacy and security
    image: 'https://images.unsplash.com/photo-1614064641936-7329930f7cb6?q=80&w=800&auto=format&fit=crop',
    link: '#',
    title: 'Secure',
    description: 'Course materials and student data are kept private and secure.'
  },
  {
    // Analytics: Data and charts
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
    link: '#',
    title: 'Analytics',
    description: 'Deep insights on participant engagement and performance.'
  }
];

export function FeaturesSection() {
  return (
    <>
      <section 
        id="features-intro" 
        className="w-full relative flex flex-col items-center justify-center overflow-hidden bg-white pt-20 pb-4"
      >
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: false, amount: 0.4 }}
          className="text-center z-20 w-full"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2 } }}
            className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm cursor-default"
          >
            <CheckCircle className="w-6 h-6 text-brand-600" />
          </motion.div>
          <div className="w-full max-w-5xl mx-auto px-4 h-24 sm:h-32 md:h-48 relative overflow-hidden">
            <TextPressure
              text="Why choose this platform?"
              fontUrl=""
              flex={true}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="#111827"
              minFontSize={24}
            />
          </div>
        </motion.div>
      </section>

      <section 
        id="features-menu" 
        className="h-[70dvh] md:h-[100dvh] min-h-[400px] w-full  relative flex flex-col items-center justify-center overflow-hidden bg-gray-50/30"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: false, amount: 0.4 }}
          style={{ width: '100%', height: '100%', position: 'relative' }}
        >
          <InfiniteMenu items={features} scale={1.2} />
        </motion.div>
      </section>
    </>
  );
}
