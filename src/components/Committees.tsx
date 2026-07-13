/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { COMMITTEES } from "../data";
import { Committee } from "../types";
import { Orbit, ShieldAlert, Users, Globe, ChevronRight, FileText, Download, X, HelpCircle, Star } from "lucide-react";

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
          border: "border-cyan-500/20 hover:border-cyan-500/40",
          text: "text-cyan-400",
          bg: "bg-cyan-500/5",
          badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
          bullet: "bg-cyan-500"
        };
      case "purple":
        return {
          border: "border-indigo-500/20 hover:border-indigo-500/40",
          text: "text-indigo-400",
          bg: "bg-indigo-500/5",
          badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          glow: "shadow-[0_0_20px_rgba(99,102,241,0.15)]",
          bullet: "bg-indigo-500"
        };
      case "amber":
        return {
          border: "border-amber-500/20 hover:border-amber-500/40",
          text: "text-amber-400",
          bg: "bg-amber-500/5",
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
          bullet: "bg-amber-500"
        };
      case "emerald":
        return {
          border: "border-emerald-500/20 hover:border-emerald-500/40",
          text: "text-emerald-400",
          bg: "bg-emerald-500/5",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
          bullet: "bg-emerald-500"
        };
      default:
        return {
          border: "border-slate-800 hover:border-slate-700",
          text: "text-slate-300",
          bg: "bg-slate-900/5",
          badge: "bg-slate-800 text-slate-300 border-slate-700",
          glow: "",
          bullet: "bg-slate-500"
        };
    }
  };

  return (
    <div className="bg-[#020617] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%)" }}>
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="text-center mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-blue-400 font-bold">// ACADEMIC CHAMBERS</span>
          <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Simulation Committees
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-slate-400 text-xs sm:text-sm leading-relaxed">
            Our 8th edition features four meticulously structured councils. Tap on any committee bento tile to inspect academic briefs, executive board profiles, and access background guides.
          </p>
        </div>

        {/* Committees Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2" id="committees-grid">
          {COMMITTEES.map((com) => {
            const IconComponent = ICON_MAP[com.logo] || HelpCircle;
            const style = getColorClasses(com.color);

            return (
              <div
                key={com.id}
                id={`com-card-${com.id}`}
                onClick={() => setSelectedCommittee(com)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border ${style.border} bg-slate-900/40 p-6 md:p-8 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.01] ${style.glow}`}
              >
                {/* Visual hover corner flare */}
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-xl transition-all duration-500 group-hover:scale-150" />

                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 font-mono text-[10px] font-bold tracking-wider ${style.badge}`}>
                      {com.abbreviation}
                    </span>
                    <IconComponent className={`h-5 w-5 ${style.text}`} />
                  </div>

                  <h3 className="mt-4 font-sans text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200 text-left">
                    {com.name}
                  </h3>

                  <p className="mt-4 font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold text-left">
                    Primary Agenda
                  </p>
                  <p className="mt-1 font-sans text-sm text-slate-300 line-clamp-2 italic text-left">
                    "{com.agenda}"
                  </p>

                  <p className="mt-3 font-sans text-xs text-slate-400 line-clamp-3 text-left leading-relaxed">
                    {com.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">Board:</span>
                    <span className="font-sans text-xs text-slate-300 font-medium">
                      {com.eb.map((m) => m.name.split(" ")[0]).join(" & ")}
                    </span>
                  </div>
                  <span className={`flex items-center gap-1 font-sans text-xs font-semibold ${style.text} group-hover:translate-x-1 transition-transform duration-300`}>
                    Dossier
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Committee Modal Overlay */}
        {selectedCommittee && (() => {
          const style = getColorClasses(selectedCommittee.color);
          const IconComponent = ICON_MAP[selectedCommittee.logo] || HelpCircle;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in" id="committee-detail-modal">
              <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 md:p-8 shadow-2xl my-8">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedCommittee(null)}
                  className="absolute right-4 top-4 rounded-full border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:border-slate-700"
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
                    <h2 className="font-sans text-xl md:text-2xl font-extrabold text-white">
                      {selectedCommittee.name}
                    </h2>
                  </div>
                </div>

                {/* Agenda Box */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-blue-400 font-bold block mb-1">
                    Debate Agenda
                  </span>
                  <p className="font-sans text-sm md:text-base text-blue-100 font-medium leading-relaxed italic">
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
                <div className="mt-8 border-t border-slate-800 pt-6 text-left">
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-4">// EXECUTIVE BOARD (EB)</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedCommittee.eb.map((member) => (
                      <div key={member.name} className="flex items-center gap-3 rounded-2xl border border-slate-850 bg-slate-950/40 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-extrabold text-blue-400 border border-blue-800/40">
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
                <div className="mt-8 flex flex-wrap gap-4 justify-between items-center border-t border-slate-800 pt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span>Study Guide v1.0 (PDF)</span>
                  </div>
                  
                  <button
                    disabled={downloadingGuide === selectedCommittee.id}
                    onClick={() => handleDownload(selectedCommittee.id, selectedCommittee.name)}
                    className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {downloadingGuide === selectedCommittee.id ? (
                      <>
                        <Orbit className="h-4 w-4 animate-spin" />
                        Downloading briefing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download Study Guide
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
