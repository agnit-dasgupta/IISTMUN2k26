/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SCHEDULE } from "../data";
import { TimelineEvent } from "../types";
import { CalendarRange, MapPin, Clock, Star, Landmark, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

export default function Schedule() {
  const [activeDay, setActiveDay] = useState<"day1" | "day2" | "day3">("day1");

  const getCategoryBadge = (category: "ceremony" | "session" | "social" | "other") => {
    switch (category) {
      case "ceremony":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-purple-400 border border-purple-500/20 uppercase tracking-widest">
            Ceremony
          </span>
        );
      case "session":
        return (
          <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-400 border border-cyan-500/20 uppercase tracking-widest animate-pulse">
            In Session
          </span>
        );
      case "social":
        return (
          <span className="inline-flex items-center rounded-full bg-pink-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-pink-400 border border-pink-500/20 uppercase tracking-widest">
            Star Socials
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-400 border border-slate-700 uppercase tracking-widest">
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
    <div className="bg-slate-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">Chronos Agenda</span>
          <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Conference Timeline
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-slate-400 text-sm">
            Check the standard orbital timelines for three days of rigorous diplomacy and stargazing social integrations.
          </p>
        </motion.div>

        {/* Day Selectors */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setActiveDay("day1")}
              id="schedule-tab-day1"
              className={`rounded-xl px-5 py-3 font-sans text-sm font-bold transition-all ${
                activeDay === "day1"
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Day 1 <span className="block text-[9px] font-mono tracking-wider opacity-80 uppercase">Sept 18</span>
            </button>
            <button
              onClick={() => setActiveDay("day2")}
              id="schedule-tab-day2"
              className={`rounded-xl px-5 py-3 font-sans text-sm font-bold transition-all ${
                activeDay === "day2"
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Day 2 <span className="block text-[9px] font-mono tracking-wider opacity-80 uppercase">Sept 19</span>
            </button>
            <button
              onClick={() => setActiveDay("day3")}
              id="schedule-tab-day3"
              className={`rounded-xl px-5 py-3 font-sans text-sm font-bold transition-all ${
                activeDay === "day3"
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Day 3 <span className="block text-[9px] font-mono tracking-wider opacity-80 uppercase">Sept 20</span>
            </button>
          </div>
        </div>

        {/* Selected Day Header */}
        <div className="text-center mb-8 bg-slate-900/10 rounded-2xl border border-slate-900/80 p-4">
          <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
            <CalendarRange className="h-4 w-4" />
            <span>{getActiveDayLabel()}</span>
          </div>
        </div>

        {/* Timeline list */}
        <div className="relative border-l border-slate-800 ml-4 sm:ml-6 space-y-8 pb-8" id="timeline-list">
          {SCHEDULE[activeDay].map((event, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
              className="relative pl-8 group"
            >
              {/* Timeline bubble bullet */}
              <div className="absolute -left-3 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 border-2 border-slate-800 group-hover:border-cyan-400 transition-colors duration-300">
                <div className="h-2 w-2 rounded-full bg-cyan-500" />
              </div>

              {/* Card Container */}
              <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 backdrop-blur-md transition-all duration-300 hover:border-slate-800 hover:bg-slate-900/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="font-mono text-xs text-cyan-400 font-bold">{event.time}</span>
                  </div>
                  <div>
                    {getCategoryBadge(event.category)}
                  </div>
                </div>

                <h3 className="font-sans text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-200">
                  {event.title}
                </h3>
                
                <p className="mt-2 font-sans text-sm text-slate-400 leading-relaxed">
                  {event.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-900/80 flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>Venue: <span className="text-white font-medium">{event.location}</span></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
