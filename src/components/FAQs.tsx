/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FAQ_ITEMS } from "../data";
import { FAQItem } from "../types";
import { HelpCircle, ChevronDown, ChevronUp, Search, Info, Landmark } from "lucide-react";
import { motion } from "motion/react";

export default function FAQs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "general" | "registration" | "committees">("all");
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

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
    <div className="bg-[#020617] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%)" }}>
      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="font-mono text-[9px] uppercase tracking-widest text-blue-400 font-bold">// INTELLIGENCE DOSSIER</span>
          <h1 className="mt-2 font-sans text-3xl font-black tracking-tight text-white sm:text-5xl uppercase">
            Frequently Answered Intel
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-sans text-slate-400 text-sm">
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search intelligence dataset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-800 bg-slate-950/40 py-3 pl-11 pr-5 text-xs text-slate-200 placeholder-slate-650 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {(["all", "general", "registration", "committees"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-[9px] font-bold uppercase tracking-wider transition-all duration-350 active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/25"
                    : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200"
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
          className="space-y-4" 
          id="faq-accordion-list"
        >
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => {
              const isOpen = openIndexes.includes(index);
              return (
                <div
                  key={index}
                  id={`faq-item-${index}`}
                  className="rounded-3xl border border-slate-900 bg-slate-900/35 overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-slate-800"
                >
                  {/* Trigger head */}
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-sans text-xs sm:text-sm font-bold text-slate-200 hover:text-blue-400 transition-colors duration-200 focus:outline-none"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="h-4.5 w-4.5 text-blue-400 shrink-0" />
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </button>

                  {/* Body expansion */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-900/50 animate-fade-in text-left">
                      <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed pl-7">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 font-mono text-xs uppercase tracking-wider">
              No matching intelligence dossiers found. Try broad keywords like "ISRO" or "matrix".
            </div>
          )}
        </motion.div>

        {/* Contact info desk */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12 rounded-3xl border border-slate-900 bg-slate-950/40 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between"
        >
          <div className="flex gap-3 items-center">
            <Info className="h-5 w-5 text-blue-450 shrink-0" />
            <div className="text-left">
              <span className="block font-sans text-xs font-bold text-white uppercase tracking-wider">Still have orbital queries?</span>
              <span className="block font-sans text-xs text-slate-400">Directly consult the delegates command center.</span>
            </div>
          </div>
          <a
            href="mailto:delegates.iistmun@gmail.com"
            className="rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md px-6 py-2.5 font-sans text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95"
          >
            Direct Inquiry
          </a>
        </motion.div>
      </div>
    </div>
  );
}
