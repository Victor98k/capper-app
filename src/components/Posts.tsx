"use client";

import { useState, useEffect } from "react";
import { Heart, MoreHorizontal } from "lucide-react";
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
}) => (
  <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 w-[90vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto sm:max-h-[85vh] rounded-2xl">
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
            <div className="flex items-center justify-between bg-[#4e43ff]/10 p-4 rounded-lg border border-[#4e43ff]/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#4e43ff]/20 flex items-center justify-center">
                  <span className="text-2xl">🎲</span>
                </div>
                <div>
                  <p className="text-xs text-[#4e43ff] font-semibold">
                    BOOKMAKER
                  </p>
                  <p className="text-base font-semibold text-gray-100">
                    {bookmaker}
                  </p>
                </div>
              </div>
              <div className="bg-[#4e43ff] px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-white">Verified</span>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Stats Grid: Odds and Sports */}
        <div className="grid grid-cols-2 gap-4 mt-6">
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

        {/* Content section */}
        <div className="mt-6 bg-gray-800/30 p-4 rounded-lg">
          <DialogDescription className="text-gray-300 text-sm leading-relaxed">
            {content}
          </DialogDescription>
        </div>

        {/* Add padding to bottom to ensure content is fully scrollable */}
        <div className="pb-4">
          {/* Rest of the betting details section remains the same */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-[#4e43ff]/10 flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <h3 className="font-semibold text-[#4e43ff]">Betting Details</h3>
            </div>

            <ul className="space-y-3">
              {bets.map((bet, index) => (
                <li
                  key={index}
                  className="bg-gray-800/30 p-4 rounded-lg text-sm text-gray-200 hover:bg-gray-800/50 transition-colors flex items-start gap-3"
                >
                  <span className="text-[#4e43ff] font-mono">#{index + 1}</span>
                  {bet}
                </li>
              ))}
            </ul>
          </div>
        </div>
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
        <DialogFooter className="mt-6">
          <Button
            onClick={() => {
              router.push(`/cappers/${capperInfo.username}#subscription-plans`);
              // Add a small delay to ensure the navigation completes before scrolling
              setTimeout(() => {
                const element = document.getElementById("subscription-plans");
                element?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            className="w-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 py-6 text-lg font-semibold rounded-xl transition-transform hover:scale-[1.02]"
          >
            View Subscription Plans
          </Button>
        </DialogFooter>
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
      className={`${
        template === "text-only"
          ? "overflow-hidden bg-[#020817] border-0 w-full max-w-screen-2xl mx-auto"
          : "w-full bg-gray-900 border-0 flex flex-col mx-auto rounded-none lg:rounded-lg lg:max-w-xl"
      }`}
    >
      {template === "text-only" ? (
        <div className="bg-[#020817] max-w-screen-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 sm:p-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-16 sm:w-16 border border-gray-700">
                <AvatarImage
                  src={capperInfo.profileImage || ""}
                  alt={capperInfo.username}
                />
                <AvatarFallback className="bg-violet-600 text-white text-lg sm:text-2xl">
                  {capperInfo.firstName[0]}
                  {capperInfo.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <button
                  onClick={() => router.push(`/cappers/${capperInfo.username}`)}
                  className="text-base sm:text-xl font-medium text-gray-200 hover:text-[#4e43ff] transition-colors text-left"
                >
                  @{capperInfo.username}
                </button>
                {productName && (
                  <span className="text-xs sm:text-base text-[#4e43ff] font-semibold mt-0.5 sm:mt-1">
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
                    className="w-full sm:w-auto text-sm sm:text-base font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-4 py-2 sm:px-8 sm:py-4 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
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
                />
              </Dialog>
            )}
          </div>

          <div className="px-4 py-4 sm:p-6">
            <h2 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-4">
              {title}
            </h2>
            <p className="text-sm sm:text-lg text-gray-200 mb-3 whitespace-pre-wrap">
              {content}
            </p>

            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              {new Date(createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            {/* Updated badges container to prevent line breaks */}
            <div className="flex flex-nowrap overflow-x-auto items-center gap-2 sm:gap-4">
              <div className="flex-shrink-0 flex flex-col items-center w-[100px] sm:w-[140px]">
                <p className="text-[10px] sm:text-xs font-semibold text-white mb-1 sm:mb-2">
                  LIKES
                </p>
                <div className="w-full h-[36px] sm:h-[48px] px-2 sm:px-4 rounded-lg flex items-center justify-center">
                  <div className="flex items-center justify-center gap-1 sm:gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLike}
                      className="h-6 w-6 sm:h-8 sm:w-8 hover:text-[#4e43ff] p-0"
                    >
                      <span
                        className={`text-base sm:text-xl ${isLiked ? "text-[#4e43ff]" : "text-gray-300"}`}
                      >
                        🚀
                      </span>
                    </Button>
                    <span className="text-sm sm:text-lg font-bold text-white">
                      {likeCount}
                    </span>
                  </div>
                </div>
              </div>

              {odds.length > 0 && (
                <div className="flex-shrink-0 flex flex-col items-center w-[100px] sm:w-[140px]">
                  <p className="text-[10px] sm:text-xs font-semibold text-white mb-1 sm:mb-2">
                    ODDS
                  </p>
                  <div className="bg-[#4e43ff] w-full h-[36px] sm:h-[48px] px-2 sm:px-4 rounded-lg shadow-lg shadow-[#4e43ff]/20 flex items-center justify-center">
                    <div className="flex items-center justify-center">
                      {odds.map((odd, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-sm sm:text-xl font-bold text-white">
                            {odd}
                          </span>
                          <span className="text-sm sm:text-xl font-bold text-white/80 mr-1">
                            x
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex-shrink-0 flex flex-col items-center w-[100px] sm:w-[140px]">
                  <p className="text-[10px] sm:text-xs font-semibold text-white mb-1 sm:mb-2">
                    SPORT
                  </p>
                  <div className="bg-[#4e43ff] w-full h-[36px] sm:h-[48px] px-2 sm:px-4 rounded-lg shadow-lg shadow-[#4e43ff]/20 flex items-center justify-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-base sm:text-2xl text-white"
                          title={tag}
                        >
                          {sportEmojiMap[tag] || tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {productName && (
                <div className="flex-shrink-0 flex flex-col items-center w-[100px] sm:w-[140px]">
                  <p className="text-[10px] sm:text-xs font-semibold text-white mb-1 sm:mb-2">
                    BUNDLE
                  </p>
                  <div className="bg-[#4e43ff] w-full h-[36px] sm:h-[48px] px-2 sm:px-4 rounded-lg shadow-lg shadow-[#4e43ff]/20 flex items-center justify-center">
                    <span className="text-sm sm:text-lg md:text-xs font-bold text-white truncate">
                      {productName}
                    </span>
                  </div>
                </div>
              )}
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
                  {capperInfo.firstName[0]}
                  {capperInfo.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <button
                  onClick={() => router.push(`/cappers/${capperInfo.username}`)}
                  className="font-semibold text-sm text-gray-100 hover:text-[#4e43ff] transition-colors"
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
                          className="text-base font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-8 py-4 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
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
                      />
                    </Dialog>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-4">
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-gray-100">{title}</h3>
                <div className="max-h-[100px] overflow-y-auto text-xs text-gray-200">
                  {content}
                </div>
              </div>

              <div className="hidden sm:flex sm:flex-col sm:gap-4 sm:w-[140px]">
                {odds.length > 0 && (
                  <div className="flex flex-col items-end">
                    <p className="text-xs font-semibold text-white mb-1">
                      ODDS
                    </p>
                    <div className="bg-[#4e43ff] p-2 rounded-lg shadow-lg shadow-[#4e43ff]/20">
                      <div className="flex justify-end items-center">
                        {odds.map((odd, index) => (
                          <div key={index} className="flex items-center">
                            <span className="text-2xl font-bold text-white px-1">
                              {odd}
                            </span>
                            <span className="text-2xl font-bold text-white/80">
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
                        className="text-xl bg-[#4e43ff] text-white px-4 py-2 rounded-lg shadow-lg shadow-[#4e43ff]/20"
                        title={tag}
                      >
                        {sportEmojiMap[tag] || tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:hidden mt-3 space-y-3 px-4">
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
                <div className="bg-[#4e43ff]/10 px-3 py-1.5 rounded-lg">
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
                      className="text-base font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-8 py-4 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
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
