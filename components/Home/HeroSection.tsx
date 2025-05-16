"use client";
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100");
          entry.target.classList.remove("opacity-0");
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    return () => {
      if (heroRef.current) observer.unobserve(heroRef.current);
    };
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="min-h-screen pt-24 pb-16 relative flex items-center overflow-hidden blue-gradient-dark animate-gradient opacity-0 transition-opacity duration-500"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-200 rounded-full mix-blend-screen blur-[80px] opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary-100 rounded-full mix-blend-screen blur-[100px] opacity-10 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-light-100 rounded-full mix-blend-screen blur-[70px] opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              <span className="bg-gradient-to-r from-primary-100 via-primary-200 to-light-100 text-transparent bg-clip-text">
                AI-Driven
              </span>{" "}
              Courses & Interviews in One Platform
            </h1>

            <p className="text-lg md:text-xl text-light-100/90 max-w-lg mx-auto lg:mx-0">
              Learn, Practice, and Certify—all with AI at your side. The future
              of tech education is personalized and interactive.
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button
                asChild
                className="btn-primary hover:scale-105 transition-transform"
              >
                <Link href="/courses">Generate Your Personalized Course</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="group hover:scale-105 transition-transform"
              >
                <Link href="#demo" className="flex items-center gap-2">
                  <Play
                    size={18}
                    className="group-hover:scale-110 transition-transform"
                  />
                  Watch Demo
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://source.unsplash.com/random/100x100?face&${i}`}
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-dark-100"
                  />
                ))}
              </div>
              <p className="text-sm text-light-100">
                <span className="font-bold">10,000+</span> learners enrolled
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative max-w-[500px]">
              <div className="absolute inset-0 bg-primary-200 blur-xl opacity-20 rounded-3xl -rotate-3" />
              <img
                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
                alt="Platform Preview"
                className="relative z-10 rounded-2xl shadow-2xl border border-white/10 w-full h-auto"
              />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary-200 rounded-full flex-center text-dark-100 font-bold border-4 border-dark-100 shadow-lg">
                AI
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a
            href="#features"
            className="flex flex-col items-center text-sm text-light-100/80 hover:text-light-100 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="mb-1">Explore More</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14m0 0l-7-7m7 7l7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
