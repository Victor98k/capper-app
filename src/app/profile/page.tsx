"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Cropper from "react-easy-crop";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DisplayCapperCard from "@/components/displayCapperCard";
import { SideNav } from "@/components/SideNavCappers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Toaster } from "sonner";
import { toast } from "sonner";
import Loader from "@/components/Loader";
import { Input } from "@/components/ui/input";
import {
  Instagram,
  Twitter,
  Youtube,
  MessageSquare,
  Phone,
} from "lucide-react";

// Add this at the top of your file with other imports
const sportEmojiMap: { [key: string]: string } = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  "American Football": "🏈",
  Baseball: "⚾",
  Soccer: "⚽",
  "E-Sports": "🎮",
  Hockey: "🏒",
  Golf: "🏌️‍♂️",
  MMA: "🥊",
  Boxing: "🥊",
};

// Create a separate component for the parts that use useSearchParams
function CapperProfileContent() {
  // 1. First all the context hooks
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 2. All useState hooks together
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [stripeStatus, setStripeStatus] = useState({
    isOnboarded: false,
    isLoading: true,
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [capperData, setCapperData] = useState<any>(null);
  const [socials, setSocials] = useState({
    instagram: { username: "", url: "" },
    x: { username: "", url: "" },
    discord: { username: "", url: "" },
    whatsapp: { username: "", url: "" },
    youtube: { username: "", url: "" },
  });
  const [isEditingSocials, setIsEditingSocials] = useState(false);

  // 3. All useCallback hooks together
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
      setProfileImage(file);
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreview(previewUrl);
    }
  }, []);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Add searchParams to check for success parameter
  const success = searchParams.get("success");

  // 4. All useEffect hooks together
  useEffect(() => {
    if (user?.isCapper) {
      checkStripeStatus();
    }
  }, [user]);

  useEffect(() => {
    if (success === "true" && user?.isCapper) {
      checkStripeStatus();
    }
  }, [success, user]);

  useEffect(() => {
    const fetchCapperProfile = async () => {
      if (user?.id) {
        try {
          const token = localStorage.getItem("token");

          const response = await fetch("/api/cappers", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch profile data");
          }

          const data = await response.json();

          const capperData = data.find((c: any) => c.userId === user.id);

          if (capperData) {
            setCapperData(capperData);
            setBio(capperData.bio || "");
            setTags(capperData.tags || []);
            setUsername(capperData.user?.username || "");

            // Initialize socials with existing data
            const socialLinks = capperData.socialLinks || {};

            const initialSocials = {
              instagram: socialLinks.instagram || { username: "", url: "" },
              x: socialLinks.x || { username: "", url: "" },
              discord: socialLinks.discord || { username: "", url: "" },
              whatsapp: socialLinks.whatsapp || { username: "", url: "" },
              youtube: socialLinks.youtube || { username: "", url: "" },
            };

            setSocials(initialSocials);
          }
        } catch (error) {
          console.error("Failed to fetch capper profile:", error);
        }
      }
    };

    fetchCapperProfile();
  }, [user?.id]);

  // Regular function handlers can go after the hooks
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreview(previewUrl);
      setShowCropper(true);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const handleProfileImageUpdate = async () => {
    try {
      if (!profileImage || !user?.id) return;

      const formData = new FormData();
      formData.append("file", profileImage);
      formData.append("upload_preset", "capperProfilePic"); // This will work after enabling unsigned uploads

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json();
        console.error("Cloudinary error:", errorData);
        throw new Error("Failed to upload image to Cloudinary");
      }

      const cloudinaryData = await cloudinaryResponse.json();

      // Now update the user profile with the Cloudinary URL
      const response = await fetch("/api/cappers/profile-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          imageUrl: cloudinaryData.secure_url,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile image");
      }

      const data = await response.json();

      // Update the preview with the new image URL
      setProfileImagePreview(cloudinaryData.secure_url);

      // Update capperData with new image URL
      setCapperData((prev: any) => ({
        ...prev,
        profileImage: cloudinaryData.secure_url,
      }));

      // Clear the file input
      setProfileImage(null);

      // Show success toast
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Failed to update profile image:", error);
      toast.error("Failed to update profile image. Please try again.");
    }
  };

  // Modify the checkStripeStatus function to be reusable
  const checkStripeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/stripe/connect", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setStripeStatus({
        isOnboarded: data.onboarded || false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error);
      setStripeStatus({
        isOnboarded: false,
        isLoading: false,
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <div className="hidden lg:block">
          <SideNav />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  // Redirect non-cappers
  if (!user?.isCapper) {
    router.push("/home");
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        localStorage.clear(); // Only clear localStorage in browser environment
      }
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleBioUpdate = async () => {
    try {
      if (!user?.id) return;

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/cappers`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          bio: bio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update bio");
      }

      const data = await response.json();

      // Extract the updated bio from the response if available
      if (data && "bio" in data) {
        setBio(data.bio);
      }

      // Refetch the entire profile to ensure consistency
      const fetchResponse = await fetch("/api/cappers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const updatedCapperData = fetchData.find(
          (c: any) => c.userId === user.id
        );
        if (updatedCapperData) {
          setBio(updatedCapperData.bio || "");
          setTags(updatedCapperData.tags || []);
          setUsername(updatedCapperData.user?.username || "");
        }
      }

      setIsEditingBio(false);
      toast.success("Bio updated successfully");
    } catch (error) {
      console.error("Failed to update bio:", error);
      toast.error("Failed to update bio. Please try again.");
    }
  };

  const handleAddSport = async () => {
    if (newTag && !tags.includes(newTag)) {
      if (tags.length >= 3) {
        toast.error("You can only have up to 3 sports");
        return;
      }
      // Only allow sports from our sportEmojiMap
      if (sportEmojiMap[newTag]) {
        try {
          const response = await fetch("/api/cappers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user?.id,
              tags: [newTag],
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setTags([...tags, newTag]);
          setNewTag("");
          toast.success(`Added ${sportEmojiMap[newTag]} ${newTag}`);
        } catch (error) {
          console.error("Failed to add sport:", error);
          toast.error("Failed to add sport. Please try again.");
        }
      }
    }
  };

  const handleRemoveSport = async (sport: string) => {
    try {
      const response = await fetch("/api/cappers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          tagToRemove: sport,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTags(tags.filter((tag) => tag !== sport));
      toast.success(`Removed ${sportEmojiMap[sport]} ${sport}`);
    } catch (error) {
      console.error("Failed to remove sport:", error);
      toast.error("Failed to remove sport. Please try again.");
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/cappers/username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          username: username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to update username:", data.error);
        toast.error("Failed to update username. Please try again.");
        return;
      }

      // Update local state
      setUsername(data.user.username);
      setIsEditingUsername(false);
      toast.success("Username updated successfully");
    } catch (error) {
      console.error("Failed to update username:", error);
      toast.error("Failed to update username. Please try again.");
    }
  };

  const createCroppedImage = async () => {
    try {
      if (!profileImagePreview || !croppedAreaPixels) return;

      const canvas = document.createElement("canvas");
      const image = new Image();
      image.src = profileImagePreview;

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/jpeg");
      });

      // Create new file from blob
      const croppedFile = new File([blob], "cropped-profile.jpg", {
        type: "image/jpeg",
      });

      setProfileImage(croppedFile);
      setProfileImagePreview(URL.createObjectURL(croppedFile));
      setShowCropper(false);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const handleSocialsUpdate = async () => {
    try {
      if (!user?.id) return;

      // Create an object with only non-empty social links
      const validSocials = Object.fromEntries(
        Object.entries(socials).map(([platform, data]) => [
          platform,
          data.username || data.url
            ? {
                username: data.username || "",
                url: data.url || "",
              }
            : null,
        ])
      );

      const response = await fetch("/api/cappers/socials", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: user.id,
          socials: validSocials,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update social links");
      }

      const updatedData = await response.json();

      // Update local state with the response data
      if (updatedData.socialLinks) {
        setSocials({
          instagram: updatedData.socialLinks.instagram || {
            username: "",
            url: "",
          },
          x: updatedData.socialLinks.x || { username: "", url: "" },
          discord: updatedData.socialLinks.discord || { username: "", url: "" },
          whatsapp: updatedData.socialLinks.whatsapp || {
            username: "",
            url: "",
          },
          youtube: updatedData.socialLinks.youtube || { username: "", url: "" },
        });
      }

      setIsEditingSocials(false);
      toast.success("Social links updated successfully");
    } catch (error) {
      console.error("Failed to update social links:", error);
      toast.error("Failed to update social links");
    }
  };

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
        <header className="bg-white shadow pl-16 lg:pl-0">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName}
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Your Profile information
            </h2>

            {/* <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Username</CardTitle>
                <CardDescription>
                  This is your unique identifier on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingUsername ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-blue-50"
                      placeholder="Enter new username"
                    />
                    <div className="flex space-x-2">
                      <Button onClick={handleUsernameUpdate}>
                        Save Username
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingUsername(true)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-blue-700 font-semibold">
                      @{username}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingUsername(true)}
                    >
                      Edit Username
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card> */}

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Add or update your profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!profileImagePreview ? (
                  <div
                    className={`w-40 h-40 border-2 border-dashed rounded-full mx-auto relative cursor-pointer transition-colors
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
                      document.getElementById("profileImageInput")?.click()
                    }
                  >
                    {capperData?.profileImage ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={capperData.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full"
                        />
                        {/* Overlay with change photo button */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm">
                            Change Photo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-2">
                        <div className="text-gray-600">
                          <svg
                            className="mx-auto h-8 w-8"
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
                        <div className="flex flex-col items-center text-sm text-gray-600">
                          <span className="relative cursor-pointer rounded-md font-medium text-[#4e43ff] focus-within:outline-none">
                            Click to upload
                          </span>
                          <p className="text-xs">or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      id="profileImageInput"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                ) : (
                  <div className="mt-2 relative">
                    {showCropper ? (
                      <Dialog open={showCropper} onOpenChange={setShowCropper}>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Adjust Profile Picture</DialogTitle>
                          </DialogHeader>
                          <div className="relative w-full h-[400px]">
                            <Cropper
                              image={profileImagePreview || ""}
                              crop={crop}
                              zoom={zoom}
                              aspect={1}
                              onCropChange={setCrop}
                              onZoomChange={setZoom}
                              onCropComplete={onCropComplete}
                              cropShape="round"
                              showGrid={false}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowCropper(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={createCroppedImage}>
                              Save Crop
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="relative w-40 h-40">
                        <img
                          src={profileImagePreview}
                          alt="Profile Preview"
                          className="w-full h-full object-cover rounded-full border-2 border-gray-200"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 w-6 h-6 flex items-center justify-center"
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <Button onClick={handleProfileImageUpdate} className="mt-4">
                      Save Profile Picture
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Sports</CardTitle>
                <CardDescription>
                  Select the sports you specialize in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((sport) => (
                      <div
                        key={sport}
                        className="flex items-center bg-[#4e43ff]/10 text-[#4e43ff] px-3 py-1.5 rounded-lg group"
                      >
                        <span className="text-lg mr-2">
                          {sportEmojiMap[sport] || "🎯"}
                        </span>
                        <span className="text-sm font-medium">{sport}</span>
                        <button
                          onClick={() => handleRemoveSport(sport)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1 p-2 rounded-md border border-gray-300 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] outline-none"
                    >
                      <option value="">Select a sport...</option>
                      {Object.entries(sportEmojiMap).map(([sport, emoji]) => (
                        <option key={sport} value={sport}>
                          {emoji} {sport}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleAddSport}
                      disabled={!newTag}
                      className="bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90"
                    >
                      Add Sport
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Bio</CardTitle>
                <CardDescription>
                  Update your profile information visible to subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingBio ? (
                  <div className="space-y-4">
                    <textarea
                      placeholder="Write something about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full min-h-[100px] p-2 border-2 border-blue-500 rounded-md bg-blue-50"
                    />
                    <div className="flex space-x-2">
                      <Button onClick={handleBioUpdate}>Save Bio</Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingBio(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-blue-700 font-semibold">
                      {bio || "No bio set yet"}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingBio(true)}
                    >
                      Edit Bio
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                  Connect with your followers on social media
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingSocials ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {/* Instagram */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">
                          Instagram
                        </label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Instagram className="w-5 h-5 text-pink-500" />
                            <Input
                              placeholder="Your Instagram username (without @)"
                              value={socials.instagram?.username || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  instagram: {
                                    ...socials.instagram,
                                    username: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center space-x-2 pl-7">
                            <Input
                              placeholder="Your Instagram profile URL"
                              value={socials.instagram?.url || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  instagram: {
                                    ...socials.instagram,
                                    url: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Twitter/X */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">
                          Twitter/X
                        </label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Twitter className="w-5 h-5 text-blue-400" />
                            <Input
                              placeholder="Your X username (without @)"
                              value={socials.x?.username || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  x: {
                                    ...socials.x,
                                    username: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center space-x-2 pl-7">
                            <Input
                              placeholder="Your X profile URL"
                              value={socials.x?.url || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  x: {
                                    ...socials.x,
                                    url: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Discord */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Discord</label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-5 h-5 text-indigo-500" />
                            <Input
                              placeholder="Your Discord username"
                              value={socials.discord?.username || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  discord: {
                                    ...socials.discord,
                                    username: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center space-x-2 pl-7">
                            <Input
                              placeholder="Discord server invite link"
                              value={socials.discord?.url || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  discord: {
                                    ...socials.discord,
                                    url: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">
                          WhatsApp
                        </label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-5 h-5 text-green-500" />
                            <Input
                              placeholder="Your WhatsApp number/name"
                              value={socials.whatsapp?.username || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  whatsapp: {
                                    ...socials.whatsapp,
                                    username: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center space-x-2 pl-7">
                            <Input
                              placeholder="WhatsApp group invite link"
                              value={socials.whatsapp?.url || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  whatsapp: {
                                    ...socials.whatsapp,
                                    url: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* YouTube */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">YouTube</label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Youtube className="w-5 h-5 text-red-500" />
                            <Input
                              placeholder="Your YouTube channel name"
                              value={socials.youtube?.username || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  youtube: {
                                    ...socials.youtube,
                                    username: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center space-x-2 pl-7">
                            <Input
                              placeholder="Your YouTube channel URL"
                              value={socials.youtube?.url || ""}
                              onChange={(e) =>
                                setSocials({
                                  ...socials,
                                  youtube: {
                                    ...socials.youtube,
                                    url: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleSocialsUpdate}>
                        Save Social Links
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingSocials(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(socials).some(
                      ([_, value]) => value?.username || value?.url
                    ) ? (
                      <div className="space-y-2">
                        {socials.instagram?.username && (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <Instagram className="h-5 w-5 text-pink-500" />
                              <span>@{socials.instagram.username}</span>
                            </div>
                            {socials.instagram.url && (
                              <span className="text-sm text-gray-500 pl-7">
                                {socials.instagram.url}
                              </span>
                            )}
                          </div>
                        )}
                        {socials.x?.username && (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <Twitter className="h-5 w-5 text-blue-400" />
                              <span>@{socials.x.username}</span>
                            </div>
                            {socials.x?.url && (
                              <span className="text-sm text-gray-500 pl-7">
                                {socials.x.url}
                              </span>
                            )}
                          </div>
                        )}
                        {socials.discord?.url && (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-5 w-5 text-indigo-500" />
                              <span>Discord Server</span>
                            </div>
                            {socials.discord?.url && (
                              <span className="text-sm text-gray-500 pl-7">
                                {socials.discord.url}
                              </span>
                            )}
                          </div>
                        )}
                        {socials.whatsapp?.url && (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <Phone className="h-5 w-5 text-green-500" />
                              <span>WhatsApp Group</span>
                            </div>
                            {socials.whatsapp?.url && (
                              <span className="text-sm text-gray-500 pl-7">
                                {socials.whatsapp.url}
                              </span>
                            )}
                          </div>
                        )}
                        {socials.youtube?.url && (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <Youtube className="h-5 w-5 text-red-500" />
                              <span>YouTube Channel</span>
                            </div>
                            {socials.youtube?.url && (
                              <span className="text-sm text-gray-500 pl-7">
                                {socials.youtube.url}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No social links added yet
                      </p>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingSocials(true)}
                    >
                      Edit Social Links
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2"></div>
          </div>
        </main>
      </div>
    </div>
  );
}

function CapperProfile() {
  const LoadingLayout = (
    <div className="flex min-h-screen bg-gray-100">
      <div className="hidden lg:block">
        <SideNav />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Loader />
        </div>
      </div>
    </div>
  );

  return (
    <Suspense fallback={LoadingLayout}>
      <CapperProfileContent />
    </Suspense>
  );
}

export default function Page() {
  return <CapperProfile />;
}
