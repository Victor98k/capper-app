"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LogIn, UserPlus, ArrowRight, Menu, X } from "lucide-react";

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = ["Innovate", "Connect", "Succeed"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 3000); // Change feature every 3 seconds

    return () => clearInterval(interval);
  }, [features.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-black">
        <nav className="flex justify-between items-center">
          <Link
            href="/"
            className="text-primary text-2xl sm:text-3xl font-bold text-blue-500"
          >
            Cappers
          </Link>
          <div className="sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          <div className="hidden sm:flex space-x-10">
            <Link
              href="/about"
              className="text-white hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </div>
        </nav>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-background text-foreground p-6 rounded-lg shadow-lg">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 text-foreground focus:outline-none"
            >
              <X size={24} />
            </button>
            <nav className="flex flex-col space-y-4">
              <Link
                href="/about"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <motion.div
          className="text-center px-4 sm:px-6 lg:px-8 lg:mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 mx-4 sm:mx-8 lg:mx-12 lg:mb-12 lg:mt-28"
            variants={itemVariants}
          >
            <span className="block sm:hidden text-5xl text-white">
              Discover <span className="text-primary">YourApp</span>
            </span>
            <span className="hidden sm:block">
              <span className="text-white">Join the exclusive </span>
              <span className="text-blue-500">Cappers community</span>
            </span>
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg mb-8 sm:mb-12 font-semibold text-white"
            variants={itemVariants}
          >
            Become a member and take your{" "}
            <span className="text-blue-500">sports betting </span>
            to the next level.
          </motion.p>

          <motion.div
            className="space-y-4 sm:space-y-0 sm:space-x-8 mb-12"
            variants={itemVariants}
          >
            <button
              className="w-full sm:w-auto px-8 py-4 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Link href="/login" className="flex items-center justify-center">
                <span className="mr-2">Sign In</span>
                <motion.span
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <LogIn className="inline-block" />
                </motion.span>
              </Link>
            </button>
            <button className="w-full sm:w-auto px-8 py-4 text-lg bg-transparent rounded-full border-2 border-white text-white hover:bg-white hover:text-primary transition-colors">
              <Link
                href="/sign-up"
                className="flex items-center justify-center"
              >
                <span className="mr-2">Sign Up</span>
                <UserPlus className="inline-block" />
              </Link>
            </button>
          </motion.div>

          <motion.div
            className="mb-12 h-16 perspective-[1000px]"
            variants={itemVariants}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeatureIndex}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-white text-2xl sm:text-5xl font-bold"
              >
                {features[currentFeatureIndex]}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="mt-12 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Link
              href="#learn-more"
              className="text-white hover:text-primary transition-colors flex items-center justify-center group"
            >
              Learn More
              <motion.span
                className="ml-2"
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                <ArrowRight className="inline-block" />
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
