"use client";

import Link from "next/link";
import Image from "next/image";
import CapperLogo from "@/images/Cappers Logga (1).svg";

export default function ApplicationSubmitted() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 flex items-center">
      <div className="max-w-md mx-auto w-full">
        <div className="flex justify-center mb-8">
          <Image
            src={CapperLogo}
            alt="Capper Logo"
            className="w-[320px] h-auto sm:w-[400px] md:w-[450px] px-4"
            priority
          />
        </div>

        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm text-center">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-green-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Application Submitted Successfully!
          </h1>

          <p className="text-gray-300 mb-6">
            Thank you for your interest in becoming a Capper. Our team will
            review your application within the next 24 hours and get back to you
            via email.
          </p>

          <Link
            href="/"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
