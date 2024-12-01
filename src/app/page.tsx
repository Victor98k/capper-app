"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { LogIn, UserPlus, ArrowRight, Menu, X } from "lucide-react";

export default function LandingPage() {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = ["Innovate", "Connect", "Succeed"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-black">
        <nav className="flex justify-between items-center">
          <Link
            href="/"
            className="text-primary text-2xl sm:text-3xl font-bold text-blue-900"
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
        <div className="text-center px-4 sm:px-6 lg:px-8 lg:mb-20">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 mx-4 sm:mx-8 lg:mx-12 lg:mb-12 lg:mt-28">
            <span className="block sm:hidden text-6xl text-white">
              Discover <span className="text-blue-500">Cappers</span>
            </span>
            <span className="hidden sm:block">
              <span className="text-white text-4xl">
                Want to start winning bets?{" "}
              </span>
              <br />
              <span className="text-blue-500 text-8xl">Join Cappers Club</span>
            </span>
          </h1>

          <p className="text-base sm:text-lg mb-8 sm:mb-12 font-semibold text-white">
            Become a member and take your{" "}
            <span className="text-blue-500">sports betting </span>
            to the next level.
          </p>

          <div className="space-y-4 sm:space-y-0 sm:space-x-8 mb-12">
            <button className="w-full sm:w-auto px-8 py-4 text-lg rounded-full bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50">
              <Link href="/login" className="flex items-center justify-center">
                <span className="mr-2 font-semibold">Sign In</span>
                <LogIn className="inline-block" />
              </Link>
            </button>

            <button className="w-full sm:w-auto px-8 py-4 text-lg rounded-full bg-transparent border-2 border-blue-500 text-white hover:bg-blue-500 hover:border-transparent transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50">
              <Link
                href="/sign-up"
                className="flex items-center justify-center"
              >
                <span className="mr-2 font-semibold">Sign Up</span>
                <UserPlus className="inline-block" />
              </Link>
            </button>
          </div>

          <div className="mb-12 h-16">
            <div className="text-white text-2xl sm:text-5xl font-bold">
              {features[currentFeatureIndex]}
            </div>
          </div>

          <div className="mt-12 mb-12">
            <Link
              href="#learn-more"
              className="text-white hover:text-primary transition-colors flex items-center justify-center group"
            >
              Learn More
              <span className="ml-2">
                <ArrowRight className="inline-block" />
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
