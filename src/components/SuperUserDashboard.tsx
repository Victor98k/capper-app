"use client";

import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "./SideNavCappers";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

interface CapperApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  sport: string;
  experience: string;
  monthlyBetAmount: string;
  yearlyROI: string;
  status: string;
  roiVerificationImages?: string[];
}

interface BetValidation {
  id: string;
  game: string;
  amount: number;
  odds: number;
  units: number;
  date: string;
  status: "PENDING" | "WON" | "LOST";
  createdAt: string;
  updatedAt: string;
  userId: string;
  oddsScreenshot: string | null;
  oddsDate: string | null;
  userInfo: {
    username: string;
    firstName: string;
    lastName: string;
  };
  postInfo: {
    title: string;
    bets: string[];
    odds: number[];
    units: number;
    bookmaker: string;
    capper: string;
  };
}

interface StripeAccount {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
}

export function SuperUserDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CapperApplication[]>([]);
  const [betsToValidate, setBetsToValidate] = useState<BetValidation[]>([]);
  const [stripeAccounts, setStripeAccounts] = useState<StripeAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "applications" | "bets" | "stripe"
  >("applications");

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    } else if (activeTab === "bets") {
      fetchBetsToValidate();
    } else if (activeTab === "stripe") {
      fetchStripeAccounts();
    }
  }, [activeTab]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/capper-applications");
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        toast.error("Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Error loading applications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBetsToValidate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/bets/pending");
      if (response.ok) {
        const data = await response.json();
        setBetsToValidate(data);
      } else {
        toast.error("Failed to fetch bets");
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
      toast.error("Error loading bets");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStripeAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users/stripe-accounts");
      if (response.ok) {
        const data = await response.json();
        setStripeAccounts(data);
      } else {
        toast.error("Failed to fetch Stripe accounts");
      }
    } catch (error) {
      console.error("Error fetching Stripe accounts:", error);
      toast.error("Error loading Stripe accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (applicationId: string) => {
    try {
      const loadingToast = toast.loading("Processing application...");

      const response = await fetch("/api/capper-applications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          status: "APPROVED",
        }),
        credentials: "include",
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      toast.success("Application approved!", {
        description:
          "An email has been sent to the applicant with further instructions.",
      });

      fetchApplications();
    } catch (error) {
      console.error("Error accepting application:", error);
      toast.error("Failed to approve application", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleDeny = async (applicationId: string) => {
    try {
      const loadingToast = toast.loading("Processing application...");

      const response = await fetch("/api/capper-applications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          status: "REJECTED",
        }),
        credentials: "include",
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      toast.success("Application rejected", {
        description: "An email has been sent to notify the applicant.",
      });

      fetchApplications();
    } catch (error) {
      console.error("Error denying application:", error);
      toast.error("Failed to reject application", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleBetValidation = async (betId: string, status: "WON" | "LOST") => {
    try {
      const loadingToast = toast.loading("Processing bet validation...");

      const response = await fetch(`/api/bets/${betId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      toast.success(`Bet marked as ${status.toLowerCase()}!`);
      fetchBetsToValidate();
    } catch (error) {
      console.error("Error validating bet:", error);
      toast.error("Failed to validate bet", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleDeleteStripeAccount = async (userId: string) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this Stripe account? This action cannot be undone."
      );

      if (!confirmed) return;

      const loadingToast = toast.loading("Deleting Stripe account...");

      const response = await fetch("/api/stripe/account/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      toast.success("Stripe account deleted successfully");
      fetchStripeAccounts(); // Refresh the list
    } catch (error) {
      console.error("Error deleting Stripe account:", error);
      toast.error("Failed to delete Stripe account", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  if (!user?.isSuperUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <SideNav />
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        style={{
          zIndex: 9999,
          position: "fixed",
          top: "20px",
          right: "20px",
        }}
      />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Super User Dashboard
        </h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "applications"
                ? "bg-[#4e43ff] text-white"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-800"
            }`}
          >
            Capper Applications
          </button>
          <button
            onClick={() => setActiveTab("bets")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "bets"
                ? "bg-[#4e43ff] text-white"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-800"
            }`}
          >
            Bet Validation
          </button>
          <button
            onClick={() => setActiveTab("stripe")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "stripe"
                ? "bg-[#4e43ff] text-white"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-800"
            }`}
          >
            Stripe Accounts
          </button>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm">
          {activeTab === "applications" ? (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Capper Applications
              </h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white">Loading applications...</div>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">No applications found</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead className="text-gray-300 border-b border-gray-700">
                      <tr>
                        <th className="py-3 px-4 text-left">Name</th>
                        <th className="py-3 px-4 text-left">Username</th>
                        <th className="py-3 px-4 text-left">Email</th>
                        <th className="py-3 px-4 text-left">Sport</th>
                        <th className="py-3 px-4 text-left">Experience</th>
                        <th className="py-3 px-4 text-left">Monthly Bets</th>
                        <th className="py-3 px-4 text-left">ROI</th>
                        <th className="py-3 px-4 text-left">
                          ROI Verification
                        </th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((application) => (
                        <tr
                          key={application.id}
                          className="border-b border-gray-700/50"
                        >
                          <td className="py-3 px-4">
                            {application.firstName} {application.lastName}
                          </td>
                          <td className="py-3 px-4">{application.username}</td>
                          <td className="py-3 px-4">{application.email}</td>
                          <td className="py-3 px-4">{application.sport}</td>
                          <td className="py-3 px-4">
                            {application.experience}
                          </td>
                          <td className="py-3 px-4">
                            {application.monthlyBetAmount}
                          </td>
                          <td className="py-3 px-4">{application.yearlyROI}</td>
                          <td className="py-3 px-4">
                            {application.roiVerificationImages?.length ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    View Images (
                                    {application.roiVerificationImages.length})
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <div className="grid grid-cols-2 gap-4 p-4">
                                    {application.roiVerificationImages.map(
                                      (url, index) => (
                                        <div key={index} className="relative">
                                          <img
                                            src={url}
                                            alt={`ROI Verification ${index + 1}`}
                                            className="w-full rounded-lg"
                                          />
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm hover:bg-black/70"
                                          >
                                            Open Full Size
                                          </a>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-gray-400">No images</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                application.status === "PENDING"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : application.status === "APPROVED"
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {application.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAccept(application.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded-md mr-2 hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={application.status !== "PENDING"}
                              >
                                {application.status === "APPROVED"
                                  ? "Approved"
                                  : "Accept"}
                              </button>
                              <button
                                onClick={() => handleDeny(application.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={application.status !== "PENDING"}
                              >
                                {application.status === "REJECTED"
                                  ? "Rejected"
                                  : "Reject"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === "bets" ? (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Pending Bets
              </h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white">Loading bets...</div>
                </div>
              ) : betsToValidate.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">No pending bets found</div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {betsToValidate.map((bet) => (
                    <div key={bet.id} className="bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-8 flex-1">
                          <div className="min-w-[200px]">
                            <h3 className="font-medium text-white">
                              {bet.postInfo.title}
                            </h3>
                            <p className="text-gray-400">
                              By {bet.postInfo.capper}
                            </p>
                          </div>
                          <div className="flex gap-6 text-base">
                            <div className="bg-gray-700/50 px-4 py-2 rounded">
                              <span className="text-gray-400 font-medium">
                                Bets:
                              </span>{" "}
                              <span className="text-white">
                                {bet.postInfo.bets.join(", ")}
                              </span>
                            </div>
                            <div className="bg-gray-700/50 px-4 py-2 rounded">
                              <span className="text-gray-400 font-medium">
                                Odds:
                              </span>{" "}
                              <span className="text-white">
                                {bet.postInfo.odds.join(", ")}
                              </span>
                            </div>
                            <div className="bg-gray-700/50 px-4 py-2 rounded">
                              <span className="text-gray-400 font-medium">
                                Bookmaker:
                              </span>{" "}
                              <span className="text-white">
                                {bet.postInfo.bookmaker}
                              </span>
                            </div>
                            <div className="bg-gray-700/50 px-4 py-2 rounded">
                              <span className="text-gray-400 font-medium">
                                Units:
                              </span>{" "}
                              <span className="text-white">{bet.units}</span>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  See Screenshot
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <img
                                  src={bet.oddsScreenshot || ""}
                                  alt="Odds verification"
                                  className="w-full rounded-lg"
                                />
                                <p className="text-sm text-gray-400 mt-2">
                                  Date:{" "}
                                  {bet.oddsDate
                                    ? new Date(
                                        bet.oddsDate
                                      ).toLocaleDateString()
                                    : "No date"}
                                </p>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBetValidation(bet.id, "WON")}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                          >
                            Won
                          </button>
                          <button
                            onClick={() => handleBetValidation(bet.id, "LOST")}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                          >
                            Lost
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Stripe Connected Accounts
              </h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white">Loading Stripe accounts...</div>
                </div>
              ) : stripeAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">No Stripe accounts found</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead className="text-gray-300 border-b border-gray-700">
                      <tr>
                        <th className="py-3 px-4 text-left">Name</th>
                        <th className="py-3 px-4 text-left">Username</th>
                        <th className="py-3 px-4 text-left">Email</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Payouts</th>
                        <th className="py-3 px-4 text-left">Charges</th>
                        <th className="py-3 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stripeAccounts.map((account) => (
                        <tr
                          key={account.id}
                          className="border-b border-gray-700/50"
                        >
                          <td className="py-3 px-4">
                            {account.firstName} {account.lastName}
                          </td>
                          <td className="py-3 px-4">{account.username}</td>
                          <td className="py-3 px-4">{account.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                account.detailsSubmitted
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-yellow-500/20 text-yellow-300"
                              }`}
                            >
                              {account.detailsSubmitted
                                ? "Complete"
                                : "Incomplete"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                account.payoutsEnabled
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {account.payoutsEnabled ? "Enabled" : "Disabled"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                account.chargesEnabled
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {account.chargesEnabled ? "Enabled" : "Disabled"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() =>
                                handleDeleteStripeAccount(account.id)
                              }
                              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors duration-200"
                            >
                              Delete Account
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
