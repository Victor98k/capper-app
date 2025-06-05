"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/images/Cappers Logga (1).svg";
import {
  Home,
  Heart,
  MessageCircle,
  LogOut,
  Compass,
  TicketIcon,
  BarChart3,
  Settings,
  Menu,
  LineChart,
  UserCircle,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function SideNav() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCapper, setIsCapper] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
  }, []);

  // Fetch cappers to check status
  useEffect(() => {
    const checkCapperStatus = async () => {
      try {
        if (!user?.email) return;

        const response = await fetch(
          `/api/cappers?email=${encodeURIComponent(user.email)}`,
          {
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );

        const data = await response.json();
        setIsCapper(Boolean(data.isCapper));
      } catch (error) {
        console.error("Error checking capper status:", error);
        setIsCapper(false);
      }
    };

    if (user?.email) {
      checkCapperStatus();
    }
  }, [user?.email]);

  // Add this effect to fetch profile image
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch("/api/cappers");
        const data = await response.json();
        const userProfile = data.find((c: any) => c.userId === user.id);

        if (userProfile) {
          setProfileImage(userProfile.profileImage);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Handle the Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });

      router.push("https://www.cappersports.co/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // NavLinks component - Shared between mobile and desktop
  const NavLinks = () => {
    const linkClasses =
      "text-white hover:text-[#4e43ff] transition-colors flex items-center space-x-3 py-2";

    return (
      <nav className="flex flex-col space-y-6">
        <Link
          href="/home"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/Explore"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          <Compass className="h-5 w-5" />
          <span>Explore</span>
        </Link>

        <Link
          href="/my-profile"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          <UserCircle className="h-5 w-5" />
          <span>My Profile</span>
        </Link>

        <Link
          href="/My-bets"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          <TicketIcon className="h-5 w-5" />
          <span>Bet tracker</span>
        </Link>

        {isCapper && (
          <Link
            href="/home-capper"
            className={`${linkClasses} border border-white/20 hover:border-white/40 rounded-lg px-3`}
            onClick={() => setIsMenuOpen(false)}
          >
            <LineChart className="h-5 w-5" />
            <span>Capper Dashboard</span>
          </Link>
        )}
      </nav>
    );
  };

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white focus:outline-none p-2 hover:bg-white/10 rounded-full transition-colors"
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
              className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-50"
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

                {/* User Profile and Logout */}
                <div className="mt-auto space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="border-t border-gray-700 pt-4"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profileImage || ""}
                          alt={username || "User"}
                        />
                        <AvatarFallback className="bg-[#4e43ff] text-base">
                          {username?.charAt(0)?.toUpperCase() || "UN"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-base font-medium text-white">
                          {username}
                        </p>
                      </div>
                    </div>

                    {!isCapper && (
                      <Link
                        href="https://app.cappersports.co/become-capper"
                        className="w-full flex items-center justify-center px-6 py-3 text-lg font-medium rounded-full bg-transparent border-2 border-[#4e43ff] text-white hover:bg-[#4e43ff]/10 transition-all mb-4"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Become Capper
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center px-6 py-3 text-lg font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </button>
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
        <div className="flex-1">
          <NavLinks />
        </div>

        {/* Desktop Profile Section */}
        <div className="border-t border-gray-700 pt-4 mt-auto">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage || ""} alt={username || "User"} />
              <AvatarFallback className="bg-[#4e43ff] text-base">
                {username?.charAt(0)?.toUpperCase() || "UN"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-base font-medium text-white">{username}</p>
            </div>
          </div>

          {!isCapper && (
            <Link
              href="https://app.cappersports.co/become-capper"
              className="w-full flex items-center justify-center px-4 py-2 text-sm rounded-full bg-transparent border-2 border-[#4e43ff] text-white hover:bg-[#4e43ff]/10 transition-all mb-4"
            >
              <LineChart className="h-5 w-5 mr-2" />
              Become Capper
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
