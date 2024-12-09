"use client";

import { useState, useEffect } from "react";
import { SideNav } from "@/components/SideNav";
import DisplayCapperCard from "@/components/displayCapperCard";

// Define the type to match your Prisma schema
type Capper = {
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
};

export function CustomerHomepageComponent() {
  const [cappers, setCappers] = useState<Capper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCappers = async () => {
      try {
        const response = await fetch("/api/cappers");
        const data = await response.json();
        setCappers(data);
      } catch (error) {
        console.error("Error fetching cappers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCappers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-8">
        <div className="lg:mt-0 mt-8">
          <h2 className="text-2xl font-bold mb-4">Featured Cappers</h2>
          {loading ? (
            <p className="text-center text-gray-400">Loading cappers...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cappers.map((capper) => (
                <DisplayCapperCard
                  key={capper.id}
                  userId={capper.userId}
                  imageUrl={capper.imageUrl}
                  firstName={capper.user.firstName}
                  lastName={capper.user.lastName}
                  username={capper.user.username}
                  bio={capper.bio}
                  title={capper.title}
                  tags={capper.tags}
                  subscriberIds={capper.subscriberIds}
                  isVerified={false}
                />
              ))}
            </div>
          )}
          {!loading && cappers.length === 0 && (
            <p className="text-center text-gray-400 mt-8">
              No cappers found. Check back later!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default CustomerHomepageComponent;
