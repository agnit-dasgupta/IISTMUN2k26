/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { COMMITTEES } from "../data";
import { Committee } from "../types";
import { Orbit, ShieldAlert, Users, Globe, ChevronRight, FileText, Download, X, HelpCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import SpotlightCard from "./SpotlightCard";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Orbit: Orbit,
  ShieldAlert: ShieldAlert,
  Users: Users,
  Globe: Globe
};

export default function Committees() {
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [downloadingGuide, setDownloadingGuide] = useState<string | null>(null);

  const handleDownload = (id: string, name: string) => {
    setDownloadingGuide(id);
    setTimeout(() => {
      setDownloadingGuide(null);
      alert(`🛰️ Launching academic database...\n"${name} Study Guide & Background Guide.pdf" has been prepared and synced with your local workspace successfully!`);
    }, 1500);
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "cyan":
        return {
          border: "border-cyan-500/20 hover:border-cyan-500/50",
          text: "text-cyan-400",
          bg: "bg-cyan-500/10",
          badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
          glow: "rgba(6, 182, 212, 0.15)",
          bullet: "bg-cyan-400"
        };
      case "purple":
        return {
          border: "border-indigo-500/20 hover:border-indigo-500/50",
          text: "text-indigo-400",
          bg: "bg-indigo-500/10",
          badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
          glow: "rgba(99, 102, 241, 0.15)",
          bullet: "bg-indigo-400"
        };
      case "amber":
        return {
          border: "border-amber-500/20 hover:border-amber-500/50",
          text: "text-amber-400",
          bg: "bg-amber-500/10",
          badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
          glow: "rgba(245, 158, 11, 0.15)",
          bullet: "bg-amber-400"
        };
      case "emerald":
        return {
          border: "border-emerald-500/20 hover:border-emerald-500/50",
          text: "text-emerald-400",
          bg: "bg-emerald-500/10",
          badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
          glow: "rgba(16, 185, 129, 0.15)",
          bullet: "bg-emerald-400"
        };
      default:
        return {
          border: "border-white/[0.08] hover:border-white/[0.2]",
          text: "text-slate-300",
          bg: "bg-white/[0.05]",
          badge: "bg-white/[0.05] text-slate-300 border-white/[0.1]",
          glow: "rgba(255, 255, 255, 0.1)",
          bullet: "bg-slate-400"
        };
    }
  };

  return (
    <div className="bg-[#04060a] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Subtle Orionix Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-[140px] rounded-full" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
            // ACADEMIC CHAMBERS & COUNCILS
          </span>
          <h1 className="mt-4 font-sans text-3xl sm:text-5xl font-black tracking-tight text-white">
            Simulation Committees
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-slate-400 text-xs sm:text-sm leading-relaxed">
            Our 8th edition features four meticulously structured councils. Click on any council card to inspect background dossiers, executive board profiles, and download academic study briefs.
          </p>
        </motion.div>

        {/* Committees Grid with Spotlight effect */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2" id="committees-grid">
          {COMMITTEES.map((com, idx) => {
            const IconComponent = ICON_MAP[com.logo] || HelpCircle;
            const style = getColorClasses(com.color);

            return (
              <motion.div
                key={com.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.1 }}
              >
                <SpotlightCard
                  id={`com-card-${com.id}`}
                  onClick={() => setSelectedCommittee(com)}
                  className={`p-6 md:p-8 flex flex-col justify-between cursor-pointer min-h-[340px] ${style.border}`}
                  spotlightColor={style.glow}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full border px-3 py-0.5 font-mono text-[10px] font-bold tracking-wider ${style.badge}`}>
                        {com.abbreviation}
                      </span>
                      <IconComponent className={`h-5 w-5 ${style.text}`} />
                    </div>

                    <h3 className="mt-4 font-sans text-2xl font-black text-white group-hover:text-cyan-300 transition-colors duration-200 text-left">
                      {com.name}
                    </h3>

                    <p className="mt-4 font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold text-left">
                      Primary Agenda
                    </p>
                    <p className="mt-1 font-sans text-sm text-slate-200 line-clamp-2 italic text-left">
                      "{com.agenda}"
                    </p>

                    <p className="mt-3 font-sans text-xs text-slate-400 line-clamp-3 text-left leading-relaxed">
                      {com.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">Board:</span>
                      <span className="font-sans text-xs text-slate-300 font-medium">
                        {com.eb.map((m) => m.name.split(" ")[0]).join(" & ")}
                      </span>
                    </div>
                    <span className={`flex items-center gap-1 font-sans text-xs font-bold ${style.text} group-hover:translate-x-1 transition-transform duration-300`}>
                      Dossier
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Detailed Committee Modal Overlay */}
      {selectedCommittee && (() => {
        const style = getColorClasses(selectedCommittee.color);
        const IconComponent = ICON_MAP[selectedCommittee.logo] || HelpCircle;

        return (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-xl animate-fade-in" id="committee-detail-modal">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="relative w-full max-w-2xl rounded-3xl border border-white/[0.12] bg-[#070a12]/95 p-6 md:p-8 shadow-2xl my-8 text-left backdrop-blur-2xl">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedCommittee(null)}
                  className="absolute right-4 top-4 rounded-full border border-white/[0.08] bg-white/[0.04] p-2 text-slate-400 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Modal Title */}
                <div className="flex items-start gap-4 pr-10 text-left">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.bg} border ${style.border} ${style.text}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider ${style.badge} mb-1.5`}>
                      {selectedCommittee.abbreviation}
                    </span>
                    <h2 className="font-sans text-xl md:text-2xl font-black text-white">
                      {selectedCommittee.name}
                    </h2>
                  </div>
                </div>

                {/* Agenda Box */}
                <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/40 p-5 text-left">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                    Debate Agenda
                  </span>
                  <p className="font-sans text-sm md:text-base text-slate-200 font-medium leading-relaxed italic">
                    "{selectedCommittee.agenda}"
                  </p>
                </div>

                {/* Main description */}
                <div className="mt-6 font-sans text-xs md:text-sm text-slate-300 leading-relaxed space-y-4 text-left">
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold">// ABOUT THE COMMITTEE</h4>
                  <p>{selectedCommittee.description}</p>
                  <p>
                    Delegates in this chamber are expected to prepare extensive position papers detailing their country's technological capabilities, legislative policies, and treaties regarding the peaceful exploration of orbit. Direct crisis inputs will require quick, collaborative resolutions under simulated pressure.
                  </p>
                </div>

                {/* Executive Board */}
                <div className="mt-8 border-t border-white/[0.08] pt-6 text-left">
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-4">// EXECUTIVE BOARD (EB)</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedCommittee.eb.map((member) => (
                      <div key={member.name} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-xs font-black text-white shadow">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-sans text-xs sm:text-sm font-bold text-white">{member.name}</p>
                          <p className="font-mono text-[9px] uppercase text-slate-400 tracking-wider font-bold">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer and Downloads */}
                <div className="mt-8 flex flex-wrap gap-4 justify-between items-center border-t border-white/[0.08] pt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span>Study Guide v1.0 (PDF)</span>
                  </div>
                  
                  <button
                    disabled={downloadingGuide === selectedCommittee.id}
                    onClick={() => handleDownload(selectedCommittee.id, selectedCommittee.name)}
                    className="flex items-center gap-2 rounded-full bg-white hover:bg-cyan-300 px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-slate-950 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    {downloadingGuide === selectedCommittee.id ? (
                      <>
                        <Orbit className="h-4 w-4 animate-spin text-slate-950" />
                        Downloading briefing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 text-slate-950" />
                        Download Study Guide
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
