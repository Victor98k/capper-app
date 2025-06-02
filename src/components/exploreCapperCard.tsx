"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DisplayCapperCardPropsExplorePage } from "@/types/capper";
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

export function ExploreCapperCard({
  username,
  imageUrl,
  profileImage,
  sport,
  likes = 0,
}: DisplayCapperCardPropsExplorePage) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/cappers/${username}`)}
      className="relative aspect-square cursor-pointer group"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${username}'s profile`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105 group-hover:opacity-90"
          sizes="(max-width: 768px) 50vw, 33vw"
          priority
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105">
          {/* Blurred background */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={profileImage || "/default-avatar.png"}
              alt="Background"
              fill
              className="object-cover blur-2xl opacity-30 scale-110"
              sizes="100vw"
              priority
            />
          </div>

          {/* Preview text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-lg text-center space-y-4 select-none">
              <p className="text-gray-300 text-xl md:text-2xl opacity-40">
                🎯 Expert Picks
              </p>
              <p className="text-gray-300 text-xl md:text-2xl opacity-40">
                📊 Analysis
              </p>
              <p className="text-gray-300 text-xl md:text-2xl opacity-40">
                ⚡ Premium Tips
              </p>
            </div>
          </div>

          {/* Profile Avatar */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
              <span className="text-white font-medium text-lg">
                @{username}
              </span>
              <div className="flex flex-col items-center gap-1">
                {sport && (
                  <span className="text-gray-300 text-sm flex items-center gap-1">
                    <span className="text-xl">
                      {sportEmojiMap[sport] || "🎯"}
                    </span>
                    {sport}
                  </span>
                )}
                <span className="text-gray-300 text-sm flex items-center gap-1">
                  ❤️ {likes}
                </span>
              </div>
            </div>
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-violet-500">
              <AvatarImage src={profileImage} />
              <AvatarFallback className="bg-violet-600 text-white text-4xl">
                {username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}

      {/* Hover overlay for image posts */}
      {imageUrl && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center flex-col gap-2">
          <span className="text-white font-medium text-lg">@{username}</span>
          {sport && (
            <span className="text-gray-300 text-sm flex items-center gap-1">
              <span className="text-xl">{sportEmojiMap[sport] || "🎯"}</span>
              {sport}
            </span>
          )}
          <span className="text-gray-300 text-sm flex items-center gap-1">
            ❤️ {likes}
          </span>
        </div>
      )}
    </div>
  );
}

export default ExploreCapperCard;
