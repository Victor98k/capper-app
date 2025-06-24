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
import {
  Check,
  Plus,
  Loader2,
  Zap,
  Edit2,
  Tag,
  Percent,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  const symbols: { [key: string]: string } = {
    usd: "$",
    eur: "€",
    gbp: "£",
  };
  return symbols[currency.toLowerCase()] || currency.toUpperCase();
};

interface Product {
  id: string;
  name: string;
  description: string;
  unit_amount: number;
  currency: string;
  features: string[];
  hasDiscount?: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountDuration?: "once" | "repeating" | "forever";
  discountDurationInMonths?: number;
  couponId?: string;
  freeCouponId?: string;
  archived?: boolean;
  archivedAt?: string;
  active?: boolean;
}

const MAX_PRODUCTS = 3;

// Helper function to calculate discounted price
const calculateDiscountedPrice = (product: Product) => {
  if (
    !product.hasDiscount ||
    !product.discountValue ||
    product.unit_amount <= 1
  ) {
    return null;
  }

  const originalPrice = product.unit_amount / 100;
  let discountedPrice = originalPrice;

  if (product.discountType === "percentage") {
    discountedPrice = originalPrice * (1 - product.discountValue / 100);
  } else if (product.discountType === "fixed") {
    discountedPrice = Math.max(0, originalPrice - product.discountValue);
  }

  return discountedPrice;
};

// Helper function to format discount text
const getDiscountText = (product: Product) => {
  if (!product.hasDiscount || !product.discountValue) return null;

  const discountText =
    product.discountType === "percentage"
      ? `${product.discountValue}% OFF`
      : `${product.currency.toUpperCase()} ${product.discountValue} OFF`;

  let durationText = "";
  if (product.discountDuration === "once") {
    durationText = "First payment";
  } else if (product.discountDuration === "forever") {
    durationText = "Forever";
  } else if (
    product.discountDuration === "repeating" &&
    product.discountDurationInMonths
  ) {
    durationText = `${product.discountDurationInMonths} month${product.discountDurationInMonths > 1 ? "s" : ""}`;
  }

  return { discountText, durationText };
};

