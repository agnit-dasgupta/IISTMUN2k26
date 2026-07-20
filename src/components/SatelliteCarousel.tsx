/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from "react";
import { Compass, Sparkles, HelpCircle, ArrowRight, ShieldAlert, ChevronLeft, ChevronRight, Search, Activity, Cpu, Radio, Target } from "lucide-react";
import { COUNTRY_MATRIX } from "../data";
import { CountryMatrixRow, PortfolioStatus } from "../types";
import { useFirebase } from "../FirebaseContext";

interface SatelliteCarouselProps {
  portfolioOverrides: Record<string, Partial<Record<"copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>;
  getPortfolioStatus: (row: CountryMatrixRow, committee: "copuos" | "disec" | "aippm" | "unsc") => PortfolioStatus;
  onSelectPreference?: (country: string, committee: "copuos" | "disec" | "aippm" | "unsc") => void;
}

const COMMITTEES = [
  { id: "copuos" as const, label: "COPUOS", fullName: "Committee on the Peaceful Uses of Outer Space", color: "#3b82f6", glowColor: "rgba(59, 130, 246, 0.4)", secondaryColor: "#1d4ed8" },
  { id: "disec" as const, label: "UNGA DISEC", fullName: "Disarmament & International Security Committee", color: "#6366f1", glowColor: "rgba(99, 102, 241, 0.4)", secondaryColor: "#4338ca" },
  { id: "aippm" as const, label: "AIPPM", fullName: "All India Political Parties Meet", color: "#f59e0b", glowColor: "rgba(245, 158, 11, 0.4)", secondaryColor: "#b45309" },
  { id: "unsc" as const, label: "UNSC", fullName: "United Nations Security Council", color: "#10b981", glowColor: "rgba(16, 185, 129, 0.4)", secondaryColor: "#047857" }
];

