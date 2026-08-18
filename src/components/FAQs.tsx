/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FAQ_ITEMS } from "../data";
import { HelpCircle, ChevronDown, ChevronUp, Search, Info } from "lucide-react";
import { motion } from "motion/react";
import SpotlightCard from "./SpotlightCard";

export default function FAQs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "general" | "registration" | "committees">("all");
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggleAccordion = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter((i) => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  const filteredFAQs = FAQ_ITEMS.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#04060a] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Orionix Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-[140px] rounded-full" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
            // INTEL & PROTOCOLS
          </span>
          <h1 className="mt-4 font-sans text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Frequently Answered Intel
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-sans text-slate-400 text-xs sm:text-sm leading-relaxed">
            Everything you need to resolve regarding accommodations, fee schedules, registrations, portfolio matrices, and research policies.
          </p>
        </motion.div>

        {/* Filters Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search intelligence dataset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-white/[0.1] bg-[#070a12]/80 py-3 pl-11 pr-5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-all font-medium backdrop-blur-xl"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {(["all", "general", "registration", "committees"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white text-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    : "bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white"
                }`}
              >
                {cat === "all" ? "Show All Intel" : `${cat} dossiers`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQs Accordion */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="space-y-3" 
          id="faq-accordion-list"
        >
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => {
              const isOpen = openIndexes.includes(index);
              return (
                <div key={index}>
                  <SpotlightCard
                    id={`faq-item-${index}`}
                    className="p-0 overflow-hidden"
                    spotlightColor="rgba(56, 189, 248, 0.08)"
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full flex items-center justify-between p-5 text-left font-sans text-xs sm:text-sm font-bold text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <HelpCircle className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-white/[0.06] animate-fade-in text-left">
                        <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed pl-7">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </SpotlightCard>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 font-mono text-xs uppercase tracking-wider">
              No matching intelligence dossiers found. Try broad keywords like "ISRO" or "matrix".
            </div>
          )}
        </motion.div>

        {/* Contact Desk */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12"
        >
          <SpotlightCard className="p-6 flex flex-col sm:flex-row gap-4 items-center justify-between" spotlightColor="rgba(56, 189, 248, 0.1)">
            <div className="flex gap-3 items-center">
              <Info className="h-5 w-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <span className="block font-sans text-xs font-bold text-white uppercase tracking-wider">Still have orbital queries?</span>
                <span className="block font-sans text-xs text-slate-400">Directly consult the delegates command center.</span>
              </div>
            </div>
            <a
              href="mailto:delegates.iistmun@gmail.com"
              className="rounded-full bg-white hover:bg-cyan-300 text-slate-950 shadow-md px-6 py-2.5 font-sans text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 whitespace-nowrap"
            >
              Direct Inquiry
            </a>
          </SpotlightCard>
        </motion.div>
      </div>
    </div>
  );
}
