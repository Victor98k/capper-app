"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import Image from "next/image";

interface PostProps {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  odds: string[];
  bets: string[];
  tags: string[];
  capperId: string;
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

function InstagramPost({
  _id,
  title,
  content,
  imageUrl,
  odds,
  bets,
  tags,
  capperId,
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
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };

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
            <p className="font-semibold text-xs text-gray-100">
              {capperInfo.username}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-gray-300" />
        </Button>
      </div>

      {/* Image container - adjust height and maintain aspect ratio */}
      <div className="relative w-full aspect-[4/3] border-b border-gray-800">
        <Image
          src={imageUrl || "/placeholder-image.jpg"}
          alt={title || "Post image"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      </div>

      {/* Bottom section - made more compact */}
      <div className="p-2 space-y-2">
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageCircle className="h-4 w-4 text-gray-300" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Send className="h-4 w-4 text-gray-300" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bookmark className="h-4 w-4 text-gray-300" />
          </Button>
        </div>

        {/* Likes and Caption */}
        <div className="space-y-1">
          <p className="font-semibold text-xs text-gray-100">
            {likeCount} likes
          </p>
          <p className="text-xs text-gray-200">
            <span className="font-semibold mr-1">{capperInfo.username}</span>
            {content}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="text-xs text-blue-400">
              #{tag}
            </span>
          ))}
        </div>

        {/* Timestamp */}
        <p className="text-[10px] text-gray-400 uppercase">
          {new Date(createdAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </Card>
  );
}

export default InstagramPost;
