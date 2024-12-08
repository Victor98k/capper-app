"use client";

import { useState } from "react";
import { SideNav } from "@/components/SideNav";
import DisplayCapperCard from "@/components/displayCapperCard";

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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />

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
