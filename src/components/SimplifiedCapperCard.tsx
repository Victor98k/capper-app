"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={imageUrl} alt={username} />
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="font-medium text-sm text-[#4e43ff]">{username}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
