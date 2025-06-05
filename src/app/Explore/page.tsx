"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Components
import { SideNav } from "@/components/SideNav";
import Loader from "@/components/Loader";
import SearchBar from "@/components/SearchBar";
import { sportEmojiMap } from "@/lib/sportEmojiMap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define the CapperProfile type
interface CapperProfile {
  id: string;
  userId: string;
  tags: string[];
  profileImage: string;
  roi: number;
  user: {
    firstName: string;
    lastName: string;
    username: string;
  };
  stats?: {
    winrate: number;
    totalBets: number;
  };
}

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: CapperProfile[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function ExplorePage() {
  const router = useRouter();
  const [cappers, setCappers] = useState<CapperProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [allCappers, setAllCappers] = useState<CapperProfile[]>([]);

  useEffect(() => {
    const fetchCappers = async () => {
      try {
        const response = await fetch("/api/cappers");
        const data = await response.json();
        console.log("Raw API Response:", data);
        console.log(
          "ROI values:",
          data.map((c: CapperProfile) => ({
            username: c.user.username,
            roi: c.roi,
          }))
        );
        const shuffledData = shuffleArray(data);
        setAllCappers(shuffledData);
        setCappers(shuffledData);
      } catch (error) {
        console.error("Error fetching cappers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCappers();
  }, []);

  useEffect(() => {
    let filtered = allCappers;

    // Apply sport filter
    if (selectedSport) {
      filtered = filtered.filter((capper) =>
        capper.tags?.some(
          (tag) => tag.toLowerCase() === selectedSport.toLowerCase()
        )
      );
      console.log("Filtered by sport:", selectedSport, filtered);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((capper) =>
        capper.tags?.some(
          (tag) =>
            tag.toLowerCase().includes(query) ||
            query.includes(tag.toLowerCase())
        )
      );
      console.log("Filtered by search:", searchQuery, filtered);
    }

    setCappers(filtered);
  }, [searchQuery, selectedSport, allCappers]);

  const handleSportSelect = (sport: string) => {
    if (selectedSport === sport) {
      setSelectedSport(""); // Clear filter if same sport is clicked
    } else {
      setSelectedSport(sport);
      setSearchQuery(""); // Clear search when selecting a sport
    }
  };

  // Add a debug log for individual capper data
  const debugCapperData = (capper: CapperProfile) => {
    console.log("Individual Capper Data:", {
      username: capper.user.username,
      stats: capper.stats,
      roi: capper.roi,
      tags: capper.tags,
    });
    return capper;
  };

  return (
    <div className="min-h-screen bg-[#020817] text-gray-100">
      {/* Mobile Top Nav */}
      <div className="sticky top-0 z-50 w-full bg-gray-900 border-b border-gray-800 p-4 flex items-center lg:hidden">
        <div className="absolute left-4">
          <SideNav />
        </div>
        <div className="flex-1 flex justify-center">
          <h2 className="text-xl font-semibold">Explore</h2>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <SideNav />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4">
          <div className="max-w-7xl mx-auto lg:mt-0 mt-8">
            <div className="px-2 sm:px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 mt-6 md:mt-12 text-center md:text-left text-[#4e43ff]">
                Explore Cappers
              </h1>

              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                placeholder="Search by sport (e.g., Football, Basketball)"
                selectedSport={selectedSport}
                onSportSelect={handleSportSelect}
              />

              {loading ? (
                <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
                  <Loader />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-12">
                  {cappers.map((capper) => {
                    // Debug log for each capper being rendered
                    debugCapperData(capper);
                    return (
                      <div
                        key={capper.id}
                        onClick={() =>
                          router.push(`/cappers/${capper.user.username}`)
                        }
                        className="bg-gray-800/50 rounded-lg p-4 md:p-6 flex flex-col items-center hover:bg-gray-800 transition-all duration-300 cursor-pointer group relative"
                      >
                        {/* Stats Tooltip - Hidden on mobile */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-full max-w-[200px] bg-[#4e43ff] rounded-lg p-2 opacity-0 group-hover:opacity-100 group-hover:-top-16 transition-all duration-300 z-10 pointer-events-none hidden md:block">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">
                              Winrate:
                            </span>
                            <span className="text-sm font-bold">
                              {capper.stats?.winrate
                                ? `${capper.stats.winrate.toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">ROI:</span>
                            <span className="text-sm font-bold">{`${(capper.roi || 0).toFixed(1)}%`}</span>
                          </div>
                          {/* Arrow */}
                          <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#4e43ff]"></div>
                        </div>

                        <Avatar className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 border-2 border-[#4e43ff]/80 group-hover:border-[#4e43ff] transition-colors duration-300">
                          <AvatarImage src={capper.profileImage} />
                          <AvatarFallback className="bg-[#4e43ff]/10 text-[#4e43ff] text-2xl md:text-3xl lg:text-4xl">
                            {capper.user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg md:text-xl lg:text-2xl mb-2 md:mb-2 mt-3 md:mt-4 truncate w-full text-center group-hover:text-[#4e43ff]/90 transition-colors duration-300">
                          {capper.user.username}
                        </h3>

                        {/* Mobile Stats Display */}
                        <div className="flex w-full justify-center gap-2 px-2 mb-3 md:hidden">
                          <div className="w-[45%]">
                            <div className="bg-[#4e43ff]/10 rounded-lg py-2 px-1 text-center">
                              <span className="block text-[#4e43ff]/70 text-xs mb-0.5">
                                Winrate
                              </span>
                              <span className="block text-[#4e43ff] font-bold">
                                {capper.stats?.winrate
                                  ? `${capper.stats.winrate.toFixed(1)}%`
                                  : "0%"}
                              </span>
                            </div>
                          </div>
                          <div className="w-[45%]">
                            <div className="bg-[#4e43ff]/10 rounded-lg py-2 px-1 text-center">
                              <span className="block text-[#4e43ff]/70 text-xs mb-0.5">
                                ROI
                              </span>
                              <span className="block text-[#4e43ff] font-bold">
                                {`${(capper.roi || 0).toFixed(1)}%`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 md:gap-2 justify-center w-full px-1">
                          {capper.tags?.map((tag, index) => (
                            <span
                              key={index}
                              className="text-[10px] md:text-sm bg-[#4e43ff]/80 hover:bg-[#4e43ff] px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-full flex items-center gap-1 md:gap-2 transition-colors duration-300 whitespace-nowrap"
                            >
                              <span className="text-sm md:text-base">
                                {sportEmojiMap[tag] || "🎯"}
                              </span>
                              <span className="truncate max-w-[80px] md:max-w-none">
                                {tag}
                              </span>
                            </span>
                          )) || (
                            <span className="text-xs md:text-sm text-gray-400">
                              No sports listed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!loading && cappers.length === 0 && (
                <p className="text-center text-gray-400 mt-8">
                  {searchQuery
                    ? `No cappers found for "${searchQuery}"`
                    : "No cappers found. Check back later!"}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
