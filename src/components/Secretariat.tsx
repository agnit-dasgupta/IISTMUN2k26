/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SECRETARIAT } from "../data";
import { Mail, Linkedin, Compass, MessageSquare, ShieldCheck, CheckCircle2, X } from "lucide-react";
import { motion } from "motion/react";
import SpotlightCard from "./SpotlightCard";

export default function Secretariat() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleContactMember = (name: string, email: string) => {
    setToastMessage(`🛰️ Uplink protocol initialized with ${name}. Dispatch queued via ${email}.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="bg-[#04060a] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Orionix Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-[140px] rounded-full" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] animate-fade-in flex items-center gap-3 rounded-full border border-cyan-500/30 bg-[#070a12]/95 px-5 py-3 shadow-[0_0_30px_rgba(56,189,248,0.25)] backdrop-blur-xl">
          <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="font-sans text-xs font-bold text-slate-200">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-white ml-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
            // COMMAND & OPERATIONS
          </span>
          <h1 className="mt-4 font-sans text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            The Secretariat Board
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-slate-400 text-xs sm:text-sm leading-relaxed">
            Meet the academic orchestrators, logistics command, and diplomacy designers behind the 8th annual Indian Institute of Space Science and Technology Model UN.
          </p>
        </motion.div>

        {/* Secretariat Grid with Spotlight Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" id="secretariat-grid">
          {SECRETARIAT.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
            >
              <SpotlightCard
                id={`sec-member-${member.id}`}
                className="p-6 h-full flex flex-col justify-between"
                spotlightColor="rgba(56, 189, 248, 0.12)"
              >
                <div>
                  {/* Avatar Initial Block */}
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/15 via-indigo-600/15 to-black border border-white/[0.1] shadow-inner group-hover:border-cyan-500/40 transition-all duration-300">
                    <span className="font-sans text-2xl font-black bg-gradient-to-tr from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black border border-white/[0.1] text-cyan-400">
                      <ShieldCheck className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <h3 className="font-sans text-base font-bold text-white group-hover:text-cyan-300 transition-colors duration-200">
                      {member.name}
                    </h3>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold">
                      {member.designation}
                    </p>
                    <p className="mt-3 font-sans text-xs leading-relaxed text-slate-400 text-left">
                      {member.bio}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 border-t border-white/[0.08] pt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleContactMember(member.name, member.email || "support@iistmun.org")}
                    id={`sec-msg-btn-${member.id}`}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white font-sans transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                    Uplink
                  </button>

                  <div className="flex items-center gap-2">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="rounded-full p-2 border border-white/[0.08] hover:border-white/[0.2] bg-white/[0.02] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all"
                        title="Send Mail"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-2 border border-white/[0.08] hover:border-cyan-500/40 bg-white/[0.02] hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 transition-all"
                      title="LinkedIn Portfolio"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Assistance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-16"
        >
          <SpotlightCard className="p-8 text-center max-w-3xl mx-auto" spotlightColor="rgba(99, 102, 241, 0.15)">
            <Compass className="mx-auto h-8 w-8 text-cyan-400 animate-spin-slow mb-4" />
            <h3 className="font-sans text-xl font-bold text-white uppercase tracking-wider">Need Coordination Assistance?</h3>
            <p className="mt-2 font-sans text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Whether you are coordinating contingent housing, need clarifications on rules of procedures, or are requesting specific portfolio accommodations, our secretariat is available 24/7.
            </p>
            <div className="mt-6 flex justify-center">
              <a
                href="mailto:support@iistmun.org"
                className="rounded-full bg-white hover:bg-cyan-300 text-slate-950 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
              >
                Contact General Registry
              </a>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </div>
  );
}
