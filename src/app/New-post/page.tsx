"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Post from "@/components/Posts";
import CapperDashboard from "@/components/capperDashboard";
// import Cropper from "react-easy-crop";
import { toast, Toaster } from "sonner";
import Loader from "@/components/Loader";

// Add type for product
interface Product {
  id: string;
  name: string;
  description?: string;
}

// Add these constants at the top with the other constants
const MAX_TITLE_LENGTH = 60;
const MAX_CONTENT_LENGTH = 400;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MAX_ODDS = 5;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const isValidOdd = (odd: string): boolean => {
  const number = parseFloat(odd);
  return (
    !isNaN(number) &&
    (number % 1 === 0 || number % 1 === 0.5) && // Only whole numbers or .5
    number >= 1
  ); // Ensure odds are 1 or greater
};

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
  const [bets, setBets] = useState<string[]>([]);
  const [newBet, setNewBet] = useState("");
  const [odds, setOdds] = useState<string[]>([]);
  const [newOdd, setNewOdd] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  // const [crop, setCrop] = useState({ x: 0, y: 0 });
  // const [zoom, setZoom] = useState(1);
  // const [showCropper, setShowCropper] = useState(false);
  // const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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

  // const handleRemoveTag = (tagToRemove: string) => {
  //   setTags(tags.filter((tag) => tag !== tagToRemove));
  // };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image too large", {
        description: "Please select an image under 10MB",
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description:
          "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
      });
      return;
    }

    setImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
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
    if (!file) return;

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image too large", {
        description: "Please select an image under 10MB",
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description:
          "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
      });
      return;
    }

    setImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }, []);

  const handleAddBet = () => {
    if (newBet.trim() && !bets.includes(newBet.trim())) {
      setBets([...bets, newBet.trim()]);
      setNewBet("");
    }
  };

  const handleRemoveBet = (betToRemove: string) => {
    setBets(bets.filter((bet) => bet !== betToRemove));
  };

  const handleAddOdd = () => {
    if (odds.length >= MAX_ODDS) {
      toast.error("Maximum odds reached", {
        description: `You can only add up to ${MAX_ODDS} odds per post`,
      });
      return;
    }

    const trimmedOdd = newOdd.trim();
    if (!trimmedOdd) return;

    if (!isValidOdd(trimmedOdd)) {
      toast.error("Invalid odds format", {
        description:
          "Odds must be whole numbers or end with .5 (e.g., 1.5, 2, 2.5)",
      });
      return;
    }

    if (!odds.includes(trimmedOdd)) {
      setOdds([...odds, trimmedOdd]);
      setNewOdd("");
    }
  };

  const handleRemoveOdd = (oddToRemove: string) => {
    setOdds(odds.filter((odd) => odd !== oddToRemove));
  };

  const handleOddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and one decimal point
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNewOdd(value);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate title length
      if (title.length > MAX_TITLE_LENGTH) {
        toast.error("Title is too long", {
          description: `Title must be ${MAX_TITLE_LENGTH} characters or less`,
        });
        return;
      }

      // Add content length validation
      if (content.length > MAX_CONTENT_LENGTH) {
        toast.error("Content is too long", {
          description: `Content must be ${MAX_CONTENT_LENGTH} characters or less`,
        });
        return;
      }

      // Validate required fields
      if (!title || !content || !selectedProduct) {
        toast.error("Please fill in all required fields", {
          description: "Title, content, and bundle selection are required",
        });
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading("Creating your post...");

      // Get username from localStorage
      const username = localStorage.getItem("username") || "";

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("tags", JSON.stringify(tags));
      formData.append("bets", JSON.stringify(bets));
      formData.append("odds", JSON.stringify(odds));
      formData.append("username", username);
      formData.append("productId", selectedProduct);

      // If no image is uploaded, create a fallback image
      if (!image && tags.length > 0) {
        const selectedSport = sportEmojis.find(
          (item) => item.sport === tags[0]
        );
        formData.append("useFallback", "true");
        formData.append("fallbackEmoji", selectedSport?.emoji || "⚽");
        formData.append("profileImage", profileImage);
      } else if (image) {
        formData.append("image", image);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Post created successfully!", {
        description: "Your post is now live and visible to your subscribers",
      });

      // Clear the form after successful post
      setTitle("");
      setContent("");
      setTags([]);
      setBets([]);
      setOdds([]);
      setImage(null);
      setImagePreview(null);
      setSelectedProduct("");
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const sportEmojis = [
    { emoji: "⚽", sport: "Football" },
    { emoji: "🏀", sport: "Basketball" },
    { emoji: "🎾", sport: "Tennis" },
    { emoji: "🏈", sport: "American Football" },
    { emoji: "⚾", sport: "Baseball" },
    { emoji: "🏸", sport: "Badminton" },
    { emoji: "🏉", sport: "Rugby" },
    { emoji: "🏊‍♂️", sport: "Swimming" },
    { emoji: "🏃‍♂️", sport: "Running" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const username = localStorage.getItem("username");
        if (!username) {
          console.error("No username found");
          return;
        }

        const response = await fetch(`/api/cappers/${username}`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          console.error("No products found or invalid format");
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        const username = localStorage.getItem("username");
        if (!username) return;

        const response = await fetch(`/api/cappers/${username}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        if (data.profileImage) {
          setProfileImage(data.profileImage);
        }
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };

    fetchUserAvatar();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <SideNav />
        <div className="flex-1">
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isCapper) {
    router.push("/home");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideNav />
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        style={{
          zIndex: 9999,
          position: "fixed",
          top: "20px",
          right: "20px",
        }}
      />
      <div className="flex-1">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-4xl font-bold">
                  Create a New Post
                </CardTitle>
                <CardDescription>
                  Share your insights and predictions with your subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Bundle</Label>
                    <Select
                      value={selectedProduct}
                      onValueChange={setSelectedProduct}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bundle" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                          // Limit input to MAX_TITLE_LENGTH characters
                          if (e.target.value.length <= MAX_TITLE_LENGTH) {
                            setTitle(e.target.value);
                          }
                        }}
                        className="mt-1 w-full p-2 border rounded-md"
                        placeholder="Enter post title..."
                        maxLength={MAX_TITLE_LENGTH}
                      />
                      <span
                        className={`absolute right-2 bottom-2 text-sm ${
                          title.length === MAX_TITLE_LENGTH
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {title.length}/{MAX_TITLE_LENGTH}
                      </span>
                    </div>
                  </div>

                  {/* Content Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <div className="relative">
                      <textarea
                        value={content}
                        onChange={(e) => {
                          // Limit input to MAX_CONTENT_LENGTH characters
                          if (e.target.value.length <= MAX_CONTENT_LENGTH) {
                            setContent(e.target.value);
                          }
                        }}
                        className="mt-1 w-full min-h-[200px] p-2 border rounded-md"
                        placeholder="Write your post content..."
                        maxLength={MAX_CONTENT_LENGTH}
                      />
                      <span
                        className={`absolute right-2 bottom-2 text-sm ${
                          content.length === MAX_CONTENT_LENGTH
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {content.length}/{MAX_CONTENT_LENGTH}
                      </span>
                    </div>
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
                            Accepted formats: JPEG, PNG, GIF, WebP (Max size:
                            10MB)
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
                        <div className="relative">
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
                      </div>
                    )}
                  </div>

                  {/* Tags Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <p className="w-full text-sm text-gray-500">
                        Select sport type:
                      </p>
                      {sportEmojis.map((item) => (
                        <button
                          key={item.sport}
                          type="button"
                          onClick={() => setTags([item.sport])}
                          className={`p-2 rounded-full text-xl hover:bg-gray-100 ${
                            tags.includes(item.sport) ? "bg-blue-100" : ""
                          }`}
                          title={item.sport}
                        >
                          {item.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bets Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bets
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {bets.map((bet) => (
                        <div
                          key={bet}
                          className="flex items-center gap-1 bg-[#4e43ff]/10 px-3 py-1 rounded-full"
                        >
                          <span className="text-[#4e43ff]">{bet}</span>
                          <button
                            onClick={() => handleRemoveBet(bet)}
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
                        value={newBet}
                        onChange={(e) => setNewBet(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddBet()}
                        placeholder="Add a bet..."
                        className="flex-1 p-2 border rounded-md"
                      />
                      <Button onClick={handleAddBet}>Add Bet</Button>
                    </div>
                  </div>

                  {/* Odds Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Odds ({odds.length}/{MAX_ODDS})
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {odds.map((odd) => (
                        <div
                          key={odd}
                          className="flex items-center gap-1 bg-[#4e43ff]/10 px-3 py-1 rounded-full"
                        >
                          <span className="text-[#4e43ff]">{odd}</span>
                          <button
                            onClick={() => handleRemoveOdd(odd)}
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
                        value={newOdd}
                        onChange={handleOddChange}
                        onKeyPress={(e) => {
                          // Allow only numbers, decimal point, and Enter key
                          if (!/[\d.]/.test(e.key) && e.key !== "Enter") {
                            e.preventDefault();
                          }
                          if (e.key === "Enter") {
                            handleAddOdd();
                          }
                        }}
                        placeholder="Add odds (e.g., 1.5, 2)"
                        className="flex-1 p-2 border rounded-md"
                        disabled={odds.length >= MAX_ODDS}
                      />
                      <Button
                        onClick={handleAddOdd}
                        disabled={odds.length >= MAX_ODDS}
                      >
                        Add Odds
                      </Button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="px-8 py-6 text-lg bg-[#4e43ff] hover:bg-[#4e43ff]/90"
                    >
                      Create Post
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Preview Your Post</CardTitle>
                <CardDescription>
                  This is how your post will appear to other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Post
                  _id="preview"
                  title={title}
                  content={content}
                  imageUrl={imagePreview || ""}
                  odds={odds}
                  bets={bets}
                  tags={tags}
                  capperId="preview"
                  productId={selectedProduct}
                  createdAt={new Date().toISOString()}
                  updatedAt={new Date().toISOString()}
                  capperInfo={{
                    firstName: user?.firstName || "",
                    lastName: user?.lastName || "",
                    username: localStorage.getItem("userName") || "",
                    isVerified: false,
                    profileImage: profileImage,
                  }}
                  fallbackImage={
                    !imagePreview && tags.length > 0
                      ? {
                          emoji:
                            sportEmojis.find((item) => item.sport === tags[0])
                              ?.emoji || "⚽",
                          profileImage: profileImage,
                        }
                      : undefined
                  }
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
