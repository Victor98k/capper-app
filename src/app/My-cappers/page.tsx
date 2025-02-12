"use client";

import { SideNav } from "@/components/SideNav";
import { useEffect, useState } from "react";
import Post from "@/components/Posts";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch("/api/subscriptions/user", {
          headers: {
            userId: user.id,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch subscriptions");
        }

        const data = await response.json();
        setSubscriptions(data.subscriptions);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      }
    };

    fetchSubscriptions();
  }, [user?.id]);

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
          const subscribedCapperIds = subscriptions.map((sub) => sub.capperId);
          const filteredPosts = data.filter((post: Post) =>
            subscribedCapperIds.includes(post.capperId)
          );

          setPosts(filteredPosts);
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
  }, [subscriptions]);

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

  if (posts.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-gray-400">
          No posts from your subscribed cappers yet.
          <br />
          Subscribe to some cappers to see their content here!
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