export default function SatelliteCarousel({ portfolioOverrides, getPortfolioStatus, onSelectPreference }: SatelliteCarouselProps) {
  const { user } = useFirebase();
  const [activeCommIdx, setActiveCommIdx] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0); // Offset for swipe rotation tracking
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
      ctx.fillStyle = "rgba(2, 4, 10, 0.15)"; // Soft trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn particles matching the current active committee color
      if (Math.random() < 0.25) {
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.5 - 0.5,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.3,
          life: 1.0
        });
      }

      // Update particles
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
        ctx.shadowBlur = 0; // Reset shadow

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

    // Threshold swipe to switch active committee index
    const threshold = 60;
    if (swipeOffset > threshold) {
      // Swiped Right -> Go to Previous committee
      setActiveCommIdx((prev) => (prev === 0 ? COMMITTEES.length - 1 : prev - 1));
      triggerHaptic(10);
    } else if (swipeOffset < -threshold) {
      // Swiped Left -> Go to Next committee
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

  // Filter available countries matching search
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
    <div className="relative w-full rounded-3xl border border-slate-900 bg-[#02040a] shadow-2xl overflow-hidden h-[630px] flex flex-col select-none">
      
      {/* Background Live Particle Stream */}
      <div className="absolute inset-0 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-transparent to-transparent" />
      </div>

      {/* TOP HEADER CONTROLS */}
      <div className="p-5 border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-md z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 animate-spin-slow text-slate-400" style={{ color: activeComm.color }} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
              // SATELLITE ORBIT TRACKING SYSTEM
            </span>
          </div>
          <h2 className="font-sans text-base font-black text-white mt-0.5 tracking-tight flex items-center gap-1.5">
            Horizontal "Satellite" Carousel
            <Sparkles className="h-3.5 w-3.5 animate-pulse" style={{ color: activeComm.color }} />
          </h2>
        </div>

        {/* Dynamic Telescope Search */}
        <div className="relative max-w-xs w-full sm:w-48 pointer-events-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search active orbit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-900 bg-slate-900/90 py-1 pl-8.5 pr-3 text-[10.5px] text-slate-200 placeholder-slate-500 outline-none focus:border-slate-800 transition-all font-medium"
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
        <div className="absolute bottom-[-180px] w-[500px] h-[340px] rounded-[50%] border-t border-slate-800 pointer-events-none flex items-center justify-center">
          {/* Pulsing sub-ring for tech detail */}
          <div className="w-[490px] h-[330px] rounded-[50%] border-t border-slate-900 border-dashed" />
        </div>

        {/* Swipe instruction tooltip overlay */}
        <div className="absolute top-4 text-center font-mono text-[8px] uppercase tracking-widest text-slate-500 pointer-events-none">
          Swipe horizontally to pivot satellites
        </div>

        {/* Nodes clustered dynamically along coordinates of the arc */}
        <div className="relative w-full max-w-[340px] h-32 flex items-end justify-center pb-2">
          {COMMITTEES.map((comm, idx) => {
            // Radial Angle distance mapping
            const diff = idx - activeCommIdx;
            const angleStep = 0.5; // Angled spread of nodes along the arc
            const baseAngle = diff * angleStep + (swipeOffset * 0.003);

            // Compute coordinates on arc relative to center
            const xRadius = Math.min(160, (containerWidth - 60) / 2);
            const rx = Math.sin(baseAngle) * xRadius;
            const ry = -Math.cos(baseAngle) * 85 + 75; // parabolic arc elevation

            const isActive = idx === activeCommIdx;
            const opacity = Math.max(0.12, 1.0 - Math.abs(diff) * 0.45);
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
                {/* Glowing Satellite node core */}
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                    isActive 
                      ? "bg-slate-950 border-2 shadow-lg" 
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                  style={{
                    borderColor: isActive ? comm.color : undefined,
                    boxShadow: isActive ? `0 0 20px ${comm.glowColor}` : undefined
                  }}
                >
                  <Activity className="h-3 w-3" style={{ color: isActive ? comm.color : "#64748b" }} />
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

        {/* Dynamic navigation arrows HUD */}
        <div className="absolute inset-x-8 bottom-2 z-20 flex justify-between items-center pointer-events-none">
          <button 
            onClick={() => setActiveCommIdx(prev => prev === 0 ? COMMITTEES.length - 1 : prev - 1)}
            className="p-1.5 rounded-full bg-slate-950/60 border border-slate-900 pointer-events-auto hover:text-white text-slate-500 hover:bg-slate-900 transition-all active:scale-90"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          
          <div className="flex-1" />

          <button 
            onClick={() => setActiveCommIdx(prev => prev === COMMITTEES.length - 1 ? 0 : prev + 1)}
            className="p-1.5 rounded-full bg-slate-950/60 border border-slate-900 pointer-events-auto hover:text-white text-slate-500 hover:bg-slate-900 transition-all active:scale-90"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: AVAILABLE PORTFOLIO FLUID GRID (Bounces into place) */}
      <div className="flex-1 bg-slate-950/90 border-t border-slate-900/60 p-5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-700 z-10 text-left">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[8px] uppercase tracking-widest text-emerald-400 font-bold">
              // DEPLOYED PORTFOLIOS: {filteredCountries.length} SLOTS OPEN
            </span>
          </div>
          <span className="font-mono text-[8.5px] text-slate-500 uppercase font-semibold">COUNCIL {activeComm.label}</span>
        </div>

        {filteredCountries.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCountries.map((item, idx) => (
              <button
                key={item.country}
                onClick={() => {
                  setSelectedCountry(item);
                  triggerHaptic(15);
                }}
                className="group relative rounded-2xl border border-slate-900 bg-slate-900/30 hover:bg-slate-900/60 p-3.5 transition-all text-left overflow-hidden flex flex-col justify-between h-20 active:scale-[0.98]"
              >
                {/* Tech indicator badge line */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-0.5 opacity-60 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: activeComm.color }}
                />

                <span className="font-sans text-xs font-black text-slate-100 group-hover:text-white line-clamp-2 leading-tight">
                  {item.country}
                </span>

                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-950/40">
                  <span className="font-mono text-[7px] text-slate-500 uppercase tracking-wider font-semibold">AVAIL. TRAJECTORY</span>
                  <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center rounded-2xl border border-dashed border-slate-900 bg-slate-900/10 flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="h-5 w-5 text-slate-600 animate-pulse" />
            <p className="font-sans text-xs text-slate-500 font-medium">
              No available nation portfolios match your active search telescope.
            </p>
          </div>
        )}
      </div>

      {/* SCREEN EXPANDING TACTICAL OVERLAY WINDOW (Tapped country view) */}
      {selectedCountry && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/90 backdrop-blur-md animate-fade-in" id="portfolio-overlay-modal">
          <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 md:p-8 shadow-2xl my-8 text-left">
              
              {/* Overlay Tech Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ChevronLeft 
                    className="h-5 w-5 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all" 
                    onClick={() => setSelectedCountry(null)}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-black">
                    // DEPLOYED PORTFOLIO OVERLAY
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedCountry(null)}
                  className="font-mono text-[8px] uppercase tracking-wider font-bold bg-slate-950 border border-slate-850 text-slate-400 hover:text-white px-3 py-1 rounded-full cursor-pointer transition-all"
                >
                  CLOSE [ESC]
                </button>
              </div>

              {/* Giant Title nation */}
              <div className="mt-8">
                <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-1">SELECTED STELLAR UNIT</span>
                <h1 className="font-sans text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  {selectedCountry.country}
                  <Target className="h-5 w-5" style={{ color: activeComm.color }} />
                </h1>
              </div>

              {/* Orbit specs matrix list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-start gap-3">
                  <Cpu className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" style={{ color: activeComm.color }} />
                  <div>
                    <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Orbit Committee</span>
                    <span className="font-sans text-xs font-black text-slate-200 mt-0.5 block text-left">{activeComm.fullName}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-start gap-3">
                  <Radio className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" style={{ color: activeComm.color }} />
                  <div>
                    <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Trajectory Status</span>
                    <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-emerald-400 mt-1 animate-pulse tracking-widest text-left">
                      Available for Allocation
                    </span>
                  </div>
                </div>
              </div>

              {/* Cockpit telemetry simulation log */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-850 font-mono text-[9.5px] leading-relaxed text-slate-400">
                <p className="text-emerald-400/90 font-bold mb-1">// COCKPIT PRE-FLIGHT DIAGNOSTICS:</p>
                <p>&gt; ALLOCATION NODE INJECTION: READY</p>
                <p>&gt; SECURE COUPLING SYSTEM: ACTIVE</p>
                <p>&gt; PORTFOLIO LOCK TRAJECTORY STATUS: RECEPTIVE</p>
                <p>&gt; SECURE ENCRYPTED KEY GENERATED PRE-CHECK SUCCESSFUL</p>
              </div>

              {/* Action Footer */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="font-sans text-[11px] text-slate-400 max-w-sm text-left">
                  Lock your MUN boarding trajectory and secure <strong>{selectedCountry.country}</strong> in your final allocation request slot.
                </p>

                <button
                  onClick={() => {
                    if (onSelectPreference) {
                      onSelectPreference(selectedCountry.country, activeComm.id);
                    }
                    setSelectedCountry(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3 text-xs font-mono uppercase tracking-widest font-black text-white shadow-lg shadow-indigo-950/40 transition-all active:scale-95 cursor-pointer"
                >
                  Insert Trajectory Key & Register
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
