"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import TopNav from "@/components/ui/topNav";
import Image from "next/image";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

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
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add images
      images.forEach((image, index) => {
        formDataToSend.append(`image${index}`, image);
      });

      const response = await fetch("/api/capper-applications", {
        method: "POST",
        body: formDataToSend, // Send as FormData instead of JSON
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleNewImages(files);
  };

  const handleNewImages = (files: File[]) => {
    for (const file of files) {
      // Validate file size
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Image too large", {
          description: "Please select an image under 10MB",
        });
        continue;
      }

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Invalid file type", {
          description:
            "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
        });
        continue;
      }

      setImages((prev) => [...prev, file]);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews((prev) => [...prev, previewUrl]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleNewImages(files);
  }, []);

  return (
    <>
      <TopNav />
      <div className="min-h-screen bg-[#020817] relative">
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

        <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
          <Toaster position="top-right" expand={true} richColors closeButton />
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Become a Professional Capper
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Join our elite community of sports betting experts. Share your
                insights, build your following, and earn from your expertise.
              </p>
            </div>

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
                  description:
                    "Get compensated for your successful predictions",
                  icon: "💰",
                },
              ].map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-gray-800/20 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 hover:bg-gray-800/30 transition duration-300 hover:border-[#4e43ff]/50"
                >
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-300">{benefit.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-800/20 backdrop-blur-lg rounded-xl p-8 border border-gray-700/50">
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
                      setFormData({
                        ...formData,
                        monthlyBetAmount: e.target.value,
                      })
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

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    ROI Verification Screenshots
                  </label>
                  <p className="text-gray-300 text-sm mb-4">
                    Upload screenshots of your betting history to verify your
                    ROI claims
                  </p>

                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4
                    ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-600 hover:border-blue-500"}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("imageInput")?.click()
                    }
                  >
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg
                          className="mx-auto h-12 w-12"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="flex text-sm text-gray-400 justify-center">
                        <span className="relative cursor-pointer rounded-md font-medium text-blue-400 focus-within:outline-none">
                          Click to upload
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Accepted formats: JPEG, PNG, GIF, WebP (Max size: 10MB)
                      </p>
                    </div>
                    <input
                      id="imageInput"
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
          </div>
        </div>
      </div>
    </>
  );
}
