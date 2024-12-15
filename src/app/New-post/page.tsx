"use client";

import { useState } from "react";
import { SideNav } from "@/components/SideNavCappers";
import { Bell, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DisplayCapperCard from "@/components/displayCapperCard";
import PostPreview from "@/components/Posts";

function NewPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.clear();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          title,
          content,
          tags,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Post created successfully:", data);
      router.push("/dashboard"); // or wherever you want to redirect after posting
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user?.isCapper) {
    router.push("/home");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideNav />

      <div className="flex-1">
        <header className="bg-white shadow pl-16 lg:pl-0">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Post
            </h1>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create a New Post</CardTitle>
                <CardDescription>
                  Share your insights and predictions with your subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full p-2 border rounded-md"
                      placeholder="Enter post title..."
                    />
                  </div>

                  {/* Content Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="mt-1 w-full min-h-[200px] p-2 border rounded-md"
                      placeholder="Write your post content..."
                    />
                  </div>

                  {/* Tags Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tags
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-1 bg-[#4e43ff]/10 px-3 py-1 rounded-full"
                        >
                          <span className="text-[#4e43ff]">{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-[#4e43ff]/70 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                        placeholder="Add a tag..."
                        className="flex-1 p-2 border rounded-md"
                      />
                      <Button onClick={handleAddTag}>Add Tag</Button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Create Post</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add the Preview Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Preview Your Post</CardTitle>
                <CardDescription>
                  This is how your post will appear to other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PostPreview
                  userId={user?.id || ""}
                  firstName={user?.firstName || ""}
                  lastName={user?.lastName || ""}
                  username={user?.username || ""}
                  title={title}
                  content={content}
                  tags={tags}
                  prediction="Home Win"
                  odds="1.95"
                  confidence={85}
                  sport="Football"
                  match="Manchester United vs Liverpool"
                  league="Premier League"
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default NewPostPage;
