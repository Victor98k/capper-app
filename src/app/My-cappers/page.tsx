"use client";

import { SideNav } from "@/components/SideNav";
import { useEffect, useState } from "react";
import Image from "next/image";

type Post = {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  tags: string[];
  capperId: string;
  createdAt: string;
  updatedAt: string;
};

function MyCappers() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await response.json();
        if (mounted) {
          setPosts(data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        if (mounted) {
          setError("Failed to fetch posts");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      mounted = false;
    };
  }, []);

  const renderPostImage = (post: Post) => {
    if (!post.imageUrl) {
      return (
        <div className="w-full h-48 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      );
    }

    return (
      <div className="relative w-full h-48 mb-4">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      </div>
    );
  };

  const renderPost = (post: Post) => (
    <div key={post._id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
      {renderPostImage(post)}
      <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
      <p className="text-gray-300 mb-3">{post.content}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags?.map((tag) => (
          <span
            key={`${post._id}-${tag}`}
            className="bg-gray-700 px-2 py-1 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="text-sm text-gray-400">
        Posted: {new Date(post.createdAt).toLocaleDateString()}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8 lg:p-8">
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex">
        <SideNav />
        <main className="flex-1 p-8 lg:p-8">
          <div className="text-red-500">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />
      <main className="flex-1 p-8 lg:p-8">
        <div className="lg:mt-0 mt-8">
          <h2 className="text-2xl font-bold mb-4">My Cappers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(renderPost)}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyCappers;
