"use client";

import { Suspense } from "react";
import { ResetPassword } from "@/components/reset-password";
import { Loader } from "@/components/ui/loader";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center">
          <Loader size="lg" />
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
