"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import CappersLogo from "@/images/Cappers Logga.png";
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  User,
  MessageCircle,
  MoreHorizontal,
  Bookmark,
  CheckCircle,
  LogOut,
  Compass,
  TicketIcon,
  BarChart3,
  Settings,
  Menu,
  X,
  LineChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DisplayCapperCard from "@/components/displayCapperCard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Admin = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  subscribers: number;
  isVerified: boolean;
  tags: string[];
};

export function CustomerHomepageComponent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: "1",
      name: "Emma Johnson",
      username: "emma_travels",
      avatar: "/placeholder.svg?height=400&width=400&text=EJ",
      bio: "Professional MMA analyst & Football betting expert",
      subscribers: 15420,
      isVerified: true,
      tags: ["Football", "MMA"],
    },
    {
      id: "2",
      name: "Alex Chen",
      username: "alex_foodie",
      avatar: "/placeholder.svg?height=400&width=400&text=AC",
      bio: "UFC insider and MMA betting specialist",
      subscribers: 8930,
      isVerified: true,
      tags: ["MMA"],
    },
    {
      id: "3",
      name: "Sarah Smith",
      username: "eco_sarah",
      avatar: "/placeholder.svg?height=400&width=400&text=SS",
      bio: "Premier League analyst & NHL betting expert",
      subscribers: 12105,
      isVerified: false,
      tags: ["Football", "Hockey"],
    },
    {
      id: "4",
      name: "Mike Brown",
      username: "adventure_mike",
      avatar: "/placeholder.svg?height=400&width=400&text=MB",
      bio: "Former MMA fighter turned sports betting analyst",
      subscribers: 20150,
      isVerified: true,
      tags: ["Football", "MMA"],
    },
    {
      id: "5",
      name: "Lisa Wong",
      username: "budget_lisa",
      avatar: "/placeholder.svg?height=400&width=400&text=LW",
      bio: "Football statistics expert & horse racing analyst",
      subscribers: 18700,
      isVerified: false,
      tags: ["Football", "Horses"],
    },
    {
      id: "6",
      name: "Tom Garcia",
      username: "history_buff",
      avatar: "/placeholder.svg?height=400&width=400&text=TG",
      bio: "NBA insider & NHL betting specialist",
      subscribers: 9800,
      isVerified: true,
      tags: ["Basketball", "Hockey"],
    },
  ]);
  const [isCapper, setIsCapper] = useState<boolean>(false);

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });

      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const NavLinks = () => (
    <nav className="space-y-4">
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Search"
          className="w-full bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
        />
      </div>

      <Button variant="ghost" className="w-full justify-start" size="lg">
        <Home className="h-5 w-5 mr-3" />
        Home
      </Button>
      <Button variant="ghost" className="w-full justify-start" size="lg">
        <Compass className="h-5 w-5 mr-3" />
        Explore
      </Button>
      <Button variant="ghost" className="w-full justify-start" size="lg">
        <TicketIcon className="h-5 w-5 mr-3" />
        My Bets
      </Button>
      <Button variant="ghost" className="w-full justify-start" size="lg">
        <BarChart3 className="h-5 w-5 mr-3" />
        Analytics
      </Button>
      <Button variant="ghost" className="w-full justify-start" size="lg">
        <MessageCircle className="h-5 w-5 mr-3" />
        Messages
      </Button>
      <Button variant="ghost" className="w-full justify-start" size="lg">
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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
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

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-8">
        <div className="lg:mt-0 mt-8">
          <h2 className="text-2xl font-bold mb-4">Featured Cappers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {admins.map((admin) => (
              <DisplayCapperCard
                key={admin.id}
                firstName={admin.name.split(" ")[0]}
                lastName={admin.name.split(" ")[1]}
                username={admin.username}
                bio={admin.bio}
                tags={admin.tags}
                subscribers={admin.subscribers}
                isVerified={admin.isVerified}
                avatar={admin.avatar}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerHomepageComponent;
