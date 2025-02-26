"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* 404 Text */}
          <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#4e43ff] to-blue-500 leading-none">
            404
          </h1>

          {/* Message */}
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-300 text-lg mb-12 max-w-lg mx-auto">
            The page you're looking for seems to have wandered off. Let's get
            you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 text-lg font-semibold rounded-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 transform hover:scale-105 transition-all duration-200"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 text-lg font-semibold rounded-full bg-transparent border-2 border-[#4e43ff] text-white hover:bg-[#4e43ff]/10 transform hover:scale-105 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="mt-16 flex justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="w-3 h-3 rounded-full bg-[#4e43ff]/60"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
