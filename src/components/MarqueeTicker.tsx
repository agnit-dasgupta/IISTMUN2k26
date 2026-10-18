/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Award, ShieldCheck, ArrowRight, Sparkles, Orbit, Globe } from "lucide-react";
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

  const handleItemClick = (e: React.MouseEvent, targetTab?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (setActiveTab) {
      setActiveTab(targetTab || "register-portal");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const tickerItems = [
    {
      badge: "UNGA (ONLINE)",
      lead: "UNGA (Online Committee) Registrations live • Global Virtual Deliberation.",
      cta: "Register for UNGA",
      icon: Globe,
      targetTab: "register-portal-unga",
      highlight: true
    },
    {
      badge: "NOW OPEN",
      lead: "Priority Registrations live • Preferential Council Allotments.",
      cta: "Register Now",
      icon: Sparkles,
      targetTab: "register-portal-priority",
      highlight: false
    },
    {
      badge: "IIST MUN 2027",
      lead: "UNGA Online & Priority Registrations live • Campus Ambassador open.",
      cta: "Explore Portal",
      icon: Orbit,
      targetTab: "register-portal",
      highlight: false
    },
    {
      badge: "PRIORITY ROUND",
      lead: "Priority delegate intake active • Secure your portfolio.",
      cta: "Register Now",
      icon: Award,
      targetTab: "register-portal-priority",
      highlight: false
    },
    {
      badge: "CAMPUS AMBASSADOR",
      lead: "Lead your college delegation • Campus Ambassador network live.",
      cta: "Join Fellowship",
      icon: ShieldCheck,
      targetTab: "register-portal-ca",
      highlight: false
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
      aria-label="Announcement: UNGA (Online Committee) registrations, Priority delegate registrations, and Campus Ambassador registrations are now open"
      title="UNGA (Online Committee) & Priority Registrations Now Open • Click to view registration portal"
    >
      {/* Left/Right Edge Gradient Fades for cinematic entry & exit */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#162117] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#162117] to-transparent z-10" />

      <div className="animate-marquee flex items-center">
        {sequence.map((item, idx) => {
          const Icon = item.icon;
          const isUnga = item.targetTab === "register-portal-unga";
          return (
            <div
              key={idx}
              onClick={(e) => handleItemClick(e, item.targetTab)}
              className="flex items-center gap-3 px-6 sm:px-8 font-sans text-xs tracking-wider uppercase text-[#EDE6D3]/90 whitespace-nowrap transition-colors hover:text-white"
            >
              {/* Pulsing Status Tag */}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[10px] font-mono font-semibold bg-[#C9A86A]/15 border border-[#C9A86A]/40 text-[#C9A86A]">
                <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-[#C9A86A]" />
                {item.badge}
              </span>

              {/* Icon */}
              <span className="flex h-5 w-5 items-center justify-center rounded-full border shrink-0 bg-[#2E3B2F] border-[#C9A86A]/40 text-[#C9A86A]">
                <Icon className="h-3 w-3" />
              </span>

              {/* Main Text */}
              <span className="font-medium transition-colors text-[#EDE6D3] group-hover:text-[#F3E5AB]">
                {item.lead}
              </span>

              {/* Action Prompt */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-4 transition-all text-[#C9A86A] decoration-[#C9A86A]/50 hover:decoration-[#C9A86A] hover:text-[#F3E5AB]">
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
