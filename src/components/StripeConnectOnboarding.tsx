"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink } from "lucide-react";

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

  if (isOnboarded) {
    return (
      <div className="p-6 bg-gray-800/50 rounded-xl border border-green-500/20">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <h3 className="text-xl font-semibold text-white">
            Stripe Account Connected
          </h3>
        </div>
        <p className="text-gray-300 mb-6">
          Your Stripe account is connected and ready to receive payments. You
          can now start accepting subscriptions from users.
        </p>
        <Button
          onClick={() => window.open("https://dashboard.stripe.com", "_blank")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View Stripe Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800/50 rounded-xl border border-[#4e43ff]/20">
      <h3 className="text-xl font-semibold mb-4 text-white">
        Connect Your Stripe Account
      </h3>
      <p className="text-gray-300 mb-6">
        To receive payments as a Capper, you need to connect your Stripe
        account. This will allow you to receive payouts from your subscribers.
      </p>
      <Button
        onClick={startOnboarding}
        disabled={loading}
        className="bg-[#4e43ff] hover:bg-blue-600 w-full sm:w-auto"
      >
        {loading ? "Setting up..." : "Connect Stripe Account"}
      </Button>
    </div>
  );
}
