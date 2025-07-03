"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "@/components/SideNav";
import { Toaster } from "sonner";
import { toast } from "sonner";
import Loader from "@/components/Loader";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Subscription = {
  id: string;
  status: string;
  expiresAt: Date | null;
  productId: string;
  capper: {
    id: string;
    profileImage: string | null;
    user: {
      username: string;
      firstName: string;
      lastName: string;
      imageUrl: string | null;
    };
  };
  product?: {
    name: string;
    description?: string;
  };
};

function UserProfileContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [preferences, setPreferences] = useState({
    newsletter: false,
    newPosts: false,
    promotionalEmails: false,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<Subscription | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Fetch user data and subscriptions (keeping existing fetch logic)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const response = await fetch("/api/users/profile", {
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch profile data");
          }

          const data = await response.json();

          setUserData(data);
          setUsername(data.username || "");
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          toast.error("Failed to load profile");
        }
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (user?.id) {
        try {
          const response = await fetch("/api/subscriptions/user", {
            credentials: "include",
            headers: {
              userId: user.id,
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch subscriptions: ${response.status}`
            );
          }

          const data = await response.json();

          // console.log("Full subscription data:", data);
          // console.log("Subscriptions array:", data.subscriptions);

          // Log each subscription to see the structure
          if (data.subscriptions && data.subscriptions.length > 0) {
            data.subscriptions.forEach((sub: any, index: number) => {
              // console.log(`Subscription ${index + 1}:`, sub);
              // console.log(`Subscription ${index + 1} product:`, sub.product);
              // console.log(
              //   `Subscription ${index + 1} productId:`,
              //   sub.productId
              // );
            });
          }

          setSubscriptions(data.subscriptions || []);
        } catch (error) {
          console.error("Failed to cancel subscription:", error);
          toast.error("Failed to load subscriptions");
        }
      }
    };

    fetchSubscriptions();
  }, [user?.id]);

  const handleUsernameUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/username", {
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
        toast.error(
          data.error || "Failed to update username. Please try again."
        );
        return;
      }

      // Update local state with the response data
      setUsername(data.username || "");
      setUserData(data);
      setIsEditingUsername(false);

      // Update username in localStorage
      localStorage.setItem("username", username);

      toast.success("Username updated successfully");
    } catch (error) {
      console.error("Failed to update username:", error);
      toast.error("Failed to update username. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      // Clear local storage and redirect to home
      localStorage.clear();
      router.push("/");
      toast.success("Account deleted successfully");
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
    }
  };

  const handleCancelSubscription = async (subscription: Subscription) => {
    setSubscriptionToCancel(subscription);
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    try {
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subscriptionId: subscriptionToCancel.id,
          capperId: subscriptionToCancel.capper.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      const updatedSubs = subscriptions.filter(
        (sub) => sub.id !== subscriptionToCancel.id
      );
      setSubscriptions(updatedSubs);
      toast.success("Subscription cancelled successfully");
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#020817]">
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* Profile Details */}
            <div className="bg-[#1E293B] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Profile Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Username</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[#4e43ff] font-semibold">
                      @{userData?.username}
                    </p>
                    {/* {isEditingUsername ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => {
                            // Limit username to 30 characters
                            if (e.target.value.length <= 30) {
                              setUsername(e.target.value);
                            }
                          }}
                          maxLength={30} // HTML restriction as backup
                          className="px-2 py-1 bg-[#0F172A] border border-[#2D3B4E] rounded-md text-white text-sm"
                        />
                        <Button
                          onClick={() => handleUsernameUpdate()}
                          size="sm"
                          className="bg-[#4e43ff]"
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingUsername(true)}
                        className="text-gray-400 hover:text-white"
                      >
                        Edit
                      </Button>
                    )} */}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <p className="text-white">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <p className="text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-[#1E293B] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Account Settings
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[#2D3B4E] text-gray-300 hover:bg-[#0F172A]"
                >
                  Change Password
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Account
                </Button>
              </div>

              {/* Delete Account Confirmation Dialog */}
              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <DialogContent className="bg-[#1E293B] border-[#2D3B4E] text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                      Delete Account
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Are you sure you want to delete your account? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-[#0F172A] p-4 rounded-lg mt-4">
                    <p className="text-sm text-red-400">
                      Warning: This will permanently delete:
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-gray-400">
                      <li>• Your profile and all personal information</li>
                      <li>• All your subscriptions</li>
                      <li>• Access to any paid content</li>
                    </ul>
                  </div>
                  <DialogFooter className="mt-6 space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      className="border-[#2D3B4E] text-gray-300 hover:bg-[#0F172A]"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Delete My Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        );

      case "subscriptions":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Active Subscriptions
            </h3>
            {subscriptions.length === 0 ? (
              <div className="bg-[#1E293B] rounded-lg p-4 sm:p-6 text-center">
                <p className="text-gray-400">No active subscriptions</p>
                <Button
                  className="mt-4 bg-[#4e43ff]"
                  onClick={() => router.push("/Explore")}
                >
                  Browse Cappers
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#1E293B] rounded-lg space-y-4 sm:space-y-0"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            subscription.capper.profileImage ||
                            subscription.capper.user.imageUrl ||
                            ""
                          }
                          alt={subscription.capper.user.username}
                        />
                        <AvatarFallback className="bg-[#4e43ff] text-white">
                          {subscription.capper.user.username
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-white">
                          {subscription.capper.user.username}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Bundle:{" "}
                          <span className="text-violet-400">
                            {subscription.product?.name ||
                              subscription.productId ||
                              "No Bundle Name"}
                          </span>
                          <br />
                          Status: {subscription.status}
                          {subscription.expiresAt && (
                            <>
                              <br />
                              Expires:{" "}
                              {new Date(
                                subscription.expiresAt
                              ).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelSubscription(subscription)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "preferences":
        return (
          <div className="bg-[#1E293B] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Communication Preferences
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Newsletter</p>
                  <p className="text-sm text-gray-400">
                    Receive our weekly newsletter
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`${
                    preferences.newsletter
                      ? "bg-[#4e43ff] border-[#4e43ff]"
                      : "border-[#2D3B4E]"
                  } hover:bg-[#4e43ff]/90`}
                  //   onClick={() => handlePreferenceChange("newsletter")}
                >
                  {preferences.newsletter ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    New Post Notifications
                  </p>
                  <p className="text-sm text-gray-400">
                    Get notified when cappers you follow post
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`${
                    preferences.newPosts
                      ? "bg-[#4e43ff] border-[#4e43ff]"
                      : "border-[#2D3B4E]"
                  } hover:bg-[#4e43ff]/90`}
                  //   onClick={() => handlePreferenceChange("newPosts")}
                >
                  {preferences.newPosts ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Promotional Emails</p>
                  <p className="text-sm text-gray-400">
                    Receive special offers and updates
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`${
                    preferences.promotionalEmails
                      ? "bg-[#4e43ff] border-[#4e43ff]"
                      : "border-[#2D3B4E]"
                  } hover:bg-[#4e43ff]/90`}
                  //   onClick={() => handlePreferenceChange("promotionalEmails")}
                >
                  {preferences.promotionalEmails ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020817]">
      <SideNav />
      <Toaster position="top-right" expand={true} richColors closeButton />

      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Make the profile header stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Center the avatar on mobile */}
            <div className="relative self-center sm:self-auto">
              <Avatar className="h-32 w-32 border-4 border-[#020817]">
                <AvatarImage
                  //   src={user?.profileImage || ""}
                  alt={username || "User"}
                />
                <AvatarFallback className="bg-[#4e43ff] text-3xl">
                  {username?.charAt(0)?.toUpperCase() || "UN"}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Center text on mobile */}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-400">@{username}</p>
            </div>
          </div>

          {/* Make tabs scrollable on mobile */}
          <div className="border-b border-[#2D3B4E] mb-6 sm:mb-8">
            <nav className="flex gap-4 sm:gap-8 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab("profile")}
                className={`pb-4 font-medium whitespace-nowrap ${
                  activeTab === "profile"
                    ? "text-[#4e43ff] border-b-2 border-[#4e43ff]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`pb-4 font-medium whitespace-nowrap ${
                  activeTab === "subscriptions"
                    ? "text-[#4e43ff] border-b-2 border-[#4e43ff]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`pb-4 font-medium whitespace-nowrap ${
                  activeTab === "preferences"
                    ? "text-[#4e43ff] border-b-2 border-[#4e43ff]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Preferences
              </button>
            </nav>
          </div>

          {/* Adjust content padding for mobile */}
          <div className="space-y-4 sm:space-y-6">{renderTabContent()}</div>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription to{" "}
              {subscriptionToCancel?.capper.user.username}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="border-[#2D3B4E] text-gray-300 hover:bg-[#0F172A]"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserProfile() {
  return (
    <Suspense fallback={<Loader />}>
      <UserProfileContent />
    </Suspense>
  );
}

export default function Page() {
  return <UserProfile />;
}
