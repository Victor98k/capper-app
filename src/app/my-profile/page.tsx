"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "@/components/SideNav";
import { Toaster } from "sonner";
import { toast } from "sonner";
import Loader from "@/components/Loader";

// Create a separate component for the content
function UserProfileContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State for user profile data
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [userData, setUserData] = useState<any>(null);
  const [preferences, setPreferences] = useState({
    newsletter: false,
    newPosts: false,
    promotionalEmails: false,
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch("/api/users/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch profile data");
          }

          const data = await response.json();
          console.log("Fetched user data:", data);
          setUserData(data);
          setUsername(data.username || "");
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Fetch user subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (user?.id) {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`/api/users/${user.id}/subscriptions`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch subscriptions");
          }

          const data = await response.json();
          setSubscriptions(data);
        } catch (error) {
          console.error("Failed to fetch subscriptions:", error);
        }
      }
    };

    fetchSubscriptions();
  }, [user?.id]);

  const handleUsernameUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
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
      toast.success("Username updated successfully");
    } catch (error) {
      console.error("Failed to update username:", error);
      toast.error("Failed to update username. Please try again.");
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      // Remove the cancelled subscription from state
      setSubscriptions(
        subscriptions.filter((sub) => sub.id !== subscriptionId)
      );
      toast.success("Subscription cancelled successfully");
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    }
  };

  const handlePreferenceChange = async (key: string) => {
    try {
      const newPreferences = {
        ...preferences,
        [key]: !preferences[key as keyof typeof preferences],
      };

      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          preferences: newPreferences,
        }),
      });

      if (!response.ok) throw new Error("Failed to update preferences");

      setPreferences(newPreferences);
      toast.success("Preferences updated successfully");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    }
  };

  // Show loading state
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

  return (
    <div className="flex min-h-screen bg-[#020817]">
      <SideNav />
      <Toaster position="top-right" expand={true} richColors closeButton />

      <div className="flex-1">
        <header className="bg-[#0F172A] shadow pl-16 lg:pl-0">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.firstName}
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6">
              {/* Profile Information Card */}
              <Card className="bg-[#0F172A] border-[#1E293B] text-white">
                <CardHeader>
                  <CardTitle>Your Username</CardTitle>
                  <CardDescription className="text-gray-400">
                    This is your unique identifier on the platformx
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditingUsername ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border rounded-md bg-[#1E293B] border-[#2D3B4E] text-white"
                        placeholder="Enter new username"
                      />
                      <div className="flex space-x-2">
                        <Button onClick={handleUsernameUpdate}>
                          Save Username
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingUsername(false)}
                          className="border-[#2D3B4E] text-gray-300 hover:bg-[#1E293B]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-blue-400 font-semibold">
                        @{username || "No username set"}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingUsername(true)}
                        className="border-[#2D3B4E] text-gray-300 hover:bg-[#1E293B]"
                      >
                        Edit Username
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Subscriptions Card */}
              <Card className="bg-[#0F172A] border-[#1E293B] text-white">
                <CardHeader>
                  <CardTitle>Active Subscriptions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your capper subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptions.length === 0 ? (
                    <p className="text-gray-400">No active subscriptions</p>
                  ) : (
                    <div className="space-y-4">
                      {subscriptions.map((subscription) => (
                        <div
                          key={subscription.id}
                          className="flex items-center justify-between p-4 border border-[#2D3B4E] rounded-lg bg-[#1E293B]"
                        >
                          <div>
                            <h3 className="font-medium text-white">
                              {subscription.capper.username}
                            </h3>
                            <p className="text-sm text-gray-400">
                              Expires:{" "}
                              {new Date(
                                subscription.expiresAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleCancelSubscription(subscription.id)
                            }
                          >
                            Cancel Subscription
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Communication Preferences Card */}
              <Card className="bg-[#0F172A] border-[#1E293B] text-white">
                <CardHeader>
                  <CardTitle>Communication Preferences</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your email and notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-200">Newsletter</p>
                        <p className="text-sm text-gray-400">
                          Receive our weekly newsletter
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className={`${
                          preferences.newsletter
                            ? "bg-[#2D3B4E] text-white"
                            : "border-[#2D3B4E] text-gray-300"
                        } hover:bg-[#1E293B]`}
                        onClick={() => handlePreferenceChange("newsletter")}
                      >
                        {preferences.newsletter ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-200">
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
                            ? "bg-[#2D3B4E] text-white"
                            : "border-[#2D3B4E] text-gray-300"
                        } hover:bg-[#1E293B]`}
                        onClick={() => handlePreferenceChange("newPosts")}
                      >
                        {preferences.newPosts ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-200">
                          Promotional Emails
                        </p>
                        <p className="text-sm text-gray-400">
                          Receive special offers and updates
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className={`${
                          preferences.promotionalEmails
                            ? "bg-[#2D3B4E] text-white"
                            : "border-[#2D3B4E] text-gray-300"
                        } hover:bg-[#1E293B]`}
                        onClick={() =>
                          handlePreferenceChange("promotionalEmails")
                        }
                      >
                        {preferences.promotionalEmails ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Settings Card */}
              <Card className="bg-[#0F172A] border-[#1E293B] text-white">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your account preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start border-[#2D3B4E] text-gray-300 hover:bg-[#1E293B]"
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-[#2D3B4E] text-gray-300 hover:bg-[#1E293B]"
                    >
                      Notification Settings
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
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
