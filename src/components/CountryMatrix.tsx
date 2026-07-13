/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { COUNTRY_MATRIX } from "../data";
import { CountryMatrixRow } from "../types";
import { Search, SlidersHorizontal, CheckCircle2, AlertCircle, ShieldAlert, Filter, Table, Globe } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function CountryMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Available" | "Assigned" | "Reserved">("All");
  const [activeCommitteeCol, setActiveCommitteeCol] = useState<"all" | "copuos" | "disec" | "aippm" | "unsc">("all");
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, Partial<Record<"copuos" | "disec" | "aippm" | "unsc", "Available" | "Assigned" | "Reserved">>>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "portfolio_states"), (snapshot) => {
      const overrides: typeof portfolioOverrides = {};
      snapshot.forEach((doc) => {
        overrides[doc.id] = doc.data() as any;
      });
      setPortfolioOverrides(overrides);
    }, (error) => {
      console.error("Error loading portfolio overrides:", error);
    });

    return () => unsubscribe();
  }, []);

  const getPortfolioStatus = (row: CountryMatrixRow, committee: "copuos" | "disec" | "aippm" | "unsc"): "Available" | "Assigned" | "Reserved" => {
    return portfolioOverrides[row.country]?.[committee] ?? row[committee];
  };

  const getStatusBadge = (status: "Available" | "Assigned" | "Reserved") => {
    switch (status) {
      case "Available":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Available
          </span>
        );
      case "Assigned":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-3 w-3" />
            Assigned
          </span>
        );
      case "Reserved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-450 border border-amber-500/20">
            <AlertCircle className="h-3 w-3" />
            Special EB
          </span>
        );
      default:
        return null;
    }
  };

  // Filter matrix rows based on search and status filters
  const filteredMatrix = COUNTRY_MATRIX.filter((row) => {
    const matchesSearch = row.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "All") return matchesSearch;

    const statusCopuos = getPortfolioStatus(row, "copuos");
    const statusDisec = getPortfolioStatus(row, "disec");
    const statusAippm = getPortfolioStatus(row, "aippm");
    const statusUnsc = getPortfolioStatus(row, "unsc");

    // Check if status is present in ANY of the committee columns (or active column if selected)
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
    <div className="bg-[#020617] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%)" }}>
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-blue-400 font-bold">// LIVE PORTFOLIOS</span>
          <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Country & Leader Matrix
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-slate-400 text-xs sm:text-sm leading-relaxed">
            Below is the official allocation ledger. Search for your preferred nations or leaders, filter by status, and specify them in your registration form.
          </p>
        </div>

        {/* Filter Controls Panel */}
        <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-md mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search country or legislative character..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-full border border-slate-800">
              <Filter className="h-3.5 w-3.5 text-slate-500 ml-2" />
              {(["All", "Available", "Assigned", "Reserved"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-all ${
                    statusFilter === status
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Committee Column Highlighter */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-full border border-slate-800">
              <Table className="h-3.5 w-3.5 text-slate-500 ml-2" />
              <select
                value={activeCommitteeCol}
                onChange={(e: any) => setActiveCommitteeCol(e.target.value)}
                className="bg-transparent text-[10px] uppercase tracking-wider text-slate-300 font-bold pr-2 py-1 outline-none border-none cursor-pointer focus:text-white"
              >
                <option value="all" className="bg-slate-950 text-slate-300">All Councils</option>
                <option value="copuos" className="bg-slate-950 text-slate-300">COPUOS Only</option>
                <option value="disec" className="bg-slate-950 text-slate-300">UNGA DISEC Only</option>
                <option value="aippm" className="bg-slate-950 text-slate-300">AIPPM Only</option>
                <option value="unsc" className="bg-slate-950 text-slate-300">UNSC Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-900 bg-slate-900/20 shadow-2xl backdrop-blur-md">
          <table className="w-full min-w-[700px] border-collapse text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4 font-bold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  Portfolio / Nation
                </th>
                <th className={`px-6 py-4 font-bold transition-all ${activeCommitteeCol === "copuos" ? "text-blue-400 bg-blue-950/20" : ""}`}>
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
            <tbody className="divide-y divide-slate-900">
              {filteredMatrix.length > 0 ? (
                filteredMatrix.map((row) => (
                  <tr
                    key={row.country}
                    className="hover:bg-slate-900/30 transition-all group"
                  >
                    {/* Country Cell */}
                    <td className="px-6 py-4 font-bold text-white group-hover:text-blue-400 transition-colors">
                      {row.country}
                    </td>

                    {/* COPUOS Cell */}
                    <td className={`px-6 py-4 transition-all ${activeCommitteeCol === "copuos" ? "bg-blue-950/10" : ""}`}>
                      {getStatusBadge(getPortfolioStatus(row, "copuos"))}
                    </td>

                    {/* DISEC Cell */}
                    <td className={`px-6 py-4 transition-all ${activeCommitteeCol === "disec" ? "bg-indigo-950/10" : ""}`}>
                      {getStatusBadge(getPortfolioStatus(row, "disec"))}
                    </td>

                    {/* AIPPM Cell */}
                    <td className={`px-6 py-4 transition-all ${activeCommitteeCol === "aippm" ? "bg-amber-950/10" : ""}`}>
                      {getStatusBadge(getPortfolioStatus(row, "aippm"))}
                    </td>

                    {/* UNSC Cell */}
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

        {/* Informative Note */}
        <div className="mt-6 rounded-3xl border border-slate-900 bg-slate-950/60 p-5 flex gap-3 items-start text-left">
          <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="font-sans text-xs text-slate-400 leading-relaxed">
            <span className="text-white font-semibold">Note:</span> Allocations are dynamically updated every 24 hours. "Special EB" portfolios in AIPPM represent historical political figures and leaders, and require a separate motivation write-up. In double delegations (COPUOS & DISEC), both delegates share the exact same country portfolio.
          </p>
        </div>
      </div>
    </div>
  );
}
