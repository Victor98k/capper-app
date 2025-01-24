"use client";

import { useState } from "react";
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
  isSubscribed?: boolean;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  scrollToBundles?: boolean;
}

export function SubscribeButton({
  capperId,
  productId,
  priceId,
  stripeAccountId,
  isSubscribed = false,
  className,
  disabled,
  children,
  scrollToBundles = false,
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubscription = async () => {
    if (scrollToBundles && !isSubscribed) {
      const bundlesSection = document.getElementById("subscription-plans");
      if (bundlesSection) {
        bundlesSection.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

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
      disabled={disabled || isLoading}
      variant={isSubscribed ? "outline" : "default"}
      className={`${
        isSubscribed
          ? "border-green-500 text-green-500 hover:bg-green-500/10 flex items-center gap-2"
          : "bg-[#4e43ff] hover:bg-[#4e43ff]/90"
      } ${className || ""}`}
    >
      {children ||
        (isLoading ? (
          "Loading..."
        ) : isSubscribed ? (
          <>
            <Check className="h-4 w-4" />
            Subscribed
          </>
        ) : (
          "Subscribe"
        ))}
    </Button>
  );
}
