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

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2"></div>
          </div>
        </main>
      </div>
    </div>
  );
}
export default CapperDashboard;
