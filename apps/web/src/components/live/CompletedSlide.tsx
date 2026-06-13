"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Award, CalendarClock, Home } from "lucide-react";
import type { Training } from "@oruclass/types";

interface CompletedSlideProps {
  training: Training;
  isTrainer: boolean;
}

export function CompletedSlide({ training, isTrainer }: CompletedSlideProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4 sm:px-8 py-8 select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100 mb-2"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Session Completed</h3>
        <p className="text-[14px] text-gray-500 max-w-md mx-auto">
          {training.title} has finished. Thank you for {isTrainer ? "facilitating" : "participating"}!
        </p>
      </div>

      <div className="flex gap-4 mt-4">
        <div className="flex flex-col items-center p-4 bg-gray-50 border border-gray-100 rounded-xl w-32">
          <CalendarClock className="w-6 h-6 text-brand-500 mb-2" />
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Status</span>
          <span className="text-sm font-medium text-gray-900">Ended</span>
        </div>

        {isTrainer && (
          <div className="flex flex-col items-center p-4 bg-gray-50 border border-gray-100 rounded-xl w-32">
            <Award className="w-6 h-6 text-brand-500 mb-2" />
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Actions</span>
            <span className="text-sm font-medium text-gray-900">Review Data</span>
          </div>
        )}
      </div>

      <Link
        href={isTrainer ? "/dashboard" : "/participant"}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
      >
        <Home size={16} />
        Go to Home
      </Link>
    </div>
  );
}
