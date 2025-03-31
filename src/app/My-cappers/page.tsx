"use client";

import { useEffect, useState } from "react";
import Post from "@/components/Posts";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

type Subscription = {
  capperId: string;
  productId: string;
};

function MyCappers() {
  const { user } = useAuth();

  // Use React Query for better caching and parallel data fetching
  const { data: subscriptions = [], isLoading: subsLoading } = useQuery<
    Subscription[]
  >({
    queryKey: ["subscriptions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch("/api/subscriptions/user", {
        headers: { userId: user.id },
      });
      const data = await response.json();
      return data.subscriptions;
    },
    enabled: !!user?.id,
  });

  const {
    data: posts = [],
    isLoading: postsLoading,
    error,
  } = useQuery<Post[]>({
    queryKey: ["posts", subscriptions],
    queryFn: async () => {
      const response = await fetch("/api/posts");
      const data = await response.json();
      const subscribedCapperIds = subscriptions.map((sub) => sub.capperId);
      return data.filter((post: Post) =>
        subscribedCapperIds.includes(post.capperId)
      );
    },
    enabled: subscriptions.length > 0,
  });

  const isLoading = subsLoading || postsLoading;

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
        <div className="text-red-500">{error.message}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="bg-gray-800/50 rounded-xl p-8 max-w-md w-full text-center space-y-6 border border-gray-700">
          <div className="bg-[#4e43ff]/10 p-4 rounded-full w-fit mx-auto">
            <Trophy className="w-12 h-12 text-[#4e43ff]" />
          </div>

          <h3 className="text-2xl font-bold text-white">No Posts Yet</h3>

          <p className="text-gray-400 text-lg">
            Subscribe to some cappers to see their exclusive content and picks
            right here!
          </p>

          <Link href="/Explore" className="block">
            <Button className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white px-8 py-4 rounded-lg w-full">
              Discover Cappers
            </Button>
          </Link>

          <p className="text-sm text-gray-500">
            Once you subscribe, their posts will appear in your feed
            automatically
          </p>
        </div>
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
