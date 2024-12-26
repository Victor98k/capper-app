"use client";

import { SideNav } from "@/components/SideNav";
import { useEffect, useState } from "react";
import Post from "@/components/Posts";

// push deploy.

type Post = {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  odds: string[];
  bets: string[];
  tags: string[];
  capperId: string;
  createdAt: string;
  updatedAt: string;
};

function MyCappers() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await response.json();
        if (mounted) {
          setPosts(data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        if (mounted) {
          setError("Failed to fetch posts");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8 lg:p-8">
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8 lg:p-8">
          <div className="text-red-500">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />
      <main className="flex-1 p-8 lg:p-12">
        <div className="lg:mt-0 mt-8">
          <h2 className="text-3xl font-bold mb-8">My Cappers</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Post key={post._id} {...post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyCappers;
