"use client";

import { useEffect, useState } from "react";

// Components
import { SideNav } from "@/components/SideNav";
import ExploreCapperCard from "@/components/exploreCapperCard";

import Loader from "@/components/Loader";
import SearchBar from "@/components/SearchBar";
// Types
import { ExplorePost } from "@/types/capperPost";

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: ExplorePost[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function ExplorePage() {
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [allPosts, setAllPosts] = useState<ExplorePost[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        const data = await response.json();
        const shuffledData = shuffleArray(data);
        setAllPosts(shuffledData);
        setPosts(shuffledData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPosts(allPosts);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const filtered = allPosts.filter((post) => {
      return post.tags?.some(
        (tag) =>
          tag.toLowerCase().trim().includes(query) ||
          query.includes(tag.toLowerCase().trim())
      );
    });

    setPosts(filtered);
  }, [searchQuery, allPosts]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />
      <main className="flex-1 p-4 md:ml-16">
        <div className="max-w-7xl mx-auto lg:mt-0 mt-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 mt-6 md:mt-12 text-center md:text-left bg-gradient-to-r from-violet-500 to-violet-300 bg-clip-text text-transparent">
            Explore our Cappers
          </h1>

          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search by sport (e.g., Football, Basketball)"
          />

          {loading ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
              <Loader />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-auto gap-4 mt-12">
              {posts.map((post, index) => (
                <div
                  key={post._id}
                  className={`${
                    // Make every 5th post span 2 columns and 2 rows
                    index % 5 === 0
                      ? "col-span-2 row-span-2"
                      : // Make every 8th post span 2 rows
                        index % 8 === 0
                        ? "row-span-2"
                        : // Make every 12th post span 2 columns
                          index % 12 === 0
                          ? "col-span-2"
                          : ""
                  }`}
                >
                  <ExploreCapperCard
                    username={post.capperInfo.username}
                    firstName={post.capperInfo.firstName}
                    lastName={post.capperInfo.lastName}
                    imageUrl={post.imageUrl || undefined}
                    profileImage={post.capperInfo.profileImage}
                    sport={post.tags[0]}
                    likes={post.likes}
                  />
                </div>
              ))}
            </div>
          )}
          {!loading && posts.length === 0 && (
            <p className="text-center text-gray-400 mt-8">
              {searchQuery
                ? `No posts found for "${searchQuery}"`
                : "No posts found. Check back later!"}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
