"use client";
import React, { useEffect, useRef } from "react";
import { Award, MessageCircle, TrendingUp, GraduationCap } from "lucide-react";

const StatsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const statRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            entry.target.classList.remove("opacity-0");
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    statRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      statRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, []);

  // Create a counter animation effect
  const animateValue = (
    obj: HTMLElement,
    start: number,
    end: number,
    duration: number
  ) => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // For percentages like 90%, only show the number
      const currentValue = Math.floor(progress * (end - start) + start);
      if (obj) {
        if (obj.dataset.suffix) {
          obj.innerHTML = currentValue + obj.dataset.suffix;
        } else {
          obj.innerHTML = currentValue.toString();
        }
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  // Use another effect for the counter animation
  useEffect(() => {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const countTo = parseInt(target.dataset.count || "0", 10);

            animateValue(target, 0, countTo, 2000);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.8 }
    );

    // Get all elements with data-count attribute
    const counterElements = document.querySelectorAll("[data-count]");
    counterElements.forEach((el) => counterObserver.observe(el));

    return () => {
      counterElements.forEach((el) => counterObserver.unobserve(el));
    };
  }, []);

  const stats = [
    {
      icon: <GraduationCap className="h-8 w-8 text-primary-200" />,
      number: "10K+",
      countValue: 10,
      suffix: "K+",
      label: "Courses Generated",
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary-200" />,
      number: "50K+",
      countValue: 50,
      suffix: "K+",
      label: "Interviews Conducted",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary-200" />,
      number: "90%",
      countValue: 90,
      suffix: "%",
      label: "Success Rate",
    },
    {
      icon: <Award className="h-8 w-8 text-primary-200" />,
      number: "5K+",
      countValue: 5,
      suffix: "K+",
      label: "Certificates Issued",
    },
  ];

  return (
    <section id="features" className="py-20 bg-dark-200" ref={sectionRef}>
      <div className="container mx-auto px-6">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-8 text-white opacity-0 animate-fade-in-up">
          Our <span className="text-primary-200">Impact</span>
        </h2>
        <p
          className="text-center text-light-100 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          Join thousands of learners who have transformed their careers with
          personalized AI learning paths.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="opacity-0 transition-all duration-700 ease-out"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              ref={(el) => (statRefs.current[index] = el)}
            >
              <div className="text-center p-6 border-gradient rounded-2xl group hover:scale-105 transition-transform duration-300">
                <div className="card flex flex-col items-center justify-center p-6 h-full relative overflow-hidden group-hover:shadow-xl transition-shadow">
                  {/* Animated circle background */}
                  <div className="absolute w-32 h-32 bg-primary-200/10 rounded-full -top-16 -left-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10 mb-4 bg-dark-300/50 p-4 rounded-full glow">
                    {stat.icon}
                  </div>

                  <div
                    className="text-4xl font-bold text-white mb-2 glow-text relative"
                    data-count={stat.countValue}
                    data-suffix={stat.suffix}
                  >
                    0
                  </div>

                  <div className="text-light-100">{stat.label}</div>

                  {/* Animated bottom line */}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-200 group-hover:w-full transition-all duration-700"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
