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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function SideNav() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCapper, setIsCapper] = useState<boolean>(false);

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
  const NavLinks = () => (
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
        onClick={() => router.push("/My-bets")}
      >
        <TicketIcon className="h-5 w-5 mr-3" />
        My Posts
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

      <div className="pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar>
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">"Username here"</p>
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

        <Button variant="destructive" onClick={handleLogout} className="w-full">
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );

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
