"use client";

import { useEffect, useState } from "react";
import { SideNav } from "@/components/SideNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Trophy,
  TrendingUp,
  Users,
  Star,
  Loader2,
} from "lucide-react";
import { use } from "react";

type CapperProfile = {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    username: string;
  };
  bio?: string;
  title?: string;
  imageUrl?: string;
  tags: string[];
  subscriberIds: string[];
  socialLinks?: Record<string, string>;
};

type Pick = {
  id: string;
  sport: string;
  prediction: string;
  result: "win" | "loss" | "pending";
  date: string;
  odds: number;
};

export default function CapperProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = use(params);
  const [capper, setCapper] = useState<CapperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const fetchCapperProfile = async () => {
      try {
        const response = await fetch(`/api/cappers/${resolvedParams.username}`);
        if (!response.ok) {
          throw new Error("Capper not found");
        }
        const data = await response.json();
        setCapper(data);
      } catch (error) {
        console.error("Error fetching capper profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapperProfile();
  }, [resolvedParams.username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#4e43ff]" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!capper) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8">
          <p className="text-center">Capper not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header - Similar to existing but with subscription button */}
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                <AvatarImage
                  src={capper.imageUrl}
                  alt={`${capper.user.firstName} ${capper.user.lastName}`}
                />
                <AvatarFallback>
                  {capper.user.firstName.charAt(0)}
                  {capper.user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center sm:justify-start">
                      {capper.user.firstName} {capper.user.lastName}
                      <CheckCircle className="h-6 w-6 text-blue-400 ml-2" />
                    </h1>
                    <p className="text-xl text-gray-400 mb-2">
                      @{capper.user.username}
                    </p>
                    {capper.title && (
                      <p className="text-lg text-violet-400 mb-4">
                        {capper.title}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={isSubscribed ? "secondary" : "default"}
                    className={`w-full sm:w-auto px-8 ${
                      isSubscribed
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                    }`}
                    onClick={() => setIsSubscribed(!isSubscribed)}
                  >
                    {isSubscribed ? "Subscribed" : "Subscribe"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {capper.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-gray-700 text-gray-300"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-gray-300">{capper.bio}</p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <StatCard
                icon={<Users />}
                title="Subscribers"
                value={capper.subscriberIds.length.toLocaleString()}
              />
              <StatCard icon={<Trophy />} title="Win Rate" value="67%" />
              <StatCard icon={<TrendingUp />} title="ROI" value="+15.8%" />
              <StatCard icon={<Star />} title="Rating" value="4.8/5" />
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="picks" className="w-full">
            <TabsList className="w-full justify-start text-[#4e43ff]   bg-gray-800 p-1 m-1 overflow-x-auto flex-nowrap">
              <TabsTrigger className="" value="picks">
                Recent Picks
              </TabsTrigger>
              <TabsTrigger className="" value="stats">
                Statistics
              </TabsTrigger>
              <TabsTrigger className="" value="reviews">
                Reviews
              </TabsTrigger>
              <TabsTrigger className="" value="about">
                About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="picks" className="mt-6">
              <div className="grid gap-4">
                <PickCard
                  id="example-1"
                  sport="NBA"
                  prediction="Lakers -5.5"
                  result="win"
                  date="2024-03-15"
                  odds={-110}
                />
                {/* Add more pick cards */}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">
                      Performance by Sport
                    </h3>
                    {/* Add charts or detailed stats here */}
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">
                      Monthly Results
                    </h3>
                    {/* Add charts or detailed stats here */}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Add content for other tabs */}
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// Helper Components
const StatCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) => (
  <div className="bg-gray-700/50 p-4 rounded-lg flex items-center space-x-4">
    <div className="text-violet-400">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

const PickCard = ({ sport, prediction, result, date, odds }: Pick) => (
  <Card className="bg-gray-800 border-gray-700">
    <CardContent className="p-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0">
        <div>
          <p className="text-violet-400 font-semibold">{sport}</p>
          <p className="text-xl font-bold mt-1">{prediction}</p>
          <p className="text-sm text-gray-400">
            {new Date(date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0">
          <Badge
            variant={result === "win" ? "default" : "destructive"}
            className={result === "win" ? "bg-green-600" : ""}
          >
            {result.toUpperCase()}
          </Badge>
          <p className="text-sm text-gray-400 sm:mt-2">Odds: {odds}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
