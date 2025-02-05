"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  PieChart,
  Settings,
  Terminal,
  Users,
} from "lucide-react";
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
import DisplayCapperCard from "./displayCapperCard";
import { SideNav } from "./SideNavCappers";
import StripeConnectOnboarding from "./StripeConnectOnboarding";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StripeProductDisplay from "./StripeProductDisplay";

export function CapperDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
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

  // Add searchParams to check for success parameter
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  // Modify the checkStripeStatus function to be reusable
  const checkStripeStatus = async () => {
    try {
      // Remove localStorage check since we're using cookies now
      const response = await fetch("/api/stripe/connect", {
        headers: {
          "Content-Type": "application/json",
        },
        // Add credentials to include cookies in the request
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Stripe connect error:", errorData);
        throw new Error(errorData.error || "Failed to fetch Stripe status");
      }

      const data = await response.json();
      setStripeStatus({
        isOnboarded: data.onboarded || false,
        isLoading: false,
      });

      console.log("Stripe status check:", data);
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error);
      setStripeStatus({
        isOnboarded: false,
        isLoading: false,
      });
    }
  };

  // Check Stripe status on initial load
  useEffect(() => {
    if (user?.isCapper && !loading) {
      console.log("Checking Stripe status for capper:", user.id);
      checkStripeStatus();
    }
  }, [user, loading]);

  // Add another useEffect to handle the success parameter
  useEffect(() => {
    if (success === "true" && user?.isCapper) {
      console.log(
        "Detected successful Stripe onboarding, rechecking status..."
      );
      checkStripeStatus();
    }
  }, [success, user]);

  // Update useEffect to fetch tags as well
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
            {user?.isCapper && (
              <div className="mb-6">
                <StripeConnectOnboarding
                  isOnboarded={stripeStatus.isOnboarded}
                />
              </div>
            )}

            {user?.isCapper && stripeStatus.isOnboarded && (
              <div className="mb-6">
                <StripeProductDisplay />
              </div>
            )}

            {/* <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Your Profile information
            </h2> */}

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

            {/* <Card className="col-span-full mt-5">
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
            </Card> */}

            {/* <Card className="mt-6">
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
            </Card> */}

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
export default CapperDashboard;
