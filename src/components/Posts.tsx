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
    <Card className="w-full max-w-[600px] bg-gray-900 border-gray-800">
      {/* Card Header - Mobile: Larger touch targets */}
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {/* User Info - Mobile: Larger avatar and text */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 sm:h-8 sm:w-8">
              <AvatarImage src={capperInfo.imageUrl || "/placeholder.svg"} />
              <AvatarFallback>{capperInfo.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base sm:text-sm">
                {capperInfo.username}
              </p>
              <p className="text-sm sm:text-xs text-gray-400">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* More Options Button - Mobile: Larger touch target */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:h-8 sm:w-8"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content Section - Mobile: Larger text and spacing */}
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Title and Content */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-lg font-bold">{title}</h2>
          <p className="text-base sm:text-sm text-gray-300">{content}</p>
        </div>

        {/* Tags Section - Mobile: Larger touch targets */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1.5 sm:px-2 sm:py-1 bg-gray-800 rounded-full text-sm sm:text-xs"
            >
              {sportEmojiMap[tag] || ""} {tag}
            </span>
          ))}
        </div>

        {/* Odds Section - Mobile: Larger text */}
        {odds.length > 0 && (
          <div className="mt-4 p-4 sm:p-3 bg-gray-800/50 rounded-lg">
            <div className="flex flex-col space-y-2">
              <span className="text-sm sm:text-xs text-gray-400">ODDS</span>
              {odds.map((odd, index) => (
                <span
                  key={index}
                  className="text-base sm:text-sm font-bold text-[#4e43ff]"
                >
                  {odd}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* See Bet Button - Mobile: Larger button */}
        {bets.length > 0 && (
          <div className="mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full py-3 sm:py-2 text-base sm:text-sm font-semibold bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 border-0 px-6 sm:px-4 rounded-full shadow-lg shadow-[#4e43ff]/20 transition-all hover:scale-105"
                >
                  See Bet 🎯
                </Button>
              </DialogTrigger>

              {/* Dialog Content - Mobile: Larger text and spacing */}
              <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 w-[90vw] max-w-md mx-auto p-6 sm:p-4">
                {isSubscribed ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl sm:text-lg font-bold mb-4">
                        Bet Details
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {bets.map((bet, index) => (
                        <div
                          key={index}
                          className="p-4 sm:p-3 bg-gray-800/50 rounded-lg text-base sm:text-sm"
                        >
                          {bet}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl sm:text-lg font-bold mb-4">
                        Subscribe to View Bets
                      </DialogTitle>
                      <DialogDescription className="text-base sm:text-sm text-gray-400">
                        Subscribe to {capperInfo.username}'s picks to view their
                        betting details and more exclusive content.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        onClick={() =>
                          router.push(`/cappers/${capperInfo.username}`)
                        }
                        className="w-full py-3 sm:py-2 text-base sm:text-sm bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90"
                      >
                        View Subscription Plans
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default InstagramPost;
