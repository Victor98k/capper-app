"use client";

import { SideNav } from "@/components/SideNav";
import { useEffect, useState } from "react";
import Post from "@/components/Posts";

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
      <div className="flex justify-center items-center h-full">
        <div>Loading...</div>
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
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-6 py-6">
        {posts.map((post) => (
          <div key={post._id} className="flex justify-center">
            <Post {...post} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyCappers;
