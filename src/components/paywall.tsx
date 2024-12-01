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

const tiers = [
  {
    name: "Basic",
    price: 9.99,
    description: "Essential features for casual users",
    features: [
      "Access to 5 bets per month",
      "Limited messaging",
      "Standard customer support",
      "Monthly newsletter",
    ],
  },
  {
    name: "Premium",
    price: 19.99,
    description: "Advanced features for enthusiasts",
    features: [
      "All Basic features",
      "10 bets per month",
      "Priority customer support",
      "Ad-free experience",
      "Early access to new features",
    ],
  },
  {
    name: "Legend",
    price: 39.99,
    description: "Ultimate experience for professionals",
    features: [
      "All Premium features",
      "Exclusive legendary listings",
      "24/7 concierge support",
      "Personal travel consultant",
      "Custom trip planning",
      "VIP event invitations",
    ],
  },
];

export function PaywallComponent() {
  return (
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
                      <p className="ml-3 text-base text-gray-300">{feature}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto pt-6">
                <Button
                  className={`w-full ${
                    tier.name === "Premium"
                      ? "bg-violet-500 hover:bg-violet-600"
                      : "border-violet-500 text-violet-500 hover:bg-violet-500/10"
                  }`}
                  variant={tier.name === "Premium" ? "default" : "outline"}
                >
                  {tier.name === "Premium" ? "Get Started" : "Choose Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PaywallComponent;
