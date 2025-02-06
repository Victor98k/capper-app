"use client";

import { SideNav } from "@/components/SideNav";
import ExploreCapperCard from "@/components/exploreCapperCard";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";

type Post = {
  _id: string;
  imageUrl: string;
  capperId: string;
  capperInfo: {
    username: string;
  };
};

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />
      <main className="flex-1 p-4">
        <div className="lg:mt-0 mt-8">
          <h1 className="text-5xl font-bold mb-6 mt-12">Explore our Cappers</h1>
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
                  imageUrl={post.imageUrl}
                />
              ))}
            </div>
          )}
          {!loading && posts.length === 0 && (
            <p className="text-center text-gray-400 mt-8">
              No posts found. Check back later!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
