"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { sportEmojiMap } from "@/lib/sportEmojiMap";

interface DisplayCapperCardProps {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  bio?: string;
  title?: string;
  imageUrl?: string;
  tags: string[];
  subscriberIds?: string[];
  isVerified: boolean;
}

export function DisplayCapperCard({
  userId,
  firstName,
  lastName,
  username,
  title,
  imageUrl,
  tags,
  subscriberIds = [],
  isVerified,
}: DisplayCapperCardProps) {
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // useEffect(() => {
  //   const checkSubscriptionStatus = async () => {
  //     try {
  //       if (typeof window !== "undefined") {
  //         // Check if we're in the browser
  //         const response = await fetch(
  //           `/api/subscriptions/check?capperId=${userId}`
  //         );
  //         const data = await response.json();
  //         setIsSubscribed(data.isSubscribed);
  //       }
  //     } catch (error) {
  //       console.error("Error checking subscription status:", error);
  //     }
  //   };

  //   checkSubscriptionStatus();
  // }, [userId]);

  const handleSubscribe = async () => {
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ capperId: userId }),
      });

      if (response.ok) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  return (
    <Card className="overflow-hidden bg-gray-800 border-gray-700 hover:border-violet-500/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-32 w-32 border-4 border-violet-500 mb-4">
            <AvatarImage src={imageUrl} />
            <AvatarFallback className="bg-violet-600 text-white text-3xl">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-xl font-semibold flex items-center justify-center text-white mb-1">
              {firstName} {lastName}
              {isVerified && (
                <CheckCircle className="h-5 w-5 text-blue-400 ml-2" />
              )}
            </h3>
            <p className="text-sm text-gray-400 mb-2">@{username}</p>
            <div className="flex items-center justify-center text-sm text-gray-400">
              <Users className="h-4 w-4 mr-1" />
              <span>{subscriberIds?.length || 0} Subscribers</span>
            </div>
          </div>
        </div>

        {title && (
          <div className="text-center mb-6">
            <h4 className="font-medium text-violet-400 mb-2">{title}</h4>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center bg-[#4e43ff]/10 text-[#4e43ff] px-3 py-1.5 rounded-lg"
            >
              <span className="text-lg mr-2">{sportEmojiMap[tag] || "🎯"}</span>
              <span className="text-sm font-medium">{tag}</span>
            </span>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            className="w-full max-w-xs bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => router.push("/sign-up")}
          >
            Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DisplayCapperCard;
