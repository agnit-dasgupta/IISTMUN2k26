/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Rocket, ShieldAlert, Award, Star, Mail, MapPin, Landmark, Compass, ChevronRight, FileText } from "lucide-react";

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

  // Starry Background Canvas Effect
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 800;
    };
    window.addEventListener("resize", handleResize);

    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.2,
        speed: Math.random() * 0.12 + 0.02,
        opacity: Math.random()
      });
    }

    const animate = () => {
      ctx.fillStyle = "rgba(2, 6, 23, 1)"; // slate-950
      ctx.fillRect(0, 0, width, height);

      // Draw subtle purple/blue glow in center
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 500);
      gradient.addColorStop(0, "rgba(29, 78, 216, 0.12)"); // blue-700/12
      gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.04)"); // cyan-500/4
      gradient.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw and update stars
      stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Move star down slowly
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        // Twinkle opacity
        star.opacity += Math.random() * 0.04 - 0.02;
        if (star.opacity < 0.2) star.opacity = 0.2;
        if (star.opacity > 1) star.opacity = 1;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative bg-[#020617] text-slate-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%)" }}>
      {/* Absolute canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-40" />

      <div className="relative z-10 mx-auto max-w-7xl">
        
        {/* Main Bento Grid layout */}
        <main className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:auto-rows-min mt-4">
          
          {/* TILE 1: WELCOME & HERO HEROICS (col-span-8, rows-3 equivalent) */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 md:p-10 flex flex-col justify-center relative overflow-hidden backdrop-blur-md shadow-2xl group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full"></div>
            
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-950/40 px-3.5 py-1 text-xs font-mono font-bold tracking-widest text-blue-400">
                <Compass className="h-3.5 w-3.5 animate-spin-slow text-blue-400" />
                // EIGHTH ANNUAL EDITION
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Decisions in Orbit,<br />
              <span className="italic font-serif text-blue-200 font-normal">Diplomacy on Earth</span>
            </h2>

            <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
              Welcome to <span className="text-white font-semibold">IIST MUN 2026</span>. Join the premier space-focused Model United Nations hosted at the Indian Institute of Space Science and Technology (IIST), Trivandrum, where interstellar governance converges with global diplomacy.
            </p>

            <div className="flex flex-wrap gap-4 mt-auto">
              <button
                onClick={() => setActiveTab("register")}
                id="hero-register-btn"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95 flex items-center gap-2"
              >
                Access Launch Portal
                <Rocket className="h-4 w-4 text-white animate-bounce-slow" />
              </button>
              <button
                onClick={() => setActiveTab("committees")}
                id="hero-committees-btn"
                className="px-6 py-3 bg-slate-800/60 hover:bg-slate-850/80 border border-slate-700/50 text-slate-200 hover:text-white rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-1.5"
              >
                Explore Committees
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* TILE 2: DATE & VENUE CARD (col-span-4, gradient background) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 blur-2xl rounded-full"></div>
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold opacity-80 mb-1 block">Date & Venue</span>
              <p className="text-3xl font-extrabold tracking-tight">Sept 18—20, 2026</p>
            </div>

            <div className="flex items-end justify-between mt-10 md:mt-16">
              <div className="text-sm leading-relaxed opacity-95">
                <span className="font-semibold block text-blue-200 text-xs uppercase tracking-wider mb-1">Thiruvananthapuram, Kerala</span>
                IIST Campus,<br />Valiamala, Kerala, India
              </div>
              <div className="h-10 w-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center shadow-inner">
                <MapPin className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* TILE 3: LIVE COUNTDOWN TIMER (col-span-4, medium row-span) */}
          <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600/30"></div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3 block">Launch Countdown Clock</span>
            
            {timeLeft.expired ? (
              <p className="font-bold text-blue-400 text-sm sm:text-base">🚀 Conference is currently Underway!</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="block font-mono text-xl md:text-2xl font-bold text-white leading-none">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block mt-1">Days</span>
                </div>
                <div className="border-l border-slate-800/80">
                  <span className="block font-mono text-xl md:text-2xl font-bold text-blue-400 leading-none">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block mt-1">Hours</span>
                </div>
                <div className="border-l border-slate-800/80">
                  <span className="block font-mono text-xl md:text-2xl font-bold text-indigo-400 leading-none">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block mt-1">Mins</span>
                </div>
                <div className="border-l border-slate-800/80">
                  <span className="block font-mono text-xl md:text-2xl font-bold text-emerald-400 leading-none animate-pulse">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block mt-1">Secs</span>
                </div>
              </div>
            )}
          </div>

          {/* TILE 4: FEATURED COMMITTEES / DIRECTORY HIGHLIGHTS (col-span-4) */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-2xl relative overflow-hidden">
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-4">Simulation Highlights</h3>
            
            <div className="space-y-2.5 flex-grow text-left">
              <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-800/80 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab("committees")}>
                <p className="text-blue-400 font-mono text-[9px] font-bold uppercase tracking-widest mb-0.5">// COPUOS & UNSC</p>
                <p className="text-xs font-semibold text-white">Legal Frameworks & Space Assets</p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-800/80 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab("committees")}>
                <p className="text-blue-400 font-mono text-[9px] font-bold uppercase tracking-widest mb-0.5">// PRIZE SCHEME</p>
                <p className="text-xs font-semibold text-white">₹50,000+ Cache Pool & Merit Badges</p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-800/80 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab("home")}>
                <p className="text-blue-400 font-mono text-[9px] font-bold uppercase tracking-widest mb-0.5">// ISRO LAB TOURS</p>
                <p className="text-xs font-semibold text-white">Exclusive Spacecraft Lab Overviews</p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-800/80 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab("home")}>
                <p className="text-blue-400 font-mono text-[9px] font-bold uppercase tracking-widest mb-0.5">// OBSERVATORY</p>
                <p className="text-xs font-semibold text-white">Social Networking Social Beneath Stars</p>
              </div>
            </div>
          </div>

          {/* TILE 5: THE SECRETARIAT LETTER / ADDRESS (col-span-5) */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-between group text-left">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl pointer-events-none"></div>
            
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-slate-500 block mb-4">The Secretariat Message</span>
              <blockquote className="text-base md:text-lg font-serif italic text-slate-300 leading-relaxed mb-6">
                "In the vastness of space, we find the perspective needed to solve our greatest terrestrial challenges. IIST MUN 2026 is a platform for the next generation of space leaders."
              </blockquote>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs border border-blue-400/30 shadow-md">
                  AN
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Aarav Nair</p>
                  <p className="text-[9px] uppercase tracking-wider text-blue-400 font-bold font-mono">Secretary General</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsLetterOpen(true)}
                className="text-[10px] font-mono uppercase tracking-widest font-bold text-blue-400 hover:text-white transition-colors cursor-pointer border border-blue-500/20 rounded-full px-3 py-1 bg-blue-950/20"
              >
                Read Letter &bull; App
              </button>
            </div>
          </div>

          {/* TILE 6: APPLY TO DELEGATE CTA TILE (col-span-3, High Contrast White Box) */}
          <div
            onClick={() => setActiveTab("register")}
            className="lg:col-span-3 bg-white text-slate-950 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-2xl group min-h-[220px] text-left"
          >
            <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Rocket className="w-5 h-5 text-blue-400" />
            </div>

            <div className="my-4">
              <h3 className="text-lg font-extrabold leading-tight mb-1 text-slate-950">Apply to Delegate</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Phase I Registrations are now open for all universities and high schools.</p>
            </div>

            <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-950 border-t border-slate-100 pt-3 mt-auto">
              Access Launch Portal
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </main>

        {/* SECTION 2: THE IIST ADVANTAGE BENTO HIGHLIGHTS */}
        <section className="mt-16 text-left" id="iist-experience">
          <div className="mb-8">
            <span className="font-mono text-xs uppercase tracking-widest text-blue-400">// BEYOND THE DEBATE ROOMS</span>
            <h3 className="mt-1 font-sans text-2xl font-extrabold text-white">The IIST Advantage</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md hover:border-blue-500/30 transition-colors duration-300 group">
              <div className="text-blue-500 font-mono font-bold text-3xl mb-3">01</div>
              <h4 className="text-base font-bold text-white mb-2">ISRO Laboratory Access</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Delegates gain exclusive access to IIST's engineering complexes, guided by researchers working directly on ISRO lunar missions and nano-satellite payloads.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md hover:border-blue-500/30 transition-colors duration-300 group">
              <div className="text-blue-500 font-mono font-bold text-3xl mb-3">02</div>
              <h4 className="text-base font-bold text-white mb-2">Stargazing at the Observatory</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                We move the debate from simulated politics to infinite realities. Spend your evening tracking Jovian moons and stellar clusters using our high-magnification telescope dome.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md hover:border-blue-500/30 transition-colors duration-300 group">
              <div className="text-blue-500 font-mono font-bold text-3xl mb-3">03</div>
              <h4 className="text-base font-bold text-white mb-2">Scientific & Technical Advisory</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                COPUOS and DISEC delegates can consult active space sciences faculty members during drafting phases to ensure technical feasibility of orbital policies.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: VENUE & GOOGLE MAPS DIRECT INTEGRATION */}
        <section className="mt-12 mb-12 text-left" id="venue-info">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none"></div>
            <div>
              <div className="flex items-center gap-1.5 text-blue-400 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-widest font-bold">Conference Location</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">Indian Institute of Space Science and Technology</h3>
              <p className="mt-2 text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Located in the scenic foothills of Ponmudi, Valiamala, Thiruvananthapuram, Kerala. IIST offers a serene, technically charged atmosphere perfect for high-focus space diplomacy deliberations.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => setActiveTab("register")}
                className="rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors duration-300"
              >
                Accommodation
              </button>
              <a
                href="https://maps.google.com/?q=IIST+Trivandrum"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-blue-600 hover:bg-blue-500 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
              >
                View Google Maps
                <Compass className="h-3.5 w-3.5 text-white" />
              </a>
            </div>
          </div>
        </section>

      </div>

      {/* DETAILED SECRETARIAT MESSAGE MODAL OVERLAY */}
      {isLetterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in" id="sec-gen-modal">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 md:p-8 shadow-2xl my-8">
            {/* Close */}
            <button
              onClick={() => setIsLetterOpen(false)}
              className="absolute right-4 top-4 rounded-full border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:border-slate-700"
            >
              <ChevronRight className="h-4 w-4 rotate-90" />
            </button>

            {/* Header */}
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-blue-400 font-semibold block mb-1">Official Communiqué</span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-6">
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
                IIST, as an institution directly nurtured by the <span className="text-blue-400 font-semibold">Indian Space Research Organisation (ISRO)</span>, serves as the perfect crucible where scientific rigor and political pragmatism converge. This year, our committees are designed to push the boundaries of conventional debate. You will navigate the legal nuances of asteroid mining under COPUOS, tackle satellite military security under UNGA DISEC, and coordinate real-time geopolitical space commands in the UNSC.
              </p>
              
              <p>
                Whether you are a seasoned diplomat or a novice delegation launching into your very first session, IIST MUN 2026 offers a platform of academic excellence, meticulous crisis orchestration, and unforgettable stargazing memories.
              </p>
              
              <p className="font-semibold text-blue-400">
                Prepare your portfolios. Orbits await your command.
              </p>
            </div>

            {/* Sender Sign-off */}
            <div className="mt-8 flex items-center gap-3 border-t border-slate-800 pt-6">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                AN
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Aarav Nair</p>
                <p className="text-xs text-slate-400">Secretary-General, IIST MUN 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
