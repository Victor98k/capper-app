"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface DisplayCapperCardProps {
  username: string;
  imageUrl?: string;
}

export function ExploreCapperCard({
  username,
  imageUrl,
}: DisplayCapperCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/cappers/${username}`)}
      className="relative aspect-square cursor-pointer group"
    >
      <Image
        src={imageUrl || "/placeholder-image.jpg"}
        alt={`${username}'s profile`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105 group-hover:opacity-90"
        sizes="(max-width: 768px) 50vw, 33vw"
        priority
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <span className="text-white font-medium">@{username}</span>
      </div>
    </div>
  );
}

export default ExploreCapperCard;
