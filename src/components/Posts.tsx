"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  MoreHorizontal,
  Lock,
  Check,
  Zap,
  Tag,
  Percent,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { SubscribeButton } from "./SubscribeButton";

interface PostProps {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  odds: string[];
  bets: string[];
  tags: string[];
  bookmaker?: string;
  capperId: string;
  productId: string;
  productName?: string;
  createdAt: string;
  updatedAt: string;
  likes?: number;
  comments?: number;
  isOwnPost?: boolean;
  capperInfo?: {
    firstName: string;
    lastName: string;
    username: string;
    profileImage?: string;
    isVerified?: boolean;
    stripeConnectId?: string;
  };
  fallbackImage?: {
    emoji: string;
    profileImage: string;
  };
  template?: "standard" | "text-only";
}

const sportEmojiMap: { [key: string]: string } = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  "American Football": "🏈",
  Baseball: "⚾",
  Soccer: "⚽",
  Hockey: "🏒",
  Golf: "🏌️‍♂️",
  MMA: "🥊",
  Boxing: "🥊",
  F1: "🏎️",
  "Horse Racing": "🏇",
  "E-Sports": "🎮",
};

// Helper function to calculate discounted price
const calculateDiscountedPrice = (product: any) => {
  if (
    !product.hasDiscount ||
    !product.discountValue ||
    product.default_price.unit_amount <= 1
  ) {
    return null;
  }

  const originalPrice = product.default_price.unit_amount / 100;
  let discountedPrice = originalPrice;

  if (product.discountType === "percentage") {
    discountedPrice = originalPrice * (1 - product.discountValue / 100);
  } else if (product.discountType === "fixed") {
    discountedPrice = Math.max(0, originalPrice - product.discountValue);
  }

  return discountedPrice;
};

// Helper function to format discount text
const getDiscountText = (product: any) => {
  if (!product.hasDiscount || !product.discountValue) return null;

  const discountText =
    product.discountType === "percentage"
      ? `${product.discountValue}% OFF`
      : `${product.default_price.currency.toUpperCase()} ${product.discountValue} OFF`;

  let durationText = "";
  if (product.discountDuration === "once") {
    durationText = "First payment";
  } else if (product.discountDuration === "forever") {
    durationText = "Forever";
  } else if (
    product.discountDuration === "repeating" &&
    product.discountDurationInMonths
  ) {
    durationText = `${product.discountDurationInMonths} month${product.discountDurationInMonths > 1 ? "s" : ""}`;
  }

  return { discountText, durationText };
};

