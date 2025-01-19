"use client";

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
} from "lucide-react";
import { use } from "react";
import { SubscribeButton } from "@/components/SubscribeButton";
import InstagramPost from "@/components/Posts";

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
        const response = await fetch(
          `/api/subscriptions/check?capperId=${capper?.id}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.isSubscribed);
          setSubscriptionDetails(data.subscriptionDetails);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#4e43ff]" />
            <p className="text-gray-400">Loading...</p>
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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                <AvatarImage
                  src={capper?.imageUrl}
                  alt={`${capper?.user?.firstName || ""} ${
                    capper?.user?.lastName || ""
                  }`}
                />
                <AvatarFallback>
                  {capper?.user?.firstName?.charAt(0) || ""}
                  {capper?.user?.lastName?.charAt(0) || ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center sm:justify-start">
                      {capper?.user?.firstName} {capper?.user?.lastName}
                      <CheckCircle className="h-6 w-6 text-blue-400 ml-2" />
                    </h1>
                    <p className="text-xl text-gray-400 mb-2">
                      @{capper?.user?.username}
                    </p>
                    {capper?.title && (
                      <p className="text-lg text-violet-400 mb-4">
                        {capper.title}
                      </p>
                    )}
                  </div>
                  {isSubscribed && (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full text-sm font-medium">
                      <Check className="h-4 w-4" />
                      Subscribed Member
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {capper.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-gray-700 text-gray-300"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-gray-100">{capper.bio}</p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <StatCard
                icon={<Users />}
                title="Subscribers"
                value={capper.subscriberIds.length.toLocaleString()}
              />
              <StatCard icon={<Trophy />} title="Win Rate" value="67%" />
              <StatCard icon={<TrendingUp />} title="ROI" value="+15.8%" />
              <StatCard icon={<Star />} title="Rating" value="4.8/5" />
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-gray-800 rounded-lg p-6 mb-12">
            <Tabs defaultValue="picks" className="w-full">
              <div className="border-b border-gray-700 mb-6">
                <TabsList className="w-full flex justify-start bg-transparent space-x-8">
                  <TabsTrigger
                    value="picks"
                    className="relative px-1 pb-4 text-base font-medium data-[state=active]:text-violet-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-violet-400 transition-all"
                  >
                    <Trophy className="w-4 h-4 mr-2 inline-block" />
                    Recent Picks
                  </TabsTrigger>
                  <TabsTrigger
                    value="stats"
                    className="relative px-1 pb-4 text-base font-medium data-[state=active]:text-violet-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-violet-400 transition-all"
                  >
                    <TrendingUp className="w-4 h-4 mr-2 inline-block" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="relative px-1 pb-4 text-base font-medium data-[state=active]:text-violet-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-violet-400 transition-all"
                  >
                    <Star className="w-4 h-4 mr-2 inline-block" />
                    Reviews
                  </TabsTrigger>
                  <TabsTrigger
                    value="about"
                    className="relative px-1 pb-4 text-base font-medium data-[state=active]:text-violet-400 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-violet-400 transition-all"
                  >
                    <User className="w-4 h-4 mr-2 inline-block" />
                    About
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <InstagramPost
                    key={post._id}
                    {...post}
                    capperInfo={{
                      firstName: capper.user.firstName,
                      lastName: capper.user.lastName,
                      username: capper.user.username,
                      imageUrl: capper.imageUrl,
                      isVerified: true,
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">No posts available yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Packages Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Subscription Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capper.products.length > 0 ? (
                capper.products.map((product) => {
                  console.log("Rendering product:", {
                    id: product.id,
                    name: product.name,
                    marketing_features: product.marketing_features,
                  });

                  return (
                    <Card
                      key={product.id}
                      className="bg-gray-800 border-gray-700 flex flex-col"
                    >
                      <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-white">
                          {product.name}
                        </CardTitle>
                        <CardDescription className="text-gray-300">
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
                                    : product.default_price?.recurring?.interval
                                    ? `/${product.default_price.recurring.interval}`
                                    : "/month" // fallback to /month if no interval specified
                                }
                                {product.default_price?.recurring
                                  ?.interval_count &&
                                product.default_price.recurring.interval_count >
                                  1
                                  ? ` (${product.default_price.recurring.interval_count} ${product.default_price.recurring.interval}s)`
                                  : ""}
                              </span>
                            </>
                          )}
                        </div>
                        <ul className="mt-8 space-y-4">
                          {Array.isArray(product.marketing_features) &&
                          product.marketing_features.length > 0 ? (
                            product.marketing_features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <div className="flex-shrink-0">
                                  <Check className="h-6 w-6 text-green-400" />
                                </div>
                                <p className="ml-3 text-base text-gray-300">
                                  {feature}
                                </p>
                              </li>
                            ))
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
                          className="w-full bg-violet-500 hover:bg-violet-600"
                        />
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
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) => (
  <div className="bg-gray-700/50 p-4 rounded-lg flex items-center space-x-4">
    <div className="text-violet-400">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-xl font-bold">{value}</p>
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
