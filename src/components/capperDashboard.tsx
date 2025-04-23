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
                  isOnboarded={stripeStatus?.onboarded || false}
                />
              </div>
            )}

            {user?.isCapper && stripeStatus?.onboarded && (
              <div className="mb-6">
                <StripeProductDisplay />
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
