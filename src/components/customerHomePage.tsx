"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">CAPPERS</h1>
          <Input
            type="search"
            placeholder="Search"
            className="w-1/3 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
          />
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <PlusSquare className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage
                src="/placeholder.svg?height=32&width=32"
                alt="@username"
              />
              <AvatarFallback>UN</AvatarFallback>
            </Avatar>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Admins */}
        <h2 className="text-2xl font-bold mb-4">Featured Cappers </h2>

        {/* Admin Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin) => (
            <Card
              key={admin.id}
              className="overflow-hidden bg-gray-800 border-gray-700"
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={admin.avatar} alt={admin.name} />
                    <AvatarFallback>
                      {admin.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      {admin.name}
                      {admin.isVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-400 ml-1" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">@{admin.username}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-300">{admin.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {admin.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-gray-700 text-gray-300"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-lg font-semibold text-violet-400">
                  {admin.subscribers.toLocaleString()} subscribers
                </p>
                <Button
                  className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white border-0"
                  variant="default"
                  onClick={() => router.push("/Subscriptions")}
                >
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export default CustomerHomepageComponent;
