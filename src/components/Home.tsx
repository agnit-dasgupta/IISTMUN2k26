/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Mail, MapPin, Plane, Train,
  Bus, Send, CheckCircle2, ExternalLink,
  Clock, Compass, Globe, Orbit, AlertCircle,
  MessageSquare, ShieldCheck, Landmark, Telescope,
  Rocket, BookOpen, Layers, Award, Radio, ChevronRight,
  Flame, Leaf, Scale, Check
} from "lucide-react";
import { motion } from "motion/react";
import MarqueeTicker from "./MarqueeTicker";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export default function Home({ setActiveTab }: HomeProps) {
  // Contact Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "EB Application",
    message: ""
  });
  const [lastMailtoUrl, setLastMailtoUrl] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedQueryId, setSavedQueryId] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const category = formData.category;
    const message = formData.message.trim();
    const timestamp = new Date().toLocaleString();

    let docId: string | null = null;
    try {
      // 1. Direct write to Firebase Firestore
      const docRef = await addDoc(collection(db, "contact_queries"), {
        name,
        email,
        category,
        message,
        timestamp,
        createdAt: serverTimestamp(),
        status: "pending",
        destination: "support@iistmun.org",
        source: "portal_contact_form"
      });
      docId = docRef.id;
      setSavedQueryId(docId);
    } catch (firebaseErr) {
      console.error("Firebase write error for contact query:", firebaseErr);
    }

    // 2. Also notify server endpoint for backup
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          queryId: docId || "offline-ref",
          sentTo: "support@iistmun.org"
        })
      });
    } catch {
      // Offline / client fallback
    }

    const subject = `[IISTMUN 2027 Query: ${category}] from ${name}`;
    const body = 
      `Greetings Secretariat,\n\n` +
      `You have received a new diplomatic query from the IISTMUN 2027 Portal:\n\n` +
      `• Reference ID: ${docId || "Saved to Firebase"}\n` +
      `• Sender Name: ${name}\n` +
      `• Sender Email: ${email}\n` +
      `• Inquiry Category: ${category}\n\n` +
      `• Message / Dispatch:\n${message}\n\n` +
      `----------------------------------------\n` +
      `Destination: support@iistmun.org\n` +
      `Transmitted: ${timestamp}\n`;

    const mailtoUrl = `mailto:support@iistmun.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setLastMailtoUrl(mailtoUrl);

    setIsSubmitting(false);
    setFormSubmitted(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative bg-transparent text-[#EDE6D3] min-h-screen overflow-hidden font-sans paper-grain newsprint-overlay selection:bg-[#F8C8DC]/30 selection:text-[#EDE6D3]">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION - HOME WITH COUNTER (FIRST PART ON LANDING PAGE)          */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-12 sm:pt-16 md:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center" id="hero-landing-section">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center space-y-6 sm:space-y-8"
        >

          {/* Official Convocation Emblem / Seal */}
          <div className="relative group select-none">
            <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-tr from-[#C9A86A]/25 via-[#8BA06F]/20 to-[#C9A86A]/25 rounded-full blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none" />
            <div className="relative flex items-center justify-center h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 rounded-full border border-[#C9A86A]/60 bg-[#1A1F1A]/95 p-3 shadow-2xl backdrop-blur-md ring-1 ring-[#C9A86A]/30 group-hover:border-[#C9A86A] transition-all duration-500">
              <img
                src="/logo-emblem-transparent.png"
                alt="IIST MUN 2027 Official Seal"
                className="h-full w-full object-contain filter drop-shadow-[0_4px_16px_rgba(201,168,106,0.35)] transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Main Display Title & Theme */}
          <div className="space-y-3">
            <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[5.5rem] font-normal tracking-wide text-[#EDE6D3] leading-none select-none">
              IIST MUN <span className="text-[#C9A86A]">2027</span>
            </h1>
            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="h-px w-8 sm:w-12 bg-[#C9A86A]/40" />
              <span className="font-sans text-xs sm:text-sm uppercase tracking-[0.3em] text-[#8A9A7E] font-medium">
                Save &middot; Sustain &middot; Safeguard
              </span>
              <span className="h-px w-8 sm:w-12 bg-[#C9A86A]/40" />
            </div>

            {/* Diplomatic & Sustainable Theme Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8BA06F] bg-[#4A6048]/25 border border-[#6A7B52]/40 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8BA06F] inline-block animate-pulse"></span>
                Sustainable Space &amp; Earth Diplomacy
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] bg-[#C9A86A]/10 border border-[#C9A86A]/35 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                Harmony, Peace &amp; Global Statecraft
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#CFD7D0] bg-[#5A645D]/20 border border-[#8E9991]/35 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                One Earth &middot; One Family &middot; One Future
              </span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* MINIMALIST COUNTDOWN CHRONOMETER (UNBOXED & ELEGANT)                  */}
          {/* ===================================================================== */}
          <div className="w-full max-w-xl mx-auto py-2" id="countdown-counter-section">
            <div className="flex items-center justify-center gap-3 sm:gap-7 md:gap-10">
              
              {/* DAYS */}
              <div className="flex flex-col items-center min-w-[52px] sm:min-w-[68px]">
                <span className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#C9A86A] font-light leading-none select-none tracking-widest">
                  &mdash;
                </span>
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8A9A7E] mt-2 font-medium">
                  Days
                </span>
              </div>

              <span className="font-serif text-2xl sm:text-4xl text-[#C9A86A]/40 pb-5 select-none">:</span>

              {/* HOURS */}
              <div className="flex flex-col items-center min-w-[52px] sm:min-w-[68px]">
                <span className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#C9A86A] font-light leading-none select-none tracking-widest">
                  &mdash;
                </span>
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8A9A7E] mt-2 font-medium">
                  Hours
                </span>
              </div>

              <span className="font-serif text-2xl sm:text-4xl text-[#C9A86A]/40 pb-5 select-none">:</span>

              {/* MINUTES */}
              <div className="flex flex-col items-center min-w-[52px] sm:min-w-[68px]">
                <span className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#C9A86A] font-light leading-none select-none tracking-widest">
                  &mdash;
                </span>
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8A9A7E] mt-2 font-medium">
                  Minutes
                </span>
              </div>

              <span className="font-serif text-2xl sm:text-4xl text-[#C9A86A]/40 pb-5 select-none">:</span>

              {/* SECONDS */}
              <div className="flex flex-col items-center min-w-[52px] sm:min-w-[68px]">
                <span className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#C9A86A] font-light leading-none select-none tracking-widest">
                  &mdash;
                </span>
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8A9A7E] mt-2 font-medium">
                  Seconds
                </span>
              </div>

            </div>
          </div>

          {/* Concise Diplomatic Subtitle */}
          <p className="font-sans text-xs sm:text-sm md:text-base text-[#EDE6D3]/85 max-w-2xl leading-relaxed font-light">
            The premier diplomatic convocation organized by the Indian Institute of Space Science and Technology (IIST), Valiamala, Thiruvananthapuram. Convening future leaders to debate orbital sustainability, international security, and planetary governance.
          </p>

          {/* Status Notices: EB and Campus Ambassador */}
          <div className="w-full max-w-2xl pt-2 sm:pt-4" id="registrations-status-banner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Notice 1: EB registrations opening soon */}
              <div className="border border-[#C9A86A]/50 hover:border-[#8BA06F] bg-[#1A1F1A]/85 p-5 text-left flex items-start gap-3.5 shadow-lg group transition-all duration-300">
                <span className="relative flex h-3 w-3 mt-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8BA06F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8BA06F]"></span>
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8BA06F] block font-medium">
                      Executive Board
                    </span>
                    <span className="font-mono text-[9px] text-[#8A9A7E]/70 tracking-wider">
                      EB RECRUITMENT
                    </span>
                  </div>
                  <span className="font-sans text-xs sm:text-sm text-[#EDE6D3] font-medium tracking-wide block group-hover:text-[#EDE6D3] transition-colors">
                    EB registrations opening soon...
                  </span>
                </div>
              </div>

              {/* Notice 2: Campus ambassador registrations opening soon */}
              <div className="border border-[#C9A86A]/50 hover:border-[#CFD7D0] bg-[#1A1F1A]/85 p-5 text-left flex items-start gap-3.5 shadow-lg group transition-all duration-300">
                <span className="relative flex h-3 w-3 mt-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CFD7D0] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#CFD7D0]"></span>
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#CFD7D0] block font-medium">
                      Outreach &amp; Delegation
                    </span>
                    <span className="font-mono text-[9px] text-[#CFD7D0]/70 tracking-wider">
                      FELLOWSHIP
                    </span>
                  </div>
                  <span className="font-sans text-xs sm:text-sm text-[#EDE6D3] font-medium tracking-wide block group-hover:text-[#EDE6D3] transition-colors">
                    campus ambassador registrations opening soon
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Hairline Divider */}
          <div className="w-full max-w-2xl pt-2 pb-1">
            <div className="w-full h-px bg-[#C9A86A]/25" />
          </div>

          {/* Quick Page Jump Links in Order */}
          <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            <button
              onClick={() => scrollToSection("about-iist-section")}
              className="group border border-[#C9A86A]/30 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-3 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-sm sm:text-base text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-0.5">
                01
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                About IIST
              </span>
            </button>

            <button
              onClick={() => scrollToSection("about-iistmun-section")}
              className="group border border-[#C9A86A]/30 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-3 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-sm sm:text-base text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-0.5">
                02
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                About IISTMUN
              </span>
            </button>

            <button
              onClick={() => scrollToSection("map-section")}
              className="group border border-[#C9A86A]/30 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-3 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-sm sm:text-base text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-0.5">
                03
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                Campus Map
              </span>
            </button>

            <button
              onClick={() => scrollToSection("contact-section")}
              className="group border border-[#C9A86A]/30 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-3 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-sm sm:text-base text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-0.5">
                04
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                Contact Desk
              </span>
            </button>
          </div>

        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* MARQUEE RUNNING TICKER DISPATCH                                           */}
      {/* ========================================================================= */}
      <MarqueeTicker />

      {/* ========================================================================= */}
      {/* 2. ABOUT IIST SECTION (ORDER ITEM #2)                                     */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-[#C9A86A]/20 text-left" id="about-iist-section">
        
        {/* Section Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#C9A86A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold block">
              Institutional Heritage &bull; Valiamala, Thiruvananthapuram
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            Indian Institute of Space Science and Technology
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-2xl leading-relaxed mt-2">
            Asia's first Space University &mdash; an autonomous deemed university established in 2007 under the Department of Space, Government of India, and conceived by the Indian Space Research Organisation (ISRO).
          </p>
        </div>

        {/* Narrative & Institutional Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* Main Story Column */}
          <div className="lg:col-span-7 space-y-4 font-sans text-xs sm:text-sm text-[#EDE6D3]/85 leading-relaxed">
            <p>
              Inaugurated on 14 September 2007 by former ISRO Chairman <strong className="text-[#C9A86A]">Dr. G. Madhavan Nair</strong>, with former President of India <strong className="text-[#C9A86A]">Dr. A.P.J. Abdul Kalam</strong> serving as its founding Chancellor, IIST was established to provide world-class education and pioneering research tailored to the ambitions of the Indian space programme.
            </p>
            <p>
              Nestled across 100 acres in the picturesque, verdant foothills of the Sahyadri ranges in Valiamala, Thiruvananthapuram, IIST sits adjacent to the <strong className="text-[#EDE6D3]">Liquid Propulsion Systems Centre (LPSC)</strong> of ISRO. This proximity enables unprecedented synergy between academic rigor and live space missions.
            </p>
            <p>
              From designing nano-satellites and atmospheric sounding instruments to contributing directly to historic milestones like <strong className="text-[#C9A86A]">Chandrayaan, Gaganyaan, Aditya-L1, and Shukrayaan</strong>, IIST scholars and faculty represent the vanguard of India&apos;s technological ascent.
            </p>

            {/* Quote Block */}
            <div className="border-l-2 border-[#C9A86A] pl-4 py-2 mt-4 bg-[#2E3B2F]/30 text-xs italic font-serif text-[#EDE6D3]/90">
              &ldquo;Space is the realm of boundless dreams. IIST was born to transform youthful scientific passion into national sovereignty, technological mastery, and humanitarian progress.&rdquo;
            </div>
          </div>

          {/* Key Facts / Highlights Box */}
          <div className="lg:col-span-5">
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold">
                  Institutional Profile
                </span>
                <span className="font-mono text-[9px] text-[#8A9A7E]">VALIAMALA CAMPUS</span>
              </div>

              <dl className="space-y-3 font-sans text-xs">
                <div className="flex items-start justify-between gap-4 pb-2 border-b border-[#8A9A7E]/15">
                  <dt className="text-[#8A9A7E]">Inception</dt>
                  <dd className="font-mono text-[#EDE6D3] text-right font-medium">14 September 2007</dd>
                </div>
                <div className="flex items-start justify-between gap-4 pb-2 border-b border-[#8A9A7E]/15">
                  <dt className="text-[#8A9A7E]">Parent Department</dt>
                  <dd className="font-mono text-[#EDE6D3] text-right font-medium">Department of Space, Govt. of India</dd>
                </div>
                <div className="flex items-start justify-between gap-4 pb-2 border-b border-[#8A9A7E]/15">
                  <dt className="text-[#8A9A7E]">Apex Mentorship</dt>
                  <dd className="font-mono text-[#C9A86A] text-right font-medium">ISRO (Indian Space Research Organisation)</dd>
                </div>
                <div className="flex items-start justify-between gap-4 pb-2 border-b border-[#8A9A7E]/15">
                  <dt className="text-[#8A9A7E]">Founding Chancellor</dt>
                  <dd className="font-mono text-[#EDE6D3] text-right font-medium">Dr. A.P.J. Abdul Kalam</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#8A9A7E]">Campus Location</dt>
                  <dd className="font-mono text-[#EDE6D3] text-right font-medium">Valiamala, Nedumangad, Kerala &bull; 695547</dd>
                </div>
              </dl>

              <div className="pt-3 border-t border-[#C9A86A]/20">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#2E3B2F]/50 border border-[#C9A86A]/20 p-2.5">
                    <span className="font-serif text-xl font-bold text-[#C9A86A] block">100+</span>
                    <span className="text-[9px] font-mono text-[#8A9A7E] uppercase">Space Payloads &amp; Patents</span>
                  </div>
                  <div className="bg-[#2E3B2F]/50 border border-[#C9A86A]/20 p-2.5">
                    <span className="font-serif text-xl font-bold text-[#C9A86A] block">1st</span>
                    <span className="text-[9px] font-mono text-[#8A9A7E] uppercase">Space University in Asia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Pillars of IIST Research & Pedagogy */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 shadow-md hover:border-[#C9A86A] transition-all group">
            <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] mb-4">
              <Rocket className="h-4 w-4" />
            </div>
            <h4 className="font-serif text-lg text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors">
              ISRO Mission Integration
            </h4>
            <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-2">
              Direct institutional linkage with ISRO research facilities nationwide, contributing to launch vehicles, spacecraft autonomy, and deep-space telemetry.
            </p>
          </div>

          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 shadow-md hover:border-[#C9A86A] transition-all group">
            <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] mb-4">
              <Telescope className="h-4 w-4" />
            </div>
            <h4 className="font-serif text-lg text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors">
              Advanced Space Laboratories
            </h4>
            <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-2">
              Houses Small Spacecraft Systems Labs (SSSL), advanced rocket propulsion test rigs, atmospheric lidar sounders, and high-resolution optical observatories.
            </p>
          </div>

          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 shadow-md hover:border-[#C9A86A] transition-all group">
            <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] mb-4">
              <Leaf className="h-4 w-4" />
            </div>
            <h4 className="font-serif text-lg text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors">
              Western Ghats Ecology
            </h4>
            <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-2">
              An eco-harmonious residential campus in the rainforest foothills of Sahyadri, blending sustainable green architecture with planetary observation research.
            </p>
          </div>

          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 shadow-md hover:border-[#C9A86A] transition-all group">
            <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] mb-4">
              <BookOpen className="h-4 w-4" />
            </div>
            <h4 className="font-serif text-lg text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors">
              Scholars of Spacecraft &amp; Law
            </h4>
            <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-2">
              Nurturing aerospace engineers, astrophysicists, and scientific leaders equipped to shape both interplanetary technology and international space policy.
            </p>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. ABOUT IISTMUN SECTION (ORDER ITEM #3)                                  */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-[#C9A86A]/20 text-left" id="about-iistmun-section">
        
        {/* Section Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#C9A86A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold block">
              Diplomatic Tradition &bull; 14th Edition Convocation
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            IIST Model United Nations 2027
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-2xl leading-relaxed mt-2">
            Save &middot; Sustain &middot; Safeguard &mdash; South India's premier collegiate symposium uniting the frontiers of space law, planetary sustainability, and multilateral statecraft.
          </p>
        </div>

        {/* Narrative & Thematic Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          <div className="lg:col-span-7 space-y-4 font-sans text-xs sm:text-sm text-[#EDE6D3]/85 leading-relaxed">
            <p>
              Over thirteen distinguished editions, <strong className="text-[#C9A86A]">IIST MUN</strong> has established a formidable legacy as a premier collegiate diplomatic forum. Hosted by the student body of IIST under the guidance of academic mentors, it convenes top delegates, scholars, and youth debaters from all corners of the nation.
            </p>
            <p>
              While standard Model UN conferences focus strictly on conventional geopolitical agendas, IISTMUN leverages the institution's space heritage to introduce groundbreaking debates at the nexus of <strong className="text-[#EDE6D3]">international space treaties, orbital sustainability, space debris mitigation, remote-sensing data ethics, and planetary stewardship</strong>.
            </p>
            <p>
              For the <strong className="text-[#C9A86A]">14th Edition (2027)</strong>, the convocation rallies under the defining tripartite charter: <strong className="text-[#C9A86A]">Save &middot; Sustain &middot; Safeguard</strong>. Delegates will confront pressing existential questions: How do we balance sovereign space commerce with orbital environmental protection? How can satellite data defend climate-vulnerable nations? How can multilateral diplomacy prevent weaponization in orbit?
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-7 shadow-xl space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold block pb-2 border-b border-[#C9A86A]/20">
                Conference Charter &bull; 14th Edition
              </span>
              
              <div className="space-y-3 font-sans text-xs">
                <div className="border-l-2 border-[#8BA06F] pl-3 py-1">
                  <span className="font-serif text-base text-[#EDE6D3] block font-semibold">SAVE</span>
                  <p className="text-[11px] text-[#8A9A7E] mt-0.5">
                    Defending terrestrial ecosystems, climate-fragile regions, and shared human heritage through satellite-monitored international accords.
                  </p>
                </div>

                <div className="border-l-2 border-[#C9A86A] pl-3 py-1">
                  <span className="font-serif text-base text-[#EDE6D3] block font-semibold">SUSTAIN</span>
                  <p className="text-[11px] text-[#8A9A7E] mt-0.5">
                    Ensuring low Earth orbit (LEO) remains free from catastrophic debris, regulating lunar resources, and stewarding future orbital commons.
                  </p>
                </div>

                <div className="border-l-2 border-[#CFD7D0] pl-3 py-1">
                  <span className="font-serif text-base text-[#EDE6D3] block font-semibold">SAFEGUARD</span>
                  <p className="text-[11px] text-[#8A9A7E] mt-0.5">
                    Upholding the UN Outer Space Treaty (1967), disarmament mandates, international cybersecurity, and peaceful scientific coexistence.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#C9A86A]/20 text-center">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                  Registrations &bull; Opening Shortly for Delegates &amp; EB
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Chamber Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 shadow-md hover:border-[#C9A86A] transition-all group">
            <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] mb-4">
              <Orbit className="h-4 w-4" />
            </div>
            <h4 className="font-serif text-lg text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors">
              Space Law &amp; Governance
            </h4>
            <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-2">
              COPUOS &amp; outer space legal frameworks, space traffic management, anti-satellite (ASAT) test bans, and equitable celestial mining charters.
            </p>
          </div>

          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 shadow-md hover:border-[#C9A86A] transition-all group">
            <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] mb-4">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h4 className="font-serif text-lg text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors">
              Global Geopolitical Security
            </h4>
            <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-2">
              Security Council simulations resolving cross-border tensions, non-proliferation covenants, and multilateral conflict de-escalation protocols.
            </p>
          </div>

          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 shadow-md hover:border-[#C9A86A] transition-all group">
            <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] mb-4">
              <Scale className="h-4 w-4" />
            </div>
            <h4 className="font-serif text-lg text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors">
              Resolution Rigor &amp; Drafting
            </h4>
            <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-2">
              Rigorous UN parliamentary procedure, substantive working papers, and consensus-building that translates debates into legally persuasive draft treaties.
            </p>
          </div>

          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 shadow-md hover:border-[#C9A86A] transition-all group">
            <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] mb-4">
              <Award className="h-4 w-4" />
            </div>
            <h4 className="font-serif text-lg text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors">
              Distinguished Executive Board
            </h4>
            <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-2">
              Adjudicated by seasoned national circuit chairs and diplomats dedicated to impartial scoring, constructive debriefs, and academic excellence.
            </p>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE MAP & HOW TO REACH (ORDER ITEM #4)                         */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-[#C9A86A]/20 text-left" id="map-section">
        
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#C9A86A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold block">
              Transit &bull; Campus Navigation &bull; Geo-Coordinates
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            Interactive Campus Map &amp; How to Reach
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-2xl leading-relaxed mt-2">
            Indian Institute of Space Science and Technology is situated in Valiamala, near Nedumangad, approximately 26 km from Thiruvananthapuram city center, Kerala. Explore the interactive campus locator and transit guide below.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* INTERACTIVE EMBEDDED GOOGLE MAP (REPLACES STATIC BUTTON)              */}
        {/* ===================================================================== */}
        <div className="border-2 border-[#C9A86A]/45 bg-[#141814] shadow-2xl overflow-hidden mb-10">
          
          {/* Map Status & Coordinates Top Bar */}
          <div className="bg-[#233124] border-b border-[#C9A86A]/30 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8BA06F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8BA06F]"></span>
              </span>
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[#EDE6D3] font-semibold">
                Live Geo-Coordinates: 8.6277&deg; N, 77.0373&deg; E
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] border border-[#C9A86A]/30 px-2 py-0.5 bg-[#1A1F1A]">
                Valiamala Campus &bull; ISRO LPSC Adjacent
              </span>
            </div>
          </div>

          {/* Interactive Map Iframe Container */}
          <div className="relative w-full h-[360px] sm:h-[460px] md:h-[520px] bg-[#1A1F1A]">
            <iframe
              title="Indian Institute of Space Science and Technology Valiamala Interactive Map"
              src="https://maps.google.com/maps?q=Indian+Institute+of+Space+Science+and+Technology+Valiamala+Thiruvananthapuram&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Map Footer Bar with Location Details & Direct External Navigation */}
          <div className="p-4 sm:p-6 bg-[#1A1F1A] border-t border-[#C9A86A]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="font-serif text-xl sm:text-2xl text-[#EDE6D3]">
                Indian Institute of Space Science and Technology (IIST)
              </h4>
              <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                Valiamala P.O., Nedumangad, Thiruvananthapuram, Kerala &mdash; 695547
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-[10px] text-[#C9A86A]">
                <span>TRV Airport: ~32 km</span>
                <span>&bull;</span>
                <span>TVC Railway: ~26 km</span>
                <span>&bull;</span>
                <span>Nedumangad Town: ~8 km</span>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Indian+Institute+of+Space+Science+and+Technology+Valiamala"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3] hover:bg-[#C9A86A] hover:text-[#1A1F1A] font-sans text-xs uppercase tracking-[0.18em] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
            >
              <span>Open in Google Maps App</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

        </div>

        {/* 3 Transit Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="how-to-reach-section">

          {/* Mode 1: By Air */}
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 flex flex-col justify-between shadow-md group hover:border-[#C9A86A] transition-all">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold">
                  Aerial Transit
                </span>
                <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A]">
                  <Plane className="h-4 w-4" />
                </div>
              </div>
              <h3 className="font-serif text-xl text-[#EDE6D3]">Trivandrum Airport (TRV)</h3>
              <span className="font-mono text-[10px] text-[#8A9A7E] block mt-1">Distance: ~32 km &bull; 45–55 mins</span>
              <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-3">
                Thiruvananthapuram International Airport connects with major domestic hubs (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai) and global terminals. Pre-paid airport taxis, Uber, and Ola are available around the clock.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#C9A86A]/15 font-mono text-[10px] text-[#C9A86A]">
              Pre-paid Taxi / App Cabs Available
            </div>
          </div>

          {/* Mode 2: By Train */}
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 flex flex-col justify-between shadow-md group hover:border-[#C9A86A] transition-all">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold">
                  Rail Connectivity
                </span>
                <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A]">
                  <Train className="h-4 w-4" />
                </div>
              </div>
              <h3 className="font-serif text-xl text-[#EDE6D3]">Trivandrum Central (TVC)</h3>
              <span className="font-mono text-[10px] text-[#8A9A7E] block mt-1">Distance: ~26 km &bull; 40–50 mins</span>
              <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-3">
                Thiruvananthapuram Central (TVC) &amp; Kochuveli (KCVL) have daily direct express and superfast trains connecting every state. Taxis, auto-rickshaws, and direct state buses operate outside the station concourse.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#C9A86A]/15 font-mono text-[10px] text-[#C9A86A]">
              Major Southern Railway Terminus
            </div>
          </div>

          {/* Mode 3: By Bus & Road */}
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 flex flex-col justify-between shadow-md group hover:border-[#C9A86A] transition-all">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold">
                  Roadways &amp; Bus
                </span>
                <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A]">
                  <Bus className="h-4 w-4" />
                </div>
              </div>
              <h3 className="font-serif text-xl text-[#EDE6D3]">KSRTC Bus Network</h3>
              <span className="font-mono text-[10px] text-[#8A9A7E] block mt-1">Direct via Nedumangad Route</span>
              <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-3">
                Frequent KSRTC buses operate from Thampanoor Central Bus Station to Nedumangad. From Nedumangad, frequent connecting buses pass the main entrance gate of IIST (adjacent to ISRO LPSC).
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#C9A86A]/15 font-mono text-[10px] text-[#C9A86A]">
              Valiamala / LPSC Bus Stop
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. CONTACT US SECTION (DIPLOMATIC COMMUNICATIONS DESK)                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left" id="contact-section">

        {/* Section Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#C9A86A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold block">
              Communications &amp; Dispatches
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            Contact the Secretariat
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-xl leading-relaxed mt-2">
            Have inquiries regarding Executive Board applications, Campus Ambassador fellowships, delegation registrations, or institutional partnerships? Reach out directly to our communications desk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Diplomatic Communications Directory (5 cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Primary Email Card */}
            <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 shadow-md hover:border-[#C9A86A] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A]">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-serif text-lg text-[#EDE6D3]">Electronic Mailboxes</h4>
                  <span className="font-mono text-[10px] text-[#8A9A7E] uppercase">Direct Dispatch Desk</span>
                </div>
              </div>
              <ul className="space-y-3 font-sans text-xs text-[#EDE6D3]/90">
                <li className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#8A9A7E] uppercase">Official Support Mail</span>
                  <a href="mailto:support@iistmun.org" className="text-[#C9A86A] hover:underline font-mono text-xs">
                    support@iistmun.org
                  </a>
                </li>
                <li className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#8A9A7E] uppercase">General Inquiries &amp; Secretariat</span>
                  <a href="mailto:support@iistmun.org" className="text-[#EDE6D3] hover:text-[#C9A86A] font-mono text-xs transition-colors">
                    support@iistmun.org
                  </a>
                </li>
                <li className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#8A9A7E] uppercase">Delegate Affairs &amp; Applications</span>
                  <a href="mailto:support@iistmun.org" className="text-[#EDE6D3] hover:text-[#C9A86A] font-mono text-xs transition-colors">
                    support@iistmun.org
                  </a>
                </li>
              </ul>
            </div>

            {/* Address & Helplines Card */}
            <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 border border-[#C9A86A] bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-serif text-lg text-[#EDE6D3]">Secretariat Headquarters</h4>
                  <span className="font-mono text-[10px] text-[#8A9A7E] uppercase">Postal &amp; Physical Location</span>
                </div>
              </div>
              <p className="font-sans text-xs text-[#EDE6D3]/85 leading-relaxed">
                Indian Institute of Space Science and Technology (IIST)<br />
                Valiamala P.O., Nedumangad, Thiruvananthapuram<br />
                Kerala, India &mdash; 695547
              </p>

              <div className="pt-4 mt-4 border-t border-[#C9A86A]/20 flex items-center gap-2 text-xs font-mono text-[#8A9A7E]">
                <Clock className="h-3.5 w-3.5 text-[#C9A86A]" />
                <span>Operating Hours: Mon &ndash; Sat, 09:00 &ndash; 18:00 IST</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Dispatch Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-8 shadow-xl">

              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#C9A86A]/25">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-semibold block">
                    Diplomatic Query Portal
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                    Transmit a Query
                  </h3>
                </div>
                <div className="h-8 w-8 border border-[#C9A86A]/40 bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>

              {formSubmitted ? (
                <div className="p-6 sm:p-8 border border-[#C9A86A] bg-[#2E3B2F] text-center space-y-4">
                  <CheckCircle2 className="h-9 w-9 text-[#C9A86A] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-serif text-xl sm:text-2xl text-[#EDE6D3]">
                      Query Received &amp; Logged in Firebase
                    </h4>
                    <p className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-widest">
                      Destination: support@iistmun.org • Status: Recorded
                    </p>
                    {savedQueryId && (
                      <span className="inline-block mt-2 font-mono text-[10px] text-[#EDE6D3] bg-[#1A1F1A] border border-[#C9A86A]/40 px-3 py-1">
                        Dispatch Ref: <span className="text-[#C9A86A]">{savedQueryId}</span>
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-[#EDE6D3]/85 max-w-md mx-auto leading-relaxed">
                    Your query has been logged directly into the IISTMUN Secretariat's database and forwarded to <strong className="text-[#C9A86A]">support@iistmun.org</strong>. You may also click below to open your email client and send an additional direct transmission.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={lastMailtoUrl}
                      className="px-5 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#dfbe7e] transition-colors flex items-center gap-2"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Open Email Client</span>
                    </a>
                    <button
                      onClick={() => {
                        setFormSubmitted(false);
                        setFormData({ name: "", email: "", category: "EB Application", message: "" });
                        setSavedQueryId(null);
                      }}
                      className="px-5 py-2.5 border border-[#C9A86A]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:bg-[#2E3B2F] transition-colors cursor-pointer"
                    >
                      Send Another Query
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label htmlFor="contact-name-input" className="block text-[10px] font-mono text-[#8A9A7E] uppercase">
                        Delegate / Inquirer Name *
                      </label>
                      <input
                        id="contact-name-input"
                        type="text"
                        required
                        placeholder="e.g. Niranjan Patil"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#2E3B2F]/60 border border-[#C9A86A]/30 px-3.5 py-2 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label htmlFor="contact-email-input" className="block text-[10px] font-mono text-[#8A9A7E] uppercase">
                        Email Address *
                      </label>
                      <input
                        id="contact-email-input"
                        type="email"
                        required
                        placeholder="name@institution.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#2E3B2F]/60 border border-[#C9A86A]/30 px-3.5 py-2 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label htmlFor="contact-category-select" className="block text-[10px] font-mono text-[#8A9A7E] uppercase">
                      Inquiry Category *
                    </label>
                    <select
                      id="contact-category-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#2E3B2F] border border-[#C9A86A]/30 px-3.5 py-2 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none cursor-pointer"
                    >
                      <option value="EB Application">Executive Board (EB) Applications &amp; Selection</option>
                      <option value="Campus Ambassador">Campus Ambassador Fellowship</option>
                      <option value="Delegation Registrations">Delegation &amp; Institutional Registrations</option>
                      <option value="Accommodation & Travel">Travel, Transit &amp; Accommodation at Valiamala</option>
                      <option value="Partnerships">Institutional Partnerships &amp; Sponsorships</option>
                      <option value="General Query">General Academic / Protocol Query</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label htmlFor="contact-message-input" className="block text-[10px] font-mono text-[#8A9A7E] uppercase">
                      Dispatch Message / Query Details *
                    </label>
                    <textarea
                      id="contact-message-input"
                      required
                      rows={4}
                      placeholder="Please delineate your query or institutional dispatch details..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#2E3B2F]/60 border border-[#C9A86A]/30 px-3.5 py-2 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-[#1A1F1A] border-t-transparent rounded-full animate-spin" />
                        <span>Logging Query to Firebase...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Transmit Query to Secretariat</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

      </section>

    </div>
  );
}
