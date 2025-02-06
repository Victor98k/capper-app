"use client";

import { SideNav } from "@/components/SideNav";
import { useEffect, useState } from "react";
import Post from "@/components/Posts";
import Loader from "@/components/Loader";

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
  productId: string;
};

// push old code.

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
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div className="space-y-6 md:space-y-8 py-4">
        {posts.map((post) => (
          <div
            key={post._id}
            className="flex justify-center border-b border-gray-800 pb-6 md:pb-8 last:border-b-0 last:pb-0"
          >
            <Post {...post} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyCappers;
