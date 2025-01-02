"use client";

import { useState } from "react";
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
} from "./ui/dialog";
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

const sportEmojiMap: { [key: string]: string } = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  "American Football": "🏈",
  Baseball: "⚾",
  Badminton: "🏸",
  Rugby: "🏉",
  Swimming: "🏊‍♂️",
  Running: "🏃‍♂️",
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
        </div>

        {/* Content section with responsive layout */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          {/* Left side: Title, Content, and Bet Button */}
          <div className="flex-1">
            <h3 className="font-bold text-sm md:text-m text-gray-100 mb-1">
              {title}
            </h3>
            <p className="text-xs text-gray-200 mb-2">
              <span className="font-semibold mr-1">{capperInfo.username}</span>
              {content}
            </p>

            {/* Bets Modal - adjusted button for mobile */}
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
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Right side: Odds and Tags - adjusted for mobile */}
          <div className="space-y-2 md:space-y-3 w-full md:min-w-[140px] md:w-auto">
            {/* Odds section */}
            {odds.length > 0 && (
              <div className="w-full text-center md:text-right bg-[#4e43ff] p-2 md:p-3 rounded-lg shadow-lg shadow-[#4e43ff]/20">
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <p className="text-xs font-semibold text-white">ODDS</p>
                  <div className="flex justify-end">
                    {odds.map((odd, index) => (
                      <span
                        key={index}
                        className="text-xl md:text-2xl font-bold text-white px-2"
                      >
                        {odd}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tags section */}
            <div className="w-full text-center md:text-right">
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                <p className="text-xs font-semibold text-white bg-[#4e43ff] px-3 py-1 rounded-full shadow-lg shadow-[#4e43ff]/20">
                  SPORT
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-lg md:text-xl bg-[#4e43ff] text-white px-3 md:px-4 py-1 md:py-2 rounded-full shadow-lg shadow-[#4e43ff]/20"
                      title={tag}
                    >
                      {sportEmojiMap[tag] || tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Likes count remains the same */}
        <div className="space-y-1">
          <p className="font-semibold text-xs text-gray-100">
            {likeCount} likes
          </p>
        </div>

        {/* Timestamp remains the same */}
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
