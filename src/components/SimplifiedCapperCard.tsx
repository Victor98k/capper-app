"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { sportEmojiMap } from "@/lib/sportEmojiMap";
import { useRouter } from "next/navigation";

interface SimplifiedCapperCardProps {
  username: string;
  imageUrl?: string;
  tags: string[];
  firstName?: string;
  lastName?: string;
  onClick?: () => void;
}

export function SimplifiedCapperCard({
  username,
  imageUrl,
  tags,
  firstName,
  lastName,
  onClick,
}: SimplifiedCapperCardProps) {
  const router = useRouter();

  return (
    <div
      className="flex items-center space-x-4 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
      onClick={onClick}
    >
      <Avatar className="w-12 h-12 border-2 border-[#4e43ff]">
        <AvatarImage src={imageUrl} />
        <AvatarFallback className="bg-[#4e43ff]/10 text-[#4e43ff]">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-semibold">{username}</h3>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-[#4e43ff] px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
