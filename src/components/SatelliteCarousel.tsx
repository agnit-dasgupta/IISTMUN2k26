/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from "react";
import { Compass, Sparkles, HelpCircle, ArrowRight, ShieldAlert, ChevronLeft, ChevronRight, Search, Activity, Cpu, Radio, Target, X } from "lucide-react";
import { COUNTRY_MATRIX } from "../data";
import { CountryMatrixRow, PortfolioStatus } from "../types";
import { useFirebase } from "../FirebaseContext";

interface SatelliteCarouselProps {
  portfolioOverrides: Record<string, Partial<Record<"copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>;
  getPortfolioStatus: (row: CountryMatrixRow, committee: "copuos" | "disec" | "aippm" | "unsc") => PortfolioStatus;
  onSelectPreference?: (country: string, committee: "copuos" | "disec" | "aippm" | "unsc") => void;
}

const COMMITTEES = [
  { id: "copuos" as const, label: "COPUOS", fullName: "Committee on the Peaceful Uses of Outer Space", color: "#C9A86A", glowColor: "rgba(201, 168, 106, 0.4)", secondaryColor: "#586841" },
  { id: "disec" as const, label: "UNGA DISEC", fullName: "Disarmament & International Security Committee", color: "#8A9A7E", glowColor: "rgba(138, 154, 126, 0.4)", secondaryColor: "#2E3B2F" },
  { id: "aippm" as const, label: "AIPPM", fullName: "All India Political Parties Meet", color: "#dfbe7e", glowColor: "rgba(223, 190, 126, 0.4)", secondaryColor: "#586841" },
  { id: "unsc" as const, label: "UNSC", fullName: "United Nations Security Council", color: "#EDE6D3", glowColor: "rgba(237, 230, 211, 0.4)", secondaryColor: "#1A1F1A" }
];

