"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";

export function MarketingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? "bg-white/70 backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] py-4"
          : "bg-transparent py-6"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${isScrolled ? "text-gray-900" : "text-gray-900"}`}>
            OruLabs
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <Link href="/#features" className={`text-sm font-medium transition-colors hover:text-brand-600 ${isScrolled ? "text-gray-500" : "text-gray-600"}`}>
            Features
          </Link>
          <Link href="/#platform" className={`text-sm font-medium transition-colors hover:text-brand-600 ${isScrolled ? "text-gray-500" : "text-gray-600"}`}>
            Platform
          </Link>
          <Link href="/#solutions" className={`text-sm font-medium transition-colors hover:text-brand-600 ${isScrolled ? "text-gray-500" : "text-gray-600"}`}>
            Solutions
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className={`hidden sm:block text-sm font-medium transition-colors hover:text-brand-600 ${isScrolled ? "text-gray-600" : "text-gray-700"}`}
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 hover:scale-105 transition-all duration-300 shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
