"use client";

import { useState } from "react";
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

  const handleSubscription = async () => {
    if (scrollToBundles && !isSubscribed) {
      const bundlesSection = document.getElementById("subscription-plans");
      if (bundlesSection) {
        bundlesSection.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    if (isSubscribed) {
      setShowConfirmDialog(true);
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
    <>
      <Button
        onClick={handleSubscription}
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
