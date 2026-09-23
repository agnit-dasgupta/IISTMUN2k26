/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Award, ShieldCheck, ArrowRight, Sparkles, Orbit } from "lucide-react";
import { motion } from "motion/react";

interface MarqueeTickerProps {
  setActiveTab?: (tab: string) => void;
}

export default function MarqueeTicker({ setActiveTab }: MarqueeTickerProps) {
  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (setActiveTab) {
      setActiveTab("register-portal");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const tickerItems = [
    {
      badge: "NOW OPEN",
      lead: "EB and Campus Ambassador registrations open.",
      cta: "Click here to register",
      icon: Award,
    },
    {
      badge: "IIST MUN 2027",
      lead: "EB and Campus Ambassador registrations open.",
      cta: "Click here to register",
      icon: Orbit,
    },
    {
      badge: "APPLICATIONS LIVE",
      lead: "EB and Campus Ambassador registrations open.",
      cta: "Click here to register",
      icon: Sparkles,
    },
    {
      badge: "EXECUTIVE BOARD & CA",
      lead: "EB and Campus Ambassador registrations open.",
      cta: "Click here to register",
      icon: ShieldCheck,
    },
  ];

  // Exactly two identical halves ensure keyframes translateX(-50%) produces a 100% seamless, mathematically continuous loop
  const sequence = [...tickerItems, ...tickerItems];

  return (
    <motion.aside
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
      onClick={handleRegisterClick}
      className="relative z-30 w-full overflow-hidden border-b border-[#C9A86A]/30 bg-[#162117]/95 backdrop-blur-md py-2.5 sm:py-3 select-none font-sans cursor-pointer group hover:bg-[#1A261B] transition-colors"
      id="live-marquee-ticker"
      role="region"
      aria-label="Announcement: EB and Campus Ambassador registrations open"
      title="Click here to register for Executive Board or Campus Ambassador"
    >
      {/* Left/Right Edge Gradient Fades for cinematic entry & exit */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#162117] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#162117] to-transparent z-10" />

      <div className="animate-marquee flex items-center">
        {sequence.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 px-6 sm:px-8 font-sans text-xs tracking-wider uppercase text-[#EDE6D3]/90 whitespace-nowrap transition-colors"
            >
              {/* Pulsing Status Tag */}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-[#C9A86A]/15 border border-[#C9A86A]/40 text-[#C9A86A] text-[10px] font-mono font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C9A86A] animate-pulse" />
                {item.badge}
              </span>

              {/* Icon */}
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2E3B2F] border border-[#C9A86A]/40 text-[#C9A86A] shrink-0">
                <Icon className="h-3 w-3" />
              </span>

              {/* Main Text */}
              <span className="font-medium text-[#EDE6D3] group-hover:text-[#F3E5AB] transition-colors">
                {item.lead}
              </span>

              {/* Action Prompt */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A86A] underline underline-offset-4 decoration-[#C9A86A]/50 group-hover:decoration-[#C9A86A] group-hover:text-[#F3E5AB] transition-all">
                <span>{item.cta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>

              {/* Diamond separator */}
              <span className="ml-5 h-1.5 w-1.5 rotate-45 bg-[#C9A86A]/40 shrink-0" />
            </div>
          );
        })}
      </div>
    </motion.aside>
  );
}
