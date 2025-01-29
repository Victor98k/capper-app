"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/images/Cappers Logga.png";
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

  // Handle the Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // NavLinks component
  const NavLinks = () => {
    console.log("isCapper state:", isCapper);

    return (
      <div className="flex flex-col h-full">
        <nav className="space-y-4 flex-1">
          <div className="mb-8">
            {/* <Input
              type="search"
              placeholder="Search"
              className="w-full bg-gray-900 border-gray-600 text-gray-100 placeholder-gray-400"
            /> */}
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push("/home")}
          >
            <Home className="h-5 w-5 mr-3" />
            Home
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push("/Explore")}
          >
            <Compass className="h-5 w-5 mr-3" />
            Explore
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push("/My-cappers")}
          >
            <Heart className="h-5 w-5 mr-3" />
            My Cappers
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push("/My-bets")}
          >
            <TicketIcon className="h-5 w-5 mr-3" />
            My Bets
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push("/Analytics")}
          >
            <BarChart3 className="h-5 w-5 mr-3" />
            Analytics
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push("/Settings")}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Button>
        </nav>

        {/* User profile and logout section */}
        <div className="border-t border-gray-700 pt-4 mt-auto">
          <div className="flex items-center space-x-3 mb-4 ">
            <Avatar>
              <AvatarImage
                src="/placeholder.svg?height=32&width=32"
                alt="@username"
              />
              <AvatarFallback className="bg-[#4e43ff]">
                {username?.charAt(0)?.toUpperCase() || "UN"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{username}</p>
            </div>
          </div>
          {/* Push to capper dashboard if isCapper is true */}
          {isCapper && (
            <Button
              variant="secondary"
              onClick={() => router.push("/home-capper")}
              className="w-full mb-2"
            >
              <LineChart className="h-5 w-5 mr-2" />
              Capper Dashboard
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
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
      {/* Desktop Sidebar */}
      <aside className="w-[300px] min-w-[300px] border-r border-gray-800 bg-gray-900 p-4 hidden md:block h-screen sticky top-0">
        <div className="p-6 h-full flex flex-col">
          <div className="mb-8 flex justify-center">
            <Image
              src={logo}
              alt="Cappers Logo"
              width={150}
              height={50}
              priority
            />
          </div>
          <NavLinks />
        </div>
      </aside>

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
            <div className="mb-8 flex justify-center">
              <Image
                src={logo}
                alt="Cappers Logo"
                width={150}
                height={50}
                priority
              />
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
