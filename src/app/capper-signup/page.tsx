"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import capperLogo from "@/images/Cappers Logga (1).svg";

function CapperSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      if (!token) {
        console.error("Missing token in URL");
        toast.error("Invalid signup link");
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/verify-capper-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Token verification failed:", error);
          throw new Error("Invalid token");
        }

        setTokenValid(true);
      } catch (error) {
        console.error("Token verification error:", error);
        toast.error("Invalid or expired signup link");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/api/complete-capper-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: searchParams.get("token"),
          password: formData.password,
        }),
      });

      if (response.ok) {
        toast.success("Account setup complete!");
        router.push("/home-capper");
      } else {
        throw new Error("Failed to complete signup");
      }
    } catch (error) {
      toast.error("Failed to complete signup");
    }
  };

  const validatePasswords = (password: string, confirmPassword: string) => {
    if (confirmPassword === "") {
      setPasswordsMatch(true);
      return;
    }
    setPasswordsMatch(password === confirmPassword);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!tokenValid) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-8">
          <Image
            src={capperLogo}
            alt="Capper Logo"
            width={150}
            height={150}
            priority
          />
        </div>
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-white mb-6">
            Complete Your Capper Account Setup
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-white text-sm font-medium mb-2"
              >
                Set Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => {
                  const newPassword = e.target.value;
                  setFormData({ ...formData, password: newPassword });
                  validatePasswords(newPassword, formData.confirmPassword);
                }}
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2"
                required
                minLength={8}
              />
              <p className="text-sm text-gray-400 mt-2">
                Password must contain:
                <ul className="list-disc list-inside">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character (@$!%*?&)</li>
                </ul>
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-white text-sm font-medium mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => {
                  const newConfirmPassword = e.target.value;
                  setFormData({
                    ...formData,
                    confirmPassword: newConfirmPassword,
                  });
                  validatePasswords(formData.password, newConfirmPassword);
                }}
                className={`w-full bg-gray-700 text-white rounded-md px-4 py-2 ${
                  !passwordsMatch && formData.confirmPassword
                    ? "border-2 border-red-500"
                    : ""
                }`}
                required
                minLength={8}
              />
              {!passwordsMatch && formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CapperSignup() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CapperSignupContent />
    </Suspense>
  );
}
