"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import Post from "@/components/Posts";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy, TrendingUp, Users, Zap, Compass } from "lucide-react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { sportEmojiMap } from "@/lib/sportEmojiMap";
import { useInView } from "react-intersection-observer";
import { Card, CardContent } from "@/components/ui/card";
import { SideNav } from "@/components/SideNav";

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

type Capper = {
  id: string;
  userId: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  };
  profileImage: string;
  tags: string[];
};

type PostsResponse = {
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

type PageData = {
  posts: PostsResponse[];
  nextPage: number;
  hasMore: boolean;
};

// Dynamically import the component with SSR disabled
const MyCappers = dynamic(
  () =>
    Promise.resolve(function MyCappers() {
      const { user } = useAuth();
      const router = useRouter();
      const { ref, inView } = useInView();
      const POSTS_PER_PAGE = 10;

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
        data,
        isLoading: postsLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
      } = useInfiniteQuery<PageData>({
        queryKey: ["posts", subscriptions],
        initialPageParam: 0,
        queryFn: async ({ pageParam = 0 }) => {
          const response = await fetch("/api/posts");
          const data = await response.json();
          const subscribedCapperIds = subscriptions.map((sub) => sub.capperId);
          const filteredPosts = data.filter((post: PostsResponse) =>
            subscribedCapperIds.includes(post.capperId)
          );

          const start = (pageParam as number) * POSTS_PER_PAGE;
          const end = start + POSTS_PER_PAGE;
          const paginatedPosts = filteredPosts.slice(start, end);

          return {
            posts: paginatedPosts,
            nextPage: (pageParam as number) + 1,
            hasMore: end < filteredPosts.length,
          };
        },
        getNextPageParam: (lastPage) =>
          lastPage.hasMore ? lastPage.nextPage : undefined,
        enabled: subscriptions.length > 0,
      });

      useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

      const isLoading = subsLoading || postsLoading;
      const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

      const { data: featuredCappers = [] } = useQuery<Capper[]>({
        queryKey: ["featuredCappers"],
        queryFn: async () => {
          const response = await fetch("/api/cappers");
          const data = await response.json();
          // Filter cappers that have both sports tags and a profile picture
          const cappersWithSportsAndImage = data
            .filter(
              (capper: Capper) =>
                capper.tags && capper.tags.length > 0 && capper.profileImage // Only include cappers with profile images
            )
            .slice(0, 4);

          return cappersWithSportsAndImage;
        },
      });

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

      if (allPosts.length === 0) {
        return (
          <div className="w-full px-4 py-6">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-700/50">
              {/* Header Section */}
              <div className="text-center space-y-4 mb-8">
                {/* Animated Icon */}
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 bg-[#4e43ff]/20 rounded-full animate-ping" />
                  <div className="relative bg-[#4e43ff]/10 rounded-full p-5">
                    <Trophy className="w-10 h-10 text-[#4e43ff]" />
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Start Following Cappers
                </h2>

                <Card className="max-w-4xl mx-auto bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
                  <CardContent>
                    <p className="text-white font-medium text-base md:text-lg max-w-lg mx-auto text-center pt-4">
                      Follow expert cappers to see their exclusive picks and
                      analysis in your feed
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Features Grid */}
              {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-8">
                {/* <div className="bg-gray-800/30 p-4 rounded-xl hover:bg-gray-800/50 transition-colors">
                  <TrendingUp className="w-8 h-8 text-[#4e43ff] mb-3" />
                  <h3 className="font-semibold text-white mb-2">
                    Expert Analysis
                  </h3>
                  <p className="text-sm text-gray-400">
                    Get detailed insights from experienced cappers
                  </p>
                </div> */}
              {/* <div className="bg-gray-800/30 p-4 rounded-xl hover:bg-gray-800/50 transition-colors">
                  <Zap className="w-8 h-8 text-[#4e43ff] mb-3" />
                  <h3 className="font-semibold text-white mb-2">
                    Real-time Picks
                  </h3>
                  <p className="text-sm text-gray-400">
                    Access picks as soon as they're posted
                  </p>
                </div>

                <div className="bg-gray-800/30 p-4 rounded-xl hover:bg-gray-800/50 transition-colors">
                  <Users className="w-8 h-8 text-[#4e43ff] mb-3" />
                  <h3 className="font-semibold text-white mb-2">Community</h3>
                  <p className="text-sm text-gray-400">
                    Join a community of successful bettors
                  </p>
                </div> */}
              {/* </div> */}
              {/* Featured Cappers */}
              {featuredCappers.length > 0 && (
                <div className="my-12">
                  <h3 className="text-xl font-semibold text-white text-center mb-6">
                    Featured Cappers
                  </h3>
                  <div className="grid grid-cols-2 sm:flex sm:flex-row justify-center items-start gap-4 sm:gap-8">
                    {featuredCappers.map((capper) => (
                      <div
                        key={capper.id}
                        onClick={() =>
                          router.push(`/cappers/${capper.user.username}`)
                        }
                        className="flex flex-col items-center gap-3 cursor-pointer group w-full min-h-[160px]"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#4e43ff]/20 rounded-full group-hover:animate-ping" />
                          <Avatar className="h-14 w-14 sm:h-20 sm:w-20 border-2 border-[#4e43ff] relative">
                            <AvatarImage src={capper.profileImage} />
                            <AvatarFallback className="bg-[#4e43ff]/10 text-[#4e43ff]">
                              {capper.user.firstName?.[0]}
                              {capper.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="font-medium text-white group-hover:text-[#4e43ff] transition-colors text-sm sm:text-base text-center">
                          @{capper.user.username}
                        </span>
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 min-h-[28px]">
                          {capper.tags.slice(0, 2).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-gray-800/50 border-[#4e43ff]/20 text-xs sm:text-sm whitespace-nowrap"
                            >
                              <span className="mr-1">
                                {sportEmojiMap[tag] || "🎯"}
                              </span>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* CTA Section */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Button
                  onClick={() => router.push("/Explore")}
                  className="w-full sm:w-auto bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white px-8 py-6 text-lg rounded-xl"
                >
                  <Compass className="w-5 h-5 mr-2" />
                  Explore Cappers
                </Button>

                <Button
                  onClick={() => router.push("/Explore")}
                  variant="outline"
                  className="w-full sm:w-auto border-[#4e43ff]/50 text-[#4e43ff] hover:bg-[#4e43ff]/10 px-8 py-6 text-lg rounded-xl"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  View Trending
                </Button>
              </div>
              {/* Bottom Info */}
              <div className="mt-8 pt-6 border-t border-gray-700/50">
                <p className="text-center text-sm text-gray-400">
                  Subscribe to cappers to unlock exclusive content and real-time
                  picks
                </p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#020817] text-gray-100">
          {/* Mobile Top Nav */}

          <div className="flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <SideNav />
            </div>

            {/* Main Content */}
            <main className="flex-1 pt-1 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="px-2 sm:px-4">
                  {/* <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 text-center md:text-left text-[#4e43ff]">
                    My Cappers
                  </h1> */}

                  <div className="w-full mx-auto">
                    <div className="space-y-3 md:space-y-6">
                      {allPosts.map((post) => (
                        <div
                          key={post._id}
                          className="flex justify-center border-b border-gray-800 pb-6 md:pb-8 last:border-b-0 last:pb-0"
                        >
                          <Post {...post} />
                        </div>
                      ))}

                      {/* Loading indicator */}
                      <div ref={ref} className="flex justify-center py-4">
                        {isFetchingNextPage && <Loader />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      );
    }),
  { loading: () => <Loader />, ssr: false }
); // Disable SSR for this component

export default MyCappers;
