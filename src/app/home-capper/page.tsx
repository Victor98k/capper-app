"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CapperDashboard } from "@/components/capperDashboard";
import { Suspense } from "react";

function HomeCapperContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  useEffect(() => {
    if (success) {
      console.log("Successfully connected Stripe account!");
    }
    if (refresh) {
      window.location.reload();
    }
  }, [success, refresh]);

  return <CapperDashboard />;
}

export default function HomeCapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeCapperContent />
    </Suspense>
  );
}
