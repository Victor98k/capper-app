"use client";

import { use, useEffect, useState } from "react";
import { SimplifiedCapperCard } from "@/components/SimplifiedCapperCard";
import { SidebarCapper } from "@/types/capper";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function CappersSidebar() {
  const router = useRouter();
  const [cappers, setCappers] = useState<SidebarCapper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCappers = async () => {
      try {
        const response = await fetch("/api/cappers", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();

        if (!text) {
          setCappers([]);
          return;
        }

        try {
          const data = JSON.parse(text);
          if (!Array.isArray(data)) {
            console.error("Expected array but got:", typeof data);
            setCappers([]);
            setError("Invalid data format received");
            return;
          }
          // Shuffle the array randomly
          const shuffledCappers = [...data].sort(() => Math.random() - 0.5);
          // Take only 5 random cappers
          setCappers(shuffledCappers.slice(0, 5));
        } catch (parseError) {
          console.error("Parse error:", parseError);
          setError("Failed to parse server response");
          setCappers([]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch cappers"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCappers();
  }, []);

  return (
    <div className="w-[300px] min-w-[300px] pt-10 mt-10 p-4">
      <h2 className="text-2xl font-bold mb-6">Trending Cappers</h2>
      {loading ? (
        <p className="text-gray-400 text-lg">Loading cappers...</p>
      ) : error ? (
        <p className="text-red-400 text-lg">{error}</p>
      ) : cappers.length > 0 ? (
        <div className="space-y-1">
          {cappers.map((capper) => (
            <div key={capper.id} className="p-3">
              <SimplifiedCapperCard
                username={capper.user.username}
                imageUrl={capper.imageUrl}
                tags={capper.tags}
                firstName={capper.user.firstName}
                lastName={capper.user.lastName}
                onClick={() => router.push(`/cappers/${capper.user.username}`)}
              />
            </div>
          ))}
          <Button
            onClick={() => router.push("/Explore")}
            className="cursor-pointer mt-4 w-full bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
          >
            View All Cappers
          </Button>
        </div>
      ) : (
        <p className="text-gray-400 text-lg">No cappers found</p>
      )}
    </div>
  );
}
