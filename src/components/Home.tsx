/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Award, Shield, FileText, ChevronRight, 
  MapPin, Calendar, Clock, ArrowRight, Download, Check, Sparkles,
  QrCode, ExternalLink, Globe, Scale, Orbit, ShieldCheck, Mail, Feather,
  Compass, Users, Landmark
} from "lucide-react";
import { motion } from "motion/react";
import MarqueeTicker from "./MarqueeTicker";
import AnimatedCounter from "./AnimatedCounter";

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export default function Home({ setActiveTab }: HomeProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate live countdown to Feb 21
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      let targetYear = now.getFullYear();
      let targetDate = new Date(`${targetYear}-02-21T08:30:00+05:30`);
      
      // If Feb 21 of this year has already passed, count down to next year's Feb 21
      if (targetDate.getTime() <= now.getTime()) {
        targetDate = new Date(`${targetYear + 1}-02-21T08:30:00+05:30`);
      }
      
      const difference = targetDate.getTime() - now.getTime();
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-[#233124] text-[#EDE6D3] min-h-screen overflow-hidden font-sans paper-grain newsprint-overlay selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (STRICTLY REDESIGNED AS PER SPECIFICATION IMAGE)          */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-20 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center" id="hero-landing-section">
        
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center justify-center space-y-7"
        >
          
          {/* Top Date Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs sm:text-sm uppercase tracking-[0.3em] text-[#8A9A7E] font-medium select-none">
              FEBRUARY 21 — 23
            </span>
          </div>

          {/* Main Huge Display Title - Cormorant Garamond Serif */}
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[5.5rem] font-normal tracking-wide text-[#EDE6D3] leading-none select-none">
            IIST MUN
          </h1>

          {/* Live Countdown to Feb 21 */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 my-1" id="hero-live-countdown">
            {/* Days */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A]/80 px-3 sm:px-5 py-2 sm:py-2.5 min-w-[58px] sm:min-w-[72px] text-center shadow-md">
              <span className="block font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal leading-tight">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="block font-sans text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                Days
              </span>
            </div>

            <span className="font-serif text-base sm:text-lg text-[#C9A86A]/60 -mt-2 select-none">:</span>

            {/* Hours */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A]/80 px-3 sm:px-5 py-2 sm:py-2.5 min-w-[58px] sm:min-w-[72px] text-center shadow-md">
              <span className="block font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal leading-tight">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="block font-sans text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                Hours
              </span>
            </div>

            <span className="font-serif text-base sm:text-lg text-[#C9A86A]/60 -mt-2 select-none">:</span>

            {/* Minutes */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A]/80 px-3 sm:px-5 py-2 sm:py-2.5 min-w-[58px] sm:min-w-[72px] text-center shadow-md">
              <span className="block font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal leading-tight">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="block font-sans text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                Mins
              </span>
            </div>

            <span className="font-serif text-base sm:text-lg text-[#C9A86A]/60 -mt-2 select-none">:</span>

            {/* Seconds */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A]/80 px-3 sm:px-5 py-2 sm:py-2.5 min-w-[58px] sm:min-w-[72px] text-center shadow-md">
              <span className="block font-serif text-2xl sm:text-3xl text-[#C9A86A] font-normal leading-tight">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="block font-sans text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                Secs
              </span>
            </div>
          </div>

          {/* Register Now Button with Hairline Gold Border */}
          <div className="pt-2">
            <button
              onClick={() => setActiveTab("register")}
              id="hero-register-now-btn"
              className="inline-block px-9 py-3.5 border border-[#C9A86A] bg-transparent hover:bg-[#C9A86A] text-[#C9A86A] hover:text-[#1A1F1A] font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] transition-all duration-300 cursor-pointer shadow-sm"
            >
              REGISTER NOW
            </button>
          </div>

          {/* Horizontal Hairline Divider Rule */}
          <div className="w-full pt-10 pb-4">
            <div className="w-full h-px bg-[#C9A86A]/25" />
          </div>

          {/* 3 Navigational Action Cards (01 AGENDA, 02 COMMITTEES, 03 REGISTER) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-2 text-center">
            
            {/* 01 AGENDA */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              onClick={() => setActiveTab("schedule")}
              id="hero-card-01-agenda"
              className="group border border-[#C9A86A]/35 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-8 sm:p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-2xl sm:text-3xl text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-2">
                01
              </span>
              <span className="font-sans text-xs sm:text-sm uppercase tracking-[0.22em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                AGENDA
              </span>
            </motion.button>

            {/* 02 COMMITTEES */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              onClick={() => setActiveTab("committees")}
              id="hero-card-02-committees"
              className="group border border-[#C9A86A]/35 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-8 sm:p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-2xl sm:text-3xl text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-2">
                02
              </span>
              <span className="font-sans text-xs sm:text-sm uppercase tracking-[0.22em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                COMMITTEES
              </span>
            </motion.button>

            {/* 03 REGISTER */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              onClick={() => setActiveTab("register")}
              id="hero-card-03-register"
              className="group border border-[#C9A86A]/35 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-8 sm:p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-2xl sm:text-3xl text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-2">
                03
              </span>
              <span className="font-sans text-xs sm:text-sm uppercase tracking-[0.22em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                REGISTER
              </span>
            </motion.button>

          </div>

        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* MARQUEE RUNNING TICKER                                                    */}
      {/* ========================================================================= */}
      <MarqueeTicker />

      {/* ========================================================================= */}
      {/* 2. ENGRAVED COMMITTEE SIGILS                                              */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#C9A86A]/20 text-left">
        
        {/* Section Headline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8A9A7E] font-medium block">
              Academic Chambers & Councils
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
              Four Arenas of Statecraft
            </h2>
          </div>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-md leading-relaxed">
            Deliberate urgent issues spanning outer space governance, planetary disarmament, domestic privatization, and crisis containment.
          </p>
        </div>

        {/* 4 Committee Cards with Engraved Line-Art Sigils & Hairline Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. COPUOS */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
            className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 flex flex-col justify-between hover:border-[#C9A86A] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-widest font-semibold">
                  Chamber I
                </span>
                {/* Engraved Line-Art Sigil */}
                <div className="h-10 w-10 border border-[#C9A86A] flex items-center justify-center text-[#C9A86A] bg-[#1A1F1A]">
                  <Orbit className="h-5 w-5 stroke-[1.5]" />
                </div>
              </div>
              <h3 className="font-serif text-xl text-[#EDE6D3] font-normal group-hover:text-[#C9A86A] transition-colors">
                UN COPUOS
              </h3>
              <p className="font-sans text-[11px] text-[#8A9A7E] uppercase tracking-wider mt-1">
                Peaceful Uses of Outer Space
              </p>
              <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-4">
                Space mining property rights, orbital debris remediation protocols, and planetary protection frameworks.
              </p>
            </div>
            
            <div className="pt-6 mt-6 border-t border-[#C9A86A]/15 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#8A9A7E]">Double / Single</span>
              <button
                onClick={() => setActiveTab("committees")}
                className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Study Guide</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>

          {/* 2. UNGA DISEC */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
            className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 flex flex-col justify-between hover:border-[#C9A86A] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-widest font-semibold">
                  Chamber II
                </span>
                {/* Engraved Line-Art Sigil */}
                <div className="h-10 w-10 border border-[#C9A86A] flex items-center justify-center text-[#C9A86A] bg-[#1A1F1A]">
                  <ShieldCheck className="h-5 w-5 stroke-[1.5]" />
                </div>
              </div>
              <h3 className="font-serif text-xl text-[#EDE6D3] font-normal group-hover:text-[#C9A86A] transition-colors">
                UNGA DISEC
              </h3>
              <p className="font-sans text-[11px] text-[#8A9A7E] uppercase tracking-wider mt-1">
                Disarmament & Security
              </p>
              <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-4">
                Preventing an Arms Race in Outer Space (PAROS) and defending global satellite communication backbones.
              </p>
            </div>
            
            <div className="pt-6 mt-6 border-t border-[#C9A86A]/15 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#8A9A7E]">Individual Seat</span>
              <button
                onClick={() => setActiveTab("committees")}
                className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Study Guide</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>

          {/* 3. AIPPM */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.19, ease: "easeOut" }}
            className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 flex flex-col justify-between hover:border-[#C9A86A] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-widest font-semibold">
                  Chamber III
                </span>
                {/* Engraved Line-Art Sigil */}
                <div className="h-10 w-10 border border-[#C9A86A] flex items-center justify-center text-[#C9A86A] bg-[#1A1F1A]">
                  <Scale className="h-5 w-5 stroke-[1.5]" />
                </div>
              </div>
              <h3 className="font-serif text-xl text-[#EDE6D3] font-normal group-hover:text-[#C9A86A] transition-colors">
                AIPPM Meet
              </h3>
              <p className="font-sans text-[11px] text-[#8A9A7E] uppercase tracking-wider mt-1">
                Indian Political Assembly
              </p>
              <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-4">
                Reviewing India's Space Privatization Policy, FDI in aerospace defense, and domestic tech transfers.
              </p>
            </div>
            
            <div className="pt-6 mt-6 border-t border-[#C9A86A]/15 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#8A9A7E]">Political Leaders</span>
              <button
                onClick={() => setActiveTab("committees")}
                className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Study Guide</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>

          {/* 4. UNSC */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.26, ease: "easeOut" }}
            className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 flex flex-col justify-between hover:border-[#C9A86A] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-widest font-semibold">
                  Chamber IV
                </span>
                {/* Engraved Line-Art Sigil */}
                <div className="h-10 w-10 border border-[#C9A86A] flex items-center justify-center text-[#C9A86A] bg-[#1A1F1A]">
                  <Globe className="h-5 w-5 stroke-[1.5]" />
                </div>
              </div>
              <h3 className="font-serif text-xl text-[#EDE6D3] font-normal group-hover:text-[#C9A86A] transition-colors">
                UNSC Crisis
              </h3>
              <p className="font-sans text-[11px] text-[#8A9A7E] uppercase tracking-wider mt-1">
                Security Council Continuous Crisis
              </p>
              <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-4">
                Anti-satellite weapons deployments, real-time territorial crises, and emergency diplomatic accords.
              </p>
            </div>
            
            <div className="pt-6 mt-6 border-t border-[#C9A86A]/15 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#8A9A7E]">Crisis Council</span>
              <button
                onClick={() => setActiveTab("committees")}
                className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Study Guide</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TICKET-STUB REGISTRATION SECTION                                       */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#C9A86A]/20 text-left">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8A9A7E] font-medium block">
            Official Credentials & Tiers
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            Delegate Boarding Passes
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#EDE6D3]/80 mt-3 leading-relaxed">
            Perforated credential tiers for individual delegates, double delegations, and institutional school contingents.
          </p>
        </div>

        {/* 3 Perforated Ticket Stubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* TICKET 1: INDIVIDUAL DELEGATE */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
            className="ticket-stub border border-[#C9A86A] bg-[#2E3B2F] flex flex-col justify-between relative shadow-xl"
          >
            {/* Left/Right Perforated Notches */}
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-semibold border border-[#C9A86A]/40 px-2 py-0.5">
                  Tier 01 // Solo
                </span>
                <span className="tag-rust px-2 py-0.5 text-[9px]">Priority Allocations</span>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[#EDE6D3] font-normal">Individual Delegate</h3>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">Single Portfolio Allocation in DISEC, AIPPM, or UNSC</p>
              </div>

              <div className="pt-2">
                <span className="font-serif text-4xl text-[#EDE6D3] font-normal">₹1,200</span>
                <span className="font-sans text-xs text-[#8A9A7E] ml-2">/ delegate</span>
              </div>

              {/* Perforated Divider */}
              <div className="perforated-edge pt-4 mt-4 space-y-2.5 font-sans text-xs text-[#EDE6D3]/85">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Full 3-Day Committee Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Official IIST MUN Delegate Kit & Placard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Campus Lunch, High Tea & Socials</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Stargazing at IIST Observatory Dome</span>
                </div>
              </div>
            </div>

            {/* Simulated QR / Action Stub Bottom */}
            <div className="bg-[#1A1F1A] border-t border-dashed border-[#C9A86A]/40 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 border border-[#C9A86A]/40 bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                  <QrCode className="h-5 w-5" />
                </div>
                <div className="font-mono text-[9px] text-[#8A9A7E] uppercase">
                  <div>PASS: IND-2026</div>
                  <div className="text-[#C9A86A]">VERIFIED</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("register")}
                className="px-4 py-2 bg-[#C9A86A] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#dfbe7e] transition-colors cursor-pointer"
              >
                Claim Pass
              </button>
            </div>
          </motion.div>

          {/* TICKET 2: DOUBLE DELEGATION (COPUOS / UNSC) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
            className="ticket-stub border-2 border-[#C9A86A] bg-[#2E3B2F] flex flex-col justify-between relative shadow-2xl"
          >
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1F1A] font-bold bg-[#C9A86A] px-2 py-0.5">
                  Featured Tier // Dual
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A]">Pair Pass</span>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[#EDE6D3] font-normal">Double Delegation</h3>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">Joint Representation for COPUOS & UNSC Chambers</p>
              </div>

              <div className="pt-2">
                <span className="font-serif text-4xl text-[#C9A86A] font-normal">₹2,200</span>
                <span className="font-sans text-xs text-[#8A9A7E] ml-2">/ pair of delegates</span>
              </div>

              {/* Perforated Divider */}
              <div className="perforated-edge pt-4 mt-4 space-y-2.5 font-sans text-xs text-[#EDE6D3]/85">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Two Complete Delegate Credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Strategic High-Table Portfolio Allocation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Access to ISRO Lab & Observatory Tour</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Dual Delegate Commendation Eligibility</span>
                </div>
              </div>
            </div>

            {/* Simulated QR / Action Stub Bottom */}
            <div className="bg-[#1A1F1A] border-t border-dashed border-[#C9A86A]/40 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 border border-[#C9A86A]/40 bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                  <QrCode className="h-5 w-5" />
                </div>
                <div className="font-mono text-[9px] text-[#8A9A7E] uppercase">
                  <div>PASS: DBL-2026</div>
                  <div className="text-[#C9A86A]">COPUOS / UNSC</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("register")}
                className="px-4 py-2 bg-[#C9A86A] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#dfbe7e] transition-colors cursor-pointer"
              >
                Claim Pass
              </button>
            </div>
          </motion.div>

          {/* TICKET 3: SCHOOL / INSTITUTIONAL CONTINGENT */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: 0.25, ease: "easeOut" }}
            className="ticket-stub border border-[#C9A86A] bg-[#2E3B2F] flex flex-col justify-between relative shadow-xl"
          >
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-semibold border border-[#C9A86A]/40 px-2 py-0.5">
                  Tier 03 // Delegation
                </span>
                <span className="font-mono text-[9px] text-[#8A9A7E]">6+ Delegates</span>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[#EDE6D3] font-normal">School Delegation</h3>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">Whole Institutional Contingent with Faculty Advisor</p>
              </div>

              <div className="pt-2">
                <span className="font-serif text-4xl text-[#EDE6D3] font-normal">₹1,000</span>
                <span className="font-sans text-xs text-[#8A9A7E] ml-2">/ delegate (Group Rate)</span>
              </div>

              {/* Perforated Divider */}
              <div className="perforated-edge pt-4 mt-4 space-y-2.5 font-sans text-xs text-[#EDE6D3]/85">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Complimentary Faculty Advisor Pass</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Best Delegation Trophy Contest Entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Coordinated On-Campus Group Housing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#C9A86A] shrink-0" />
                  <span>Pre-MUN Training & Rules Guidance</span>
                </div>
              </div>
            </div>

            {/* Simulated QR / Action Stub Bottom */}
            <div className="bg-[#1A1F1A] border-t border-dashed border-[#C9A86A]/40 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 border border-[#C9A86A]/40 bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                  <QrCode className="h-5 w-5" />
                </div>
                <div className="font-mono text-[9px] text-[#8A9A7E] uppercase">
                  <div>PASS: CONT-2026</div>
                  <div className="text-[#C9A86A]">CONTINGENT</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("register")}
                className="px-4 py-2 bg-[#C9A86A] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#dfbe7e] transition-colors cursor-pointer"
              >
                Claim Pass
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ARCHIVAL LETTER FROM THE SECRETARIAT                                   */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-b border-[#C9A86A]/20 text-left">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="border border-[#C9A86A] bg-[#2E3B2F] p-8 sm:p-12 relative shadow-2xl"
        >
          
          {/* Header Masthead */}
          <div className="border-b border-[#C9A86A]/30 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] font-medium block">
                Office of the Secretary-General
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal tracking-wide mt-1">
                Diplomatic Convocation Brief
              </h3>
            </div>
            <div className="text-left sm:text-right font-mono text-[10px] text-[#8A9A7E]">
              <div>REF: IIST-MUN-2026/ED-01</div>
              <div className="text-[#C9A86A]">VALIAMALA, KERALA</div>
            </div>
          </div>

          {/* Letter Body */}
          <div className="space-y-4 font-sans text-sm text-[#EDE6D3]/90 leading-relaxed font-light">
            <p>
              Distinguished Delegates, Faculty Advisors, and Guests,
            </p>
            <p>
              On behalf of the Indian Institute of Space Science and Technology and our student secretariat, it is our distinct honor to welcome you to the 8th convocation of IIST Model United Nations, convened under our guiding directive: <strong className="font-normal text-[#C9A86A]">"Save · Sustain · Safeguard."</strong>
            </p>
            <p>
              As aerospace engineering scholars and diplomats, we recognize that orbital space is not merely an infinite void of opportunity, but a fragile, congested commons requiring decisive international governance. From drafting orbital debris remediation protocols in COPUOS to neutralizing anti-satellite threats in the Security Council, the work you undertake across these three days mirrors the real-world negotiations shaping our planet's future.
            </p>
            <p>
              We look forward to hosting you on our Valiamala campus for rigorous debate, scholarly fellowship, and an unforgettable convocation.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 mt-8 border-t border-[#C9A86A]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-[#C9A86A] rounded-full flex items-center justify-center font-serif text-xs text-[#C9A86A] bg-[#1A1F1A]">
                AN
              </div>
              <div>
                <strong className="font-serif text-base text-[#EDE6D3] block font-normal">Aarav Nair</strong>
                <span className="font-sans text-[11px] text-[#8A9A7E] uppercase tracking-wider">Secretary-General, IIST MUN 2026</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-[#C9A86A] rounded-full flex items-center justify-center font-serif text-xs text-[#C9A86A] bg-[#1A1F1A]">
                SS
              </div>
              <div>
                <strong className="font-serif text-base text-[#EDE6D3] block font-normal">Shreya Sharma</strong>
                <span className="font-sans text-[11px] text-[#8A9A7E] uppercase tracking-wider">Director-General, IIST MUN 2026</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRE-MUN SCIENTIFIC WORKSHOP BANNER                                     */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Feather className="h-4 w-4 text-[#C9A86A]" />
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#C9A86A] font-semibold">
                Pre-Conference Masterclass
              </span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
              Space Technology & Orbital Diplomacy Workshop
            </h3>
            <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] leading-relaxed">
              Equip your delegation with foundational science briefing on propulsion, orbital mechanics, and UN resolution drafting before entering committee chambers. Open to schools and individual delegates.
            </p>
          </div>

          <button
            onClick={() => setActiveTab("workshop-register")}
            className="px-6 py-3 border border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3] font-sans text-xs uppercase tracking-[0.18em] hover:bg-[#C9A86A] hover:text-[#1A1F1A] transition-all cursor-pointer shrink-0"
          >
            Register for Workshop
          </button>
        </motion.div>
      </section>
    </div>
  );
}