export default function SatelliteCarousel({ portfolioOverrides, getPortfolioStatus, onSelectPreference }: SatelliteCarouselProps) {
  const { user } = useFirebase();
  const [activeCommIdx, setActiveCommIdx] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<{ country: string; status: string; row: CountryMatrixRow } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [containerWidth, setContainerWidth] = useState(340);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const activeComm = COMMITTEES[activeCommIdx];

  // Particle Engine based on current Committee Theme
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number }[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.fillStyle = "rgba(4, 6, 10, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.3) {
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.5 - 0.5,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.6 + 0.3,
          life: 1.0
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.005;

        ctx.fillStyle = activeComm.color;
        ctx.shadowColor = activeComm.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = p.life * p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.life <= 0 || p.y < -10) {
          particles.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      animFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrame);
    };
  }, [activeCommIdx]);

  // Touch/Mouse swipe events for Arc Rotation
  const handleStart = (clientX: number) => {
    isDragging.current = true;
    dragStart.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging.current || dragStart.current === null) return;
    const diff = clientX - dragStart.current;
    setSwipeOffset(diff);
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const threshold = 60;
    if (swipeOffset > threshold) {
      setActiveCommIdx((prev) => (prev === 0 ? COMMITTEES.length - 1 : prev - 1));
      triggerHaptic(10);
    } else if (swipeOffset < -threshold) {
      setActiveCommIdx((prev) => (prev === COMMITTEES.length - 1 ? 0 : prev + 1));
      triggerHaptic(10);
    }

    setSwipeOffset(0);
    dragStart.current = null;
  };

  const triggerHaptic = (duration = 10) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  };

  const currentCommId = activeComm.id;
  const filteredCountries = COUNTRY_MATRIX.map((row) => {
    const status = getPortfolioStatus(row, currentCommId);
    return {
      country: row.country,
      status,
      row
    };
  }).filter((item) => {
    const matchesSearch = item.country.toLowerCase().includes(searchTerm.toLowerCase());
    const isExcludedSpecial = item.country.includes("only") && currentCommId !== "aippm";
    return item.status === "Available" && matchesSearch && !isExcludedSpecial;
  });

  return (
    <div className="relative w-full border border-[#C9A86A]/30 bg-[#2E3B2F] shadow-xl overflow-hidden h-[630px] flex flex-col select-none font-sans">
      
      {/* Background Live Particle Stream */}
      <div className="absolute inset-0 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F1A] via-transparent to-transparent" />
      </div>

      {/* TOP HEADER CONTROLS */}
      <div className="p-5 border-b border-[#C9A86A]/20 bg-[#1A1F1A]/80 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 animate-spin-slow" style={{ color: activeComm.color }} />
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] font-medium">
              Interactive Allocation Radar
            </span>
          </div>
          <h2 className="font-serif text-lg text-[#EDE6D3] font-normal tracking-wide mt-0.5 flex items-center gap-1.5">
            Satellite Portfolio Carousel
          </h2>
        </div>

        {/* Dynamic Telescope Search */}
        <div className="relative max-w-xs w-full sm:w-56 pointer-events-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 text-[#8A9A7E]" />
          <input
            type="text"
            placeholder="Search nation or portfolio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-[#C9A86A]/30 bg-[#1A1F1A] py-1.5 pl-9 pr-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E] outline-none focus:border-[#C9A86A]"
          />
        </div>
      </div>

      {/* MID SECTION: ROTATIONAL CONCENTRIC ORBITAL ARC */}
      <div 
        ref={containerRef}
        className="h-40 relative flex flex-col justify-end items-center overflow-hidden cursor-grab active:cursor-grabbing z-10 touch-pan-y"
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        {/* Orbital Track Stylized Arc Path */}
        <div className="absolute bottom-[-180px] w-[500px] h-[340px] rounded-[50%] border-t border-white/[0.12] pointer-events-none flex items-center justify-center">
          <div className="w-[490px] h-[330px] rounded-[50%] border-t border-white/[0.06] border-dashed" />
        </div>

        <div className="absolute top-3 text-center font-mono text-[9px] uppercase tracking-widest text-slate-400 pointer-events-none">
          Swipe horizontally to rotate satellite nodes
        </div>

        {/* Nodes clustered dynamically along coordinates of the arc */}
        <div className="relative w-full max-w-[340px] h-32 flex items-end justify-center pb-2">
          {COMMITTEES.map((comm, idx) => {
            const diff = idx - activeCommIdx;
            const angleStep = 0.5;
            const baseAngle = diff * angleStep + (swipeOffset * 0.003);

            const xRadius = Math.min(160, (containerWidth - 60) / 2);
            const rx = Math.sin(baseAngle) * xRadius;
            const ry = -Math.cos(baseAngle) * 85 + 75;

            const isActive = idx === activeCommIdx;
            const opacity = Math.max(0.15, 1.0 - Math.abs(diff) * 0.45);
            const scale = isActive ? 1.15 : 0.85;

            return (
              <div
                key={comm.id}
                onClick={() => {
                  setActiveCommIdx(idx);
                  triggerHaptic(12);
                }}
                className="absolute flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer"
                style={{
                  transform: `translate3d(${rx}px, ${ry}px, 0) scale(${scale})`,
                  opacity: opacity,
                  zIndex: isActive ? 30 : 10
                }}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    isActive 
                      ? "bg-black border-2 shadow-lg" 
                      : "bg-black/60 border-white/[0.1]"
                  }`}
                  style={{
                    borderColor: isActive ? comm.color : undefined,
                    boxShadow: isActive ? `0 0 20px ${comm.glowColor}` : undefined
                  }}
                >
                  <Activity className="h-3.5 w-3.5" style={{ color: isActive ? comm.color : "#64748b" }} />
                </div>

                <span 
                  className={`font-mono text-[9px] uppercase tracking-wider font-bold mt-1.5 transition-colors ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                  style={{
                    color: isActive ? comm.color : undefined
                  }}
                >
                  {comm.label}
                </span>

                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-white mt-1 animate-ping" style={{ backgroundColor: comm.color }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation HUD */}
        <div className="absolute inset-x-8 bottom-2 z-20 flex justify-between items-center pointer-events-none">
          <button 
            onClick={() => setActiveCommIdx(prev => prev === 0 ? COMMITTEES.length - 1 : prev - 1)}
            className="p-1.5 rounded-full bg-black/70 border border-white/[0.1] pointer-events-auto hover:text-white text-slate-400 hover:bg-white/[0.1] transition-all active:scale-90"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          
          <div className="flex-1" />

          <button 
            onClick={() => setActiveCommIdx(prev => prev === COMMITTEES.length - 1 ? 0 : prev + 1)}
            className="p-1.5 rounded-full bg-black/70 border border-white/[0.1] pointer-events-auto hover:text-white text-slate-400 hover:bg-white/[0.1] transition-all active:scale-90"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: AVAILABLE PORTFOLIO GRID */}
      <div className="flex-1 bg-black/40 border-t border-white/[0.08] p-5 overflow-y-auto z-10 text-left">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
              // OPEN SEATS: {filteredCountries.length} SLOTS AVAILABLE
            </span>
          </div>
          <span className="font-mono text-[9px] text-slate-400 uppercase font-semibold">COUNCIL {activeComm.label}</span>
        </div>

        {filteredCountries.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCountries.map((item) => (
              <button
                key={item.country}
                onClick={() => {
                  setSelectedCountry(item);
                  triggerHaptic(15);
                }}
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.2] p-3.5 transition-all text-left overflow-hidden flex flex-col justify-between h-20 active:scale-[0.98] cursor-pointer"
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 w-0.5 opacity-70 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: activeComm.color }}
                />

                <span className="font-sans text-xs font-bold text-slate-100 group-hover:text-white line-clamp-2 leading-tight">
                  {item.country}
                </span>

                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/[0.04]">
                  <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider font-semibold">AVAIL. SEAT</span>
                  <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="h-5 w-5 text-slate-500 animate-pulse" />
            <p className="font-sans text-xs text-slate-400 font-medium">
              No available nation portfolios match your active search telescope.
            </p>
          </div>
        )}
      </div>

      {/* SCREEN EXPANDING OVERLAY WINDOW */}
      {selectedCountry && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in" id="portfolio-overlay-modal">
          <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-2xl border-2 border-[#C9A86A] bg-[#2E3B2F] p-6 sm:p-8 shadow-2xl my-8 text-left">
              
              <div className="flex items-center justify-between border-b border-[#C9A86A]/30 pb-3">
                <div className="flex items-center gap-2">
                  <ChevronLeft 
                    className="h-4 w-4 text-[#8A9A7E] hover:text-[#EDE6D3] cursor-pointer transition-colors" 
                    onClick={() => setSelectedCountry(null)}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                    // DIPLOMATIC PORTFOLIO DOSSIER
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedCountry(null)}
                  className="font-sans text-[10px] uppercase tracking-wider font-semibold border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] px-3 py-1 cursor-pointer transition-all"
                >
                  Close [ESC]
                </button>
              </div>

              <div className="mt-6">
                <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#8A9A7E] font-semibold block mb-1">
                  Selected State / Delegation
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal tracking-wide flex items-center gap-3">
                  {selectedCountry.country}
                  <span className="font-mono text-xs text-[#C9A86A] px-2 py-0.5 border border-[#C9A86A]/40 bg-[#1A1F1A]">
                    {activeComm.label}
                  </span>
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-[#1A1F1A] border border-[#8A9A7E]/20 flex items-start gap-3">
                  <Compass className="h-5 w-5 text-[#C9A86A] mt-0.5 shrink-0" />
                  <div>
                    <span className="font-sans text-[9px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Council Chamber</span>
                    <span className="font-serif text-sm text-[#EDE6D3] mt-0.5 block">{activeComm.fullName}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#1A1F1A] border border-[#8A9A7E]/20 flex items-start gap-3">
                  <Target className="h-5 w-5 text-[#C9A86A] mt-0.5 shrink-0" />
                  <div>
                    <span className="font-sans text-[9px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Seat Status</span>
                    <span className="inline-flex bg-[#2E3B2F] border border-[#C9A86A]/40 px-2.5 py-0.5 text-[9px] font-sans font-bold uppercase text-[#C9A86A] mt-1 tracking-widest">
                      Available for Registration Preference
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-4 bg-[#1A1F1A] border border-[#8A9A7E]/20 font-mono text-[10px] leading-relaxed text-[#EDE6D3]/80">
                <p className="text-[#C9A86A] font-bold mb-1">// DIPLOMATIC ALLOCATION BRIEF:</p>
                <p>&gt; Secretariat verification status: ACTIVE</p>
                <p>&gt; Matrix allocation channel: OPEN</p>
                <p>&gt; Preference priority slot: PREF 1 AUTOMATIC LOCK</p>
              </div>

              <div className="mt-6 pt-6 border-t border-[#C9A86A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="font-sans text-xs text-[#8A9A7E] max-w-sm text-left leading-relaxed">
                  Lock <strong>{selectedCountry.country}</strong> as your primary preference in your IIST MUN 2026 accreditation dossier.
                </p>

                <button
                  onClick={() => {
                    if (onSelectPreference) {
                      onSelectPreference(selectedCountry.country, activeComm.id);
                    }
                    setSelectedCountry(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-[#C9A86A] hover:bg-[#dfbe7e] px-6 py-3 font-sans text-xs uppercase tracking-[0.16em] font-semibold text-[#1A1F1A] shadow-md transition-all cursor-pointer"
                >
                  Select & Apply Portfolio
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
