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

interface PostProps {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  odds: string[];
  bets: string[];
  tags: string[];
  capperId: string;
  productId: string;
  productName?: string;
  createdAt: string;
  updatedAt: string;
  likes?: number;
  comments?: number;
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
  capperInfo,
  router,
}: {
  bets: string[];
  isSubscribed: boolean;
  capperInfo: { username: string };
  router: any;
}) => (
  <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 w-[90vw] max-w-md mx-auto">
    {isSubscribed ? (
      <>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold mb-4">
            Bet Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {bets.map((bet, index) => (
            <div key={index} className="p-3 bg-gray-800/50 rounded-lg text-sm">
              {bet}
            </div>
          ))}
        </div>
      </>
    ) : (
      <>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold mb-4">
            Subscribe to View Bets
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Subscribe to {capperInfo.username}'s picks to view their betting
            details and more exclusive content.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => router.push(`/cappers/${capperInfo.username}`)}
            className="w-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90"
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
    <Card className="w-full bg-gray-900 border-gray-800 flex flex-col mx-auto rounded-none lg:rounded-lg lg:max-w-xl">
      {/* Header */}
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
          <div className="flex flex-col sm:block">
            <button
              onClick={() => router.push(`/cappers/${capperInfo.username}`)}
              className="font-semibold text-2xl sm:text-xs text-gray-100 hover:text-[#4e43ff] transition-colors"
            >
              {capperInfo.username}
            </button>
            {productName && (
              <span className="text-xs sm:text-[10px] text-[#4e43ff] font-semibold sm:ml-2">
                {productName}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs sm:text-[10px] text-gray-400 uppercase">
          {new Date(createdAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Image container - make it taller */}
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
            {/* Blurred background with profile image */}
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

              {/* Mock preview text */}
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

              {/* See Bet Button in fallback image */}
              {bets.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-sm font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-6 py-3 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
                    >
                      See Bet 🎯
                    </Button>
                  </DialogTrigger>
                  <BetDialog
                    bets={bets}
                    isSubscribed={isSubscribed}
                    capperInfo={capperInfo}
                    router={router}
                  />
                </Dialog>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="p-3">
        {/* Action Buttons */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className="h-8 w-8"
            >
              <Heart
                className={`h-5 w-5 ${
                  isLiked ? "text-red-500 fill-red-500" : "text-gray-300"
                }`}
              />
            </Button>
            <p className="font-semibold text-xs text-gray-100">
              {likeCount} likes
            </p>
          </div>
        </div>

        {/* Grid Layout for Content and Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-4">
          {/* Left Column - Content */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-gray-100">{title}</h3>
            <div className="max-h-[100px] overflow-y-auto text-xs text-gray-200">
              <button
                onClick={() => router.push(`/cappers/${capperInfo.username}`)}
                className="font-semibold mr-1 hover:text-[#4e43ff] transition-colors"
              >
                {capperInfo.username}
              </button>
              {content}
            </div>
          </div>

          {/* Right Column - Stats (Desktop) */}
          <div className="hidden sm:flex sm:flex-col sm:gap-4 sm:w-[140px]">
            {/* Odds section */}
            {odds.length > 0 && (
              <div className="flex flex-col items-end">
                <p className="text-xs font-semibold text-white mb-1">ODDS</p>
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

            {/* Tags section */}
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

        {/* Mobile Stats and Tags */}
        <div className="sm:hidden mt-3 space-y-3">
          {/* Mobile Tags */}
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

          {/* Mobile Odds */}
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

        {/* See Bet Button - Fixed at bottom */}
        {bets.length > 0 && (
          <div className="mt-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-sm font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-4 py-2 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
                >
                  See Bet 🎯
                </Button>
              </DialogTrigger>
              <BetDialog
                bets={bets}
                isSubscribed={isSubscribed}
                capperInfo={capperInfo}
                router={router}
              />
            </Dialog>
          </div>
        )}
      </div>
    </Card>
  );
}
export default InstagramPost;
