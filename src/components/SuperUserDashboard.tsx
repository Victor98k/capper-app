"use client";

import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "./SideNavCappers";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";

interface CapperApplication {
  id: string;
  name: string;
  username: string;
  email: string;
  sport: string;
  experience: string;
  monthlyBetAmount: string;
  yearlyROI: string;
  status: string;
}

export function SuperUserDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CapperApplication[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/capper-applications");
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
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

        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4">
            Capper Applications
          </h2>
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
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b border-gray-700/50"
                  >
                    <td className="py-3 px-4">{application.name}</td>
                    <td className="py-3 px-4">{application.username}</td>
                    <td className="py-3 px-4">{application.email}</td>
                    <td className="py-3 px-4">{application.sport}</td>
                    <td className="py-3 px-4">{application.experience}</td>
                    <td className="py-3 px-4">
                      {application.monthlyBetAmount}
                    </td>
                    <td className="py-3 px-4">{application.yearlyROI}</td>
                    <td className="py-3 px-4">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
