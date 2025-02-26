"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BecomeCapper() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    sport: "",
    experience: "",
    monthlyBetAmount: "",
    yearlyROI: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/capper-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Application submitted successfully!");
        router.push("/application-submitted");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Error submitting application");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Become a Professional Capper
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Join our elite community of sports betting experts. Share your
            insights, build your following, and earn from your expertise.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: "Build Your Brand",
              description: "Create your profile and grow your following",
              icon: "💎",
            },
            {
              title: "Share Your Expertise",
              description: "Help others succeed with your betting insights",
              icon: "🎯",
            },
            {
              title: "Earn Rewards",
              description: "Get compensated for your successful predictions",
              icon: "💰",
            },
          ].map((benefit) => (
            <div
              key={benefit.title}
              className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm hover:bg-gray-800/50 transition duration-300"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-300">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Application Form */}
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Application Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-white text-sm font-medium mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-white text-sm font-medium mb-2"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-white text-sm font-medium mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-white text-sm font-medium mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="sport"
                className="block text-white text-sm font-medium mb-2"
              >
                Which sport do you want to produce content for?
              </label>
              <input
                type="text"
                id="sport"
                value={formData.sport}
                onChange={(e) =>
                  setFormData({ ...formData, sport: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="experience"
                className="block text-white text-sm font-medium mb-2"
              >
                How long have you considered yourself a capper?
              </label>
              <input
                type="text"
                id="experience"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="monthlyBetAmount"
                className="block text-white text-sm font-medium mb-2"
              >
                What's the amount you place in bets monthly?
              </label>
              <input
                type="text"
                id="monthlyBetAmount"
                value={formData.monthlyBetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyBetAmount: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="yearlyROI"
                className="block text-white text-sm font-medium mb-2"
              >
                What's your ROI (during the current year)?
              </label>
              <input
                type="text"
                id="yearlyROI"
                value={formData.yearlyROI}
                onChange={(e) =>
                  setFormData({ ...formData, yearlyROI: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-blue-400 hover:text-blue-300 underline"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/terms");
                  }}
                >
                  Terms and Conditions
                </a>{" "}
                and confirm that all information provided is accurate. I
                understand that false information may result in application
                rejection.
              </label>
            </div>

            <button
              type="submit"
              disabled={!acceptedTerms}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Submit Application
            </button>
          </form>
        </div>

        {/* Requirements Section */}
        <div className="mt-12 bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-4">
            Requirements to Become a Capper
          </h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Proven track record of successful sports betting</li>
            <li>Detailed understanding of sports analytics</li>
            <li>Strong communication skills</li>
            <li>Commitment to providing quality insights</li>
            <li>Professional conduct and integrity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
