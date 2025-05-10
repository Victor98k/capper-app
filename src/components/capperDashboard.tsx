"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  PieChart,
  Settings,
  Terminal,
  Users,
  CheckCircle,
  PlusCircle,
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
import Loader from "@/components/Loader";
import { useQuery } from "@tanstack/react-query";

export function CapperDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");

  // Add searchParams to check for success parameter
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  // Convert checkStripeStatus to a fetch function
  const fetchStripeStatus = async () => {
    const response = await fetch("/api/stripe/connect", {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch Stripe status");
    }

    const data = await response.json();
    return data;
  };

  // Use React Query to manage the Stripe status
  const { data: stripeStatus, refetch: refetchStripeStatus } = useQuery({
    queryKey: ["stripeStatus", user?.id],
    queryFn: fetchStripeStatus,
    enabled: !!user?.isCapper && !loading, // Only run query if user is a capper
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Handle success parameter
  useEffect(() => {
    if (success === "true" && user?.isCapper) {
      refetchStripeStatus();
    }
  }, [success, user?.isCapper, refetchStripeStatus]);

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

  // Add this inside your CapperDashboard component
  const { data: stripeAccountData } = useQuery({
    queryKey: ["stripeAccountData"],
    queryFn: async () => {
      const response = await fetch("/api/stripe/account-data");
      if (!response.ok) {
        throw new Error("Failed to fetch Stripe account data");
      }
      const data = await response.json();
      console.log("Stripe Account Data from API:", data);
      return data;
    },
    enabled: !!stripeStatus?.onboarded,
  });

  // Show loading state
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
    <div className="flex min-h-screen bg-[#020817]">
      <SideNav />

      <div className="flex-1">
        <header className="bg-[#020817] shadow pl-16 lg:pl-0">
          <div className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-4xl font-bold text-white">
              Welcome back, {user?.username}
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {user?.isCapper && !stripeStatus?.onboarded && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
                  <h2 className="text-3xl font-bold mb-4">
                    Welcome to Your Capper Journey! 🎉
                  </h2>
                  <p className="text-lg mb-6">
                    You're just a few steps away from starting your journey as a
                    professional capper. Let's get your account set up so you
                    can start sharing your insights and earning!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Users className="h-6 w-6" />
                          Build Your Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Create your unique identity and showcase your
                          expertise
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <PieChart className="h-6 w-6" />
                          Track Your Success
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Monitor your performance and grow your following</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Terminal className="h-6 w-6" />
                          Start Earning
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Connect with Stripe to receive payments from
                          subscribers
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center">
                    <StripeConnectOnboarding
                      isOnboarded={false}
                      className="bg-white text-purple-600 hover:bg-gray-100 transition-colors px-8 py-4 rounded-full font-semibold text-lg"
                    />
                    <p className="mt-4 text-sm opacity-80">
                      By connecting with Stripe, you'll be able to receive
                      payments securely and manage your earnings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user?.isCapper && stripeStatus?.onboarded && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-8 text-white mb-6">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-4 hover:opacity-90 transition-opacity">
                          <CheckCircle className="h-10 w-10" />
                          <div>
                            <h2 className="text-2xl font-bold text-left">
                              Stripe Account Connected
                            </h2>
                            <p className="text-gray-100 text-left text-sm">
                              Click to view account capabilities
                            </p>
                          </div>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Stripe Account Capabilities</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Payouts:</span>
                              <span
                                className={
                                  stripeAccountData?.payoutEnabled
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {stripeAccountData?.payoutEnabled
                                  ? "Enabled"
                                  : "Disabled"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Charges:</span>
                              <span
                                className={
                                  stripeAccountData?.chargesEnabled
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {stripeAccountData?.chargesEnabled
                                  ? "Enabled"
                                  : "Disabled"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Currency:</span>
                              <span className="text-gray-900 uppercase">
                                {stripeAccountData?.defaultCurrency}
                              </span>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">
                              Account Features:
                            </h4>
                            <ul className="space-y-3">
                              <li className="flex items-center gap-2 text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                View your earnings and payment history
                              </li>
                              <li className="flex items-center gap-2 text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Track your active subscribers
                              </li>
                              <li className="flex items-center gap-2 text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Manage your payout settings
                              </li>
                              <li className="flex items-center gap-2 text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Access detailed analytics and reports
                              </li>
                            </ul>
                          </div>

                          <div className="border-t pt-4">
                            <StripeConnectOnboarding
                              isOnboarded={true}
                              stripeAccountData={{
                                payoutEnabled: stripeAccountData?.payoutEnabled,
                                chargesEnabled:
                                  stripeAccountData?.chargesEnabled,
                                defaultCurrency:
                                  stripeAccountData?.defaultCurrency,
                              }}
                              className="bg-white text-purple-600 hover:bg-gray-100 transition-colors px-6 py-2 rounded-lg font-semibold"
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Available Balance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          $
                          {stripeAccountData?.totalBalance?.toFixed(2) ||
                            "0.00"}
                        </p>
                        <p className="text-sm text-gray-300">
                          Ready to be paid out
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Active Subscribers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {stripeAccountData?.subscriptions?.total || 0}
                        </p>
                        <p className="text-sm text-gray-300">
                          Current subscribers
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Monthly Revenue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          $
                          {stripeAccountData?.subscriptions?.monthlyRecurringRevenue?.toFixed(
                            2
                          ) || "0.00"}
                        </p>
                        <p className="text-sm text-gray-300">
                          Recurring revenue
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Payout</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {stripeAccountData?.recentPayouts?.[0] ? (
                          <>
                            <p className="text-2xl font-bold">
                              $
                              {stripeAccountData.recentPayouts[0].amount.toFixed(
                                2
                              )}
                            </p>
                            <p className="text-sm text-gray-300">
                              {new Date(
                                stripeAccountData.recentPayouts[0].arrivalDate *
                                  1000
                              ).toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-300">No recent payouts</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end bg-black/20 rounded-lg p-8">
                    <StripeConnectOnboarding
                      isOnboarded={true}
                      stripeAccountData={{
                        payoutEnabled: stripeAccountData?.payoutEnabled,
                        chargesEnabled: stripeAccountData?.chargesEnabled,
                        defaultCurrency: stripeAccountData?.defaultCurrency,
                      }}
                      className="bg-white text-purple-600 hover:bg-gray-100 transition-colors px-6 py-2 rounded-lg font-semibold"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <StripeProductDisplay />
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2"></div>
          </div>
        </main>
      </div>
    </div>
  );
}
export default CapperDashboard;
