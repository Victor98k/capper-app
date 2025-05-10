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
  Loader2,
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
  const { data: stripeAccountData, isLoading: isLoadingStripeData } = useQuery({
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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#020817]">
      <SideNav />

      <div className="flex-1">
        <header className="bg-[#020817] shadow px-4 md:pl-16 lg:pl-0">
          <div className="max-w-7xl mx-auto pt-6 md:pt-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white break-words pl-12 md:pl-0">
              Dashboard Overview
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
          <div className="py-4 md:py-6">
            {user?.isCapper && !stripeStatus?.onboarded && (
              <div className="mb-4 md:mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 md:p-8 text-white">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Welcome to Your Capper Journey! 🎉
                  </h2>
                  <p className="text-base md:text-lg mb-6">
                    You're just a few steps away from starting your journey as a
                    professional capper. Let's get your account set up so you
                    can start sharing your insights and earning!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
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

                  <div className="text-center px-4 md:px-0">
                    <StripeConnectOnboarding
                      isOnboarded={false}
                      className="w-full md:w-auto bg-white text-purple-600 hover:bg-gray-100 transition-colors px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg"
                    />
                    <p className="mt-4 text-sm opacity-80 px-2 md:px-4">
                      By connecting with Stripe, you'll be able to receive
                      payments securely and manage your earnings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user?.isCapper && stripeStatus?.onboarded && (
              <div className="mb-4 md:mb-6">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-4 md:p-8 text-white mb-4 md:mb-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 md:mb-8 border-b border-white/10 pb-6">
                    <div className="bg-white/10 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-left mb-2">
                        Stripe Account Connected
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 md:gap-x-6 text-sm">
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
                          <span className="text-gray-200">Payouts:</span>
                          <span
                            className={
                              stripeAccountData?.payoutEnabled
                                ? "text-green-400 font-medium"
                                : "text-red-400 font-medium"
                            }
                          >
                            {stripeAccountData?.payoutEnabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
                          <span className="text-gray-200">Charges:</span>
                          <span
                            className={
                              stripeAccountData?.chargesEnabled
                                ? "text-green-400 font-medium"
                                : "text-red-400 font-medium"
                            }
                          >
                            {stripeAccountData?.chargesEnabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        {stripeAccountData?.defaultCurrency && (
                          <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
                            <span className="text-gray-200">Currency:</span>
                            <span className="text-white uppercase font-medium">
                              {stripeAccountData.defaultCurrency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Available Balance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeData ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-300">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-2xl font-bold">
                              $
                              {stripeAccountData?.totalBalance?.toFixed(2) ||
                                "0.00"}
                            </p>
                            <p className="text-sm text-gray-300">
                              Ready to be paid out
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Active Subscribers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeData ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-300">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-2xl font-bold">
                              {stripeAccountData?.subscriptions?.total || 0}
                            </p>
                            <p className="text-sm text-gray-300">
                              Current subscribers
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Monthly Revenue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeData ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-300">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-2xl font-bold">
                              $
                              {stripeAccountData?.subscriptions?.monthlyRecurringRevenue?.toFixed(
                                2
                              ) || "0.00"}
                            </p>
                            <p className="text-sm text-gray-300">
                              Recurring revenue
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Payout</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeData ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-300">Loading...</span>
                          </div>
                        ) : (
                          <>
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
                                    stripeAccountData.recentPayouts[0]
                                      .arrivalDate * 1000
                                  ).toLocaleDateString()}
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-300">No recent payouts</p>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-black/20 rounded-xl p-4 md:p-6 space-y-4 md:space-y-0">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base md:text-lg">
                        Manage Your Account
                      </h3>
                      <p className="text-sm text-gray-300">
                        Access your Stripe dashboard to manage payments and
                        settings
                      </p>
                    </div>
                    <StripeConnectOnboarding
                      isOnboarded={true}
                      stripeAccountData={{
                        payoutEnabled: stripeAccountData?.payoutEnabled,
                        chargesEnabled: stripeAccountData?.chargesEnabled,
                        defaultCurrency: stripeAccountData?.defaultCurrency,
                      }}
                      className="w-full md:w-auto bg-white text-purple-600 hover:bg-gray-100 transition-colors px-4 md:px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl text-center"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <StripeProductDisplay />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
export default CapperDashboard;
