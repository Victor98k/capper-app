"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface DisplayCapperCardProps {
  username: string;
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
}

export function ExploreCapperCard({
  username,
  imageUrl,
  firstName = username[0], // fallback to first character of username
  lastName = username[1] || username[0], // fallback to second or first character
}: DisplayCapperCardProps) {
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
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <Avatar className="h-32 w-32 border-2 border-violet-500">
            <AvatarImage src={imageUrl} />
            <AvatarFallback className="bg-violet-600 text-white text-4xl">
              {firstName[0].toUpperCase()}
              {lastName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <span className="text-white font-medium">@{username}</span>
      </div>
    </div>
  );
}

export default ExploreCapperCard;
