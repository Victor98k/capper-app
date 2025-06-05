"use client";

import Link from "next/link";
import { useState } from "react";
import { LogIn, UserPlus, Menu, X } from "lucide-react";
import CappersLogo from "@/images/Cappers Logga (1).svg";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full py-4 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-black">
      <nav className="flex justify-between items-center">
        {/* Logo - Hidden on mobile */}
        <Link href="/" className="hidden sm:flex items-center">
          <img
            src={CappersLogo.src}
            alt="Cappers Logo"
            className="h-8 sm:h-10 w-auto"
          />
        </Link>

        {/* Mobile Navigation */}
        <div className="flex justify-between items-center w-full sm:hidden">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Sign In Button */}
          <Link
            href="https://app.cappersports.co/login"
            className="flex items-center px-4 py-2 text-sm rounded-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 transform hover:scale-105 transition-all duration-200"
          >
            <span className="mr-1">Sign In</span>
            <LogIn className="inline-block h-4 w-4" />
          </Link>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden sm:flex items-center space-x-10">
          <Link
            href="/"
            className="text-white hover:text-[#4e43ff] transition-colors"
          >
            Home
          </Link>
          <Link
            href="https://cappersports.co/about"
            className="text-white hover:text-[#4e43ff] transition-colors"
          >
            About
          </Link>
          <Link
            href="https://cappersports.co/contact"
            className="text-white hover:text-[#4e43ff] transition-colors"
          >
            Contact
          </Link>
          <button className="px-4 py-2 text-sm rounded-full bg-[#4e43ff] text-white hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50">
            <Link
              href="https://app.cappersports.co/login"
              className="flex items-center justify-center"
            >
              <span className="mr-2">Sign In</span>
              <LogIn className="inline-block h-4 w-4" />
            </Link>
          </button>
          <button className="px-4 py-2 text-sm rounded-full bg-transparent border-2 border-[#4e43ff] text-white hover:bg-[#4e43ff] hover:border-transparent transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50">
            <Link
              href="https://app.cappersports.co/sign-up"
              className="flex items-center justify-center"
            >
              <span className="mr-2">Sign Up</span>
              <UserPlus className="inline-block h-4 w-4" />
            </Link>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-50"
          >
            <div className="flex flex-col h-full p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <Link href="/" className="flex items-center">
                  <img
                    src={CappersLogo.src}
                    alt="Cappers Logo"
                    className="h-8 w-auto"
                  />
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-6 mt-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    href="/"
                    className="text-2xl font-medium text-white hover:text-[#4e43ff] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href="/about"
                    className="text-2xl font-medium text-white hover:text-[#4e43ff] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    href="/contact"
                    className="text-2xl font-medium text-white hover:text-[#4e43ff] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </motion.div>
              </nav>

              {/* Action Buttons */}
              <div className="mt-auto space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full"
                >
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center px-6 py-3 text-lg font-medium rounded-full bg-transparent border-2 border-[#4e43ff] text-white hover:bg-[#4e43ff]/10 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full"
                >
                  <Link
                    href="/sign-up"
                    className="w-full flex items-center justify-center px-6 py-3 text-lg font-medium rounded-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
