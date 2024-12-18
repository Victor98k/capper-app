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

//test to commit

function MyCappers() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/posts");
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError("Failed to fetch posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-gray-800 p-6 rounded-lg shadow-lg"
              >
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-300 mb-3">{post.content}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags?.map((tag, index) => (
                    <span
                      key={`${post._id}-${tag}-${index}`}
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyCappers;
