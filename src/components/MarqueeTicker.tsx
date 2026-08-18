/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, Orbit, Radio, Shield, Globe, Award, Zap } from "lucide-react";

export default function MarqueeTicker() {
  const items = [
    { label: "8TH ANNUAL IIST MUN", icon: Orbit, color: "text-cyan-400" },
    { label: "ISRO VALIAMALA CAMPUS", icon: Radio, color: "text-sky-400" },
    { label: "SEPTEMBER 18 – 20, 2026", icon: Sparkles, color: "text-indigo-400" },
    { label: "4 SIMULATION CHAMBERS", icon: Shield, color: "text-purple-400" },
    { label: "120+ DELEGATE SEATS", icon: Globe, color: "text-emerald-400" },
    { label: "₹50,000+ TOTAL REWARD POOL", icon: Award, color: "text-amber-400" },
    { label: "UN & ISRO ACADEMIC PROTOCOLS", icon: Zap, color: "text-rose-400" },
  ];

  return (
    <div className="relative w-full overflow-hidden border-y border-white/[0.06] bg-[#05070d]/90 py-3.5 backdrop-blur-xl select-none">
      {/* Left/Right Edge Fades for seamless marquee feel */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#04060a] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#04060a] to-transparent z-10" />

      <div className="animate-marquee flex items-center gap-8">
        {[...items, ...items, ...items].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 font-mono text-[11px] font-bold tracking-widest uppercase text-slate-300 whitespace-nowrap group hover:text-white transition-colors"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] shadow-inner">
                <Icon className={`h-3 w-3 ${item.color}`} />
              </span>
              <span>{item.label}</span>
              <span className="ml-4 h-1 w-1 rounded-full bg-slate-700" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
