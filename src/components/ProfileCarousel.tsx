"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { sportEmojiMap } from "@/lib/sportEmojiMap";
import Loader from "./Loader";

type CapperProfile = {
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    username: string;
  };
  profileImage?: string;
  tags: string[];
};

type Subscription = {
  capperId: string;
  productId: string;
};

export function ProfileCarousel() {
  const [profiles, setProfiles] = useState<CapperProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const visibleProfiles = 4;
  const maxIndex = Math.max(0, profiles.length - visibleProfiles);

  // Fetch subscriptions and then profiles
  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch subscriptions
        const subsResponse = await fetch("/api/subscriptions/user", {
          credentials: "include",
        });
        if (!subsResponse.ok) throw new Error("Failed to fetch subscriptions");
        const subsData = await subsResponse.json();
        setSubscriptions(subsData.subscriptions);

        // Then fetch capper profiles
        const profilesResponse = await fetch("/api/cappers");
        if (!profilesResponse.ok)
          throw new Error("Failed to fetch capper profiles");
        const allCappers = await profilesResponse.json();

        // Filter to only show subscribed cappers
        const subscribedCappers = allCappers.filter((capper: CapperProfile) =>
          subsData.subscriptions.some(
            (sub: Subscription) => sub.capperId === capper.userId
          )
        );

        setProfiles(subscribedCappers);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load profiles"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-gray-800 rounded-lg">
        <p className="text-red-400">Failed to load profiles</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-800 rounded-lg">
        <p className="text-gray-400">
          You haven't subscribed to any cappers yet.
          <br />
          Subscribe to some cappers to see their profiles here!
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center">
        {/* Previous button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 z-10 bg-gray-900/50 hover:bg-gray-900/80 text-white"
          onClick={prevSlide}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Profiles container */}
        <div className="flex overflow-hidden mx-8">
          <div
            className="flex gap-4 transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${
                currentIndex * (100 / visibleProfiles)
              }%)`,
            }}
          >
            {profiles.map((profile) => (
              <div
                key={profile.userId}
                className="flex-shrink-0 w-[calc(100%/4-12px)] min-w-[200px]"
              >
                <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
                  {/* Avatar */}
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profile.profileImage} />
                    <AvatarFallback className="bg-[#4e43ff] text-white text-xl">
                      {profile.user.firstName[0]}
                      {profile.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Username */}
                  <p className="text-white font-medium mb-3">
                    @{profile.user.username}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {profile.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-[#4e43ff]/10 text-[#4e43ff] flex items-center gap-1"
                      >
                        <span className="text-base">
                          {sportEmojiMap[tag] || "🎯"}
                        </span>
                        <span className="text-xs">{tag}</span>
                      </Badge>
                    ))}
                  </div>

                  {/* Profile button */}
                  <Button
                    className="w-full bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                    onClick={() =>
                      router.push(`/cappers/${profile.user.username}`)
                    }
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 z-10 bg-gray-900/50 hover:bg-gray-900/80 text-white"
          onClick={nextSlide}
          disabled={currentIndex === maxIndex}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
