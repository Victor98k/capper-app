"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CappersLogo from "@/images/Cappers Logga (1).svg";

export function FooterComponent() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2 col-span-1">
            <img
              src={CappersLogo.src}
              alt="Cappers Logo"
              className="h-10 w-auto"
            />
            <p className="text-sm hidden sm:block">
              Join the ultimate community of sports betting enthusiasts and
              expert analysts.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-[#4e43ff] transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-[#4e43ff] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-[#4e43ff] transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#4e43ff] transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="hover:text-[#4e43ff] transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-[#4e43ff] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-[#4e43ff] transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[#4e43ff] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-[#4e43ff] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/responsible-gambling"
                  className="hover:text-[#4e43ff] transition-colors"
                >
                  Responsible Gambling
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#4e43ff] transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">
              Newsletter
            </h3>
            <p className="text-sm mb-4">
              Stay updated with the latest tips and insights.
            </p>
            <form className="space-y-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button
                type="submit"
                className="w-full bg-[#4e43ff] hover:bg-blue-600"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Cappers. All rights reserved.</p>
          <p className="mt-2">
            Disclaimer: This platform is for informational purposes only. Please
            gamble responsibly.
          </p>
        </div>
      </div>
    </footer>
    // test test
  );
}
export default FooterComponent;
