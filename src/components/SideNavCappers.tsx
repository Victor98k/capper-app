"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
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
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export function SideNav() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCapper, setIsCapper] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dashboardCache, setDashboardCache] = useState<{
    url: string;
    timestamp: number;
  } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Fetch cappers to check status
  useEffect(() => {
    const checkCapperStatus = async () => {
      try {
        const response = await fetch("/api/cappers");
        if (!response.ok) throw new Error("Failed to fetch cappers");
        const cappers = await response.json();

        // Add console.log for debugging
        console.log("Cappers:", cappers);
        console.log("Current user email:", user?.email);

        const isUserCapper = cappers.some(
          (capper: any) => capper.user?.email === user?.email
        );

        console.log("Is user capper:", isUserCapper);
        setIsCapper(isUserCapper);
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
    const fetchCapperProfile = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch("/api/cappers");
        const data = await response.json();
        console.log("Capper data:", data);
        const capperData = data.find((c: any) => c.userId === user.id);
        console.log("Found capper:", capperData);
        if (capperData?.profileImage) {
          setProfileImage(capperData.profileImage);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchCapperProfile();
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

  // NavLinks component
  const NavLinks = () => {
    const storedUsername =
      typeof window !== "undefined" ? localStorage.getItem("username") : null;

    const openStripeDashboard = async () => {
      try {
        // Check cache first
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
          // Cache the URL
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

    return (
      <nav className="space-y-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="lg"
          onClick={() => router.push("/home-capper")}
        >
          <Home className="h-5 w-5 mr-3" />
          Home Dashboard
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start"
          size="lg"
          onClick={() => router.push("/home-capper")}
        >
          <BarChart3 className="h-5 w-5 mr-3" />
          Capper Dashboard
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start border border-white/20 hover:border-white/40 transition-colors duration-200"
          size="lg"
          onClick={openStripeDashboard}
        >
          <ExternalLink className="h-5 w-5 mr-3" />
          Subs Dashboard
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start border border-white/20 hover:border-white/40 transition-colors duration-200"
          size="lg"
          onClick={openStripeDashboard}
        >
          <ExternalLink className="h-5 w-5 mr-3" />
          Stripe Dashboard
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start"
          size="lg"
          onClick={() => router.push("/New-post")}
        >
          <Compass className="h-5 w-5 mr-3" />
          Add new post
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="lg"
          onClick={() => router.push("/profile")}
        >
          <Heart className="h-5 w-5 mr-3" />
          Profile info
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="lg"
          onClick={() => router.push("/my-posts")}
        >
          <TicketIcon className="h-5 w-5 mr-3" />
          My Profile
        </Button>
        {/* <Button
          variant="ghost"
          className="w-full justify-start"
          size="lg"
          onClick={() => router.push("/my-bets")}
        >
          <Settings className="h-5 w-5 mr-3" />
          My profile
        </Button> */}

        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar>
              <AvatarImage
                src={profileImage || ""}
                alt={user?.firstName || "User"}
              />
              <AvatarFallback className="bg-[#4e43ff] text-base">
                {user?.firstName?.charAt(0)?.toUpperCase() || "UN"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {storedUsername || user?.username}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => router.push("/home")}
            className="w-full mb-2"
          >
            <Home className="h-5 w-5 mr-2" />
            Main Home
          </Button>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </nav>
    );
  };

  return (
    <>
      {/* Mobile Menu */}
      <div className="lg:hidden fixed top-6 left-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-6 bg-gray-800 border-gray-700"
          >
            <h1 className="text-2xl font-bold text-blue-600 mb-8">CAPPERS</h1>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-gray-800 border-r border-gray-700 h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-8">CAPPERS</h1>
          <NavLinks />
        </div>
      </aside>
    </>
  );
}
