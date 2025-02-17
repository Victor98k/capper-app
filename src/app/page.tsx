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
import CappersLogo from "@/images/Cappers Logga.png";
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

interface Capper {
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    username: string;
  };
  bio?: string;
  tags: string[];
  subscriberIds: string[];
  isVerified: boolean;
  profileImage?: string;
  imageUrl?: string;
}

const mockCappers: Capper[] = [
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

export default function LandingPage() {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [cappers, setCappers] = useState<Capper[]>(mockCappers);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const features = ["Innovate", "Connect", "Succeed"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length]);

  // Add carousel animation
  useEffect(() => {
    const cards = document.querySelectorAll(".carousel-card");

    cards.forEach((card, index) => {
      if (index === activeCard) {
        gsap.to(card, {
          scale: 1,
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: "power2.out",
          zIndex: 3,
        });
      } else if (
        index === activeCard - 1 ||
        (activeCard === 0 && index === cards.length - 1)
      ) {
        gsap.to(card, {
          scale: 0.9,
          opacity: 0.5,
          x: "-50%",
          duration: 0.5,
          ease: "power2.out",
          zIndex: 1,
        });
      } else if (
        index === activeCard + 1 ||
        (activeCard === cards.length - 1 && index === 0)
      ) {
        gsap.to(card, {
          scale: 0.9,
          opacity: 0.5,
          x: "50%",
          duration: 0.5,
          ease: "power2.out",
          zIndex: 1,
        });
      } else {
        gsap.to(card, {
          scale: 0.8,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          zIndex: 0,
        });
      }
    });
  }, [activeCard]);

  const nextCard = () => {
    setActiveCard((prev) => (prev + 1) % cappers.length);
  };

  const prevCard = () => {
    setActiveCard((prev) => (prev - 1 + cappers.length) % cappers.length);
  };

  // Auto-rotate cards
  useEffect(() => {
    const interval = setInterval(nextCard, 5000);
    return () => clearInterval(interval);
  }, []);

  // Function to create the floating dollar signs
  const createFloatingDollars = () => {
    const dollarSigns = [];
    // Create 6 dollar signs (reduced from 8 for better performance)
    for (let i = 0; i < 6; i++) {
      dollarSigns.push(
        <div
          key={i}
          // transform-gpu enables hardware acceleration for smoother animations
          className={`floating-dollar absolute text-[#4e43ff] opacity-0 transform-gpu`}
          style={{
            left: `${Math.random() * 100}%`, // Random horizontal position
            bottom: "-20px", // Start below the viewport
            fontSize: `${Math.random() * 15 + 20}px`, // Random size between 20-35px
            filter: "blur(0.5px) brightness(1.2)", // Slight glow effect
            willChange: "transform", // Optimization hint for browsers
          }}
        >
          $
        </div>
      );
    }
    return dollarSigns;
  };

  // Animation setup using GSAP
  useLayoutEffect(() => {
    // Create a timeline for better performance and control
    const tl = gsap.timeline({
      defaults: {
        ease: "none", // Linear movement for smoother animation
      },
    });

    // Main floating animation
    gsap.to(".floating-dollar", {
      y: "-70vh", // Float up 70% of viewport height
      opacity: 0.8, // Fade in to 80% opacity
      duration: 6, // Animation takes 6 seconds
      stagger: {
        each: 0.8, // 0.8 second delay between each dollar
        repeat: -1, // Infinite repeat
        repeatDelay: 0.5, // Half second delay before repeating
      },
      ease: "power1.out", // Slight easing for natural movement
      onComplete: function () {
        // Reset position when animation completes
        gsap.set(this.targets(), {
          y: 0,
          opacity: 0,
          left: `random(0, 100)%`, // New random horizontal position
        });
      },
    });

    // Cleanup function
    return () => {
      tl.kill(); // Stop animation when component unmounts
    };
  }, []);

  const renderCarousel = () => (
    <div className="w-full max-w-7xl mx-auto mt-12 px-4">
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
        {/* Left side - Text content */}
        <div className="lg:w-1/3 text-left lg:mt-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Win more <span className="text-[#4e43ff]">together</span>
          </h2>
          <p className="text-gray-300 text-2xl mb-4">
            Join our community of successful sports bettors and get access to
            expert picks and analysis. Start making smarter betting decisions
            today.
          </p>
          <Link
            href="/sign-up"
            className="inline-block px-6 py-3 text-lg font-semibold rounded-full bg-[#4e43ff] text-white hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
          >
            Join Now
          </Link>
        </div>

        {/* Right side - Carousel */}
        <div className="w-full lg:w-2/3 relative">
          {/* Navigation buttons - Updated for better mobile visibility */}
          <button
            onClick={prevCard}
            className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-gray-800/50 p-3 rounded-full text-white hover:bg-gray-800 transition-all"
          >
            ←
          </button>
          <button
            onClick={nextCard}
            className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-800/50 p-3 rounded-full text-white hover:bg-gray-800 transition-all"
          >
            →
          </button>

          {/* Cards container - Updated height and responsiveness */}
          <div className="cards-carousel relative flex justify-center items-center overflow-hidden h-[400px] sm:h-[500px]">
            {cappers.map((capper, index) => (
              <div
                key={index}
                className="carousel-card absolute w-full max-w-[90%] sm:max-w-xl transition-all duration-500"
                style={{
                  transform: `scale(${index === activeCard ? 1 : 0.9})`,
                  opacity: index === activeCard ? 1 : 0.5,
                  zIndex: index === activeCard ? 3 : 1,
                }}
              >
                <DisplayCapperCard
                  userId={capper.userId}
                  firstName={capper.user?.firstName || ""}
                  lastName={capper.user?.lastName || ""}
                  username={capper.user?.username || ""}
                  // bio={capper.bio}
                  imageUrl={capper.profileImage || capper.imageUrl}
                  tags={capper.tags || []}
                  subscriberIds={capper.subscriberIds}
                  isVerified={capper.isVerified}
                />
              </div>
            ))}
          </div>

          {/* Indicator dots - Added more padding for mobile */}
          <div className="flex justify-center mt-8 sm:mt-6 gap-2">
            {cappers.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 
                  ${
                    activeCard === index ? "bg-violet-500 w-4" : "bg-gray-500"
                  }`}
                onClick={() => setActiveCard(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Add this useLayoutEffect for the hero text animation
  // useLayoutEffect(() => {
  //   // Create timeline for smoother sequence of animations
  //   const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  //   // Animate only the main heading text and subtitle
  //   tl.from(".hero-title .text-reveal", {
  //     y: 100,
  //     opacity: 0,
  //     duration: 1,
  //     stagger: 0.2,
  //   }).from(
  //     ".hero-subtitle",
  //     {
  //       y: 20,
  //       opacity: 0,
  //       duration: 0.8,
  //     },
  //     "-=0.4"
  //   );
  // }, []);

  const videoRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const video = videoRef.current;
    const topText = document.querySelector(".top-text");
    const bottomText = document.querySelector(".bottom-text");
    const buttonsContainer = document.querySelector(".hero-buttons");

    if (!video || !topText || !bottomText || !buttonsContainer) return;

    // Video animation
    gsap.fromTo(
      video,
      {
        width: "700px",
        height: "457.5px",
        top: "40%",
        left: "50%",
        xPercent: -50,
        yPercent: -50,
        position: "absolute",
        opacity: 1,
      },
      {
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "+=200%",
          scrub: 1,
          pin: true,
          pinSpacing: true,
          markers: false,
        },
        width: "100vw",
        height: "100vh",
        top: "0%",
        left: "0%",
        xPercent: 0,
        yPercent: 0,
        opacity: 1,
        scale: 1.5,
      }
    );

    // Updated text animations - removed opacity changes
    gsap.to(topText, {
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "+=200%",
        scrub: 1,
      },
      y: "-100vh", // Move up by full viewport height
      ease: "power1.inOut",
    });

    gsap.to(bottomText, {
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "+=100%",
        scrub: 1,
      },
      y: "50vh",
      opacity: 0,
      ease: "power1.inOut",
    });

    // Modified button animation to keep them more visible
    gsap.to(buttonsContainer, {
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "+=200%",
        scrub: 1,
      },
      y: "10vh", // Reduced movement to keep buttons more visible
      scale: 1.1,
    });
  }, []);

  // Fetch and combine real cappers with mock ones
  useEffect(() => {
    const fetchCappers = async () => {
      try {
        const response = await fetch("/api/cappers");
        const realCappers = await response.json();

        // Combine real cappers with mock ones
        const allCappers = [...realCappers, ...mockCappers];
        setCappers(allCappers);
      } catch (error) {
        console.error("Error fetching cappers:", error);
        // Fallback to mock cappers if fetch fails
        setCappers(mockCappers);
      }
    };

    fetchCappers();
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    const autoPlay = setInterval(() => {
      if (api) {
        api.scrollNext();
      }
    }, 2000); // Scroll every 2 seconds

    return () => clearInterval(autoPlay);
  }, [api]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-black">
        <nav className="flex justify-between items-center">
          {/* Logo - Hidden on mobile */}
          <Link href="/" className="hidden sm:flex items-center">
            <img
              src={CappersLogo.src}
              alt="Cappers Logo"
              className="h-8 sm:h-10 w-auto"
            />
          </Link>

          {/* Mobile Navigation */}
          <div className="flex justify-between items-center w-full sm:hidden">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sign In Button */}
            <Link
              href="/login"
              className="flex items-center px-4 py-2 text-sm rounded-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 transform hover:scale-105 transition-all duration-200"
            >
              <span className="mr-1">Sign In</span>
              <LogIn className="inline-block h-4 w-4" />
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden sm:flex items-center space-x-10">
            <Link
              href="/about"
              className="text-white hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-primary transition-colors"
            >
              Contact
            </Link>
            <button className="px-4 py-2 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50">
              <Link href="/login" className="flex items-center justify-center">
                <span className="mr-2">Sign In</span>
                <LogIn className="inline-block h-4 w-4" />
              </Link>
            </button>
            <button className="px-4 py-2 text-sm rounded-full bg-transparent border-2 border-blue-500 text-white hover:bg-blue-500 hover:border-transparent transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50">
              <Link
                href="/sign-up"
                className="flex items-center justify-center"
              >
                <span className="mr-2">Sign Up</span>
                <UserPlus className="inline-block h-4 w-4" />
              </Link>
            </button>
          </div>
        </nav>
      </header>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "tween", duration: 0.3 }}
          className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-50"
        >
          <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <Link href="/" className="flex items-center">
                <img
                  src={CappersLogo.src}
                  alt="Cappers Logo"
                  className="h-8 w-auto"
                />
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-6 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link
                  href="/about"
                  className="text-2xl font-medium text-white hover:text-[#4e43ff] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link
                  href="/contact"
                  className="text-2xl font-medium text-white hover:text-[#4e43ff] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </motion.div>
            </nav>

            {/* Action Buttons */}
            <div className="mt-auto space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full"
              >
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center px-6 py-3 text-lg font-medium rounded-full bg-transparent border-2 border-[#4e43ff] text-white hover:bg-[#4e43ff]/10 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full"
              >
                <Link
                  href="/sign-up"
                  className="w-full flex items-center justify-center px-6 py-3 text-lg font-medium rounded-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      <main className="flex-grow flex flex-col bg-gradient-to-br from-gray-900 to-black">
        {/* Hero Section */}
        <section className="hero-section relative min-h-[100vh] lg:min-h-[110vh] flex items-center justify-center overflow-hidden">
          {/* Video Background with enhanced container */}
          <div
            ref={videoRef}
            className="absolute overflow-hidden rounded-2xl 
              before:absolute before:inset-0 
              before:bg-gradient-to-t before:from-black/80 
              before:via-transparent before:to-black/40 
              before:z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#4e43ff]/20 to-transparent mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[#4e43ff]/5 backdrop-blur-[2px]"></div>
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

          {/* Enhanced overlay with more dynamic gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-[1]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#4e43ff]/10 to-transparent z-[2]"></div>

          {/* Hero Content */}
          <div className="text-center px-4 sm:px-6 lg:px-8 relative z-[5] max-w-[1400px] mx-auto h-full flex flex-col justify-between py-20">
            {/* Top text */}
            <div className="-translate-y-15 top-text">
              {/* Move main title up */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 mx-4 sm:mx-8 lg:mx-12">
                <span className="block sm:hidden">
                  <img
                    src={CappersLogo.src}
                    alt="Cappers Logo"
                    className="h-16 w-auto mx-auto mb-4"
                  />
                </span>
                <span className="hidden sm:block hero-title">
                  <span className="text-white text-8xl">
                    <span className="text-reveal inline-block">
                      FIRST CLASS{" "}
                    </span>
                    <span className="text-reveal inline-block text-[#4e43ff]">
                      SPORTSCONTENT
                    </span>
                  </span>
                </span>
              </h1>
            </div>

            {/* Bottom text section */}
            <div className="absolute bottom-40 left-0 right-0 z-[5]">
              <span className="text-gray-300 text-4xl hero-subtitle block mb-10 bottom-text hidden md:block">
                Start earning today with our community
              </span>
            </div>

            {/* Buttons container */}
            <div className="fixed left-1/2 top-[75vh] -translate-x-1/2 z-[3] flex flex-col sm:flex-row items-center justify-center gap-4 hero-buttons">
              <Link
                href="/sign-up"
                className="px-8 py-4 text-lg font-semibold rounded-full bg-[#4e43ff] text-white hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50 w-64 sm:w-auto"
              >
                Get Started Free
              </Link>
              <Link
                href="#cappers-section"
                className="px-8 py-4 text-lg font-semibold rounded-full bg-transparent border-2 border-[#4e43ff] text-white hover:bg-[#4e43ff]/10 transform hover:scale-105 transition-all duration-200 w-64 sm:w-auto"
              >
                See Our Cappers
              </Link>
            </div>
          </div>
        </section>

        {/* What is Cappers Section */}
        <section className="min-h-screen flex items-center justify-center py-20 bg-gradient-to-br from-gray-900 via-[#4e43ff]/10 to-gray-900">
          <div className="w-full max-w-7xl mx-auto px-4">
            {/* Main Title */}
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-7xl font-bold mb-4 text-white">
                What is <span className="text-[#4e43ff]">Cappers?</span>
              </h2>
              <p className="text-gray-300 text-xl md:text-2xl">
                The best marketplace for sport betting content
              </p>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
              {/* For Sports Fans Card */}
              <div
                className="bg-gradient-to-b from-black/60 to-black/40 rounded-3xl p-12 
                backdrop-blur-sm flex flex-col h-full border border-[#4e43ff]/20
                shadow-[0_0_20px_rgba(78,67,255,0.15)] 
                transition-all duration-300 hover:shadow-[0_0_30px_rgba(78,67,255,0.3)]
                hover:border-[#4e43ff]/40 hover:translate-y-[-8px]"
              >
                <div className="flex-grow">
                  {/* Icon or illustration could go here */}
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 text-center">
                    For sports fans
                  </h3>
                  <div className="space-y-6">
                    <p className="text-gray-200 text-xl leading-relaxed text-center mb-8">
                      Start winning consistently with expert insights
                    </p>
                    <ul className="space-y-6 max-w-xl mx-auto">
                      <li className="flex items-start gap-4 text-gray-200">
                        <span className="text-[#4e43ff] mt-1 text-xl">•</span>
                        <span className="text-lg leading-relaxed">
                          Access professional sports betting analysis and
                          predictions
                        </span>
                      </li>
                      <li className="flex items-start gap-4 text-gray-200">
                        <span className="text-[#4e43ff] mt-1 text-xl">•</span>
                        <span className="text-lg leading-relaxed">
                          Follow and learn from verified successful cappers
                        </span>
                      </li>
                      <li className="flex items-start gap-4 text-gray-200">
                        <span className="text-[#4e43ff] mt-1 text-xl">•</span>
                        <span className="text-lg leading-relaxed">
                          Get real-time updates and insights for your favorite
                          sports
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <Link
                    href="/sign-up"
                    className="inline-block px-8 py-4 text-lg font-semibold rounded-full bg-[#4e43ff] text-white hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
                  >
                    Create Account
                  </Link>
                </div>
              </div>

              {/* For Creators Card */}
              <div
                className="bg-gradient-to-b from-black/60 to-black/40 rounded-3xl p-12 
                backdrop-blur-sm flex flex-col h-full border border-[#4e43ff]/20
                shadow-[0_0_20px_rgba(78,67,255,0.15)]
                transition-all duration-300 hover:shadow-[0_0_30px_rgba(78,67,255,0.3)]
                hover:border-[#4e43ff]/40 hover:translate-y-[-8px]"
              >
                <div className="flex-grow">
                  {/* Icon or illustration could go here */}
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 text-center">
                    For creators
                  </h3>
                  <div className="space-y-6">
                    <p className="text-gray-200 text-xl leading-relaxed text-center mb-8">
                      Turn your sports expertise into a business
                    </p>
                    <ul className="space-y-6 max-w-xl mx-auto">
                      <li className="flex items-start gap-4 text-gray-200">
                        <span className="text-[#4e43ff] mt-1 text-xl">•</span>
                        <span className="text-lg leading-relaxed">
                          Build your community and monetize your content
                        </span>
                      </li>
                      <li className="flex items-start gap-4 text-gray-200">
                        <span className="text-[#4e43ff] mt-1 text-xl">•</span>
                        <span className="text-lg leading-relaxed">
                          No upfront costs - only pay when you earn
                        </span>
                      </li>
                      <li className="flex items-start gap-4 text-gray-200">
                        <span className="text-[#4e43ff] mt-1 text-xl">•</span>
                        <span className="text-lg leading-relaxed">
                          Access professional tools and analytics
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <Link
                    href="/become-capper"
                    className="inline-block px-8 py-4 text-lg font-semibold rounded-full bg-transparent border-2 border-[#4e43ff] text-white hover:bg-[#4e43ff]/10 transform hover:scale-105 transition-all duration-200"
                  >
                    Become Capper
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Carousel Section */}
        <section className="flex items-center justify-center py-20 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                Trending{" "}
                <span className="text-[#4e43ff] drop-shadow-[0_0_8px_rgba(78,67,255,0.5)]">
                  Sport Creators
                </span>
              </h2>
              <p className="text-gray-200 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
                Here are our trending sport creators, aka{" "}
                <span className="text-[#4e43ff] font-semibold">
                  {"Cappers"}
                </span>
                . Creators that provide great sports content with{" "}
                <span className="text-white font-semibold">
                  astounding accuracy
                </span>
                .
              </p>
            </div>

            <Carousel
              setApi={setApi}
              className="w-full max-w-7xl mx-auto"
              opts={{
                align: "center",
                loop: true,
                dragFree: true,
                skipSnaps: false,
              }}
            >
              <CarouselContent className="-ml-1">
                {cappers.map((capper) => (
                  <CarouselItem
                    key={capper.userId}
                    className="pl-1 md:basis-1/3" // Changed from 1/5 to 1/3 to show 3 cards
                  >
                    <div className="p-1">
                      <DisplayCapperCard
                        userId={capper.userId}
                        firstName={capper.user?.firstName || ""}
                        lastName={capper.user?.lastName || ""}
                        username={capper.user?.username || ""}
                        // bio={capper.bio}
                        imageUrl={capper.profileImage || capper.imageUrl}
                        tags={capper.tags || []}
                        subscriberIds={capper.subscriberIds}
                        isVerified={capper.isVerified}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>

            <div className="py-4 text-center text-sm text-muted-foreground">
              Slide {current} of {count}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="min-h-screen flex items-center justify-center py-20 bg-gradient-to-br from-gray-900 via-[#4e43ff]/10 to-gray-900">
          <div className="w-full max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-7xl font-bold mb-12 text-white text-center">
              How It <span className="text-[#4e43ff]">Works</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-xl p-8 
                    backdrop-blur-sm transition-all duration-300 
                    border border-[#4e43ff]/10 hover:border-[#4e43ff]/50
                    shadow-lg hover:shadow-[#4e43ff]/20
                    hover:transform hover:scale-105 hover:-translate-y-2
                    group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-6 transform group-hover:scale-110 transition-all duration-300">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-[#4e43ff] transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Added CTA section */}
            <div className="text-center mt-12">
              <Link
                href="/sign-up"
                className="inline-flex items-center px-12 py-4 text-lg font-semibold rounded-full bg-[#4e43ff] text-white hover:bg-[#4e43ff]/90 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-[#4e43ff]/50"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <p className="mt-4 text-gray-400">
                Join thousands of successful sports bettors today
              </p>
            </div>
          </div>
        </section>

        {/* Why Trust Our Cappers Section */}
        <section className="min-h-screen flex items-center justify-center py-20 bg-gradient-to-br from-gray-900 via-[#4e43ff]/10 to-gray-900">
          <div className="w-full max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-7xl font-bold mb-12 text-white text-center">
              Why Trust Our <span className="text-[#4e43ff]">Cappers</span>
            </h2>

            {/* Main features in a larger format */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              <div className="bg-black/30 rounded-2xl p-10 backdrop-blur-lg border border-[#4e43ff]/20 transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-[#4e43ff]/20 p-4 rounded-xl">
                    <div className="text-[#4e43ff] text-5xl font-bold">95%</div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Verified Success Rate
                  </h3>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Our top cappers maintain consistently high win rates, verified
                  through our transparent tracking system.
                </p>
              </div>

              <div className="bg-black/30 rounded-2xl p-10 backdrop-blur-lg border border-[#4e43ff]/20 transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-[#4e43ff]/20 p-4 rounded-xl">
                    <div className="text-[#4e43ff] text-5xl font-bold">
                      10K+
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Active Members
                  </h3>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Join thousands of satisfied members who trust our platform for
                  expert sports betting insights.
                </p>
              </div>
            </div>

            {/* Secondary features in a three-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-[#4e43ff] text-3xl font-bold mb-4">
                  100%
                </div>
                <p className="text-gray-300">
                  Full access to historical performance data and real-time
                  tracking of all picks and predictions.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-[#4e43ff] text-3xl font-bold mb-4">
                  24/7
                </div>
                <p className="text-gray-300">
                  Round-the-clock access to our community and support team for
                  guidance and assistance.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-[#4e43ff] text-3xl font-bold mb-4">5★</div>
                <p className="text-gray-300">
                  Consistently rated 5 stars by our community for quality picks
                  and excellent service.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/sign-up"
                className="inline-block px-12 py-4 text-lg font-semibold rounded-full bg-[#4e43ff] text-white hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
              >
                Join Our Community
              </Link>
            </div>
          </div>
        </section>

        {/* Divider 1 */}
        <div className="relative h-24 bg-gradient-to-br from-gray-900 to-gray-900/50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#4e43ff] to-transparent"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#4e43ff] transform rotate-45"></div>
          </div>
        </div>

        {/* Want to become a capper Section */}
        <section className="min-h-screen flex items-center justify-center py-20 bg-gray-900/50">
          <div className="w-full max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-7xl font-bold mb-12 text-white text-center">
              Want to become a <span className="text-[#4e43ff]">Capper?</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-[#4e43ff] text-4xl font-bold mb-4">
                  $5K+
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Monthly Earnings
                </h3>
                <p className="text-gray-300">
                  Our top performing cappers consistently earn substantial
                  monthly income through subscriptions and tips.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-[#4e43ff] text-4xl font-bold mb-4">
                  1K+
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Active Cappers
                </h3>
                <p className="text-gray-300">
                  Join our growing community of successful cappers sharing their
                  expertise and insights.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-[#4e43ff] text-4xl font-bold mb-4">
                  Free
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  To Get Started
                </h3>
                <p className="text-gray-300">
                  Begin your journey as a capper without any upfront costs. Your
                  success is based purely on your performance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-[#4e43ff] text-4xl font-bold mb-4">
                  Pro Tools
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Advanced Analytics
                </h3>
                <p className="text-gray-300">
                  Access professional tools and analytics to enhance your
                  predictions and grow your following.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-[#4e43ff] text-4xl font-bold mb-4">
                  Support
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  24/7 Assistance
                </h3>
                <p className="text-gray-300">
                  Get dedicated support to help you succeed and grow your
                  presence on our platform.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/become-capper"
                className="inline-block px-8 py-3 text-lg font-semibold rounded-full bg-[#4e43ff] text-white hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
              >
                Start Your Capper Journey
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
}
