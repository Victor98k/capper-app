"use client";

import { useState, useCallback, useEffect } from "react";
import { SideNav } from "@/components/SideNavCappers";
import capperLogo from "@/images/Cappers Logga (1).svg";
import { startStripeOnboarding } from "@/components/StripeConnectOnboarding";
import {
  Bell,
  MessageSquare,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";

import Post from "@/components/Posts";
import CapperDashboard from "@/components/capperDashboard";
// import Cropper from "react-easy-crop";
import { toast, Toaster } from "sonner";
import Loader from "@/components/Loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";

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
const BOOKMAKERS = [
  "Bet365",
  "Betfair",
  "Oddset",
  "Betsson",
  "William Hill",
  "Unibet",
  "Betway",
  "888sport",
  "Ladbrokes",
  "Coral",
  "Paddy Power",
  "Other",
] as const;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "capper_posts";
const CLOUDINARY_UPLOAD_PRESET_BETS =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_BETS_VERIFICATION ||
  "bet_validation";

const isValidOdd = (odd: string): boolean => {
  const number = parseFloat(odd);
  return !isNaN(number) && number >= 1 && /^\d+(\.\d{0,2})?$/.test(odd);
};

// First, add a function to convert the file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
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
  const [selectedProductName, setSelectedProductName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>("");
  const [oddsScreenshot, setOddsScreenshot] = useState<File | null>(null);
  const [oddsScreenshotPreview, setOddsScreenshotPreview] = useState<
    string | null
  >(null);
  const [betDate, setBetDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [betUnits, setBetUnits] = useState<string>("1"); // Default to 1 unit
  const [newBetUnits, setNewBetUnits] = useState<string>("1"); // Default to 1 unit
  const [postTemplate, setPostTemplate] = useState<"standard" | "text-only">(
    "standard"
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
          "Odds must be 1 or greater with up to 2 decimal places (e.g., 1.87, 2.25)",
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
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setNewOdd(value);
    }
  };

  const handleOddsScreenshotChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image too large", {
        description: "Please select an image under 10MB",
      });
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description:
          "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
      });
      return;
    }

    setOddsScreenshot(file);
    const previewUrl = URL.createObjectURL(file);
    setOddsScreenshotPreview(previewUrl);
  };

  const handleCreatePostClick = () => {
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    setShowConfirmDialog(false);

    try {
      // Validate required fields first
      if (!title || !content || !selectedProduct) {
        toast.error("Please fill in all required fields", {
          description: "Title, content, and bundle selection are required",
        });
        return;
      }

      // Create the request body
      const postData = {
        title,
        content,
        tags,
        bets,
        odds,
        units: betUnits,
        bookmaker: selectedBookmaker,
        username: localStorage.getItem("username"),
        productId: selectedProduct,
        template: postTemplate,
        imageUrl: null, // Will be updated if image is uploaded
        productName: selectedProductName,
        betDate,
        oddsScreenshot: null, // Will be updated if screenshot exists
      };

      // If we have an odds screenshot, upload it first with the BETS preset
      if (oddsScreenshot) {
        const formData = new FormData();
        formData.append("file", oddsScreenshot);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET_BETS);

        // Log the actual URL being used
        const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          console.error("Upload error response:", error);
          throw new Error(
            error.error?.message || "Failed to upload odds screenshot"
          );
        }

        const uploadData = await uploadResponse.json();
        postData.oddsScreenshot = uploadData.secure_url;
      }

      // If we have a post image, upload it with the POSTS preset
      if (image && postTemplate === "standard") {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); // Use capper_posts preset

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error?.message || "Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        postData.imageUrl = uploadData.secure_url;
      }

      // Send the post data as JSON
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error("Failed to create post", {
          description: error.error || "Something went wrong",
        });
        return;
      }

      await response.json();

      // Show success toast instead of redirecting
      toast.success("Post created successfully!", {
        description:
          "Your post has been published and is now visible to subscribers",
        duration: 5000, // Show for 5 seconds
      });

      // Optional: Clear the form after successful submission
      setTitle("");
      setContent("");
      setTags([]);
      setBets([]);
      setOdds([]);
      setBetUnits("1");
      setSelectedBookmaker("");
      setImage(null);
      setImagePreview(null);
      setOddsScreenshot(null);
      setOddsScreenshotPreview(null);
      setBetDate(new Date().toISOString().split("T")[0]);
      setPostTemplate("standard");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };

  const sportEmojis = [
    { emoji: "⚽", sport: "Football" },
    { emoji: "🏀", sport: "Basketball" },
    { emoji: "🎾", sport: "Tennis" },
    { emoji: "🏈", sport: "American Football" },
    { emoji: "🥊", sport: "MMA" },
    { emoji: "⚾", sport: "Baseball" },
    { emoji: "🏒", sport: "Ice Hockey" },
    { emoji: "⛳", sport: "Golf" },
    { emoji: "🥊", sport: "Boxing" },
    { emoji: "🏎️", sport: "Formula 1" },
    { emoji: "🏇", sport: "Horse Racing" },
    { emoji: "🎮", sport: "E-Sports" },
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

  const handleAddUnits = () => {
    if (parseFloat(newBetUnits) >= 0.5) {
      setBetUnits(newBetUnits);
      setNewBetUnits("1");
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    // Find the selected product's name
    const product = products.find((p) => p.id === productId);
    setSelectedProductName(product?.name || "");
  };

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

  // Add this check for Stripe connection
  if (!user.stripeConnectOnboarded) {
    return (
      <div className="flex min-h-screen bg-[#020817]">
        <SideNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full px-4">
            <Card className="bg-[#020817] border border-[#4e43ff]/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 text-center">
                  <span className="inline-flex items-center">
                    <img
                      src={capperLogo.src}
                      alt="Cappers Logo"
                      className="h-16 md:h-20 lg:h-24"
                    />
                  </span>
                </h1>
                <div className="rounded-full bg-[#4e43ff]/10 p-4 mb-6 animate-pulse">
                  <Settings className="h-8 w-8 text-[#4e43ff]" />
                </div>
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome to{" "}
                    <span className="text-[#4e43ff]">CapperSports</span>
                  </h2>
                  <p className="text-lg text-gray-300">
                    We're excited to have you as a new capper
                  </p>
                </div>
                <h3 className="text-xl text-gray-300 mb-4 text-center">
                  Let's Set Up Your Payment Account
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="rounded-full bg-[#4e43ff]/10 p-2">
                      <Bell className="h-5 w-5 text-[#4e43ff]" />
                    </div>
                    <p>Receive instant notifications for new subscribers</p>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="rounded-full bg-[#4e43ff]/10 p-2">
                      <MessageSquare className="h-5 w-5 text-[#4e43ff]" />
                    </div>
                    <p>Start earning from your betting insights</p>
                  </div>
                </div>
                <p className="text-gray-400 text-center max-w-md mb-8">
                  Before you can start creating posts, you need to connect your
                  account to Stripe. This allows you to receive payments from
                  your subscribers.
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={startStripeOnboarding}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#4e43ff] hover:bg-[#4e43ff]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4e43ff] transform transition-all hover:scale-105"
                  >
                    Connect Stripe Account
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 py-3 border-[#4e43ff] text-[#4e43ff] hover:bg-[#4e43ff]/5"
                    onClick={() => router.push("/home")}
                  >
                    Go Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
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
                    <Label>Post Template</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          postTemplate === "standard"
                            ? "border-[#4e43ff] bg-[#4e43ff]/10"
                            : "border-gray-700 hover:border-[#4e43ff]/50"
                        }`}
                        onClick={() => setPostTemplate("standard")}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Image
                            src={capperLogo}
                            alt="Capper Logo"
                            width={20}
                            height={20}
                            className="h-5 w-5"
                          />
                          <span className="font-medium">Standard Post</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Include an image with your post
                        </p>
                      </div>

                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          postTemplate === "text-only"
                            ? "border-[#4e43ff] bg-[#4e43ff]/10"
                            : "border-gray-700 hover:border-[#4e43ff]/50"
                        }`}
                        onClick={() => setPostTemplate("text-only")}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-5 w-5" />
                          <span className="font-medium">Text Only</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Focus on your analysis without images
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add Bundle Selection */}
                  <div className="space-y-2">
                    <Label>Select Bundle</Label>
                    <Select
                      value={selectedProduct}
                      onValueChange={handleProductSelect}
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

                  {/* Show image upload only for standard template */}
                  {postTemplate === "standard" && (
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
                  )}

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
                          className={`relative p-2 rounded-full text-xl hover:bg-gray-100 ${
                            tags.includes(item.sport) ? "bg-blue-100" : ""
                          } group`}
                        >
                          {item.emoji}
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {item.sport}
                          </span>
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

                  {/* Units Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Units
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {betUnits !== "1" && (
                        <div className="flex items-center gap-1 bg-[#4e43ff]/10 px-3 py-1 rounded-full">
                          <span className="text-[#4e43ff]">
                            {betUnits} units
                          </span>
                          <button
                            onClick={() => setBetUnits("1")}
                            className="text-[#4e43ff]/70 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={newBetUnits}
                        onChange={(e) => setNewBetUnits(e.target.value)}
                        onKeyPress={(e) => {
                          // Allow only numbers, decimal point, and Enter key
                          if (!/[\d.]/.test(e.key) && e.key !== "Enter") {
                            e.preventDefault();
                          }
                          if (e.key === "Enter") {
                            handleAddUnits();
                          }
                        }}
                        placeholder="Enter units (e.g., 1, 2.5)"
                        className="flex-1 p-2 border rounded-md"
                      />
                      <Button onClick={handleAddUnits}>Set Units</Button>
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
                        placeholder="Add odds (e.g., 1.87, 2.25)"
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

                  {/* Odds Screenshot Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Odds Screenshot (for validation)
                    </label>
                    <div className="mt-2">
                      {!oddsScreenshotPreview ? (
                        <div
                          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-[#4e43ff]"
                          onClick={() =>
                            document.getElementById("oddsScreenshot")?.click()
                          }
                        >
                          <input
                            id="oddsScreenshot"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleOddsScreenshotChange}
                          />
                          <div className="text-sm text-gray-500">
                            Upload a screenshot of your odds
                          </div>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <img
                            src={oddsScreenshotPreview}
                            alt="Odds screenshot"
                            className="max-w-xs h-auto rounded-md"
                          />
                          <button
                            onClick={() => {
                              setOddsScreenshot(null);
                              setOddsScreenshotPreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bet Placement Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bet Placement Date
                    </label>
                    <div className="mt-2">
                      <input
                        type="date"
                        value={betDate}
                        onChange={(e) => setBetDate(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>

                  {/* Bookmaker Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bookmaker
                    </label>
                    <Select
                      value={selectedBookmaker}
                      onValueChange={setSelectedBookmaker}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select bookmaker (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOKMAKERS.map((bookmaker) => (
                          <SelectItem key={bookmaker} value={bookmaker}>
                            {bookmaker}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePostClick}
                      className="px-8 py-6 text-lg bg-[#4e43ff] hover:bg-[#4e43ff]/90"
                    >
                      Create Post
                    </Button>
                    <Dialog
                      open={showConfirmDialog}
                      onOpenChange={setShowConfirmDialog}
                    >
                      <DialogContent className="border-[#4e43ff]/20 bg-[#020817]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-[#4e43ff]">
                            Confirm Post Submission
                          </DialogTitle>
                          <DialogDescription className="text-white/80">
                            Please review these important details before
                            submitting:
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                              <li>Posts cannot be deleted once published</li>
                              <li>
                                If changes are needed, you must contact customer
                                support
                              </li>
                              <li>
                                All posts are subject to our content guidelines
                              </li>
                            </ul>
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            className="border-[#4e43ff] text-white hover:bg-[#4e43ff]/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                          >
                            Confirm & Submit
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
                  productName={selectedProductName}
                  createdAt={new Date().toISOString()}
                  updatedAt={new Date().toISOString()}
                  template={postTemplate}
                  capperInfo={{
                    firstName: user?.firstName || "",
                    lastName: user?.lastName || "",
                    username: localStorage.getItem("username") || "",
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
