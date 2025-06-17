"use client";

import React from "react";
import { useEffect, useState } from "react";
import { SideNav } from "@/components/SideNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// UI
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
// Icons
import {
  CheckCircle,
  Trophy,
  TrendingUp,
  Users,
  Star,
  Loader2,
  Check,
  Shield,
  User,
  Calculator,
  Instagram,
  Twitter,
  Youtube,
  MessageSquare,
  Phone,
  Zap,
  Mail,
} from "lucide-react";
import { use } from "react";
// Components
import { SubscribeButton } from "@/components/SubscribeButton";
import InstagramPost from "@/components/Posts";
import { Input } from "@/components/ui/input";
import { sportEmojiMap } from "@/lib/sportEmojiMap";
import Loader from "@/components/Loader";
// Types
import { PriceRecurring } from "@/types/priceRecurring";
import { CapperProfile } from "@/types/capperProfile";
import { Pick } from "@/types/betPickForCapperProfile";
import { Post } from "@/types/capperPost";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

interface PerformanceData {
  date: string;
  title: string;
  units: number;
  status: string;
  unitChange: number;
}

const calculateWinRate = (performanceData: PerformanceData[]) => {
  const completedBets = performanceData.filter(
    (bet) => bet.status === "WON" || bet.status === "LOST"
  );

  const wonBets = completedBets.filter((bet) => bet.status === "WON").length;
  const totalBets = completedBets.length;

  if (totalBets === 0) return "0%";

  const winRate = (wonBets / totalBets) * 100;

  return `${winRate.toFixed(1)}%`;
};

type PageData = {
  posts: Post[];
  nextPage: number;
  hasMore: boolean;
};

