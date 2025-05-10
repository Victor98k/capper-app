"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export async function startStripeOnboarding(): Promise<string | undefined> {
  try {
    const response = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Onboarding error:", error);
      return undefined;
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Onboarding error:", error);
    return undefined;
  }
}

interface StripeConnectOnboardingProps {
  isOnboarded: boolean;
  className?: string;
  stripeAccountData?: {
    payoutEnabled?: boolean;
    chargesEnabled?: boolean;
    defaultCurrency?: string;
  };
}

const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  isOnboarded,
  className = "",
  stripeAccountData,
}) => {
  const [loading, setLoading] = useState(false);

  const startOnboarding = async () => {
    try {
      setLoading(true);
      const url = await startStripeOnboarding();
      if (url) {
        window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  };

  const openStripeDashboard = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/connect", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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

  const handleConnect = isOnboarded ? openStripeDashboard : startOnboarding;

  if (isOnboarded) {
    return (
      <div className="p-6 bg-gray-800 rounded-xl border border-green-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h3 className="text-2xl font-semibold text-white">
              Stripe Account Connected
            </h3>
          </div>

          {stripeAccountData && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Payouts:</span>
                <span
                  className={
                    stripeAccountData.payoutEnabled
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {stripeAccountData.payoutEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Charges:</span>
                <span
                  className={
                    stripeAccountData.chargesEnabled
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {stripeAccountData.chargesEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {stripeAccountData.defaultCurrency && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Currency:</span>
                  <span className="text-white uppercase">
                    {stripeAccountData.defaultCurrency}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-lg text-gray-300">
            Your Stripe account is connected and ready to receive payments. You
            can now:
          </p>

          <ul className="list-disc list-inside text-gray-300 ml-2 space-y-2">
            <li>View your earnings and payment history</li>
            <li>Track your active subscribers</li>
            <li>Manage your payout settings</li>
            <li>Access detailed analytics and reports</li>
          </ul>

          <div className="bg-gray-700/50 p-4 rounded-lg mt-6">
            <h4 className="text-white font-medium mb-2">
              Manage Your Business with Stripe Dashboard
            </h4>
            <p className="text-gray-300 mb-4">
              Access your full Stripe dashboard to manage subscriptions, view
              detailed analytics, and handle payouts all in one place.
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
        </div>
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
      <Button onClick={handleConnect} className={className} disabled={loading}>
        {loading ? "Setting up..." : "Connect with Stripe"}
      </Button>
    </div>
  );
};

export default StripeConnectOnboarding;
