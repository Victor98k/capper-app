"use client";

import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "./SideNavCappers";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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

export function SuperUserDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CapperApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

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

        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm">
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
                    <th className="py-3 px-4 text-left">ROI Verification</th>
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
                      <td className="py-3 px-4">{application.experience}</td>
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
      </div>
    </div>
  );
}
