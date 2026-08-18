/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SCHEDULE } from "../data";
import { TimelineEvent } from "../types";
import { CalendarRange, MapPin, Clock, Star, Landmark, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import SpotlightCard from "./SpotlightCard";

export default function Schedule() {
  const [activeDay, setActiveDay] = useState<"day1" | "day2" | "day3">("day1");

  const getCategoryBadge = (category: "ceremony" | "session" | "social" | "other") => {
    switch (category) {
      case "ceremony":
        return (
          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-indigo-400 border border-indigo-500/30 uppercase tracking-widest">
            Ceremony
          </span>
        );
      case "session":
        return (
          <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-cyan-400 border border-cyan-500/30 uppercase tracking-widest animate-pulse">
            In Session
          </span>
        );
      case "social":
        return (
          <span className="inline-flex items-center rounded-full bg-pink-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-pink-400 border border-pink-500/30 uppercase tracking-widest">
            Star Socials
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-white/[0.05] px-2.5 py-0.5 font-mono text-[9px] font-bold text-slate-400 border border-white/[0.1] uppercase tracking-widest">
            Operational
          </span>
        );
    }
  };

  const getActiveDayLabel = () => {
    switch (activeDay) {
      case "day1":
        return "Friday, September 18, 2026";
      case "day2":
        return "Saturday, September 19, 2026";
      case "day3":
        return "Sunday, September 20, 2026";
    }
  };

  return (
    <div className="bg-[#04060a] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Orionix Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-[140px] rounded-full" />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
            // CHRONOS TIMELINE
          </span>
          <h1 className="mt-4 font-sans text-3xl sm:text-5xl font-black tracking-tight text-white">
            Conference Timeline
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-slate-400 text-xs sm:text-sm leading-relaxed">
            Check the official schedules for three days of rigorous diplomacy, crisis escalation rounds, and evening stargazing socials.
          </p>
        </motion.div>

        {/* Day Selectors */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-white/[0.1] shadow-2xl">
            {(["day1", "day2", "day3"] as const).map((day, idx) => {
              const dates = ["Sept 18", "Sept 19", "Sept 20"];
              const labels = ["Day 1", "Day 2", "Day 3"];
              const isActive = activeDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  id={`schedule-tab-${day}`}
                  className={`rounded-full px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{labels[idx]}</span>{" "}
                  <span className={`text-[9px] font-mono tracking-widest ${isActive ? "text-slate-600" : "text-slate-500"}`}>
                    // {dates[idx]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Header */}
        <div className="text-center mb-8 bg-[#070a12]/60 rounded-2xl border border-white/[0.08] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
            <CalendarRange className="h-4 w-4" />
            <span>{getActiveDayLabel()}</span>
          </div>
        </div>

        {/* Timeline list */}
        <div className="relative border-l border-white/[0.1] ml-4 sm:ml-6 space-y-6 pb-8" id="timeline-list">
          {SCHEDULE[activeDay].map((event, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.06 }}
              className="relative pl-8 group"
            >
              {/* Timeline bubble bullet */}
              <div className="absolute -left-3 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#04060a] border-2 border-white/[0.15] group-hover:border-cyan-400 transition-colors duration-300">
                <div className="h-2 w-2 rounded-full bg-cyan-400" />
              </div>

              {/* Card Container */}
              <SpotlightCard className="p-5" spotlightColor="rgba(56, 189, 248, 0.1)">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="font-mono text-xs text-cyan-400 font-bold">{event.time}</span>
                  </div>
                  <div>
                    {getCategoryBadge(event.category)}
                  </div>
                </div>

                <h3 className="font-sans text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-200 text-left">
                  {event.title}
                </h3>
                
                <p className="mt-2 font-sans text-xs sm:text-sm text-slate-400 leading-relaxed text-left">
                  {event.description}
                </p>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>Venue: <span className="text-white font-medium">{event.location}</span></span>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
