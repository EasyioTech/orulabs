"use client";

import { motion } from "framer-motion";

export function CrabAvatar({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`relative flex items-center justify-center cursor-pointer ${className}`}
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-12 h-12 md:w-16 md:h-16 drop-shadow-xl"
      >
        {/* Main Body (Orange/Red) */}
        <path
          d="M25 25 H75 V65 H25 V25 Z"
          fill="#DB795C"
        />
        
        {/* Left Arm */}
        <path
          d="M10 40 H25 V55 H10 V40 Z"
          fill="#DB795C"
        />
        
        {/* Right Arm */}
        <path
          d="M75 40 H90 V55 H75 V40 Z"
          fill="#DB795C"
        />
        
        {/* Legs */}
        {/* Leg 1 */}
        <path
          d="M25 65 H35 V85 H25 V65 Z"
          fill="#DB795C"
        />
        {/* Leg 2 */}
        <path
          d="M45 65 H55 V85 H45 V65 Z"
          fill="#DB795C"
        />
        {/* Leg 3 */}
        <path
          d="M65 65 H75 V85 H65 V65 Z"
          fill="#DB795C"
        />
        
        {/* Left Eye */}
        <motion.path
          d="M35 35 H45 V45 H35 V35 Z"
          fill="#000000"
          animate={{ scaleY: [1, 1, 0, 1, 1] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.45, 0.5, 0.55, 1], ease: "linear" }}
          style={{ originY: "40px" }}
        />
        
        {/* Right Eye */}
        <motion.path
          d="M55 35 H65 V45 H55 V35 Z"
          fill="#000000"
          animate={{ scaleY: [1, 1, 0, 1, 1] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.45, 0.5, 0.55, 1], ease: "linear" }}
          style={{ originY: "40px" }}
        />
      </svg>
    </motion.div>
  );
}
