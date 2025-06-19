"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/images/Cappers Logga (1).svg";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import {
  Home,
  LogOut,
  Compass,
  TicketIcon,
  BarChart3,
  Menu,
  ExternalLink,
  X,
  UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SideNav() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCapper, setIsCapper] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dashboardCache, setDashboardCache] = useState<{
    url: string;
    timestamp: number;
  } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const checkCapperStatus = async () => {
      try {
        const response = await fetch("/api/cappers");
        if (!response.ok) throw new Error("Failed to fetch cappers");
        const cappers = await response.json();
        const isUserCapper = cappers.some(
          (capper: any) => capper.user?.email === user?.email
        );
        setIsCapper(isUserCapper);
      } catch (error) {
        setIsCapper(false);
      }
    };

    if (user?.email) {
      checkCapperStatus();
    }
  }, [user?.email]);

  useEffect(() => {
    const fetchCapperProfile = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch("/api/cappers");
        const data = await response.json();
        const capperData = data.find((c: any) => c.userId === user.id);
        if (capperData?.profileImage) {
          setProfileImage(capperData.profileImage);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchCapperProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("https://www.cappersports.co/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const NavLinks = () => {
    const storedUsername =
      typeof window !== "undefined" ? localStorage.getItem("username") : null;

    const openStripeDashboard = async () => {
      try {
        if (
          dashboardCache &&
          Date.now() - dashboardCache.timestamp < CACHE_DURATION
        ) {
          window.open(dashboardCache.url, "_blank");
          return;
        }

        const response = await fetch("/api/stripe/connect", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();

        if (data.url) {
          setDashboardCache({
            url: data.url,
            timestamp: Date.now(),
          });
          window.open(data.url, "_blank");
        } else {
          switch (data.code) {
            case "NO_STRIPE_ACCOUNT":
              toast.error("You need to connect your Stripe account first");
              break;
            case "ONBOARDING_INCOMPLETE":
              toast.error("Please complete your Stripe account setup first");
              break;
            case "ACCOUNT_INVALID":
              toast.error(
                "Your Stripe account needs attention. Please check your email for instructions."
              );
              break;
            default:
              toast.error(
                "Unable to access Stripe dashboard. Please try again later."
              );
          }
        }
      } catch (error) {
        console.error("Error opening Stripe dashboard:", error);
        toast.error("Failed to open Stripe dashboard");
      }
    };

    const linkClasses =
      "text-white hover:text-[#4e43ff] transition-colors flex items-center space-x-3 py-2 px-3 rounded-lg w-full";
    const stripeLinkClasses = `${linkClasses} border border-white/20 hover:border-white/40`;

    return (
      <nav className="flex flex-col space-y-6">
        <Link
          href="/home-capper"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          <BarChart3 className="h-5 w-5" />
          <span>Product Dashboard</span>
        </Link>

        <Link
          href="/New-post"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          <Compass className="h-5 w-5" />
          <span>Add new post</span>
        </Link>

        <Link
          href="/my-posts"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          <UserCircle className="h-5 w-5" />
          <span>My Profile</span>
        </Link>

        <button onClick={openStripeDashboard} className={stripeLinkClasses}>
          <ExternalLink className="h-5 w-5" />
          <span>Stripe Dashboard</span>
        </button>

        <div className="pt-4 border-t border-gray-700 mt-auto">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={profileImage || ""}
                alt={user?.firstName || "User"}
              />
              <AvatarFallback className="bg-[#4e43ff] text-base">
                {user?.firstName?.charAt(0)?.toUpperCase() || "UN"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-base font-medium text-white">
                {storedUsername || user?.username}
              </p>
            </div>
          </div>

          <Link
            href="/home"
            className="w-full flex items-center justify-center px-4 py-2 text-sm rounded-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 transition-all mb-4"
            onClick={() => setIsMenuOpen(false)}
          >
            <Home className="h-5 w-5 mr-2" />
            Main Home
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </nav>
    );
  };

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white focus:outline-none p-2 hover:bg-white/10 rounded-full transition-colors fixed top-4 left-4 z-50"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-40"
            >
              <div className="flex flex-col h-full p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <Image
                    src={logo}
                    alt="Cappers Logo"
                    width={140}
                    height={50}
                    priority
                    className="h-8 w-auto"
                  />
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <NavLinks />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Navigation */}
      <aside className="w-[300px] min-w-[300px] border-r border-gray-800 bg-[#020817] p-6 hidden lg:flex flex-col h-screen sticky top-0">
        {/* Desktop Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src={logo}
            alt="Cappers Logo"
            width={190}
            height={70}
            priority
          />
        </div>

        {/* Desktop Navigation Content */}
        <div className="flex-1 flex flex-col">
          <NavLinks />
        </div>
      </aside>
    </>
  );
}
