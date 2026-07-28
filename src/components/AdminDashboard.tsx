/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot, query, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useFirebase } from "../FirebaseContext";
import { COUNTRY_MATRIX } from "../data";
import { 
  Users, 
  Search, 
  Download, 
  Trash2, 
  Filter, 
  FileText, 
  Building2, 
  Compass, 
  Calendar, 
  ShieldCheck, 
  X, 
  User, 
  Briefcase, 
  Check,
  AlertTriangle,
  Globe
} from "lucide-react";
import { RegistrationDetails, CountryMatrixRow, PortfolioStatus } from "../types";

interface PortfolioStatusSelectorProps {
  country: string;
  committee: "copuos" | "disec" | "aippm" | "unsc";
  currentStatus: PortfolioStatus;
  onUpdate: (country: string, committee: "copuos" | "disec" | "aippm" | "unsc", newStatus: PortfolioStatus) => void;
}

function PortfolioStatusSelector({ country, committee, currentStatus, onUpdate }: PortfolioStatusSelectorProps) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onUpdate(country, committee, e.target.value as any)}
      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold border outline-none cursor-pointer transition-all ${
        currentStatus === "Available"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
          : currentStatus === "Assigned"
          ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
          : currentStatus === "Reserved"
          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
          : currentStatus === "Pending"
          ? "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20"
          : "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20"
      }`}
    >
      <option value="Available" className="bg-slate-950 text-emerald-400">Available</option>
      <option value="Assigned" className="bg-slate-950 text-rose-400">Assigned</option>
      <option value="Reserved" className="bg-slate-950 text-amber-400">Special EB</option>
      <option value="Pending" className="bg-slate-950 text-violet-400">Pending</option>
      <option value="N/A" className="bg-slate-950 text-slate-400">N/A</option>
    </select>
  );
}

export default function AdminDashboard() {
  const { user } = useFirebase();
  const [registrations, setRegistrations] = useState<RegistrationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCommittee, setFilterCommittee] = useState<string>("all");
  const [selectedReg, setSelectedReg] = useState<RegistrationDetails | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmWorkshopDeleteId, setConfirmWorkshopDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [workshopRegistrations, setWorkshopRegistrations] = useState<any[]>([]);
  const [workshopSearch, setWorkshopSearch] = useState("");

  // New portfolio states
  const [activeSubTab, setActiveSubTab] = useState<"registrations" | "workshop">("registrations");
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, Partial<Record<"copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>>({});

  const isAdmin = user?.email === "agnit.dg@gmail.com";

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "workshop_registrations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          uid: docSnap.id,
          ...docSnap.data()
        });
      });
      // Sort by timestamp descending
      list.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setWorkshopRegistrations(list);
    }, (error) => {
      console.error("Error fetching workshop registrations:", error instanceof Error ? error.message : "Access denied");
    });

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "registrations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: RegistrationDetails[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          uid: docSnap.id,
          ...docSnap.data()
        } as unknown as RegistrationDetails);
      });
      // Sort by timestamp descending
      list.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setRegistrations(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching registrations collection:", error instanceof Error ? error.message : "Access denied");
      handleFirestoreError(error, OperationType.LIST, "registrations");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, "portfolio_states"), (snapshot) => {
      const overrides: typeof portfolioOverrides = {};
      snapshot.forEach((doc) => {
        overrides[doc.id] = doc.data() as any;
      });
      setPortfolioOverrides(overrides);
    }, (error) => {
      console.error("Error fetching portfolio overrides:", error instanceof Error ? error.message : "Access denied");
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const updatePortfolioStatus = async (
    country: string,
    committee: "copuos" | "disec" | "aippm" | "unsc",
    newStatus: PortfolioStatus
  ) => {
    try {
      const docRef = doc(db, "portfolio_states", country);
      await setDoc(docRef, { [committee]: newStatus }, { merge: true });
      showToast(`Updated ${country}'s ${committee.toUpperCase()} status to ${newStatus === "Reserved" ? "Special EB" : newStatus}.`);
    } catch (err) {
      console.error("Error setting portfolio status:", err instanceof Error ? err.message : "Update failed");
      showToast("Error updating portfolio status in database.");
    }
  };

  const getPortfolioStatus = (
    countryName: string,
    committee: "copuos" | "disec" | "aippm" | "unsc",
    defaultStatus: PortfolioStatus
  ) => {
    return portfolioOverrides[countryName]?.[committee] ?? defaultStatus;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    setActionLoading(true);
    try {
      // The registration doc ID is the userId (which was stored in registrations as the key in our previous Registration logic)
      await deleteDoc(doc(db, "registrations", id));
      showToast(`Successfully deleted registration for ${name}.`);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete registration doc:", err instanceof Error ? err.message : "Delete failed");
      showToast("Error deleting registration. Check permissions.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWorkshopDelete = async (id: string, name: string) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "workshop_registrations", id));
      showToast(`Successfully deleted workshop registration for ${name}.`);
      setConfirmWorkshopDeleteId(null);
    } catch (err) {
      console.error("Failed to delete workshop registration doc:", err instanceof Error ? err.message : "Delete failed");
      showToast("Error deleting workshop registration. Check permissions.");
    } finally {
      setActionLoading(false);
    }
  };

  const exportWorkshopToCSV = () => {
    if (workshopRegistrations.length === 0) return;
    const headers = [
      "Ticket ID", "Type", "Participant/School Name", "Teacher in Charge", 
      "Teacher Designation", "Teacher Email", "Teacher Phone", "Contact Email", 
      "Contact Phone", "Institution", "Course/Grades", "Est Students", 
      "Technical Level", "Timestamp", "Motivation/Notes"
    ];
    const rows = workshopRegistrations.map(r => [
      r.id || "",
      r.regType === "school" ? "School Delegation" : "Individual",
      r.name || "",
      r.teacherName || "",
      r.teacherDesignation || "",
      r.teacherEmail || "",
      r.teacherPhone || "",
      r.email || "",
      r.phone || "",
      r.institution || "",
      r.course || r.gradeLevels || "",
      r.estimatedStudents || "",
      r.experience || "",
      r.timestamp || "",
      r.motivation || r.specialRequirements || ""
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IIST_MUN_2026_Workshop_Registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export functions
  const exportToCSV = () => {
    if (registrations.length === 0) return;
    
    const headers = [
      "Ticket ID", "Name", "Email", "Phone", "Registration Type", 
      "Role", "Institution", "Course/Class", "MUN Experience", 
      "Pref 1 Committee", "Pref 1 Country",
      "Pref 2 Committee", "Pref 2 Country",
      "Pref 3 Committee", "Pref 3 Country",
      "Partner Name", "Partner Email", "Partner Role", "Partner ID", "Contingent Size", "Timestamp"
    ];

    const rows = registrations.map(r => [
      r.id || "",
      r.name || "",
      r.email || "",
      r.phone || "",
      r.regType || "",
      r.role || "Delegate",
      r.institution || "",
      r.course || "",
      r.munExperience || "",
      r.pref1Committee || "",
      r.pref1Country || "",
      r.pref2Committee || "",
      r.pref2Country || "",
      r.pref3Committee || "",
      r.pref3Country || "",
      r.partnerName || "",
      r.partnerEmail || "",
      r.partnerRole || "",
      r.partnerId || "",
      r.contingentSize || "",
      r.timestamp || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IIST_MUN_2026_Delegates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Download started successfully!");
  };

  const exportToJSON = () => {
    if (registrations.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(registrations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `IIST_MUN_2026_Delegates_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("JSON Download started successfully!");
  };

  // Filter registrations
  const filtered = registrations.filter(r => {
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (r.name?.toLowerCase() || "").includes(queryLower) ||
      (r.email?.toLowerCase() || "").includes(queryLower) ||
      (r.institution?.toLowerCase() || "").includes(queryLower) ||
      (r.id?.toLowerCase() || "").includes(queryLower);

    const matchesType = filterType === "all" || r.regType === filterType;
    const matchesCommittee = filterCommittee === "all" || 
      r.pref1Committee === filterCommittee || 
      r.pref2Committee === filterCommittee || 
      r.pref3Committee === filterCommittee;

    return matchesSearch && matchesType && matchesCommittee;
  });

  // Count helper statistics
  const totalCount = registrations.length;
  const individualCount = registrations.filter(r => r.regType === "individual").length;
  const doubleCount = registrations.filter(r => r.regType === "double").length;
  const contingentCount = registrations.filter(r => r.regType === "contingent").length;

  if (!isAdmin) {
    return (
      <div className="bg-[#020617] text-slate-100 min-h-screen py-24 px-4 relative overflow-hidden flex items-center justify-center" style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%)" }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />
        <div className="relative z-10 max-w-md w-full bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-md text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-red-400 font-bold">// ACCESS RESTRICTED</span>
          <h1 className="mt-2 font-sans text-xl font-black text-white uppercase tracking-tight">Security Override Active</h1>
          <p className="mt-3 font-sans text-slate-400 text-xs leading-relaxed">
            This dashboard is reserved exclusively for the Command Secretariat and authorized registry personnel of IIST MUN 2026. Please connect with your authorized account to proceed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#020617] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%)" }}>
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-30" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-full border border-blue-500/30 bg-slate-900/95 px-5 py-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] backdrop-blur-md animate-fade-in">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-sans text-xs font-bold text-slate-200">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-300 ml-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="text-left">
            <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold">// ORGANIZER PANEL</span>
            <h1 className="mt-2 font-sans text-3xl font-black tracking-tight text-white sm:text-4xl uppercase">
              Registries Telemetry
            </h1>
            <p className="mt-1 font-sans text-slate-400 text-sm">
              Live orbital monitoring of registered candidates, delegations, and preferred country vectors.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={registrations.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-blue-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              disabled={registrations.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-purple-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 backdrop-blur-sm text-left">
            <span className="font-mono text-[8px] uppercase tracking-widest text-slate-500 font-bold">TOTAL REGISTRATIONS</span>
            <div className="flex justify-between items-end mt-2">
              <span className="font-sans text-3xl font-black text-white">{totalCount}</span>
              <div className="p-2 bg-blue-500/5 rounded-full border border-blue-500/10 text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 backdrop-blur-sm text-left">
            <span className="font-mono text-[8px] uppercase tracking-widest text-slate-500 font-bold">INDIVIDUAL</span>
            <div className="flex justify-between items-end mt-2">
              <span className="font-sans text-3xl font-black text-white">{individualCount}</span>
              <div className="p-2 bg-emerald-500/5 rounded-full border border-emerald-500/10 text-emerald-400">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 backdrop-blur-sm text-left">
            <span className="font-mono text-[8px] uppercase tracking-widest text-slate-500 font-bold">DOUBLE DELEGATIONS</span>
            <div className="flex justify-between items-end mt-2">
              <span className="font-sans text-3xl font-black text-white">{doubleCount}</span>
              <div className="p-2 bg-purple-500/5 rounded-full border border-purple-500/10 text-purple-400">
                <Compass className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 backdrop-blur-sm text-left">
            <span className="font-mono text-[8px] uppercase tracking-widest text-slate-500 font-bold">CONTINGENTS</span>
            <div className="flex justify-between items-end mt-2">
              <span className="font-sans text-3xl font-black text-white">{contingentCount}</span>
              <div className="p-2 bg-amber-500/5 rounded-full border border-amber-500/10 text-amber-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-900 mb-8">
          <button
            onClick={() => setActiveSubTab("registrations")}
            className={`px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeSubTab === "registrations"
                ? "border-cyan-500 text-cyan-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Delegate Registrations ({filtered.length})
          </button>
          <button
            onClick={() => setActiveSubTab("workshop")}
            className={`px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeSubTab === "workshop"
                ? "border-cyan-500 text-cyan-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Workshop ({workshopRegistrations.length})
          </button>
        </div>

        {activeSubTab === "registrations" && (
          <>
            {/* Filters and Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-950/40 border border-slate-900 rounded-3xl p-4 mb-8">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by candidate name, email, institution, ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-cyan-500/50 rounded-full pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
                {/* Filter by Registration Type */}
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 rounded-full px-3 py-1.5">
                  <Filter className="h-3 w-3 text-cyan-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-transparent text-slate-300 font-sans text-[11px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all">ALL DELEGATE TYPES</option>
                    <option value="individual">INDIVIDUAL</option>
                    <option value="double">DOUBLE DELEGATION</option>
                    <option value="contingent">CONTINGENT</option>
                  </select>
                </div>

                {/* Filter by Preferred Committee */}
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 rounded-full px-3 py-1.5">
                  <Briefcase className="h-3 w-3 text-purple-400" />
                  <select
                    value={filterCommittee}
                    onChange={(e) => setFilterCommittee(e.target.value)}
                    className="bg-transparent text-slate-300 font-sans text-[11px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all">ALL COMMITTEES</option>
                    <option value="copuos">COPUOS (Space Committee)</option>
                    <option value="disec">UNGA (DISEC)</option>
                    <option value="unsc">UN Security Council</option>
                    <option value="aippm">AIPPM Meet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Table */}
            {loading ? (
              <div className="text-center py-24 bg-slate-950/20 border border-slate-900 rounded-3xl">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
                <p className="font-sans text-slate-500 text-xs mt-4 uppercase tracking-widest">// SYNCHRONIZING REAL-TIME PORTAL REGISTRIES...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 bg-slate-950/20 border border-slate-900 rounded-3xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-slate-600 mb-4">
                  <Search className="h-5 w-5" />
                </div>
                <p className="font-sans text-slate-400 text-sm">No registered delegates found matching the filters.</p>
                <p className="font-mono text-[9px] text-slate-600 mt-1 uppercase">// EMPTY GRID RESPONSE</p>
              </div>
            ) : (
              <div className="bg-slate-950/20 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/40">
                        <th className="p-4 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">Ticket ID</th>
                        <th className="p-4 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">Delegate Info</th>
                        <th className="p-4 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">Institution & Course</th>
                        <th className="p-4 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">Registration</th>
                        <th className="p-4 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">Primary Preference</th>
                        <th className="p-4 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">Created On</th>
                        <th className="p-4 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {filtered.map((item) => (
                        <tr 
                          key={item.uid} 
                          className="hover:bg-slate-900/20 transition-all group"
                        >
                          {/* Ticket ID */}
                          <td className="p-4 font-mono text-xs font-bold text-cyan-400">
                            {item.id}
                          </td>

                          {/* Delegate Info */}
                          <td className="p-4">
                            <div className="flex flex-col text-left">
                              <span className="font-sans text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                                {item.name}
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                                  item.role === "Photographer" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                }`}>
                                  {item.role || "Delegate"}
                                </span>
                              </span>
                              <span className="font-sans text-[11px] text-slate-400 mt-0.5">{item.email}</span>
                              <span className="font-mono text-[10px] text-slate-500 mt-1">{item.phone}</span>
                              {item.regType === "double" && item.partnerName && (
                                <div className="mt-2 pt-1.5 border-t border-slate-900/60 flex flex-col">
                                  <span className="font-sans text-xs font-bold text-slate-300 leading-none flex items-center gap-1.5">
                                    Partner: {item.partnerName}
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                                      item.partnerRole === "Photographer" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    }`}>
                                      {item.partnerRole || "Delegate"}
                                    </span>
                                  </span>
                                  <span className="font-mono text-[9px] text-indigo-400 font-bold mt-1">ID: {item.partnerId || "TBD"}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Institution */}
                          <td className="p-4 text-left">
                            <div className="flex flex-col">
                              <span className="font-sans text-xs text-slate-200 leading-normal max-w-[180px] truncate" title={item.institution}>
                                {item.institution}
                              </span>
                              <span className="font-sans text-[10px] text-slate-500 italic mt-0.5">
                                {item.course}
                              </span>
                            </div>
                          </td>

                          {/* Registration Type */}
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold font-mono uppercase border ${
                              item.regType === "individual" 
                                ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" 
                                : item.regType === "double" 
                                ? "bg-purple-500/5 text-purple-400 border-purple-500/10" 
                                : "bg-amber-500/5 text-amber-400 border-amber-500/10"
                            }`}>
                              {item.regType}
                            </span>
                          </td>

                          {/* Pref 1 Committee & Country */}
                          <td className="p-4 text-left">
                            <div className="flex flex-col">
                              <span className="font-sans text-xs text-slate-300 uppercase font-semibold">
                                {item.pref1Committee}
                              </span>
                              <span className="font-mono text-[10px] text-cyan-400/80 mt-0.5 font-bold">
                                {item.pref1Country || "No choice"}
                              </span>
                            </div>
                          </td>

                          {/* Created On */}
                          <td className="p-4 font-sans text-[11px] text-slate-500">
                            {item.timestamp?.split(',')[0] || "N/A"}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedReg(item)}
                                className="p-1.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
                                title="Inspect details"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(item.uid || null)}
                                className="p-1.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                                title="Deport / Delete candidate"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeSubTab === "workshop" && (
          <div className="space-y-12 animate-fade-in text-left">
            {/* Section 1: Portfolio Allocator (Matrix) */}
            <div className="space-y-6">
              <div>
                <h2 className="font-sans text-lg font-bold text-white uppercase tracking-tight">Portfolio Allocator (Matrix)</h2>
                <p className="font-sans text-xs text-slate-400">Set and override portfolio assignments for delegates instantly.</p>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-950/40 border border-slate-900 rounded-3xl p-4">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search portfolios or characters..."
                    value={portfolioSearch}
                    onChange={(e) => setPortfolioSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-cyan-500/50 rounded-full pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">// SET PORTFOLIO ASSIGNMENTS INSTANTLY</div>
              </div>

              {/* Matrix Table */}
              <div className="bg-slate-950/20 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/40 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                        <th className="p-4 pl-6 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-cyan-400" />
                          Portfolio / Nation
                        </th>
                        <th className="p-4">COPUOS</th>
                        <th className="p-4">UNGA DISEC</th>
                        <th className="p-4">AIPPM (India)</th>
                        <th className="p-4">UNSC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 font-sans text-xs">
                      {COUNTRY_MATRIX.filter((row) =>
                        row.country.toLowerCase().includes(portfolioSearch.toLowerCase())
                      ).map((row) => (
                        <tr key={row.country} className="hover:bg-slate-900/10 transition-colors">
                          <td className="p-4 pl-6 font-bold text-white">{row.country}</td>
                          <td className="p-4">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="copuos"
                              currentStatus={getPortfolioStatus(row.country, "copuos", row.copuos)}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-4">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="disec"
                              currentStatus={getPortfolioStatus(row.country, "disec", row.disec)}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-4">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="aippm"
                              currentStatus={getPortfolioStatus(row.country, "aippm", row.aippm)}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-4">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="unsc"
                              currentStatus={getPortfolioStatus(row.country, "unsc", row.unsc)}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Visual Divider line */}
            <div className="border-t border-slate-900 my-10" />

            {/* Section 2: Workshop Candidate Registrations */}
            <div className="space-y-6">
              <div>
                <h2 className="font-sans text-lg font-bold text-white uppercase tracking-tight">Workshop Registrations</h2>
                <p className="font-sans text-xs text-slate-400">List of all candidates registered for the Space Technology & Orbital Diplomacy Workshop.</p>
              </div>

              {/* Workshop Filters & Actions */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-950/40 border border-slate-900 rounded-3xl p-4">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search workshop by name, email, school, pass code..."
                    value={workshopSearch}
                    onChange={(e) => setWorkshopSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-cyan-500/50 rounded-full pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none transition-all placeholder:text-slate-600"
                  />
                </div>

                <button
                  onClick={exportWorkshopToCSV}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 hover:bg-cyan-500 px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Export CSV ({workshopRegistrations.length})
                </button>
              </div>

              {/* Workshop Table */}
              <div className="bg-slate-950/20 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl text-left">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/40 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                        <th className="p-4 pl-6">Pass Key</th>
                        <th className="p-4">Participant</th>
                        <th className="p-4">Email / Phone</th>
                        <th className="p-4">Institution / Dept</th>
                        <th className="p-4">Technical Level</th>
                        <th className="p-4">Motivation</th>
                        <th className="p-4 text-center">Deport</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 font-sans text-xs">
                      {workshopRegistrations.filter((reg) => {
                        const q = workshopSearch.toLowerCase();
                        return (
                          reg.name?.toLowerCase().includes(q) ||
                          reg.email?.toLowerCase().includes(q) ||
                          reg.institution?.toLowerCase().includes(q) ||
                          reg.teacherName?.toLowerCase().includes(q) ||
                          reg.id?.toLowerCase().includes(q)
                        );
                      }).map((reg) => (
                        <tr key={reg.uid} className="hover:bg-slate-900/10 transition-colors">
                          <td className="p-4 pl-6 font-mono text-cyan-400 font-bold">
                            <span className="block">{reg.id}</span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase mt-1 ${
                              reg.regType === "school" 
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              {reg.regType === "school" ? "School" : "Individual"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-white block">{reg.name}</span>
                            {reg.regType === "school" && reg.teacherName && (
                              <span className="text-[11px] text-cyan-400 font-medium block">
                                Teacher: {reg.teacherName} ({reg.teacherDesignation || "In Charge"})
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{reg.timestamp}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-300 block">{reg.email}</span>
                            <span className="text-slate-500 block text-[10px]">{reg.phone}</span>
                            {reg.regType === "school" && reg.teacherEmail && reg.teacherEmail !== reg.email && (
                              <span className="text-slate-400 block text-[10px] font-mono">Tr Email: {reg.teacherEmail}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-slate-300 block font-semibold">{reg.institution}</span>
                            <span className="text-slate-500 block text-[10px]">{reg.course}</span>
                          </td>
                          <td className="p-4">
                            {reg.regType === "school" ? (
                              <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  Est. {reg.estimatedStudents || "10+"}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">{reg.gradeLevels || "All Grades"}</span>
                              </div>
                            ) : (
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                reg.experience === "Advanced" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                reg.experience === "Intermediate" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                                "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                              }`}>
                                {reg.experience}
                              </span>
                            )}
                          </td>
                          <td className="p-4 max-w-xs">
                            <p className="text-slate-400 truncate text-[11px]" title={reg.motivation}>
                              {reg.motivation}
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setConfirmWorkshopDeleteId(reg.uid)}
                              className="p-1.5 rounded-full border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 text-red-400 transition-all cursor-pointer flex items-center justify-center mx-auto"
                              title="Remove Registration"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {workshopRegistrations.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 font-sans text-xs">
                            No workshop payloads logged in this sector yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Modal */}
        {selectedReg && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 relative overflow-hidden shadow-2xl my-8 text-left">
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => setSelectedReg(null)}
                    className="p-1.5 rounded-full border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Modal Header */}
                <div className="text-left border-b border-slate-800 pb-4 mb-6">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-cyan-400 font-bold">// INSPECTOR LOG: {selectedReg.id}</span>
                  <h3 className="font-sans text-xl font-bold text-white mt-1 flex items-center gap-2">
                    {selectedReg.name}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      selectedReg.role === "Photographer" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {selectedReg.role || "Delegate"}
                    </span>
                  </h3>
                  <p className="font-sans text-xs text-slate-400 mt-0.5">{selectedReg.email} • {selectedReg.phone}</p>
                </div>

                {/* Profile details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Academic Institution</span>
                    <p className="font-sans text-sm text-slate-200 font-semibold mt-0.5">{selectedReg.institution}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Course / Class / Dept</span>
                    <p className="font-sans text-sm text-slate-200 font-semibold mt-0.5">{selectedReg.course}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">MUN Experience Level</span>
                    <p className="font-sans text-sm text-slate-200 font-semibold mt-0.5">{selectedReg.munExperience}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Registration Type</span>
                    <p className="font-sans text-sm text-slate-200 font-semibold mt-0.5 uppercase">{selectedReg.regType}</p>
                  </div>

                  {selectedReg.regType === "double" && (
                    <>
                      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
                        <span className="font-mono text-[9px] text-indigo-400 uppercase tracking-wider block font-bold">Partner Details</span>
                        <p className="font-sans text-sm text-slate-200 font-semibold mt-1">{selectedReg.partnerName || "N/A"}</p>
                        <p className="font-sans text-[11px] text-slate-400 mt-0.5">{selectedReg.partnerEmail || "N/A"}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
                        <span className="font-mono text-[9px] text-indigo-400 uppercase tracking-wider block font-bold">Partner Role & ID</span>
                        <p className="font-sans text-sm text-slate-200 font-semibold mt-1">{selectedReg.partnerRole || "Delegate"}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5 font-bold">ID: {selectedReg.partnerId || "TBD"}</p>
                      </div>
                    </>
                  )}

                  {selectedReg.regType === "contingent" && (
                    <div>
                      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Estimated Contingent Size</span>
                      <p className="font-sans text-sm text-slate-200 font-semibold mt-0.5">{selectedReg.contingentSize || "N/A"}</p>
                    </div>
                  )}
                </div>

                {/* Committee Matrix choices */}
                <div className="text-left border-t border-slate-800 pt-4 mt-6">
                  <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block mb-2">Committee Matrix Preferences</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                      <span className="font-mono text-[8px] text-cyan-400 block font-bold">PREFERENCE 1</span>
                      <span className="font-sans text-xs text-white uppercase font-bold block mt-1">{selectedReg.pref1Committee}</span>
                      <span className="font-sans text-[11px] text-slate-400 mt-0.5 block">{selectedReg.pref1Country || "Unassigned"}</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                      <span className="font-mono text-[8px] text-slate-500 block">PREFERENCE 2</span>
                      <span className="font-sans text-xs text-slate-300 uppercase font-bold block mt-1">{selectedReg.pref2Committee || "N/A"}</span>
                      <span className="font-sans text-[11px] text-slate-400 mt-0.5 block">{selectedReg.pref2Country || "Unassigned"}</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                      <span className="font-mono text-[8px] text-slate-500 block">PREFERENCE 3</span>
                      <span className="font-sans text-xs text-slate-300 uppercase font-bold block mt-1">{selectedReg.pref3Committee || "N/A"}</span>
                      <span className="font-sans text-[11px] text-slate-400 mt-0.5 block">{selectedReg.pref3Country || "Unassigned"}</span>
                    </div>
                  </div>
                </div>

                {/* Motivation Statement */}
                <div className="text-left border-t border-slate-800 pt-4 mt-6">
                  <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Statement of Motivation</span>
                  <div className="mt-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-sans text-xs text-slate-300 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                    {selectedReg.motivation || "No statement compiled."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center relative overflow-hidden shadow-2xl my-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-sans text-lg font-bold text-white">Deport Candidate?</h3>
                <p className="mt-2 font-sans text-slate-400 text-xs leading-relaxed">
                  Are you absolutely sure you want to delete this candidate's registration record? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={actionLoading}
                    className="flex-1 rounded-full border border-slate-800 hover:bg-slate-800/50 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const reg = registrations.find(r => r.uid === confirmDeleteId);
                      if (reg) handleDelete(confirmDeleteId, reg.name || "Delegate");
                    }}
                    disabled={actionLoading}
                    className="flex-1 rounded-full bg-red-600 hover:bg-red-500 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Deport"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workshop Delete Confirmation Modal */}
        {confirmWorkshopDeleteId && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center relative overflow-hidden shadow-2xl my-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-sans text-lg font-bold text-white">Deport Workshop Candidate?</h3>
                <p className="mt-2 font-sans text-slate-400 text-xs leading-relaxed">
                  Are you absolutely sure you want to delete this candidate's workshop registration record? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmWorkshopDeleteId(null)}
                    disabled={actionLoading}
                    className="flex-1 rounded-full border border-slate-800 hover:bg-slate-800/50 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const reg = workshopRegistrations.find(r => r.uid === confirmWorkshopDeleteId);
                      if (reg) handleWorkshopDelete(confirmWorkshopDeleteId, reg.name || "Participant");
                    }}
                    disabled={actionLoading}
                    className="flex-1 rounded-full bg-red-600 hover:bg-red-500 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Deport"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
