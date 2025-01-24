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
  imageUrl: string;
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
    imageUrl?: string;
    isVerified?: boolean;
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
    imageUrl: "",
    isVerified: false,
  },
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
        console.log("Checking subscription for:", {
          capperId,
          productId,
        });

        const response = await fetch(
          `/api/subscriptions/check?capperId=${capperId}&productId=${productId}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Subscription check response:", data);

          // Check if this specific product is in the subscribedProducts array
          const isSubscribedToProduct =
            data.subscribedProducts?.includes(productId);
          setIsSubscribed(isSubscribedToProduct || false);
        } else {
          console.error("Subscription check failed:", await response.text());
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (capperId && productId) {
      checkSubscription();
    }
  }, [capperId, productId]);

  return (
    <Card className="w-full max-w-md bg-gray-900 border-gray-800 flex flex-col mx-auto">
      {/* Header - made more compact */}
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6 border border-gray-700">
            <AvatarImage src={capperInfo.imageUrl} alt={capperInfo.username} />
            <AvatarFallback className="bg-violet-600 text-white text-xs">
              {capperInfo.firstName[0]}
              {capperInfo.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <button
              onClick={() => router.push(`/cappers/${capperInfo.username}`)}
              className="font-semibold text-xs text-gray-100 hover:text-[#4e43ff] transition-colors"
            >
              {capperInfo.username}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {productName && (
            <span className="text-[10px] text-[#4e43ff] font-semibold">
              {productName}
            </span>
          )}
          <p className="text-[10px] text-gray-400 uppercase">
            {new Date(createdAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Image container - adjusted for better mobile responsiveness */}
      <div className="relative w-full aspect-[4/3] border-b border-gray-800">
        <Image
          src={imageUrl || "/placeholder-image.jpg"}
          alt={title || "Post image"}
          fill
          className="object-cover"
          sizes="(max-width: 468px) 100vw, (max-width: 768px) 75vw, 33vw"
          priority
        />
      </div>

      {/* Bottom section - reorganized for mobile */}
      <div className="p-2 space-y-2">
        {/* Action Buttons - simplified to only like button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className="h-8 w-8"
          >
            <Heart
              className={`h-4 w-4 ${
                isLiked ? "text-red-500 fill-red-500" : "text-gray-300"
              }`}
            />
          </Button>
          <div className="space-y-1">
            <p className="font-semibold text-xs text-gray-100">
              {likeCount} likes
            </p>
          </div>
        </div>

        {/* Content section with responsive layout */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          {/* Left side: Title, Content, and Bet Button */}
          <div className="flex-1">
            <h3 className="font-bold text-sm md:text-m text-gray-100 mb-1">
              {title}
            </h3>
            <p className="text-xs text-gray-200 mb-2">
              <button
                onClick={() => router.push(`/cappers/${capperInfo.username}`)}
                className="font-semibold mr-1 hover:text-[#4e43ff] transition-colors"
              >
                {capperInfo.username}
              </button>
              {content}
            </p>

            {/* Bets Modal - with subscription check */}
            {bets.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto mt-2 text-sm font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-4 md:px-6 py-2 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
                  >
                    See Bet 🎯
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 w-[90vw] max-w-md mx-auto">
                  {isSubscribed ? (
                    // Show bets if subscribed
                    <>
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold mb-4">
                          Bet Details
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        {bets.map((bet, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-800/50 rounded-lg text-sm"
                          >
                            {bet}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    // Show subscription prompt if not subscribed
                    <>
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold mb-4">
                          Subscribe to View Bets
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Subscribe to {capperInfo.username}'s picks to view
                          their betting details and more exclusive content.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          onClick={() =>
                            router.push(`/cappers/${capperInfo.username}`)
                          }
                          className="w-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90"
                        >
                          View Subscription Plans
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Right side: Odds and Tags - adjusted for mobile */}
          <div className="space-y-2 md:space-y-3 w-full md:min-w-[140px] md:w-auto">
            {/* Odds section */}
            {odds.length > 0 && (
              <div className="flex flex-col items-center md:items-end mr-2">
                <p className="text-xs font-semibold text-white mb-1 pr-4">
                  ODDS
                </p>
                <div className="bg-[#24b657] p-1 md:p-2 rounded-lg shadow-lg shadow-[#4e43ff]/20">
                  <div className="flex justify-center md:justify-end">
                    {odds.map((odd, index) => (
                      <span
                        key={index}
                        className="text-xl md:text-2xl font-bold text-white px-1"
                      >
                        {odd}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tags section */}
            <div className="flex flex-col items-center md:items-end mr-2 pr-2">
              <p className="text-xs font-semibold text-white mb-1 pr-2">
                SPORT
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-lg md:text-xl bg-[#4e43ff] text-white px-3 md:px-4 py-1 md:py-2 rounded-lg shadow-lg shadow-[#4e43ff]/20"
                    title={tag}
                  >
                    {sportEmojiMap[tag] || tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Likes count remains the same */}
      </div>
    </Card>
  );
}
export default InstagramPost;
