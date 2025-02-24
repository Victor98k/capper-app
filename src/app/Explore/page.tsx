"use client";

import { SideNav } from "@/components/SideNav";
import ExploreCapperCard from "@/components/exploreCapperCard";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import SearchBar from "@/components/SearchBar";

type Post = {
  _id: string;
  imageUrl: string | null;
  capperId: string;
  title: string;
  content: string;
  tags: string[];
  capperInfo: {
    username: string;
    profileImage?: string;
    firstName?: string;
    lastName?: string;
    subscribersCount?: number;
    sport?: string;
  };
  likes: number;
};

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: Post[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [allPosts, setAllPosts] = useState<Post[]>([]);

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

    const query = searchQuery.toLowerCase();
    const filtered = allPosts.filter((post) => {
      return post.tags?.some((tag) => tag.toLowerCase().includes(query));
    });

    setPosts(filtered);
  }, [searchQuery, allPosts]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />
      <main className="flex-1 p-4">
        <div className="lg:mt-0 mt-8">
          <h1 className="text-5xl font-bold mb-6 mt-12">Explore our Cappers</h1>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 max-w-9xl mx-auto mt-12">
              {posts.map((post) => (
                <ExploreCapperCard
                  key={post._id}
                  username={post.capperInfo.username}
                  firstName={post.capperInfo.firstName}
                  lastName={post.capperInfo.lastName}
                  imageUrl={post.imageUrl || undefined}
                  profileImage={post.capperInfo.profileImage}
                  sport={post.tags[0]}
                  likes={post.likes}
                />
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
