"use client";

import { useEffect, useState } from "react";
import { SimplifiedCapperCard } from "@/components/SimplifiedCapperCard";

type Capper = {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    username: string;
  };
  imageUrl?: string;
  tags: string[];
};

export function CappersSidebar() {
  const [cappers, setCappers] = useState<Capper[]>([]);
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
        console.log("Raw response:", text); // Debug log

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
          setCappers(data.slice(0, 5));
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
      <h2 className="text-l font-bold mb-4">Popular Cappers</h2>
      {loading ? (
        <p className="text-gray-400">Loading cappers...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : cappers.length > 0 ? (
        <div className="space-y-2">
          {cappers.map((capper) => (
            <SimplifiedCapperCard
              key={capper.id}
              username={capper.user.username}
              imageUrl={capper.imageUrl}
              tags={capper.tags}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No cappers found</p>
      )}
    </div>
  );
}