// Add EditProductDialog component
const EditProductDialog = ({
  product,
  onSuccess,
}: {
  product: Product;
  onSuccess: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    price: (product.unit_amount / 100).toString(),
    features: product.features || [],
    newFeature: "",
    currency: product.currency,
    hasDiscount: product.hasDiscount || false,
    discountType: product.discountType || "percentage",
    discountValue: product.discountValue?.toString() || "",
    discountDuration: product.discountDuration || "once",
    discountDurationInMonths:
      product.discountDurationInMonths?.toString() || "3",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/stripe/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          features: formData.features,
          currency: formData.currency,
          hasDiscount: formData.hasDiscount,
          discountType: formData.discountType,
          discountValue: formData.discountValue
            ? parseFloat(formData.discountValue)
            : undefined,
          discountDuration: formData.discountDuration,
          discountDurationInMonths: formData.discountDurationInMonths
            ? parseInt(formData.discountDurationInMonths)
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addFeature = () => {
    if (formData.newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, prev.newFeature.trim()],
        newFeature: "",
      }));
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2"
        >
          <Edit2 className="h-4 w-4" />
          <span>Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px] bg-[#020817] text-white border border-[#4e43ff]/20"
        style={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#4e43ff] to-[#8983ff] bg-clip-text text-transparent">
              Edit Product
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Update your product details and features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-white/90"
                >
                  Product Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Premium Tips Package"
                  className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-white/90"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe what subscribers will get with this product..."
                  className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] min-h-[100px] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="price"
                className="text-sm font-medium text-white/90"
              >
                Price
              </Label>
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="99.99"
                  className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] pl-12 transition-all"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                  {formData.currency.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-white/90">
                  Features
                </Label>
                <span className="text-xs text-white/60">
                  Add features that come with this product
                </span>
              </div>

              <div className="flex gap-2">
                <Input
                  value={formData.newFeature}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      newFeature: e.target.value,
                    }))
                  }
                  placeholder="e.g., Daily premium tips"
                  className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all"
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    e.key === "Enter" && (e.preventDefault(), addFeature())
                  }
                />
                <Button
                  type="button"
                  onClick={addFeature}
                  variant="outline"
                  className="border-[#4e43ff]/40 hover:bg-[#4e43ff]/10 text-white transition-all"
                >
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#1a1a1a] p-3 rounded-lg group hover:bg-[#1a1a1a]/80 transition-all"
                  >
                    <span className="flex-1 text-white/90">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white/90">
                    Discount Type
                  </Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountType: value as "percentage" | "fixed",
                      }))
                    }
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#4e43ff]/20">
                      <SelectItem
                        value="percentage"
                        className="text-white hover:bg-[#4e43ff]/10"
                      >
                        Percentage Off
                      </SelectItem>
                      <SelectItem
                        value="fixed"
                        className="text-white hover:bg-[#4e43ff]/10"
                      >
                        Fixed Amount Off
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white/90">
                    Discount Value
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max={
                        formData.discountType === "percentage"
                          ? "100"
                          : undefined
                      }
                      step={
                        formData.discountType === "percentage" ? "1" : "0.01"
                      }
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountValue: e.target.value,
                        }))
                      }
                      placeholder={
                        formData.discountType === "percentage" ? "25" : "10.00"
                      }
                      className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] pr-8 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                      {formData.discountType === "percentage"
                        ? "%"
                        : getCurrencySymbol(formData.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-white/90">
                  Discount Duration
                </Label>
                <Select
                  value={formData.discountDuration}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountDuration: value as
                        | "once"
                        | "repeating"
                        | "forever",
                    }))
                  }
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#4e43ff]/20">
                    <SelectItem
                      value="once"
                      className="text-white hover:bg-[#4e43ff]/10"
                    >
                      First Payment Only
                    </SelectItem>
                    <SelectItem
                      value="repeating"
                      className="text-white hover:bg-[#4e43ff]/10"
                    >
                      Limited Time
                    </SelectItem>
                    <SelectItem
                      value="forever"
                      className="text-white hover:bg-[#4e43ff]/10"
                    >
                      Forever
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.discountDuration === "repeating" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white/90">
                    Duration (Months)
                  </Label>
                  <Select
                    value={formData.discountDurationInMonths}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountDurationInMonths: value,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#4e43ff]/20">
                      <SelectItem
                        value="1"
                        className="text-white hover:bg-[#4e43ff]/10"
                      >
                        1 Month
                      </SelectItem>
                      <SelectItem
                        value="3"
                        className="text-white hover:bg-[#4e43ff]/10"
                      >
                        3 Months
                      </SelectItem>
                      <SelectItem
                        value="6"
                        className="text-white hover:bg-[#4e43ff]/10"
                      >
                        6 Months
                      </SelectItem>
                      <SelectItem
                        value="12"
                        className="text-white hover:bg-[#4e43ff]/10"
                      >
                        12 Months
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-[#4e43ff]/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-[#4e43ff]/40 hover:bg-[#4e43ff]/10 text-white transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white shadow-lg hover:shadow-[#4e43ff]/25 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function StripeProductDisplay() {
  const [showArchived, setShowArchived] = useState(false);
  const [archiveDialogProductId, setArchiveDialogProductId] = useState<
    string | null
  >(null);

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", showArchived],
    queryFn: async () => {
      const response = await fetch(
        `/api/stripe/products?archived=${showArchived}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

  const queryClient = useQueryClient();

  const archiveProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/stripe/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to archive product");
      }

      toast.success("Product archived successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to archive product"
      );
    }
  };

  const restoreProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/stripe/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "restore" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore product");
      }

      toast.success("Product restored successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to restore product"
      );
    }
  };

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
      <div className="space-y-4">
        {/* Toggle for archived products */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {showArchived ? "Archived Products" : "Active Products"}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="bg-[#1a1a1a] border-[#4e43ff]/20 text-white hover:bg-[#4e43ff]/10"
          >
            {showArchived ? "Show Active" : "Show Archived"}
          </Button>
        </div>

        <Card className="bg-[#1a1a1a] border-[#4e43ff]/20">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-gray-400 text-center">
              {showArchived
                ? "No archived products found."
                : "No products found. Create your first product to start accepting subscriptions."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Archive Confirmation Dialog */}
      <Dialog
        open={!!archiveDialogProductId}
        onOpenChange={(open) => !open && setArchiveDialogProductId(null)}
      >
        <DialogContent className="bg-[#020817] text-white border border-[#4e43ff]/20">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this product? This action can be
              undone from the archived products tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialogProductId(null)}
              className="border-[#4e43ff]/40 hover:bg-[#4e43ff]/10 text-white transition-all"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (archiveDialogProductId) {
                  archiveProduct(archiveDialogProductId);
                  setArchiveDialogProductId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Archive Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Toggle for archived products */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          {showArchived
            ? `Archived Products (${products.length})`
            : `Active Products (${products.length})`}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className="bg-[#1a1a1a] border-[#4e43ff]/20 text-white hover:bg-[#4e43ff]/10"
        >
          {showArchived ? "Show Active" : "Show Archived"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: Product) => {
          const isMiddleCard =
            products.length === 3 && products.indexOf(product) === 1;
          const discountedPrice = calculateDiscountedPrice(product);
          const discountInfo = getDiscountText(product);

          return (
            <Card
              key={product.id}
              className={`rounded-xl p-6 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-[1.02] flex flex-col relative
                ${
                  product.archived
                    ? "bg-gray-600/50 border border-gray-500/50 opacity-80"
                    : isMiddleCard
                      ? "bg-[#4e43ff] border-2 border-white/20 shadow-[0_0_30px_rgba(78,67,255,0.2)]"
                      : "bg-[#4e43ff] border border-white/20 hover:border-white/30"
                }
                ${isMiddleCard && !product.archived ? "lg:-mt-4 lg:p-8" : ""}
                ${!product.archived ? "hover:shadow-[0_0_30px_rgba(78,67,255,0.2)]" : ""}
              `}
            >
              {/* Archive Badge */}
              {product.archived && (
                <div className="absolute -top-3 -right-3 z-10">
                  <div className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    Archived
                  </div>
                </div>
              )}

              {/* Discount Badge */}
              {product.hasDiscount && discountInfo && !product.archived && (
                <div className="absolute -top-3 -right-3 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {discountInfo.discountText}
                  </div>
                </div>
              )}

              <div className="flex-1">
                {/* Product Header */}
                <div className="flex justify-between items-start mb-6">
                  <h3
                    className={`text-2xl font-bold ${
                      product.archived ? "text-gray-300" : "text-white"
                    }`}
                  >
                    {product.name}
                    {isMiddleCard && !product.archived && (
                      <div className="text-sm font-normal text-white/80 mt-1">
                        Most Popular
                      </div>
                    )}
                  </h3>
                  {!product.archived && (
                    <EditProductDialog
                      product={product}
                      onSuccess={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["products"],
                        });
                      }}
                    />
                  )}
                </div>

                {/* Price Display */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    {product.unit_amount <= 1 ? (
                      <span
                        className={`text-4xl font-bold ${product.archived ? "text-gray-300" : "text-white"}`}
                      >
                        Free
                      </span>
                    ) : (
                      <>
                        {discountedPrice !== null ? (
                          <>
                            <span
                              className={`text-4xl font-bold ${product.archived ? "text-gray-300" : "text-white"}`}
                            >
                              ${discountedPrice.toFixed(2)}
                            </span>
                            <span
                              className={`text-xl line-through ${product.archived ? "text-gray-400" : "text-white/60"}`}
                            >
                              ${(product.unit_amount / 100).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span
                            className={`text-4xl font-bold ${product.archived ? "text-gray-300" : "text-white"}`}
                          >
                            ${(product.unit_amount / 100).toFixed(2)}
                          </span>
                        )}
                        <span
                          className={`ml-2 ${product.archived ? "text-gray-400" : "text-white/80"}`}
                        >
                          {product.currency.toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Discount Duration Info */}
                  {product.hasDiscount &&
                    discountInfo?.durationText &&
                    !product.archived && (
                      <div className="mt-2 flex items-center gap-2">
                        <Percent className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-red-200 font-medium">
                          {discountInfo.durationText}
                        </span>
                      </div>
                    )}

                  <p
                    className={`mt-2 ${product.archived ? "text-gray-400" : "text-white/80"}`}
                  >
                    {product.description}
                  </p>

                  {/* Archived date */}
                  {product.archived && product.archivedAt && (
                    <p className="mt-2 text-sm text-gray-500">
                      Archived on{" "}
                      {new Date(product.archivedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {product.features?.length > 0 ? (
                    product.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Zap
                          className={`h-5 w-5 flex-shrink-0 ${product.archived ? "text-gray-400" : "text-white"}`}
                        />
                        <span
                          className={
                            product.archived ? "text-gray-400" : "text-white/90"
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li
                      className={`text-center ${product.archived ? "text-gray-500" : "text-white/80"}`}
                    >
                      No features listed. Add features in your Stripe dashboard.
                    </li>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {product.archived ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => restoreProduct(product.id)}
                  >
                    Restore Product
                  </Button>
                ) : (
                  <>
                    <Button
                      className={`w-full ${
                        isMiddleCard
                          ? "bg-white/20 hover:bg-white/25 text-white"
                          : "bg-white/20 hover:bg-white/25 text-white"
                      }`}
                      onClick={() =>
                        openStripeDashboard(`/products/${product.id}`)
                      }
                    >
                      Manage Product
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-red-600/20 border-red-500/50 text-red-200 hover:bg-red-600/30 hover:border-red-500"
                      onClick={() => setArchiveDialogProductId(product.id)}
                    >
                      Archive Product
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
