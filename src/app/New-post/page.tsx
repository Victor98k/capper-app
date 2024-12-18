"use client";

import { useState, useCallback } from "react";
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
import Posts from "@/components/Posts";
import { toast } from "sonner";

function NewPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  }, []);

  const handleSubmit = async () => {
    try {
      if (!title.trim() || !content.trim()) {
        toast.error("Title and content are required");
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("tags", JSON.stringify(tags));
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      toast.success("Post created successfully!");
      router.push("/home-capper");
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create post"
      );
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

                  {/* Image Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    {!imagePreview ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                          ${
                            isDragging
                              ? "border-[#4e43ff] bg-[#4e43ff]/10"
                              : "border-gray-300 hover:border-[#4e43ff]"
                          }`}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() =>
                          document.getElementById("imageInput")?.click()
                        }
                      >
                        <div className="space-y-2">
                          <div className="text-gray-600">
                            <svg
                              className="mx-auto h-12 w-12"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="flex text-sm text-gray-600">
                            <span className="relative cursor-pointer rounded-md font-medium text-[#4e43ff] focus-within:outline-none">
                              Click to upload
                            </span>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                        <input
                          id="imageInput"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs h-auto rounded-md"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    )}
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
                <Posts
                  userId={user?.id || ""}
                  firstName={user?.firstName || ""}
                  lastName={user?.lastName || ""}
                  // username={user?.username || ""}
                  tags={tags}
                  subscriberIds={[]}
                  isVerified={false}
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
