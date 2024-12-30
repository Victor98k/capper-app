"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Check } from "lucide-react";

interface SubscribeButtonProps {
  capperId: string;
  productId?: string;
  priceId?: string;
  stripeAccountId?: string;
  initialIsSubscribed?: boolean;
  className?: string;
}

export function SubscribeButton({
  capperId,
  productId,
  priceId,
  stripeAccountId,
  initialIsSubscribed = false,
  className,
}: SubscribeButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        setIsLoading(true);
        console.log("Checking subscription for:", {
          capperId,
          productId,
        });

        const response = await fetch(
          `/api/subscriptions/check?capperId=${capperId}${
            productId ? `&productId=${productId}` : ""
          }`,
          {
            credentials: "include",
          }
        );

        console.log("Response status:", response.status);

        // Log the raw response text for debugging
        const responseText = await response.text();
        console.log("Raw response:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("Invalid response format");
        }

        console.log("Parsed response data:", data);

        if (response.ok) {
          setIsSubscribed(data.isSubscribed);
        } else {
          console.error("Failed to check subscription status:", data.error);
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setIsSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (capperId) {
      checkSubscriptionStatus();
    }
  }, [capperId, productId]);

  const handleSubscription = async () => {
    if (isSubscribed) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/subscriptions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            capperId,
            productId,
          }),
          credentials: "include",
        });

        if (response.ok) {
          setIsSubscribed(false);
          toast.success("Unsubscribed successfully");
          router.refresh();
        } else {
          const error = await response.json();
          throw new Error(error.message || "Failed to unsubscribe");
        }
      } catch (error) {
        console.error("Unsubscribe error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to unsubscribe"
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Check if user is logged in
    const cookies = document.cookie;
    const cookieObj = cookies.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key.trim()] = value;
      return acc;
    }, {} as Record<string, string>);

    if (!cookieObj.token) {
      toast.error("Please login to subscribe");
      router.push("/login");
      return;
    }

    // If this is a specific product subscription, redirect directly to Stripe checkout
    if (productId && priceId) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/stripe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId,
            capperId,
            productId,
            stripeAccountId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create checkout session");
        }

        const { sessionId, accountId } = await response.json();

        // Initialize Stripe with the connected account
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          {
            stripeAccount: accountId,
          }
        );

        if (!stripe) {
          throw new Error("Stripe failed to initialize");
        }

        const result = await stripe.redirectToCheckout({
          sessionId,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to initiate checkout");
      } finally {
        setIsLoading(false);
      }
    } else {
      // If no specific product, redirect to general paywall
      router.push("/paywall");
    }
  };

  return (
    <Button
      onClick={handleSubscription}
      disabled={isLoading}
      variant={isSubscribed ? "outline" : "default"}
      className={`${
        isSubscribed
          ? "border-green-500 text-green-500 hover:bg-green-500/10 flex items-center gap-2"
          : "bg-[#4e43ff] hover:bg-[#4e43ff]/90"
      } ${className || ""}`}
    >
      {isLoading ? (
        "Loading..."
      ) : isSubscribed ? (
        <>
          <Check className="h-4 w-4" />
          Subscribed
        </>
      ) : (
        "Subscribe"
      )}
    </Button>
  );
}
