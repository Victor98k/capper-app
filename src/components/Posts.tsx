"use client";

import { CheckCircle, Calendar, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { useRouter } from "next/navigation";
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
  capperInfo?: {
    firstName: string;
    lastName: string;
    imageUrl?: string;
    isVerified?: boolean;
  };
}

function Post({
  _id,
  title,
  content,
  imageUrl,
  odds,
  bets,
  tags,
  capperId,
  createdAt,
  capperInfo,
}: PostProps) {
  const router = useRouter();

  const renderPostImage = () => {
    if (!imageUrl) {
      return (
        <div className="w-full h-48 bg-gray-700 rounded-t-lg flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      );
    }

    return (
      <div className="relative w-full h-48">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover rounded-t-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      </div>
    );
  };

  return (
    <Card className="overflow-hidden bg-gray-800 border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20">
      {renderPostImage()}
      <CardContent className="p-6">
        {/* Capper Info Section */}
        {capperInfo && (
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-12 w-12 border-2 border-violet-500">
              <AvatarImage
                src={capperInfo.imageUrl}
                alt={`${capperInfo.firstName} ${capperInfo.lastName}`}
              />
              <AvatarFallback className="bg-violet-600 text-white">
                {capperInfo.firstName?.charAt(0)}
                {capperInfo.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold flex items-center text-white">
                {capperInfo.firstName} {capperInfo.lastName}
                {capperInfo.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-400 ml-1" />
                )}
              </h3>
              <div className="flex items-center text-sm text-gray-400">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Post Content */}
        <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-300 mb-4 line-clamp-3">{content}</p>

        {/* Odds and Bets Section */}
        <div className="flex flex-wrap gap-2 mb-4">
          {odds?.map((odd, index) => (
            <Badge
              key={`${_id}-odd-${index}`}
              variant="secondary"
              className="bg-blue-600 text-white"
            >
              {odd}
            </Badge>
          ))}
          {bets?.map((bet, index) => (
            <Badge
              key={`${_id}-bet-${index}`}
              variant="secondary"
              className="bg-green-600 text-white"
            >
              {bet}
            </Badge>
          ))}
        </div>

        {/* Tags Section */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags?.map((tag) => (
            <Badge
              key={`${_id}-${tag}`}
              variant="outline"
              className="text-violet-400 border-violet-400"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="bg-gray-900 p-4">
        <Button
          className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 transition-all duration-300 group"
          variant="default"
          onClick={() => router.push(`/posts/${_id}`)}
        >
          View Details
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default Post;