// Subscription Plans Component
const SubscriptionPlans = ({
  capperId,
  capperUsername,
  stripeConnectId,
}: {
  capperId: string;
  capperUsername: string;
  stripeConnectId?: string;
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [subscribedProducts, setSubscribedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch capper data which includes products
        const capperResponse = await fetch(`/api/cappers/${capperUsername}`);
        if (capperResponse.ok) {
          const capperData = await capperResponse.json();
          setProducts(capperData.products || []);
        }

        // Check subscription status
        const subscriptionResponse = await fetch(
          `/api/subscriptions/check?capperId=${capperId}`,
          { credentials: "include" }
        );
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscribedProducts(subscriptionData.subscribedProducts || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [capperId, capperUsername]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4e43ff]"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          This capper hasn't created any subscription plans yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">
        Choose Your Plan
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((product, index) => {
          const isSubscribedToProduct = subscribedProducts.includes(product.id);
          const isMiddleCard = products.length === 3 && index === 1;
          const discountedPrice = calculateDiscountedPrice(product);
          const discountInfo = getDiscountText(product);

          return (
            <div
              key={product.id}
              className={`rounded-xl p-4 transition-all duration-200 flex flex-col relative
                ${
                  isSubscribedToProduct
                    ? "bg-[#4e43ff] border-2 border-white/20"
                    : isMiddleCard
                      ? "bg-gradient-to-br from-violet-600/50 to-violet-900/50 border-2 border-violet-400/50"
                      : "bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50"
                }
              `}
            >
              {/* Discount Badge */}
              {product.hasDiscount && discountInfo && (
                <div className="absolute -top-3 -right-3 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {discountInfo.discountText}
                  </div>
                </div>
              )}

              {isMiddleCard && (
                <div className="text-center mb-2">
                  <span className="bg-violet-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Product Header */}
              <div className="flex justify-between items-start mb-4">
                <h4
                  className={`text-lg font-bold ${
                    isSubscribedToProduct
                      ? "text-white"
                      : isMiddleCard
                        ? "text-violet-300"
                        : "text-[#4e43ff]"
                  }`}
                >
                  {product.name}
                </h4>
                {isSubscribedToProduct && (
                  <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                    <Check className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>

              {/* Price Display */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  {product.default_price.unit_amount <= 1 ? (
                    <span className="text-2xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      {discountedPrice !== null ? (
                        <>
                          <span className="text-2xl font-bold text-white">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: product.default_price.currency || "USD",
                            }).format(discountedPrice)}
                          </span>
                          <span className="text-lg text-gray-400 line-through">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: product.default_price.currency || "USD",
                            }).format(product.default_price.unit_amount / 100)}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: product.default_price.currency || "USD",
                          }).format(product.default_price.unit_amount / 100)}
                        </span>
                      )}
                      {product.default_price.unit_amount > 0 && (
                        <span className="ml-1 text-gray-400 text-sm">
                          {product.default_price?.recurring?.interval
                            ? `/${product.default_price.recurring.interval}`
                            : product.default_price.type === "one_time"
                              ? " one-time"
                              : ""}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Discount Duration Info */}
                {product.hasDiscount && discountInfo?.durationText && (
                  <div className="mt-2 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-200 font-medium">
                      {discountInfo.durationText}
                    </span>
                  </div>
                )}

                <p className="mt-1 text-gray-400 text-sm">
                  {product.description}
                </p>
              </div>

              {/* Features List */}
              {Array.isArray(product.marketing_features) &&
                product.marketing_features.length > 0 && (
                  <ul className="space-y-2 mb-4 flex-1">
                    {product.marketing_features
                      .slice(0, 3)
                      .map((feature: string, featureIndex: number) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-2"
                        >
                          <Zap
                            className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                              isSubscribedToProduct
                                ? "text-white"
                                : "text-[#4e43ff]"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              isSubscribedToProduct
                                ? "text-white/90"
                                : "text-gray-300"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    {product.marketing_features.length > 3 && (
                      <li className="text-sm text-gray-400 ml-6">
                        +{product.marketing_features.length - 3} more features
                      </li>
                    )}
                  </ul>
                )}

              {/* Subscribe Button */}
              <div className="mt-auto">
                <SubscribeButton
                  capperId={capperId}
                  productId={product.id}
                  priceId={product.default_price.id}
                  stripeAccountId={stripeConnectId}
                  isSubscribed={isSubscribedToProduct}
                  className={`w-full relative overflow-hidden transition-all ${
                    isSubscribedToProduct
                      ? "bg-white/20 hover:bg-white/25 text-white"
                      : isMiddleCard
                        ? "bg-violet-500 hover:bg-violet-500/95 text-white"
                        : "bg-[#4e43ff] hover:bg-[#4e43ff]/95 text-white"
                  }`}
                >
                  <span className="relative z-10">
                    {isSubscribedToProduct ? "Unsubscribe" : "Subscribe Now"}
                  </span>
                </SubscribeButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// First, let's create a reusable BetDialog component at the top of the file
const BetDialog = ({
  bets,
  isSubscribed,
  isOwnPost,
  capperInfo,
  router,
  title,
  content,
  odds,
  tags,
  bookmaker,
  capperId,
  stripeConnectId,
}: {
  bets: string[];
  isSubscribed: boolean;
  isOwnPost?: boolean;
  capperInfo: { username: string };
  router: any;
  title: string;
  content: string;
  odds: string[];
  tags: string[];
  bookmaker?: string;
  capperId: string;
  stripeConnectId?: string;
}) => (
  <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 w-[90vw] max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto max-h-[90vh] overflow-y-auto sm:max-h-[85vh] rounded-2xl">
    {isSubscribed || isOwnPost ? (
      <>
        <DialogHeader className="space-y-4">
          {/* Title and Bookmaker Section */}
          <div className="border-l-4 border-[#4e43ff] pl-4">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <p className="text-xs text-[#4e43ff] font-semibold mt-1">
              {capperInfo.username}'s Pick
            </p>
          </div>

          {/* Prominent Bookmaker Display */}
          {bookmaker && (
            <div className="flex justify-flex-start bg-[#4e43ff]/10 p-4 rounded-lg border border-[#4e43ff]/20">
              <div className="h-10 w-10 mr-4 rounded-full bg-[#4e43ff]/20 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-semibold text-[#4e43ff]">
                    {bets.length > 1 ? "PARLAY BET" : "BET"}
                  </p>
                  {bets.length > 1 && (
                    <span className="text-sm bg-[#4e43ff]/20 text-[#4e43ff] px-2 py-0.5 rounded-full">
                      {bets.length} legs
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {bets.map((bet, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 bg-[#4e43ff]/5 p-2 rounded-lg"
                    >
                      <span className="text-sm font-mono text-[#4e43ff]">
                        #{index + 1}
                      </span>
                      <p className="text-base font-semibold text-gray-100">
                        {bet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Stats Grid: Odds and Sports */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Odds Section */}
          {odds.length > 0 && (
            <div className="bg-gray-800/30 p-4 rounded-lg">
              <p className="text-xs text-[#4e43ff] font-semibold mb-2">ODDS</p>
              <div className="flex flex-wrap gap-2">
                {odds.map((odd, index) => (
                  <div
                    key={index}
                    className="bg-[#4e43ff]/10 px-3 py-1 rounded-lg"
                  >
                    <span className="text-lg font-bold text-[#4e43ff]">
                      {odd}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sports Section */}
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-xs text-[#4e43ff] font-semibold mb-2">SPORT</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="bg-[#4e43ff]/10 px-3 py-1 rounded-lg flex items-center gap-1"
                >
                  <span className="text-lg">{sportEmojiMap[tag] || ""}</span>
                  <span className="text-sm text-[#4e43ff] font-medium">
                    {tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookmaker section */}
        <div className="mt-3 bg-gray-800/30 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[#4e43ff]/20 flex items-center justify-center">
              <span className="text-sm">🎲</span>
            </div>
            <p className="text-sm font-semibold text-[#4e43ff]">BOOKMAKER:</p>
            <p className="text-sm text-gray-300">{bookmaker}</p>
          </div>
        </div>

        {/* Content section */}
        <div className="mt-3 bg-gray-800/30 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-[#4e43ff]/20 flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
            <p className="text-sm font-semibold text-[#4e43ff]">ANALYSIS</p>
          </div>
          <DialogDescription className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </DialogDescription>
        </div>

        {/* Add padding to bottom to ensure content is fully scrollable */}
        <div className="pb-4"></div>
      </>
    ) : (
      <>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">
            Subscribe to View Bets
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            <div className="flex flex-col gap-4">
              <p>
                Subscribe to {capperInfo.username}'s picks to view their betting
                details and more exclusive content.
              </p>
              <div className="bg-gray-800/30 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">
                  What you'll get:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-[#4e43ff]">✓</span> Detailed betting
                    analysis
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-[#4e43ff]">✓</span> Exclusive picks
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-[#4e43ff]">✓</span> Real-time updates
                  </li>
                </ul>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Render Subscription Plans */}
        <SubscriptionPlans
          capperId={capperId}
          capperUsername={capperInfo.username}
          stripeConnectId={stripeConnectId}
        />
      </>
    )}
  </DialogContent>
);

function InstagramPost({
  _id,
  title,
  content,
  imageUrl,
  odds,
  bets,
  tags,
  bookmaker,
  capperId,
  productId,
  productName,
  createdAt,
  likes = 0,
  comments = 0,
  capperInfo = {
    firstName: "Anonymous",
    lastName: "User",
    username: "anonymous",
    profileImage: "",
    isVerified: false,
  },
  fallbackImage,
  isOwnPost,
  template = "standard",
}: PostProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const response = await fetch(`/api/posts/${_id}/like`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.isLiked);
          if (data.likes !== undefined) {
            setLikeCount(data.likes);
          }
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
  }, [_id]);

  const handleLike = async () => {
    try {
      const method = isLiked ? "DELETE" : "POST";
      const response = await fetch(`/api/posts/${_id}/like`, {
        method,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          // Handle the "Already liked" or "Not liked yet" errors
          console.log(errorData.error);
          // Optionally show a toast or other user feedback
          return;
        }
        throw new Error("Failed to update like");
      }

      const data = await response.json();

      // Update local state with server response
      setIsLiked(data.isLiked);
      setLikeCount(data.likes);
    } catch (error) {
      console.error("Error updating like:", error);
      // Revert the local state if the API call fails
      if (isLiked) {
        setLikeCount(likeCount - 1);
      } else {
        setLikeCount(likeCount + 1);
      }
      setIsLiked(!isLiked);
    }
  };

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch(
          `/api/subscriptions/check?capperId=${capperId}&productId=${productId}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Handle case where subscribedProducts might be undefined
          const subscribedProducts = data.subscribedProducts || [];
          const hasAccessToProduct = subscribedProducts.includes(productId);
          setIsSubscribed(hasAccessToProduct);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsSubscribed(false); // Default to false on error
      }
    };

    if (capperId && productId) {
      checkSubscription();
    }
  }, [capperId, productId]);

  return (
    <Card
      className={`$
        template === "text-only"
          ? "overflow-hidden bg-[#020817] border-0 w-full max-w-none mx-auto md:h-[600px] md:flex md:flex-col"
          :
            "w-full max-w-none bg-gray-900 border-0 flex flex-col mx-auto rounded-none lg:rounded-lg md:h-[800px]"
      }`}
    >
      {template === "text-only" ? (
        <div className="bg-[#020817] w-full mx-auto md:h-full md:flex md:flex-col">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-16 sm:w-16 border border-gray-700">
                <AvatarImage
                  src={capperInfo.profileImage || ""}
                  alt={capperInfo.username}
                />
                <AvatarFallback className="bg-violet-600 text-white text-lg sm:text-2xl">
                  {capperInfo.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <button
                  onClick={() => router.push(`/cappers/${capperInfo.username}`)}
                  className="text-sm sm:text-base font-medium text-gray-200 hover:text-[#4e43ff] transition-colors text-left"
                >
                  @{capperInfo.username}
                </button>
                {productName && (
                  <span className="text-xs sm:text-xs text-[#4e43ff] font-semibold mt-0.5 sm:mt-1">
                    {productName}
                  </span>
                )}
              </div>
            </div>

            {bets.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[120px] h-[36px] sm:w-[140px] sm:h-[40px] md:w-auto text-xs sm:text-sm md:text-base font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-2 sm:px-4 md:px-8 py-1 sm:py-2 md:py-4 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
                  >
                    See Bet 🎯
                  </Button>
                </DialogTrigger>
                <BetDialog
                  bets={bets}
                  isSubscribed={isSubscribed}
                  isOwnPost={isOwnPost}
                  capperInfo={capperInfo}
                  router={router}
                  title={title}
                  content={content}
                  odds={odds}
                  tags={tags}
                  bookmaker={bookmaker}
                  capperId={capperId}
                  stripeConnectId={capperInfo?.stripeConnectId}
                />
              </Dialog>
            )}
          </div>

          <div className="px-3 sm:px-3 py-3 sm:py-4">
            <div>
              <h2 className="text-sm sm:text-base md:text-base lg:text-lg font-bold text-white mb-6">
                {title}
              </h2>

              {/* If there's an image */}
              {imageUrl && (
                <div className="relative w-full aspect-[4/3] mb-3 sm:mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 95vw, (max-width: 1024px) 90vw, 1024px"
                  />
                </div>
              )}

              <p className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-200 mb-3 sm:mb-4 whitespace-pre-wrap">
                {content.slice(0, 120)}...{" "}
                {isSubscribed || isOwnPost ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-[#4e43ff] hover:underline font-medium">
                        See more
                      </button>
                    </DialogTrigger>
                    <BetDialog
                      bets={bets}
                      isSubscribed={isSubscribed}
                      isOwnPost={isOwnPost}
                      capperInfo={capperInfo}
                      router={router}
                      title={title}
                      content={content}
                      odds={odds}
                      tags={tags}
                      bookmaker={bookmaker}
                      capperId={capperId}
                      stripeConnectId={capperInfo?.stripeConnectId}
                    />
                  </Dialog>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-[#4e43ff] hover:underline font-medium">
                        See more
                      </button>
                    </DialogTrigger>
                    <BetDialog
                      bets={bets}
                      isSubscribed={isSubscribed}
                      isOwnPost={isOwnPost}
                      capperInfo={capperInfo}
                      router={router}
                      title={title}
                      content={content}
                      odds={odds}
                      tags={tags}
                      bookmaker={bookmaker}
                      capperId={capperId}
                      stripeConnectId={capperInfo?.stripeConnectId}
                    />
                  </Dialog>
                )}
              </p>

              <p className="text-xs sm:text-xs md:text-xs mb-10 lg:text-sm text-gray-400 mt-1 mb-0">
                {new Date(createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Badges section - Move to bottom with mt-auto */}
            <div className="flex flex-row justify-between gap-1 sm:gap-2 pb-2 -mt-1 md:-mt-2">
              {/* Likes */}
              <div className="flex-shrink-0 flex flex-col items-center min-w-[80px] sm:min-w-[100px] max-w-[100px] sm:max-w-[140px]">
                <p className="text-[10px] sm:text-xs font-semibold text-white mb-1 sm:mb-2">
                  LIKES
                </p>
                <div className="w-full h-[32px] sm:h-[36px] md:h-[48px] px-1 sm:px-4 rounded-lg flex items-center justify-center">
                  <div className="flex items-center justify-center gap-1 sm:gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLike}
                      className="h-6 w-6 sm:h-8 sm:w-8 hover:text-[#4e43ff] p-0"
                    >
                      <span
                        className={`text-sm sm:text-base ${isLiked ? "text-[#4e43ff]" : "text-gray-300"}`}
                      >
                        🚀
                      </span>
                    </Button>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {likeCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sport */}
              {tags.length > 0 && (
                <div className="flex-shrink-0 flex flex-col items-center min-w-[80px] sm:min-w-[100px] max-w-[100px] sm:max-w-[140px]">
                  <p className="text-[10px] sm:text-xs font-semibold text-white mb-1 sm:mb-2">
                    SPORT
                  </p>
                  <div className="bg-[#4e43ff] w-full h-[32px] sm:h-[36px] md:h-[48px] px-1 sm:px-4 rounded-lg shadow-lg shadow-[#4e43ff]/20 flex items-center justify-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-sm sm:text-base text-white"
                          title={tag}
                        >
                          {sportEmojiMap[tag] || tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Odds */}
              {odds.length > 0 && (
                <div className="flex-shrink-0 flex flex-col items-center min-w-[80px] sm:min-w-[100px] max-w-[100px] sm:max-w-[140px]">
                  <p className="text-[10px] sm:text-xs font-semibold text-white mb-1 sm:mb-2">
                    ODDS
                  </p>
                  <div
                    className={`bg-[#4e43ff] w-full h-[32px] sm:h-[36px] md:h-[48px] px-1 sm:px-4 rounded-lg shadow-lg shadow-[#4e43ff]/20 flex items-center justify-center ${
                      !isSubscribed && !isOwnPost
                        ? "cursor-pointer blur-[8px] hover:blur-[6px] transition-all"
                        : ""
                    }`}
                    onClick={() => {
                      if (!isSubscribed && !isOwnPost) {
                        const element =
                          document.getElementById("subscription-plans");
                        element?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-center">
                      {odds.map((odd, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-xs sm:text-base font-bold text-white">
                            {odd}
                          </span>
                          <span className="text-xs sm:text-base font-bold text-white/80 mr-0.5 sm:mr-1">
                            x
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Comment out Bundle 4 now 8/6 */}
              {/* {productName && (
                <div className="flex-shrink-0 flex flex-col items-center min-w-[100px] max-w-[140px]">
                  <p className="text-[10px] sm:text-xs font-semibold text-white mb-1 sm:mb-2">
                    BUNDLE
                  </p>
                  <div className="bg-[#4e43ff] w-full h-[32px] sm:h-[36px] md:h-[48px] px-2 sm:px-4 rounded-lg shadow-lg shadow-[#4e43ff]/20 flex items-center justify-center">
                    <span className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
                      {productName}
                    </span>
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-2 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6 sm:h-7 sm:w-7 border border-gray-700">
                <AvatarImage
                  src={capperInfo.profileImage || ""}
                  alt={capperInfo.username}
                  sizes="28px"
                />
                <AvatarFallback className="bg-violet-600 text-white text-xs">
                  {capperInfo.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <button
                  onClick={() => router.push(`/cappers/${capperInfo.username}`)}
                  className="font-semibold text-xs text-gray-100 hover:text-[#4e43ff] transition-colors"
                >
                  {capperInfo.username}
                </button>
                {productName && (
                  <span className="text-xs text-[#4e43ff] font-semibold sm:ml-2">
                    {productName}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 uppercase">
              {new Date(createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="relative w-full h-56 md:h-[32rem] lg:h-[36rem] overflow-hidden rounded-lg mb-4">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center relative">
                <div className="absolute inset-0 overflow-hidden">
                  <Image
                    src={
                      fallbackImage?.profileImage ||
                      capperInfo.profileImage ||
                      "/default-avatar.png"
                    }
                    alt="Background"
                    fill
                    className="object-cover blur-xl opacity-20"
                    sizes="100vw"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="max-w-lg text-center space-y-6 select-none">
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400 text-2xl md:text-3xl opacity-20">
                          🎯 Match Winner
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-2xl md:text-3xl opacity-20">
                          📊 Over/Under 2.5
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-2xl md:text-3xl opacity-20">
                          ⚡ Special Picks
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-2xl md:text-3xl opacity-20">
                          🔥 Exclusive Tips
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-2xl md:text-3xl opacity-20">
                          💫 Premium Analysis
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8 relative z-10">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden relative shadow-lg">
                    <Image
                      src={
                        fallbackImage?.profileImage ||
                        capperInfo.profileImage ||
                        "/default-avatar.png"
                      }
                      alt="Capper avatar"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 128px, 160px"
                    />
                  </div>

                  {bets.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[120px] h-[36px] sm:w-[140px] sm:h-[40px] md:w-auto text-xs sm:text-sm md:text-base font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-2 sm:px-4 md:px-8 py-1 sm:py-2 md:py-4 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
                        >
                          See Bet 🎯
                        </Button>
                      </DialogTrigger>
                      <BetDialog
                        bets={bets}
                        isSubscribed={isSubscribed}
                        isOwnPost={isOwnPost}
                        capperInfo={capperInfo}
                        router={router}
                        title={title}
                        content={content}
                        odds={odds}
                        tags={tags}
                        bookmaker={bookmaker}
                        capperId={capperId}
                        stripeConnectId={capperInfo?.stripeConnectId}
                      />
                    </Dialog>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 md:flex-1 md:flex md:flex-col">
            <div className="flex items-center justify-between sm:justify-start sm:gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLike}
                  className="h-8 w-8"
                >
                  <span
                    className={`text-lg ${
                      isLiked ? "text-[#4e43ff]" : "text-gray-300"
                    }`}
                  >
                    🚀
                  </span>
                </Button>
                <p className="font-semibold text-xs text-gray-100">
                  {likeCount} likes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-4 md:flex-1">
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-gray-100">{title}</h3>
                <div className="max-h-[100px] overflow-y-auto text-[10px] text-gray-200">
                  {content.slice(0, 120)}...{" "}
                  {isSubscribed || isOwnPost ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[#4e43ff] hover:underline font-medium">
                          See more
                        </button>
                      </DialogTrigger>
                      <BetDialog
                        bets={bets}
                        isSubscribed={isSubscribed}
                        isOwnPost={isOwnPost}
                        capperInfo={capperInfo}
                        router={router}
                        title={title}
                        content={content}
                        odds={odds}
                        tags={tags}
                        bookmaker={bookmaker}
                        capperId={capperId}
                        stripeConnectId={capperInfo?.stripeConnectId}
                      />
                    </Dialog>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[#4e43ff] hover:underline font-medium">
                          See more
                        </button>
                      </DialogTrigger>
                      <BetDialog
                        bets={bets}
                        isSubscribed={isSubscribed}
                        isOwnPost={isOwnPost}
                        capperInfo={capperInfo}
                        router={router}
                        title={title}
                        content={content}
                        odds={odds}
                        tags={tags}
                        bookmaker={bookmaker}
                        capperId={capperId}
                        stripeConnectId={capperInfo?.stripeConnectId}
                      />
                    </Dialog>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex sm:flex-col sm:gap-4 sm:w-[140px] md:justify-end">
                {odds.length > 0 && (
                  <div className="flex flex-col items-end">
                    <p className="text-xs font-semibold text-white mb-1">
                      ODDS
                    </p>
                    <div
                      className={`bg-[#4e43ff] p-2 rounded-lg shadow-lg shadow-[#4e43ff]/20 ${
                        !isSubscribed && !isOwnPost
                          ? "cursor-pointer blur-[8px] hover:blur-[6px] transition-all"
                          : ""
                      }`}
                      onClick={() => {
                        if (!isSubscribed && !isOwnPost) {
                          const element =
                            document.getElementById("subscription-plans");
                          element?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }}
                    >
                      <div className="flex justify-end items-center">
                        {odds.map((odd, index) => (
                          <div key={index} className="flex items-center">
                            <span className="text-xs sm:text-base font-bold text-white px-1">
                              {odd}
                            </span>
                            <span className="text-xs sm:text-base font-bold text-white/80">
                              x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-end">
                  <p className="text-xs font-semibold text-white mb-1">SPORT</p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-sm sm:text-base text-white px-4 py-2 rounded-lg shadow-lg shadow-[#4e43ff]/20"
                        title={tag}
                      >
                        {sportEmojiMap[tag] || tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:hidden mt-3 space-y-3 px-4 md:mt-auto">
              <div className="flex gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-base bg-[#4e43ff]/10 text-[#4e43ff] px-2 py-1 rounded-md"
                    title={tag}
                  >
                    {sportEmojiMap[tag] || tag}
                  </span>
                ))}
              </div>

              {odds.length > 0 && (
                <div
                  className={`bg-[#4e43ff]/10 px-3 py-1.5 rounded-lg ${
                    !isSubscribed && !isOwnPost
                      ? "cursor-pointer blur-[8px] hover:blur-[6px] transition-all"
                      : ""
                  }`}
                  onClick={() => {
                    if (!isSubscribed && !isOwnPost) {
                      const element =
                        document.getElementById("subscription-plans");
                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#4e43ff]">
                      ODDS
                    </span>
                    {odds.map((odd, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-sm font-bold text-[#4e43ff]">
                          {odd}
                        </span>
                        <span className="text-sm font-bold text-[#4e43ff]/80">
                          x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {bets.length > 0 && (
              <div className="mt-3 px-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[120px] h-[36px] sm:w-[140px] sm:h-[40px] md:w-auto text-xs sm:text-sm md:text-base font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-2 sm:px-4 md:px-8 py-1 sm:py-2 md:py-4 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
                    >
                      See Bet 🎯
                    </Button>
                  </DialogTrigger>
                  <BetDialog
                    bets={bets}
                    isSubscribed={isSubscribed}
                    isOwnPost={isOwnPost}
                    capperInfo={capperInfo}
                    router={router}
                    title={title}
                    content={content}
                    odds={odds}
                    tags={tags}
                    bookmaker={bookmaker}
                    capperId={capperId}
                    stripeConnectId={capperInfo?.stripeConnectId}
                  />
                </Dialog>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
export default InstagramPost;
