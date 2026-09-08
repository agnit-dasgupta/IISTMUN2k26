/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { COUNTRY_MATRIX } from "../data";
import { CountryMatrixRow, PortfolioStatus } from "../types";
import { Search, CheckCircle2, AlertCircle, ShieldAlert, Filter, Table, Globe, Sparkles, Clock, Ban, Compass } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import SatelliteCarousel from "./SatelliteCarousel";
import { motion } from "motion/react";

interface CountryMatrixProps {
  onSelectPreference?: (country: string, committee: "copuos" | "disec" | "aippm" | "unsc") => void;
}

export default function CountryMatrix({ onSelectPreference }: CountryMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PortfolioStatus>("All");
  const [activeCommitteeCol, setActiveCommitteeCol] = useState<"all" | "copuos" | "disec" | "aippm" | "unsc">("all");
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, Partial<Record<"copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>>({});
  const [viewMode, setViewMode] = useState<"ledger" | "constellation">("ledger");

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
          <span className="inline-flex items-center gap-1 border border-[#8A9A7E]/50 bg-[#2E3B2F] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#8A9A7E]">
            <CheckCircle2 className="h-3 w-3" />
            Available
          </span>
        );
      case "Assigned":
        return (
          <span className="inline-flex items-center gap-1 border border-[#8B5A3C]/60 bg-[#8B5A3C]/20 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#EDE6D3]">
            <ShieldAlert className="h-3 w-3 text-[#C9A86A]" />
            Assigned
          </span>
        );
      case "Reserved":
        return (
          <span className="inline-flex items-center gap-1 border border-[#C9A86A] bg-[#C9A86A]/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#C9A86A]">
            <AlertCircle className="h-3 w-3" />
            Special EB
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 border border-[#586841] bg-[#586841]/20 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#8A9A7E]">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "N/A":
        return (
          <span className="inline-flex items-center gap-1 border border-[#EDE6D3]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#8A9A7E]/50">
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
    <div className="bg-[#1A1F1A] text-[#EDE6D3] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans paper-grain newsprint-overlay selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]">
      
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-left mb-12 border-b border-[#C9A86A]/20 pb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="emblem-seal px-3 py-0.5 text-[11px] uppercase tracking-[0.2em] bg-[#2E3B2F]">
              Diplomatic Register
            </span>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8A9A7E] font-medium">
              Live State Matrix
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
            Country & Leader Allocation Ledger
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-xs sm:text-sm text-[#8A9A7E] leading-relaxed font-light">
            Search for preferred sovereign states or parliamentary leaders across our four chambers. Verify real-time availability and select portfolios for your delegation application.
          </p>

          {/* View Mode Toggle */}
          <div className="mt-6 inline-flex items-center gap-1 border border-[#C9A86A]/30 bg-[#2E3B2F] p-1 shadow-md">
            <button
              onClick={() => setViewMode("ledger")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-sans uppercase tracking-[0.15em] transition-all cursor-pointer ${
                viewMode === "ledger"
                  ? "bg-[#C9A86A] text-[#1A1F1A] font-semibold"
                  : "text-[#EDE6D3]/70 hover:text-[#EDE6D3]"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              Archival Ledger
            </button>
            <button
              onClick={() => setViewMode("constellation")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-sans uppercase tracking-[0.15em] transition-all cursor-pointer ${
                viewMode === "constellation"
                  ? "bg-[#C9A86A] text-[#1A1F1A] font-semibold"
                  : "text-[#EDE6D3]/70 hover:text-[#EDE6D3]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Satellite Carousel
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
            <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-5 mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between text-left shadow-md">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                <input
                  type="text"
                  placeholder="Search nation or portfolio leader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-[#C9A86A]/30 bg-[#1A1F1A] py-2.5 pl-10 pr-4 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E] outline-none focus:border-[#C9A86A]"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Status Selector */}
                <div className="flex items-center gap-1 border border-[#C9A86A]/20 bg-[#1A1F1A] p-1 flex-wrap">
                  {(["All", "Available", "Assigned", "Reserved", "Pending", "N/A"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 font-sans text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                        statusFilter === status
                          ? "bg-[#C9A86A] text-[#1A1F1A] font-semibold"
                          : "text-[#8A9A7E] hover:text-[#EDE6D3]"
                      }`}
                    >
                      {status === "Reserved" ? "Special EB" : status}
                    </button>
                  ))}
                </div>

                {/* Committee Column Highlighter */}
                <div className="flex items-center gap-1 border border-[#C9A86A]/20 bg-[#1A1F1A] px-2 py-1">
                  <Table className="h-3.5 w-3.5 text-[#8A9A7E]" />
                  <select
                    value={activeCommitteeCol}
                    onChange={(e: any) => setActiveCommitteeCol(e.target.value)}
                    className="bg-transparent font-sans text-[10px] uppercase tracking-wider text-[#EDE6D3] pr-2 py-0.5 outline-none border-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">All Councils</option>
                    <option value="copuos" className="bg-[#1A1F1A] text-[#EDE6D3]">COPUOS</option>
                    <option value="disec" className="bg-[#1A1F1A] text-[#EDE6D3]">UNGA DISEC</option>
                    <option value="aippm" className="bg-[#1A1F1A] text-[#EDE6D3]">AIPPM</option>
                    <option value="unsc" className="bg-[#1A1F1A] text-[#EDE6D3]">UNSC</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-[#C9A86A]/30 bg-[#2E3B2F] shadow-xl">
              <table className="w-full min-w-[700px] border-collapse text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-[#C9A86A]/30 bg-[#1A1F1A] font-sans text-[10px] uppercase tracking-[0.18em] text-[#C9A86A]">
                    <th className="px-6 py-4 font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#C9A86A]" />
                      Nation / Portfolio
                    </th>
                    <th className={`px-6 py-4 font-semibold ${activeCommitteeCol === "copuos" ? "bg-[#C9A86A]/10 text-[#EDE6D3]" : ""}`}>
                      UN COPUOS
                    </th>
                    <th className={`px-6 py-4 font-semibold ${activeCommitteeCol === "disec" ? "bg-[#C9A86A]/10 text-[#EDE6D3]" : ""}`}>
                      UNGA DISEC
                    </th>
                    <th className={`px-6 py-4 font-semibold ${activeCommitteeCol === "aippm" ? "bg-[#C9A86A]/10 text-[#EDE6D3]" : ""}`}>
                      AIPPM (India)
                    </th>
                    <th className={`px-6 py-4 font-semibold ${activeCommitteeCol === "unsc" ? "bg-[#C9A86A]/10 text-[#EDE6D3]" : ""}`}>
                      UNSC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A86A]/15">
                  {filteredMatrix.length > 0 ? (
                    filteredMatrix.map((row) => (
                      <tr
                        key={row.country}
                        className="hover:bg-[#1A1F1A]/50 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-serif text-sm text-[#EDE6D3] font-normal">
                          {row.country}
                        </td>

                        <td className={`px-6 py-3.5 ${activeCommitteeCol === "copuos" ? "bg-[#C9A86A]/5" : ""}`}>
                          {getStatusBadge(getPortfolioStatus(row, "copuos"))}
                        </td>

                        <td className={`px-6 py-3.5 ${activeCommitteeCol === "disec" ? "bg-[#C9A86A]/5" : ""}`}>
                          {getStatusBadge(getPortfolioStatus(row, "disec"))}
                        </td>

                        <td className={`px-6 py-3.5 ${activeCommitteeCol === "aippm" ? "bg-[#C9A86A]/5" : ""}`}>
                          {getStatusBadge(getPortfolioStatus(row, "aippm"))}
                        </td>

                        <td className={`px-6 py-3.5 ${activeCommitteeCol === "unsc" ? "bg-[#C9A86A]/5" : ""}`}>
                          {getStatusBadge(getPortfolioStatus(row, "unsc"))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#8A9A7E] font-sans">
                        No portfolios found matching your search parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Note Box */}
        <div className="mt-6 border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 flex gap-3 items-start text-left">
          <AlertCircle className="h-4 w-4 text-[#C9A86A] shrink-0 mt-0.5" />
          <p className="font-sans text-xs text-[#8A9A7E] leading-relaxed">
            <strong className="text-[#EDE6D3] font-normal">Allocation Protocol:</strong> Allocations are synchronized dynamically with committee records. "Special EB" portfolios represent key strategic leaders and require a brief rationale during registration.
          </p>
        </div>
      </div>
    </div>
  );
}
