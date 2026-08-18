/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { COUNTRY_MATRIX } from "../data";
import { CountryMatrixRow, PortfolioStatus } from "../types";
import { Search, CheckCircle2, AlertCircle, ShieldAlert, Filter, Table, Globe, Sparkles, Clock, Ban } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import SatelliteCarousel from "./SatelliteCarousel";
import { motion } from "motion/react";
import SpotlightCard from "./SpotlightCard";

interface CountryMatrixProps {
  onSelectPreference?: (country: string, committee: "copuos" | "disec" | "aippm" | "unsc") => void;
}

export default function CountryMatrix({ onSelectPreference }: CountryMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PortfolioStatus>("All");
  const [activeCommitteeCol, setActiveCommitteeCol] = useState<"all" | "copuos" | "disec" | "aippm" | "unsc">("all");
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, Partial<Record<"copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>>({});
  const [viewMode, setViewMode] = useState<"constellation" | "ledger">("constellation");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "portfolio_states"), (snapshot) => {
      const overrides: typeof portfolioOverrides = {};
      snapshot.forEach((doc) => {
        overrides[doc.id] = doc.data() as any;
      });
      setPortfolioOverrides(overrides);
    }, (error) => {
      console.error("Error loading portfolio overrides:", error instanceof Error ? error.message : "Fetch error");
    });

    return () => unsubscribe();
  }, []);

  const getPortfolioStatus = (row: CountryMatrixRow, committee: "copuos" | "disec" | "aippm" | "unsc"): PortfolioStatus => {
    return portfolioOverrides[row.country]?.[committee] ?? row[committee];
  };

  const getStatusBadge = (status: PortfolioStatus) => {
    switch (status) {
      case "Available":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            Available
          </span>
        );
      case "Assigned":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-3 w-3" />
            Assigned
          </span>
        );
      case "Reserved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
            <AlertCircle className="h-3 w-3" />
            Special EB
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "N/A":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-white/[0.1]">
            <Ban className="h-3 w-3" />
            N/A
          </span>
        );
      default:
        return null;
    }
  };

  const filteredMatrix = COUNTRY_MATRIX.filter((row) => {
    const matchesSearch = row.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "All") return matchesSearch;

    const statusCopuos = getPortfolioStatus(row, "copuos");
    const statusDisec = getPortfolioStatus(row, "disec");
    const statusAippm = getPortfolioStatus(row, "aippm");
    const statusUnsc = getPortfolioStatus(row, "unsc");

    if (activeCommitteeCol === "all") {
      return (
        matchesSearch &&
        (statusCopuos === statusFilter ||
          statusDisec === statusFilter ||
          statusAippm === statusFilter ||
          statusUnsc === statusFilter)
      );
    } else {
      const activeStatus = getPortfolioStatus(row, activeCommitteeCol);
      return matchesSearch && activeStatus === statusFilter;
    }
  });

  return (
    <div className="bg-[#04060a] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Orionix Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-[140px] rounded-full" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
            // LIVE ALLOCATION MATRIX
          </span>
          <h1 className="mt-4 font-sans text-3xl sm:text-5xl font-black tracking-tight text-white">
            Country & Leader Matrix
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-slate-400 text-xs sm:text-sm leading-relaxed">
            Search for preferred nations or leaders across our four councils, verify allocation states in real time, and lock your preferences for registration.
          </p>

          {/* View Mode Toggle */}
          <div className="mt-8 inline-flex items-center gap-1.5 p-1.5 bg-black/60 border border-white/[0.1] rounded-full shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => setViewMode("constellation")}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                viewMode === "constellation"
                  ? "bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Satellite Carousel
            </button>
            <button
              onClick={() => setViewMode("ledger")}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                viewMode === "ledger"
                  ? "bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              Table Ledger
            </button>
          </div>
        </motion.div>

        {viewMode === "constellation" ? (
          <div className="animate-fade-in" id="constellation-matrix-container">
            <SatelliteCarousel 
              portfolioOverrides={portfolioOverrides} 
              getPortfolioStatus={getPortfolioStatus} 
              onSelectPreference={onSelectPreference}
            />
          </div>
        ) : (
          <>
            {/* Filter Controls Panel */}
            <SpotlightCard className="p-6 mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" spotlightColor="rgba(56, 189, 248, 0.1)">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search country or leader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-full border border-white/[0.1] bg-black/50 py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-all font-medium"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Status Selector */}
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-full border border-white/[0.08] flex-wrap">
                  {(["All", "Available", "Assigned", "Reserved", "Pending", "N/A"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                        statusFilter === status
                          ? "bg-white text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {status === "Reserved" ? "Special EB" : status}
                    </button>
                  ))}
                </div>

                {/* Committee Column Highlighter */}
                <div className="flex items-center gap-1.5 bg-black/50 p-1.5 rounded-full border border-white/[0.08]">
                  <Table className="h-3.5 w-3.5 text-slate-400 ml-2" />
                  <select
                    value={activeCommitteeCol}
                    onChange={(e: any) => setActiveCommitteeCol(e.target.value)}
                    className="bg-transparent text-[10px] uppercase tracking-wider text-slate-300 font-bold pr-2 py-1 outline-none border-none cursor-pointer focus:text-white"
                  >
                    <option value="all" className="bg-[#070a12] text-slate-300">All Councils</option>
                    <option value="copuos" className="bg-[#070a12] text-slate-300">COPUOS</option>
                    <option value="disec" className="bg-[#070a12] text-slate-300">UNGA DISEC</option>
                    <option value="aippm" className="bg-[#070a12] text-slate-300">AIPPM</option>
                    <option value="unsc" className="bg-[#070a12] text-slate-300">UNSC</option>
                  </select>
                </div>
              </div>
            </SpotlightCard>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#070a12]/80 shadow-2xl backdrop-blur-2xl">
              <table className="w-full min-w-[700px] border-collapse text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-black/40 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4 font-bold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-cyan-400" />
                      Portfolio / Nation
                    </th>
                    <th className={`px-6 py-4 font-bold transition-all ${activeCommitteeCol === "copuos" ? "text-cyan-400 bg-cyan-950/20" : ""}`}>
                      COPUOS
                    </th>
                    <th className={`px-6 py-4 font-bold transition-all ${activeCommitteeCol === "disec" ? "text-indigo-400 bg-indigo-950/20" : ""}`}>
                      UNGA DISEC
                    </th>
                    <th className={`px-6 py-4 font-bold transition-all ${activeCommitteeCol === "aippm" ? "text-amber-400 bg-amber-950/20" : ""}`}>
                      AIPPM (India)
                    </th>
                    <th className={`px-6 py-4 font-bold transition-all ${activeCommitteeCol === "unsc" ? "text-emerald-400 bg-emerald-950/20" : ""}`}>
                      UNSC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredMatrix.length > 0 ? (
                    filteredMatrix.map((row) => (
                      <tr
                        key={row.country}
                        className="hover:bg-white/[0.03] transition-all group"
                      >
                        <td className="px-6 py-4 font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {row.country}
                        </td>

                        <td className={`px-6 py-4 transition-all ${activeCommitteeCol === "copuos" ? "bg-cyan-950/10" : ""}`}>
                          {getStatusBadge(getPortfolioStatus(row, "copuos"))}
                        </td>

                        <td className={`px-6 py-4 transition-all ${activeCommitteeCol === "disec" ? "bg-indigo-950/10" : ""}`}>
                          {getStatusBadge(getPortfolioStatus(row, "disec"))}
                        </td>

                        <td className={`px-6 py-4 transition-all ${activeCommitteeCol === "aippm" ? "bg-amber-950/10" : ""}`}>
                          {getStatusBadge(getPortfolioStatus(row, "aippm"))}
                        </td>

                        <td className={`px-6 py-4 transition-all ${activeCommitteeCol === "unsc" ? "bg-emerald-950/10" : ""}`}>
                          {getStatusBadge(getPortfolioStatus(row, "unsc"))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-sans">
                        No country portfolios found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Note Box */}
        <div className="mt-6 rounded-3xl border border-white/[0.08] bg-[#070a12]/60 p-5 flex gap-3 items-start text-left backdrop-blur-xl">
          <AlertCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="font-sans text-xs text-slate-400 leading-relaxed">
            <span className="text-white font-semibold">Note:</span> Allocations are dynamically synchronized every 24 hours. "Special EB" portfolios represent key strategic leaders and require a brief rationale during registration.
          </p>
        </div>
      </div>
    </div>
  );
}
