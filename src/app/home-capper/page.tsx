"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CapperDashboard } from "@/components/capperDashboard";

export default function HomeCapper() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  useEffect(() => {
    if (success) {
      // You could show a success toast or message
      console.log("Successfully connected Stripe account!");
    }
    if (refresh) {
      // Handle refresh case
      window.location.reload();
    }
  }, [success, refresh]);

  return <CapperDashboard />;
}
