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

        const isUserCapper = cappers.some(
          (capper: any) => capper.user.email === user?.email
        );

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
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Search"
          className="w-full bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
        />
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

      <div className="pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar>
            <AvatarImage
              src="/placeholder.svg?height=32&width=32"
              alt="@username"
            />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">Profile</p>
          </div>
        </div>

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
