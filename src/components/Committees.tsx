/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { COMMITTEES } from "../data";
import { Committee } from "../types";
import { 
  Orbit, ShieldCheck, Scale, Globe, ChevronRight, 
  FileText, Download, X, HelpCircle, BookOpen, UserCheck
} from "lucide-react";
import { motion } from "motion/react";

const SIGIL_MAP: Record<string, React.ComponentType<any>> = {
  Orbit: Orbit,
  ShieldAlert: ShieldCheck,
  Users: Scale,
  Globe: Globe
};

export default function Committees() {
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [downloadingGuide, setDownloadingGuide] = useState<string | null>(null);

  const handleDownload = (id: string, name: string) => {
    setDownloadingGuide(id);
    setTimeout(() => {
      setDownloadingGuide(null);
      alert(`📜 Archival Dispatch Prepared: "${name} Study Guide & Background Brief.pdf" has been compiled and downloaded.`);
    }, 1200);
  };

  return (
    <div className="bg-[#1A1F1A] text-[#EDE6D3] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans paper-grain newsprint-overlay selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]">
      
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-left mb-16 border-b border-[#C9A86A]/20 pb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="emblem-seal px-3 py-0.5 text-[11px] uppercase tracking-[0.2em] bg-[#2E3B2F]">
              Academic Dossiers
            </span>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8A9A7E] font-medium">
              Simulation Chambers
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            Four Arenas of Diplomatic Statecraft
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-xs sm:text-sm text-[#8A9A7E] leading-relaxed font-light">
            Examine the academic mandates, committee background guides, executive board profiles, and operational matrices for each of our four simulated chambers.
          </p>
        </motion.div>

        {/* Committees Grid with Archival Engraved Sigils */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2" id="committees-grid">
          {COMMITTEES.map((com, idx) => {
            const SigilComponent = SIGIL_MAP[com.logo] || BookOpen;

            return (
              <motion.div
                key={com.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.1 }}
              >
                <div
                  id={`com-card-${com.id}`}
                  onClick={() => setSelectedCommittee(com)}
                  className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-8 flex flex-col justify-between cursor-pointer hover:border-[#C9A86A] transition-all group relative shadow-lg"
                >
                  <div>
                    {/* Header: Abbr & Engraved Sigil */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#C9A86A]/20">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#C9A86A] border border-[#C9A86A]/40 px-2 py-0.5 uppercase tracking-widest font-semibold">
                          {com.abbreviation}
                        </span>
                        <span className="font-sans text-[11px] text-[#8A9A7E] uppercase tracking-wider">
                          Chamber 0{idx + 1}
                        </span>
                      </div>
                      
                      {/* Engraved Line-Art Sigil Box */}
                      <div className="h-10 w-10 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] group-hover:bg-[#C9A86A] group-hover:text-[#1A1F1A] transition-colors">
                        <SigilComponent className="h-5 w-5 stroke-[1.5]" />
                      </div>
                    </div>

                    {/* Committee Name */}
                    <h3 className="mt-5 font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal group-hover:text-[#C9A86A] transition-colors text-left">
                      {com.name}
                    </h3>

                    {/* Agenda */}
                    <div className="mt-4 pt-4 border-t border-[#C9A86A]/10 text-left">
                      <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold block mb-1">
                        Primary Deliberation Agenda
                      </span>
                      <p className="font-serif text-base text-[#EDE6D3] italic font-normal leading-relaxed">
                        "{com.agenda}"
                      </p>
                    </div>

                    <p className="mt-4 font-sans text-xs text-[#EDE6D3]/80 line-clamp-3 text-left leading-relaxed font-light">
                      {com.description}
                    </p>
                  </div>

                  {/* Footer & Board Preview */}
                  <div className="mt-8 flex items-center justify-between border-t border-[#C9A86A]/20 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[10px] text-[#8A9A7E] uppercase tracking-wider">Executive Board:</span>
                      <span className="font-sans text-xs text-[#EDE6D3] font-medium">
                        {com.eb.map((m) => m.name.split(" ")[0]).join(" & ")}
                      </span>
                    </div>
                    
                    <span className="flex items-center gap-1 font-sans text-xs uppercase tracking-wider text-[#C9A86A] group-hover:translate-x-1 transition-transform">
                      <span>Examine Dossier</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Detailed Committee Archival Dossier Modal Overlay */}
      {selectedCommittee && (() => {
        const SigilComponent = SIGIL_MAP[selectedCommittee.logo] || BookOpen;

        return (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#141814]/90 backdrop-blur-sm p-4 flex items-center justify-center" id="committee-detail-modal">
            <div className="relative w-full max-w-2xl border-2 border-[#C9A86A] bg-[#2E3B2F] p-6 sm:p-8 shadow-2xl my-8 text-left">
              
              {/* Corner Engraved Markings */}
              <div className="absolute top-2 left-3 text-[9px] font-mono text-[#C9A86A]/40">ACADEMIC-BRIEF // IIST</div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedCommittee(null)}
                className="absolute right-4 top-4 border border-[#C9A86A]/40 p-1.5 text-[#EDE6D3] hover:text-[#C9A86A] hover:border-[#C9A86A] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Modal Title & Sigil */}
              <div className="flex items-start gap-4 pr-8 border-b border-[#C9A86A]/30 pb-5 pt-2">
                <div className="h-12 w-12 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] shrink-0">
                  <SigilComponent className="h-6 w-6 stroke-[1.5]" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold border border-[#C9A86A]/40 px-2 py-0.5 inline-block mb-1">
                    {selectedCommittee.abbreviation}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                    {selectedCommittee.name}
                  </h2>
                </div>
              </div>

              {/* Agenda Box */}
              <div className="mt-6 border border-[#C9A86A]/30 bg-[#1A1F1A] p-5">
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold block mb-1">
                  Official Council Agenda
                </span>
                <p className="font-serif text-base sm:text-lg text-[#EDE6D3] italic font-normal leading-relaxed">
                  "{selectedCommittee.agenda}"
                </p>
              </div>

              {/* Description & Scope */}
              <div className="mt-6 font-sans text-xs sm:text-sm text-[#EDE6D3]/85 leading-relaxed space-y-3 font-light">
                <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] font-medium">// SCOPE & MANDATE</h4>
                <p>{selectedCommittee.description}</p>
                <p>
                  Delegates assigned to this chamber will be judged on precision of treaty citation, diplomatic maneuvering, working paper clarity, and fidelity to their allocated national stance.
                </p>
              </div>

              {/* Executive Board */}
              <div className="mt-8 border-t border-[#C9A86A]/20 pt-6">
                <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] font-medium mb-4">// EXECUTIVE BOARD PRESIDIUM</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedCommittee.eb.map((member) => (
                    <div key={member.name} className="flex items-center gap-3 border border-[#C9A86A]/25 bg-[#1A1F1A] p-3">
                      <div className="h-8 w-8 border border-[#C9A86A] flex items-center justify-center font-serif text-xs text-[#C9A86A] bg-[#2E3B2F]">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-serif text-sm text-[#EDE6D3] font-normal">{member.name}</p>
                        <p className="font-sans text-[10px] uppercase text-[#8A9A7E] tracking-wider">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer & Download Button */}
              <div className="mt-8 flex flex-wrap gap-4 justify-between items-center border-t border-[#C9A86A]/20 pt-6">
                <div className="flex items-center gap-2 text-xs text-[#8A9A7E]">
                  <FileText className="h-4 w-4 text-[#C9A86A]" />
                  <span>Background Study Brief v1.0 (PDF)</span>
                </div>
                
                <button
                  disabled={downloadingGuide === selectedCommittee.id}
                  onClick={() => handleDownload(selectedCommittee.id, selectedCommittee.name)}
                  className="px-5 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#dfbe7e] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {downloadingGuide === selectedCommittee.id ? (
                    <>
                      <Orbit className="h-3.5 w-3.5 animate-spin text-[#1A1F1A]" />
                      <span>Compiling Brief...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 text-[#1A1F1A]" />
                      <span>Download Study Guide</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
