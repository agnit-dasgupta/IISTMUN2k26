/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Rocket, Shield, Award, Star, Mail, MapPin, Landmark, 
  Compass, ChevronRight, FileText, Sparkles, Orbit, Radio, 
  Users, Globe, ArrowRight, Zap, CheckCircle2, X, Activity,
  Cpu, Flame, ExternalLink
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import SpotlightCard from "./SpotlightCard";
import MarqueeTicker from "./MarqueeTicker";
import AnimatedCounter from "./AnimatedCounter";

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export default function Home({ setActiveTab }: HomeProps) {
  // Calculate countdown to September 18, 2026
  const targetDate = new Date("2026-09-18T09:00:00").getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });
  const [isLetterOpen, setIsLetterOpen] = useState(false);

  // Parallax scroll hooks
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroParallaxY = useTransform(smoothProgress, [0, 0.5], [0, -60]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0.3]);
  const sphereRotate = useTransform(smoothProgress, [0, 1], [0, 180]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        clearInterval(timer);
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s, expired: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Orionix Interactive Starlight & Cosmic Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 900);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 900;
    };
    window.addEventListener("resize", handleResize);

    const stars: { x: number; y: number; size: number; speed: number; opacity: number; color: string }[] = [];
    const colors = ["#38bdf8", "#818cf8", "#c084fc", "#ffffff"];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.3,
        speed: Math.random() * 0.15 + 0.03,
        opacity: Math.random() * 0.8 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const animate = () => {
      ctx.fillStyle = "rgba(4, 6, 10, 0.9)";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle cyan/indigo ambient light orbs
      const grad1 = ctx.createRadialGradient(width * 0.3, height * 0.2, 20, width * 0.3, height * 0.2, 500);
      grad1.addColorStop(0, "rgba(56, 189, 248, 0.08)");
      grad1.addColorStop(1, "rgba(4, 6, 10, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.8, height * 0.6, 20, width * 0.8, height * 0.6, 600);
      grad2.addColorStop(0, "rgba(99, 102, 241, 0.07)");
      grad2.addColorStop(1, "rgba(4, 6, 10, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Draw and update stars
      stars.forEach((star) => {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        star.opacity += (Math.random() - 0.5) * 0.02;
        if (star.opacity < 0.2) star.opacity = 0.2;
        if (star.opacity > 0.95) star.opacity = 0.95;
      });
      ctx.globalAlpha = 1.0;

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#04060a] text-slate-100 min-h-screen overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Interactive Cosmic Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />

      {/* Subtle Orionix Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-[140px] rounded-full" />
      
      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          style={{ y: heroParallaxY, opacity: heroOpacity }}
          className="flex flex-col items-center text-center"
        >
          {/* Status Beacon Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-xl shadow-[0_0_25px_rgba(56,189,248,0.15)] mb-6 hover:border-cyan-500/40 transition-all duration-300 group cursor-default"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-300 font-bold group-hover:text-cyan-300 transition-colors">
              IIST MUN 2026 // 8TH ANNUAL CONVOCATION
            </span>
          </motion.div>

          {/* Main Display Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="font-sans text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white max-w-5xl leading-[1.08]"
          >
            Decisions in Orbit,{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent italic font-serif font-normal">
              Diplomacy on Earth
            </span>
          </motion.h1>

          {/* Subtitle Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-6 max-w-2xl text-sm sm:text-base md:text-lg text-slate-400 leading-relaxed font-normal"
          >
            Experience India's premier space-focused Model United Nations at the{" "}
            <span className="text-slate-200 font-semibold">Indian Institute of Space Science and Technology (IIST)</span>, 
            Trivandrum. Where celestial governance meets real-time geopolitical crisis simulations.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => setActiveTab("register")}
              id="hero-launch-portal-btn"
              className="group relative inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] hover:bg-cyan-300 transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <span>Access Launch Portal</span>
              <Rocket className="h-4 w-4 text-slate-950 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </button>

            <button
              onClick={() => setActiveTab("committees")}
              id="hero-view-committees-btn"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-200 backdrop-blur-xl hover:border-cyan-500/40 hover:bg-white/[0.08] hover:text-white transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <span>Explore Councils</span>
              <ChevronRight className="h-4 w-4 text-cyan-400" />
            </button>
          </motion.div>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl w-full"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-lg">
              <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-white">
                <AnimatedCounter value={4} />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-1 block">
                Councils & Chambers
              </span>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-lg">
              <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-cyan-400">
                <AnimatedCounter value={120} suffix="+" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-1 block">
                Allocated Portfolios
              </span>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-lg">
              <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-indigo-400">
                <AnimatedCounter value={50000} prefix="₹" suffix="+" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-1 block">
                Prize & Cache Pool
              </span>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-lg">
              <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400">
                <AnimatedCounter value={3} suffix=" Days" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-1 block">
                Sept 18 – 20, 2026
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE TELEMETRY TICKER */}
      <MarqueeTicker />

      {/* BENTO GRID SHOWCASE SECTION */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 text-left"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
            // ORIONIX DIPLOMATIC ECOSYSTEM
          </span>
          <h2 className="mt-2 font-sans text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Command Center
          </h2>
          <p className="mt-2 font-sans text-sm text-slate-400 max-w-xl">
            Everything you need for an immersive academic simulation, right at your fingertips.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          
          {/* TILE 1: VENUE & CONVOCATION DATES (lg:col-span-4) */}
          <SpotlightCard
            id="bento-venue-card"
            className="lg:col-span-4 p-7 flex flex-col justify-between group min-h-[300px]"
            spotlightColor="rgba(56, 189, 248, 0.15)"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                  // OFFICIAL VENUE
                </span>
                <span className="h-8 w-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-cyan-400">
                  <MapPin className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-4 font-sans text-2xl font-extrabold text-white tracking-tight">
                IIST Valiamala Campus
              </h3>
              <p className="mt-2 font-sans text-xs text-slate-400 leading-relaxed">
                Trivandrum, Kerala. Set amidst the scenic Western Ghats, directly adjacent to ISRO propulsion & spacecraft testing grounds.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 block font-bold">
                  CONFERENCE DATES
                </span>
                <span className="font-sans text-xs font-bold text-slate-200 mt-0.5 block">
                  Sept 18 – 20, 2026
                </span>
              </div>
              <a
                href="https://maps.google.com/?q=IIST+Trivandrum"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Maps <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </SpotlightCard>

          {/* TILE 2: COUNTDOWN CLOCK (lg:col-span-4) */}
          <SpotlightCard
            id="bento-countdown-card"
            className="lg:col-span-4 p-7 flex flex-col justify-between min-h-[300px]"
            spotlightColor="rgba(99, 102, 241, 0.15)"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                  // LAUNCH TELEMETRY
                </span>
                <span className="h-8 w-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-indigo-400">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-4 font-sans text-xl font-extrabold text-white tracking-tight">
                Countdown to Convocation
              </h3>
              <p className="mt-1 font-sans text-xs text-slate-400">
                Opening ceremony begins at 09:00 IST sharp.
              </p>
            </div>

            {/* Numeric Digits */}
            <div className="my-6 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-2.5">
                <span className="block font-mono text-xl sm:text-2xl font-black text-white">
                  {String(timeLeft.days).padStart(2, "0")}
                </span>
                <span className="text-[8px] uppercase font-mono tracking-wider text-slate-500 block mt-0.5">Days</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-2.5">
                <span className="block font-mono text-xl sm:text-2xl font-black text-cyan-400">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[8px] uppercase font-mono tracking-wider text-slate-500 block mt-0.5">Hours</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-2.5">
                <span className="block font-mono text-xl sm:text-2xl font-black text-indigo-400">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[8px] uppercase font-mono tracking-wider text-slate-500 block mt-0.5">Mins</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-2.5">
                <span className="block font-mono text-xl sm:text-2xl font-black text-emerald-400 animate-pulse">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[8px] uppercase font-mono tracking-wider text-slate-500 block mt-0.5">Secs</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Registrations Active
              </span>
              <span className="font-mono text-[10px] text-slate-500 uppercase">Phase I Tier</span>
            </div>
          </SpotlightCard>

          {/* TILE 3: WORKSHOP MASTERCLASS (lg:col-span-4) */}
          <SpotlightCard
            id="bento-workshop-card"
            className="lg:col-span-4 p-7 flex flex-col justify-between min-h-[300px] border-cyan-500/20"
            spotlightColor="rgba(6, 182, 212, 0.2)"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                  <Flame className="h-3 w-3" /> Exclusive Masterclass
                </span>
                <span className="text-[10px] font-mono text-slate-400">Sept 17</span>
              </div>

              <h3 className="mt-4 font-sans text-xl font-extrabold text-white tracking-tight">
                Space Tech & Diplomacy
              </h3>
              <p className="mt-2 font-sans text-xs text-slate-300 leading-relaxed">
                Hands-on training session with active ISRO scientists on orbital mechanics, space debris mitigation laws, and crisis resolution.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08]">
              <button
                onClick={() => setActiveTab("workshop-register")}
                id="bento-workshop-btn"
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Register for Workshop
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </SpotlightCard>

          {/* TILE 4: SATELLITE MATRIX & PORTFOLIO RADAR (lg:col-span-8) */}
          <SpotlightCard
            id="bento-matrix-card"
            className="lg:col-span-8 p-7 flex flex-col justify-between"
            spotlightColor="rgba(56, 189, 248, 0.12)"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                  // COUNCILS & SATELLITE RADAR
                </span>
                <button
                  onClick={() => setActiveTab("matrix")}
                  className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  View Matrix <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <h3 className="font-sans text-2xl font-black text-white tracking-tight">
                Simulation Chambers & Agendas
              </h3>
              <p className="mt-1 font-sans text-xs text-slate-400 max-w-xl">
                Four specialized councils covering outer space law, disarmament, Indian legislative policy, and high-intensity UN security crises.
              </p>

              {/* Committee grid pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <div 
                  onClick={() => setActiveTab("committees")}
                  className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all cursor-pointer group/item"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase">COPUOS</span>
                    <Orbit className="h-3.5 w-3.5 text-cyan-400 group-hover/item:rotate-90 transition-transform" />
                  </div>
                  <h4 className="font-sans text-xs font-bold text-white mt-1">Peaceful Uses of Outer Space</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">Lunar extraction & debris frameworks</p>
                </div>

                <div 
                  onClick={() => setActiveTab("committees")}
                  className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all cursor-pointer group/item"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-indigo-400 uppercase">UNGA DISEC</span>
                    <Shield className="h-3.5 w-3.5 text-indigo-400 group-hover/item:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-sans text-xs font-bold text-white mt-1">Disarmament & Security</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">Anti-satellite weaponry & orbital militarization</p>
                </div>

                <div 
                  onClick={() => setActiveTab("committees")}
                  className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all cursor-pointer group/item"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-amber-400 uppercase">AIPPM</span>
                    <Users className="h-3.5 w-3.5 text-amber-400 group-hover/item:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-sans text-xs font-bold text-white mt-1">All India Political Parties Meet</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">Space policy & private launch deregulation</p>
                </div>

                <div 
                  onClick={() => setActiveTab("committees")}
                  className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all cursor-pointer group/item"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase">UNSC</span>
                    <Globe className="h-3.5 w-3.5 text-emerald-400 group-hover/item:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-sans text-xs font-bold text-white mt-1">Security Council</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">Continuous real-time crisis escalation</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400">
                120+ Nation & Special Character Portfolios Open
              </span>
              <button
                onClick={() => setActiveTab("matrix")}
                className="px-4 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-[11px] font-bold text-white hover:bg-white/[0.1] transition-all"
              >
                Inspect Country Matrix
              </button>
            </div>
          </SpotlightCard>

          {/* TILE 5: SECRETARY GENERAL COMMUNIQUÉ (lg:col-span-4) */}
          <SpotlightCard
            id="bento-secgen-card"
            className="lg:col-span-4 p-7 flex flex-col justify-between"
            spotlightColor="rgba(129, 140, 248, 0.15)"
          >
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                // COMMUNIQUÉ
              </span>
              <blockquote className="mt-4 font-serif italic text-sm text-slate-300 leading-relaxed">
                "In the vastness of space, we find the perspective needed to solve our greatest terrestrial challenges. IIST MUN is where interstellar governance begins."
              </blockquote>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
                  AN
                </div>
                <div>
                  <p className="font-sans text-xs font-bold text-white">Aarav Nair</p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-cyan-400 font-bold">Secretary General</p>
                </div>
              </div>

              <button
                onClick={() => setIsLetterOpen(true)}
                className="font-mono text-[10px] uppercase tracking-wider font-bold text-cyan-400 hover:text-white px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/20 transition-all cursor-pointer"
              >
                Read
              </button>
            </div>
          </SpotlightCard>

        </div>
      </section>

      {/* THE IIST ADVANTAGE SECTION (Staggered On-Scroll Reveals) */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
            // UNMATCHED IMMERSION
          </span>
          <h2 className="mt-2 font-sans text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            The IIST Advantage
          </h2>
          <p className="mt-2 font-sans text-sm text-slate-400 max-w-xl">
            Why debating at India's space science hub delivers an experience like no other conference in the subcontinent.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <SpotlightCard className="p-8 h-full flex flex-col justify-between" spotlightColor="rgba(56, 189, 248, 0.15)">
              <div>
                <span className="font-mono text-3xl font-black text-cyan-400/80 block mb-4">01</span>
                <h3 className="font-sans text-xl font-bold text-white mb-2">ISRO Propulsion & Lab Access</h3>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">
                  Delegates receive guided overviews of advanced propulsion research, launch vehicle telemetry systems, and satellite cleanrooms.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-cyan-400 font-mono text-[10px] uppercase font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Technical Immersion
              </div>
            </SpotlightCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <SpotlightCard className="p-8 h-full flex flex-col justify-between" spotlightColor="rgba(129, 140, 248, 0.15)">
              <div>
                <span className="font-mono text-3xl font-black text-indigo-400/80 block mb-4">02</span>
                <h3 className="font-sans text-xl font-bold text-white mb-2">Night Stargazing at the Dome</h3>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">
                  Conclude intense parliamentary diplomacy under Kerala's clear mountain night skies using IIST's high-magnification observatory telescope.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-indigo-400 font-mono text-[10px] uppercase font-bold">
                <Star className="h-3.5 w-3.5" /> Delegate Socials
              </div>
            </SpotlightCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <SpotlightCard className="p-8 h-full flex flex-col justify-between" spotlightColor="rgba(16, 185, 129, 0.15)">
              <div>
                <span className="font-mono text-3xl font-black text-emerald-400/80 block mb-4">03</span>
                <h3 className="font-sans text-xl font-bold text-white mb-2">Technical Academic Advisory</h3>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">
                  Real-time consultation with space sciences faculty and legal scholars during resolution drafting to verify orbital physics and payload feasibility.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-emerald-400 font-mono text-[10px] uppercase font-bold">
                <Cpu className="h-3.5 w-3.5" /> High Academic Rigor
              </div>
            </SpotlightCard>
          </motion.div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-8 md:p-12 backdrop-blur-2xl text-center"
        >
          <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-widest mb-4">
            <Sparkles className="h-3.5 w-3.5" /> PHASE I ALLOCATIONS CLOSING SOON
          </span>

          <h2 className="font-sans text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto">
            Ready to Take Your Seat in the Celestial Chamber?
          </h2>
          
          <p className="mt-4 font-sans text-sm text-slate-400 max-w-xl mx-auto">
            Secure your preferred country or character portfolio before general public allocations commence.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setActiveTab("register")}
              id="cta-bottom-register-btn"
              className="rounded-full bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:bg-cyan-300 transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Submit Delegate Application</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab("workshop-register")}
              id="cta-bottom-workshop-btn"
              className="rounded-full border border-white/[0.15] bg-white/[0.03] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/[0.08] transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Register for Workshop
            </button>
          </div>
        </motion.div>
      </section>

      {/* DETAILED SECRETARIAT MESSAGE MODAL OVERLAY */}
      {isLetterOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-xl animate-fade-in" id="sec-gen-modal">
          <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-2xl rounded-3xl border border-white/[0.12] bg-[#070a12]/95 p-6 md:p-8 shadow-2xl my-8 text-left backdrop-blur-2xl">
              {/* Close button */}
              <button
                onClick={() => setIsLetterOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-white/[0.08] bg-white/[0.04] p-2 text-slate-400 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                  // OFFICIAL COMMUNIQUÉ
                </span>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white mb-6">
                  Address from the Secretary-General
                </h3>
              </div>

              {/* Letter Content */}
              <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed text-left max-h-[60vh] overflow-y-auto pr-2">
                <p className="font-semibold text-white">Esteemed Delegates, Advisors, and Guests,</p>
                
                <p>
                  As humans extend their reach further into the lunar surface and establish persistent constellations in Earth's orbit, the mechanisms of global diplomacy must adapt to govern realms once thought to be purely science fiction. It is my absolute honor to welcome you to the 8th annual edition of the <span className="text-white font-semibold">Indian Institute of Space Science and Technology Model United Nations</span>.
                </p>
                
                <p>
                  IIST, as an institution directly nurtured by the <span className="text-cyan-400 font-semibold">Indian Space Research Organisation (ISRO)</span>, serves as the perfect crucible where scientific rigor and political pragmatism converge. This year, our committees are designed to push the boundaries of conventional debate. You will navigate the legal nuances of asteroid mining under COPUOS, tackle satellite military security under UNGA DISEC, and coordinate real-time geopolitical space commands in the UNSC.
                </p>
                
                <p>
                  Whether you are a seasoned diplomat or a novice delegation launching into your very first session, IIST MUN 2026 offers a platform of academic excellence, meticulous crisis orchestration, and unforgettable stargazing memories.
                </p>
                
                <p className="font-semibold text-cyan-400">
                  Prepare your portfolios. Orbits await your command.
                </p>
              </div>

              {/* Sender Sign-off */}
              <div className="mt-8 flex items-center gap-3 border-t border-white/[0.08] pt-6">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  AN
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Aarav Nair</p>
                  <p className="text-xs text-slate-400 font-mono">Secretary-General, IIST MUN 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
