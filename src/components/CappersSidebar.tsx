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

  useEffect(() => {
    const fetchCappers = async () => {
      try {
        const response = await fetch("/api/cappers");
        const data = await response.json();
        setCappers(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching cappers:", error);
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
      ) : (
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
      )}
    </div>
  );
}
