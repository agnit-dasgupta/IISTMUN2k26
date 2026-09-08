/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SCHEDULE } from "../data";
import { TimelineEvent } from "../types";
import { CalendarRange, MapPin, Clock, Star, Landmark, ChevronRight, Compass } from "lucide-react";
import { motion } from "motion/react";

export default function Schedule() {
  const [activeDay, setActiveDay] = useState<"day1" | "day2" | "day3">("day1");

  const getCategoryBadge = (category: "ceremony" | "session" | "social" | "other") => {
    switch (category) {
      case "ceremony":
        return (
          <span className="font-mono text-[9px] font-semibold text-[#1A1F1A] bg-[#C9A86A] px-2 py-0.5 uppercase tracking-wider">
            Ceremonial
          </span>
        );
      case "session":
        return (
          <span className="font-mono text-[9px] font-semibold text-[#C9A86A] border border-[#C9A86A]/40 px-2 py-0.5 uppercase tracking-wider bg-[#1A1F1A]">
            Committee Session
          </span>
        );
      case "social":
        return (
          <span className="font-mono text-[9px] font-semibold text-[#EDE6D3] bg-[#586841] px-2 py-0.5 uppercase tracking-wider">
            Stargazing Social
          </span>
        );
      default:
        return (
          <span className="font-mono text-[9px] font-semibold text-[#8A9A7E] border border-[#8A9A7E]/30 px-2 py-0.5 uppercase tracking-wider">
            Operational
          </span>
        );
    }
  };

  const getActiveDayLabel = () => {
    switch (activeDay) {
      case "day1":
        return "Friday, February 21, 2026";
      case "day2":
        return "Saturday, February 22, 2026";
      case "day3":
        return "Sunday, February 23, 2026";
    }
  };

  return (
    <div className="bg-[#1A1F1A] text-[#EDE6D3] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans paper-grain newsprint-overlay selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]">
      
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-left mb-12 border-b border-[#C9A86A]/20 pb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="emblem-seal px-3 py-0.5 text-[11px] uppercase tracking-[0.2em] bg-[#2E3B2F]">
              Field Itinerary
            </span>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8A9A7E] font-medium">
              Three-Day Convocation
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            Conference Timeline & Sessions
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-xs sm:text-sm text-[#8A9A7E] leading-relaxed font-light">
            Review the complete three-day schedule encompassing inaugural addresses, intensive moderated caucuses, resolution voting, and the signature IIST Observatory stargazing fellowship.
          </p>
        </motion.div>

        {/* Day Selectors */}
        <div className="flex justify-start mb-8 border-b border-[#C9A86A]/30 pb-4 gap-2">
          {(["day1", "day2", "day3"] as const).map((day, idx) => {
            const dates = ["Feb 21", "Feb 22", "Feb 23"];
            const labels = ["Day 1 (Friday)", "Day 2 (Saturday)", "Day 3 (Sunday)"];
            const isActive = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                id={`schedule-tab-${day}`}
                className={`px-4 py-2 font-sans text-xs uppercase tracking-[0.15em] transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#C9A86A] text-[#1A1F1A] border-[#C9A86A] font-semibold"
                    : "border-[#C9A86A]/25 text-[#EDE6D3]/70 hover:border-[#C9A86A] hover:text-[#EDE6D3] bg-[#2E3B2F]/40"
                }`}
              >
                <span>{labels[idx]}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Header */}
        <div className="mb-8 border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#C9A86A] font-sans text-xs uppercase tracking-[0.2em] font-medium">
            <Compass className="h-4 w-4" />
            <span>{getActiveDayLabel()}</span>
          </div>
          <span className="font-mono text-[10px] text-[#8A9A7E]">SCHEDULE ACTIVE</span>
        </div>

        {/* Timeline list */}
        <div className="relative border-l border-[#C9A86A]/30 ml-4 sm:ml-6 space-y-6 pb-8 text-left" id="timeline-list">
          {SCHEDULE[activeDay].map((event, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
              className="relative pl-8 group"
            >
              {/* Hairline square pin */}
              <div className="absolute -left-2 top-3 h-3.5 w-3.5 border border-[#C9A86A] bg-[#1A1F1A] group-hover:bg-[#C9A86A] transition-colors" />

              {/* Event Card */}
              <div className="border border-[#C9A86A]/25 bg-[#2E3B2F] p-6 hover:border-[#C9A86A] transition-all shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                    <span className="font-mono text-xs text-[#C9A86A] font-semibold">{event.time}</span>
                  </div>
                  <div>
                    {getCategoryBadge(event.category)}
                  </div>
                </div>

                <h3 className="font-serif text-xl text-[#EDE6D3] font-normal group-hover:text-[#C9A86A] transition-colors text-left">
                  {event.title}
                </h3>
                
                <p className="mt-2 font-sans text-xs sm:text-sm text-[#EDE6D3]/80 leading-relaxed font-light text-left">
                  {event.description}
                </p>

                <div className="mt-4 pt-3 border-t border-[#C9A86A]/15 flex items-center gap-1.5 font-sans text-xs text-[#8A9A7E]">
                  <MapPin className="h-3.5 w-3.5 text-[#C9A86A]" />
                  <span>Chamber Location: <strong className="text-[#EDE6D3] font-normal">{event.location}</strong></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
