"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function StripeConnectOnboarding({
  isOnboarded = false,
}: {
  isOnboarded?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const startOnboarding = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        return;
      }

      console.log("Token:", token); // Debug line

      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Onboarding error:", error);
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openStripeDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch("/api/stripe/connect", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.url) {
        // Open Stripe dashboard in a new tab
        window.open(data.url, "_blank");
      } else {
        switch (data.code) {
          case "NO_STRIPE_ACCOUNT":
            toast.error("You need to connect your Stripe account first");
            break;
          case "ONBOARDING_INCOMPLETE":
            toast.error("Please complete your Stripe account setup first");
            startOnboarding();
            break;
          case "ACCOUNT_INVALID":
            toast.error(
              "Your Stripe account needs attention. Please check your email for instructions."
            );
            break;
          default:
            toast.error(
              "Unable to access Stripe dashboard. Please try again later."
            );
        }
      }
    } catch (error) {
      console.error("Error opening Stripe dashboard:", error);
      toast.error("Failed to open Stripe dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (isOnboarded) {
    return (
      <div className="p-6 bg-gray-900/50 rounded-xl border border-green-500/20">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <h3 className="text-2xl font-semibold text-white">
            Stripe Account Connected
          </h3>
        </div>

        <p className="text-lg text-gray-300 mb-6">
          Your Stripe account is connected and ready to receive payments. You
          can now start accepting subscriptions from users.
        </p>
        <Button
          onClick={openStripeDashboard}
          variant="outline"
          className="flex items-center gap-2 text-lg"
          disabled={loading}
        >
          {loading ? (
            "Opening dashboard..."
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              View Stripe Dashboard
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900/50 rounded-xl border border-red-500/20">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <h3 className="text-2xl font-semibold text-white">
          Connect Your Stripe Account
        </h3>
      </div>
      <p className="text-lg text-gray-300 mb-6">
        To receive payments as a Capper, you need to connect your Stripe
        account. This will allow you to receive payouts from your subscribers.
      </p>
      <Button
        onClick={startOnboarding}
        disabled={loading}
        className="bg-[#4e43ff] hover:bg-blue-600 w-full sm:w-auto text-lg"
      >
        {loading ? "Setting up..." : "Connect Stripe Account"}
      </Button>
    </div>
  );
}
