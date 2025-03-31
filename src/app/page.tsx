"use client";

import Link from "next/link";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  LogIn,
  UserPlus,
  ArrowRight,
  Menu,
  X,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import CappersLogo from "@/images/Cappers Logga (1).svg";
import gsap from "gsap";
import DisplayCapperCard from "@/components/displayCapperCard";
import Footer from "@/components/footer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { AnimatePresence, motion } from "framer-motion";
import { CapperCarouselCard } from "@/types/capper";
import { useRouter } from "next/navigation";

const mockCappers: CapperCarouselCard[] = [
  {
    userId: "mock1",
    user: {
      firstName: "John",
      lastName: "Smith",
      username: "bettingpro",
    },
    bio: "Former NFL analyst with 15+ years of experience",
    tags: ["NFL", "NCAAF", "MLB"],
    subscriberIds: Array(2345),
    isVerified: true,
    profileImage: "https://via.placeholder.com/150",
  },
  {
    userId: "user2",
    user: {
      firstName: "Sarah",
      lastName: "Williams",
      username: "basketballguru",
    },
    bio: "NBA specialist | 68% win rate last season",
    tags: ["NBA", "NCAAB", "WNBA"],
    subscriberIds: Array(1876),
    isVerified: true,
    profileImage: "https://via.placeholder.com/150",
  },
  {
    userId: "user3",
    user: {
      firstName: "Sarah",
      lastName: "Williams",
      username: "basketballguru",
    },
    bio: "NBA specialist | 68% win rate last season",
    tags: ["NBA", "NCAAB", "WNBA"],
    subscriberIds: Array(1876),
    isVerified: true,
    profileImage: "https://via.placeholder.com/150",
  },
  {
    userId: "user4",
    user: {
      firstName: "Sarah",
      lastName: "Williams",
      username: "basketballguru",
    },
    bio: "NBA specialist | 68% win rate last season",
    tags: ["NBA", "NCAAB", "WNBA"],
    subscriberIds: Array(1876),
    isVerified: true,
    profileImage: "https://via.placeholder.com/150",
  },
  {
    userId: "user5",
    user: {
      firstName: "Sarah",
      lastName: "Williams",
      username: "basketballguru",
    },
    bio: "NBA specialist | 68% win rate last season",
    tags: ["NBA", "NCAAB", "WNBA"],
    subscriberIds: Array(1876),
    isVerified: true,
    profileImage: "https://via.placeholder.com/150",
  },
  {
    userId: "user6",
    user: {
      firstName: "Sarah",
      lastName: "Williams",
      username: "basketballguru",
    },
    bio: "NBA specialist | 68% win rate last season",
    tags: ["NBA", "NCAAB", "WNBA"],
    subscriberIds: Array(1876),
    isVerified: true,
    profileImage: "https://via.placeholder.com/150",
  },
  {
    userId: "user7",
    user: {
      firstName: "Sarah",
      lastName: "Williams",
      username: "basketballguru",
    },
    bio: "NBA specialist | 68% win rate last season",
    tags: ["NBA", "NCAAB", "WNBA"],
    subscriberIds: Array(1876),
    isVerified: true,
    profileImage: "https://via.placeholder.com/150",
  },
  // .
  // .
  // ... add 5 more similar mock cappers
];

const steps = [
  {
    title: "Sign Up",
    description: "Create your account and join the Cappers community.",
    icon: <UserPlus className="h-14 w-14 text-[#4e43ff]" />,
  },
  {
    title: "Follow Experts",
    description: "Connect with top sports betting analysts and cappers.",
    icon: <CheckCircle className="h-14 w-14 text-[#4e43ff]" />,
  },
  {
    title: "Get Insights",
    description: "Receive expert picks and analysis for upcoming games.",
    icon: <ArrowRight className="h-14 w-14 text-[#4e43ff]" />,
  },
  {
    title: "Place Bets",
    description: "Use the insights to make informed betting decisions.",
    icon: <LogIn className="h-14 w-14 text-[#4e43ff]" />,
  },
  {
    title: "Earn Money",
    description: "Start winning consistently and grow your bankroll.",
    icon: <DollarSign className="h-14 w-14 text-[#4e43ff]" />,
  },
];

export const revalidate = 3600; // Revalidate every hour
export default async function Home() {
  const router = useRouter();
  const LANDING_PAGE_URL = "https://www.cappersports.co/"; // Updated to official Cappers website

  useEffect(() => {
    // Immediate redirect to official Cappers website
    window.location.href = LANDING_PAGE_URL;
  }, []);

  // Show a simple loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4e43ff] mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to Cappers...</p>
      </div>
    </div>
  );
}
