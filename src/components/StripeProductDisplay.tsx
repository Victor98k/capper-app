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
import { Check, Plus, Loader2 } from "lucide-react";
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
  marketing_features: string[];
}

const MAX_PRODUCTS = 3;

export default function StripeProductDisplay() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/stripe/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        // Take only the first 3 products if somehow more are returned
        setProducts(data.slice(0, MAX_PRODUCTS));
        setError(null);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch products"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // console.log("Current products state:", products);

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
  console.log("Showing empty state:", shouldShowEmptyState, {
    productsExists: !!products,
    productsLength: products?.length,
  });

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
        <h2 className="text-xl font-semibold text-black">Your Products</h2>
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
        {products.map((product) => {
          console.log("Rendering product:", product);
          return (
            <Card
              key={product.id}
              className="bg-gray-800 border-gray-700 flex flex-col"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-white flex justify-between items-center">
                  {product.name}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-extrabold text-white">
                    {product.default_price.unit_amount === 0
                      ? "Free"
                      : new Intl.NumberFormat("en-US", {
                          style: "decimal",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(product.default_price.unit_amount / 100)}
                  </span>
                  {product.default_price.unit_amount > 0 && (
                    <>
                      <span className="text-sm font-medium text-gray-400 mt-1">
                        {product.default_price.currency.toUpperCase()}
                      </span>
                      <span className="text-xl font-medium text-gray-300">
                        {
                          product.default_price?.type === "one_time"
                            ? " one-time"
                            : product.default_price?.recurring?.interval
                            ? `/${product.default_price.recurring.interval}`
                            : "/month" // fallback to /month if no interval specified
                        }
                        {product.default_price?.recurring?.interval_count &&
                        product.default_price.recurring.interval_count > 1
                          ? ` (${product.default_price.recurring.interval_count} ${product.default_price.recurring.interval}s)`
                          : ""}
                      </span>
                    </>
                  )}
                </div>
                <ul className="mt-8 space-y-4">
                  {Array.isArray(product.marketing_features) &&
                  product.marketing_features.length > 0 ? (
                    product.marketing_features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <Check className="h-6 w-6 text-green-400" />
                        </div>
                        <p className="ml-3 text-base text-gray-300">
                          {feature}
                        </p>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-center">
                      No features listed. Add features in your Stripe dashboard.
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto pt-6">
                <Button
                  className="w-full bg-violet-500 hover:bg-violet-600"
                  onClick={() => openStripeDashboard(`/products/${product.id}`)}
                >
                  Manage Product
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
