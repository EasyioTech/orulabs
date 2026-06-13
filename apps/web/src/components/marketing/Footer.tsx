"use client";

import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className=" bg-gray-50 border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-bold tracking-tight text-gray-900">
                OruLabs
              </span>
            </Link>
            <p className="text-gray-500 max-w-sm mb-6">
              The premier platform for interactive, real-time teacher professional development and collaborative learning.
            </p>
            <div className="flex items-center gap-4 text-gray-400">
              <a href="#" className="hover:text-brand-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-brand-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-brand-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/#features" className="text-gray-500 hover:text-brand-600 transition-colors">Features</Link></li>
              <li><Link href="/#solutions" className="text-gray-500 hover:text-brand-600 transition-colors">Live Sessions</Link></li>
              <li><Link href="/#solutions" className="text-gray-500 hover:text-brand-600 transition-colors">Workspaces</Link></li>
              <li><Link href="/#solutions" className="text-gray-500 hover:text-brand-600 transition-colors">Analytics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-500 hover:text-brand-600 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-500 hover:text-brand-600 transition-colors">Contact Us</Link></li>
              <li><Link href="/blog" className="text-gray-500 hover:text-brand-600 transition-colors">Blog</Link></li>
              <li><Link href="/privacy" className="text-gray-500 hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-500 hover:text-brand-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} OruLabs. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <span>Built for Educators</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
