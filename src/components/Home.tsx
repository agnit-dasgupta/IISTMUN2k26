/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Mail, MapPin, Plane, Train,
  Bus, Send, CheckCircle2, ExternalLink,
  Clock, Compass, Globe, Orbit, AlertCircle,
  MessageSquare, ShieldCheck, Landmark, Telescope,
  Rocket, BookOpen, Layers, Award, Radio, ChevronRight,
  Flame, Leaf, Scale, Check, Phone, Calendar
} from "lucide-react";
import { motion } from "motion/react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

// IISTMUN 2027 Commencement: Friday, 29th January 2027, 09:00 AM IST
const MUN_TARGET_DATE = new Date("2027-01-29T09:00:00+05:30").getTime();

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isStarted: boolean;
}

const calculateTimeRemaining = (): TimeRemaining => {
  const difference = MUN_TARGET_DATE - Date.now();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true };
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isStarted: false
  };
};

export default function Home({ setActiveTab }: HomeProps) {
  // Live Countdown Chronometer State
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      {/* 2. HERO SECTION - HOME WITH COUNTER (FIRST PART ON LANDING PAGE)          */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-10 sm:pt-14 md:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center" id="hero-landing-section">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
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
            <div className="flex items-center justify-center gap-2 mb-3 select-none">
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#C9A86A]">
                January 29 - 31, 2027 &bull; IIST, Thiruvananthapuram
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-7 md:gap-10">

              {/* DAYS */}
              <div className="flex flex-col items-center min-w-[52px] sm:min-w-[68px]">
                <span className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#C9A86A] font-light leading-none select-none tracking-widest tabular-nums">
                  {String(timeLeft.days).padStart(2, "0")}
                </span>
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8A9A7E] mt-2 font-medium">
                  Days
                </span>
              </div>

              <span className="font-serif text-2xl sm:text-4xl text-[#C9A86A]/40 pb-5 select-none animate-pulse">:</span>

              {/* HOURS */}
              <div className="flex flex-col items-center min-w-[52px] sm:min-w-[68px]">
                <span className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#C9A86A] font-light leading-none select-none tracking-widest tabular-nums">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8A9A7E] mt-2 font-medium">
                  Hours
                </span>
              </div>

              <span className="font-serif text-2xl sm:text-4xl text-[#C9A86A]/40 pb-5 select-none animate-pulse">:</span>

              {/* MINUTES */}
              <div className="flex flex-col items-center min-w-[52px] sm:min-w-[68px]">
                <span className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#C9A86A] font-light leading-none select-none tracking-widest tabular-nums">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8A9A7E] mt-2 font-medium">
                  Minutes
                </span>
              </div>

              <span className="font-serif text-2xl sm:text-4xl text-[#C9A86A]/40 pb-5 select-none animate-pulse">:</span>

              {/* SECONDS */}
              <div className="flex flex-col items-center min-w-[52px] sm:min-w-[68px]">
                <span className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#C9A86A] font-light leading-none select-none tracking-widest tabular-nums">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8A9A7E] mt-2 font-medium">
                  Seconds
                </span>
              </div>

            </div>
          </div>

          {/* Concise Diplomatic Subtitle */}
          <p className="font-sans text-xs sm:text-sm md:text-base text-[#EDE6D3]/85 max-w-xl mx-auto leading-relaxed font-light">

            India&apos;s premier space diplomacy conference hosted at IIST, Thiruvananthapuram. Convening future leaders to debate orbital sustainability, international security, and planetary governance.
          </p>

          {/* Status Notices: EB and Campus Ambassador */}
          <div className="w-full max-w-2xl mx-auto pt-2 sm:pt-4" id="registrations-status-banner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Notice 1: EB registrations open */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register-portal-eb");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="border border-[#C9A86A]/70 hover:border-[#C9A86A] bg-[#1A1F1A]/95 hover:bg-[#2E3B2F]/60 p-5 text-left flex items-start gap-3.5 shadow-lg group transition-all duration-300 cursor-pointer"
              >
                <span className="relative flex h-3 w-3 mt-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A86A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C9A86A]"></span>
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block font-medium">
                      Executive Board (EB)
                    </span>
                    <span className="text-[9px] font-mono text-[#1A1F1A] bg-[#C9A86A] px-1 rounded-none font-semibold">
                      APPLY
                    </span>
                  </div>
                  <span className="font-sans text-xs sm:text-sm text-[#EDE6D3] font-medium tracking-wide block group-hover:text-[#C9A86A] transition-colors">
                    Applications Open • Click to Register
                  </span>
                </div>
              </button>

              {/* Notice 2: Campus ambassador registrations open */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register-portal-ca");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="border border-[#8BA06F]/70 hover:border-[#8BA06F] bg-[#1A1F1A]/95 hover:bg-[#2E3B2F]/60 p-5 text-left flex items-start gap-3.5 shadow-lg group transition-all duration-300 cursor-pointer"
              >
                <span className="relative flex h-3 w-3 mt-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8BA06F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8BA06F]"></span>
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8BA06F] block font-medium">
                      Campus Ambassador
                    </span>
                    <span className="text-[9px] font-mono text-[#1A1F1A] bg-[#8BA06F] px-1 rounded-none font-semibold">
                      JOIN
                    </span>
                  </div>
                  <span className="font-sans text-xs sm:text-sm text-[#EDE6D3] font-medium tracking-wide block group-hover:text-[#8BA06F] transition-colors">
                    Registrations Open • Join Fellowship
                  </span>
                </div>
              </button>

            </div>
          </div>

          {/* Hairline Divider */}
          <div className="w-full max-w-2xl mx-auto pt-2 pb-1">
            <div className="w-full h-px bg-[#C9A86A]/25" />
          </div>

          {/* Quick Page Jump Links in Order - 5 Symmetrical Items */}


        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ABOUT IIST SECTION (ORDER ITEM #2)                                     */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-[#C9A86A]/20" id="about-iist-section">

        {/* Symmetrical Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-3">

          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide">
            Indian Institute of Space Science and Technology
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-2xl mx-auto leading-relaxed mt-3">
            Asia&apos;s first Space University, established by ISRO under the Department of Space, Government of India.
          </p>
        </div>

        {/* Narrative & Institutional Overview - Symmetrical 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* Left Column: Historical Overview & Academic Mission Card */}
          <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold">
                  Pioneering Space Academia
                </span>
                <span className="font-mono text-[9px] text-[#8A9A7E]">ESTD. 2007</span>
              </div>

              <div className="space-y-4 font-sans text-xs sm:text-sm text-[#EDE6D3]/85 leading-relaxed">
                <p>
                  Inaugurated on 14 September 2007 with former President of India <strong className="text-[#C9A86A]">Dr. A.P.J. Abdul Kalam</strong> as founding Chancellor, IIST was established to provide world-class education and research for the Indian space programme.
                </p>
                <p>
                  Situated on a 100-acre residential campus adjacent to ISRO&apos;s <strong className="text-[#EDE6D3]">Liquid Propulsion Systems Centre (LPSC)</strong>, IIST enables direct synergy with live space missions, contributing to landmark projects including <strong className="text-[#C9A86A]">Chandrayaan, Gaganyaan, and Aditya-L1</strong>.
                </p>
              </div>

              {/* Quote Block */}
              <div className="border-l-2 border-[#C9A86A] pl-4 py-3 bg-[#2E3B2F]/40 text-xs italic font-serif text-[#EDE6D3]/90">
                &ldquo;Transforming youthful scientific passion into national sovereignty, technological mastery, and humanitarian progress.&rdquo;
                <span className="block mt-1.5 font-sans not-italic text-[10px] text-[#8A9A7E] font-medium">
                  &mdash; Dr. A.P.J. Abdul Kalam, Founding Chancellor
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#C9A86A]/20 flex items-center justify-between font-mono text-[10px] text-[#C9A86A]">
              <span>Department of Space, Govt. of India</span>
              <span>Valiamala, Thiruvananthapuram</span>
            </div>
          </div>

          {/* Right Column: IIST Valiamala Campus Aerial View (Replaces Institutional Profile Card) */}
          <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6 group">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold flex items-center gap-2">

                  Institutional Campus
                </span>

              </div>

              {/* Campus Image Frame */}
              <div className="relative flex-1 min-h-[260px] sm:min-h-[290px] w-full overflow-hidden border border-[#C9A86A]/30 bg-[#141814] shadow-inner">
                <img
                  src="/iist-campus.jpg"
                  alt="Aerial view of the Indian Institute of Space Science and Technology (IIST) campus in Valiamala, Thiruvananthapuram"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 filter brightness-[0.96] group-hover:brightness-105"
                />

                {/* Subtle vignette / gold aura gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141814]/90 via-transparent to-[#141814]/20 pointer-events-none" />


              </div>
            </div>

            <div className="pt-4 border-t border-[#C9A86A]/20 flex items-center justify-between font-mono text-[10px] text-[#C9A86A]">
              <span>Valiamala, Thiruvananthapuram</span>
              <span>8.6277&deg; N, 77.0373&deg; E</span>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. ABOUT IISTMUN SECTION (ORDER ITEM #3)                                  */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-[#C9A86A]/20" id="about-iistmun-section">

        {/* Symmetrical Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">

          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide">
            IIST Model United Nations 2027
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-2xl mx-auto leading-relaxed mt-3">
            Save &middot; Sustain &middot; Safeguard &mdash; South India&apos;s premier collegiate space diplomacy symposium.
          </p>
        </div>

        {/* Narrative & Thematic Vision - Symmetrical 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* Left Column: Diplomatic Legacy Card */}
          <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#C9A86A]/20">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold">
                  Symposium Legacy
                </span>
                <span className="font-mono text-[9px] text-[#8A9A7E]">14 CONVOCATIONS</span>
              </div>

              <div className="space-y-4 font-sans text-xs sm:text-sm text-[#EDE6D3]/85 leading-relaxed">
                <p>
                  Over thirteen editions, <strong className="text-[#C9A86A]">IIST MUN</strong> has earned distinction as a premier national collegiate forum, convening delegates and debaters from prestigious institutions nationwide.
                </p>
                <p>
                  Grounded in the institute&apos;s aerospace heritage, IISTMUN advances critical debates in <strong className="text-[#EDE6D3]">space law, orbital sustainability, space debris mitigation, and planetary stewardship</strong> under the 14th edition charter: <strong className="text-[#C9A86A]">Save &middot; Sustain &middot; Safeguard</strong>.
                </p>
                <p>
                  Delegates engage in rigorous parliamentary procedure, simulating specialized UN bodies to negotiate multi-lateral treaties governing the outer space commons and safeguarding terrestrial sustainability.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#C9A86A]/20 flex items-center justify-between font-mono text-[10px] text-[#C9A86A]">
              <span>7 Specialized Chambers</span>
              <span>National Collegiate Representation</span>
            </div>
          </div>

          {/* Right Column: Conference Charter Pillars */}
          <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold block pb-3 border-b border-[#C9A86A]/20">
                Conference Charter &bull; 14th Edition
              </span>

              <div className="space-y-3 font-sans text-xs">
                <div className="border-l-2 border-[#8BA06F] pl-3.5 py-1.5 bg-[#2E3B2F]/20">
                  <span className="font-serif text-base text-[#EDE6D3] block font-semibold">SAVE</span>
                  <p className="text-[11px] text-[#8A9A7E] mt-0.5 leading-relaxed">
                    Protecting fragile terrestrial ecosystems and human heritage through satellite-monitored environmental accords.
                  </p>
                </div>

                <div className="border-l-2 border-[#C9A86A] pl-3.5 py-1.5 bg-[#2E3B2F]/20">
                  <span className="font-serif text-base text-[#EDE6D3] block font-semibold">SUSTAIN</span>
                  <p className="text-[11px] text-[#8A9A7E] mt-0.5 leading-relaxed">
                    Mitigating orbital debris, regulating lunar and planetary resources, and safeguarding the outer space commons.
                  </p>
                </div>

                <div className="border-l-2 border-[#CFD7D0] pl-3.5 py-1.5 bg-[#2E3B2F]/20">
                  <span className="font-serif text-base text-[#EDE6D3] block font-semibold">SAFEGUARD</span>
                  <p className="text-[11px] text-[#8A9A7E] mt-0.5 leading-relaxed">
                    Upholding international space treaties, disarmament mandates, and peaceful multilateral coexistence.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#C9A86A]/20 text-center">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                Registrations Live &bull; Executive Board &amp; Campus Ambassadors
              </span>
            </div>
          </div>

        </div>

      </section>



      {/* ========================================================================= */}
      {/* 5. CONTACT US SECTION (DIPLOMATIC COMMUNICATIONS DESK)                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-[#C9A86A]/20" id="contact-section">

        {/* Symmetrical Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <span className="h-px w-8 bg-[#C9A86A]/40" />
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold">
              <Mail className="h-3.5 w-3.5" />
              Communications &amp; Dispatches
            </span>
            <span className="h-px w-8 bg-[#C9A86A]/40" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide">
            Contact the Secretariat
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-2xl mx-auto leading-relaxed mt-3">
            Questions regarding registrations, EB applications, or delegations? Reach out to our communications desk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left Column: Diplomatic Directory (Cards) */}
          <div className="space-y-6">

            {/* Card 1: Official Electronic Mail */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 shadow-xl hover:border-[#C9A86A] transition-all">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#C9A86A]/20">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 border border-[#C9A86A] bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg text-[#EDE6D3]">Electronic Mail</h4>
                    <span className="font-mono text-[10px] text-[#8A9A7E] uppercase">Official Inquiries</span>
                  </div>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] bg-[#C9A86A]/10 px-2 py-0.5 border border-[#C9A86A]/30">
                  Primary
                </span>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#8A9A7E]/15">
                  <span className="text-[#8A9A7E]">Official Secretariat Desk</span>
                  <a href="mailto:support@iistmun.org" className="text-[#C9A86A] hover:underline font-mono text-xs">
                    support@iistmun.org
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8A9A7E]">Response Window</span>
                  <span className="text-[#EDE6D3]/90 font-mono text-[11px]">Within 24 hours (Working Days)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Secretariat Contact Numbers (SG & DSG) and Short Form Address */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 shadow-xl hover:border-[#C9A86A] transition-all space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#C9A86A]/20">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 border border-[#C9A86A] bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg text-[#EDE6D3]">Secretariat Helplines</h4>
                    <span className="font-mono text-[10px] text-[#8A9A7E] uppercase">Direct Diplomatic Contacts</span>
                  </div>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#8BA06F] bg-[#8BA06F]/10 px-2 py-0.5 border border-[#8BA06F]/30">
                  Helplines
                </span>
              </div>

              {/* SG & DSG Contact Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Secretary-General */}
                <div className="p-3.5 bg-[#2E3B2F]/40 border border-[#C9A86A]/30 space-y-1.5 group hover:border-[#C9A86A] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-semibold">
                      Secretary-General
                    </span>
                    <span className="text-[9px] font-mono text-[#8A9A7E]">SG</span>
                  </div>
                  <div className="font-serif text-sm text-[#EDE6D3] font-medium">Niranjan Patil</div>
                  <a
                    href="tel:+919881416709"
                    className="font-mono text-xs text-[#C9A86A] hover:underline flex items-center gap-1.5 pt-1"
                  >
                    <Phone className="h-3 w-3 text-[#8BA06F]" />
                    <span>+91 9881416709</span>
                  </a>
                </div>

                {/* Deputy Secretary-General */}
                <div className="p-3.5 bg-[#2E3B2F]/40 border border-[#8BA06F]/30 space-y-1.5 group hover:border-[#8BA06F] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8BA06F] font-semibold">
                      Deputy Secretary-General
                    </span>
                    <span className="text-[9px] font-mono text-[#8A9A7E]">DSG</span>
                  </div>
                  <div className="font-serif text-sm text-[#EDE6D3] font-medium"> Ananya Bhat</div>
                  <a
                    href="tel:+917038290052"
                    className="font-mono text-xs text-[#8BA06F] hover:underline flex items-center gap-1.5 pt-1"
                  >
                    <Phone className="h-3 w-3 text-[#8BA06F]" />
                    <span>+917038290052</span>
                  </a>
                </div>

                {/* Director - General */}
                <div className="p-3.5 bg-[#2E3B2F]/40 border border-[#8BA06F]/30 space-y-1.5 group hover:border-[#8BA06F] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8BA06F] font-semibold">
                      Director - General
                    </span>
                    <span className="text-[9px] font-mono text-[#8A9A7E]">DG</span>
                  </div>
                  <div className="font-serif text-sm text-[#EDE6D3] font-medium">Parth Ray</div>
                  <a
                    href="tel:+91 84214 01994"
                    className="font-mono text-xs text-[#8BA06F] hover:underline flex items-center gap-1.5 pt-1"
                  >
                    <Phone className="h-3 w-3 text-[#8BA06F]" />
                    <span>+91 84214 01994</span>
                  </a>
                </div>
              </div>

              {/* Short Form Address */}
              <div className="pt-3 border-t border-[#C9A86A]/20 flex items-start gap-3">
                <div className="h-8 w-8 border border-[#C9A86A]/40 bg-[#2E3B2F]/60 flex items-center justify-center text-[#C9A86A] shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A9A7E] font-semibold block">
                    Address
                  </span>
                  <p className="font-sans text-xs text-[#EDE6D3] font-medium mt-0.5">
                    IIST, Valiamala, Thiruvananthapuram, Kerala &mdash; 695547
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-[#8A9A7E] pt-1">
                <Clock className="h-3.5 w-3.5 text-[#C9A86A]" />
                <span>Operating Hours: Mon &ndash; Sat, 09:00 &ndash; 18:00 IST</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Dispatch Form */}
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
                    Query Received
                  </h4>
                  <p className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-widest">
                    Destination: support@iistmun.org &bull; Status: Recorded
                  </p>
                  {savedQueryId && (
                    <span className="inline-block mt-2 font-mono text-[10px] text-[#EDE6D3] bg-[#1A1F1A] border border-[#C9A86A]/40 px-3 py-1">
                      Ref: <span className="text-[#C9A86A]">{savedQueryId}</span>
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-[#EDE6D3]/85 max-w-md mx-auto leading-relaxed">
                  Your query has been logged and sent to <strong className="text-[#C9A86A]">support@iistmun.org</strong>. You may also open your email client for a direct follow-up.
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
                      Full Name *
                    </label>
                    <input
                      id="contact-name-input"
                      type="text"
                      required
                      placeholder="Your name"
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
                      placeholder="name@example.com"
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
                    <option value="EB Application">Executive Board (EB) Applications</option>
                    <option value="Campus Ambassador">Campus Ambassador Program</option>
                    <option value="Delegation Registrations">Delegation &amp; Institutional Registrations</option>
                    <option value="Accommodation & Travel">Travel, Transit &amp; Accommodation</option>
                    <option value="Partnerships">Institutional Partnerships</option>
                    <option value="General Query">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label htmlFor="contact-message-input" className="block text-[10px] font-mono text-[#8A9A7E] uppercase">
                    Message *
                  </label>
                  <textarea
                    id="contact-message-input"
                    required
                    rows={4}
                    placeholder="Write your query or message here..."
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
                      <span>Sending Query...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Query to Secretariat</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 6. HOW TO REACH IIST SECTION (ORDER ITEM #6 - AFTER CONTACT US)           */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto" id="how-to-reach-section">
        {/* ========================================================================= */}
        {/* 4. INTERACTIVE CAMPUS MAP (ORDER ITEM #4)                                 */}
        {/* ========================================================================= */}


        {/* Symmetrical Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <span className="h-px w-8 bg-[#C9A86A]/40" />
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold">
              <Plane className="h-3.5 w-3.5" />
              Transit &amp; Connectivity Guidelines
            </span>
            <span className="h-px w-8 bg-[#C9A86A]/40" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide">
            How to Reach IIST Valiamala
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] max-w-2xl mx-auto leading-relaxed mt-3">
            The institute is situated in Valiamala, approximately 26 km from Thiruvananthapuram city center. Plan your journey using the connectivity guidelines below.
          </p>
        </div>

        <div className="relative w-full h-[360px] sm:h-[360px] md:h-[460px] bg-[#1A1F1A] mb-10">
          <iframe
            title="Indian Institute of Space Science and Technology Valiamala Interactive Map"
            src="https://maps.google.com/maps?q=Indian+Institute+of+Space+Science+and+Technology+Valiamala+Thiruvananthapuram&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* 3 Symmetrical Transit Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Mode 1: By Air */}
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 sm:p-7 flex flex-col justify-between shadow-xl group hover:border-[#C9A86A] transition-all">
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
              Pre-paid Taxi / App Cabs Available 24/7
            </div>
          </div>

          {/* Mode 2: By Train */}
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 sm:p-7 flex flex-col justify-between shadow-xl group hover:border-[#C9A86A] transition-all">
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
                TVC &amp; Kochuveli (KCVL) connect nationwide via direct superfast and express trains. Pre-paid taxis, auto-rickshaws, and direct state buses operate outside the station concourse.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#C9A86A]/15 font-mono text-[10px] text-[#C9A86A]">
              Major Southern Railway Terminus
            </div>
          </div>

          {/* Mode 3: By Bus & Road */}
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-6 sm:p-7 flex flex-col justify-between shadow-xl group hover:border-[#C9A86A] transition-all">
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
                Frequent KSRTC buses operate from Thampanoor Central Bus Station to Nedumangad. Frequent connecting buses drop delegates directly at the IIST Main Gate (adjacent to ISRO LPSC).
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#C9A86A]/15 font-mono text-[10px] text-[#C9A86A]">
              Valiamala / ISRO LPSC Bus Stop
            </div>
          </div>

        </div>

        {/* Transit Advisory Footer Banner */}
        <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#C9A86A]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-semibold">
                Delegate Transit Advisory &bull; Geo Coordinates: 8.6277&deg; N, 77.0373&deg; E
              </span>
            </div>
            <h4 className="font-serif text-xl sm:text-2xl text-[#EDE6D3]">
              Arrival Coordination &bull; Valiamala Main Gate
            </h4>
            <p className="font-sans text-xs text-[#8A9A7E]">
              Delegates are advised to arrive 45 minutes prior to convocation sessions. Institutional transport coordination details will be communicated to registered delegations.
            </p>
          </div>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Indian+Institute+of+Space+Science+and+Technology+Valiamala"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3] hover:bg-[#C9A86A] hover:text-[#1A1F1A] font-sans text-xs uppercase tracking-[0.18em] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

      </section>

    </div>
  );
}
