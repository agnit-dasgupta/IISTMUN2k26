/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FAQ_ITEMS } from "../data";
import { HelpCircle, ChevronDown, ChevronUp, Search, Mail, BookOpen } from "lucide-react";
import { motion } from "motion/react";

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
              Field Protocol
            </span>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8A9A7E] font-medium">
              Administrative Intel
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            Frequently Consulted Inquiries
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-xs sm:text-sm text-[#8A9A7E] leading-relaxed font-light">
            Review detailed guidance regarding campus housing at IIST, portfolio allotment criteria, rules of procedure, double delegation credentials, and research resources.
          </p>
        </motion.div>

        {/* Filters Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="space-y-4 mb-8 text-left"
        >
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
            <input
              type="text"
              placeholder="Search protocol dossiers (e.g., accommodation, portfolio, fees)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-[#C9A86A]/30 bg-[#2E3B2F] py-3 pl-11 pr-5 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E] outline-none focus:border-[#C9A86A] transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(["all", "general", "registration", "committees"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 font-sans text-[11px] uppercase tracking-[0.15em] transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-[#C9A86A] text-[#1A1F1A] border-[#C9A86A] font-semibold"
                    : "border-[#C9A86A]/25 text-[#EDE6D3]/70 hover:border-[#C9A86A] hover:text-[#EDE6D3] bg-[#2E3B2F]/40"
                }`}
              >
                {cat === "all" ? "All Dossiers" : `${cat} inquiries`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQs Accordion */}
        <div className="space-y-3 text-left" id="faq-accordion-list">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => {
              const isOpen = openIndexes.includes(index);
              return (
                <div 
                  key={index}
                  className="border border-[#C9A86A]/25 bg-[#2E3B2F] overflow-hidden transition-all hover:border-[#C9A86A]/60 shadow-sm"
                  id={`faq-item-${index}`}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-serif text-lg sm:text-xl text-[#EDE6D3] hover:text-[#C9A86A] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-3 pr-4">
                      <HelpCircle className="h-4 w-4 text-[#C9A86A] shrink-0" />
                      <span>{faq.question}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#C9A86A] shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#8A9A7E] shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-[#C9A86A]/15 text-left">
                      <p className="font-sans text-xs sm:text-sm text-[#EDE6D3]/85 leading-relaxed pl-7 font-light">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-[#8A9A7E] font-mono text-xs uppercase tracking-wider border border-[#C9A86A]/20 bg-[#2E3B2F]/30 p-8">
              No matching archival inquiries found. Try broader terms like "ISRO" or "matrix".
            </div>
          )}
        </div>

        {/* Contact Helpdesk Box */}
        <div className="mt-12 border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 flex flex-col sm:flex-row gap-4 items-center justify-between text-left shadow-lg">
          <div className="flex gap-3 items-center">
            <Mail className="h-5 w-5 text-[#C9A86A] shrink-0" />
            <div>
              <span className="block font-serif text-lg text-[#EDE6D3] font-normal">Need Direct Secretariat Assistance?</span>
              <span className="block font-sans text-xs text-[#8A9A7E]">Our delegate affairs desk will respond to your queries promptly.</span>
            </div>
          </div>
          <a
            href="mailto:contact@iistmun.in"
            className="px-5 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#dfbe7e] transition-all whitespace-nowrap"
          >
            Dispatch Query
          </a>
        </div>
      </div>
    </div>
  );
}
