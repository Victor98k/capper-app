"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { toast } from "sonner";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Product {
  id: string;
  name: string;
  description: string | null;
  default_price: string;
  unit_amount: number;
  currency: string;
  features: string[];
}

function CheckoutButton({
  product,
  capperId,
}: {
  product: Product;
  capperId: string;
}) {
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscription = async () => {
    try {
      setIsLoading(true);
      if (!stripe) throw new Error("Stripe failed to initialize.");

      // Create checkout session with the specific product
      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: product.default_price,
          capperId: capperId,
          productId: product.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

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
      toast.error("Failed to initiate checkout");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full bg-violet-500 hover:bg-violet-600"
      onClick={handleSubscription}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        `Subscribe ${(product.unit_amount / 100).toFixed(2)}/month`
      )}
    </Button>
  );
}

interface PaywallComponentProps {
  productId?: string | null;
  capperId?: string | null;
}

export default function PaywallComponent({
  productId,
  capperId,
}: PaywallComponentProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!capperId) {
          throw new Error("No capper ID provided");
        }

        const response = await fetch(`/api/cappers/${capperId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch capper products");
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [capperId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p>Loading packages...</p>
        </div>
      </div>
    );
  }

  if (error || !capperId) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error || "Invalid capper ID"}</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Choose Your Subscription Package
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              Select the package that best fits your needs
            </p>
          </div>
          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="bg-gray-800 border-gray-700 flex flex-col"
              >
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-white">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-center">
                    <span className="text-5xl font-extrabold text-white">
                      ${(product.unit_amount / 100).toFixed(2)}
                    </span>
                    <span className="text-xl font-medium text-gray-300">
                      /month
                    </span>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {product.features.map((feature) => (
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
                  <CheckoutButton product={product} capperId={capperId} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Elements>
  );
}
