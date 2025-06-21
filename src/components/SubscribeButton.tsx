"use client";

import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Loader } from "./ui/loader";

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
  onClick?: () => void;
  couponId?: string;
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
  onClick,
  couponId,
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  const handleUnsubscribe = async () => {
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to unsubscribe");
      }

      toast.success("Successfully unsubscribed");
      setShowConfirmDialog(false);
      router.refresh();

      // Optionally reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Unsubscribe error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to unsubscribe"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscription = useCallback(async () => {
    if (isLoading || isDebouncing) return;

    try {
      setIsLoading(true);
      setIsDebouncing(true);

      // Log the subscription request details
      console.log("Starting subscription with:", {
        priceId,
        capperId,
        productId,
        stripeAccountId,
      });

      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          priceId,
          capperId,
          productId,
          couponId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Subscription API error:", error);
        throw new Error(error.message || "Failed to create checkout session");
      }

      const { sessionId, accountId } = await response.json();
      console.log("Received session details:", { sessionId, accountId });

      // Initialize Stripe with the connected account ID
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        {
          stripeAccount: accountId,
        }
      );

      if (!stripe) throw new Error("Stripe failed to load");

      console.log("Redirecting to checkout with session:", sessionId);
      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        console.error("Stripe redirect error:", result.error);
        throw new Error(result.error.message);
      }

      // Add a small delay and refresh the page to update subscription status
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to start subscription process");
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsDebouncing(false), 2000);
    }
  }, [
    capperId,
    productId,
    priceId,
    stripeAccountId,
    isLoading,
    isDebouncing,
    router,
    couponId,
  ]);

  const handleClick = async (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }

    // If already subscribed, show unsubscribe dialog
    if (isSubscribed) {
      setShowConfirmDialog(true);
      return;
    }

    // For new subscriptions, check for productId
    if (!productId) {
      return;
    }

    // Handle new subscription
    await handleSubscription();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "relative",
          {
            "opacity-50 cursor-not-allowed": disabled && !isSubscribed,
          },
          className
        )}
      >
        {isLoading ? (
          <Loader size="sm" />
        ) : (
          children || (isSubscribed ? "Unsubscribe" : "Subscribe")
        )}
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800">
          <DialogHeader>
            <DialogTitle>Confirm Unsubscribe</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to cancel your subscription? You'll lose
              access to exclusive content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnsubscribe}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? <Loader size="sm" /> : "Unsubscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
