"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { sportEmojiMap } from "@/lib/sportEmojiMap";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
  selectedSport?: string;
  onSportSelect?: (sport: string) => void;
}

// Common sports to show as quick filters
const quickFilterSports = [
  "Football",
  "Basketball",
  "Tennis",
  "American Football",
  "Baseball",
  "Ice Hockey",
  "MMA",
  "Golf",
];

export function SearchBar({
  searchQuery,
  setSearchQuery,
  placeholder = "Search by sport (e.g., Football, Basketball)",
  selectedSport = "",
  onSportSelect,
}: SearchBarProps) {
  return (
    <div className="max-w-2xl mx-auto mb-8">
      {/* Quick Sport Filters */}
      <div className="mb-4 flex flex-wrap gap-2 justify-center">
        {quickFilterSports.map((sport) => (
          <button
            key={sport}
            onClick={() => onSportSelect?.(sport)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
              selectedSport === sport
                ? "bg-[#4e43ff] text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <span className="text-lg">{sportEmojiMap[sport] || "🎯"}</span>
            <span className="text-sm font-medium">{sport}</span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-violet-500 focus:border-violet-500"
        />
      </div>
    </div>
  );
}

export default SearchBar;
