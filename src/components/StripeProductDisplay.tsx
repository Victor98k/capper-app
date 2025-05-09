"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Plus, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  default_price: {
    id: string;
    recurring: {
      interval?: "day" | "week" | "month" | "year" | null;
      interval_count?: number;
    } | null;
    unit_amount: number;
    currency: string;
    type: "one_time" | "recurring";
  };
  features: Array<{ name: string }>;
}

const MAX_PRODUCTS = 3;

export default function StripeProductDisplay() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/stripe/products", {
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Products fetch error:", errorData);
          throw new Error(errorData.error || "Failed to fetch products");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data);
          setProducts([]);
          return;
        }

        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const openStripeDashboard = async (path: string = "") => {
    try {
      const response = await fetch("/api/stripe/dashboard");
      const data = await response.json();

      if (data.url) {
        // Open in new tab using window.open()
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        // Handle errors with toast notifications
        if (data.error) {
          toast.error(data.error);
        } else {
          toast.error("Unable to access Stripe dashboard");
        }
      }
    } catch (error) {
      console.error("Error opening Stripe dashboard:", error);
      toast.error("Failed to open Stripe dashboard");
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-gray-400">Loading subscription details...</div>
        </CardContent>
      </Card>
    );
  }

  const shouldShowEmptyState = !products || products.length === 0;

  if (shouldShowEmptyState) {
    return (
      <Card className="bg-gray-800 border-gray-700 border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-[400px] space-y-6">
          <div className="p-3 bg-violet-500/10 rounded-full">
            <Plus className="h-8 w-8 text-violet-500" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-xl font-semibold text-white mb-2">
              No Subscription Products Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first subscription product in Stripe to start
              accepting subscribers. Add product tiers with different features
              and pricing.
            </p>
            <div className="space-y-3">
              {products.length < MAX_PRODUCTS ? (
                <Button
                  className="w-full bg-violet-500 hover:bg-violet-600"
                  onClick={() => openStripeDashboard("/products/create")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Product
                </Button>
              ) : (
                <p className="text-sm text-amber-400">
                  Maximum number of products reached (3)
                </p>
              )}
              <Button
                variant="outline"
                className="w-full border-violet-500/20 text-violet-400 hover:bg-violet-500/10"
                onClick={() =>
                  window.open(
                    "https://stripe.com/docs/products-prices/how-products-work",
                    "_blank"
                  )
                }
              >
                Learn About Stripe Products
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          Your current products
        </h2>
        {products.length < MAX_PRODUCTS && (
          <Button
            size="sm"
            className="bg-violet-500 hover:bg-violet-600"
            onClick={() => openStripeDashboard("/products/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => {
          const isMiddleCard = products.length === 3 && index === 1;

          return (
            <div
              key={product.id}
              className={`rounded-xl p-6 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-[1.02]
                ${
                  isMiddleCard
                    ? "bg-gradient-to-br from-violet-600/50 to-violet-900/50 border-2 border-violet-400/50 shadow-[0_0_40px_rgba(139,92,246,0.3)]"
                    : "bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-[#4e43ff]/50"
                }
                ${isMiddleCard ? "lg:-mt-4 lg:p-8" : ""}
                hover:shadow-[0_0_30px_rgba(78,67,255,0.2)]
              `}
            >
              {/* Product Header */}
              <div className="flex justify-between items-start mb-6">
                <h3
                  className={`text-2xl font-bold ${
                    isMiddleCard ? "text-violet-300" : "text-[#4e43ff]"
                  }`}
                >
                  {product.name}
                  {isMiddleCard && (
                    <div className="text-sm font-normal text-violet-300/80 mt-1">
                      Most Popular
                    </div>
                  )}
                </h3>
              </div>

              {/* Price Display */}
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">
                    {product.default_price.unit_amount === 0
                      ? "Free"
                      : `$${(product.default_price.unit_amount / 100).toFixed(2)}`}
                  </span>
                  {product.default_price.unit_amount > 0 && (
                    <span className="ml-2 text-gray-400">
                      /{product.default_price?.recurring?.interval || "month"}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-gray-400">{product.description}</p>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {Array.isArray(product.features) &&
                product.features.length > 0 ? (
                  product.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Zap
                        className={`h-5 w-5 flex-shrink-0 ${
                          isMiddleCard ? "text-violet-300" : "text-[#4e43ff]"
                        }`}
                      />
                      <span className="text-gray-300">{feature.name}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 text-center">
                    No features listed. Add features in your Stripe dashboard.
                  </li>
                )}
              </ul>

              {/* Manage Button */}
              <Button
                className={`w-full ${
                  isMiddleCard
                    ? "bg-violet-500 hover:bg-violet-600 text-white"
                    : "bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                }`}
                onClick={() => openStripeDashboard(`/products/${product.id}`)}
              >
                Manage Product
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
