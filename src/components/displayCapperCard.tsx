"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface DisplayCapperCardProps {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  bio?: string;
  title?: string;
  imageUrl?: string;
  tags: string[];
  subscriberIds: string[];
  isVerified: boolean;
}

export function DisplayCapperCard({
  userId,
  firstName,
  lastName,
  username,
  bio,
  title,
  imageUrl,
  tags,
  subscriberIds,
  isVerified,
}: DisplayCapperCardProps) {
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        if (typeof window !== "undefined") {
          // Check if we're in the browser
          const response = await fetch(
            `/api/subscriptions/check?capperId=${userId}`
          );
          const data = await response.json();
          setIsSubscribed(data.isSubscribed);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
      }
    };

    checkSubscriptionStatus();
  }, [userId]);

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
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 border-2 border-violet-500">
            <AvatarImage src={imageUrl} />
            <AvatarFallback className="bg-violet-600 text-white">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold flex items-center text-white">
              {firstName} {lastName}
              {isVerified && (
                <CheckCircle className="h-4 w-4 text-blue-400 ml-1" />
              )}
            </h3>
            <p className="text-sm text-gray-400">@{username}</p>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Users className="h-4 w-4 mr-1" />
            {subscriberIds.length}
          </div>
        </div>

        {(title || bio) && (
          <div className="mt-4">
            {title && (
              <h4 className="font-medium text-violet-400 mb-1">{title}</h4>
            )}
            {bio && <p className="text-gray-300 text-sm">{bio}</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-violet-400 border-violet-400"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <Button
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => router.push(`/cappers/${username}`)}
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DisplayCapperCard;
