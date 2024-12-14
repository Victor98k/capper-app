"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SubscribeButtonProps {
  capperId: string;
  initialIsSubscribed?: boolean;
}

export function SubscribeButton({
  capperId,
  initialIsSubscribed = false,
}: SubscribeButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const response = await fetch(
          `/api/subscriptions/check?capperId=${capperId}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.isSubscribed);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [capperId]);

  const handleSubscription = async () => {
    setIsLoading(true);
    try {
      // Get all cookies
      const cookies = document.cookie;
      console.log("All client-side cookies:", cookies);

      // Parse cookies into an object
      const cookieObj = cookies.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key.trim()] = value;
        return acc;
      }, {} as Record<string, string>);

      console.log("Parsed cookies:", cookieObj);

      // Check specifically for the token cookie
      if (!cookieObj.token) {
        console.log("No token cookie found - redirecting to login");
        toast.error("Please login to subscribe");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/subscriptions", {
        method: isSubscribed ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ capperId }),
        credentials: "include",
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.status === 401) {
        console.log("Unauthorized - redirecting to login");
        toast.error("Session expired. Please login again");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Subscription failed");
      }

      setIsSubscribed(!isSubscribed);
      toast.success(
        isSubscribed ? "Unsubscribed successfully" : "Subscribed successfully"
      );
      router.refresh();
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubscription}
      disabled={isLoading}
      variant={isSubscribed ? "outline" : "default"}
    >
      {isLoading ? "Loading..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
}
