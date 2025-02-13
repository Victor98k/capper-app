"use client";

import React from "react";
import { useEffect, useState } from "react";
import { SideNav } from "@/components/SideNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
} from "lucide-react";
import { use } from "react";
import { SubscribeButton } from "@/components/SubscribeButton";
import InstagramPost from "@/components/Posts";
import { Input } from "@/components/ui/input";
import { sportEmojiMap } from "@/lib/sportEmojiMap";
import Loader from "@/components/Loader";

type PriceRecurring = {
  interval?: "day" | "week" | "month" | "year" | null;
  interval_count?: number;
};

type CapperProfile = {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    username: string;
    stripeConnectId: string;
  };
  bio?: string;
  title?: string;
  imageUrl?: string;
  profileImage?: string;
  tags: string[];
  subscriberIds: string[];
  socialLinks?: Record<string, string>;
  products: {
    id: string;
    name: string;
    description: string | null;
    default_price: {
      id: string;
      recurring: PriceRecurring | null;
      unit_amount: number;
      currency: string;
      type: "one_time" | "recurring";
    };
    marketing_features: string[];
  }[];
};

type Pick = {
  id: string;
  sport: string;
  prediction: string;
  result: "win" | "loss" | "pending";
  date: string;
  odds: number;
};

type Post = {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  odds: string[];
  bets: string[];
  tags: string[];
  capperId: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  likes?: number;
  comments?: number;
  capperInfo?: {
    firstName: string;
    lastName: string;
    username: string;
    imageUrl?: string;
    isVerified?: boolean;
  };
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [subscribedProducts, setSubscribedProducts] = useState<string[]>([]);
  const [calculatedAmount, setCalculatedAmount] = useState("0.00");
  const [showROICalculator, setShowROICalculator] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;

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

        console.log("Received capper data:", {
          id: data.id,
          username: data.user.username,
          products: data.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            features: p.marketing_features,
          })),
        });

        setCapper(data);
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
        console.log("Checking subscription for capper:", capper?.id);
        const response = await fetch(
          `/api/subscriptions/check?capperId=${capper?.id}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Subscription check response:", data);
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

    if (capper?.id) {
      checkSubscriptionStatus();
    }
  }, [capper?.id]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!capper?.id) return;

      try {
        const response = await fetch(`/api/posts?capperId=${capper.id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, [capper?.id]);

  useEffect(() => {
    const checkSubscriptions = async () => {
      if (!capper?.id) return;

      try {
        const response = await fetch(
          `/api/subscriptions/check?capperId=${capper.id}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Subscription check response:", data);
          setSubscribedProducts(data.subscribedProducts || []);
        }
      } catch (error) {
        console.error("Error checking subscriptions:", error);
      }
    };

    checkSubscriptions();
  }, [capper?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
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
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8">
          <p className="text-center">Capper not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col lg:flex-row">
      {/* Hide SideNav on mobile */}
      <div className="hidden lg:block">
        <SideNav />
      </div>

      {/* Add mobile header */}
      <div className="lg:hidden sticky top-0 z-50 w-full bg-gray-900 border-b border-gray-800 p-4 flex items-center">
        <div className="absolute left-4">
          <SideNav />
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">Capper Profile</h1>
        </div>
      </div>

      <main className="flex-1 p-2 sm:p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header - More compact on mobile */}
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-8">
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
                  {capper?.user?.firstName?.charAt(0) || ""}
                  {capper?.user?.lastName?.charAt(0) || ""}
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
                      className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 mb-4 sm:mb-0"
                    >
                      Subscribe
                    </SubscribeButton>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                  {capper.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-[#4e43ff] text-gray-300 flex items-center gap-2"
                    >
                      <span className="text-lg">
                        {sportEmojiMap[tag] || "🎯"}
                      </span>
                      <span>{tag}</span>
                    </Badge>
                  ))}
                </div>

                {/* Bio */}
                <p className="text-gray-100 text-sm sm:text-base">
                  {capper.bio}
                </p>
              </div>
            </div>

            {/* Stats Overview - Stack on mobile */}
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
              <StatCard
                icon={<Users />}
                title="Subscribers"
                value={capper.subscriberIds.length.toLocaleString()}
              />
              <StatCard icon={<Trophy />} title="Win Rate" value="67%" />
              <StatCard icon={<TrendingUp />} title="ROI" value="+15.8%" />
              <StatCard
                icon={<Calculator />}
                title="ROI Calculator"
                value="Calculate"
                onClick={() => setShowROICalculator(!showROICalculator)}
                className="cursor-pointer hover:bg-gray-600/50 transition-colors"
              />
            </div>

            {/* ROI Calculator - Simplified on mobile */}
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
                          const roi = value * (1 + 0.158);
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
                  Calculate your potential returns based on historical ROI of
                  15.8%
                </p>
              </div>
            )}
          </div>

          {/* Tabs Section */}
          <div className="bg-gray-800 rounded-lg p-6 mb-12">
            <Tabs defaultValue="picks" className="w-full">
              <div className="border-b border-gray-700 mb-6">
                <TabsList className="w-full flex justify-start bg-transparent space-x-4 sm:space-x-8 overflow-x-auto">
                  <TabsTrigger
                    value="picks"
                    className="relative px-1 pb-4 text-sm sm:text-base font-medium data-[state=active]:text-violet-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-violet-400 transition-all whitespace-nowrap"
                  >
                    <Trophy className="w-4 h-4 mr-2 inline-block" />
                    Recent Picks
                  </TabsTrigger>
                  <TabsTrigger
                    value="stats"
                    className="relative px-1 pb-4 text-sm sm:text-base font-medium data-[state=active]:text-violet-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-violet-400 transition-all whitespace-nowrap"
                  >
                    <TrendingUp className="w-4 h-4 mr-2 inline-block" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="relative px-1 pb-4 text-sm sm:text-base font-medium data-[state=active]:text-violet-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-violet-400 transition-all whitespace-nowrap"
                  >
                    <Star className="w-4 h-4 mr-2 inline-block" />
                    Reviews
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="picks" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">
                          Historical Picks
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-violet-500/10 text-violet-400"
                        >
                          Last 30 Days
                        </Badge>
                      </div>
                      {/* Add historical picks content here */}
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">
                          Pick Statistics
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-violet-500/10 text-violet-400"
                        >
                          Overall
                        </Badge>
                      </div>
                      {/* Add pick statistics content here */}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">
                          Performance by Sport
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-violet-500/10 text-violet-400"
                        >
                          All Time
                        </Badge>
                      </div>
                      {/* Add charts or detailed stats here */}
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">
                          Monthly Results
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-violet-500/10 text-violet-400"
                        >
                          2024
                        </Badge>
                      </div>
                      {/* Add charts or detailed stats here */}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Add similar styling for other tab contents */}
            </Tabs>
          </div>

          {/* Posts Section */}
          <div className="mb-12">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">
                {capper.user.username}'s Posts
              </h2>
              <p className="text-gray-400 mt-2">
                Latest picks and predictions from {capper.user.firstName}
              </p>
            </div>

            {/* First 6 Posts (Always visible) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {posts.slice(0, 6).map((post) => (
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

            {/* Subscription Packages Section */}
            <div className="mt-12" id="subscription-plans">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Subscription Plans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {capper.products.length > 0 ? (
                  capper.products.map((product) => {
                    const isSubscribedToProduct = subscribedProducts.includes(
                      product.id
                    );
                    console.log("Product subscription status:", {
                      productId: product.id,
                      isSubscribed: isSubscribedToProduct,
                      subscribedProducts,
                    });

                    return (
                      <Card
                        key={product.id}
                        className={`bg-gray-800 border-2 flex flex-col relative p-4 sm:p-6 ${
                          isSubscribedToProduct
                            ? "border-green-500 shadow-lg shadow-green-500/20"
                            : "border-gray-700"
                        }`}
                      >
                        <CardHeader className="p-0 sm:p-4">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl sm:text-2xl font-semibold text-white">
                              {product.name}
                            </CardTitle>
                            {isSubscribedToProduct && (
                              <span className="flex items-center gap-1 text-sm text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                <Check className="h-4 w-4" />
                                Active
                              </span>
                            )}
                          </div>
                          <CardDescription className="text-sm sm:text-base text-gray-300">
                            {product.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="flex flex-col items-center">
                            <span className="text-5xl font-extrabold text-white">
                              {product.default_price.unit_amount === 0
                                ? "Free"
                                : new Intl.NumberFormat("en-US", {
                                    style: "decimal",
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }).format(
                                    product.default_price.unit_amount / 100
                                  )}
                            </span>
                            {product.default_price.unit_amount > 0 && (
                              <>
                                <span className="text-sm font-medium text-gray-400 mt-1">
                                  {product.default_price.currency.toUpperCase()}
                                </span>
                                <span className="text-xl font-medium text-gray-300">
                                  {
                                    product.default_price?.type === "one_time"
                                      ? " one-time"
                                      : product.default_price?.recurring
                                          ?.interval
                                      ? `/${product.default_price.recurring.interval}`
                                      : "/month" // fallback to /month if no interval specified
                                  }
                                  {product.default_price?.recurring
                                    ?.interval_count &&
                                  product.default_price.recurring
                                    .interval_count > 1
                                    ? ` (${product.default_price.recurring.interval_count} ${product.default_price.recurring.interval}s)`
                                    : ""}
                                </span>
                              </>
                            )}
                          </div>
                          <ul className="mt-8 space-y-4">
                            {Array.isArray(product.marketing_features) &&
                            product.marketing_features.length > 0 ? (
                              product.marketing_features.map(
                                (feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <div className="flex-shrink-0">
                                      <Check className="h-6 w-6 text-green-400" />
                                    </div>
                                    <p className="ml-3 text-base text-gray-300">
                                      {feature}
                                    </p>
                                  </li>
                                )
                              )
                            ) : (
                              <li className="flex items-start">
                                <div className="flex-shrink-0">
                                  <Check className="h-6 w-6 text-green-400" />
                                </div>
                                <p className="ml-3 text-base text-gray-300">
                                  No features specified
                                </p>
                              </li>
                            )}
                          </ul>
                        </CardContent>
                        <CardFooter className="mt-auto pt-6">
                          <SubscribeButton
                            capperId={capper.id}
                            productId={product.id}
                            priceId={product.default_price.id}
                            stripeAccountId={capper.user.stripeConnectId}
                            isSubscribed={isSubscribedToProduct}
                            className={`w-full ${
                              isSubscribedToProduct
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-violet-500 hover:bg-violet-600"
                            }`}
                          >
                            {isSubscribedToProduct
                              ? "Unsubscribe"
                              : "Subscribe"}
                          </SubscribeButton>
                        </CardFooter>
                      </Card>
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

            {/* Remaining Posts Section */}
            {posts.length > 6 && (
              <div className="mt-12">
                {!isSubscribed ? (
                  // Paywall for non-subscribers
                  <div className="relative my-12">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 pointer-events-none" />
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
                        className="bg-violet-500 hover:bg-violet-600"
                      >
                        Subscribe Now
                      </SubscribeButton>
                    </div>
                  </div>
                ) : (
                  // Show remaining posts for subscribers
                  <>
                    <h3 className="text-xl font-semibold text-white mb-6">
                      More Posts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {posts.slice(6).map((post) => (
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
                  </>
                )}
              </div>
            )}

            {/* No Posts Message */}
            {posts.length === 0 && (
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
