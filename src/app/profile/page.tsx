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
          const response = await fetch("/api/cappers");
          const data = await response.json();
          const capperData = data.find((c: any) => c.userId === user.id);
          if (capperData) {
            setBio(capperData.bio || "");
            setTags(capperData.tags || []);
            setUsername(capperData.user.username || "");
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
      formData.append("profileImage", profileImage);
      formData.append("userId", user.id);

      const response = await fetch("/api/cappers/profile-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile image");
      }

      const data = await response.json();

      // Update the preview with the new image URL
      setProfileImagePreview(data.imageUrl);

      // Clear the file input
      setProfileImage(null);

      console.log("Profile image updated successfully:", data);
    } catch (error) {
      console.error("Failed to update profile image:", error);
      alert("Failed to update profile image. Please try again.");
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

      console.log("Stripe status check:", data); // Debug log
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
    return <div>Loading...</div>;
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

      const response = await fetch(`/api/cappers/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: bio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update bio");
      }

      const data = await response.json();
      console.log("Bio updated successfully:", data);
      setIsEditingBio(false);
    } catch (error) {
      console.error("Failed to update bio:", error);
      // Optionally add user feedback here
    }
  };

  const handleAddTag = async () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      try {
        const response = await fetch("/api/cappers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user?.id,
            tags: [newTag.trim()],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Only update UI after successful API call
        setTags([...tags, newTag.trim()]);
        setNewTag("");
      } catch (error) {
        console.error("Failed to add tag:", error);
      }
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const response = await fetch("/api/cappers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          tagToRemove,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Only update UI after successful API call
      setTags(tags.filter((tag) => tag !== tagToRemove));
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      const response = await fetch("/api/cappers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to update username:", data.error);
        return;
      }

      setIsEditingUsername(false);
    } catch (error) {
      console.error("Failed to update username:", error);
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideNav />

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

            {/* <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total bets played</CardTitle>
                  <CardDescription>Your bets played activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">28</div>
                  <p className="text-sm text-muted-foreground">
                    +2.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue</CardTitle>
                  <CardDescription>This month's earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$4,320</div>
                  <p className="text-sm text-muted-foreground">
                    +10% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Subscriptions</CardTitle>
                  <CardDescription>
                    Currently active subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12</div>
                  <p className="text-sm text-muted-foreground">
                    3 new this week
                  </p>
                </CardContent>
              </Card>
            </div> */}

            <Card className="mt-6">
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
            </Card>

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
                    className={`w-40 h-40 border-2 border-dashed rounded-full mx-auto cursor-pointer transition-colors
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

            <Card className="col-span-full mt-5">
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
                <CardTitle>Your Tags</CardTitle>
                <CardDescription>
                  Add tags to help users find your expertise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
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
                  <div className="flex gap-2">
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
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Profile Preview</CardTitle>
                <CardDescription>
                  See how your profile appears to other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Preview Profile Card</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Profile Preview</DialogTitle>
                    </DialogHeader>
                    <DisplayCapperCard
                      userId={user?.id || ""}
                      firstName={user?.firstName || ""}
                      lastName={user?.lastName || ""}
                      username={username}
                      bio={bio}
                      tags={tags}
                      subscriberIds={[]}
                      isVerified={false}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full justify-start" variant="outline">
                      <PieChart className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Subscriptions
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Customer Messages
                    </Button>
                  </div>
                </CardContent>
              </Card> */}

              {/* <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="flex-grow">New subscriptions</span>
                      <span className="text-sm text-muted-foreground">
                        2h ago
                      </span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span className="flex-grow">
                        Updated bet: Chelsea vs Man Utd
                      </span>
                      <span className="text-sm text-muted-foreground">
                        5h ago
                      </span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      <span className="flex-grow">
                        New bet: Liverpool vs Man City
                      </span>
                      <span className="text-sm text-muted-foreground">
                        1d ago
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card> */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function CapperProfile() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CapperProfileContent />
    </Suspense>
  );
}

export default function Page() {
  return <CapperProfile />;
}
