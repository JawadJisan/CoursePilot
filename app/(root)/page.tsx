"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth.store";
import HeroSection from "@/components/Home/HeroSection";
import StatsSection from "@/components/Home/StatsSection";

export default function Home() {
  const { user } = useAuthStore();
  console.log("Logged in user from zustand", user);

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>
        {/* Render user interviews when ready */}
        {!user && <p>Please log in to see your interviews.</p>}
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take Interviews</h2>
        <p>Explore available interviews once you're signed in.</p>
      </section>

      <HeroSection />
      <StatsSection />
    </>
  );
}
