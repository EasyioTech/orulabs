"use client";

import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import type { Training } from "@oruclass/types";

interface SelectModuleSlideProps {
  training: Training;
  isTrainer: boolean;
}

export function SelectModuleSlide({ training, isTrainer }: SelectModuleSlideProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4 sm:px-8 py-8 select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center border-4 border-brand-100 mb-2"
      >
        <PlayCircle className="w-12 h-12 text-brand-500" />
      </motion.div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Session is Live</h3>
        <p className="text-[14px] text-gray-500 max-w-md mx-auto">
          {isTrainer 
            ? "Select a module from the Controls panel to begin presenting." 
            : "The trainer will start the first module shortly. Please wait."}
        </p>
      </div>
    </div>
  );
}
