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
import { useQuery } from "@tanstack/react-query";

interface Product {
  id: string;
  name: string;
  description: string;
  unit_amount: number;
  currency: string;
  features: string[];
}

const MAX_PRODUCTS = 3;

export default function StripeProductDisplay() {
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/stripe/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#4e43ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        Failed to load products. Please try again later.
      </div>
    );
  }

  if (!products?.length) {
    return (
      <Card className="bg-[#1a1a1a] border-[#4e43ff]/20">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <p className="text-gray-400 text-center">
            No products found. Create your first product to start accepting
            subscriptions.
          </p>
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
        {products.map((product: Product) => {
          const isMiddleCard =
            products.length === 3 && products.indexOf(product) === 1;

          return (
            <Card
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
                    {product.unit_amount === 0
                      ? "Free"
                      : `$${(product.unit_amount / 100).toFixed(2)}`}
                  </span>
                  {product.unit_amount > 0 && (
                    <span className="ml-2 text-gray-400">
                      {product.currency.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-gray-400">{product.description}</p>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {product.features?.length > 0 ? (
                  product.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Zap
                        className={`h-5 w-5 flex-shrink-0 ${
                          isMiddleCard ? "text-violet-300" : "text-[#4e43ff]"
                        }`}
                      />
                      <span className="text-gray-300">{feature}</span>
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}