export default function CapperProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = use(params);
  const [capper, setCapper] = useState<CapperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [subscribedProducts, setSubscribedProducts] = useState<string[]>([]);
  const [calculatedAmount, setCalculatedAmount] = useState("0.00");
  const [showROICalculator, setShowROICalculator] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 6;
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  const {
    data,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PageData>({
    queryKey: ["capper-posts", capper?.id],
    enabled: !!capper?.id,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/posts?capperId=${capper?.id}`);
      const data = await response.json();

      const start = (pageParam as number) * POSTS_PER_PAGE;
      const end = start + POSTS_PER_PAGE;
      const paginatedPosts = data.slice(start, end);

      return {
        posts: paginatedPosts,
        nextPage: (pageParam as number) + 1,
        hasMore: end < data.length,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
  });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  useEffect(() => {
    const fetchCapperProfile = async () => {
      try {
        const response = await fetch(`/api/cappers/${resolvedParams.username}`);
        if (!response.ok) {
          throw new Error("Failed to fetch capper profile");
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        // Update capper state with roi and winrate
        setCapper({ ...data, roi: data.user.roi, winrate: data.user.winrate });
      } catch (error: unknown) {
        console.error(
          "Error fetching capper profile:",
          error instanceof Error ? error.message : "Unknown error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCapperProfile();
  }, [resolvedParams.username]);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        // Only check subscription status if we have both capper ID and product ID
        if (!capper?.id || !capper?.products?.[0]?.id) {
          return;
        }

        const response = await fetch(
          `/api/subscriptions/check?capperId=${capper.id}&productId=${capper.products[0].id}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          // console.log("Fetched subscriptions for profile:", data);
          setIsSubscribed(data.subscribedProducts.length > 0);
          setSubscribedProducts(data.subscribedProducts || []);
          setSubscriptionDetails(data.subscriptionDetails);
        } else {
          console.error("Subscription check failed:", await response.text());
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
      }
    };

    checkSubscriptionStatus();
  }, [capper?.id, capper?.products]);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await fetch(
          `/api/cappers/${resolvedParams.username}/bets`
        );
        if (!response.ok) throw new Error("Failed to fetch performance data");
        const data = await response.json();
        setPerformanceData(data);
      } catch (error) {
        console.error("Error fetching performance data:", error);
      }
    };

    if (capper) {
      fetchPerformanceData();
    }
  }, [capper, resolvedParams.username]);

  // ERROR LOGS
  // useEffect(() => {
  //   if (capper) {
  //     console.log(
  //       "Capper subscriberIds (subscriptions):",
  //       capper.subscriberIds
  //     );
  //   }
  // }, [capper]);

  // Add this useEffect to handle the initial scroll if there's a hash in the URL
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash === "#subscription-plans"
    ) {
      setTimeout(() => {
        const element = document.getElementById("subscription-plans");
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500); // Longer delay to ensure content is loaded
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Loader />
          </div>
        </main>
      </div>
    );
  }

  if (!capper) {
    return (
      <div className="min-h-screen bg-[#020817] text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8">
          <p className="text-center">Capper not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] text-gray-100 flex flex-col lg:flex-row">
      {/* Hide SideNav on mobile */}
      <div className="hidden lg:block">
        <SideNav />
      </div>

      {/* Add mobile header */}
      <div className="lg:hidden sticky top-0 z-50 w-full bg-[#020817] border-b border-gray-800 p-4 flex items-center">
        <div className="absolute left-4">
          <SideNav />
        </div>
        <div className="flex-1 text-right pr-4">
          <h1 className="text-xl font-semibold">@{capper?.user?.username}</h1>
        </div>
      </div>

      <main className="flex-1 p-2 sm:p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header - More compact on mobile */}
          <div className="bg-gray-800/30 rounded-lg p-4 sm:p-6 mb-4 sm:mb-8">
            {/* Profile Info Section - Make it more compact on mobile */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Avatar - Smaller on mobile */}
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40">
                <AvatarImage
                  src={capper?.profileImage || capper?.imageUrl || ""}
                  alt={`${capper?.user?.firstName || ""} ${
                    capper?.user?.lastName || ""
                  }`}
                />
                <AvatarFallback className="bg-[#4e43ff] text-white text-2xl sm:text-4xl uppercase">
                  {capper?.user?.username?.slice(0, 2).toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>

              {/* Profile Details - Center on mobile */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 sm:gap-4">
                  <div>
                    {/* Name and Verification */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl pb-6 font-bold flex items-center justify-center sm:justify-start gap-2">
                      @{capper?.user?.username}
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                    </h1>

                    {/* Title - if exists */}
                    {capper?.title && (
                      <p className="text-base sm:text-lg text-violet-400 mb-2 sm:mb-4">
                        {capper.title}
                      </p>
                    )}
                  </div>

                  {/* Subscription Status/Button */}
                  {isSubscribed ? (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full text-sm font-medium mb-4 sm:mb-0">
                      <Check className="h-4 w-4" />
                      Subscribed Member
                    </div>
                  ) : (
                    <SubscribeButton
                      capperId={capper.id}
                      isSubscribed={isSubscribed}
                      scrollToBundles={true}
                      className="relative overflow-hidden bg-[#4e43ff] mb-4 sm:mb-0 sm:hover:bg-[#4e43ff]/95 sm:group sm:transition-all sm:duration-200 sm:ease-out sm:hover:scale-[1.02] sm:hover:shadow-[0_0_15px_rgba(78,67,255,0.25)] active:scale-[0.98]"
                      onClick={() => {
                        document
                          .getElementById("subscription-plans")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                    >
                      <span className="relative z-10">Subscribe</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-violet-400/30 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 ease-out" />
                    </SubscribeButton>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mb-4">
                  {capper.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 bg-[#4e43ff] text-gray-300 border-0"
                    >
                      <span className="text-base sm:text-lg md:text-xl">
                        {sportEmojiMap[tag] || "🎯"}
                      </span>
                      <span className="text-xs sm:text-sm md:text-base">
                        {tag}
                      </span>
                    </Badge>
                  ))}
                </div>

                {/* Bio */}
                <p className="text-gray-100 text-sm sm:text-base whitespace-pre-wrap">
                  {capper.bio}
                </p>

                {/* Communication Channels Section */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
                    <p className="text-xs sm:text-sm md:text-base text-gray-400">
                      Communication channels for details and analysis
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {/* Email Notifications Badge - Always visible */}
                    <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-gradient-to-r from-violet-600/20 to-violet-400/20 border border-violet-500/20">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-violet-400" />
                      <span className="text-xs sm:text-sm md:text-base text-gray-200">
                        E-mail Notifications
                      </span>
                    </div>

                    {/* Social Media Badges - Shown if they exist */}
                    {capper.socialLinks?.instagram?.username &&
                      capper.socialLinks?.instagram?.url && (
                        <a
                          href={capper.socialLinks.instagram.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600/30 hover:to-purple-600/30 transition-all border border-pink-500/20 hover:border-pink-500/40"
                        >
                          <Instagram className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-pink-400" />
                          <span className="text-xs sm:text-sm md:text-base text-gray-200">
                            @{capper.socialLinks.instagram.username}
                          </span>
                        </a>
                      )}

                    {capper.socialLinks?.x?.username &&
                      capper.socialLinks?.x?.url && (
                        <a
                          href={capper.socialLinks.x.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-gradient-to-r from-blue-600/20 to-blue-400/20 hover:from-blue-600/30 hover:to-blue-400/30 transition-all border border-blue-500/20 hover:border-blue-500/40"
                        >
                          <Twitter className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-400" />
                          <span className="text-xs sm:text-sm md:text-base text-gray-200">
                            @{capper.socialLinks.x.username}
                          </span>
                        </a>
                      )}

                    {capper.socialLinks?.youtube?.username &&
                      capper.socialLinks?.youtube?.url && (
                        <a
                          href={capper.socialLinks.youtube.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-gradient-to-r from-red-600/20 to-red-400/20 hover:from-red-600/30 hover:to-red-400/30 transition-all border border-red-500/20 hover:border-red-500/40"
                        >
                          <Youtube className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-400" />
                          <span className="text-xs sm:text-sm md:text-base text-gray-200">
                            {capper.socialLinks.youtube.username}
                          </span>
                        </a>
                      )}

                    {capper.socialLinks?.discord?.username &&
                      capper.socialLinks?.discord?.url && (
                        <a
                          href={capper.socialLinks.discord.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-gradient-to-r from-indigo-600/20 to-indigo-400/20 hover:from-indigo-600/30 hover:to-indigo-400/30 transition-all border border-indigo-500/20 hover:border-indigo-500/40"
                        >
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-indigo-400" />
                          <span className="text-xs sm:text-sm md:text-base text-gray-200">
                            {capper.socialLinks.discord.username}
                          </span>
                        </a>
                      )}

                    {capper.socialLinks?.whatsapp?.username &&
                      capper.socialLinks?.whatsapp?.url && (
                        <a
                          href={capper.socialLinks.whatsapp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-gradient-to-r from-green-600/20 to-green-400/20 hover:from-green-600/30 hover:to-green-400/30 transition-all border border-green-500/20 hover:border-green-500/40"
                        >
                          <Phone className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-400" />
                          <span className="text-xs sm:text-sm md:text-base text-gray-200">
                            {capper.socialLinks.whatsapp.username}
                          </span>
                        </a>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Overview - Stack on mobile */}
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
              <StatCard
                icon={<Users />}
                title="Subscribers"
                value={capper.subscriberIds.length.toLocaleString()}
              />
              <StatCard
                icon={<Trophy />}
                title="Win Rate"
                value={`${capper.winrate || 0}%`}
              />
              <StatCard
                icon={<TrendingUp />}
                title="ROI"
                value={`${capper.roi || 0}%`}
              />
              <StatCard
                icon={<Calculator />}
                title="ROI Calculator"
                value="Calculate"
                onClick={() => setShowROICalculator(!showROICalculator)}
                className="cursor-pointer hover:bg-gray-600/50 transition-colors"
              />
            </div>

            {/* Performance Chart - Moved here */}
            <Card className="mt-8 bg-gray-800/30 border-gray-700 p-4 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-bold text-2xl">
                  Betting Performance
                </CardTitle>
                <CardDescription className="text-white">
                  Cumulative units over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString()
                        }
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tickFormatter={(value) => `${value}u`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                        }}
                        labelStyle={{ color: "#9CA3AF" }}
                        formatter={(value: any, name: string, props: any) => {
                          const bet = performanceData[props.payload.index];
                          if (!bet) return [value + "u", "Units"];
                          return [
                            `${value}u (${bet.status === "WON" ? "+" + bet.unitChange : bet.unitChange}u)`,
                            "Units",
                            bet.title,
                          ];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="units"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={(props: any) => {
                          const bet = performanceData[props.index];
                          return (
                            <circle
                              key={`dot-${props.index}`}
                              cx={props.cx}
                              cy={props.cy}
                              r={4}
                              fill={
                                !bet
                                  ? "#8B5CF6"
                                  : bet.status === "WON"
                                    ? "#22c55e"
                                    : "#ef4444"
                              }
                              stroke="none"
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ROI Calculator */}
            {showROICalculator && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-700/30 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">
                  ROI Calculator
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-full sm:w-auto sm:flex-1 max-w-xs">
                    <Input
                      type="number"
                      placeholder="Enter investment amount"
                      className="bg-gray-800 border-gray-600 text-white text-sm sm:text-base"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          const roi = value * (1 + (capper.roi || 0) / 100);
                          setCalculatedAmount(roi.toFixed(2));
                        } else {
                          setCalculatedAmount("0.00");
                        }
                      }}
                    />
                  </div>
                  <div className="text-base sm:text-lg">
                    <span className="text-gray-400 mr-2">=</span>
                    <span className="text-green-400">${calculatedAmount}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  Calculate your potential returns based on historical ROI of{" "}
                  {capper.roi || 0}%
                </p>
              </div>
            )}
          </div>
          {/* Tabs Section */}
          {/* removed the taps section for now. */}

          {/* Posts Section */}
          <div className="mb-12">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">
                {capper.user.username}'s Posts
              </h2>
              <p className="text-gray-400 mt-2">
                Latest picks and predictions from {capper.user.username}
              </p>
            </div>

            {/* Show preview posts for non-subscribers */}
            {!isSubscribed && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {allPosts.slice(0, 4).map((post) => (
                    <InstagramPost
                      key={post._id}
                      {...post}
                      capperInfo={{
                        firstName: capper.user.firstName,
                        lastName: capper.user.lastName,
                        username: capper.user.username,
                        profileImage: capper.profileImage,
                        isVerified: true,
                      }}
                    />
                  ))}
                </div>

                {/* Subscription prompt */}
                {allPosts.length > 4 && (
                  <div className="relative my-12">
                    <div className="relative bg-gray-800/50 rounded-xl p-8 text-center backdrop-blur-sm border border-violet-500/20">
                      <h3 className="text-2xl font-bold mb-4">
                        Subscribe to See More Posts
                      </h3>
                      <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                        Get access to all of {capper.user.firstName}'s exclusive
                        content, picks, and analysis
                      </p>
                      <SubscribeButton
                        capperId={capper.id}
                        isSubscribed={isSubscribed}
                        scrollToBundles={true}
                        className="relative overflow-hidden bg-violet-500 sm:hover:bg-violet-500/95 sm:group sm:transition-all sm:duration-200 sm:ease-out sm:hover:scale-[1.02] sm:hover:shadow-[0_0_15px_rgba(139,92,246,0.25)] active:scale-[0.98]"
                      >
                        <span className="relative z-10">Subscribe Now</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-violet-400/30 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 ease-out" />
                      </SubscribeButton>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Show all paginated posts for subscribers */}
            {isSubscribed && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {allPosts.map((post) => (
                    <InstagramPost
                      key={post._id}
                      {...post}
                      capperInfo={{
                        firstName: capper.user.firstName,
                        lastName: capper.user.lastName,
                        username: capper.user.username,
                        profileImage: capper.profileImage,
                        isVerified: true,
                      }}
                    />
                  ))}
                </div>

                {/* Loading indicator */}
                <div ref={ref} className="flex justify-center py-4">
                  {isFetchingNextPage && <Loader />}
                </div>
              </>
            )}

            {/* Subscription Packages Section */}
            <div className="mt-12" id="subscription-plans">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Subscription Plans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {capper.products.length > 0 ? (
                  capper.products.map((product, index) => {
                    const isSubscribedToProduct = subscribedProducts.includes(
                      product.id
                    );
                    const isMiddleCard =
                      capper.products.length === 3 && index === 1;

                    return (
                      <div
                        key={product.id}
                        className={`rounded-xl p-6 transition-all duration-200 sm:hover:transform sm:hover:scale-[1.01] flex flex-col h-full
                          ${
                            isSubscribedToProduct
                              ? "bg-[#4e43ff] border-2 border-white/20"
                              : isMiddleCard
                                ? "bg-gradient-to-br from-violet-600/50 to-violet-900/50 border-2 border-violet-400/50 shadow-[0_0_30px_rgba(139,92,246,0.2)] relative"
                                : "bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 sm:hover:border-[#4e43ff]/30"
                          }
                          ${isMiddleCard ? "lg:-mt-4 lg:p-8" : ""}
                          sm:hover:shadow-[0_0_20px_rgba(78,67,255,0.15)]
                        `}
                      >
                        <div className="flex-1">
                          {isMiddleCard && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-violet-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                              Most Popular
                            </div>
                          )}

                          {/* Product Header */}
                          <div className="flex justify-between items-start mb-6">
                            <h3
                              className={`text-2xl font-bold ${
                                isSubscribedToProduct
                                  ? "text-white"
                                  : isMiddleCard
                                    ? "text-violet-300"
                                    : "text-[#4e43ff]"
                              }`}
                            >
                              {product.name}
                            </h3>
                            {isSubscribedToProduct && (
                              <span className="flex items-center gap-1 text-sm bg-white/20 text-white px-3 py-1 rounded-full">
                                <Check className="h-4 w-4" />
                                Active
                              </span>
                            )}
                          </div>

                          {/* Price Display */}
                          <div className="mb-8">
                            <div className="flex items-baseline">
                              <span
                                className={`text-4xl font-bold ${
                                  isSubscribedToProduct
                                    ? "text-white"
                                    : "text-white"
                                }`}
                              >
                                {product.default_price.unit_amount <= 1
                                  ? "Free"
                                  : new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency:
                                        product.default_price.currency || "USD",
                                    }).format(
                                      product.default_price.unit_amount / 100
                                    )}
                              </span>
                              {product.default_price.unit_amount > 0 && (
                                <span
                                  className={`ml-2 ${
                                    isSubscribedToProduct
                                      ? "text-white/80"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {product.default_price?.recurring?.interval
                                    ? `/${product.default_price.recurring.interval}`
                                    : product.default_price.type === "one_time"
                                      ? " one-time"
                                      : ""}
                                </span>
                              )}
                            </div>
                            <p
                              className={`mt-2 ${
                                isSubscribedToProduct
                                  ? "text-white/80"
                                  : "text-gray-400"
                              }`}
                            >
                              {product.description}
                            </p>
                          </div>

                          {/* Features List */}
                          <ul className="space-y-4 mb-8">
                            {Array.isArray(product.marketing_features) &&
                              product.marketing_features.map(
                                (feature, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-3"
                                  >
                                    <Zap
                                      className={`h-5 w-5 flex-shrink-0 ${
                                        isSubscribedToProduct
                                          ? "text-white"
                                          : "text-[#4e43ff]"
                                      }`}
                                    />
                                    <span
                                      className={
                                        isSubscribedToProduct
                                          ? "text-white/90"
                                          : "text-gray-300"
                                      }
                                    >
                                      {feature}
                                    </span>
                                  </li>
                                )
                              )}
                          </ul>
                        </div>

                        {/* Subscribe Button */}
                        <div className="mt-auto">
                          <SubscribeButton
                            capperId={capper.id}
                            productId={product.id}
                            priceId={product.default_price.id}
                            stripeAccountId={capper.user.stripeConnectId}
                            isSubscribed={isSubscribedToProduct}
                            className={`w-full relative overflow-hidden sm:group sm:transition-all sm:duration-200 sm:ease-out sm:hover:scale-[1.02] active:scale-[0.98] ${
                              isSubscribedToProduct
                                ? "bg-white/20 sm:hover:bg-white/25 text-white"
                                : isMiddleCard
                                  ? "bg-violet-500 sm:hover:bg-violet-500/95 text-white sm:hover:shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                                  : "bg-[#4e43ff] sm:hover:bg-[#4e43ff]/95 text-white sm:hover:shadow-[0_0_15px_rgba(78,67,255,0.25)]"
                            }`}
                          >
                            <span className="relative z-10">
                              {isSubscribedToProduct
                                ? "Unsubscribe"
                                : "Subscribe Now"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-violet-400/30 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 ease-out" />
                          </SubscribeButton>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-400">
                      This capper hasn't created any subscription plans yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* No Posts Message */}
            {allPosts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No posts available yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
// Helper Components
const StatCard = ({
  icon,
  title,
  value,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  onClick?: () => void;
  className?: string;
}) => (
  <div onClick={onClick} className={`cursor-pointer ${className}`}>
    {/* Mobile version - just icon and value */}
    <div className="sm:hidden flex flex-col items-center">
      <div className="text-violet-400 mb-1">
        {React.cloneElement(icon as React.ReactElement, {
          className: "h-6 w-6",
        })}
      </div>
      <p className="text-base font-bold">{value}</p>
    </div>

    {/* Desktop version - full card */}
    <div className="hidden sm:flex bg-gray-700/50 p-4 rounded-lg items-center space-x-4">
      <div className="text-violet-400">
        {React.cloneElement(icon as React.ReactElement, {
          className: "h-6 w-6",
        })}
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const PickCard = ({ sport, prediction, result, date, odds }: Pick) => (
  <Card className="bg-gray-800 border-gray-700">
    <CardContent className="p-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0">
        <div>
          <p className="text-violet-400 font-semibold">{sport}</p>
          <p className="text-xl font-bold mt-1">{prediction}</p>
          <p className="text-sm text-gray-400">
            {new Date(date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0">
          <Badge
            variant={result === "win" ? "default" : "destructive"}
            className={result === "win" ? "bg-green-600" : ""}
          >
            {result.toUpperCase()}
          </Badge>
          <p className="text-sm text-gray-400 sm:mt-2">Odds: {odds}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PaginationButton = ({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    variant="outline"
    className="bg-gray-800 border-gray-700 hover:bg-gray-700 disabled:opacity-50"
  >
    {children}
  </Button>
);
