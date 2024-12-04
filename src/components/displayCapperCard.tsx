import { CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import router from "next/router";

function DisplayCapperCard() {
  const admin = {
    avatar: "https://via.placeholder.com/150",
    name: "John Doe",
    isVerified: true,
    username: "johndoe",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    tags: ["Developer", "Designer", "Content Creator"],
    subscribers: 12345,
  };

  return (
    <>
      <Card className="overflow-hidden bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={admin.avatar} alt={admin.name} />
              <AvatarFallback>
                {admin.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                {admin.name}
                {admin.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-400 ml-1" />
                )}
              </h3>
              <p className="text-sm text-gray-400">@{admin.username}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-300">{admin.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {admin.tags.map((tag) => (
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
            {admin.subscribers.toLocaleString()} Capper Subscribers
          </p>
          <p className="mt-4 text-lg font-semibold text-violet-400">
            {admin.subscribers.toLocaleString()} Instagram Followers
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
    </>
  );
}

export default DisplayCapperCard;

// TODO: Add following on other platforms in display card
