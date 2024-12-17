"use client";
import { CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useRouter } from "next/navigation";

interface CapperCardProps {
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

function Post({
  userId = "test",
  imageUrl = "https://via.placeholder.com/150",
  firstName = "John",
  lastName = "Doe",
  username = "johndoe",
  bio = " ",
  title = "This is a test title",
  tags = ["tag1", "tag2", "tag3"],

  isVerified = false,
}: CapperCardProps) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={imageUrl} alt={`${firstName} ${lastName}`} />
            <AvatarFallback>
              {firstName?.charAt(0) || ""}
              {lastName?.charAt(0) || ""}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold flex items-center text-white">
              {firstName} {lastName}
              {isVerified && (
                <CheckCircle className="h-4 w-4 text-blue-400 ml-1" />
              )}
            </h3>
            <p className="text-sm text-gray-400">@{username}</p>
            {title && <p className="text-sm text-gray-300">{title}</p>}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-300">{bio || "No bio yet"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-gray-700 text-gray-300"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <p className="mt-4 text-m font-semibold text-violet-400"></p>
        <Button
          className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white border-0"
          variant="default"
          onClick={() => router.push(`/cappers/${username}`)}
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
}

export default Post;
