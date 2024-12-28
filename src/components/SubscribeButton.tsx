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
    // If user is already subscribed, handle unsubscribe logic
    if (isSubscribed) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/subscriptions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ capperId }),
          credentials: "include",
        });

        if (response.ok) {
          setIsSubscribed(false);
          toast.success("Unsubscribed successfully");
          router.refresh();
        }
      } catch (error) {
        console.error("Unsubscribe error:", error);
        toast.error("Failed to unsubscribe");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If user is not subscribed, redirect to paywall
    const cookies = document.cookie;
    const cookieObj = cookies.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key.trim()] = value;
      return acc;
    }, {} as Record<string, string>);

    // Check if user is logged in
    if (!cookieObj.token) {
      toast.error("Please login to subscribe");
      router.push("/login");
      return;
    }

    // Redirect to paywall
    router.push("/paywall");
  };

  return (
    <Button
      onClick={handleSubscription}
      disabled={isLoading}
      variant={isSubscribed ? "outline" : "default"}
      className={
        isSubscribed
          ? "border-[#4e43ff] text-[#4e43ff] hover:bg-[#4e43ff]/10"
          : "bg-[#4e43ff] hover:bg-[#4e43ff]/90"
      }
    >
      {isLoading ? "Loading..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
}
