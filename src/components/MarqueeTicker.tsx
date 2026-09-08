/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Orbit, Compass, Award, ShieldCheck, Globe2, BookOpen } from "lucide-react";

export default function MarqueeTicker() {
  const items = [
    { label: "IIST MUN 2026 // SAVE · SUSTAIN · SAFEGUARD", icon: Orbit },
    { label: "FEBRUARY 21 – 23, 2026", icon: Compass },
    { label: "ISRO VALIAMALA CAMPUS // THIRUVANANTHAPURAM", icon: Globe2 },
    { label: "4 DIPLOMATIC CHAMBERS", icon: ShieldCheck },
    { label: "120+ ALLOCATED PORTFOLIOS", icon: BookOpen },
    { label: "₹50,000+ COMMENDATION & CASH AWARDS", icon: Award },
    { label: "FIELD DIPLOMACY & ORBITAL LAW", icon: Orbit },
  ];

  // Repeat sequence so it seamlessly loops 50% shift
  const sequence = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden border-y border-[#C9A86A]/20 bg-[#1D261E] py-3.5 select-none font-sans" id="live-marquee-ticker">
      {/* Left/Right Edge Gradient Fades to blend with background */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-28 bg-gradient-to-r from-[#1D261E] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-28 bg-gradient-to-l from-[#1D261E] to-transparent z-10" />

      <div className="animate-marquee flex items-center">
        {sequence.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-6 font-sans text-[11px] font-medium tracking-[0.2em] uppercase text-[#EDE6D3]/80 whitespace-nowrap group hover:text-[#C9A86A] transition-colors"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2E3B2F] border border-[#C9A86A]/40 text-[#C9A86A] shrink-0">
                <Icon className="h-3 w-3" />
              </span>
              <span>{item.label}</span>
              <span className="ml-5 h-1 w-1 rounded-full bg-[#C9A86A]/40 shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

