"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { sportEmojiMap } from "@/lib/sportEmojiMap";
import { useRouter } from "next/navigation";

type SimplifiedCapperCardProps = {
  username: string;
  imageUrl?: string;
  tags: string[];
};

export function SimplifiedCapperCard({
  username,
  imageUrl,
  tags,
}: SimplifiedCapperCardProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
      <Avatar className="h-14 w-14">
        <AvatarImage src={imageUrl} alt={username} />
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <button
          onClick={() => router.push(`/cappers/${username}`)}
          className="font-medium text-lg text-[#4e43ff] hover:text-[#4e43ff]/80 transition-colors text-left"
        >
          {username}
        </button>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.slice(0, 2).map((tag, index) => (
            <Badge
              key={index}
              className="bg-[#4e43ff] text-gray-300 flex items-center gap-2 border-0"
            >
              <span className="text-lg">
                {sportEmojiMap[tag.toLowerCase()] || "🎯"}
              </span>
              <span>{tag}</span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
