"use client";

import { useEffect, useState } from "react";
import { SideNav } from "@/components/SideNavCappers";
import Post from "@/components/Posts";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import {
  Trophy,
  Users,
  TrendingUp,
  Calculator,
  Check,
  Twitter,
  Youtube,
  Phone,
  MessageSquare,
  Instagram,
} from "lucide-react";
import { Post as PostType } from "@/types/capperPost";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { sportEmojiMap } from "@/lib/sportEmojiMap";

export default function MyPosts() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capperData, setCapperData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  useEffect(() => {
    const fetchCapperData = async () => {
      if (!user?.id) return;

      try {
        const capperResponse = await fetch("/api/cappers", {
          credentials: "include",
        });
        if (!capperResponse.ok) {
          throw new Error("Failed to fetch capper information");
        }
        const cappers = await capperResponse.json();
        const capper = cappers.find((c: any) => c.userId === user.id);

        if (!capper) {
          throw new Error("Capper profile not found");
        }

        setCapperData(capper);

        // Fetch posts with the capper ID
        const response = await fetch(`/api/posts?capperId=${capper.id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapperData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Loader />
          </div>
        </main>
      </div>
    );
  }

  if (error || !capperData) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8">
          <p className="text-center">{error || "Failed to load profile"}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />
      <main className="flex-1 p-2 sm:p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40">
                <AvatarImage
                  src={capperData.profileImage || capperData.imageUrl}
                />
                <AvatarFallback className="bg-[#4e43ff] text-white text-2xl sm:text-4xl uppercase">
                  {capperData.user.firstName?.[0]}
                  {capperData.user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              {/* Profile Details */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl pb-6 font-bold">
                  @{capperData.user.username}
                </h1>

                {/* Tags */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                  {capperData.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      className="bg-[#4e43ff] text-gray-300 flex items-center gap-2 border-0"
                    >
                      <span className="text-lg">
                        {sportEmojiMap[tag] || "🎯"}
                      </span>
                      <span>{tag}</span>
                    </Badge>
                  ))}

                  {/* Bio */}
                  <p className="text-gray-100 text-sm sm:text-base">
                    {capperData.bio || "No bio added yet"}
                  </p>
                </div>
                {/* Social Links */}
                {capperData.socialLinks && (
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                    {capperData.socialLinks.instagram?.username &&
                      capperData.socialLinks.instagram?.url && (
                        <a
                          href={capperData.socialLinks.instagram.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-pink-500 hover:text-pink-400 transition-colors"
                        >
                          <Instagram className="h-5 w-5" />
                          <span className="text-sm">
                            @{capperData.socialLinks.instagram.username}
                          </span>
                        </a>
                      )}
                    {capperData.socialLinks.x?.username &&
                      capperData.socialLinks.x?.url && (
                        <a
                          href={capperData.socialLinks.x.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Twitter className="h-5 w-5" />
                          <span className="text-sm">
                            @{capperData.socialLinks.x.username}
                          </span>
                        </a>
                      )}
                    {capperData.socialLinks.youtube?.username &&
                      capperData.socialLinks.youtube?.url && (
                        <a
                          href={capperData.socialLinks.youtube.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
                        >
                          <Youtube className="h-5 w-5" />
                          <span className="text-sm">
                            {capperData.socialLinks.youtube.username}
                          </span>
                        </a>
                      )}
                    {capperData.socialLinks.discord?.username &&
                      capperData.socialLinks.discord?.url && (
                        <a
                          href={capperData.socialLinks.discord.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-indigo-500 hover:text-indigo-400 transition-colors"
                        >
                          <MessageSquare className="h-5 w-5" />
                          <span className="text-sm">
                            {capperData.socialLinks.discord.username}
                          </span>
                        </a>
                      )}
                    {capperData.socialLinks.whatsapp?.username &&
                      capperData.socialLinks.whatsapp?.url && (
                        <a
                          href={capperData.socialLinks.whatsapp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
                        >
                          <Phone className="h-5 w-5" />
                          <span className="text-sm">
                            {capperData.socialLinks.whatsapp.username}
                          </span>
                        </a>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Posts Section */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">My Posts</h2>
                <Button
                  onClick={() => router.push("/New-post")}
                  className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                >
                  Create New Post
                </Button>
              </div>

              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] p-4">
                  <div className="bg-gray-800/50 rounded-xl p-8 max-w-md w-full text-center space-y-6 border border-gray-700">
                    <div className="bg-[#4e43ff]/10 p-4 rounded-full w-fit mx-auto">
                      <Trophy className="w-12 h-12 text-[#4e43ff]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      No Posts Yet
                    </h3>
                    <p className="text-gray-400 text-lg">
                      Start sharing your picks and insights with your
                      subscribers!
                    </p>
                    <Button
                      onClick={() => router.push("/New-post")}
                      className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                    >
                      Create Your First Post
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {posts
                      .slice(
                        (currentPage - 1) * postsPerPage,
                        currentPage * postsPerPage
                      )
                      .map((post) => (
                        <Post
                          key={post._id}
                          {...post}
                          isOwnPost={true}
                          capperInfo={{
                            firstName: capperData.user.firstName,
                            lastName: capperData.user.lastName,
                            username: capperData.user.username,
                            profileImage: capperData.profileImage,
                            isVerified: true,
                          }}
                        />
                      ))}
                  </div>

                  {/* Pagination */}
                  {posts.length > postsPerPage && (
                    <div className="flex justify-center gap-4 mt-8">
                      <Button
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                      >
                        Previous
                      </Button>
                      <span className="flex items-center text-gray-400">
                        Page {currentPage} of{" "}
                        {Math.ceil(posts.length / postsPerPage)}
                      </span>
                      <Button
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={
                          currentPage === Math.ceil(posts.length / postsPerPage)
                        }
                        variant="outline"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
