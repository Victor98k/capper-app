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
  ChevronDown,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Add type for product
interface Product {
  id: string;
  name: string;
  description?: string;
}

const MAX_TITLE_LENGTH = 60;
const MAX_CONTENT_LENGTH = 5000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MAX_ODDS = 1;
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

// First, let's extract the Welcome UI into a separate component
const WelcomeUI = ({ router }: { router: any }) => (
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
                Welcome to <span className="text-[#4e43ff]">CapperSports</span>
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
              account to Stripe. This allows you to receive payments from your
              subscribers.
            </p>
            <div className="flex gap-4">
              <Link
                href="/home-capper"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#4e43ff] hover:bg-[#4e43ff]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4e43ff] transform transition-all hover:scale-105"
              >
                Connect Stripe Account
              </Link>
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

// Add this helper component near the top of the file
const LabelWithTooltip = ({
  label,
  tooltip,
  required = false,
}: {
  label: string;
  tooltip: string;
  required?: boolean;
}) => (
  <div className="flex items-center gap-2 mb-2">
    <label className="block text-sm font-medium text-white">{label}</label>
    {required && <span className="text-red-500">*</span>}
    <span className="text-xs text-gray-400 italic">({tooltip})</span>
  </div>
);

function NewPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [previewText, setPreviewText] = useState("");
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
  const [betUnits, setBetUnits] = useState<string>("");
  const [newBetUnits, setNewBetUnits] = useState<string>("");
  const [postTemplate, setPostTemplate] = useState<"text-only" | "live-bet">(
    "text-only"
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  // const [crop, setCrop] = useState({ x: 0, y: 0 });
  // const [zoom, setZoom] = useState(1);
  // const [showCropper, setShowCropper] = useState(false);
  // const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Add a useEffect to check Stripe status
  const [stripeStatus, setStripeStatus] = useState<{
    onboarded: boolean;
  } | null>(null);
  const [checkingStripeStatus, setCheckingStripeStatus] = useState(true);

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
        description: "You can only add one odd per post",
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
      setOdds([trimmedOdd]); // Replace existing odds instead of adding
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
      // If the value is valid, set it directly as the odd
      if (isValidOdd(value)) {
        setOdds([value]);
      } else if (value === "") {
        setOdds([]);
      }
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
    setIsLoading(true); // Start loading

    try {
      // Validate required fields first
      if (
        !title ||
        !tags.length ||
        !bets.length ||
        !odds.length ||
        !betDate ||
        !oddsScreenshot ||
        (postTemplate !== "live-bet" && !content)
      ) {
        toast.error("Please fill in all required fields", {
          description:
            "All fields are required including the odds screenshot for verification" +
            (postTemplate !== "live-bet" ? " and analysis/content" : ""),
        });
        setIsLoading(false); // Stop loading on error
        return;
      }

      // Create the request body
      const postData = {
        title,
        content: postTemplate === "live-bet" ? content || "" : content,
        previewText, // <-- add this
        tags,
        bets,
        odds,
        units: betUnits,
        bookmaker: selectedBookmaker,
        username: localStorage.getItem("username"),
        productId: selectedProduct, // This can now be blank if not selected
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
      if (image && postTemplate === "text-only") {
        try {
          console.log("=== Client Upload Configuration ===");
          console.log("Upload Configuration:", {
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          });

          const formData = new FormData();
          formData.append("file", image);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

          const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
          console.log("Upload URL:", uploadUrl);

          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.error("Upload Error Details:", {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              errorData,
            });
            throw new Error(
              errorData.error?.message || "Failed to upload image"
            );
          }

          const uploadData = await uploadResponse.json();
          console.log("Upload Success:", {
            url: uploadData.secure_url,
            publicId: uploadData.public_id,
          });
          postData.imageUrl = uploadData.secure_url;
        } catch (error) {
          console.error("Upload Error:", error);
          toast.error("Failed to upload image", {
            description:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
          setIsLoading(false); // Stop loading on error
          return;
        }
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
        setIsLoading(false); // Stop loading on error
        return;
      }

      const newPost = await response.json();
      console.log("Created post:", newPost);

      // Send email notifications to subscribers
      await fetch("/api/email/new-post-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capperId: newPost.capperId,
          postId: newPost.id,
          postTitle: title,
          postPreview: content.substring(0, 200) + "...",
        }),
      });

      // Show success toast
      toast.success("Post created successfully!", {
        description:
          "Your post has been published and subscribers have been notified",
        duration: 5000,
      });

      // Optional: Clear the form after successful submission
      setTitle("");
      setContent("");
      setTags([]);
      setBets([]);
      setOdds([]);
      setBetUnits("");
      setSelectedBookmaker("");
      setImage(null);
      setImagePreview(null);
      setOddsScreenshot(null);
      setOddsScreenshotPreview(null);
      setBetDate(new Date().toISOString().split("T")[0]);
      setPostTemplate("text-only");
      setIsLoading(false); // Stop loading on success
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
      setIsLoading(false); // Stop loading on error
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
    { emoji: "🏎️", sport: "F1" },
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

  const handleBetUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (
      value === "" ||
      (/^\d*\.?\d{0,1}$/.test(value) &&
        parseFloat(value) >= 0.5 &&
        parseFloat(value) <= 10)
    ) {
      setBetUnits(value);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    // Find the selected product's name
    const product = products.find((p) => p.id === productId);
    setSelectedProductName(product?.name || "");
  };

  useEffect(() => {
    const checkStripeStatus = async () => {
      if (user?.isCapper) {
        try {
          const response = await fetch("/api/stripe/connect", {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Failed to fetch Stripe status");
          }

          const data = await response.json();
          setStripeStatus(data);
        } catch (error) {
          console.error("Error checking Stripe status:", error);
        }
      }
      setCheckingStripeStatus(false);
    };

    checkStripeStatus();
  }, [user?.isCapper]);

  // Add effect to auto-set betDate if template is live-bet
  useEffect(() => {
    if (postTemplate === "live-bet") {
      setBetDate(new Date().toISOString().split("T")[0]);
    }
  }, [postTemplate]);

  // Show loading state while checking status
  if (loading || checkingStripeStatus) {
    return (
      <div className="flex min-h-screen bg-[#020817]">
        <SideNav />
        <div className="flex-1">
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  // Redirect non-cappers to home
  if (!user?.isCapper) {
    router.push("/home");
    return null;
  }

  // Only show WelcomeUI if we've confirmed the user is not connected to Stripe
  if (stripeStatus !== null && !stripeStatus.onboarded) {
    return <WelcomeUI router={router} />;
  }

  // Only render the main UI if we've confirmed the user is connected to Stripe
  if (stripeStatus?.onboarded) {
    return (
      <>
        {/* Mobile Top Nav */}
        <div className="lg:hidden sticky top-0 z-50 w-full bg-[#020817] p-4 flex items-center">
          <div className="absolute left-4">
            <SideNav />
          </div>
          <div className="flex-1 text-right pr-4">
            <h2 className="text-xl font-semibold">Create Post</h2>
          </div>
        </div>
        <div className="flex min-h-screen bg-[#020817] overflow-x-hidden">
          {/* Desktop SideNav - Hidden on mobile */}
          <div className="hidden lg:block fixed top-0 left-0 h-screen">
            <SideNav />
          </div>

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

          {/* Main content with responsive margin */}
          <div className="flex-1 w-full lg:ml-[300px] px-4 lg:px-8">
            <main className="w-full py-6">
              <div className="max-w-7xl mx-auto">
                <Card className="mb-6 bg-[#020817] border border-[#4e43ff]/20">
                  <CardHeader>
                    <CardTitle className="text-4xl font-bold text-white">
                      Create a New Post
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Share your insights and predictions with your subscribers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-8">
                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-[#4e43ff]/10 rounded-lg">
                          <h3 className="text-lg font-semibold text-[#4e43ff]">
                            Tips for a Great Post
                          </h3>
                          <ChevronDown className="h-5 w-5 text-[#4e43ff] transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ul className="list-disc list-inside space-y-2 text-sm text-gray-300 p-4 bg-[#4e43ff]/5 mt-2 rounded-lg">
                            <li>
                              Be specific with your predictions and analysis
                            </li>
                            <li>
                              Include relevant statistics to support your picks
                            </li>
                            <li>
                              Always upload clear odds screenshots for
                              verification
                            </li>
                            <li>
                              Use appropriate units (0.5-10) to indicate
                              confidence
                            </li>
                            <li>
                              Double-check all information before posting -
                              posts cannot be edited after submission
                            </li>
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>

                    <div className="space-y-10">
                      {/* Template Selector */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Post Template"
                          tooltip="Choose how your post will be displayed to users"
                          required
                        />
                        <div className="flex gap-4">
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-lg font-semibold border transition-all focus:outline-none ${
                              postTemplate === "text-only"
                                ? "bg-[#4e43ff] text-white border-[#4e43ff] shadow-lg"
                                : "bg-[#1a1a1a] text-gray-300 border-[#4e43ff]/20 hover:bg-[#4e43ff]/10"
                            }`}
                            onClick={() => setPostTemplate("text-only")}
                          >
                            Text Only
                          </button>
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-lg font-semibold border transition-all focus:outline-none ${
                              postTemplate === "live-bet"
                                ? "bg-red-600 text-white border-red-600 shadow-lg animate-pulse"
                                : "bg-[#1a1a1a] text-gray-300 border-[#4e43ff]/20 hover:bg-red-600/10"
                            }`}
                            onClick={() => setPostTemplate("live-bet")}
                          >
                            LIVE Bet
                          </button>
                        </div>
                      </div>

                      {/* Bundle Selection */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Select Bundle"
                          tooltip="Choose which subscription bundle this post belongs to (optional)"
                          // required
                        />
                        <Select
                          value={selectedProduct}
                          onValueChange={handleProductSelect}
                          // required
                        >
                          <SelectTrigger className="bg-[#1a1a1a] border-[#4e43ff]/20 text-white">
                            <SelectValue placeholder="Select a bundle" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-[#4e43ff]/20">
                            {products.map((product) => (
                              <SelectItem
                                key={product.id}
                                value={product.id}
                                className="text-white hover:bg-[#4e43ff]/10"
                              >
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Title Input */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Title"
                          tooltip="The title of your post"
                          required
                        />
                        <div className="relative">
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                              if (e.target.value.length <= MAX_TITLE_LENGTH) {
                                setTitle(e.target.value);
                              }
                            }}
                            className="mt-1 w-full p-2 border rounded-md bg-[#1a1a1a] border-[#4e43ff]/20 text-white placeholder-gray-400"
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

                      {/* Preview/Teaser Text Section */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Preview/Teaser Text (optional)"
                          tooltip="Write a short teaser to get readers interested. If left blank, the start of your analysis will be shown."
                        />
                        <div className="relative">
                          <textarea
                            value={previewText}
                            onChange={(e) => setPreviewText(e.target.value)}
                            className="mt-1 w-full min-h-[60px] p-2 border rounded-md bg-[#1a1a1a] border-[#4e43ff]/20 text-white placeholder-gray-400"
                            placeholder="Write a short teaser or preview for your post (optional)..."
                            maxLength={200}
                          />
                          <span
                            className={`absolute right-2 bottom-2 text-sm ${
                              previewText.length === 200
                                ? "text-red-500"
                                : "text-gray-400"
                            }`}
                          >
                            {previewText.length}/200
                          </span>
                        </div>
                      </div>

                      {/* Content Input */}
                      {postTemplate !== "live-bet" && (
                        <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                          <LabelWithTooltip
                            label="Analysis"
                            tooltip="Provide detailed analysis and reasoning for your picks. If you do not write a Preview/Teaser Text, the beginning of this analysis will be shown as the post preview."
                            required
                          />
                          <div className="relative">
                            <textarea
                              value={content}
                              onChange={(e) => {
                                if (
                                  e.target.value.length <= MAX_CONTENT_LENGTH
                                ) {
                                  setContent(e.target.value);
                                }
                              }}
                              className="mt-1 w-full min-h-[200px] p-2 border rounded-md bg-[#1a1a1a] border-[#4e43ff]/20 text-white placeholder-gray-400"
                              placeholder="Write your analysis here... If you do not provide a Preview/Teaser Text, the start of this analysis will be shown as the post preview."
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
                      )}

                      {/* Tags Section */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Tags"
                          tooltip="Select the primary sport for this prediction"
                          required
                        />
                        <div className="flex flex-wrap gap-2 mb-4">
                          <p className="w-full text-sm text-gray-400 mb-2">
                            Select sport type:
                          </p>
                          {sportEmojis.map((item) => (
                            <button
                              key={item.sport}
                              type="button"
                              onClick={() => setTags([item.sport])}
                              className={`relative p-2 rounded-full text-xl hover:bg-[#4e43ff]/10 ${
                                tags.includes(item.sport)
                                  ? "bg-[#4e43ff]/20"
                                  : ""
                              } group`}
                            >
                              {item.emoji}
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-[#1a1a1a] border border-[#4e43ff]/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                {item.sport}
                              </span>
                            </button>
                          ))}
                        </div>
                        {tags.length === 0 && (
                          <p className="text-sm text-red-500">
                            Please select a sport
                          </p>
                        )}
                      </div>

                      {/* Bets Section */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Bets"
                          tooltip="Enter specific betting selections (e.g., 'Manchester United to win')"
                          required
                        />
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
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleAddBet()
                            }
                            placeholder="Add a bet..."
                            className="flex-1 p-2 border rounded-md bg-[#1a1a1a] border-[#4e43ff]/20 text-white placeholder-gray-400"
                          />
                          <Button onClick={handleAddBet}>Add Bet</Button>
                        </div>
                      </div>

                      {/* Units Section */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Units"
                          tooltip="Enter bet units between 0.5 and 10"
                          required
                        />
                        <div className="mt-2">
                          <input
                            type="number"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={betUnits}
                            onChange={handleBetUnitsChange}
                            onKeyPress={(e) => {
                              if (!/[\d.]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            placeholder="Enter units (0.5-10)"
                            className="w-full p-2 border rounded-md bg-[#1a1a1a] border-[#4e43ff]/20 text-white placeholder-gray-400"
                          />
                          {(betUnits === "" ||
                            parseFloat(betUnits) < 0.5 ||
                            parseFloat(betUnits) > 10) && (
                            <p className="text-sm text-red-500 mt-1">
                              Please enter a value between 0.5 and 10 units
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Odds Section */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label={`Odds`}
                          tooltip="Enter decimal odds (e.g., 1.87, 2.25)"
                          required
                        />
                        <div className="mt-2">
                          <input
                            type="text"
                            value={newOdd}
                            onChange={handleOddChange}
                            onKeyPress={(e) => {
                              if (!/[\d.]/.test(e.key) && e.key !== "Enter") {
                                e.preventDefault();
                              }
                            }}
                            placeholder="Add odds (e.g., 1.87, 2.25)"
                            className="w-full p-2 border rounded-md bg-[#1a1a1a] border-[#4e43ff]/20 text-white placeholder-gray-400"
                          />
                          {!isValidOdd(newOdd) && newOdd !== "" && (
                            <p className="text-sm text-red-500 mt-1">
                              Please enter valid odds (e.g., 1.87, 2.25)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Odds Screenshot Section */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Odds Screenshot"
                          tooltip="Upload a clear screenshot showing the odds from your bookmaker"
                          required
                        />
                        <div className="mt-2">
                          {!oddsScreenshotPreview ? (
                            <div
                              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all hover:border-[#4e43ff]`}
                              onClick={() =>
                                document
                                  .getElementById("oddsScreenshot")
                                  ?.click()
                              }
                            >
                              <input
                                id="oddsScreenshot"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleOddsScreenshotChange}
                              />
                              <div className="flex flex-col items-center gap-2">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                <div className="text-sm text-gray-500">
                                  Upload a screenshot of your odds (required)
                                </div>
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
                        {!oddsScreenshot && (
                          <p className="text-sm text-red-500">
                            Please upload a screenshot of your odds for
                            verification
                          </p>
                        )}
                      </div>

                      {/* Bet Placement Date */}
                      {postTemplate !== "live-bet" && (
                        <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                          <LabelWithTooltip
                            label="Bet Placement Date"
                            tooltip="When did you place this bet? Cannot be in the future"
                            required
                          />
                          <div className="mt-2">
                            <input
                              type="date"
                              value={betDate}
                              onChange={(e) => setBetDate(e.target.value)}
                              className="w-full p-2 border rounded-md bg-[#1a1a1a] border-[#4e43ff]/20 text-white"
                              max={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                        </div>
                      )}

                      {/* Bookmaker Section */}
                      <div className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
                        <LabelWithTooltip
                          label="Bookmaker"
                          tooltip="Select the betting site where you placed this bet (optional)"
                        />
                        <Select
                          value={selectedBookmaker}
                          onValueChange={setSelectedBookmaker}
                        >
                          <SelectTrigger className="bg-[#1a1a1a] border-[#4e43ff]/20 text-white">
                            <SelectValue placeholder="Select bookmaker (optional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-[#4e43ff]/20">
                            {BOOKMAKERS.map((bookmaker) => (
                              <SelectItem
                                key={bookmaker}
                                value={bookmaker}
                                className="text-white hover:bg-[#4e43ff]/10"
                              >
                                {bookmaker}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-2 pt-8">
                        {/* <Button
                          variant="outline"
                          onClick={() => setShowConfirmDialog(false)}
                        >
                          Cancel
                        </Button> */}
                        <Button
                          onClick={handleSubmit}
                          className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader /> : "Confirm & Submit"}
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
                                  <li>
                                    Posts cannot be deleted once published
                                  </li>
                                  <li>
                                    If changes are needed, you must contact
                                    customer support
                                  </li>
                                  <li>
                                    All posts are subject to our content
                                    guidelines
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
                <Card className="mt-6 w-full overflow-hidden bg-[#020817] border border-[#4e43ff]/20">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Preview Your Post
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      This is how your post will appear to other users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-hidden">
                    <Post
                      _id="preview"
                      title={title}
                      content={content}
                      previewText={previewText}
                      imageUrl={imagePreview || ""}
                      odds={odds}
                      bets={bets}
                      tags={tags}
                      capperId="preview"
                      productId={selectedProduct}
                      productName={selectedProductName}
                      createdAt={new Date().toISOString()}
                      updatedAt={new Date().toISOString()}
                      template={postTemplate as "text-only" | "live-bet"}
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
                                sportEmojis.find(
                                  (item) => item.sport === tags[0]
                                )?.emoji || "⚽",
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
      </>
    );
  }
}

export default NewPostPage;
