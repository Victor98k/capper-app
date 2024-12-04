import { CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import router from "next/router";

interface CapperCardProps {
  avatar?: string;
  firstName: string;
  lastName: string;
  isVerified?: boolean;
  username: string;
  bio: string;
  tags: string[];
  subscribers: number;
}

function DisplayCapperCard({
  avatar = "https://via.placeholder.com/150",
  firstName,
  lastName,
  isVerified = false,
  username,
  bio,
  tags,
  subscribers = 0,
}: CapperCardProps) {
  return (
    <Card className="overflow-hidden bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar} alt={`${firstName} ${lastName}`} />
            <AvatarFallback>
              {firstName[0]}
              {lastName[0]}
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
        <p className="mt-4 text-m font-semibold text-violet-400">
          {subscribers.toLocaleString()} Capper Subscribers
        </p>
        <Button
          className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white border-0"
          variant="default"
          onClick={() => router.push("/Subscriptions")}
        >
          Profile
        </Button>
      </CardContent>
    </Card>
  );
}

export default DisplayCapperCard;
