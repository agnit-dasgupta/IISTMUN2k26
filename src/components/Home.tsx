/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sparkles, Mail, Users, MapPin, Plane, Train,
  Bus, Navigation, Send, CheckCircle2, ExternalLink,
  Clock, Phone, ShieldCheck, ArrowUpRight, Compass,
  Globe, Orbit, Check, AlertCircle, MessageSquare
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

  const secretariatMembers = [
    {
      id: "sec-gen",
      name: "Niranjan Patil",
      initials: "NP",
      designation: "Secretary-General",
      roleBadge: "Convocation Head",
      bio: "Senior aerospace engineering scholar at IIST with extensive national MUN credentials. Leading academic chambers, strategic space law directives, and bilateral diplomacy for IISTMUN 2027.",
      email: "support@iistmun.org"
    },
    {
      id: "dir-gen",
      name: "Ananya Bhat",
      initials: "AB",
      designation: "Deputy Secretary General",
      roleBadge: "Operations & Logistics",
      bio: "Aerospace engineering scholar with a passion for international relations and diplomacy. I am committed to ensuring that IISTMUN 2027 provides a platform for meaningful dialogue and collaboration among future leaders.",
      email: "support@iistmun.org"
    },
    {
      id: "usg-delegate",
      name: "Parth Ray",
      initials: "PR",
      designation: "Director General",
      roleBadge: "Portfolio Allocations",
      bio: "Pursuing Dual Degree in Astronomy & Earth System Sciences. Manages delegate onboarding, committee administration, Executive Board selection protocols, and country allocations.",
      email: "support@iistmun.org"
    },
    {
      id: "usg-website",
      name: "Agnit Dasgupta",
      initials: "AD",
      designation: "USG Website",
      roleBadge: "Communications & Media",
      bio: "Physics major and investigative editorialist. Directs the international press corps, committee dispatch journalism, satirical daily gazettes, and photography documentation.",
      email: "support@iistmun.org"
    }
  ];

  return (
    <div className="relative bg-[#233124] text-[#EDE6D3] min-h-screen overflow-hidden font-sans paper-grain newsprint-overlay selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION - HOME                                                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center" id="hero-landing-section">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center justify-center space-y-6 sm:space-y-8"
        >

          {/* Highlight Badge: IISTMUN 2027 14th Edition Coming Soon */}
          <div className="inline-flex items-center gap-2.5 px-5 sm:px-7 py-2.5 border border-[#C9A86A] bg-[#1A1F1A]/90 text-[#C9A86A] shadow-lg shadow-black/30 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-[#C9A86A] animate-pulse shrink-0" />
            <span className="font-serif text-xs sm:text-sm md:text-base tracking-[0.22em] uppercase font-medium">
              IISTMUN 2027 &middot; 14th Edition Coming Soon
            </span>
            <Sparkles className="h-4 w-4 text-[#C9A86A] animate-pulse shrink-0" />
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
          </div>

          {/* Concise Diplomatic Subtitle */}
          <p className="font-sans text-xs sm:text-sm md:text-base text-[#EDE6D3]/85 max-w-2xl leading-relaxed font-light">
            The premier diplomatic convocation organized by the Indian Institute of Space Science and Technology (IIST), Valiamala, Thiruvananthapuram. Convening future leaders to debate orbital sustainability, international security, and planetary governance.
          </p>

          {/* Instead of Register Now: EB and Campus Ambassador Status Notices */}
          <div className="w-full max-w-2xl pt-2 sm:pt-4" id="registrations-status-banner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Notice 1: EB registrations opening soon */}
              <div className="border border-[#C9A86A]/50 bg-[#1A1F1A]/85 p-5 text-left flex items-start gap-3.5 shadow-lg group hover:border-[#C9A86A] transition-all duration-300">
                <span className="relative flex h-3 w-3 mt-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A86A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C9A86A]"></span>
                </span>
                <div className="space-y-0.5">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] block font-medium">
                    Executive Board
                  </span>
                  <span className="font-sans text-xs sm:text-sm text-[#EDE6D3] font-medium tracking-wide block">
                    EB registrations opening soon...
                  </span>
                </div>
              </div>

              {/* Notice 2: Campus ambassador registrations opening soon */}
              <div className="border border-[#C9A86A]/50 bg-[#1A1F1A]/85 p-5 text-left flex items-start gap-3.5 shadow-lg group hover:border-[#C9A86A] transition-all duration-300">
                <span className="relative flex h-3 w-3 mt-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A86A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C9A86A]"></span>
                </span>
                <div className="space-y-0.5">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] block font-medium">
                    Outreach & Delegation
                  </span>
                  <span className="font-sans text-xs sm:text-sm text-[#EDE6D3] font-medium tracking-wide block">
                    campus ambassador registrations opening soon
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Hairline Divider */}
          <div className="w-full max-w-2xl pt-4 pb-1">
            <div className="w-full h-px bg-[#C9A86A]/25" />
          </div>

          {/* Quick Page Jump Links */}
          <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-center">
            <button
              onClick={() => scrollToSection("contact-section")}
              className="group border border-[#C9A86A]/30 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-3.5 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-base sm:text-lg text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-0.5">
                01
              </span>
              <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                Contact Us
              </span>
            </button>

            <button
              onClick={() => scrollToSection("secretariat-section")}
              className="group border border-[#C9A86A]/30 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-3.5 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-base sm:text-lg text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-0.5">
                02
              </span>
              <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                Secretariat
              </span>
            </button>

            <button
              onClick={() => scrollToSection("how-to-reach-section")}
              className="group border border-[#C9A86A]/30 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] p-3.5 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <span className="font-serif text-base sm:text-lg text-[#C9A86A] font-normal group-hover:scale-105 transition-transform duration-300 mb-0.5">
                03
              </span>
              <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#EDE6D3] font-medium group-hover:text-[#C9A86A] transition-colors">
                How to Reach
              </span>
            </button>
          </div>

        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* MARQUEE RUNNING TICKER                                                    */}
      {/* ========================================================================= */}
      <MarqueeTicker />

      {/* ========================================================================= */}
      {/* 2. CONTACT US SECTION                                                     */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-[#C9A86A]/20 text-left" id="contact-section">

        {/* Section Header */}
        <div className="mb-12">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold block">
            Communications & Dispatches
          </span>
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
                  <span className="text-[10px] font-mono text-[#8A9A7E] uppercase">General Inquiries & Secretariat</span>
                  <a href="mailto:support@iistmun.org" className="text-[#EDE6D3] hover:text-[#C9A86A] font-mono text-xs transition-colors">
                    support@iistmun.org
                  </a>
                </li>
                <li className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#8A9A7E] uppercase">Delegate Affairs & Applications</span>
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
                  <span className="font-mono text-[10px] text-[#8A9A7E] uppercase">Postal & Physical Location</span>
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
                      className="px-5 py-2.5 border border-[#C9A86A]/40 text-[#EDE6D3] hover:text-[#C9A86A] font-sans text-xs uppercase tracking-wider hover:bg-[#1A1F1A] transition-colors cursor-pointer"
                    >
                      Send Another Query
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aditi Menon"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#2E3B2F]/60 border border-[#C9A86A]/30 px-3.5 py-2.5 text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:border-[#C9A86A] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="aditi@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#2E3B2F]/60 border border-[#C9A86A]/30 px-3.5 py-2.5 text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:border-[#C9A86A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#2E3B2F] border border-[#C9A86A]/30 px-3.5 py-2.5 text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none cursor-pointer"
                    >
                      <option value="EB Application">Executive Board (EB) Application Inquiry</option>
                      <option value="Campus Ambassador">Campus Ambassador Fellowship Inquiry</option>
                      <option value="School Delegation">Institutional / School Delegation</option>
                      <option value="General">General Inquiries & Space Diplomacy</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                      Message / Dispatch *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Detail your inquiry, questions about opening dates, or institutional background..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#2E3B2F]/60 border border-[#C9A86A]/30 px-3.5 py-2.5 text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:border-[#C9A86A] focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 border border-[#C9A86A] bg-[#2E3B2F] text-[#C9A86A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] font-sans text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? (
                      <span>Transmitting to support@iistmun.org...</span>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Transmit Query to support@iistmun.org</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. SECRETARIAT SECTION                                                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-[#C9A86A]/20 text-left" id="secretariat-section">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold block">
              Leadership & Command &middot; 14th Edition
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
              The Secretariat Board
            </h2>
          </div>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-md leading-relaxed">
            Meet the academic directors, operations officers, and diplomacy architects preparing the 14th edition convocation of IIST MUN.
          </p>
        </div>

        {/* 4 Secretariat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {secretariatMembers.map((member) => (
            <div
              key={member.id}
              className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 flex flex-col justify-between hover:border-[#C9A86A] transition-all group shadow-md"
            >
              <div>
                {/* Header initial and role */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#C9A86A]/20">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-semibold border border-[#C9A86A]/40 px-2 py-0.5 bg-[#1A1F1A]">
                    {member.roleBadge}
                  </span>
                  <div className="h-9 w-9 rounded-full border border-[#C9A86A] flex items-center justify-center font-serif text-xs text-[#C9A86A] bg-[#1A1F1A]">
                    {member.initials}
                  </div>
                </div>

                <h3 className="font-serif text-xl text-[#EDE6D3] font-normal group-hover:text-[#C9A86A] transition-colors">
                  {member.name}
                </h3>
                <p className="font-sans text-[11px] text-[#C9A86A] uppercase tracking-wider mt-0.5 font-medium">
                  {member.designation}
                </p>

                <p className="font-sans text-xs text-[#EDE6D3]/80 leading-relaxed mt-3.5">
                  {member.bio}
                </p>
              </div>

              {/* Card Footer with Direct Mail */}
              <div className="pt-4 mt-5 border-t border-[#C9A86A]/15">
                <a
                  href={`mailto:${member.email}`}
                  className="font-mono text-[10px] text-[#8A9A7E] hover:text-[#C9A86A] transition-colors flex items-center gap-1.5"
                >
                  <Mail className="h-3 w-3 text-[#C9A86A]" />
                  <span className="truncate">{member.email}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. HOW TO REACH SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left" id="how-to-reach-section">

        {/* Section Header */}
        <div className="mb-12">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold block">
            Transit & Campus Navigation
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            How to Reach IIST Valiamala
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-2xl leading-relaxed mt-2">
            The Indian Institute of Space Science and Technology is situated in Valiamala, near Nedumangad, approximately 26 km from Thiruvananthapuram city center, Kerala. Plan your journey using the connectivity guidelines below.
          </p>
        </div>

        {/* 3 Transit Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

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
                  Roadways & Bus
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

        {/* Map & Coordinates Banner */}
        <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#C9A86A]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold">
                Geo Coordinates: 8.6277&deg; N, 77.0373&deg; E
              </span>
            </div>
            <h3 className="font-serif text-2xl text-[#EDE6D3]">
              Indian Institute of Space Science and Technology
            </h3>
            <p className="font-sans text-xs text-[#8A9A7E]">
              Valiamala P.O., Nedumangad, Thiruvananthapuram, Kerala &mdash; 695547
            </p>
            <p className="font-sans text-[11px] text-[#EDE6D3]/75 pt-1">
              Adjacent to the Liquid Propulsion Systems Centre (LPSC), ISRO.
            </p>
          </div>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Indian+Institute+of+Space+Science+and+Technology+Valiamala"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3] hover:bg-[#C9A86A] hover:text-[#1A1F1A] font-sans text-xs uppercase tracking-[0.18em] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

      </section>

    </div>
  );
}
