/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Mail,
  X
} from "lucide-react";
import { motion } from "motion/react";

export interface OpeningSoonPlaceholderProps {
  title?: string;
  subtitle?: string;
  edition?: string;
  roundName?: string;
  badge?: string;
  description?: string;
  estimatedDate?: string;
  initialPreference?: { country?: string; committee?: string } | null;
  clearInitialPreference?: () => void;
  setActiveTab?: (tab: string) => void;
  embedded?: boolean;
  onBack?: () => void;
}

export default function OpeningSoonPlaceholder({
  title = "Priority Delegate Registration",
  subtitle = "Accreditation & Representation Dossier",
  edition = "CONVOCATION DISPATCH • 14TH EDITION",
  roundName = "Priority Round",
  badge = "OPENING SOON",
  description,
  initialPreference,
  clearInitialPreference,
  setActiveTab,
  embedded = false,
  onBack
}: OpeningSoonPlaceholderProps) {
  const handleGoHome = () => {
    if (onBack) {
      onBack();
    } else if (setActiveTab) {
      setActiveTab("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className={`w-full text-left ${embedded ? "py-4 sm:py-6" : "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16"}`}>

      {/* Back button (Only if not embedded or explicitly requested) */}
      {!embedded && (
        <button
          onClick={handleGoHome}
          className="group inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.16em] text-[#8A9A7E] hover:text-[#C9A86A] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Return to Portal Convocation
        </button>
      )}

      {/* Main Diplomatic Dispatch Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative border border-[#C9A86A]/40 bg-gradient-to-b from-[#233124]/95 via-[#1E281F]/90 to-[#162117]/95 backdrop-blur-md p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl"
      >
        {/* Subtle decorative radial glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#C9A86A]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full bg-[#8BA06F]/10 blur-2xl pointer-events-none" />

        {/* Archival corner registration marks */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-[#C9A86A]/50 pointer-events-none" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-[#C9A86A]/50 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-[#C9A86A]/50 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-[#C9A86A]/50 pointer-events-none" />

        <div className="relative z-10 space-y-6">

          {/* Top Status Bar with Pulsing Radar Dot */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C9A86A]/20 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] bg-[#2E3B2F] border border-[#C9A86A]/40 px-2.5 py-1">
                {edition}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] border border-[#C9A86A]/50 bg-[#C9A86A]/15 px-2.5 py-1 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A86A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A86A]"></span>
                </span>
                {badge}
              </span>
            </div>


          </div>

          {/* Central Title & Diplomatic Dispatch */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#8BA06F] uppercase tracking-[0.18em]">
              <Clock className="h-4 w-4 text-[#C9A86A] animate-pulse" />
              <span>{subtitle}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#EDE6D3] font-normal tracking-tight leading-tight">
              {title} <br />
              <span className="text-[#C9A86A] italic">Opening Soon</span>
            </h1>

            <p className="font-sans text-xs sm:text-sm text-[#EDE6D3]/85 leading-relaxed font-light">
              {description || (
                <>
                  The Secretariat of <strong className="text-[#EDE6D3] font-medium">IIST Model United Nations 2027</strong> is finalizing candidate allotment parameters, institutional quotas, and portfolio matrices. The official dossier intake for the <strong className="text-[#C9A86A] font-medium">{roundName}</strong> will commence shortly.
                </>
              )}
            </p>

            {/* Preserved initial matrix preference (if user navigated from country matrix) */}
            {initialPreference && (initialPreference.committee || initialPreference.country) && (
              <div className="flex items-center justify-between gap-3 p-3 bg-[#2E3B2F]/80 border border-[#C9A86A]/50 text-xs shadow-md">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-[#C9A86A] shrink-0" />
                  <span className="font-sans text-[#EDE6D3] truncate">
                    Saved Matrix Selection:{" "}
                    <strong className="text-[#C9A86A]">
                      {initialPreference.country ? `${initialPreference.country} — ` : ""}
                      {initialPreference.committee}
                    </strong>{" "}
                    (Kept ready for priority intake)
                  </span>
                </div>
                {clearInitialPreference && (
                  <button
                    type="button"
                    onClick={clearInitialPreference}
                    className="p-1 text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer"
                    title="Clear preference"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Pathways While Waiting */}
          {setActiveTab && (
            <div className="pt-4 border-t border-[#C9A86A]/20">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#8BA06F] block mb-3">
                INSTEAD, YOU CAN EXPLORE:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pathway 1: Campus Ambassador */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register-portal-ca");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="p-3.5 text-left border border-[#8BA06F]/50 bg-[#1A1F1A]/80 hover:bg-[#2E3B2F]/60 hover:border-[#8BA06F] transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif text-xs text-emerald-300 font-medium group-hover:text-emerald-200 transition-colors flex items-center gap-1.5">
                      <span>Campus Ambassador</span>
                      <span className="text-[8px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1">OPEN</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-[#8A9A7E] group-hover:translate-x-1 group-hover:text-emerald-300 transition-all" />
                  </div>
                  <p className="font-sans text-[10px] text-[#8A9A7E]">
                    Lead your university contingent and earn leadership honors.
                  </p>
                </button>

                {/* Pathway 2: UNGA Online Committee */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register-portal-unga");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="p-3.5 text-left border border-[#C9A86A]/40 bg-[#2E3B2F]/60 hover:bg-[#2E3B2F] hover:border-[#C9A86A] transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif text-xs text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors flex items-center gap-1.5">
                      <span>UNGA (Online)</span>
                      <span className="text-[8px] font-mono bg-[#1A1F1A] text-[#C9A86A] border border-[#C9A86A]/40 px-1 font-bold">OPEN</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-[#8A9A7E] group-hover:translate-x-1 group-hover:text-[#C9A86A] transition-all" />
                  </div>
                  <p className="font-sans text-[10px] text-[#8A9A7E]">
                    Global virtual deliberative chamber &bull; Live online delegate intake.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Official Sign-off & Contacts */}
          <div className="pt-4 border-t border-[#C9A86A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#8A9A7E]">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>Inquiries: <a href="mailto:support@iistmun.org" className="text-[#EDE6D3] hover:text-[#C9A86A] underline">support@iistmun.org</a></span>
            </div>
            <div>
              <span>SECRETARIAT HELPLINE: +91 9881416709</span>
            </div>
          </div>

        </div>

        {/* Decorative background crest watermark */}
        <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
          <img src="/logo-emblem-transparent.png" alt="Emblem" className="w-80 h-80 object-contain" />
        </div>
      </motion.div>
    </div>
  );
}
