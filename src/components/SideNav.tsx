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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";

export function SideNav() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCapper, setIsCapper] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
  }, []);

  // Fetch cappers to check status
  useEffect(() => {
    const checkCapperStatus = async () => {
      try {
        if (!user?.email) return;

        console.log("Checking capper status for email:", user.email);

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
        console.log("Raw API response:", data);

        if (typeof data.isCapper !== "boolean") {
          console.warn("Unexpected API response structure:", data);
        }

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
      router.push("/");
      // router.push("https://www.cappersports.co/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // NavLinks component - Shared between mobile and desktop
  const NavLinks = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Navigation Items - Mobile: larger spacing, Desktop: compact */}
        <nav className="space-y-2 lg:space-y-2 flex-1">
          <div className="mb-4">{/* Search input removed for now */}</div>

          {/* Mobile: py-4 padding, space-y-6 gap | Desktop: normal padding, space-y-2 gap */}
          <div className="space-y-6 lg:space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start py-4 px-2 text-base"
              onClick={() => router.push("/home")}
            >
              <Home className="h-5 w-5 mr-3" />
              Home
            </Button>

            {isCapper && (
              <Button
                variant="ghost"
                className="w-full justify-start py-4 px-2 text-base border border-white/20 hover:border-white/40 transition-colors duration-200"
                onClick={() => router.push("/home-capper")}
              >
                <LineChart className="h-5 w-5 mr-3" />
                Capper Dashboard
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full justify-start py-4 px-2 text-base"
              onClick={() => router.push("/Explore")}
            >
              <Compass className="h-5 w-5 mr-3" />
              Explore
            </Button>

            {/* <Button
              variant="ghost"
              className="w-full justify-start py-4 px-2 text-base"
              onClick={() => router.push("/My-cappers")}
            >
              <Heart className="h-5 w-5 mr-3" />
              My Cappers
            </Button> */}
            <Button
              variant="ghost"
              className="w-full justify-start py-4 px-2 text-base"
              onClick={() => router.push("/my-profile")}
            >
              <TicketIcon className="h-5 w-5 mr-3" />
              My Profile
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start py-4 px-2 text-base"
              onClick={() => router.push("/My-bets")}
            >
              <TicketIcon className="h-5 w-5 mr-3" />
              My Bets
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start py-4 px-2 text-base"
              onClick={() => router.push("/Analytics")}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Analytics
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start py-4 px-2 text-base"
              onClick={() => router.push("/Settings")}
            >
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </Button>
          </div>
        </nav>

        {/* Profile Section - Mobile: larger avatar and text | Desktop: normal size */}
        <div className="border-t border-gray-700 pt-4 mt-auto">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage || ""} alt={username || "User"} />
              <AvatarFallback className="bg-[#4e43ff] text-base">
                {username?.charAt(0)?.toUpperCase() || "UN"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-base font-medium">{username}</p>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full py-3 text-base"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log("isCapper state updated:", isCapper);
  }, [isCapper]);

  return (
    <>
      {/* ==================== MOBILE NAVIGATION ==================== */}
      <div className="lg:hidden">
        <Sheet>
          {/* Mobile Menu Trigger Button */}
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-5 w-5 text-gray-100" />
            </Button>
          </SheetTrigger>

          {/* Mobile Slide-out Menu */}
          <SheetContent
            side="left"
            className="w-[85vw] max-w-[300px] p-0 bg-gray-900 border-gray-800"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header with Logo */}
              <div className="p-4 border-b border-gray-800">
                <Image
                  src={logo}
                  alt="Cappers Logo"
                  width={120}
                  height={40}
                  priority
                  className="mx-auto"
                />
              </div>

              {/* Mobile Navigation Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <NavLinks />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ==================== DESKTOP NAVIGATION ==================== */}
      <aside className="w-[300px] min-w-[300px] border-r border-gray-800 bg-gray-900 p-4 hidden lg:block h-screen sticky top-0">
        <div className="p-6 h-full flex flex-col">
          {/* Desktop Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src={logo}
              alt="Cappers Logo"
              width={150}
              height={50}
              priority
            />
          </div>
          {/* Desktop Navigation Content */}
          <NavLinks />
        </div>
      </aside>
    </>
  );
}
