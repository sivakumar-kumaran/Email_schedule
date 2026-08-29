"use client";

import React from "react";
import PremiumBadge from "./PremiumBadge";
import { Button } from "./Button";

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center text-center px-4 pt-20 pb-8">
      <PremiumBadge>Premium Feature</PremiumBadge>
      <h1 className="text-5xl sm:text-6xl font-extrabold text-white mt-4">
        Elevate Your Email Scheduling
      </h1>
      <p className="text-lg text-slate-400 max-w-2xl mt-4">
        Seamlessly schedule, track, and send emails with a robust, queue‑backed system that survives restarts and respects rate limits.
      </p>
      <div className="mt-6">
        <Button variant="gradient" size="lg">
          Get Started
        </Button>
      </div>
    </section>
  );
}
