"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  PieChart,
  Settings,
  Terminal,
  Users,
  CheckCircle,
  PlusCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DisplayCapperCard from "./displayCapperCard";
import { SideNav } from "./SideNavCappers";
import StripeConnectOnboarding from "./StripeConnectOnboarding";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StripeProductDisplay from "./StripeProductDisplay";
import Loader from "@/components/Loader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Add CreateProductDialog component
const CreateProductDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    packageType: "one_time",
    interval: "week",
    features: [] as string[],
    newFeature: "",
    currency: "eur",
  });
  const [isFree, setIsFree] = useState(false);

  // Add query for Stripe account data
  const { data: stripeAccountData } = useQuery({
    queryKey: ["stripeAccountData"],
    queryFn: async () => {
      const response = await fetch("/api/stripe/account-data");
      if (!response.ok) {
        throw new Error("Failed to fetch Stripe account data");
      }
      return response.json();
    },
  });

  // Add supported currencies
  const supportedCurrencies = [
    { value: "eur", label: "EUR (€)" },
    { value: "usd", label: "USD ($)" },
    { value: "gbp", label: "GBP (£)" },
    { value: "sek", label: "SEK (kr)" },
    { value: "nok", label: "NOK (kr)" },
    { value: "dkk", label: "DKK (kr)" },
  ];

  useEffect(() => {
    // Set initial currency from Stripe account if available
    if (stripeAccountData?.defaultCurrency) {
      setFormData((prev) => ({
        ...prev,
        currency: stripeAccountData.defaultCurrency.toLowerCase(),
      }));
    }
  }, [stripeAccountData?.defaultCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: isFree ? 0 : parseFloat(formData.price),
          packageType: formData.packageType,
          interval: formData.interval,
          features: formData.features,
          currency: formData.currency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }

      toast.success("Product created successfully!");
      setIsOpen(false);
      onSuccess();

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        packageType: "one_time",
        interval: "week",
        features: [],
        newFeature: "",
        currency: stripeAccountData?.defaultCurrency?.toLowerCase() || "eur",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create product"
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

  const getCurrencySymbol = (currencyCode: string) => {
    try {
      return (
        new Intl.NumberFormat("en", {
          style: "currency",
          currency: currencyCode,
        })
          .formatToParts()
          .find((part) => part.type === "currency")?.value ||
        currencyCode.toUpperCase()
      );
    } catch (error) {
      return currencyCode.toUpperCase();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 transition-all duration-200 shadow-lg hover:shadow-[#4e43ff]/25">
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Product
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px] bg-[#020817] text-white border border-[#4e43ff]/20"
        style={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-4 pb-6 border-b border-[#4e43ff]/10">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#4e43ff] to-[#8983ff] bg-clip-text text-transparent">
              Create New Product
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Create a new subscription product that your followers can
              subscribe to. Make it compelling!
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
                  onChange={(e) =>
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
                  onChange={(e) =>
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
                htmlFor="isFree"
                className="text-sm font-medium text-white/90"
              >
                Free
              </Label>
              <Button
                type="button"
                onClick={() => setIsFree(!isFree)}
                className={`mt-2 bg-${isFree ? "[#4e43ff]" : "[#1a1a1a]"} text-white hover:bg-${isFree ? "[#4e43ff]/90" : "[#4e43ff]/10"} transition-all`}
              >
                {isFree ? "Unset Free" : "Set as Free"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="99.99"
                    className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] pl-12 transition-all"
                    required
                    disabled={isFree}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                    {getCurrencySymbol(formData.currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="currency"
                  className="text-sm font-medium text-white/90"
                >
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#4e43ff]/20">
                    {supportedCurrencies.map((currency) => (
                      <SelectItem
                        key={currency.value}
                        value={currency.value}
                        className="text-white hover:bg-[#4e43ff]/10"
                      >
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="packageType"
                  className="text-sm font-medium text-white/90"
                >
                  Package Type
                </Label>
                <Select
                  value={formData.packageType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, packageType: value }))
                  }
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#4e43ff]/20">
                    <SelectItem
                      value="one_time"
                      className="text-white hover:bg-[#4e43ff]/10"
                    >
                      One-time Package
                    </SelectItem>
                    <SelectItem
                      value="recurring"
                      className="text-white hover:bg-[#4e43ff]/10"
                    >
                      Recurring Subscription
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="interval"
                  className="text-sm font-medium text-white/90"
                >
                  {formData.packageType === "one_time"
                    ? "Access Duration"
                    : "Billing Interval"}
                </Label>
                <Select
                  value={formData.interval}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, interval: value }))
                  }
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#4e43ff]/20">
                    {formData.packageType === "one_time" ? (
                      <>
                        <SelectItem
                          value="week"
                          className="text-white hover:bg-[#4e43ff]/10"
                        >
                          1 Week Access
                        </SelectItem>
                        <SelectItem
                          value="month"
                          className="text-white hover:bg-[#4e43ff]/10"
                        >
                          1 Month Access
                        </SelectItem>
                        <SelectItem
                          value="year"
                          className="text-white hover:bg-[#4e43ff]/10"
                        >
                          1 Year Access
                        </SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem
                          value="week"
                          className="text-white hover:bg-[#4e43ff]/10"
                        >
                          Weekly Billing
                        </SelectItem>
                        <SelectItem
                          value="month"
                          className="text-white hover:bg-[#4e43ff]/10"
                        >
                          Monthly Billing
                        </SelectItem>
                        <SelectItem
                          value="year"
                          className="text-white hover:bg-[#4e43ff]/10"
                        >
                          Yearly Billing
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-400 mt-1">
                  {formData.packageType === "one_time"
                    ? "Customers will have access for the selected duration"
                    : "Customers will be billed at the selected interval"}
                </p>
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newFeature: e.target.value,
                    }))
                  }
                  placeholder="e.g., Daily premium tips"
                  className="bg-[#1a1a1a] border-[#4e43ff]/20 focus:border-[#4e43ff] focus:ring-1 focus:ring-[#4e43ff] transition-all"
                  onKeyPress={(e) =>
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
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export function CapperDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [dashboardCache, setDashboardCache] = useState<{
    url: string;
    timestamp: number;
  } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Add searchParams to check for success parameter
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  const queryClient = useQueryClient();

  // Convert checkStripeStatus to a fetch function
  const fetchStripeStatus = async () => {
    const response = await fetch("/api/stripe/connect", {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch Stripe status");
    }

    const data = await response.json();
    return data;
  };

  // Use React Query to manage the Stripe status
  const { data: stripeStatus, refetch: refetchStripeStatus } = useQuery({
    queryKey: ["stripeStatus", user?.id],
    queryFn: fetchStripeStatus,
    enabled: !!user?.isCapper && !loading, // Only run query if user is a capper
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Handle success parameter
  useEffect(() => {
    if (success === "true" && user?.isCapper) {
      refetchStripeStatus();
    }
  }, [success, user?.isCapper, refetchStripeStatus]);

  // Update useEffect to fetch tags as well
  useEffect(() => {
    const fetchCapperProfile = async () => {
      if (user?.id) {
        try {
          const response = await fetch("/api/cappers");
          const data = await response.json();
          const capperData = data.find((c: any) => c.userId === user.id);
          if (capperData) {
            setBio(capperData.bio || "");
            setTags(capperData.tags || []);
            setUsername(capperData.user.username || "");
          }
        } catch (error) {
          console.error("Failed to fetch capper profile:", error);
        }
      }
    };

    fetchCapperProfile();
  }, [user?.id]);

  // Add this inside your CapperDashboard component
  const { data: stripeAccountData, isLoading: isLoadingStripeData } = useQuery({
    queryKey: ["stripeAccountData"],
    queryFn: async () => {
      const response = await fetch("/api/stripe/account-data");
      if (!response.ok) {
        throw new Error("Failed to fetch Stripe account data");
      }
      const data = await response.json();
      console.log("Stripe Account Data from API:", data);
      return data;
    },
    enabled: !!stripeStatus?.onboarded,
  });

  const openStripeDashboard = async () => {
    try {
      // Check cache first
      if (
        dashboardCache &&
        Date.now() - dashboardCache.timestamp < CACHE_DURATION
      ) {
        window.open(dashboardCache.url, "_blank");
        return;
      }

      const response = await fetch("/api/stripe/connect", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (data.url) {
        // Cache the URL
        setDashboardCache({
          url: data.url,
          timestamp: Date.now(),
        });
        window.open(data.url, "_blank");
      } else {
        switch (data.code) {
          case "NO_STRIPE_ACCOUNT":
            toast.error("You need to connect your Stripe account first");
            break;
          case "ONBOARDING_INCOMPLETE":
            toast.error("Please complete your Stripe account setup first");
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
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <SideNav />
        <div className="flex-1">
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  // Redirect non-cappers
  if (!user?.isCapper) {
    router.push("/home");
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        localStorage.clear(); // Only clear localStorage in browser environment
      }
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleBioUpdate = async () => {
    try {
      if (!user?.id) return;

      const response = await fetch(`/api/cappers/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: bio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update bio");
      }

      const data = await response.json();
      setIsEditingBio(false);
    } catch (error) {
      console.error("Failed to update bio:", error);
      // Optionally add user feedback here
    }
  };

  const handleAddTag = async () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      try {
        const response = await fetch("/api/cappers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user?.id,
            tags: [newTag.trim()],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Only update UI after successful API call
        setTags([...tags, newTag.trim()]);
        setNewTag("");
      } catch (error) {
        console.error("Failed to add tag:", error);
      }
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const response = await fetch("/api/cappers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          tagToRemove,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Only update UI after successful API call
      setTags(tags.filter((tag) => tag !== tagToRemove));
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      const response = await fetch("/api/cappers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to update username:", data.error);
        return;
      }

      setIsEditingUsername(false);
    } catch (error) {
      console.error("Failed to update username:", error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#020817] relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-[#4e43ff]/40 rounded-full filter blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/40 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500/40 rounded-full filter blur-3xl opacity-30" />

        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px]"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent, black, transparent)",
          }}
        />
      </div>

      <SideNav />
      <div className="flex-1 relative z-10">
        <header className="bg-[#020817]/50 backdrop-blur-sm shadow px-4 md:pl-16 lg:pl-0">
          <div className="max-w-7xl mx-auto pt-6 md:pt-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white break-words pl-12 md:pl-0">
              Dashboard Overview
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
          <div className="py-4 md:py-6">
            {user?.isCapper && !stripeStatus?.onboarded && (
              <div className="mb-4 md:mb-6">
                <div className="bg-gradient-to-r from-[#4e43ff] to-[#1a1245] rounded-lg p-4 md:p-8 text-white">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Welcome to Your Capper Journey! 🎉
                  </h2>
                  <p className="text-base md:text-lg mb-6">
                    You're just a few steps away from starting your journey as a
                    professional capper. Let's get your account set up so you
                    can start sharing your insights and earning!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Users className="h-6 w-6" />
                          Build Your Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Create your unique identity and showcase your
                          expertise
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <PieChart className="h-6 w-6" />
                          Track Your Success
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Monitor your performance and grow your following</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Terminal className="h-6 w-6" />
                          Start Earning
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Connect with Stripe to receive payments from
                          subscribers
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center px-4 md:px-0">
                    <StripeConnectOnboarding
                      isOnboarded={false}
                      className="w-full md:w-auto bg-white text-purple-600 hover:bg-gray-100 transition-colors px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg"
                    />
                    <p className="mt-4 text-sm opacity-80 px-2 md:px-4">
                      By connecting with Stripe, you'll be able to receive
                      payments securely and manage your earnings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user?.isCapper && stripeStatus?.onboarded && (
              <div className="mb-4 md:mb-6">
                <div className="bg-gradient-to-r from-[#4e43ff] to-[#1a1245] rounded-xl p-4 md:p-8 text-white mb-4 md:mb-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 md:mb-8 border-b border-white/10 pb-6">
                    <div className="bg-white/10 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-left mb-2">
                        Stripe Account Connected
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 md:gap-x-6 text-sm">
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
                          <span className="text-gray-200">Payouts:</span>
                          <span
                            className={
                              stripeAccountData?.payoutEnabled
                                ? "text-green-400 font-medium"
                                : "text-red-400 font-medium"
                            }
                          >
                            {stripeAccountData?.payoutEnabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
                          <span className="text-gray-200">Charges:</span>
                          <span
                            className={
                              stripeAccountData?.chargesEnabled
                                ? "text-green-400 font-medium"
                                : "text-red-400 font-medium"
                            }
                          >
                            {stripeAccountData?.chargesEnabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                        {stripeAccountData?.defaultCurrency && (
                          <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
                            <span className="text-gray-200">Currency:</span>
                            <span className="text-white uppercase font-medium">
                              {stripeAccountData.defaultCurrency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Available Balance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeData ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-300">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-2xl font-bold">
                              $
                              {stripeAccountData?.totalBalance?.toFixed(2) ||
                                "0.00"}
                            </p>
                            <p className="text-sm text-gray-300">
                              Ready to be paid out
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Active Subscribers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeData ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-300">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-2xl font-bold">
                              {stripeAccountData?.subscriptions?.total || 0}
                            </p>
                            <p className="text-sm text-gray-300">
                              Current subscribers
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Monthly Revenue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeData ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-300">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-2xl font-bold">
                              $
                              {stripeAccountData?.subscriptions?.monthlyRecurringRevenue?.toFixed(
                                2
                              ) || "0.00"}
                            </p>
                            <p className="text-sm text-gray-300">
                              Recurring revenue
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-lg border-none">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Payout</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeData ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-300">Loading...</span>
                          </div>
                        ) : (
                          <>
                            {stripeAccountData?.recentPayouts?.[0] ? (
                              <>
                                <p className="text-2xl font-bold">
                                  $
                                  {stripeAccountData.recentPayouts[0].amount.toFixed(
                                    2
                                  )}
                                </p>
                                <p className="text-sm text-gray-300">
                                  {new Date(
                                    stripeAccountData.recentPayouts[0]
                                      .arrivalDate * 1000
                                  ).toLocaleDateString()}
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-300">No recent payouts</p>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-black/20 rounded-xl p-4 md:p-6 space-y-4 md:space-y-0">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base md:text-lg">
                        Manage Your Account
                      </h3>
                      <p className="text-sm text-gray-300">
                        Access your Stripe dashboard to manage payments and
                        settings
                      </p>
                    </div>
                    <Button
                      onClick={openStripeDashboard}
                      className="w-full md:w-auto bg-white text-purple-600 hover:bg-gray-100 transition-colors px-4 md:px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl text-center"
                    >
                      Manage Stripe Account
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      Your Products
                    </h2>
                    <CreateProductDialog
                      onSuccess={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["products"],
                        });
                      }}
                    />
                  </div>
                  <StripeProductDisplay />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
export default CapperDashboard;
