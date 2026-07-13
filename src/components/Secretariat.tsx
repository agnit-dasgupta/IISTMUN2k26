/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SECRETARIAT } from "../data";
import { Mail, Linkedin, Compass, MessageSquare, ShieldCheck, CheckCircle2, X } from "lucide-react";

export default function Secretariat() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleContactMember = (name: string, email: string) => {
    setToastMessage(`🛰️ Secure uplink protocol established with ${name}. Dispatch queued via ${email}.`);
    // Auto clear toast after 4 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="bg-[#020617] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%)" }}>
      
      {/* Custom Toast Notification System */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-slow flex items-center gap-3 rounded-full border border-blue-500/30 bg-slate-900/95 px-5 py-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-sans text-xs font-bold text-slate-200">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-300 ml-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-mono text-[9px] uppercase tracking-widest text-blue-400 font-bold">// COMMAND & OPERATIONS</span>
          <h1 className="mt-2 font-sans text-3xl font-black tracking-tight text-white sm:text-5xl uppercase">
            The Secretariat Board
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-slate-400 text-sm">
            Meet the academic orchestrators, logistics command, and diplomacy designers behind the 8th annual Indian Institute of Space Science and Technology Model UN.
          </p>
        </div>

        {/* Secretariat Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4" id="secretariat-grid">
          {SECRETARIAT.map((member) => (
            <div
              key={member.id}
              id={`sec-member-${member.id}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/35 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-800 hover:bg-slate-900/50 hover:shadow-xl"
            >
              {/* Outer decorative ring */}
              <div className="absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-blue-500/5 blur-xl transition-all duration-300 group-hover:scale-150" />

              <div>
                {/* Avatar Initial Block */}
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-600/10 to-slate-950 border border-slate-800 shadow-inner group-hover:border-blue-500/30 transition-all duration-300">
                  <span className="font-sans text-3xl font-black bg-gradient-to-tr from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  {/* Small badge overlay */}
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 border border-slate-800 text-blue-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <h3 className="font-sans text-base font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
                    {member.name}
                  </h3>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-blue-400 font-bold">
                    {member.designation}
                  </p>
                  <p className="mt-4 font-sans text-xs leading-relaxed text-slate-400 text-left">
                    {member.bio}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 border-t border-slate-900/80 pt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleContactMember(member.name, member.email || "info@iistmun.in")}
                  id={`sec-msg-btn-${member.id}`}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-400 font-sans transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  Uplink
                </button>

                <div className="flex items-center gap-2">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="rounded-full p-2 border border-slate-900 hover:border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
                      title="Send Mail"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 border border-slate-900 hover:border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-blue-400 transition-all"
                    title="LinkedIn Portfolio"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Secretarial Note */}
        <div className="mt-16 rounded-3xl border border-slate-900 bg-gradient-to-br from-slate-950 via-slate-900/20 to-slate-950 p-8 text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <Compass className="mx-auto h-8 w-8 text-blue-400 animate-spin-slow mb-4" />
          <h3 className="font-sans text-xl font-bold text-white uppercase tracking-wider">Need Coordination Assistance?</h3>
          <p className="mt-2 font-sans text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Whether you are coordinating contingent housing, need clarifications on rules of procedures, or are requesting specific portfolio accommodations, our board is available 24/7.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a
              href="mailto:secgen.iistmun@gmail.com"
              className="rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-900/25 active:scale-95 transition-all"
            >
              Contact General Registry
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
