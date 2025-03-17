"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";
import capperLogo from "@/images/Cappers Logga (1).svg";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
    description: string;
  } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setAlert({
        type: "error",
        message: "Passwords do not match",
        description: "Please ensure both passwords are identical",
      });
      return;
    }

    if (password.length < 7 || !/[A-Z]/.test(password)) {
      setAlert({
        type: "error",
        message: "Invalid Password",
        description:
          "Password must be at least 7 characters and contain an uppercase letter",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: "success",
          message: "Password Reset Successful",
          description:
            "Your password has been reset. You can now log in with your new password.",
        });

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setAlert({
          type: "error",
          message: "Reset Failed",
          description:
            data.error || "Failed to reset password. Please try again.",
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: "Reset Failed",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side with video */}
      <div className="hidden md:block w-1/2 relative">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/capperLoginVid.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Right side with reset form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4 md:p-8">
        <img
          src={capperLogo.src}
          alt="Cappers Logo"
          className="w-32 md:w-48 mb-6"
        />

        {alert && (
          <Alert
            className={`mb-4 w-full max-w-[calc(100%-2rem)] md:max-w-sm ${
              alert.type === "error"
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            <AlertTitle>{alert.message}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full max-w-[calc(100%-2rem)] md:max-w-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-center text-sm">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#4e43ff] text-white hover:bg-[#3d35cc]"
                disabled={isLoading}
              >
                {isLoading ? <Loader size="sm" /> : "Reset Password"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-muted-foreground"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
