"use client";

import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const tiers = [
  {
    name: "Basic",
    price: 20,
    priceId: "price_1Qb86pKdsW3avvJOQti33DT1",
    description: "Perfect for casual sports bettors looking to get started",
    features: [
      "Access to 25 expert picks per month",
      "Basic betting analysis and insights",
      "Daily betting tips newsletter",
      "Win probability ratings",
      "Basic stats and trends access",
    ],
  },
  {
    name: "Premium",
    price: 50,
    priceId: "price_1Qam3XKdsW3avvJOCAbISJKg",
    description: "Enhanced features for serious sports bettors",
    features: [
      "All Basic features included",
      "Unlimited expert picks",
      "Advanced statistical modeling",
      "Real-time odds comparison",
      "Live bet tracking dashboard",
      "Expert chat support",
      "Personalized betting strategies",
    ],
  },
  {
    name: "Professional",
    price: 150,
    priceId: "price_1Qb88rKdsW3avvJO3MKTJLyl",
    description: "Ultimate package for professional bettors",
    features: [
      "All Premium features included",
      "VIP expert picks",
      "1-on-1 betting consultations",
      "Exclusive betting algorithms",
      "Early access to picks",
      "Custom parlay builder",
      "Professional bankroll management",
      "Priority customer support 24/7",
      "Monthly strategy sessions",
    ],
  },
];

function CheckoutButton({ tier }: { tier: (typeof tiers)[0] }) {
  const stripe = useStripe();

  const handleSubscription = async () => {
    try {
      if (!stripe) throw new Error("Stripe failed to initialize.");

      // Create checkout session
      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: tier.priceId,
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Button
      className={`w-full ${
        tier.name === "Premium"
          ? "bg-violet-500 hover:bg-violet-600"
          : "border-violet-500 text-violet-500 hover:bg-violet-500/10"
      }`}
      variant={tier.name === "Premium" ? "default" : "outline"}
      onClick={handleSubscription}
    >
      {tier.name === "Premium" ? "Get Started" : "Choose Plan"}
    </Button>
  );
}

export function PaywallComponent() {
  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Choose Your Capper Experience
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              Unlock premium features and take your betting to the next level
            </p>
          </div>
          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`bg-gray-800 border-gray-700 flex flex-col ${
                  tier.name === "Premium"
                    ? "scale-105 bg-gray-750 border-2 border-violet-500 shadow-lg shadow-violet-500/20"
                    : ""
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-white">
                    {tier.name}
                    {tier.name === "Premium" && (
                      <span className="ml-2 inline-block px-2 py-0.5 text-sm bg-violet-500 text-white rounded-full">
                        Popular
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-center">
                    <span className="text-5xl font-extrabold text-white">
                      ${tier.price}
                    </span>
                    <span className="text-xl font-medium text-gray-300">
                      /month
                    </span>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <div className="flex-shrink-0">
                          <Check className="h-6 w-6 text-green-400" />
                        </div>
                        <p className="ml-3 text-base text-gray-300">
                          {feature}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto pt-6">
                  <CheckoutButton tier={tier} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Elements>
  );
}
export default PaywallComponent;
