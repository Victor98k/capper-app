"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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
      <div className="p-4 bg-green-100 text-green-700 rounded-md">
        Your Stripe account is connected and ready to receive payments.
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800/50 rounded-xl">
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
        className="bg-[#4e43ff] hover:bg-blue-600"
      >
        {loading ? "Setting up..." : "Connect Stripe Account"}
      </Button>
    </div>
  );
}
