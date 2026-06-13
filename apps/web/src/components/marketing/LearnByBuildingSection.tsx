"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

const carouselData = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop",
    badge: "Active Learning",
    title: "Learn by Doing",
    description: "Move past passive video lectures. Our platform encourages students to engage directly with the material, fostering a deeper understanding through practice."
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2787&auto=format&fit=crop",
    badge: "Interactive Classrooms",
    title: "Engage Anywhere",
    description: "Students can join live interactive sessions from their phone, tablet, or laptop. No apps to download, just pure browser-based learning."
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2940&auto=format&fit=crop",
    badge: "Deep Analytics",
    title: "Actionable Insights",
    description: "Track participation, engagement, and performance in real-time. Gain the insights you need to improve your teaching and help students succeed."
  }
];

export function LearnByBuildingSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselData.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentItem = carouselData[currentIndex];

  return (
    <section 
      className="min-h-[60vh] md:min-h-[70vh] w-full relative bg-black overflow-hidden flex flex-col items-center justify-center py-24"
    >
      {/* Background Image Carousel with Blur/Gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Base Image */}
          <img 
            src={currentItem.image} 
            alt={currentItem.title}
            className="absolute inset-0 w-full h-full object-cover" 
          />
          {/* Blurred/Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[8px] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Foreground Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentItem.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm cursor-default mb-8">
              <BookOpen className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white tracking-wide uppercase">{currentItem.badge}</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              {currentItem.title}.
            </h2>
            
            <p className="text-base sm:text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed px-4">
              {currentItem.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-4 z-20">
        {carouselData.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className="relative h-2 rounded-full overflow-hidden transition-all duration-500 bg-white/20"
            style={{ width: idx === currentIndex ? '3rem' : '1rem' }}
            aria-label={`Go to slide ${idx + 1}`}
          >
            {idx === currentIndex && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
