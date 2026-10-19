/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { db, handleFirestoreError, OperationType, firebaseConfig } from "../firebase";
import { collection, onSnapshot, query, deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { useFirebase } from "../FirebaseContext";
import { COUNTRY_MATRIX } from "../data";
import * as XLSX from "xlsx";
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
  Globe,
  Mail,
  MessageSquare,
  ExternalLink,
  Eye,
  Inbox,
  FileSpreadsheet,
  Image as ImageIcon,
  Award,
  Sparkles,
  Phone,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Database,
  RefreshCw,
  Layers,
  Copy,
  ChevronDown,
  Shirt,
  ArrowRight
} from "lucide-react";

export const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Global Safety Net (Default Deny)
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Helpers
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             'email' in request.auth.token && 
             (request.auth.token.email.lower() == "agnit.dg@gmail.com" || 
              request.auth.token.email.lower() == "iist.mun.club@gmail.com");
    }

    // Match block for connection testing
    match /test/{docId} {
      allow read: if true;
    }

    // --- Master Content Collections (Public read, Admin write) ---

    match /committees/{committeeId} {
      allow get, list: if true;
      allow write: if isAdmin();
    }

    match /secretariat/{memberId} {
      allow get, list: if true;
      allow write: if isAdmin();
    }

    match /faqs/{faqId} {
      allow get, list: if true;
      allow write: if isAdmin();
    }

    match /schedule/{dayId} {
      allow get, list: if true;
      allow write: if isAdmin();
    }

    match /country_matrix/{countryId} {
      allow get, list: if true;
      allow write: if isAdmin();
    }

    match /portfolio_states/{countryName} {
      allow get, list: if true;
      allow write: if isAdmin();
    }

    match /sent_emails/{emailId} {
      allow get, list: if isAdmin();
      allow write: if isAdmin();
    }

    // --- Transactional Intake & Registration Collections ---

    match /contact_queries/{queryId} {
      allow get, list: if isAdmin();
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    match /registrations/{registrationId} {
      allow get: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
      allow list: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if true;
      allow update: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
      allow delete: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
    }

    match /priority_registrations/{registrationId} {
      allow get: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
      allow list: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if true;
      allow update: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
      allow delete: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
    }

    match /unga_registrations/{registrationId} {
      allow get: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
      allow list: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if true;
      allow update: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
      allow delete: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
    }

    match /workshop_registrations/{registrationId} {
      allow get: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
      allow list: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if true;
      allow update: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid && request.resource.data.userId == resource.data.userId);
      allow delete: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
    }

    match /eb_registrations/{applicationId} {
      allow get: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow list: if isAdmin();
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    match /campus_ambassador_registrations/{ambassadorId} {
      allow get: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow list: if isAdmin();
      allow create: if true;
      allow update, delete: if isAdmin();
    }
  }
}
`;

import { 
  fetchCollectionCounts, 
  seedAllConferenceData, 
  seedCommittees, 
  seedSecretariat, 
  seedFAQs, 
  seedSchedule, 
  seedCountryMatrix,
  purgeSampleData,
  syncLocalRegistrationsToFirestore,
  CollectionCounts 
} from "../utils/firestoreSeed";
import { RegistrationDetails, PriorityRegistrationDetails, CountryMatrixRow, PortfolioStatus, CommitteeId, ContactQuery, EBRegistration, CampusAmbassadorRegistration, WorkshopRegistrationDetails } from "../types";


interface PortfolioStatusSelectorProps {
  country: string;
  committee: CommitteeId | string;
  currentStatus: PortfolioStatus;
  onUpdate: (country: string, committee: CommitteeId | string, newStatus: PortfolioStatus) => void;
}

function PortfolioStatusSelector({ country, committee, currentStatus, onUpdate }: PortfolioStatusSelectorProps) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onUpdate(country, committee, e.target.value as any)}
      className={`px-2 py-1 text-[10px] uppercase tracking-wider font-semibold border outline-none cursor-pointer transition-all ${
        currentStatus === "Available"
          ? "bg-[#2E3B2F] text-[#C9A86A] border-[#C9A86A]/40 hover:border-[#C9A86A]"
          : currentStatus === "Assigned"
          ? "bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-950/60"
          : currentStatus === "Reserved"
          ? "bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-950/60"
          : currentStatus === "Pending"
          ? "bg-[#1A1F1A] text-[#8A9A7E] border-[#8A9A7E]/40 hover:border-[#8A9A7E]"
          : "bg-[#1A1F1A] text-[#8A9A7E]/60 border-[#8A9A7E]/20"
      }`}
    >
      <option value="Available" className="bg-[#1A1F1A] text-[#C9A86A]">Available</option>
      <option value="Assigned" className="bg-[#1A1F1A] text-rose-300">Assigned</option>
      <option value="Reserved" className="bg-[#1A1F1A] text-amber-300">Special EB</option>
      <option value="Pending" className="bg-[#1A1F1A] text-[#8A9A7E]">Pending</option>
      <option value="N/A" className="bg-[#1A1F1A] text-[#8A9A7E]/60">N/A</option>
    </select>
  );
}

export const resolveMediaUrl = (url?: string): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }
  if (trimmed.startsWith("uploads/")) {
    return "/" + trimmed;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/uploads/${trimmed}`;
};

export const isPdfDocument = (url?: string, name?: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const lowerName = (name || "").toLowerCase();
  return lowerUrl.endsWith(".pdf") || lowerName.endsWith(".pdf") || lowerUrl.startsWith("data:application/pdf");
};

export const isDriveCloudLink = (url?: string): boolean => {
  if (!url) return false;
  return url.includes("drive.google.com") || url.includes("docs.google.com");
};

interface ProofThumbnailProps {
  url: string;
  name?: string;
  alt?: string;
  borderColor?: string;
  className?: string;
  onView?: () => void;
  onClick?: () => void;
}

export function ProofThumbnail({
  url,
  name,
  alt = "Proof Thumbnail",
  borderColor = "border-[#C9A86A]/40",
  className,
  onView,
  onClick
}: ProofThumbnailProps) {
  const handleClick = onView || onClick || (() => {});
  const resolved = resolveMediaUrl(url);
  const sizeClass = className || "h-10 w-10";

  if (isPdfDocument(resolved, name)) {
    return (
      <div
        onClick={handleClick}
        className={`${className || "h-10 w-12"} bg-rose-950/60 border ${borderColor} rounded flex flex-col items-center justify-center cursor-pointer hover:bg-rose-900/60 transition-all shrink-0 p-1 group shadow-sm`}
        title={`View PDF Document (${name || "PDF Document"})`}
      >
        <FileText className="h-4 w-4 text-rose-300 group-hover:scale-110 transition-transform" />
        <span className="text-[8px] font-mono font-bold text-rose-300 uppercase tracking-wider mt-0.5">PDF</span>
      </div>
    );
  }

  if (isDriveCloudLink(resolved)) {
    return (
      <div
        onClick={handleClick}
        className={`${className || "h-10 w-12"} bg-blue-950/60 border ${borderColor} rounded flex flex-col items-center justify-center cursor-pointer hover:bg-blue-900/60 transition-all shrink-0 p-1 group shadow-sm`}
        title={`Open Google Drive Document (${name || "Drive link"})`}
      >
        <ExternalLink className="h-4 w-4 text-blue-300 group-hover:scale-110 transition-transform" />
        <span className="text-[8px] font-mono font-bold text-blue-300 uppercase tracking-wider mt-0.5">DRIVE</span>
      </div>
    );
  }

  return (
    <div className={`relative group shrink-0 ${sizeClass}`}>
      <img
        src={resolved}
        alt={alt}
        onClick={handleClick}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement("div");
            fallback.className = `w-full h-full bg-[#1A1F1A] border ${borderColor} rounded flex flex-col items-center justify-center cursor-pointer text-[#8A9A7E]`;
            fallback.innerHTML = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span style="font-size:7px;margin-top:2px;">IMG</span>`;
            fallback.onclick = handleClick;
            parent.appendChild(fallback);
          }
        }}
        className={`w-full h-full object-cover border ${borderColor} rounded hover:opacity-80 transition-opacity cursor-pointer shadow-sm`}
      />
      <div
        onClick={handleClick}
        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded cursor-pointer transition-opacity"
      >
        <Eye className="h-3.5 w-3.5 text-white" />
      </div>
    </div>
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
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };
  const [workshopRegistrations, setWorkshopRegistrations] = useState<any[]>([]);
  const [workshopSearch, setWorkshopSearch] = useState("");

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<"registrations" | "priority" | "unga" | "eb" | "campus-ambassador" | "workshop" | "queries" | "database">("priority");
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, Partial<Record<CommitteeId | "copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>>({});

  // Priority Round registrations state
  const [priorityRegistrations, setPriorityRegistrations] = useState<PriorityRegistrationDetails[]>([]);
  const [prioritySearch, setPrioritySearch] = useState("");
  const [priorityCommitteeFilter, setPriorityCommitteeFilter] = useState("all");
  const [priorityStatusFilter, setPriorityStatusFilter] = useState("all");
  const [priorityCategoryFilter, setPriorityCategoryFilter] = useState("all");
  const [priorityMerchFilter, setPriorityMerchFilter] = useState("all");
  const [selectedPriorityReg, setSelectedPriorityReg] = useState<PriorityRegistrationDetails | null>(null);
  const [viewProofModal, setViewProofModal] = useState<{ url: string; name?: string; utr?: string; candidateName?: string } | null>(null);
  const [confirmPriorityDeleteId, setConfirmPriorityDeleteId] = useState<string | null>(null);
  const [isUpdatingPriorityStatus, setIsUpdatingPriorityStatus] = useState(false);
  const [allotModalReg, setAllotModalReg] = useState<PriorityRegistrationDetails | null>(null);
  const [allotForm, setAllotForm] = useState({ committee: "", country: "", adminNotes: "" });
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // UNGA Online Committee registrations state
  const [ungaRegistrations, setUngaRegistrations] = useState<RegistrationDetails[]>([]);
  const [ungaSearch, setUngaSearch] = useState("");
  const [ungaStatusFilter, setUngaStatusFilter] = useState("all");
  const [ungaPaymentStatusFilter, setUngaPaymentStatusFilter] = useState("all");
  const [ungaMerchFilter, setUngaMerchFilter] = useState("all");
  const [selectedUngaReg, setSelectedUngaReg] = useState<RegistrationDetails | null>(null);
  const [confirmUngaDeleteId, setConfirmUngaDeleteId] = useState<string | null>(null);
  const [isUpdatingUngaStatus, setIsUpdatingUngaStatus] = useState(false);
  const [allotUngaModalReg, setAllotUngaModalReg] = useState<RegistrationDetails | null>(null);
  const [allotUngaForm, setAllotUngaForm] = useState({ country: "", adminNotes: "" });

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    showToast(`UTR copied: ${utr}`);
    setTimeout(() => setCopiedUtr(null), 2500);
  };
  
  // Database collection counts & seeding state
  const [collectionCounts, setCollectionCounts] = useState<Partial<CollectionCounts>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_TEXT);
    setCopiedRules(true);
    showToast("firestore.rules copied to clipboard!");
    setTimeout(() => setCopiedRules(false), 3000);
  };


  // EB Registrations state
  const [ebRegistrations, setEbRegistrations] = useState<EBRegistration[]>([]);
  const [ebSearch, setEbSearch] = useState("");
  const [ebCommitteeFilter, setEbCommitteeFilter] = useState("all");
  const [ebStatusFilter, setEbStatusFilter] = useState("all");
  const [selectedEb, setSelectedEb] = useState<EBRegistration | null>(null);
  const [confirmEbDeleteId, setConfirmEbDeleteId] = useState<string | null>(null);
  const [isUpdatingEbStatus, setIsUpdatingEbStatus] = useState(false);

  // Campus Ambassador Registrations state
  const [caRegistrations, setCaRegistrations] = useState<CampusAmbassadorRegistration[]>([]);
  const [caSearch, setCaSearch] = useState("");
  const [caStatusFilter, setCaStatusFilter] = useState("all");
  const [selectedCa, setSelectedCa] = useState<CampusAmbassadorRegistration | null>(null);
  const [confirmCaDeleteId, setConfirmCaDeleteId] = useState<string | null>(null);
  const [isUpdatingCaStatus, setIsUpdatingCaStatus] = useState(false);

  // Contact Queries state
  const [contactQueries, setContactQueries] = useState<ContactQuery[]>([]);
  const [queriesSearch, setQueriesSearch] = useState("");
  const [filterQueryCategory, setFilterQueryCategory] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
  const [confirmQueryDeleteId, setConfirmQueryDeleteId] = useState<string | null>(null);
  const [isDeletingQuery, setIsDeletingQuery] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);


  const adminEmails = ["agnit.dg@gmail.com", "iist.mun.club@gmail.com"];
  const isLocalDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const isAdmin = Boolean(user?.email && adminEmails.includes(user.email.toLowerCase())) || isLocalDev;

  // Function to refresh collection statistics
  const refreshCollectionStats = async () => {
    if (!isAdmin) return;
    setLoadingCounts(true);
    try {
      const counts = await fetchCollectionCounts(db);
      setCollectionCounts(counts);
    } catch (err) {
      console.warn("Error refreshing collection counts:", err);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeSubTab === "database") {
      refreshCollectionStats();
    }
  }, [isAdmin, activeSubTab]);

  const handleSeedAll = async () => {
    if (!isAdmin) return;
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedAllConferenceData(db);
      if (res.success) {
        showToast("All conference tables populated in Firestore!");
        setSeedResult({ 
          success: true, 
          message: "All 5 core conference collections (Committees, Secretariat, FAQs, Schedule, Country Matrix) were successfully written to Firestore." 
        });
        await refreshCollectionStats();
      } else {
        showToast("Error during database seeding.");
        setSeedResult({ 
          success: false, 
          message: res.message || "Encountered errors during seeding." 
        });
      }
    } catch (err: any) {
      console.error("Seeding error:", err);
      showToast("Seeding failed: " + (err?.message || "Unknown error"));
      setSeedResult({ success: false, message: err?.message || "Operation failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSeedIndividual = async (type: "committees" | "secretariat" | "faqs" | "schedule" | "country_matrix") => {
    if (!isAdmin) return;
    setIsSeeding(true);
    try {
      if (type === "committees") await seedCommittees(db);
      else if (type === "secretariat") await seedSecretariat(db);
      else if (type === "faqs") await seedFAQs(db);
      else if (type === "schedule") await seedSchedule(db);
      else if (type === "country_matrix") await seedCountryMatrix(db);
      showToast(`Successfully seeded ${type} table to Firestore!`);
      await refreshCollectionStats();
    } catch (err: any) {
      console.error(`Error seeding ${type}:`, err);
      showToast(`Failed to seed ${type}: ` + (err?.message || "Unknown error"));
    } finally {
      setIsSeeding(false);
    }
  };

  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeSampleData = async () => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to remove all example and test records from the database? Real delegate, inquiry, and application submissions will not be affected.")) {
      return;
    }
    setIsPurging(true);
    setSeedResult(null);
    try {
      const res = await purgeSampleData(db);
      showToast(res.message);
      setSeedResult({ success: true, message: res.message });
      await refreshCollectionStats();
    } catch (err: any) {
      console.error("Purge error:", err);
      showToast("Purge failed: " + (err?.message || "Unknown error"));
      setSeedResult({ success: false, message: err?.message || "Purge failed" });
    } finally {
      setIsPurging(false);
    }
  };

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleSyncLocalToCloud = async () => {
    if (!isAdmin) return;
    setIsSyncingCloud(true);
    setSeedResult(null);
    try {
      const res = await syncLocalRegistrationsToFirestore(db, [...registrations, ...priorityRegistrations, ...ungaRegistrations]);
      showToast(res.message);
      setSeedResult({ success: res.success, message: res.message });
      await refreshCollectionStats();
    } catch (err: any) {
      console.error("Cloud sync error:", err);
      showToast("Cloud sync failed: " + (err?.message || "Unknown error"));
      setSeedResult({ success: false, message: err?.message || "Cloud sync failed" });
    } finally {
      setIsSyncingCloud(false);
    }
  };


  // Listener for contact queries solely from Firestore
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "contact_queries"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ContactQuery[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ContactQuery);
      });

      list.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setContactQueries(list);
    }, (error) => {
      console.warn("Firestore contact_queries subscription status:", error instanceof Error ? error.message : "Access error");
    });

    return () => unsubscribe();
  }, [isAdmin]);

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

  // Helper to accurately compare registration identity without incorrectly collapsing different tickets from same user
  const isSameRegistration = (a: any, b: any): boolean => {
    if (a?.id && b?.id) {
      return a.id === b.id;
    }
    if (a?.id && b?.uid) {
      return a.id === b.uid;
    }
    if (a?.uid && b?.id) {
      return a.uid === b.id;
    }
    return Boolean(a?.uid && b?.uid && a.uid === b.uid);
  };

  // Helper to test if a registration belongs to UNGA (Online Committee)
  const isUngaRecord = (r: any): boolean =>
    Boolean(
      r &&
        (r.isUnga === true ||
          r.round === "online" ||
          r.round === "unga" ||
          r.pref1Committee === "unga" ||
          (typeof r.id === "string" && r.id.startsWith("UNGA")))
    );

  // Helper to test if a registration belongs to Priority Round
  const isPriorityRecord = (r: any): boolean =>
    Boolean(
      r &&
        !isUngaRecord(r) &&
        (r.isPriority === true ||
          r.round === "priority" ||
          (typeof r.id === "string" && r.id.startsWith("PRIO")) ||
          (r.pref1Committee && r.pref1Committee !== "unga"))
    );

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initial immediate sync from local server backup endpoint
    fetch("/api/registrations")
      .then((res) => res.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const backupList = [...res.data];
          setRegistrations((prev) => {
            const merged = [...prev];
            backupList.forEach((item: RegistrationDetails) => {
              if (!merged.some((m) => isSameRegistration(m, item))) {
                merged.push(item);
              }
            });
            merged.sort((a, b) => new Date(b.timestamp || b.paymentDate || 0).getTime() - new Date(a.timestamp || a.paymentDate || 0).getTime());
            return merged;
          });
          setPriorityRegistrations((prev) => {
            const merged = [...prev];
            backupList.filter(isPriorityRecord).forEach((item: any) => {
              if (!merged.some((m) => isSameRegistration(m, item))) {
                merged.push(item as PriorityRegistrationDetails);
              }
            });
            merged.sort((a, b) => new Date(b.timestamp || b.paymentDate || 0).getTime() - new Date(a.timestamp || a.paymentDate || 0).getTime());
            return merged;
          });
          setUngaRegistrations((prev) => {
            const merged = [...prev];
            backupList.filter(isUngaRecord).forEach((item: any) => {
              if (!merged.some((m) => isSameRegistration(m, item))) {
                merged.push(item as RegistrationDetails);
              }
            });
            merged.sort((a, b) => new Date(b.timestamp || b.paymentDate || 0).getTime() - new Date(a.timestamp || a.paymentDate || 0).getTime());
            return merged;
          });
          setLoading(false);
        }
      })
      .catch((e) => console.warn("Local registrations initial sync note:", e));

    const q = query(collection(db, "registrations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: RegistrationDetails[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          id: d.id || docSnap.id,
          ...d
        } as unknown as RegistrationDetails);
      });

      // Merge with server backup records if any
      fetch("/api/registrations")
        .then((res) => res.json())
        .then((res) => {
          if (res.data && Array.isArray(res.data)) {
            res.data.forEach((item: RegistrationDetails) => {
              if (!list.some((m) => isSameRegistration(m, item))) {
                list.push(item);
              }
            });
          }
          list.sort((a, b) => new Date(b.timestamp || b.paymentDate || 0).getTime() - new Date(a.timestamp || a.paymentDate || 0).getTime());
          setRegistrations(list);
          setLoading(false);
        })
        .catch(() => {
          list.sort((a, b) => new Date(b.timestamp || b.paymentDate || 0).getTime() - new Date(a.timestamp || a.paymentDate || 0).getTime());
          setRegistrations(list);
          setLoading(false);
        });
    }, (error) => {
      console.warn("Firestore registrations query warning:", error instanceof Error ? error.message : "Access error");
      fetch("/api/registrations")
        .then((res) => res.json())
        .then((res) => {
          if (res.data && Array.isArray(res.data)) {
            const list = [...res.data];
            list.sort((a, b) => new Date(b.timestamp || b.paymentDate || 0).getTime() - new Date(a.timestamp || a.paymentDate || 0).getTime());
            setRegistrations(list);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    });

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    // Helper to merge priority records
    const mergePriorityRecords = (baseList: PriorityRegistrationDetails[], backupList: any[] = []) => {
      const combined = [...baseList];

      // Merge from registrations state where isPriorityRecord is true
      registrations.forEach((r) => {
        if (isPriorityRecord(r) && !combined.some((p) => isSameRegistration(p, r))) {
          combined.push(r as PriorityRegistrationDetails);
        }
      });

      backupList.forEach((r) => {
        if (isPriorityRecord(r) && !combined.some((p) => isSameRegistration(p, r))) {
          combined.push(r as PriorityRegistrationDetails);
        }
      });

      combined.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.paymentDate || 0).getTime();
        const timeB = new Date(b.timestamp || b.paymentDate || 0).getTime();
        return timeB - timeA;
      });

      return combined;
    };

    const q = query(collection(db, "priority_registrations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PriorityRegistrationDetails[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          id: d.id || docSnap.id,
          ...d
        } as PriorityRegistrationDetails);
      });

      // Fetch from /api/registrations as well to ensure local/server entries are included
      fetch("/api/registrations")
        .then((res) => res.json())
        .then((res) => {
          const backup = (res.data && Array.isArray(res.data)) ? res.data : [];
          setPriorityRegistrations(mergePriorityRecords(list, backup));
        })
        .catch(() => {
          setPriorityRegistrations(mergePriorityRecords(list));
        });
    }, (error) => {
      console.warn("priority_registrations subscription status:", error instanceof Error ? error.message : "Access error");
      // Fallback: merge from registrations state directly and /api/registrations
      fetch("/api/registrations")
        .then((res) => res.json())
        .then((res) => {
          const backup = (res.data && Array.isArray(res.data)) ? res.data : [];
          setPriorityRegistrations(mergePriorityRecords([], backup));
        })
        .catch(() => {
          setPriorityRegistrations(mergePriorityRecords([]));
        });
    });

    return () => unsubscribe();
  }, [isAdmin, registrations]);

  // Sync UNGA Online Registrations from Firestore 'unga_registrations', 'registrations' and '/api/registrations'
  useEffect(() => {
    if (!isAdmin) return;

    const mergeUngaRecords = (baseList: RegistrationDetails[], backupList: any[] = []) => {
      const combined = [...baseList];

      // Merge from registrations where isUngaRecord is true
      registrations.forEach((r) => {
        if (isUngaRecord(r) && !combined.some((u) => isSameRegistration(u, r))) {
          combined.push(r);
        }
      });

      backupList.forEach((r) => {
        if (isUngaRecord(r) && !combined.some((u) => isSameRegistration(u, r))) {
          combined.push(r as RegistrationDetails);
        }
      });

      combined.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.paymentDate || 0).getTime();
        const timeB = new Date(b.timestamp || b.paymentDate || 0).getTime();
        return timeB - timeA;
      });

      return combined;
    };

    const q = query(collection(db, "unga_registrations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: RegistrationDetails[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          id: d.id || docSnap.id,
          ...d
        } as RegistrationDetails);
      });

      // Set immediately with live Firestore list
      setUngaRegistrations(mergeUngaRecords(list));

      fetch("/api/registrations")
        .then((res) => res.json())
        .then((res) => {
          const backup = (res.data && Array.isArray(res.data)) ? res.data : [];
          setUngaRegistrations(mergeUngaRecords(list, backup));
        })
        .catch(() => {
          // Already populated with live list
        });
    }, (error) => {
      console.warn("unga_registrations subscription status:", error instanceof Error ? error.message : "Access error");
      fetch("/api/registrations")
        .then((res) => res.json())
        .then((res) => {
          const backup = (res.data && Array.isArray(res.data)) ? res.data : [];
          setUngaRegistrations(mergeUngaRecords([], backup));
        })
        .catch(() => {
          setUngaRegistrations(mergeUngaRecords([]));
        });
    });

    return () => unsubscribe();
  }, [isAdmin, registrations]);

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

  // Sync EB Registrations solely from Firestore
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "eb_registrations"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: EBRegistration[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as EBRegistration);
      });
      list.sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
      setEbRegistrations(list);
    }, (err) => {
      console.warn("Firestore EB subscription status:", err);
    });

    return () => unsub();
  }, [isAdmin]);

  // Sync Campus Ambassador Registrations solely from Firestore
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "campus_ambassador_registrations"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: CampusAmbassadorRegistration[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CampusAmbassadorRegistration);
      });
      list.sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
      setCaRegistrations(list);
    }, (err) => {
      console.warn("Firestore CA subscription status:", err);
    });

    return () => unsub();
  }, [isAdmin]);

  const handleUpdateEbStatus = async (id: string, newStatus: EBRegistration["status"]) => {
    try {
      setIsUpdatingEbStatus(true);
      await updateDoc(doc(db, "eb_registrations", id), { status: newStatus });
      setEbRegistrations((prev) => prev.map((item) => item.id === id ? { ...item, status: newStatus } : item));
      if (selectedEb?.id === id) {
        setSelectedEb((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating EB status:", err);
      showToast("Failed to update status. Check permissions.");
    } finally {
      setIsUpdatingEbStatus(false);
    }
  };

  const handleDeleteEb = async (id: string) => {
    try {
      await deleteDoc(doc(db, "eb_registrations", id));
      setEbRegistrations((prev) => prev.filter((item) => item.id !== id));
      setConfirmEbDeleteId(null);
      if (selectedEb?.id === id) setSelectedEb(null);
      showToast("EB application removed.");
    } catch (err) {
      console.error("Error deleting EB registration:", err);
      showToast("Failed to remove application. Check permissions.");
    }
  };

  const exportEbToExcel = (itemsToExport?: EBRegistration[], customLabel?: string) => {
    const list = itemsToExport ?? ebRegistrations;
    if (list.length === 0) {
      showToast("No Executive Board applications available to export.");
      return;
    }

    const dataToExport = list.map((r, idx) => ({
      "Sl. No": idx + 1,
      "Dossier ID": r.id || `EB-${idx + 1}`,
      "Full Name": r.name || "N/A",
      "Email Address": r.email || "N/A",
      "Phone Number": r.phone || "N/A",
      "Institution": r.institution || "N/A",
      "Course / Major": r.course || "N/A",
      "Year of Study": r.yearOfStudy || "N/A",
      "City & State": r.cityState || "N/A",
      "Current Status": r.status || "Pending",
      "1st Pref Committee": r.pref1Committee?.toUpperCase() || "N/A",
      "1st Pref Role": r.pref1Role || "N/A",
      "2nd Pref Committee": r.pref2Committee?.toUpperCase() || "N/A",
      "2nd Pref Role": r.pref2Role || "N/A",
      "Delegate MUNs Count": r.munDelegateCount || "0",
      "Executive Board MUNs Count": r.munEbCount || "0",
      "Detailed Experience Summary": r.experienceSummary || "N/A",
      "Proposed Agendas": r.proposedAgendas || "N/A",
      "Motivation Statement": r.motivation || "N/A",
      "Sample Study Guide": r.sampleStudyGuideLink || "N/A",
      "LinkedIn Profile": r.linkedinProfile || "N/A",
      "CV / Resume Document": r.cvUrl
        ? (r.cvUrl.startsWith("http") ? r.cvUrl : (r.cvName ? `Attached (${r.cvName})` : "Attached Document"))
        : "N/A",
      "Portrait Photo": r.photoUrl
        ? (r.photoUrl.startsWith("http") ? r.photoUrl : (r.photoName ? `Attached (${r.photoName})` : "Attached Image"))
        : "N/A",
      "Admin Notes": r.adminNotes || "",
      "Submission Timestamp": r.timestamp || "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Auto-fit / configure generous column widths for Microsoft Excel / Google Sheets
    worksheet["!cols"] = [
      { wch: 8 },  // Sl. No
      { wch: 18 }, // Dossier ID
      { wch: 24 }, // Full Name
      { wch: 28 }, // Email Address
      { wch: 16 }, // Phone Number
      { wch: 32 }, // Institution
      { wch: 20 }, // Course / Major
      { wch: 14 }, // Year of Study
      { wch: 20 }, // City & State
      { wch: 20 }, // Current Status
      { wch: 20 }, // 1st Pref Committee
      { wch: 20 }, // 1st Pref Role
      { wch: 20 }, // 2nd Pref Committee
      { wch: 20 }, // 2nd Pref Role
      { wch: 18 }, // Delegate MUNs Count
      { wch: 24 }, // Executive Board MUNs Count
      { wch: 45 }, // Experience Summary
      { wch: 45 }, // Proposed Agendas
      { wch: 45 }, // Motivation Statement
      { wch: 30 }, // Sample Study Guide
      { wch: 30 }, // LinkedIn Profile
      { wch: 35 }, // CV Document
      { wch: 35 }, // Portrait Photo
      { wch: 25 }, // Admin Notes
      { wch: 22 }  // Submission Timestamp
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EB Applications");
    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix = customLabel ? `_${customLabel.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "";
    XLSX.writeFile(workbook, `IISTMUN_2026_EB_Applications${suffix}_${dateStr}.xlsx`);
    showToast(`Exported ${list.length} Executive Board application(s) to Excel!`);
  };

  const handleUpdateCaStatus = async (id: string, newStatus: CampusAmbassadorRegistration["status"]) => {
    try {
      setIsUpdatingCaStatus(true);
      await updateDoc(doc(db, "campus_ambassador_registrations", id), { status: newStatus });
      setCaRegistrations((prev) => prev.map((item) => item.id === id ? { ...item, status: newStatus } : item));
      if (selectedCa?.id === id) {
        setSelectedCa((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating CA status:", err);
      showToast("Failed to update status. Check permissions.");
    } finally {
      setIsUpdatingCaStatus(false);
    }
  };

  const handleDeleteCa = async (id: string) => {
    try {
      await deleteDoc(doc(db, "campus_ambassador_registrations", id));
      setCaRegistrations((prev) => prev.filter((item) => item.id !== id));
      setConfirmCaDeleteId(null);
      if (selectedCa?.id === id) setSelectedCa(null);
      showToast("Campus Ambassador registration removed.");
    } catch (err) {
      console.error("Error deleting CA registration:", err);
      showToast("Failed to remove registration. Check permissions.");
    }
  };

  const exportCaToExcel = (itemsToExport?: CampusAmbassadorRegistration[], customLabel?: string) => {
    const list = itemsToExport ?? caRegistrations;
    if (list.length === 0) {
      showToast("No Campus Ambassador registrations available to export.");
      return;
    }

    const dataToExport = list.map((r, idx) => ({
      "Sl. No": idx + 1,
      "Fellowship ID": r.id || `CA-${idx + 1}`,
      "Ambassador Name": r.name || "N/A",
      "Email Address": r.email || "N/A",
      "WhatsApp Phone": r.phone || "N/A",
      "Institution": r.institution || "N/A",
      "Course / Degree": r.course || "N/A",
      "Year of Study": r.yearOfStudy || "N/A",
      "City & State": r.cityState || "N/A",
      "Current Status": r.status || "Pending",
      "Target Mobilization": r.targetMobilization || "N/A",
      "College Clubs & Positions": r.collegeClubs || "N/A",
      "Social Media Handles": r.socialHandles || "N/A",
      "Prior Ambassador Experience": r.priorCaExperience || "N/A",
      "Motivation Statement": r.motivation || "N/A",
      "Campus Outreach Plan": r.promotionPlan || "N/A",
      "ID Proof Document": r.idProofUrl
        ? (r.idProofUrl.startsWith("http") ? r.idProofUrl : (r.idProofName ? `Attached (${r.idProofName})` : "Attached ID Proof"))
        : "N/A",
      "Portrait Photo": r.photoUrl
        ? (r.photoUrl.startsWith("http") ? r.photoUrl : (r.photoName ? `Attached (${r.photoName})` : "Attached Image"))
        : "N/A",
      "Admin Notes": r.adminNotes || "",
      "Submission Timestamp": r.timestamp || "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    worksheet["!cols"] = [
      { wch: 8 },  // Sl. No
      { wch: 18 }, // Fellowship ID
      { wch: 24 }, // Ambassador Name
      { wch: 28 }, // Email Address
      { wch: 16 }, // WhatsApp Phone
      { wch: 32 }, // Institution
      { wch: 20 }, // Course / Degree
      { wch: 14 }, // Year of Study
      { wch: 20 }, // City & State
      { wch: 18 }, // Current Status
      { wch: 22 }, // Target Mobilization
      { wch: 35 }, // College Clubs
      { wch: 30 }, // Social Handles
      { wch: 35 }, // Prior Experience
      { wch: 45 }, // Motivation
      { wch: 45 }, // Outreach Plan
      { wch: 35 }, // ID Proof
      { wch: 35 }, // Portrait Photo
      { wch: 25 }, // Admin Notes
      { wch: 22 }  // Submission Timestamp
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Campus Ambassadors");
    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix = customLabel ? `_${customLabel.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "";
    XLSX.writeFile(workbook, `IISTMUN_2026_Campus_Ambassadors${suffix}_${dateStr}.xlsx`);
    showToast(`Exported ${list.length} Campus Ambassador registration(s) to Excel!`);
  };

  // General Delegate Registrations (strictly exclude priority and UNGA online registrations)
  const generalRegistrations = registrations.filter(r => !r.isPriority && r.round !== "priority" && !isUngaRecord(r));

  const exportDelegatesToExcel = (itemsToExport?: RegistrationDetails[]) => {
    const list = itemsToExport ?? generalRegistrations;
    if (list.length === 0) {
      showToast("No delegate registrations available to export.");
      return;
    }

    const dataToExport = list.map((r, idx) => ({
      "Sl. No": idx + 1,
      "Ticket ID": r.id || "",
      "Delegate Name": r.name || "",
      "Email Address": r.email || "",
      "Phone Number": r.phone || "",
      "Registration Type": r.regType ? r.regType.toUpperCase() : "INDIVIDUAL",
      "Role": r.role || "Delegate",
      "Institution": r.institution || "",
      "Course / Class": r.course || "",
      "MUN Experience": r.munExperience || "",
      "Pref 1 Committee": r.pref1Committee?.toUpperCase() || "",
      "Pref 1 Country": r.pref1Country || "",
      "Pref 2 Committee": r.pref2Committee?.toUpperCase() || "",
      "Pref 2 Country": r.pref2Country || "",
      "Pref 3 Committee": r.pref3Committee?.toUpperCase() || "",
      "Pref 3 Country": r.pref3Country || "",
      "Partner Name": r.partnerName || "",
      "Partner Email": r.partnerEmail || "",
      "Partner Role": r.partnerRole || "",
      "Partner ID": r.partnerId || "",
      "Contingent Size": r.contingentSize || "",
      "Motivation": r.motivation || "",
      "Registration Timestamp": r.timestamp || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet["!cols"] = [
      { wch: 8 },  // Sl. No
      { wch: 16 }, // Ticket ID
      { wch: 24 }, // Delegate Name
      { wch: 28 }, // Email Address
      { wch: 16 }, // Phone Number
      { wch: 18 }, // Reg Type
      { wch: 14 }, // Role
      { wch: 30 }, // Institution
      { wch: 18 }, // Course
      { wch: 16 }, // Experience
      { wch: 18 }, // Pref 1 Comm
      { wch: 20 }, // Pref 1 Country
      { wch: 18 }, // Pref 2 Comm
      { wch: 20 }, // Pref 2 Country
      { wch: 18 }, // Pref 3 Comm
      { wch: 20 }, // Pref 3 Country
      { wch: 22 }, // Partner Name
      { wch: 26 }, // Partner Email
      { wch: 14 }, // Partner Role
      { wch: 16 }, // Partner ID
      { wch: 16 }, // Contingent Size
      { wch: 40 }, // Motivation
      { wch: 22 }  // Timestamp
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Delegate Registrations");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `IISTMUN_2026_Delegates_${dateStr}.xlsx`);
    showToast(`Exported ${list.length} delegate registration(s) to Excel!`);
  };

  const exportPriorityToExcel = (itemsToExport?: PriorityRegistrationDetails[], customLabel?: string) => {
    const list = itemsToExport ?? priorityRegistrations;
    if (list.length === 0) {
      showToast("No priority delegate registrations available to export.");
      return;
    }

    const dataToExport = list.map((r, idx) => ({
      "Sl. No": idx + 1,
      "Ticket ID": r.id || r.uid || "",
      "Candidate Name": r.name || "",
      "Email Address": r.email || "",
      "Phone / WhatsApp": r.phone || "",
      "Aadhaar Number": r.aadharNumber || "",
      "Gender": r.gender || "",
      "Date of Birth": r.dob || "",
      "City & State": r.cityState || "",
      "Category": r.delegateCategory || (r.regType ? r.regType.toUpperCase() : "College Non-IIST"),
      "Institution": r.institution || "",
      "Course / Degree": r.course || "",
      "Year / Grade": r.yearOfStudy || r.classGrade || "",
      "Roll / Student No": r.rollNumber || "",
      "Delegation Mode": r.delegationMode === "part_of_delegation" || r.regType === "contingent" ? "PART OF DELEGATION" : r.regType === "double" ? "DOUBLE DELEGATION" : "INDIVIDUAL",
      "Private Delegation": r.isPrivateDelegation ? "YES" : "NO",
      "Council Role": r.role || "Delegate",
      "Partner Name": r.partnerName || "",
      "Partner Email": r.partnerEmail || "",
      "Partner Phone": r.partnerPhone || "",
      "Partner Role": r.partnerRole || "",
      "Partner Ticket ID": r.partnerId || "",
      "MUN Experience": r.munExperience || "",
      "Past MUN Accolades": r.pastMunDetails || "",
      "Allotment Priority": r.priorityPreference ? (r.priorityPreference === "committee" ? "COMMITTEE FIRST" : "PORTFOLIO FIRST") : "N/A",
      "Pref 1 Committee": (r.pref1Committee || "").toUpperCase(),
      "Pref 1 Country/Portfolios": (r.pref1Portfolios && r.pref1Portfolios.length > 0) ? r.pref1Portfolios.join("; ") : (r.pref1Country || ""),
      "Pref 2 Committee": (r.pref2Committee || "").toUpperCase(),
      "Pref 2 Country/Portfolios": (r.pref2Portfolios && r.pref2Portfolios.length > 0) ? r.pref2Portfolios.join("; ") : (r.pref2Country || ""),
      "Pref 3 Committee": (r.pref3Committee || "").toUpperCase(),
      "Pref 3 Country/Portfolios": (r.pref3Portfolios && r.pref3Portfolios.length > 0) ? r.pref3Portfolios.join("; ") : (r.pref3Country || ""),
      "Emergency Contact Name": r.emergencyContactName || "",
      "Emergency Contact Relation": r.emergencyContactRelation || "",
      "Emergency Contact Phone": r.emergencyContactPhone || "",
      "Fee Amount (INR)": r.feeAmount !== undefined ? r.feeAmount : 1299,
      "Merchandise Purchased": r.hasMerch ? "YES" : "NO",
      "Merch Size": r.hasMerch ? (r.merchSize || "N/A") : "N/A",
      "Merch Amount (INR)": r.hasMerch ? (r.merchAmount || 599) : 0,
      "Payment Mode": r.paymentMode || "UPI",
      "UTR / Transaction ID": r.utrNumber || r.transactionId || "",
      "Payer Name": r.payerName || "",
      "Payment Status": r.paymentStatus || "Pending",
      "Overall Status": r.status || "Pending Verification",
      "Allotted Committee": (r.allottedCommittee || "").toUpperCase(),
      "Allotted Country": r.allottedCountry || "",
      "Admin Notes": r.adminNotes || "",
      "Motivation Statement": r.motivation || "",
      "Has Payment Proof": r.paymentScreenshotUrl ? "YES" : "NO",
      "Submission Timestamp": r.timestamp || r.paymentDate || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet["!cols"] = [
      { wch: 8 },  // Sl. No
      { wch: 18 }, // Ticket ID
      { wch: 24 }, // Candidate Name
      { wch: 28 }, // Email
      { wch: 16 }, // Phone
      { wch: 12 }, // Gender
      { wch: 14 }, // DOB
      { wch: 22 }, // City State
      { wch: 20 }, // Category
      { wch: 32 }, // Institution
      { wch: 20 }, // Course
      { wch: 14 }, // Year
      { wch: 16 }, // Roll
      { wch: 18 }, // Mode
      { wch: 16 }, // Role
      { wch: 22 }, // Partner Name
      { wch: 26 }, // Partner Email
      { wch: 16 }, // Partner Phone
      { wch: 14 }, // Partner Role
      { wch: 18 }, // Partner ID
      { wch: 16 }, // MUN Exp
      { wch: 35 }, // Past Details
      { wch: 18 }, // Pref 1 Comm
      { wch: 22 }, // Pref 1 Country
      { wch: 18 }, // Pref 2 Comm
      { wch: 22 }, // Pref 2 Country
      { wch: 18 }, // Pref 3 Comm
      { wch: 22 }, // Pref 3 Country
      { wch: 22 }, // Emergency Name
      { wch: 16 }, // Emergency Rel
      { wch: 18 }, // Emergency Phone
      { wch: 14 }, // Fee
      { wch: 20 }, // Merchandise Purchased
      { wch: 12 }, // Merch Size
      { wch: 18 }, // Merch Amount (INR)
      { wch: 12 }, // Mode
      { wch: 20 }, // UTR
      { wch: 22 }, // Payer Name
      { wch: 16 }, // Payment Status
      { wch: 22 }, // Status
      { wch: 18 }, // Allotted Comm
      { wch: 22 }, // Allotted Country
      { wch: 30 }, // Admin Notes
      { wch: 45 }, // Motivation
      { wch: 14 }, // Proof
      { wch: 24 }  // Timestamp
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Priority Delegates");
    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix = customLabel ? `_${customLabel.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "";
    XLSX.writeFile(workbook, `IISTMUN_2026_Priority_Delegates${suffix}_${dateStr}.xlsx`);
    showToast(`Exported ${list.length} Priority Round registration(s) to Excel!`);
  };

  // Export UNGA Online Delegate Registrations with each and every filled field
  const exportUngaToExcel = (itemsToExport?: RegistrationDetails[], customLabel?: string) => {
    const list = itemsToExport ?? ungaRegistrations;
    if (list.length === 0) {
      showToast("No online delegate registrations available to export.");
      return;
    }

    const dataToExport = list.map((r, idx) => ({
      "Sl. No": idx + 1,
      "Ticket ID": r.id || r.uid || "",
      "Candidate Legal Name": r.name || "",
      "Email Address": r.email || "",
      "Phone / WhatsApp": r.phone || "",
      "Aadhaar Number": r.aadharNumber || "",
      "Gender": r.gender || "",
      "Date of Birth": r.dob || "",
      "City & State / Country": r.cityState || "",
      "Full Residential / Postal Address": r.fullAddress || "",
      "Emergency Contact Name": r.emergencyContactName || "",
      "Emergency Contact Relation": r.emergencyContactRelation || "",
      "Emergency Contact Phone": r.emergencyContactPhone || "",
      "Institution": r.institution || "",
      "Course / Degree": r.course || "",
      "Year of Study / Grade": r.yearOfStudy || r.classGrade || "",
      "Roll / Student No": r.rollNumber || "",
      "Delegation Mode": "INDIVIDUAL",
      "Accredited Role": r.role || "Delegate",
      "Committee Chamber": "UNGA (Online)",
      "Choice 01 (Top Country)": (r.pref1Portfolios && r.pref1Portfolios[0]) || r.pref1Country || "",
      "Choice 02": (r.pref1Portfolios && r.pref1Portfolios[1]) || "",
      "Choice 03": (r.pref1Portfolios && r.pref1Portfolios[2]) || "",
      "Choice 04": (r.pref1Portfolios && r.pref1Portfolios[3]) || "",
      "Choice 05": (r.pref1Portfolios && r.pref1Portfolios[4]) || "",
      "All 5 Country Choices": (r.pref1Portfolios && r.pref1Portfolios.length > 0) ? r.pref1Portfolios.filter(Boolean).join("; ") : (r.pref1Country || ""),
      "MUN Experience Level": r.munExperience || "None",
      "Past MUN Accolades": r.pastMunDetails || "",
      "Statement of Motivation": r.motivation || "",
      "Total Fee Amount (INR)": r.feeAmount !== undefined ? r.feeAmount : (r.hasMerch ? 1498 : 899),
      "Base Fee (INR)": 899,
      "Merchandise Purchased": r.hasMerch ? "YES" : "NO",
      "Merchandise Size": r.hasMerch ? (r.merchSize || "M") : "N/A",
      "Merchandise Extra (INR)": r.hasMerch ? (r.merchAmount || 599) : 0,
      "Payment Mode": r.paymentMode || "UPI",
      "UTR / Transaction ID": r.utrNumber || r.transactionId || "",
      "Payer Name": r.payerName || "",
      "Payment Date": r.paymentDate || "",
      "Payment Status": r.paymentStatus || "Pending",
      "Overall Status": r.status || "Pending Verification",
      "Allotted Country": r.allottedCountry || "",
      "Allotted Committee": "UNGA",
      "Admin Notes": r.adminNotes || "",
      "Has Payment Proof": r.paymentScreenshotUrl ? "YES" : "NO",
      "Has Student ID Proof": r.idCardUrl ? "YES" : "NO",
      "Submission Timestamp": r.timestamp || r.paymentDate || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet["!cols"] = [
      { wch: 8 },  // Sl. No
      { wch: 18 }, // Ticket ID
      { wch: 24 }, // Candidate Legal Name
      { wch: 28 }, // Email Address
      { wch: 16 }, // Phone
      { wch: 16 }, // Aadhaar
      { wch: 12 }, // Gender
      { wch: 14 }, // DOB
      { wch: 22 }, // City State
      { wch: 45 }, // Full Address
      { wch: 22 }, // Emergency Name
      { wch: 16 }, // Emergency Rel
      { wch: 16 }, // Emergency Phone
      { wch: 32 }, // Institution
      { wch: 20 }, // Course
      { wch: 14 }, // Year
      { wch: 16 }, // Roll
      { wch: 14 }, // Mode
      { wch: 14 }, // Role
      { wch: 18 }, // Committee Chamber
      { wch: 22 }, // Choice 1
      { wch: 20 }, // Choice 2
      { wch: 20 }, // Choice 3
      { wch: 20 }, // Choice 4
      { wch: 20 }, // Choice 5
      { wch: 45 }, // All Choices
      { wch: 16 }, // MUN Exp
      { wch: 30 }, // Past Details
      { wch: 45 }, // Motivation
      { wch: 16 }, // Total Fee
      { wch: 14 }, // Base Fee
      { wch: 18 }, // Merch Purchased
      { wch: 14 }, // Merch Size
      { wch: 16 }, // Merch Amount
      { wch: 14 }, // Payment Mode
      { wch: 22 }, // UTR
      { wch: 22 }, // Payer Name
      { wch: 14 }, // Payment Date
      { wch: 16 }, // Payment Status
      { wch: 22 }, // Overall Status
      { wch: 20 }, // Allotted Country
      { wch: 18 }, // Allotted Committee
      { wch: 25 }, // Admin Notes
      { wch: 16 }, // Has Proof
      { wch: 16 }, // Has ID
      { wch: 24 }  // Timestamp
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UNGA Online Delegates");
    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix = customLabel ? `_${customLabel.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "";
    XLSX.writeFile(workbook, `IISTMUN_2026_UNGA_Online_Delegates${suffix}_${dateStr}.xlsx`);
    showToast(`Exported ${list.length} UNGA online delegate(s) to Excel!`);
  };

  const handleUpdatePriorityStatus = async (
    id: string,
    newStatus: string,
    newPaymentStatus?: "Pending" | "Verified" | "Rejected"
  ) => {
    setIsUpdatingPriorityStatus(true);
    try {
      const updates: any = { status: newStatus };
      if (newPaymentStatus) {
        updates.paymentStatus = newPaymentStatus;
      }
      await updateDoc(doc(db, "priority_registrations", id), updates).catch(() => {});
      await updateDoc(doc(db, "registrations", id), updates).catch(() => {});

      showToast(`Updated status to ${newStatus}`);
      if (selectedPriorityReg && (selectedPriorityReg.id === id || selectedPriorityReg.uid === id)) {
        setSelectedPriorityReg((prev) => (prev ? { ...prev, ...updates } : null));
      }
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Failed to update status. Check permissions.");
    } finally {
      setIsUpdatingPriorityStatus(false);
    }
  };

  const handleSaveAllotment = async () => {
    if (!allotModalReg) return;
    const id = allotModalReg.uid || allotModalReg.id || "";
    if (!id) return;
    try {
      const updates: any = {
        allottedCommittee: allotForm.committee,
        allottedCountry: allotForm.country,
        adminNotes: allotForm.adminNotes,
        status: "Portfolio Allotted"
      };
      await updateDoc(doc(db, "priority_registrations", id), updates).catch(() => {});
      await updateDoc(doc(db, "registrations", id), updates).catch(() => {});
      showToast(`Allotted ${allotForm.country || "Portfolio"} in ${allotForm.committee.toUpperCase()} to ${allotModalReg.name}!`);
      if (selectedPriorityReg && (selectedPriorityReg.id === id || selectedPriorityReg.uid === id)) {
        setSelectedPriorityReg((prev) => (prev ? { ...prev, ...updates } : null));
      }
      setAllotModalReg(null);
    } catch (err) {
      console.error("Allotment update error:", err);
      showToast("Error updating portfolio allotment.");
    }
  };

  const handlePriorityDelete = async (id: string, name: string) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "priority_registrations", id)).catch(() => {});
      await deleteDoc(doc(db, "registrations", id)).catch(() => {});
      fetch(`/api/registrations/${id}`, { method: "DELETE" }).catch(() => {});
      setPriorityRegistrations((prev) => prev.filter((p) => p.id !== id && p.uid !== id));
      setRegistrations((prev) => prev.filter((r) => r.id !== id && r.uid !== id));
      showToast(`Deleted priority registration for ${name}.`);
      setConfirmPriorityDeleteId(null);
      if (selectedPriorityReg?.id === id || selectedPriorityReg?.uid === id) {
        setSelectedPriorityReg(null);
      }
    } catch (err) {
      console.error("Failed to delete priority registration:", err);
      showToast("Error deleting registration.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUngaStatus = async (
    id: string,
    newStatus: string,
    newPaymentStatus?: "Pending" | "Verified" | "Rejected"
  ) => {
    setIsUpdatingUngaStatus(true);
    try {
      const updates: any = { status: newStatus };
      if (newPaymentStatus) {
        updates.paymentStatus = newPaymentStatus;
      }

      const regItem = ungaRegistrations.find((r) => r.id === id || r.uid === id);
      const targetIds = new Set<string>([id]);
      if (regItem?.uid) targetIds.add(regItem.uid);
      if (regItem?.id) targetIds.add(regItem.id);
      if (regItem?.uid) targetIds.add(`${regItem.uid}_unga`);
      if (id && !id.endsWith("_unga")) targetIds.add(`${id}_unga`);

      await Promise.allSettled([
        ...Array.from(targetIds).map((targetId) => updateDoc(doc(db, "unga_registrations", targetId), updates)),
        ...Array.from(targetIds).map((targetId) => updateDoc(doc(db, "registrations", targetId), updates))
      ]);

      showToast(`Updated UNGA status to ${newStatus}`);
      if (selectedUngaReg && (selectedUngaReg.id === id || selectedUngaReg.uid === id)) {
        setSelectedUngaReg((prev) => (prev ? { ...prev, ...updates } : null));
      }
      if (selectedReg && (selectedReg.id === id || selectedReg.uid === id)) {
        setSelectedReg((prev) => (prev ? { ...prev, ...updates } : null));
      }
      setUngaRegistrations((prev) =>
        prev.map((r) => ((r.id === id || r.uid === id) ? { ...r, ...updates } : r))
      );
    } catch (err) {
      console.error("UNGA status update error:", err);
      showToast("Failed to update status. Check permissions.");
    } finally {
      setIsUpdatingUngaStatus(false);
    }
  };

  const handleSaveUngaAllotment = async () => {
    if (!allotUngaModalReg) return;
    const id = allotUngaModalReg.uid || allotUngaModalReg.id || "";
    if (!id) return;
    try {
      const updates: any = {
        allottedCommittee: "unga",
        allottedCountry: allotUngaForm.country,
        adminNotes: allotUngaForm.adminNotes,
        status: "Portfolio Allotted"
      };

      const regItem = allotUngaModalReg;
      const targetIds = new Set<string>();
      if (id) targetIds.add(id);
      if (regItem?.uid) targetIds.add(regItem.uid);
      if (regItem?.id) targetIds.add(regItem.id);
      if (regItem?.uid) targetIds.add(`${regItem.uid}_unga`);
      if (id && !id.endsWith("_unga")) targetIds.add(`${id}_unga`);

      await Promise.allSettled([
        ...Array.from(targetIds).map((targetId) => updateDoc(doc(db, "unga_registrations", targetId), updates)),
        ...Array.from(targetIds).map((targetId) => updateDoc(doc(db, "registrations", targetId), updates))
      ]);

      showToast(`Allotted ${allotUngaForm.country || "Portfolio"} in UNGA to ${allotUngaModalReg.name}!`);
      if (selectedUngaReg && (selectedUngaReg.id === id || selectedUngaReg.uid === id)) {
        setSelectedUngaReg((prev) => (prev ? { ...prev, ...updates } : null));
      }
      if (selectedReg && (selectedReg.id === id || selectedReg.uid === id)) {
        setSelectedReg((prev) => (prev ? { ...prev, ...updates } : null));
      }
      setUngaRegistrations((prev) =>
        prev.map((r) => ((r.id === id || r.uid === id) ? { ...r, ...updates } : r))
      );
      setAllotUngaModalReg(null);
    } catch (err) {
      console.error("UNGA allotment update error:", err);
      showToast("Error updating portfolio allotment.");
    }
  };

  const handleUngaDelete = async (id: string, name: string) => {
    setActionLoading(true);
    try {
      const regItem = ungaRegistrations.find((p) => p.id === id || p.uid === id);
      const targetIds = new Set<string>([id]);
      if (regItem?.uid) targetIds.add(regItem.uid);
      if (regItem?.id) targetIds.add(regItem.id);
      if (regItem?.uid) targetIds.add(`${regItem.uid}_unga`);
      if (id && !id.endsWith("_unga")) targetIds.add(`${id}_unga`);

      await Promise.allSettled([
        ...Array.from(targetIds).map((targetId) => deleteDoc(doc(db, "unga_registrations", targetId))),
        ...Array.from(targetIds).map((targetId) => deleteDoc(doc(db, "registrations", targetId)))
      ]);
      targetIds.forEach((targetId) => {
        fetch(`/api/registrations/${targetId}`, { method: "DELETE" }).catch(() => {});
      });

      setUngaRegistrations((prev) => prev.filter((p) => p.id !== id && p.uid !== id));
      setRegistrations((prev) => prev.filter((r) => r.id !== id && r.uid !== id));
      showToast(`Deleted UNGA registration for ${name}.`);
      setConfirmUngaDeleteId(null);
      if (selectedUngaReg?.id === id || selectedUngaReg?.uid === id) {
        setSelectedUngaReg(null);
      }
      if (selectedReg?.id === id || selectedReg?.uid === id) {
        setSelectedReg(null);
      }
    } catch (err) {
      console.error("Failed to delete UNGA registration:", err);
      showToast("Error deleting registration.");
    } finally {
      setActionLoading(false);
    }
  };

  const updatePortfolioStatus = async (
    country: string,
    committee: CommitteeId | string,
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
    committee: CommitteeId | string,
    defaultStatus: PortfolioStatus
  ) => {
    let status = portfolioOverrides[countryName]?.[committee as CommitteeId] ?? defaultStatus;
    if ((!status || status === "N/A" || status === "Reserved") && (committee === "ip_journalism" || committee === "ip_photojournalism")) {
      const legacyIp = portfolioOverrides[countryName]?.ip;
      if (legacyIp) status = legacyIp;
    }
    return status || "N/A";
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

  // Export functions (General Delegates)
  const exportToCSV = () => {
    if (generalRegistrations.length === 0) return;
    
    const headers = [
      "Ticket ID", "Name", "Email", "Phone", "Registration Type", 
      "Role", "Institution", "Course/Class", "MUN Experience", 
      "Pref 1 Committee", "Pref 1 Country",
      "Pref 2 Committee", "Pref 2 Country",
      "Pref 3 Committee", "Pref 3 Country",
      "Partner Name", "Partner Email", "Partner Role", "Partner ID", "Contingent Size", "Timestamp"
    ];

    const rows = generalRegistrations.map(r => [
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
    if (generalRegistrations.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generalRegistrations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `IIST_MUN_2026_Delegates_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("JSON Download started successfully!");
  };

  // Contact queries filtering
  const filteredQueries = contactQueries.filter((q) => {
    const queryText = queriesSearch.toLowerCase();
    const matchSearch =
      (q.name?.toLowerCase() || "").includes(queryText) ||
      (q.email?.toLowerCase() || "").includes(queryText) ||
      (q.category?.toLowerCase() || "").includes(queryText) ||
      (q.message?.toLowerCase() || "").includes(queryText) ||
      (q.id?.toLowerCase() || "").includes(queryText);
    const matchCategory = filterQueryCategory === "all" || q.category === filterQueryCategory;
    return matchSearch && matchCategory;
  });

  const exportQueriesToExcel = () => {
    if (contactQueries.length === 0) {
      showToast("No contact queries available to export.");
      return;
    }

    if (filteredQueries.length === 0) {
      showToast("No queries match your filter criteria to export.");
      return;
    }

    const exportRows = filteredQueries.map((q, idx) => ({
      "Sl. No": idx + 1,
      "Query Reference ID": q.id || "",
      "Date & Time": q.timestamp || "",
      "Sender Name": q.name || "",
      "Sender Email": q.email || "",
      "Inquiry Category": q.category || "",
      "Status": q.status || "Pending",
      "Message / Inquiry Dispatch": q.message || "",
      "Destination": q.destination || "support@iistmun.org"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto-fit column widths
    worksheet["!cols"] = [
      { wch: 8 },   // Sl. No
      { wch: 28 },  // Query Reference ID
      { wch: 22 },  // Date & Time
      { wch: 26 },  // Sender Name
      { wch: 32 },  // Sender Email
      { wch: 28 },  // Inquiry Category
      { wch: 12 },  // Status
      { wch: 65 },  // Message / Inquiry Dispatch
      { wch: 24 },  // Destination
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contact Queries");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `IIST_MUN_2027_Contact_Queries_${dateStr}.xlsx`);
    showToast(`Excel workbook downloaded (${filteredQueries.length} dispatches)!`);
  };

  const exportQueriesToCSV = () => {
    if (contactQueries.length === 0) {
      showToast("No contact queries available to export.");
      return;
    }

    if (filteredQueries.length === 0) {
      showToast("No queries match your filter criteria to export.");
      return;
    }

    const headers = [
      "Sl No", "Reference ID", "Date & Time", "Sender Name", 
      "Sender Email", "Inquiry Category", "Status", "Message", "Destination"
    ];

    const rows = filteredQueries.map((q, idx) => [
      String(idx + 1),
      q.id || "",
      q.timestamp || "",
      q.name || "",
      q.email || "",
      q.category || "",
      q.status || "Pending",
      q.message || "",
      q.destination || "support@iistmun.org"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IIST_MUN_2027_Contact_Queries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("CSV Download started!");
  };

  const handleDeleteQuery = async (id: string) => {
    try {
      setIsDeletingQuery(true);
      await deleteDoc(doc(db, "contact_queries", id));
      setContactQueries((prev) => prev.filter((q) => q.id !== id));
      setConfirmQueryDeleteId(null);
      if (selectedQuery?.id === id) {
        setSelectedQuery(null);
      }
      showToast("Query dispatch successfully purged.");
    } catch (err) {
      console.error("Error deleting contact query:", err);
      showToast("Failed to delete query. Check permissions.");
    } finally {
      setIsDeletingQuery(false);
    }
  };

  // Priority Round registrations list (sources from UNGA when UNGA filter is selected)
  const prioritySourceList = priorityCommitteeFilter === "unga"
    ? (ungaRegistrations as unknown as PriorityRegistrationDetails[])
    : priorityRegistrations;

  // Filter Priority Round registrations
  const filteredPriority = prioritySourceList.filter((r) => {
    const q = prioritySearch.toLowerCase();
    const matchesSearch =
      (r.name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.aadharNumber || "").toLowerCase().includes(q) ||
      (r.institution || "").toLowerCase().includes(q) ||
      (r.utrNumber || "").toLowerCase().includes(q) ||
      (r.transactionId || "").toLowerCase().includes(q) ||
      (r.payerName || "").toLowerCase().includes(q) ||
      (r.cityState || "").toLowerCase().includes(q) ||
      (r.id || "").toLowerCase().includes(q) ||
      (r.uid || "").toLowerCase().includes(q) ||
      (r.merchSize || "").toLowerCase().includes(q) ||
      (r.hasMerch && "merchandise t-shirt merch".includes(q));

    const matchesCategory =
      priorityCategoryFilter === "all" ||
      r.delegateCategory === priorityCategoryFilter ||
      (priorityCategoryFilter === "College Non-IIST" && (!r.delegateCategory || r.delegateCategory === "college" || r.delegateCategory === "college_external")) ||
      (priorityCategoryFilter === "School Delegate" && r.delegateCategory === "school") ||
      (priorityCategoryFilter === "IIST Internal" && (r.delegateCategory === "iist_internal" || r.institution?.toLowerCase().includes("indian institute of space science")));

    const matchesCommittee =
      priorityCommitteeFilter === "all" ||
      priorityCommitteeFilter === "unga" ||
      r.pref1Committee === priorityCommitteeFilter ||
      r.pref2Committee === priorityCommitteeFilter ||
      r.pref3Committee === priorityCommitteeFilter ||
      r.allottedCommittee === priorityCommitteeFilter;

    const matchesStatus =
      priorityStatusFilter === "all" ||
      r.status === priorityStatusFilter ||
      r.paymentStatus === priorityStatusFilter;

    const matchesMerch =
      priorityMerchFilter === "all" ||
      (priorityMerchFilter === "merch" && r.hasMerch) ||
      (priorityMerchFilter === "no_merch" && !r.hasMerch);

    return matchesSearch && matchesCategory && matchesCommittee && matchesStatus && matchesMerch;
  });

  // Filter UNGA Online registrations
  const filteredUnga = ungaRegistrations.filter((r) => {
    const q = ungaSearch.toLowerCase();
    const matchesSearch =
      (r.name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.aadharNumber || "").toLowerCase().includes(q) ||
      (r.institution || "").toLowerCase().includes(q) ||
      (r.fullAddress || "").toLowerCase().includes(q) ||
      (r.cityState || "").toLowerCase().includes(q) ||
      (r.utrNumber || "").toLowerCase().includes(q) ||
      (r.transactionId || "").toLowerCase().includes(q) ||
      (r.payerName || "").toLowerCase().includes(q) ||
      (r.id || "").toLowerCase().includes(q) ||
      (r.uid || "").toLowerCase().includes(q) ||
      (r.merchSize || "").toLowerCase().includes(q) ||
      (r.hasMerch && "merchandise t-shirt merch".includes(q));

    const matchesStatus =
      ungaStatusFilter === "all" ||
      r.status === ungaStatusFilter;

    const matchesPaymentStatus =
      ungaPaymentStatusFilter === "all" ||
      r.paymentStatus === ungaPaymentStatusFilter;

    const matchesMerch =
      ungaMerchFilter === "all" ||
      (ungaMerchFilter === "merch" && r.hasMerch) ||
      (ungaMerchFilter === "no_merch" && !r.hasMerch);

    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesMerch;
  });

  // Filter general registrations (or UNGA online if UNGA filter is selected)
  const generalBaseList = filterCommittee === "unga" ? ungaRegistrations : generalRegistrations;

  const filtered = generalBaseList.filter(r => {
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (r.name?.toLowerCase() || "").includes(queryLower) ||
      (r.email?.toLowerCase() || "").includes(queryLower) ||
      (r.institution?.toLowerCase() || "").includes(queryLower) ||
      (r.id?.toLowerCase() || "").includes(queryLower);

    const matchesType = filterType === "all" || r.regType === filterType;
    const matchesCommittee = filterCommittee === "all" || 
      filterCommittee === "unga" ||
      r.pref1Committee === filterCommittee || 
      r.pref2Committee === filterCommittee || 
      r.pref3Committee === filterCommittee;

    return matchesSearch && matchesType && matchesCommittee;
  });

  // Filter EB registrations
  const filteredEb = ebRegistrations.filter((r) => {
    const q = ebSearch.toLowerCase();
    const matchesSearch =
      (r.name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.institution || "").toLowerCase().includes(q) ||
      (r.id || "").toLowerCase().includes(q);
    const matchesCommittee =
      ebCommitteeFilter === "all" ||
      r.pref1Committee === ebCommitteeFilter ||
      r.pref2Committee === ebCommitteeFilter;
    const matchesStatus = ebStatusFilter === "all" || r.status === ebStatusFilter;
    return matchesSearch && matchesCommittee && matchesStatus;
  });

  // Filter CA registrations
  const filteredCa = caRegistrations.filter((r) => {
    const q = caSearch.toLowerCase();
    const matchesSearch =
      (r.name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.institution || "").toLowerCase().includes(q) ||
      (r.cityState || "").toLowerCase().includes(q) ||
      (r.id || "").toLowerCase().includes(q);
    const matchesStatus = caStatusFilter === "all" || r.status === caStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Count helper statistics for General Delegates
  const totalCount = generalRegistrations.length;
  const individualCount = generalRegistrations.filter(r => r.regType === "individual").length;
  const doubleCount = generalRegistrations.filter(r => r.regType === "double").length;
  const contingentCount = generalRegistrations.filter(r => r.regType === "contingent").length;

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
    <div className="bg-[#1A1F1A] text-[#EDE6D3] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans paper-grain newsprint-overlay selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 border border-[#C9A86A]/40 bg-[#2E3B2F] px-5 py-3 shadow-2xl backdrop-blur-md animate-fade-in">
          <Check className="h-4 w-4 text-[#C9A86A] shrink-0" />
          <span className="font-sans text-xs font-medium text-[#EDE6D3]">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-[#8A9A7E] hover:text-[#EDE6D3] ml-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-[#C9A86A]/20 pb-8 text-left">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="emblem-seal px-3 py-0.5 text-[11px] uppercase tracking-[0.2em] bg-[#2E3B2F]">
                Command Telemetry
              </span>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8A9A7E] font-medium">
                Secretariat Desk
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#EDE6D3] tracking-wide mt-2">
              Diplomatic Registries Ledger
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-[#8A9A7E]">
              Archival monitoring of registered candidates, delegations, portfolios, and workshop cohorts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              onClick={() => setActiveSubTab("queries")}
              className={`flex items-center gap-2 px-3.5 py-2 border transition-all cursor-pointer text-xs font-sans font-semibold uppercase tracking-wider ${
                activeSubTab === "queries"
                  ? "border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A]"
                  : "border-[#C9A86A]/40 bg-[#2E3B2F] text-[#EDE6D3] hover:bg-[#C9A86A] hover:text-[#1A1F1A]"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Queries ({contactQueries.length})</span>
            </button>

            {/* Direct 1-Click Priority Round Excel Download */}
            <button
              onClick={() => exportPriorityToExcel()}
              disabled={priorityRegistrations.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#C9A86A] bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Download Priority Round Registrations as Excel spreadsheet (.xlsx)"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Priority Excel</span>
              <span className="px-1.5 py-0.5 bg-[#1A1F1A] text-[#C9A86A] text-[10px] font-bold">
                {priorityRegistrations.length}
              </span>
            </button>

            {/* Direct 1-Click UNGA Online Excel Download */}
            <button
              onClick={() => exportUngaToExcel()}
              disabled={ungaRegistrations.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#C9A86A] bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Download UNGA Online Delegations as Excel spreadsheet (.xlsx)"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>UNGA Excel</span>
              <span className="px-1.5 py-0.5 bg-[#1A1F1A] text-[#C9A86A] text-[10px] font-bold">
                {ungaRegistrations.length}
              </span>
            </button>

            {/* Direct 1-Click EB Excel Download */}
            <button
              onClick={() => exportEbToExcel()}
              disabled={ebRegistrations.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#C9A86A] bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Download Executive Board Applications as Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>EB Excel</span>
              <span className="px-1.5 py-0.5 bg-[#1A1F1A] text-[#C9A86A] text-[10px] font-bold">
                {ebRegistrations.length}
              </span>
            </button>

            {/* Direct 1-Click Campus Ambassador Excel Download */}
            <button
              onClick={() => exportCaToExcel()}
              disabled={caRegistrations.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#8BA06F] bg-[#8BA06F] hover:bg-[#a1b783] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Download Campus Ambassador Registrations as Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Ambassadors Excel</span>
              <span className="px-1.5 py-0.5 bg-[#1A1F1A] text-[#8BA06F] text-[10px] font-bold">
                {caRegistrations.length}
              </span>
            </button>

            {/* Export Registries Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-[#C9A86A]/40 bg-[#2E3B2F] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer"
                title="View all export options (Excel, CSV, JSON)"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Ledger</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1A1F1A] border-2 border-[#C9A86A] shadow-2xl z-50 py-2 divide-y divide-[#8A9A7E]/20 text-left">
                  <div className="px-3 py-1.5 bg-[#2E3B2F]/60">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                      EXCEL SPREADSHEETS (.XLSX)
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportPriorityToExcel();
                        setShowExportMenu(false);
                      }}
                      disabled={priorityRegistrations.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] hover:text-[#C9A86A] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#C9A86A]" />
                        <span className="font-semibold">Priority Round Delegates</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#1A1F1A] bg-[#C9A86A] font-bold px-1.5 py-0.5 rounded">
                        {priorityRegistrations.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        exportUngaToExcel();
                        setShowExportMenu(false);
                      }}
                      disabled={ungaRegistrations.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] hover:text-[#C9A86A] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#C9A86A]" />
                        <span className="font-semibold">UNGA Online Delegates</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#1A1F1A] bg-[#C9A86A] font-bold px-1.5 py-0.5 rounded">
                        {ungaRegistrations.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        exportEbToExcel();
                        setShowExportMenu(false);
                      }}
                      disabled={ebRegistrations.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] hover:text-[#C9A86A] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-[#C9A86A]" />
                        <span>Executive Board Registrations</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] bg-[#2E3B2F] px-1.5 py-0.5 rounded">
                        {ebRegistrations.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        exportCaToExcel();
                        setShowExportMenu(false);
                      }}
                      disabled={caRegistrations.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] hover:text-[#8BA06F] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-[#8BA06F]" />
                        <span>Campus Ambassadors</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] bg-[#2E3B2F] px-1.5 py-0.5 rounded">
                        {caRegistrations.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        exportDelegatesToExcel();
                        setShowExportMenu(false);
                      }}
                      disabled={generalRegistrations.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] hover:text-[#C9A86A] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                        <span>Delegate Registrations (.xlsx)</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] bg-[#2E3B2F] px-1.5 py-0.5 rounded">
                        {generalRegistrations.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        exportQueriesToExcel();
                        setShowExportMenu(false);
                      }}
                      disabled={contactQueries.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] hover:text-[#C9A86A] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-amber-400" />
                        <span>Contact Queries (.xlsx)</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] bg-[#2E3B2F] px-1.5 py-0.5 rounded">
                        {contactQueries.length}
                      </span>
                    </button>
                  </div>

                  <div className="px-3 py-1.5 bg-[#2E3B2F]/60">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold block">
                      DELEGATE RAW FORMATS
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportToCSV();
                        setShowExportMenu(false);
                      }}
                      disabled={generalRegistrations.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-emerald-400" />
                        <span>Delegates as CSV</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9A7E]">.csv</span>
                    </button>

                    <button
                      onClick={() => {
                        exportToJSON();
                        setShowExportMenu(false);
                      }}
                      disabled={generalRegistrations.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span>Delegates as JSON</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9A7E]">.json</span>
                    </button>

                    <button
                      onClick={() => {
                        exportWorkshopToCSV();
                        setShowExportMenu(false);
                      }}
                      disabled={workshopRegistrations.length === 0}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#EDE6D3] hover:bg-[#2E3B2F] transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-400" />
                        <span>Workshop Cohort CSV</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9A7E]">.csv</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3.5 mb-10">
          <div 
            onClick={() => setActiveSubTab("priority")}
            className={`border p-4 text-left shadow-sm cursor-pointer transition-all relative group ${
              activeSubTab === "priority"
                ? "border-[#C9A86A] bg-[#2E3B2F] ring-1 ring-[#C9A86A]"
                : "border-[#C9A86A]/40 bg-[#2E3B2F] hover:border-[#C9A86A]"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#C9A86A] font-bold block flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-[#C9A86A]" />
                PRIORITY
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportPriorityToExcel();
                }}
                disabled={priorityRegistrations.length === 0}
                className="opacity-80 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 bg-[#1A1F1A] border border-[#C9A86A]/40 hover:border-[#C9A86A] text-[#C9A86A] text-[9px] font-sans font-bold flex items-center gap-1 cursor-pointer disabled:opacity-20"
                title="Quick Download Priority Round Excel (.xlsx)"
              >
                <Download className="h-2.5 w-2.5" />
                <span>XLSX</span>
              </button>
            </div>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{priorityRegistrations.length}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveSubTab("unga")}
            className={`border p-4 text-left shadow-sm cursor-pointer transition-all relative group ${
              activeSubTab === "unga"
                ? "border-[#C9A86A] bg-[#2E3B2F] ring-1 ring-[#C9A86A]"
                : "border-[#C9A86A]/40 bg-[#2E3B2F] hover:border-[#C9A86A]"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#C9A86A] font-bold block flex items-center gap-1">
                <Globe className="h-3 w-3 text-[#C9A86A]" />
                UNGA ONLINE
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportUngaToExcel();
                }}
                disabled={ungaRegistrations.length === 0}
                className="opacity-80 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 bg-[#1A1F1A] border border-[#C9A86A]/40 hover:border-[#C9A86A] text-[#C9A86A] text-[9px] font-sans font-bold flex items-center gap-1 cursor-pointer disabled:opacity-20"
                title="Quick Download UNGA Online Excel (.xlsx)"
              >
                <Download className="h-2.5 w-2.5" />
                <span>XLSX</span>
              </button>
            </div>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{ungaRegistrations.length}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                <Globe className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveSubTab("registrations")}
            className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm cursor-pointer hover:border-[#C9A86A] transition-all"
          >
            <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#8A9A7E] font-medium block">DELEGATES</span>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{totalCount}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <div 
            onClick={() => setActiveSubTab("eb")}
            className={`border p-4 text-left shadow-sm cursor-pointer transition-all relative group ${
              activeSubTab === "eb"
                ? "border-[#C9A86A] bg-[#2E3B2F] ring-1 ring-[#C9A86A]"
                : "border-[#C9A86A]/40 bg-[#2E3B2F] hover:border-[#C9A86A]"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#C9A86A] font-semibold block">EB APPLICANTS</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportEbToExcel();
                }}
                disabled={ebRegistrations.length === 0}
                className="opacity-80 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 bg-[#1A1F1A] border border-[#C9A86A]/40 hover:border-[#C9A86A] text-[#C9A86A] text-[9px] font-sans font-bold flex items-center gap-1 cursor-pointer disabled:opacity-20"
                title="Quick Download EB Excel (.xlsx)"
              >
                <Download className="h-2.5 w-2.5" />
                <span>XLSX</span>
              </button>
            </div>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{ebRegistrations.length}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <div 
            onClick={() => setActiveSubTab("campus-ambassador")}
            className={`border p-4 text-left shadow-sm cursor-pointer transition-all relative group ${
              activeSubTab === "campus-ambassador"
                ? "border-[#8BA06F] bg-[#2E3B2F] ring-1 ring-[#8BA06F]"
                : "border-[#8BA06F]/40 bg-[#2E3B2F] hover:border-[#8BA06F]"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#8BA06F] font-semibold block">AMBASSADORS</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportCaToExcel();
                }}
                disabled={caRegistrations.length === 0}
                className="opacity-80 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 bg-[#1A1F1A] border border-[#8BA06F]/40 hover:border-[#8BA06F] text-[#8BA06F] text-[9px] font-sans font-bold flex items-center gap-1 cursor-pointer disabled:opacity-20"
                title="Quick Download Campus Ambassador Excel (.xlsx)"
              >
                <Download className="h-2.5 w-2.5" />
                <span>XLSX</span>
              </button>
            </div>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{caRegistrations.length}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#8BA06F]/30 text-[#8BA06F]">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <div 
            onClick={() => setActiveSubTab("workshop")}
            className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm cursor-pointer hover:border-[#C9A86A] transition-all"
          >
            <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#8A9A7E] font-medium block">WORKSHOP</span>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{workshopRegistrations.length}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#8A9A7E]">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <div 
            onClick={() => setActiveSubTab("registrations")}
            className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm cursor-pointer hover:border-[#C9A86A] transition-all"
          >
            <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#8A9A7E] font-medium block">CONTINGENTS</span>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{contingentCount}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#8A9A7E]">
                <Building2 className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <div 
            onClick={() => setActiveSubTab("queries")}
            className={`border p-4 text-left shadow-sm cursor-pointer transition-all ${
              activeSubTab === "queries"
                ? "border-[#C9A86A] bg-[#2E3B2F] ring-1 ring-[#C9A86A]"
                : "border-[#C9A86A]/40 bg-[#2E3B2F] hover:border-[#C9A86A]"
            }`}
          >
            <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#C9A86A] font-bold block">INQUIRIES</span>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{contactQueries.length}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                <Mail className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Navigation Sub-Tabs */}
        <div className="flex border-b border-[#C9A86A]/25 mb-8 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveSubTab("priority")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "priority"
                ? "border-[#C9A86A] text-[#C9A86A] font-semibold bg-[#2E3B2F]/40"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#C9A86A]" />
            <span>Priority Round ({priorityRegistrations.length})</span>
            {priorityRegistrations.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[#C9A86A] text-[#1A1F1A] text-[9px] font-bold">
                {priorityRegistrations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("unga")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "unga"
                ? "border-[#C9A86A] text-[#C9A86A] font-semibold bg-[#2E3B2F]/40"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-[#C9A86A]" />
            <span>UNGA Online ({ungaRegistrations.length})</span>
            {ungaRegistrations.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[#C9A86A] text-[#1A1F1A] text-[9px] font-bold">
                {ungaRegistrations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("registrations")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "registrations"
                ? "border-[#C9A86A] text-[#C9A86A] font-semibold"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            General Delegates ({filtered.length})
          </button>
          <button
            onClick={() => setActiveSubTab("eb")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "eb"
                ? "border-[#C9A86A] text-[#C9A86A] font-semibold"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Executive Board ({ebRegistrations.length})</span>
            {ebRegistrations.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[#C9A86A] text-[#1A1F1A] text-[9px] font-bold">
                {ebRegistrations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("campus-ambassador")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "campus-ambassador"
                ? "border-[#8BA06F] text-[#8BA06F] font-semibold"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Campus Ambassadors ({caRegistrations.length})</span>
            {caRegistrations.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[#8BA06F] text-[#1A1F1A] text-[9px] font-bold">
                {caRegistrations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("workshop")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "workshop"
                ? "border-[#C9A86A] text-[#C9A86A] font-semibold"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            Diplomacy Workshop ({workshopRegistrations.length})
          </button>
          <button
            onClick={() => setActiveSubTab("queries")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "queries"
                ? "border-[#C9A86A] text-[#C9A86A] font-semibold"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Contact Inquiries ({contactQueries.length})</span>
            {contactQueries.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[#C9A86A] text-[#1A1F1A] text-[9px] font-bold">
                {contactQueries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("database")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "database"
                ? "border-[#C9A86A] text-[#C9A86A] font-semibold"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Firestore Database</span>
          </button>
        </div>

        {/* ========================================================
            SUB-TAB: PRIORITY ROUND DELEGATE REGISTRATIONS
           ======================================================== */}
        {activeSubTab === "priority" && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Header & Export Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#C9A86A]/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                    // PRIORITY COHORT REGISTRY
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                    Secretariat Desk • Direct Telemetry
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3] tracking-wide">
                  Priority Round Delegations Ledger
                </h2>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                  Verified candidate intake, UTR payments, campus accommodation requests, and committee portfolio allocations.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => exportPriorityToExcel()}
                  disabled={priorityRegistrations.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  title="Download all Priority Round registrations as an Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Priority Excel ({priorityRegistrations.length})</span>
                </button>
                {filteredPriority.length !== priorityRegistrations.length && (
                  <button
                    onClick={() => exportPriorityToExcel(filteredPriority, "Filtered")}
                    disabled={filteredPriority.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#C9A86A] bg-[#1A1F1A] hover:bg-[#2E3B2F] text-[#C9A86A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Download currently filtered Priority registrations as an Excel spreadsheet"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Download Filtered ({filteredPriority.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">TOTAL PRIORITY</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{priorityRegistrations.length}</span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">PAYMENT CONFIRMED</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {priorityRegistrations.filter(r => r.paymentStatus === "Verified" || r.status === "Payment Confirmed" || r.status === "Portfolio Allotted").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300">PENDING VERIFICATION</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {priorityRegistrations.filter(r => r.paymentStatus === "Pending" || r.status === "Pending Verification").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-amber-500/30 text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A]">PORTFOLIO ALLOTTED</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {priorityRegistrations.filter(r => r.status === "Portfolio Allotted" || (r.allottedCountry && r.allottedCommittee)).length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A]">MERCH ORDERS</span>
                <div className="flex justify-between items-end mt-1.5">
                  <div>
                    <span className="font-serif text-2xl font-normal text-[#EDE6D3] block">
                      {priorityRegistrations.filter(r => r.hasMerch).length}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      ₹{priorityRegistrations.filter(r => r.hasMerch).length * 599}
                    </span>
                  </div>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <Shirt className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-center bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-4">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                <input
                  type="text"
                  placeholder="Search by candidate name, email, phone, UTR, ticket..."
                  value={prioritySearch}
                  onChange={(e) => setPrioritySearch(e.target.value)}
                  className="w-full bg-[#1A1F1A] border border-[#C9A86A]/30 focus:border-[#C9A86A] pl-10 pr-4 py-2 font-sans text-xs text-[#EDE6D3] focus:outline-none transition-all placeholder-[#8A9A7E]/50"
                />
              </div>

              <div className="flex flex-wrap gap-2.5 w-full lg:w-auto justify-end">
                {/* Category Filter */}
                <div className="flex items-center gap-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <Filter className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={priorityCategoryFilter}
                    onChange={(e) => setPriorityCategoryFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL CATEGORIES</option>
                    <option value="College Non-IIST" className="bg-[#1A1F1A] text-[#EDE6D3]">COLLEGE NON-IIST (₹1299)</option>
                    <option value="School Delegate" className="bg-[#1A1F1A] text-[#EDE6D3]">SCHOOL DELEGATE (₹1000)</option>
                    <option value="IIST Internal" className="bg-[#1A1F1A] text-[#EDE6D3]">IIST INTERNAL (₹0)</option>
                  </select>
                </div>

                {/* Merch Filter */}
                <div className="flex items-center gap-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <Shirt className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={priorityMerchFilter}
                    onChange={(e) => setPriorityMerchFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL MERCH</option>
                    <option value="merch" className="bg-[#1A1F1A] text-[#EDE6D3]">WITH MERCH (₹599)</option>
                    <option value="no_merch" className="bg-[#1A1F1A] text-[#EDE6D3]">WITHOUT MERCH</option>
                  </select>
                </div>

                {/* Committee Filter */}
                <div className="flex items-center gap-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <Briefcase className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={priorityCommitteeFilter}
                    onChange={(e) => setPriorityCommitteeFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL COMMITTEES</option>
                    <option value="copuos" className="bg-[#1A1F1A] text-[#EDE6D3]">UNCOPUOS</option>
                    <option value="unga" className="bg-[#1A1F1A] text-[#EDE6D3]">UNGA (ONLINE)</option>
                    <option value="unhrc" className="bg-[#1A1F1A] text-[#EDE6D3]">UNHRC</option>
                    <option value="unodc" className="bg-[#1A1F1A] text-[#EDE6D3]">UNODC</option>
                    <option value="nes75" className="bg-[#1A1F1A] text-[#EDE6D3]">NES'75</option>
                    <option value="undp" className="bg-[#1A1F1A] text-[#EDE6D3]">UNDP</option>
                    <option value="ip_journalism" className="bg-[#1A1F1A] text-[#EDE6D3]">IP (JOURNALISM)</option>
                    <option value="ip_photojournalism" className="bg-[#1A1F1A] text-[#EDE6D3]">IP (PHOTOJOURNALISM)</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <ShieldCheck className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={priorityStatusFilter}
                    onChange={(e) => setPriorityStatusFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL STATUSES</option>
                    <option value="Pending Verification" className="bg-[#1A1F1A] text-[#EDE6D3]">PENDING VERIFICATION</option>
                    <option value="Payment Confirmed" className="bg-[#1A1F1A] text-emerald-400">PAYMENT CONFIRMED</option>
                    <option value="Portfolio Allotted" className="bg-[#1A1F1A] text-[#C9A86A]">PORTFOLIO ALLOTTED</option>
                    <option value="Waitlisted" className="bg-[#1A1F1A] text-amber-300">WAITLISTED</option>
                    <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">REJECTED</option>
                  </select>
                </div>
              </div>
            </div>

            {/* UNGA Filter Indicator Banner */}
            {priorityCommitteeFilter === "unga" && (
              <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#EDE6D3] shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#C9A86A]">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#C9A86A] text-sm flex items-center gap-2">
                      <span>UNGA (ONLINE COMMITTEE) REGISTRATIONS</span>
                      <span className="px-2 py-0.5 bg-[#C9A86A] text-[#1A1F1A] text-[10px] font-mono font-bold">
                        {filteredPriority.length} Applicant{filteredPriority.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-[#8A9A7E] text-[11px] mt-0.5">
                      Showing UNGA Online Committee registrations. You can review dossiers and proof attachments right here, or open the specialized UNGA Ledger tab.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab("unga")}
                  className="px-4 py-2 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer self-start sm:self-auto flex items-center gap-1.5 shadow whitespace-nowrap"
                >
                  <span>Open Dedicated UNGA Online Tab</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Priority Ledger Table */}
            <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/40 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-[#C9A86A]/20 bg-[#1A1F1A]">
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Ticket & Category</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Candidate Details</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Institution & Course</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Preferences (1st / 2nd)</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Merch</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Payment & UTR</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">Proofs (Receipt & ID)</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Status</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A9A7E]/10">
                    {filteredPriority.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-[#8A9A7E]">
                          <Sparkles className="h-8 w-8 mx-auto mb-2 text-[#C9A86A]/50" />
                          <p className="font-serif text-lg text-[#EDE6D3]">No priority delegates match criteria</p>
                          <p className="text-xs text-[#8A9A7E] mt-1">Registrations submitted in the priority round appear here in real time.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPriority.map((item) => (
                        <tr key={item.id || item.uid} className="hover:bg-[#2E3B2F]/60 transition-colors">
                          {/* Ticket & Category */}
                          <td className="p-3.5 font-mono text-xs">
                            <span className="text-[#C9A86A] font-bold block">{item.id || item.uid}</span>
                            <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider border ${
                              item.delegateCategory === "school"
                                ? "bg-amber-950/50 text-amber-300 border-amber-500/30"
                                : (item.delegateCategory === "iist" || item.delegateCategory === "iist_internal")
                                ? "bg-cyan-950/50 text-cyan-300 border-cyan-500/30"
                                : "bg-[#1A1F1A] text-[#EDE6D3] border-[#C9A86A]/30"
                            }`}>
                              {item.delegateCategory === "school" ? "School (₹1000)" : (item.delegateCategory === "iist" || item.delegateCategory === "iist_internal") ? "IIST (₹800)" : "College (₹1299)"}
                            </span>
                            {item.regType === "double" && (
                              <span className="block mt-1 text-[9px] font-mono text-purple-300 uppercase font-semibold">
                                // Double Del
                              </span>
                            )}
                            {(item.delegationMode === "part_of_delegation" || item.regType === "contingent") && (
                              <span className="block mt-1 text-[9px] font-mono text-amber-300 uppercase font-semibold">
                                // Part of Delegation
                              </span>
                            )}
                            {item.isPrivateDelegation && (
                              <span className="block mt-0.5 text-[8.5px] font-mono text-rose-300 uppercase font-semibold">
                                [Private Del]
                              </span>
                            )}
                          </td>

                          {/* Candidate Details */}
                          <td className="p-3.5">
                            <div className="font-medium text-[#EDE6D3] leading-tight flex items-center gap-1.5">
                              {item.name}
                              <span className="px-1.5 py-0.2 bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#8A9A7E] text-[8px] uppercase">
                                {item.gender || "Delegate"}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-[#8A9A7E] mt-0.5 truncate max-w-[200px]">{item.email}</div>
                            <div className="font-mono text-[10px] text-[#C9A86A]">{item.phone}</div>
                            {item.cityState && (
                              <div className="text-[10px] text-[#8A9A7E]/80">{item.cityState}</div>
                            )}
                            {item.regType === "double" && item.partnerName && (
                              <div className="mt-1.5 pt-1 border-t border-[#8A9A7E]/15 text-[10px] text-purple-200">
                                <strong>Partner:</strong> {item.partnerName} ({item.partnerId || "ID Pending"})
                              </div>
                            )}
                          </td>

                          {/* Institution & Course */}
                          <td className="p-3.5">
                            <span className="text-[#EDE6D3] block truncate max-w-[180px] font-medium" title={item.institution}>
                              {item.institution}
                            </span>
                            <span className="text-[10px] text-[#8A9A7E] block truncate max-w-[180px]">
                              {item.course || "Degree N/A"} • {item.yearOfStudy || item.classGrade || "Year N/A"}
                            </span>
                            {item.rollNumber && (
                              <span className="text-[9px] font-mono text-[#8A9A7E]/60 block">Roll: {item.rollNumber}</span>
                            )}
                          </td>

                          {/* Preferences */}
                          <td className="p-3.5">
                            <div className="text-[11px] leading-tight">
                              <span className="font-bold text-[#C9A86A] uppercase">{item.pref1Committee || "None"}</span>
                              {item.pref1Country && <span className="text-[#EDE6D3] ml-1">({item.pref1Country})</span>}
                            </div>
                            {item.pref2Committee && (
                              <div className="text-[10px] text-[#8A9A7E] mt-0.5">
                                <span className="uppercase">{item.pref2Committee}</span>
                                {item.pref2Country && <span> ({item.pref2Country})</span>}
                              </div>
                            )}
                            {item.pref3Committee && (
                              <div className="text-[10px] text-[#8A9A7E]/70 mt-0.5">
                                <span className="uppercase">{item.pref3Committee}</span>
                                {item.pref3Country && <span> ({item.pref3Country})</span>}
                              </div>
                            )}
                            {item.allottedCommittee && (
                              <div className="mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 inline-block">
                                Allotted: {item.allottedCountry ? `${item.allottedCountry} (${item.allottedCommittee.toUpperCase()})` : item.allottedCommittee.toUpperCase()}
                              </div>
                            )}
                          </td>

                          {/* Merch */}
                          <td className="p-3.5">
                            {item.hasMerch ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <Shirt className="h-3 w-3" />
                                  {item.merchSize || "M"}
                                </span>
                                <div className="text-[10px] font-mono text-[#8A9A7E] mt-0.5">
                                  +₹{item.merchAmount || 599}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] font-mono text-[#8A9A7E]/50">—</span>
                            )}
                          </td>

                          {/* Payment & UTR */}
                          <td className="p-3.5">
                            <div className="font-mono text-xs font-bold text-[#C9A86A]">
                              ₹{item.feeAmount !== undefined ? item.feeAmount : 1299}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-[#EDE6D3] bg-[#1A1F1A] px-1.5 py-0.5 border border-[#8A9A7E]/30">
                                {item.utrNumber || item.transactionId || "NO UTR"}
                              </span>
                              {(item.utrNumber || item.transactionId) && (
                                <button
                                  onClick={() => handleCopyUtr(item.utrNumber || item.transactionId || "")}
                                  className="text-[#8A9A7E] hover:text-[#C9A86A] p-0.5 transition-colors cursor-pointer"
                                  title="Copy UTR number"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            {item.payerName && (
                              <div className="text-[9px] text-[#8A9A7E] mt-0.5 truncate max-w-[140px]">By: {item.payerName}</div>
                            )}
                            {item.campusAmbassadorCode && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-1 py-0.5" title="₹50 refund due">
                                  CA: {item.campusAmbassadorCode}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Proofs: Payment Receipt & Student ID */}
                          <td className="p-3.5 min-w-[170px]">
                            {(() => {
                              const receiptUrl = item.paymentScreenshotUrl || (item as any).paymentProofUrl || (item as any).receiptUrl;
                              const receiptName = item.paymentScreenshotName || (item as any).paymentProofName || "Payment Receipt";
                              const idUrl = item.idCardUrl || (item as any).idProofUrl || (item as any).photoUrl;
                              const idName = item.idCardName || (item as any).idProofName || "Student ID Proof";

                              return (
                                <div className="space-y-2">
                                  {/* Payment Receipt */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-mono text-[8px] uppercase tracking-wider text-[#C9A86A] font-bold">
                                        Receipt Proof
                                      </span>
                                      {receiptUrl && (
                                        <button
                                          onClick={() => setViewProofModal({
                                            url: receiptUrl,
                                            name: receiptName,
                                            utr: item.utrNumber || item.transactionId,
                                            candidateName: item.name
                                          })}
                                          className="text-[9px] text-[#C9A86A] hover:underline inline-flex items-center gap-0.5 cursor-pointer font-semibold"
                                        >
                                          <Eye className="h-2.5 w-2.5" />
                                          <span>View</span>
                                        </button>
                                      )}
                                    </div>
                                    {receiptUrl ? (
                                      <div className="flex items-center gap-2">
                                        <ProofThumbnail
                                          url={receiptUrl}
                                          name={receiptName}
                                          alt={`Receipt for ${item.name}`}
                                          borderColor="border-[#C9A86A]/50"
                                          onView={() => setViewProofModal({
                                            url: receiptUrl,
                                            name: receiptName,
                                            utr: item.utrNumber || item.transactionId,
                                            candidateName: item.name
                                          })}
                                        />
                                        <div className="text-[10px] truncate max-w-[100px] text-[#EDE6D3]/90" title={receiptName}>
                                          {receiptName}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-[#8A9A7E] italic block">No receipt</span>
                                    )}
                                  </div>

                                  {/* Student ID Proof */}
                                  <div className="pt-1.5 border-t border-[#8A9A7E]/15">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-mono text-[8px] uppercase tracking-wider text-[#8BA06F] font-bold">
                                        Student ID Card
                                      </span>
                                      {idUrl && (
                                        <button
                                          onClick={() => setViewProofModal({
                                            url: idUrl,
                                            name: idName,
                                            candidateName: item.name
                                          })}
                                          className="text-[9px] text-[#8BA06F] hover:underline inline-flex items-center gap-0.5 cursor-pointer font-semibold"
                                        >
                                          <Eye className="h-2.5 w-2.5" />
                                          <span>View</span>
                                        </button>
                                      )}
                                    </div>
                                    {idUrl ? (
                                      <div className="flex items-center gap-2">
                                        <ProofThumbnail
                                          url={idUrl}
                                          name={idName}
                                          alt={`Student ID for ${item.name}`}
                                          borderColor="border-[#8BA06F]/50"
                                          onView={() => setViewProofModal({
                                            url: idUrl,
                                            name: idName,
                                            candidateName: item.name
                                          })}
                                        />
                                        <div className="text-[10px] truncate max-w-[100px] text-[#EDE6D3]/90" title={idName}>
                                          {idName}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-[#8A9A7E]/60 italic block">No ID uploaded</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Status Dropdown */}
                          <td className="p-3.5">
                            <select
                              value={item.status || "Pending Verification"}
                              onChange={(e) => {
                                if (isUngaRecord(item)) {
                                  handleUpdateUngaStatus(item.uid || item.id || "", e.target.value);
                                } else {
                                  handleUpdatePriorityStatus(item.uid || item.id || "", e.target.value);
                                }
                              }}
                              className={`px-2 py-1 text-[10px] font-sans font-semibold uppercase tracking-wider border focus:outline-none cursor-pointer ${
                                item.status === "Payment Confirmed"
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                                  : item.status === "Portfolio Allotted"
                                  ? "bg-[#C9A86A]/20 text-[#C9A86A] border-[#C9A86A]/40 font-bold"
                                  : item.status === "Waitlisted"
                                  ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                  : item.status === "Rejected"
                                  ? "bg-rose-950/60 text-rose-400 border-rose-500/40"
                                  : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/40"
                              }`}
                            >
                              <option value="Pending Verification" className="bg-[#1A1F1A] text-[#EDE6D3]">Pending Verification</option>
                              <option value="Payment Confirmed" className="bg-[#1A1F1A] text-emerald-400">Payment Confirmed</option>
                              <option value="Portfolio Allotted" className="bg-[#1A1F1A] text-[#C9A86A]">Portfolio Allotted</option>
                              <option value="Waitlisted" className="bg-[#1A1F1A] text-amber-300">Waitlisted</option>
                              <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">Rejected</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  if (isUngaRecord(item)) {
                                    setAllotUngaModalReg(item as any);
                                    setAllotUngaForm({
                                      country: item.allottedCountry || item.pref1Country || "",
                                      adminNotes: item.adminNotes || ""
                                    });
                                  } else {
                                    setAllotModalReg(item);
                                    setAllotForm({
                                      committee: item.allottedCommittee || item.pref1Committee || "copuos",
                                      country: item.allottedCountry || item.pref1Country || "",
                                      adminNotes: item.adminNotes || ""
                                    });
                                  }
                                }}
                                className="p-1.5 border border-[#C9A86A]/40 bg-[#2E3B2F] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-[#C9A86A] transition-colors cursor-pointer"
                                title="Allot Council Portfolio"
                              >
                                <Compass className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (isUngaRecord(item)) {
                                    setSelectedUngaReg(item as any);
                                  } else {
                                    setSelectedPriorityReg(item);
                                  }
                                }}
                                className="p-1.5 border border-[#8A9A7E]/40 bg-[#1A1F1A] hover:bg-[#2E3B2F] text-[#EDE6D3] transition-colors cursor-pointer"
                                title="Inspect Full Dossier"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (isUngaRecord(item)) {
                                    setConfirmUngaDeleteId(item.uid || item.id || "");
                                  } else {
                                    setConfirmPriorityDeleteId(item.uid || item.id || "");
                                  }
                                }}
                                className="p-1.5 border border-rose-500/30 bg-[#1A1F1A] hover:bg-rose-900/30 text-rose-400 transition-colors cursor-pointer"
                                title="Delete Registration"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: UNGA (ONLINE COMMITTEE) DELEGATE REGISTRATIONS
           ======================================================== */}
        {activeSubTab === "unga" && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Header & Export Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#C9A86A]/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                    // UNGA ONLINE COMMITTEE REGISTRY
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                    Secretariat Desk • Online Telemetry
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3] tracking-wide">
                  UNGA (Online) Delegations Ledger
                </h2>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                  Exhaustive archival monitoring of online delegates, postal delivery addresses, 5 ranked country preferences, student ID proofs, UTR verification, and portfolio allocations.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => exportUngaToExcel()}
                  disabled={ungaRegistrations.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  title="Download all UNGA Online registrations as an Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download UNGA Excel ({ungaRegistrations.length})</span>
                </button>
                {filteredUnga.length !== ungaRegistrations.length && (
                  <button
                    onClick={() => exportUngaToExcel(filteredUnga, "Filtered")}
                    disabled={filteredUnga.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#C9A86A] bg-[#1A1F1A] hover:bg-[#2E3B2F] text-[#C9A86A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Download currently filtered UNGA registrations as an Excel spreadsheet"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Download Filtered ({filteredUnga.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">TOTAL ONLINE</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{ungaRegistrations.length}</span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">PAYMENT CONFIRMED</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {ungaRegistrations.filter(r => r.paymentStatus === "Verified" || r.status === "Payment Confirmed" || r.status === "Portfolio Allotted").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300">PENDING VERIFICATION</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {ungaRegistrations.filter(r => r.paymentStatus === "Pending" || r.status === "Pending Verification").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-amber-500/30 text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A]">PORTFOLIO ALLOTTED</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {ungaRegistrations.filter(r => r.status === "Portfolio Allotted" || r.allottedCountry).length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A]">MERCH ORDERS</span>
                <div className="flex justify-between items-end mt-1.5">
                  <div>
                    <span className="font-serif text-2xl font-normal text-[#EDE6D3] block">
                      {ungaRegistrations.filter(r => r.hasMerch).length}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      ₹{ungaRegistrations.filter(r => r.hasMerch).length * 599}
                    </span>
                  </div>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <Shirt className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-center bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-4">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, Aadhaar, address, UTR, ticket..."
                  value={ungaSearch}
                  onChange={(e) => setUngaSearch(e.target.value)}
                  className="w-full bg-[#1A1F1A] border border-[#C9A86A]/30 focus:border-[#C9A86A] pl-10 pr-4 py-2 font-sans text-xs text-[#EDE6D3] focus:outline-none transition-all placeholder-[#8A9A7E]/50"
                />
              </div>

              <div className="flex flex-wrap gap-2.5 w-full lg:w-auto justify-end">
                {/* Merch Filter */}
                <div className="flex items-center gap-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <Shirt className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={ungaMerchFilter}
                    onChange={(e) => setUngaMerchFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL MERCH</option>
                    <option value="merch" className="bg-[#1A1F1A] text-[#EDE6D3]">WITH MERCH (+₹599)</option>
                    <option value="no_merch" className="bg-[#1A1F1A] text-[#EDE6D3]">WITHOUT MERCH</option>
                  </select>
                </div>

                {/* Payment Status Filter */}
                <div className="flex items-center gap-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <CheckCircle2 className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={ungaPaymentStatusFilter}
                    onChange={(e) => setUngaPaymentStatusFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL PAYMENT STATUSES</option>
                    <option value="Pending" className="bg-[#1A1F1A] text-amber-300">PAYMENT: PENDING</option>
                    <option value="Verified" className="bg-[#1A1F1A] text-emerald-400">PAYMENT: VERIFIED</option>
                    <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">PAYMENT: REJECTED</option>
                  </select>
                </div>

                {/* Overall Status Filter */}
                <div className="flex items-center gap-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <ShieldCheck className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={ungaStatusFilter}
                    onChange={(e) => setUngaStatusFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL STATUSES</option>
                    <option value="Pending Verification" className="bg-[#1A1F1A] text-[#EDE6D3]">PENDING VERIFICATION</option>
                    <option value="Payment Confirmed" className="bg-[#1A1F1A] text-emerald-400">PAYMENT CONFIRMED</option>
                    <option value="Portfolio Allotted" className="bg-[#1A1F1A] text-[#C9A86A]">PORTFOLIO ALLOTTED</option>
                    <option value="Waitlisted" className="bg-[#1A1F1A] text-amber-300">WAITLISTED</option>
                    <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">REJECTED</option>
                  </select>
                </div>
              </div>
            </div>

            {/* UNGA Online Ledger Table */}
            <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/40 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1250px]">
                  <thead>
                    <tr className="border-b border-[#C9A86A]/20 bg-[#1A1F1A]">
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Ticket & Date</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Candidate Identity</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Postal Address</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Institution & Student ID</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">5 Ranked Country Choices</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Merch</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Fee & UTR Payment</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Receipt</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">Status</th>
                      <th className="p-3.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A9A7E]/10">
                    {filteredUnga.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-[#8A9A7E]">
                          <Globe className="h-8 w-8 mx-auto mb-2 text-[#C9A86A]/50" />
                          <p className="font-serif text-lg text-[#EDE6D3]">No online delegates match criteria</p>
                          <p className="text-xs text-[#8A9A7E] mt-1">Registrations submitted via the UNGA (Online Committee) registration form appear here in real time.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUnga.map((item) => (
                        <tr key={item.uid || item.id} className="hover:bg-[#2E3B2F]/60 transition-colors text-xs text-[#EDE6D3]">
                          {/* Ticket & Date */}
                          <td className="p-3.5">
                            <span className="font-mono text-[11px] text-[#C9A86A] font-bold block">
                              {item.id || item.uid}
                            </span>
                            <span className="text-[10px] text-[#8A9A7E] block mt-0.5">
                              {item.timestamp ? new Date(item.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : (item.paymentDate || "N/A")}
                            </span>
                            <span className="inline-block mt-1 font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A] font-semibold">
                              INDIVIDUAL
                            </span>
                          </td>

                          {/* Candidate Identity */}
                          <td className="p-3.5">
                            <div className="font-bold text-[#EDE6D3] text-sm flex items-center gap-1.5">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-[#8A9A7E] mt-0.5">{item.email}</div>
                            <div className="font-mono text-[11px] text-[#EDE6D3] mt-0.5">{item.phone}</div>
                            <div className="text-[10px] text-[#8A9A7E] mt-0.5">
                              Aadhaar: <span className="font-mono text-[#EDE6D3]">{item.aadharNumber || "N/A"}</span>
                            </div>
                            <div className="text-[10px] text-[#8A9A7E]">
                              {item.gender || "N/A"} • DOB: {item.dob || "N/A"}
                            </div>
                          </td>

                          {/* Postal Address */}
                          <td className="p-3.5 max-w-[220px]">
                            <span className="font-semibold text-[#EDE6D3] block">
                              {item.cityState || "Location not given"}
                            </span>
                            {item.fullAddress ? (
                              <p className="text-[11px] text-[#8A9A7E] mt-1 line-clamp-3 leading-relaxed" title={item.fullAddress}>
                                {item.fullAddress}
                              </p>
                            ) : (
                              <span className="text-[10px] text-amber-400 italic block mt-0.5">
                                Full address missing
                              </span>
                            )}
                            {item.emergencyContactPhone && (
                              <div className="text-[10px] text-[#8A9A7E] mt-1 pt-1 border-t border-[#8A9A7E]/10">
                                Emg: {item.emergencyContactName ? `${item.emergencyContactName} (${item.emergencyContactRelation || "Rel"}): ` : ""}{item.emergencyContactPhone}
                              </div>
                            )}
                          </td>

                          {/* Institution & ID Proof */}
                          <td className="p-3.5 max-w-[200px]">
                            <span className="font-semibold text-[#EDE6D3] block truncate" title={item.institution}>
                              {item.institution}
                            </span>
                            <div className="text-[11px] text-[#8A9A7E] mt-0.5">
                              {item.course || "General"} • {item.yearOfStudy || item.classGrade || "N/A"}
                            </div>
                            {item.rollNumber && (
                              <div className="text-[10px] font-mono text-[#8A9A7E] mt-0.5">
                                Roll: <strong className="text-[#EDE6D3]">{item.rollNumber}</strong>
                              </div>
                            )}
                            {item.idCardUrl ? (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <img
                                  src={item.idCardUrl}
                                  alt="Student ID thumbnail"
                                  onClick={() => setViewProofModal({
                                    url: item.idCardUrl || "",
                                    name: item.idCardName || "Student ID Proof",
                                    candidateName: item.name
                                  })}
                                  className="h-8 w-12 object-cover border border-[#8BA06F]/50 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                />
                                <button
                                  onClick={() => setViewProofModal({
                                    url: item.idCardUrl || "",
                                    name: item.idCardName || "Student ID Proof",
                                    candidateName: item.name
                                  })}
                                  className="text-[9px] text-[#8BA06F] hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                                  title="View uploaded student ID proof"
                                >
                                  <Eye className="h-2.5 w-2.5" />
                                  <span>View ID</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#8A9A7E] italic block mt-1">No ID card attached</span>
                            )}
                          </td>

                          {/* 5 Ranked Country Preferences */}
                          <td className="p-3.5 max-w-[220px]">
                            <div className="space-y-1">
                              {item.pref1Portfolios && item.pref1Portfolios.length > 0 ? (
                                item.pref1Portfolios.map((country, idx) => country ? (
                                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                    <span className={`px-1 py-0.2 text-[9px] font-mono font-bold ${
                                      idx === 0 ? "bg-[#C9A86A] text-[#1A1F1A]" : "bg-[#1A1F1A] text-[#8A9A7E] border border-[#8A9A7E]/30"
                                    }`}>
                                      #{idx + 1}
                                    </span>
                                    <span className={`truncate ${idx === 0 ? "font-bold text-[#EDE6D3]" : "text-[#8A9A7E]"}`}>
                                      {country}
                                    </span>
                                  </div>
                                ) : null)
                              ) : (
                                <span className="font-semibold text-[#EDE6D3]">{item.pref1Country || "Any country"}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#8A9A7E] mt-1.5 pt-1 border-t border-[#8A9A7E]/10">
                              Exp: <strong className="text-[#EDE6D3]">{item.munExperience || "Novice"}</strong>
                            </div>
                          </td>

                          {/* Merch */}
                          <td className="p-3.5">
                            {item.hasMerch ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold uppercase">
                                  <Shirt className="h-2.5 w-2.5" />
                                  Ordered
                                </span>
                                <div className="text-[11px] font-mono font-bold text-amber-300">
                                  Size: {item.merchSize || "M"}
                                </div>
                                <div className="text-[10px] text-emerald-400 font-semibold">
                                  +₹599
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#8A9A7E] italic">No Merch</span>
                            )}
                          </td>

                          {/* Fee & Payment / UTR */}
                          <td className="p-3.5">
                            <span className="font-bold text-emerald-400 font-mono text-sm block">
                              ₹{item.feeAmount !== undefined ? item.feeAmount : (item.hasMerch ? 1498 : 899)}
                            </span>
                            <div className="mt-1 flex items-center gap-1">
                              <span className="font-mono text-[11px] text-[#C9A86A] font-bold bg-[#1A1F1A] px-1.5 py-0.5 border border-[#C9A86A]/40 truncate max-w-[130px]" title={item.utrNumber || item.transactionId}>
                                {item.utrNumber || item.transactionId || "No UTR"}
                              </span>
                              {(item.utrNumber || item.transactionId) && (
                                <button
                                  onClick={() => handleCopyUtr(item.utrNumber || item.transactionId || "")}
                                  className="text-[9px] text-[#8A9A7E] hover:text-[#C9A86A] p-0.5 cursor-pointer"
                                  title="Copy UTR to clipboard"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            {item.payerName && (
                              <div className="text-[10px] text-[#8A9A7E] mt-0.5 truncate max-w-[130px]" title={item.payerName}>
                                By: {item.payerName}
                              </div>
                            )}
                            <div className="mt-1">
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                                item.paymentStatus === "Verified"
                                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40"
                                  : item.paymentStatus === "Rejected"
                                  ? "bg-rose-950/60 text-rose-400 border border-rose-500/40"
                                  : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                              }`}>
                                {item.paymentStatus || "Pending"}
                              </span>
                            </div>
                          </td>

                          {/* Receipt Screenshot */}
                          <td className="p-3.5">
                            {item.paymentScreenshotUrl ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.paymentScreenshotUrl}
                                  alt="Payment Receipt"
                                  onClick={() => setViewProofModal({
                                    url: item.paymentScreenshotUrl || "",
                                    name: item.paymentScreenshotName,
                                    utr: item.utrNumber || item.transactionId,
                                    candidateName: item.name
                                  })}
                                  className="h-10 w-10 object-cover border border-[#C9A86A]/40 rounded hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                                />
                                <button
                                  onClick={() => setViewProofModal({
                                    url: item.paymentScreenshotUrl || "",
                                    name: item.paymentScreenshotName,
                                    utr: item.utrNumber || item.transactionId,
                                    candidateName: item.name
                                  })}
                                  className="text-[10px] text-[#C9A86A] hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>View</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#8A9A7E] italic">None</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <select
                              value={item.status || "Pending Verification"}
                              onChange={(e) => handleUpdateUngaStatus(item.uid || item.id || "", e.target.value)}
                              className={`px-2 py-1 text-[10px] font-sans font-semibold uppercase tracking-wider border focus:outline-none cursor-pointer ${
                                item.status === "Payment Confirmed"
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                                  : item.status === "Portfolio Allotted"
                                  ? "bg-[#C9A86A]/20 text-[#C9A86A] border-[#C9A86A]/40 font-bold"
                                  : item.status === "Waitlisted"
                                  ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                  : item.status === "Rejected"
                                  ? "bg-rose-950/60 text-rose-400 border-rose-500/40"
                                  : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/40"
                              }`}
                            >
                              <option value="Pending Verification" className="bg-[#1A1F1A] text-[#EDE6D3]">Pending Verification</option>
                              <option value="Payment Confirmed" className="bg-[#1A1F1A] text-emerald-400">Payment Confirmed</option>
                              <option value="Portfolio Allotted" className="bg-[#1A1F1A] text-[#C9A86A]">Portfolio Allotted</option>
                              <option value="Waitlisted" className="bg-[#1A1F1A] text-amber-300">Waitlisted</option>
                              <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">Rejected</option>
                            </select>
                            {item.allottedCountry && (
                              <div className="mt-1 text-[10px] text-[#C9A86A] font-semibold flex items-center gap-1">
                                <Award className="h-3 w-3 shrink-0" />
                                <span className="truncate" title={item.allottedCountry}>{item.allottedCountry}</span>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setAllotUngaModalReg(item);
                                  setAllotUngaForm({
                                    country: item.allottedCountry || (item.pref1Portfolios && item.pref1Portfolios[0]) || item.pref1Country || "",
                                    adminNotes: item.adminNotes || ""
                                  });
                                }}
                                className="p-1.5 border border-[#C9A86A]/40 bg-[#2E3B2F] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-[#C9A86A] transition-colors cursor-pointer"
                                title="Allot UNGA Country Portfolio"
                              >
                                <Compass className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedUngaReg(item)}
                                className="p-1.5 border border-[#8A9A7E]/40 bg-[#1A1F1A] hover:bg-[#2E3B2F] text-[#EDE6D3] transition-colors cursor-pointer"
                                title="Inspect Complete Dossier (Every detail filled)"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmUngaDeleteId(item.uid || item.id || "")}
                                className="p-1.5 border border-rose-500/30 bg-[#1A1F1A] hover:bg-rose-900/30 text-rose-400 transition-colors cursor-pointer"
                                title="Delete UNGA Registration"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
                    <option value="uncopuos">UNCOPOUS</option>
                    <option value="unga">UNGA (ONLINE)</option>
                    <option value="unhrc">UNHRC</option>
                    <option value="unodc">UNODC</option>
                    <option value="nes75">NES'75</option>
                    <option value="undp">UNDP</option>
                    <option value="ip_journalism">IP (JOURNALISM)</option>
                    <option value="ip_photojournalism">IP (PHOTOJOURNALISM)</option>
                    <option value="ip">IP (LEGACY)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* UNGA Filter Indicator Banner */}
            {filterCommittee === "unga" && (
              <div className="bg-slate-900 border border-purple-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-200 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-950 border border-purple-500/40 text-purple-400 rounded-xl">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>UNGA (ONLINE COMMITTEE) REGISTRATIONS</span>
                      <span className="px-2 py-0.5 bg-purple-500 text-slate-950 text-[10px] font-mono font-bold rounded">
                        {filtered.length} Applicant{filtered.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Showing UNGA Online Committee registrations. You can review dossiers and attachments here or switch to the dedicated UNGA Online tab.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab("unga")}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer self-start sm:self-auto flex items-center gap-1.5 shadow whitespace-nowrap"
                >
                  <span>Open Dedicated UNGA Tab</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

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
                                onClick={() => {
                                  if (isUngaRecord(item)) {
                                    setSelectedUngaReg(item as any);
                                  } else {
                                    setSelectedReg(item);
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
                                title="Inspect details"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (isUngaRecord(item)) {
                                    setConfirmUngaDeleteId(item.uid || item.id || "");
                                  } else {
                                    setConfirmDeleteId(item.uid || null);
                                  }
                                }}
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

        {/* ========================================================
            SUB-TAB: EXECUTIVE BOARD (EB) APPLICATIONS
           ======================================================== */}
        {activeSubTab === "eb" && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Header & Export Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#C9A86A]/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                    // PRESIDIUM RECRUITMENT
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                    Executive Board Desk
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3] tracking-wide">
                  Executive Board Applications Dossier
                </h2>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                  Review candidates, attached photographs &amp; CVs, agendas, and assign presidium appointments.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => exportEbToExcel()}
                  disabled={ebRegistrations.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  title="Download all Executive Board applications as an Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download EB Excel ({ebRegistrations.length})</span>
                </button>
                {filteredEb.length !== ebRegistrations.length && (
                  <button
                    onClick={() => exportEbToExcel(filteredEb, "Filtered")}
                    disabled={filteredEb.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#C9A86A] bg-[#1A1F1A] hover:bg-[#2E3B2F] text-[#C9A86A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Download currently filtered EB applications as an Excel spreadsheet"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Download Filtered ({filteredEb.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">TOTAL APPLICANTS</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{ebRegistrations.length}</span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300">SHORTLISTED</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {ebRegistrations.filter(r => r.status === "Shortlisted").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-amber-500/30 text-amber-300">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-300">INTERVIEW SCHEDULED</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {ebRegistrations.filter(r => r.status === "Interview Scheduled").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-cyan-500/30 text-cyan-300">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">ACCEPTED</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {ebRegistrations.filter(r => r.status === "Accepted").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">PENDING REVIEW</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {ebRegistrations.filter(r => r.status === "Pending").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#8A9A7E]">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-4">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                <input
                  type="text"
                  placeholder="Search EB candidates by name, email, institution, ID..."
                  value={ebSearch}
                  onChange={(e) => setEbSearch(e.target.value)}
                  className="w-full bg-[#1A1F1A] border border-[#C9A86A]/30 focus:border-[#C9A86A] pl-10 pr-4 py-2 font-sans text-xs text-[#EDE6D3] focus:outline-none transition-all placeholder-[#8A9A7E]/50"
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
                <div className="flex items-center gap-2 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <Filter className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={ebCommitteeFilter}
                    onChange={(e) => setEbCommitteeFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL COMMITTEES</option>
                    <option value="uncopuos" className="bg-[#1A1F1A] text-[#EDE6D3]">UNCOPOUS</option>
                    <option value="unga" className="bg-[#1A1F1A] text-[#EDE6D3]">UNGA (ONLINE)</option>
                    <option value="unhrc" className="bg-[#1A1F1A] text-[#EDE6D3]">UNHRC</option>
                    <option value="unodc" className="bg-[#1A1F1A] text-[#EDE6D3]">UNODC</option>
                    <option value="nes75" className="bg-[#1A1F1A] text-[#EDE6D3]">NES'75</option>
                    <option value="undp" className="bg-[#1A1F1A] text-[#EDE6D3]">UNDP</option>
                    <option value="ip_journalism" className="bg-[#1A1F1A] text-[#EDE6D3]">IP (JOURNALISM)</option>
                    <option value="ip_photojournalism" className="bg-[#1A1F1A] text-[#EDE6D3]">IP (PHOTOJOURNALISM)</option>
                    <option value="ip" className="bg-[#1A1F1A] text-[#EDE6D3]">INTERNATIONAL PRESS (ALL)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <select
                    value={ebStatusFilter}
                    onChange={(e) => setEbStatusFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL STATUSES</option>
                    <option value="Pending" className="bg-[#1A1F1A] text-[#EDE6D3]">PENDING</option>
                    <option value="Shortlisted" className="bg-[#1A1F1A] text-amber-300">SHORTLISTED</option>
                    <option value="Interview Scheduled" className="bg-[#1A1F1A] text-cyan-300">INTERVIEW SCHEDULED</option>
                    <option value="Accepted" className="bg-[#1A1F1A] text-emerald-400">ACCEPTED</option>
                    <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">REJECTED</option>
                  </select>
                </div>
              </div>
            </div>

            {/* EB Table */}
            <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-[#C9A86A]/30 bg-[#2E3B2F] font-sans text-[10px] uppercase tracking-[0.16em] text-[#C9A86A] font-semibold">
                      <th className="p-3.5">Candidate</th>
                      <th className="p-3.5">Dossier ID</th>
                      <th className="p-3.5">Institution</th>
                      <th className="p-3.5">1st Preference</th>
                      <th className="p-3.5">2nd Preference</th>
                      <th className="p-3.5">Track Record</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A9A7E]/15 font-sans text-xs">
                    {filteredEb.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-[#8A9A7E]">
                          No Executive Board applications match your current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredEb.map((item) => (
                        <tr key={item.id} className="hover:bg-[#2E3B2F]/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              {item.photoUrl ? (
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="h-9 w-9 rounded-full object-cover border border-[#C9A86A]/50 shrink-0"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-[#2E3B2F] border border-[#C9A86A]/40 flex items-center justify-center font-serif text-xs text-[#C9A86A] shrink-0">
                                  {item.name?.[0] || "E"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-medium text-[#EDE6D3] block truncate">{item.name}</span>
                                <span className="font-mono text-[10px] text-[#8A9A7E] block truncate">{item.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-[#C9A86A]">{item.id}</td>
                          <td className="p-3.5">
                            <span className="text-[#EDE6D3] block truncate max-w-[180px]">{item.institution}</span>
                            <span className="text-[10px] text-[#8A9A7E] block">{item.course} • {item.yearOfStudy}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-[#C9A86A] font-medium block uppercase text-[11px]">{item.pref1Role}</span>
                            <span className="text-[10px] text-[#8A9A7E] uppercase">{item.pref1Committee}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-[#EDE6D3] block uppercase text-[11px]">{item.pref2Role}</span>
                            <span className="text-[10px] text-[#8A9A7E] uppercase">{item.pref2Committee}</span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-[#8A9A7E]">
                            <div>Del: {item.munDelegateCount}</div>
                            <div>EB: {item.munEbCount}</div>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateEbStatus(item.id, e.target.value as any)}
                              className={`px-2 py-1 text-[10px] font-sans font-semibold uppercase tracking-wider border focus:outline-none cursor-pointer ${
                                item.status === "Accepted"
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                                  : item.status === "Shortlisted"
                                  ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                  : item.status === "Interview Scheduled"
                                  ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40"
                                  : item.status === "Rejected"
                                  ? "bg-rose-950/60 text-rose-400 border-rose-500/40"
                                  : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/40"
                              }`}
                            >
                              <option value="Pending" className="bg-[#1A1F1A] text-[#EDE6D3]">Pending</option>
                              <option value="Shortlisted" className="bg-[#1A1F1A] text-amber-300">Shortlisted</option>
                              <option value="Interview Scheduled" className="bg-[#1A1F1A] text-cyan-300">Interview Scheduled</option>
                              <option value="Accepted" className="bg-[#1A1F1A] text-emerald-400">Accepted</option>
                              <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">Rejected</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedEb(item)}
                                className="p-1.5 border border-[#C9A86A]/40 bg-[#2E3B2F] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-[#EDE6D3] transition-colors cursor-pointer"
                                title="Inspect Dossier"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmEbDeleteId(item.id)}
                                className="p-1.5 border border-rose-500/30 bg-[#1A1F1A] hover:bg-rose-900/30 text-rose-400 transition-colors cursor-pointer"
                                title="Delete Dossier"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: CAMPUS AMBASSADOR APPLICATIONS
           ======================================================== */}
        {activeSubTab === "campus-ambassador" && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Header & Export Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#8BA06F]/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#8BA06F] font-bold">
                    // OUTREACH FELLOWSHIP
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                    Campus Ambassador Network
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3] tracking-wide">
                  Campus Ambassador Registrations
                </h2>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                  Track student representatives from institutions nationwide mobilized for IISTMUN 2027.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => exportCaToExcel()}
                  disabled={caRegistrations.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8BA06F] hover:bg-[#a1b783] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  title="Download all campus ambassadors as an Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Ambassador Excel ({caRegistrations.length})</span>
                </button>
                {filteredCa.length !== caRegistrations.length && (
                  <button
                    onClick={() => exportCaToExcel(filteredCa, "Filtered")}
                    disabled={filteredCa.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#8BA06F] bg-[#1A1F1A] hover:bg-[#2E3B2F] text-[#8BA06F] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Download currently filtered Campus Ambassadors as an Excel spreadsheet"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Download Filtered ({filteredCa.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="border border-[#8BA06F]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">TOTAL AMBASSADORS</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{caRegistrations.length}</span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#8BA06F]/30 text-[#8BA06F]">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#8BA06F]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">VERIFIED &amp; ACTIVE</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {caRegistrations.filter(r => r.status === "Verified" || r.status === "Accepted").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#8BA06F]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300">SHORTLISTED</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {caRegistrations.filter(r => r.status === "Shortlisted").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-amber-500/30 text-amber-300">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="border border-[#8BA06F]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">PENDING REVIEW</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl font-normal text-[#EDE6D3]">
                    {caRegistrations.filter(r => r.status === "Pending").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#8A9A7E]">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-[#2E3B2F]/60 border border-[#8BA06F]/30 p-4">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                <input
                  type="text"
                  placeholder="Search ambassadors by name, phone, institution, city..."
                  value={caSearch}
                  onChange={(e) => setCaSearch(e.target.value)}
                  className="w-full bg-[#1A1F1A] border border-[#8BA06F]/30 focus:border-[#8BA06F] pl-10 pr-4 py-2 font-sans text-xs text-[#EDE6D3] focus:outline-none transition-all placeholder-[#8A9A7E]/50"
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
                <div className="flex items-center gap-2 bg-[#1A1F1A] border border-[#8BA06F]/30 px-3 py-1.5">
                  <Filter className="h-3 w-3 text-[#8BA06F]" />
                  <select
                    value={caStatusFilter}
                    onChange={(e) => setCaStatusFilter(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL STATUSES</option>
                    <option value="Pending" className="bg-[#1A1F1A] text-[#EDE6D3]">PENDING</option>
                    <option value="Verified" className="bg-[#1A1F1A] text-emerald-400">VERIFIED</option>
                    <option value="Shortlisted" className="bg-[#1A1F1A] text-amber-300">SHORTLISTED</option>
                    <option value="Accepted" className="bg-[#1A1F1A] text-cyan-300">ACCEPTED</option>
                    <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">REJECTED</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CA Table */}
            <div className="border border-[#8BA06F]/30 bg-[#1A1F1A]/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#8BA06F]/30 bg-[#2E3B2F] font-sans text-[10px] uppercase tracking-[0.16em] text-[#8BA06F] font-semibold">
                      <th className="p-3.5">Ambassador</th>
                      <th className="p-3.5">Fellowship ID</th>
                      <th className="p-3.5">Institution &amp; City</th>
                      <th className="p-3.5">Target Mobilization</th>
                      <th className="p-3.5">Clubs &amp; Socials</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A9A7E]/15 font-sans text-xs">
                    {filteredCa.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-[#8A9A7E]">
                          No Campus Ambassador registrations match your current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCa.map((item) => (
                        <tr key={item.id} className="hover:bg-[#2E3B2F]/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              {item.photoUrl ? (
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="h-9 w-9 rounded-full object-cover border border-[#8BA06F]/50 shrink-0"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-[#2E3B2F] border border-[#8BA06F]/40 flex items-center justify-center font-serif text-xs text-[#8BA06F] shrink-0">
                                  {item.name?.[0] || "C"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-medium text-[#EDE6D3] block truncate">{item.name}</span>
                                <span className="font-mono text-[10px] text-[#8A9A7E] block truncate">{item.email}</span>
                                <span className="font-mono text-[10px] text-[#8BA06F] block truncate">{item.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-[#8BA06F]">{item.id}</td>
                          <td className="p-3.5">
                            <span className="text-[#EDE6D3] block truncate max-w-[200px]">{item.institution}</span>
                            <span className="text-[10px] text-[#8A9A7E] block">{item.cityState}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="inline-block px-2.5 py-1 text-[10px] font-mono border border-[#8BA06F]/40 bg-[#8BA06F]/15 text-[#EDE6D3]">
                              {item.targetMobilization}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-[#EDE6D3] block text-[11px] truncate max-w-[150px]">{item.collegeClubs || "N/A"}</span>
                            <span className="text-[10px] font-mono text-[#8A9A7E] block truncate max-w-[150px]">{item.socialHandles || "N/A"}</span>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateCaStatus(item.id, e.target.value as any)}
                              className={`px-2 py-1 text-[10px] font-sans font-semibold uppercase tracking-wider border focus:outline-none cursor-pointer ${
                                item.status === "Verified" || item.status === "Accepted"
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                                  : item.status === "Shortlisted"
                                  ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                  : item.status === "Rejected"
                                  ? "bg-rose-950/60 text-rose-400 border-rose-500/40"
                                  : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/40"
                              }`}
                            >
                              <option value="Pending" className="bg-[#1A1F1A] text-[#EDE6D3]">Pending</option>
                              <option value="Verified" className="bg-[#1A1F1A] text-emerald-400">Verified</option>
                              <option value="Shortlisted" className="bg-[#1A1F1A] text-amber-300">Shortlisted</option>
                              <option value="Accepted" className="bg-[#1A1F1A] text-cyan-300">Accepted</option>
                              <option value="Rejected" className="bg-[#1A1F1A] text-rose-400">Rejected</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedCa(item)}
                                className="p-1.5 border border-[#8BA06F]/40 bg-[#2E3B2F] hover:bg-[#8BA06F] hover:text-[#1A1F1A] text-[#EDE6D3] transition-colors cursor-pointer"
                                title="Inspect Ambassador Profile"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmCaDeleteId(item.id)}
                                className="p-1.5 border border-rose-500/30 bg-[#1A1F1A] hover:bg-rose-900/30 text-rose-400 transition-colors cursor-pointer"
                                title="Delete Ambassador Record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/40 font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                        <th className="p-4 pl-6 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-cyan-400" />
                          Portfolio / Nation
                        </th>
                        <th className="p-3">UNCOPOUS</th>
                        <th className="p-3">UNGA</th>
                        <th className="p-3">UNHRC</th>
                        <th className="p-3">UNODC</th>
                        <th className="p-3">NES'75</th>
                        <th className="p-3">UNDP</th>
                        <th className="p-3">IP (JOUR)</th>
                        <th className="p-3">IP (PHOTO)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 font-sans text-xs">
                      {COUNTRY_MATRIX.filter((row) =>
                        row.country.toLowerCase().includes(portfolioSearch.toLowerCase())
                      ).map((row) => (
                        <tr key={row.country} className="hover:bg-slate-900/10 transition-colors">
                          <td className="p-4 pl-6 font-bold text-white whitespace-nowrap">{row.country}</td>
                          <td className="p-3">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="uncopuos"
                              currentStatus={getPortfolioStatus(row.country, "uncopuos", row.uncopuos || "Available")}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-3">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="unga"
                              currentStatus={getPortfolioStatus(row.country, "unga", row.unga || "Available")}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-3">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="unhrc"
                              currentStatus={getPortfolioStatus(row.country, "unhrc", row.unhrc || "Available")}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-3">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="unodc"
                              currentStatus={getPortfolioStatus(row.country, "unodc", row.unodc || "Available")}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-3">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="nes75"
                              currentStatus={getPortfolioStatus(row.country, "nes75", row.nes75 || "Reserved")}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-3">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="undp"
                              currentStatus={getPortfolioStatus(row.country, "undp", row.undp || "Available")}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-3">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="ip_journalism"
                              currentStatus={getPortfolioStatus(row.country, "ip_journalism", row.ip_journalism || "Reserved")}
                              onUpdate={updatePortfolioStatus}
                            />
                          </td>
                          <td className="p-3">
                            <PortfolioStatusSelector
                              country={row.country}
                              committee="ip_photojournalism"
                              currentStatus={getPortfolioStatus(row.country, "ip_photojournalism", row.ip_photojournalism || "Reserved")}
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

        {activeSubTab === "queries" && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Header & Export Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#C9A86A]/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                    // ARCHIVAL TELEMETRY
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E]">
                    Contact Desk
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3] tracking-wide">
                  Secretariat Diplomatic Dispatches &amp; Inquiries
                </h2>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                  Dispatches logged directly from the portal's Contact Us desk to support@iistmun.org and stored in Firebase.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={exportQueriesToExcel}
                  disabled={contactQueries.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  title="Download all filtered queries as an Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  onClick={exportQueriesToCSV}
                  disabled={contactQueries.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#C9A86A]/40 bg-[#2E3B2F] hover:bg-[#1A1F1A] text-[#EDE6D3] font-sans text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export filtered queries as CSV"
                >
                  <Download className="h-3.5 w-3.5 text-[#C9A86A]" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Inquiries Category Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">TOTAL INQUIRIES</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3]">{contactQueries.length}</span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A]">EB APPLICATIONS</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3]">
                    {contactQueries.filter(q => q.category === "EB Application").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">CAMPUS AMBASSADOR</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3]">
                    {contactQueries.filter(q => q.category === "Campus Ambassador Fellowship").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#8A9A7E]">
                    <Compass className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
              <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] p-4 text-left shadow-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E]">DELEGATIONS &amp; GENERAL</span>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3]">
                    {contactQueries.filter(q => q.category !== "EB Application" && q.category !== "Campus Ambassador Fellowship").length}
                  </span>
                  <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#8A9A7E]">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-4">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                <input
                  type="text"
                  placeholder="Search inquiries by name, email, keyword, reference..."
                  value={queriesSearch}
                  onChange={(e) => setQueriesSearch(e.target.value)}
                  className="w-full bg-[#1A1F1A] border border-[#C9A86A]/30 focus:border-[#C9A86A] pl-10 pr-4 py-2 font-sans text-xs text-[#EDE6D3] focus:outline-none transition-all placeholder-[#8A9A7E]/50"
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
                <div className="flex items-center gap-2 bg-[#1A1F1A] border border-[#C9A86A]/30 px-3 py-1.5">
                  <Filter className="h-3 w-3 text-[#C9A86A]" />
                  <select
                    value={filterQueryCategory}
                    onChange={(e) => setFilterQueryCategory(e.target.value)}
                    className="bg-transparent text-[#EDE6D3] font-sans text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A1F1A] text-[#EDE6D3]">ALL INQUIRY CATEGORIES</option>
                    <option value="EB Application" className="bg-[#1A1F1A] text-[#EDE6D3]">EB APPLICATION</option>
                    <option value="Campus Ambassador Fellowship" className="bg-[#1A1F1A] text-[#EDE6D3]">CAMPUS AMBASSADOR</option>
                    <option value="School Delegation" className="bg-[#1A1F1A] text-[#EDE6D3]">SCHOOL DELEGATION</option>
                    <option value="General Inquiry" className="bg-[#1A1F1A] text-[#EDE6D3]">GENERAL INQUIRY</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Queries Table */}
            <div className="border border-[#C9A86A]/30 bg-[#2E3B2F] overflow-hidden shadow-xl text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-[#C9A86A]/20 bg-[#1A1F1A] font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold">
                      <th className="p-4 pl-6">Reference / Date</th>
                      <th className="p-4">Sender Information</th>
                      <th className="p-4">Inquiry Category</th>
                      <th className="p-4">Message / Dispatch</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9A86A]/10 font-sans text-xs">
                    {filteredQueries.map((query) => (
                      <tr key={query.id} className="hover:bg-[#1A1F1A]/50 transition-colors">
                        <td className="p-4 pl-6">
                          <span className="font-mono text-[10px] text-[#C9A86A] block font-semibold">
                            {query.id ? (query.id.length > 14 ? query.id.slice(0, 14) + "..." : query.id) : "Ref: Pending"}
                          </span>
                          <span className="font-mono text-[10px] text-[#8A9A7E] block mt-0.5">
                            {query.timestamp || "Recent"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-[#EDE6D3] block">{query.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-[#8A9A7E] font-mono">{query.email}</span>
                            <a
                              href={`mailto:${query.email}?subject=Re: IISTMUN 2027 Inquiry [${encodeURIComponent(query.category)}]`}
                              className="text-[#C9A86A] hover:text-[#EDE6D3] transition-colors"
                              title="Direct Email Reply"
                            >
                              <ExternalLink className="h-3 w-3 inline" />
                            </a>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border ${
                            query.category === "EB Application"
                              ? "border-[#C9A86A]/60 bg-[#C9A86A]/15 text-[#C9A86A]"
                              : query.category === "Campus Ambassador Fellowship"
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                              : query.category === "School Delegation"
                              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                              : "border-[#8A9A7E]/40 bg-[#1A1F1A] text-[#EDE6D3]"
                          }`}>
                            {query.category}
                          </span>
                        </td>
                        <td className="p-4 max-w-md">
                          <p className="text-[#EDE6D3]/80 line-clamp-2 leading-relaxed text-xs">
                            {query.message}
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedQuery(query)}
                              className="px-3 py-1.5 border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#C9A86A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] transition-all font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                              title="Inspect Full Query"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => setConfirmQueryDeleteId(query.id || null)}
                              className="p-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all cursor-pointer"
                              title="Delete Query"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredQueries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-[#8A9A7E] font-sans text-xs">
                          <Inbox className="h-8 w-8 text-[#8A9A7E]/50 mx-auto mb-2" />
                          <p className="font-serif text-base text-[#EDE6D3]">No contact dispatches found</p>
                          <p className="text-[11px] text-[#8A9A7E] mt-1">
                            {queriesSearch || filterQueryCategory !== "all"
                              ? "No queries match your current search/filter parameters."
                              : "No dispatches have been submitted yet. Inquiries transmitted via the portal will appear here in real-time."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Firestore Database Management View */}
        {activeSubTab === "database" && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Database Overview Banner */}
            <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] p-6 sm:p-8 relative shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold">
                      // CLOUD FIRESTORE MASTER CONTROL
                    </span>
                    <span className="px-2 py-0.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#EDE6D3] font-mono text-[9px]">
                      Named DB: ai-studio-iistmun2026-eec64fd6-f326-409b-be6b-3f273a2e6e5d
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3]">
                    Conference Database & Collections
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-[#8A9A7E] mt-2 max-w-2xl leading-relaxed">
                    All website interfaces, public portals, schedules, country matrices, and registration records
                    communicate directly and exclusively with Google Cloud Firestore. No static JSON storage is utilized.
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                  <button
                    onClick={refreshCollectionStats}
                    disabled={loadingCounts}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#C9A86A]/40 bg-[#1A1F1A] hover:border-[#C9A86A] hover:text-[#C9A86A] text-[#EDE6D3] text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingCounts ? "animate-spin" : ""}`} />
                    <span>{loadingCounts ? "Scanning..." : "Scan Collections"}</span>
                  </button>
                  <button
                    onClick={handleSeedAll}
                    disabled={isSeeding}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#C9A86A]/50 bg-[#1A1F1A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-[#EDE6D3] text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Layers className={`h-4 w-4 ${isSeeding ? "animate-spin" : ""}`} />
                    <span>Seed Content (5 Tables)</span>
                  </button>
                  <button
                    onClick={handleSyncLocalToCloud}
                    disabled={isSyncingCloud}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#8BA06F] bg-[#1A1F1A] hover:bg-[#8BA06F] hover:text-[#1A1F1A] text-[#8BA06F] text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    title="Upload all local priority and UNGA registration dossiers directly to Cloud Firestore"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncingCloud ? "animate-spin" : ""}`} />
                    <span>{isSyncingCloud ? "Syncing to Cloud..." : "Sync Dossiers to Cloud"}</span>
                  </button>
                  <button
                    onClick={handlePurgeSampleData}
                    disabled={isPurging || isSeeding || isSyncingCloud}
                    className="flex items-center gap-2 px-4 py-2.5 border border-rose-500/50 bg-[#1A1F1A] hover:bg-rose-950/50 text-rose-300 text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    title="Remove any example or sample records from the database"
                  >
                    <Trash2 className={`h-4 w-4 ${isPurging ? "animate-spin" : ""}`} />
                    <span>{isPurging ? "Purging..." : "Purge Example Data"}</span>
                  </button>

                </div>
              </div>

              {/* Seed Feedback Alert */}
              {seedResult && (
                <div
                  className={`mt-6 p-4 border flex items-start justify-between gap-3 ${
                    seedResult.success
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                      : "bg-rose-950/40 border-rose-500/40 text-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {seedResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-sans text-xs font-semibold">
                        {seedResult.success ? "Database Synchronized" : "Sync Error"}
                      </p>
                      <p className="font-sans text-xs opacity-90 mt-0.5">{seedResult.message}</p>
                      {!seedResult.success && (
                        <div className="mt-3 pt-3 border-t border-rose-500/30 text-[11px] text-rose-200 space-y-1">
                          <p className="font-bold text-[#C9A86A] uppercase tracking-wider text-[10px]">
                            Required Step: Deploy Security Rules
                          </p>
                          <p>
                            Cloud Firestore denies writes to new collections (<code className="text-[#EDE6D3]">committees</code>, <code className="text-[#EDE6D3]">secretariat</code>, etc.) until the security rules are published in the cloud console:
                          </p>
                          <ol className="list-decimal pl-4 space-y-0.5 mt-1 text-[#EDE6D3]">
                            <li>
                              Click the <strong className="text-[#C9A86A]">"Copy firestore.rules"</strong> button below.
                            </li>
                            <li>
                              Open{" "}
                              <a
                                href="https://console.firebase.google.com/project/gen-lang-client-0802094651/firestore/databases/ai-studio-iistmun2026-eec64fd6-f326-409b-be6b-3f273a2e6e5d/rules"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#C9A86A] underline font-medium hover:text-white"
                              >
                                Firebase Console &rarr; Firestore &rarr; Named DB ({firebaseConfig.firestoreDatabaseId}) &rarr; Rules
                              </a>
                            </li>
                            <li>
                              Paste the copied rules and click <strong className="text-white">"Publish"</strong>. Then all candidate registrations will appear live in both the Cloud Database and the Admin Console!
                            </li>
                          </ol>
                          <div className="pt-3 flex flex-wrap items-center gap-2">
                            <button
                              onClick={handleCopyRules}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1F1A] border border-[#C9A86A] text-[#C9A86A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans font-semibold transition-all cursor-pointer shadow"
                            >
                              {copiedRules ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedRules ? "Copied to Clipboard!" : "Copy firestore.rules"}</span>
                            </button>
                            <a
                              href="https://console.firebase.google.com/project/gen-lang-client-0802094651/firestore/databases/ai-studio-iistmun2026-eec64fd6-f326-409b-be6b-3f273a2e6e5d/rules"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2E3B2F] border border-[#C9A86A]/40 text-[#EDE6D3] hover:text-white text-xs font-sans font-semibold transition-all"
                            >
                              <span>Open Cloud Rules Console &rarr;</span>
                            </a>
                            <a
                              href="https://console.firebase.google.com/project/gen-lang-client-0802094651/firestore/databases/ai-studio-iistmun2026-eec64fd6-f326-409b-be6b-3f273a2e6e5d/data"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#C9A86A] hover:text-white text-xs font-sans font-semibold transition-all"
                            >
                              <span>Open Cloud Data Console &rarr;</span>
                            </a>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                  <button
                    onClick={() => setSeedResult(null)}
                    className="text-current opacity-60 hover:opacity-100 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Section 1: Master Conference Content Tables */}
            <div>
              <div className="border-b border-[#C9A86A]/20 pb-3 mb-6">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                  // SECTION 01: PUBLIC MASTER TABLES
                </span>
                <h3 className="font-serif text-xl font-normal text-[#EDE6D3] mt-1">
                  Conference Content Collections (Live Website Subscriptions)
                </h3>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                  These tables hold the core information displayed across website pages. If a collection is empty, click "Seed Table" to populate it with official IISTMUN 2026 data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Committees */}
                <div className="bg-[#2E3B2F] border border-[#C9A86A]/30 p-5 flex flex-col justify-between hover:border-[#C9A86A] transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        collection: committees
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                        (collectionCounts.committees ?? 0) > 0
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                      }`}>
                        {collectionCounts.committees ?? "..."} docs
                      </span>
                    </div>
                    <h4 className="font-serif text-lg text-[#EDE6D3]">Committees & Agendas</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
                      UNCOPUOS, UNHRC, UNODC, NES'75, UNGA, UNDP, and IP committee briefs, agendas, background guides, and chair details rendered live in <code className="text-[#C9A86A]">Committees.tsx</code>.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#C9A86A]/20 flex items-center justify-between">
                    <span className="font-sans text-[11px] text-[#8A9A7E]">Read: Public | Write: Admin</span>
                    <button
                      onClick={() => handleSeedIndividual("committees")}
                      disabled={isSeeding}
                      className="px-3 py-1.5 border border-[#C9A86A]/50 bg-[#1A1F1A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans text-[#EDE6D3] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Seed Table
                    </button>
                  </div>
                </div>

                {/* Secretariat */}
                <div className="bg-[#2E3B2F] border border-[#C9A86A]/30 p-5 flex flex-col justify-between hover:border-[#C9A86A] transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        collection: secretariat
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                        (collectionCounts.secretariat ?? 0) > 0
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                      }`}>
                        {collectionCounts.secretariat ?? "..."} docs
                      </span>
                    </div>
                    <h4 className="font-serif text-lg text-[#EDE6D3]">Secretariat Staff</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
                      Official Secretary-General, Director-Generals, and Charge d'Affaires roster and portraits rendered live in <code className="text-[#C9A86A]">Secretariat.tsx</code>.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#C9A86A]/20 flex items-center justify-between">
                    <span className="font-sans text-[11px] text-[#8A9A7E]">Read: Public | Write: Admin</span>
                    <button
                      onClick={() => handleSeedIndividual("secretariat")}
                      disabled={isSeeding}
                      className="px-3 py-1.5 border border-[#C9A86A]/50 bg-[#1A1F1A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans text-[#EDE6D3] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Seed Table
                    </button>
                  </div>
                </div>

                {/* FAQs */}
                <div className="bg-[#2E3B2F] border border-[#C9A86A]/30 p-5 flex flex-col justify-between hover:border-[#C9A86A] transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        collection: faqs
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                        (collectionCounts.faqs ?? 0) > 0
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                      }`}>
                        {collectionCounts.faqs ?? "..."} docs
                      </span>
                    </div>
                    <h4 className="font-serif text-lg text-[#EDE6D3]">Conference FAQs</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
                      Categorized delegate questions, accommodation guides, payment instructions, and rules of procedure rendered live in <code className="text-[#C9A86A]">FAQs.tsx</code>.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#C9A86A]/20 flex items-center justify-between">
                    <span className="font-sans text-[11px] text-[#8A9A7E]">Read: Public | Write: Admin</span>
                    <button
                      onClick={() => handleSeedIndividual("faqs")}
                      disabled={isSeeding}
                      className="px-3 py-1.5 border border-[#C9A86A]/50 bg-[#1A1F1A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans text-[#EDE6D3] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Seed Table
                    </button>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-[#2E3B2F] border border-[#C9A86A]/30 p-5 flex flex-col justify-between hover:border-[#C9A86A] transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        collection: schedule
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                        (collectionCounts.schedule ?? 0) > 0
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                      }`}>
                        {collectionCounts.schedule ?? "..."} docs
                      </span>
                    </div>
                    <h4 className="font-serif text-lg text-[#EDE6D3]">Schedule & Itinerary</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
                      Day-by-day session timeline, committee debates, social night, and valedictory ceremony rendered live in <code className="text-[#C9A86A]">Schedule.tsx</code>.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#C9A86A]/20 flex items-center justify-between">
                    <span className="font-sans text-[11px] text-[#8A9A7E]">Read: Public | Write: Admin</span>
                    <button
                      onClick={() => handleSeedIndividual("schedule")}
                      disabled={isSeeding}
                      className="px-3 py-1.5 border border-[#C9A86A]/50 bg-[#1A1F1A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans text-[#EDE6D3] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Seed Table
                    </button>
                  </div>
                </div>

                {/* Country Matrix */}
                <div className="bg-[#2E3B2F] border border-[#C9A86A]/30 p-5 flex flex-col justify-between hover:border-[#C9A86A] transition-all md:col-span-2">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        collection: country_matrix
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                        (collectionCounts.country_matrix ?? 0) > 0
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                      }`}>
                        {collectionCounts.country_matrix ?? "..."} docs
                      </span>
                    </div>
                    <h4 className="font-serif text-lg text-[#EDE6D3]">Master Country Matrix (193 Nations)</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
                      Complete baseline portfolio seats across UNCOPUOS, UNHRC, UNODC, NES'75, UNGA, UNDP, and IP. Rendered live in <code className="text-[#C9A86A]">CountryMatrix.tsx</code> and merged with dynamic reservation states in <code className="text-[#C9A86A]">portfolio_states</code>.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#C9A86A]/20 flex items-center justify-between">
                    <span className="font-sans text-[11px] text-[#8A9A7E]">Read: Public | Write: Admin</span>
                    <button
                      onClick={() => handleSeedIndividual("country_matrix")}
                      disabled={isSeeding}
                      className="px-4 py-1.5 border border-[#C9A86A]/50 bg-[#1A1F1A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans text-[#EDE6D3] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Seed Full Country Matrix
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Transactional Collections (Inquiries, Registrations, Overrides) */}
            <div className="pt-6">
              <div className="border-b border-[#C9A86A]/20 pb-3 mb-6">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                  // SECTION 02: TRANSACTIONAL REGISTRIES
                </span>
                <h3 className="font-serif text-xl font-normal text-[#EDE6D3] mt-1">
                  Live Intake & Submission Records (Direct Ingestion)
                </h3>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                  Public registrations and inquiries submitted via portals are streamed in real time to these collections.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Delegate Registrations */}
                <div className="bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        registrations
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/30">
                        {collectionCounts.registrations ?? registrations.length} records
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#EDE6D3]">Delegates & Contingents</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                      Submitted via Registration Modal. Stores delegate credentials, committee choices, contingent tickets, and payment verification.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#C9A86A]/20">
                    <button
                      onClick={() => setActiveSubTab("registrations")}
                      className="text-xs font-sans text-[#C9A86A] hover:underline cursor-pointer"
                    >
                      View in Ledger &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-[#8A9A7E]">Live Submissions</span>
                  </div>
                </div>

                {/* UNGA Online Registrations */}
                <div className="bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        unga_registrations
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/30">
                        {collectionCounts.unga_registrations ?? ungaRegistrations.length} delegates
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#EDE6D3]">UNGA Online Delegations</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                      Submitted via UNGA Virtual Portal. Stores portfolio preferences, past MUN experience, speech drafts, UPI UTR proofs, and country assignments.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#C9A86A]/20">
                    <button
                      onClick={() => setActiveSubTab("unga")}
                      className="text-xs font-sans text-[#C9A86A] hover:underline cursor-pointer"
                    >
                      View in UNGA Ledger &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-[#8A9A7E]">Online Edition</span>
                  </div>
                </div>

                {/* Priority Round Registrations */}
                <div className="bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        priority_registrations
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/30">
                        {collectionCounts.priority_registrations ?? priorityRegistrations.length} candidates
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#EDE6D3]">Priority Round Dossiers</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                      Submitted via Priority Delegate Accreditation form. Stores academic dossiers, council preferences, UPI UTR proofs, and allotment statuses.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#C9A86A]/20">
                    <button
                      onClick={() => setActiveSubTab("priority")}
                      className="text-xs font-sans text-[#C9A86A] hover:underline cursor-pointer"
                    >
                      View in Priority Ledger &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-[#8A9A7E]">Priority Intake</span>
                  </div>
                </div>

                {/* Executive Board */}
                <div className="bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        eb_registrations
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/30">
                        {collectionCounts.eb_registrations ?? ebRegistrations.length} applications
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#EDE6D3]">Executive Board Dossiers</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                      Submitted via RegisterPortal. Stores EB candidatures, past chairing accolades, study guide samples, and agendas.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#C9A86A]/20">
                    <button
                      onClick={() => setActiveSubTab("eb")}
                      className="text-xs font-sans text-[#C9A86A] hover:underline cursor-pointer"
                    >
                      View Dossiers &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-[#8A9A7E]">Live Submissions</span>
                  </div>
                </div>

                {/* Campus Ambassadors */}
                <div className="bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        campus_ambassador_registrations
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/30">
                        {collectionCounts.campus_ambassador_registrations ?? caRegistrations.length} ambassadors
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#EDE6D3]">Campus Ambassadors</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                      Submitted via RegisterPortal. Stores campus leads, mobilization targets, social profiles, and promo strategies.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#C9A86A]/20">
                    <button
                      onClick={() => setActiveSubTab("campus-ambassador")}
                      className="text-xs font-sans text-[#C9A86A] hover:underline cursor-pointer"
                    >
                      View Ambassadors &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-[#8A9A7E]">Live Submissions</span>
                  </div>
                </div>

                {/* Diplomacy Workshop */}
                <div className="bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        workshop_registrations
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/30">
                        {collectionCounts.workshop_registrations ?? workshopRegistrations.length} cohorts
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#EDE6D3]">Diplomacy Workshop</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                      Stores school delegations, student counts, teacher-in-charge contacts, and training requests.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#C9A86A]/20">
                    <button
                      onClick={() => setActiveSubTab("workshop")}
                      className="text-xs font-sans text-[#C9A86A] hover:underline cursor-pointer"
                    >
                      View Cohorts &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-[#8A9A7E]">Live Submissions</span>
                  </div>
                </div>

                {/* Contact Inquiries */}
                <div className="bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        contact_queries
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/30">
                        {collectionCounts.contact_queries ?? contactQueries.length} dispatches
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#EDE6D3]">Contact Queries</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                      Submitted via Home page contact desk. Stores participant inquiries, sponsorships, and secretariat messages.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#C9A86A]/20">
                    <button
                      onClick={() => setActiveSubTab("queries")}
                      className="text-xs font-sans text-[#C9A86A] hover:underline cursor-pointer"
                    >
                      View Inquiries &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-[#8A9A7E]">Live Submissions</span>
                  </div>
                </div>


                {/* Portfolio States & Sent Emails */}
                <div className="bg-[#2E3B2F]/60 border border-[#C9A86A]/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] font-bold uppercase tracking-wider">
                        portfolio_states & sent_emails
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/30">
                        {(collectionCounts.portfolio_states ?? 0) + (collectionCounts.sent_emails ?? 0)} records
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#EDE6D3]">Overrides & Mail Receipts</h4>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                      <code className="text-[#C9A86A]">portfolio_states</code> ({collectionCounts.portfolio_states ?? 0}) stores live seat statuses (Available/Assigned/Reserved). <code className="text-[#C9A86A]">sent_emails</code> ({collectionCounts.sent_emails ?? 0}) logs confirmation emails.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#C9A86A]/20">
                    <span className="text-[11px] text-[#8A9A7E]">System Managed</span>
                    <button
                      onClick={() => setActiveSubTab("registrations")}
                      className="text-xs font-sans text-[#C9A86A] hover:underline cursor-pointer"
                    >
                      Inspect Overrides &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Modal (General Delegates only; UNGA Online uses the exhaustive dossier) */}
        {selectedReg && !isUngaRecord(selectedReg) && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in" id="admin-inspector-modal">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl my-8 text-left">
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => setSelectedReg(null)}
                    className="p-1.5 border border-[#C9A86A]/40 bg-[#1A1F1A] hover:border-[#C9A86A] text-[#EDE6D3] hover:text-[#C9A86A] transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Modal Header */}
                <div className="text-left border-b border-[#C9A86A]/30 pb-4 mb-6">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold block">// SECRETARIAT DOSSIER: {selectedReg.id}</span>
                  <h3 className="font-serif text-2xl font-normal text-[#EDE6D3] mt-1 flex items-center gap-3">
                    {selectedReg.name}
                    <span className="px-2 py-0.5 text-[9px] font-bold font-sans uppercase border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#C9A86A]">
                      {selectedReg.role || "Delegate"}
                    </span>
                  </h3>
                  <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">{selectedReg.email} • {selectedReg.phone}</p>
                </div>

                {/* Profile details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                    <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Academic Institution</span>
                    <p className="font-sans text-xs text-[#EDE6D3] font-medium mt-0.5">{selectedReg.institution}</p>
                  </div>
                  <div className="bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                    <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Course / Class / Dept</span>
                    <p className="font-sans text-xs text-[#EDE6D3] font-medium mt-0.5">{selectedReg.course}</p>
                  </div>
                  <div className="bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                    <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">MUN Experience Level</span>
                    <p className="font-sans text-xs text-[#EDE6D3] font-medium mt-0.5">{selectedReg.munExperience}</p>
                  </div>
                  <div className="bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                    <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Registration Mode</span>
                    <p className="font-sans text-xs text-[#C9A86A] font-bold mt-0.5 uppercase tracking-wider">{selectedReg.regType}</p>
                  </div>

                  {selectedReg.regType === "double" && (
                    <>
                      <div className="p-3.5 bg-[#1A1F1A] border border-[#C9A86A]/30">
                        <span className="font-sans text-[8.5px] text-[#C9A86A] uppercase tracking-wider block font-semibold">Partner Delegate</span>
                        <p className="font-sans text-xs text-[#EDE6D3] font-bold mt-0.5">{selectedReg.partnerName || "N/A"}</p>
                        <p className="font-mono text-[10px] text-[#8A9A7E] mt-0.5">{selectedReg.partnerEmail || "N/A"}</p>
                      </div>
                      <div className="p-3.5 bg-[#1A1F1A] border border-[#C9A86A]/30">
                        <span className="font-sans text-[8.5px] text-[#C9A86A] uppercase tracking-wider block font-semibold">Partner Role & ID</span>
                        <p className="font-sans text-xs text-[#EDE6D3] font-bold mt-0.5">{selectedReg.partnerRole || "Delegate"}</p>
                        <p className="font-mono text-[10px] text-[#8A9A7E] mt-0.5">ID: {selectedReg.partnerId || "TBD"}</p>
                      </div>
                    </>
                  )}

                  {selectedReg.regType === "contingent" && (
                    <div className="bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20 md:col-span-2">
                      <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Estimated Contingent Size</span>
                      <p className="font-sans text-xs text-[#EDE6D3] font-bold mt-0.5">{selectedReg.contingentSize || "N/A"}</p>
                    </div>
                  )}
                </div>

                {/* Committee Matrix choices */}
                <div className="text-left border-t border-[#C9A86A]/20 pt-4 mt-6">
                  <span className="font-sans text-[9px] text-[#8A9A7E] uppercase tracking-wider block font-semibold mb-2">Council & Portfolio Preferences</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-[#1A1F1A] border border-[#C9A86A]/40 p-3">
                      <span className="font-mono text-[8px] text-[#C9A86A] block font-bold">PREFERENCE 1</span>
                      <span className="font-serif text-sm text-[#EDE6D3] font-bold block mt-1">{selectedReg.pref1Committee}</span>
                      <span className="font-sans text-xs text-[#8A9A7E] mt-0.5 block">{selectedReg.pref1Country || "Unassigned"}</span>
                    </div>
                    <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-3">
                      <span className="font-mono text-[8px] text-[#8A9A7E] block">PREFERENCE 2</span>
                      <span className="font-serif text-sm text-[#EDE6D3]/80 font-bold block mt-1">{selectedReg.pref2Committee || "N/A"}</span>
                      <span className="font-sans text-xs text-[#8A9A7E] mt-0.5 block">{selectedReg.pref2Country || "Unassigned"}</span>
                    </div>
                    <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-3">
                      <span className="font-mono text-[8px] text-[#8A9A7E] block">PREFERENCE 3</span>
                      <span className="font-serif text-sm text-[#EDE6D3]/80 font-bold block mt-1">{selectedReg.pref3Committee || "N/A"}</span>
                      <span className="font-sans text-xs text-[#8A9A7E] mt-0.5 block">{selectedReg.pref3Country || "Unassigned"}</span>
                    </div>
                  </div>
                </div>

                {/* Motivation Statement */}
                <div className="text-left border-t border-[#C9A86A]/20 pt-4 mt-6">
                  <span className="font-sans text-[9px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Statement of Academic Intent</span>
                  <div className="mt-2 p-3.5 bg-[#1A1F1A] border border-[#8A9A7E]/20 font-sans text-xs text-[#EDE6D3]/90 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap italic">
                    "{selectedReg.motivation || "No statement compiled."}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-rose-500/50 max-w-sm w-full p-6 text-center relative shadow-2xl my-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#1A1F1A] border border-rose-500/40 text-rose-400 mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#EDE6D3]">Revoke Accreditation Record?</h3>
                <p className="mt-2 font-sans text-[#8A9A7E] text-xs leading-relaxed">
                  Are you absolutely certain you want to purge this delegate's accreditation dossier from the Secretariat registry?
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={actionLoading}
                    className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] hover:bg-[#1A1F1A]/80 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const reg = registrations.find(r => r.uid === confirmDeleteId);
                      if (reg) handleDelete(confirmDeleteId, reg.name || "Delegate");
                    }}
                    disabled={actionLoading}
                    className="flex-1 bg-rose-700 hover:bg-rose-600 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Revoke"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workshop Delete Confirmation Modal */}
        {confirmWorkshopDeleteId && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-rose-500/50 max-w-sm w-full p-6 text-center relative shadow-2xl my-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#1A1F1A] border border-rose-500/40 text-rose-400 mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#EDE6D3]">Revoke Workshop Record?</h3>
                <p className="mt-2 font-sans text-[#8A9A7E] text-xs leading-relaxed">
                  Are you absolutely certain you want to purge this candidate's workshop accreditation record?
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmWorkshopDeleteId(null)}
                    disabled={actionLoading}
                    className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] hover:bg-[#1A1F1A]/80 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const reg = workshopRegistrations.find(r => r.uid === confirmWorkshopDeleteId);
                      if (reg) handleWorkshopDelete(confirmWorkshopDeleteId, reg.name || "Participant");
                    }}
                    disabled={actionLoading}
                    className="flex-1 bg-rose-700 hover:bg-rose-600 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Revoke"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Query Detail Inspection Modal */}
        {selectedQuery && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl my-8 text-left">
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => setSelectedQuery(null)}
                    className="p-1.5 border border-[#C9A86A]/40 bg-[#1A1F1A] hover:border-[#C9A86A] text-[#EDE6D3] hover:text-[#C9A86A] transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="border-b border-[#C9A86A]/30 pb-4 mb-6">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                    // DIPLOMATIC INQUIRY DISPATCH
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-[#EDE6D3] mt-1 flex items-center gap-3">
                    {selectedQuery.name}
                    <span className="px-2 py-0.5 text-[9px] font-bold font-sans uppercase border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#C9A86A]">
                      {selectedQuery.category}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-[#8A9A7E] mt-1">
                    <span>Email: <strong className="text-[#EDE6D3] font-mono">{selectedQuery.email}</strong></span>
                    <span>•</span>
                    <span>Received: <strong className="text-[#EDE6D3] font-mono">{selectedQuery.timestamp || "Recent"}</strong></span>
                  </div>
                  {selectedQuery.id && (
                    <div className="font-mono text-[10px] text-[#8A9A7E] mt-1">
                      Firebase Reference ID: <span className="text-[#C9A86A]">{selectedQuery.id}</span>
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A9A7E] block mb-1.5">
                      Full Dispatch Content:
                    </label>
                    <div className="bg-[#1A1F1A] border border-[#C9A86A]/30 p-5 font-sans text-xs sm:text-sm text-[#EDE6D3] whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto selection:bg-[#C9A86A]/30">
                      {selectedQuery.message}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#C9A86A]/20 flex flex-wrap items-center justify-between gap-3">
                    <a
                      href={`mailto:${selectedQuery.email}?subject=Re: IISTMUN 2027 Inquiry [${encodeURIComponent(selectedQuery.category)}]&body=Dear ${encodeURIComponent(selectedQuery.name)},\n\nThank you for contacting the IISTMUN 2027 Secretariat.\n\nRegarding your inquiry:\n\n\n---\nWarm regards,\nSecretariat Desk, IISTMUN 2027\nsupport@iistmun.org`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Reply via Email Client</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (selectedQuery.id) {
                            setConfirmQueryDeleteId(selectedQuery.id);
                          }
                        }}
                        className="px-4 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Delete Query
                      </button>
                      <button
                        onClick={() => setSelectedQuery(null)}
                        className="px-4 py-2 border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Query Delete Confirmation Modal */}
        {confirmQueryDeleteId && (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-rose-500/50 max-w-sm w-full p-6 text-center relative shadow-2xl my-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#1A1F1A] border border-rose-500/40 text-rose-400 mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#EDE6D3]">Purge Dispatch Record?</h3>
                <p className="mt-2 font-sans text-[#8A9A7E] text-xs leading-relaxed">
                  Are you absolutely certain you want to purge this contact inquiry from Firebase? This action cannot be reversed.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmQueryDeleteId(null)}
                    disabled={isDeletingQuery}
                    className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] hover:bg-[#1A1F1A]/80 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteQuery(confirmQueryDeleteId)}
                    disabled={isDeletingQuery}
                    className="flex-1 bg-rose-700 hover:bg-rose-600 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeletingQuery ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Purge"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EB Application Detailed Inspection Modal */}
        {selectedEb && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-3xl w-full p-6 sm:p-8 relative shadow-2xl my-8 text-left">
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => setSelectedEb(null)}
                    className="p-1.5 border border-[#C9A86A]/40 bg-[#1A1F1A] hover:border-[#C9A86A] text-[#EDE6D3] hover:text-[#C9A86A] transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Header */}
                <div className="border-b border-[#C9A86A]/30 pb-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {selectedEb.photoUrl ? (
                    <img
                      src={selectedEb.photoUrl}
                      alt={selectedEb.name}
                      className="w-16 h-16 rounded-sm object-cover border-2 border-[#C9A86A] shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-[#1A1F1A] border-2 border-[#C9A86A]/50 flex items-center justify-center text-[#C9A86A] flex-shrink-0 font-serif text-2xl font-bold">
                      {selectedEb.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                        // EB APPLICATION DOSSIER: {selectedEb.id}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold font-sans uppercase border ${
                        selectedEb.status === "Accepted"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                          : selectedEb.status === "Shortlisted"
                          ? "bg-blue-950/60 text-blue-300 border-blue-500/40"
                          : selectedEb.status === "Interview Scheduled"
                          ? "bg-purple-950/60 text-purple-300 border-purple-500/40"
                          : selectedEb.status === "Rejected"
                          ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                          : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                      }`}>
                        {selectedEb.status}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-normal text-[#EDE6D3] truncate">
                      {selectedEb.name}
                    </h3>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">
                      {selectedEb.institution} • {selectedEb.course} ({selectedEb.yearOfStudy})
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Contact Info & Academic */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Email Address</span>
                      <a href={`mailto:${selectedEb.email}`} className="text-xs font-mono text-[#EDE6D3] hover:text-[#C9A86A] flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3 text-[#C9A86A]" />
                        {selectedEb.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Phone / WhatsApp</span>
                      <a href={`tel:${selectedEb.phone}`} className="text-xs font-mono text-[#EDE6D3] hover:text-[#C9A86A] flex items-center gap-1.5 mt-0.5">
                        <Phone className="h-3 w-3 text-[#C9A86A]" />
                        {selectedEb.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">City & State</span>
                      <span className="text-xs text-[#EDE6D3] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3 w-3 text-[#8A9A7E]" />
                        {selectedEb.cityState}
                      </span>
                    </div>
                    {selectedEb.linkedinProfile && (
                      <div>
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">LinkedIn Profile</span>
                        <a
                          href={selectedEb.linkedinProfile.startsWith("http") ? selectedEb.linkedinProfile : `https://${selectedEb.linkedinProfile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#C9A86A] hover:underline flex items-center gap-1.5 mt-0.5 truncate"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {selectedEb.linkedinProfile}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Role & Committee Preferences */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#1A1F1A] border-l-2 border-[#C9A86A] p-3.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block">
                        First Preference
                      </span>
                      <div className="mt-1 font-serif text-base text-[#EDE6D3]">
                        {selectedEb.pref1Role}
                      </div>
                      <div className="font-sans text-xs text-[#8A9A7E]">
                        Committee: <strong className="text-[#EDE6D3]">{selectedEb.pref1Committee}</strong>
                      </div>
                    </div>

                    <div className="bg-[#1A1F1A] border-l-2 border-[#8A9A7E] p-3.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] font-bold block">
                        Second Preference
                      </span>
                      <div className="mt-1 font-serif text-base text-[#EDE6D3]">
                        {selectedEb.pref2Role}
                      </div>
                      <div className="font-sans text-xs text-[#8A9A7E]">
                        Committee: <strong className="text-[#EDE6D3]">{selectedEb.pref2Committee}</strong>
                      </div>
                    </div>
                  </div>

                  {/* MUN Experience */}
                  <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                    <div className="flex items-center gap-4 border-b border-[#8A9A7E]/20 pb-2 mb-3">
                      <div>
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Delegate Experience</span>
                        <span className="text-sm font-serif font-bold text-[#C9A86A]">{selectedEb.munDelegateCount} Conferences</span>
                      </div>
                      <div className="h-6 w-px bg-[#8A9A7E]/30" />
                      <div>
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">EB / Dais Experience</span>
                        <span className="text-sm font-serif font-bold text-[#C9A86A]">{selectedEb.munEbCount} Conferences</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                        Experience Summary & Dais History:
                      </span>
                      <div className="font-sans text-xs text-[#EDE6D3] whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto bg-[#141814] p-3 border border-[#8A9A7E]/20">
                        {selectedEb.experienceSummary || "No detailed history submitted."}
                      </div>
                    </div>
                  </div>

                  {/* Proposed Agendas & Motivation */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                        Proposed Committee Agendas:
                      </span>
                      <div className="font-sans text-xs text-[#EDE6D3] whitespace-pre-wrap leading-relaxed bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                        {selectedEb.proposedAgendas}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                        Motivation & Academic Vision:
                      </span>
                      <div className="font-sans text-xs text-[#EDE6D3] whitespace-pre-wrap leading-relaxed bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                        {selectedEb.motivation}
                      </div>
                    </div>
                  </div>

                  {/* Documents & File Attachments */}
                  <div className="bg-[#1A1F1A] border border-[#C9A86A]/30 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A] font-bold block mb-3">
                      // ATTACHED CREDENTIALS & FILES
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* CV File */}
                      <div className="border border-[#8A9A7E]/30 p-3 bg-[#141814] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-5 w-5 text-[#C9A86A] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-[#EDE6D3] font-medium block truncate">
                              {selectedEb.cvName || "Curriculum Vitae"}
                            </span>
                            <span className="text-[10px] font-mono text-[#8A9A7E]">Executive CV / Resume</span>
                          </div>
                        </div>
                        {selectedEb.cvUrl ? (
                          <a
                            href={selectedEb.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={selectedEb.cvName || `${selectedEb.name}_CV`}
                            className="px-3 py-1.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-[10px] font-bold font-sans uppercase tracking-wider transition-colors inline-flex items-center gap-1 flex-shrink-0"
                          >
                            <Download className="h-3 w-3" />
                            <span>View / Download</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#8A9A7E] italic">Not attached</span>
                        )}
                      </div>

                      {/* Photo */}
                      <div className="border border-[#8A9A7E]/30 p-3 bg-[#141814] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ImageIcon className="h-5 w-5 text-[#C9A86A] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-[#EDE6D3] font-medium block truncate">
                              {selectedEb.photoName || "Official Photo"}
                            </span>
                            <span className="text-[10px] font-mono text-[#8A9A7E]">High-res Portrait</span>
                          </div>
                        </div>
                        {selectedEb.photoUrl ? (
                          <a
                            href={selectedEb.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 border border-[#C9A86A] text-[#C9A86A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-[10px] font-bold font-sans uppercase tracking-wider transition-colors inline-flex items-center gap-1 flex-shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Full Image</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#8A9A7E] italic">Not attached</span>
                        )}
                      </div>
                    </div>

                    {selectedEb.sampleStudyGuideLink && (
                      <div className="mt-3 pt-3 border-t border-[#8A9A7E]/20">
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block mb-1">
                          Sample Study Guide / Background Guide Link:
                        </span>
                        <a
                          href={selectedEb.sampleStudyGuideLink.startsWith("http") ? selectedEb.sampleStudyGuideLink : `https://${selectedEb.sampleStudyGuideLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#C9A86A] hover:underline flex items-center gap-1.5 break-all"
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          {selectedEb.sampleStudyGuideLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update & Action Footer */}
                <div className="mt-6 pt-5 border-t border-[#C9A86A]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] mr-1">
                      Set Status:
                    </span>
                    {(["Shortlisted", "Interview Scheduled", "Accepted", "Rejected", "Pending"] as const).map((statusOption) => (
                      <button
                        key={statusOption}
                        disabled={isUpdatingEbStatus || selectedEb.status === statusOption}
                        onClick={() => handleUpdateEbStatus(selectedEb.id, statusOption)}
                        className={`px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 ${
                          selectedEb.status === statusOption
                            ? "bg-[#C9A86A] text-[#1A1F1A] border-[#C9A86A]"
                            : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/30 hover:border-[#C9A86A]"
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => exportEbToExcel([selectedEb], selectedEb.id)}
                      className="px-4 py-2 border border-[#C9A86A] bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Download this candidate's dossier as an Excel file (.xlsx)"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Export Dossier Excel</span>
                    </button>
                    <button
                      onClick={() => setConfirmEbDeleteId(selectedEb.id)}
                      className="px-3.5 py-2 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedEb(null)}
                      className="px-5 py-2 border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EB Delete Confirmation Modal */}
        {confirmEbDeleteId && (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-rose-500/50 max-w-sm w-full p-6 text-center relative shadow-2xl my-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#1A1F1A] border border-rose-500/40 text-rose-400 mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#EDE6D3]">Purge EB Application?</h3>
                <p className="mt-2 font-sans text-[#8A9A7E] text-xs leading-relaxed">
                  Are you certain you want to purge application record <strong className="text-[#EDE6D3] font-mono">{confirmEbDeleteId}</strong>? All submitted dossiers and uploaded file associations will be deleted.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmEbDeleteId(null)}
                    className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] hover:bg-[#1A1F1A]/80 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteEb(confirmEbDeleteId)}
                    className="flex-1 bg-rose-700 hover:bg-rose-600 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer"
                  >
                    Purge
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campus Ambassador Detailed Inspection Modal */}
        {selectedCa && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-3xl w-full p-6 sm:p-8 relative shadow-2xl my-8 text-left">
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => setSelectedCa(null)}
                    className="p-1.5 border border-[#C9A86A]/40 bg-[#1A1F1A] hover:border-[#C9A86A] text-[#EDE6D3] hover:text-[#C9A86A] transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Header */}
                <div className="border-b border-[#C9A86A]/30 pb-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {selectedCa.photoUrl ? (
                    <img
                      src={selectedCa.photoUrl}
                      alt={selectedCa.name}
                      className="w-16 h-16 rounded-sm object-cover border-2 border-[#C9A86A] shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-[#1A1F1A] border-2 border-[#C9A86A]/50 flex items-center justify-center text-[#C9A86A] flex-shrink-0 font-serif text-2xl font-bold">
                      {selectedCa.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                        // CA FELLOWSHIP REGISTRATION: {selectedCa.id}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold font-sans uppercase border ${
                        selectedCa.status === "Accepted"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                          : selectedCa.status === "Verified"
                          ? "bg-blue-950/60 text-blue-300 border-blue-500/40"
                          : selectedCa.status === "Shortlisted"
                          ? "bg-purple-950/60 text-purple-300 border-purple-500/40"
                          : selectedCa.status === "Rejected"
                          ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                          : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                      }`}>
                        {selectedCa.status}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-normal text-[#EDE6D3] truncate">
                      {selectedCa.name}
                    </h3>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">
                      {selectedCa.institution} • {selectedCa.course} ({selectedCa.yearOfStudy})
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Email Address</span>
                      <a href={`mailto:${selectedCa.email}`} className="text-xs font-mono text-[#EDE6D3] hover:text-[#C9A86A] flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3 text-[#C9A86A]" />
                        {selectedCa.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Phone / WhatsApp</span>
                      <a href={`tel:${selectedCa.phone}`} className="text-xs font-mono text-[#EDE6D3] hover:text-[#C9A86A] flex items-center gap-1.5 mt-0.5">
                        <Phone className="h-3 w-3 text-[#C9A86A]" />
                        {selectedCa.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">City & State</span>
                      <span className="text-xs text-[#EDE6D3] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3 w-3 text-[#8A9A7E]" />
                        {selectedCa.cityState}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Target Mobilization</span>
                      <span className="text-xs font-bold text-[#C9A86A] flex items-center gap-1.5 mt-0.5">
                        <Users className="h-3 w-3 text-[#C9A86A]" />
                        {selectedCa.targetMobilization} Delegates Expected
                      </span>
                    </div>
                  </div>

                  {/* Campus & Social Background */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-3.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                        Active College Clubs & Societies:
                      </span>
                      <div className="font-sans text-xs text-[#EDE6D3]">
                        {selectedCa.collegeClubs || "None specified"}
                      </div>
                    </div>

                    <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-3.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                        Social Handles / Profiles:
                      </span>
                      <div className="font-sans text-xs text-[#EDE6D3] break-all">
                        {selectedCa.socialHandles || "None specified"}
                      </div>
                    </div>
                  </div>

                  {/* Prior Experience */}
                  <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                      Prior Campus Ambassador / Outreach Experience:
                    </span>
                    <div className="font-sans text-xs text-[#EDE6D3] whitespace-pre-wrap leading-relaxed">
                      {selectedCa.priorCaExperience || "First-time campus ambassador applicant."}
                    </div>
                  </div>

                  {/* Promotion Plan & Motivation */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                        Mobilization & Promotion Strategy:
                      </span>
                      <div className="font-sans text-xs text-[#EDE6D3] whitespace-pre-wrap leading-relaxed bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                        {selectedCa.promotionPlan}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                        Motivation for Joining Fellowship:
                      </span>
                      <div className="font-sans text-xs text-[#EDE6D3] whitespace-pre-wrap leading-relaxed bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                        {selectedCa.motivation}
                      </div>
                    </div>
                  </div>

                  {/* Documents & File Attachments */}
                  <div className="bg-[#1A1F1A] border border-[#C9A86A]/30 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A86A] font-bold block mb-3">
                      // ATTACHED VERIFICATION ASSETS
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Photo */}
                      <div className="border border-[#8A9A7E]/30 p-3 bg-[#141814] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ImageIcon className="h-5 w-5 text-[#C9A86A] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-[#EDE6D3] font-medium block truncate">
                              {selectedCa.photoName || "Ambassador Photo"}
                            </span>
                            <span className="text-[10px] font-mono text-[#8A9A7E]">Profile Portrait</span>
                          </div>
                        </div>
                        {selectedCa.photoUrl ? (
                          <a
                            href={selectedCa.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 border border-[#C9A86A] text-[#C9A86A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-[10px] font-bold font-sans uppercase tracking-wider transition-colors inline-flex items-center gap-1 flex-shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>View Photo</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#8A9A7E] italic">Not attached</span>
                        )}
                      </div>

                      {/* ID Proof */}
                      <div className="border border-[#8A9A7E]/30 p-3 bg-[#141814] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-5 w-5 text-[#C9A86A] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-[#EDE6D3] font-medium block truncate">
                              {selectedCa.idProofName || "College ID / Student Card"}
                            </span>
                            <span className="text-[10px] font-mono text-[#8A9A7E]">Institutional Proof</span>
                          </div>
                        </div>
                        {selectedCa.idProofUrl ? (
                          <a
                            href={selectedCa.idProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={selectedCa.idProofName || `${selectedCa.name}_IDProof`}
                            className="px-3 py-1.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-[10px] font-bold font-sans uppercase tracking-wider transition-colors inline-flex items-center gap-1 flex-shrink-0"
                          >
                            <Download className="h-3 w-3" />
                            <span>View / Download</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#8A9A7E] italic">Not attached</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Update & Action Footer */}
                <div className="mt-6 pt-5 border-t border-[#C9A86A]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] mr-1">
                      Set Status:
                    </span>
                    {(["Verified", "Shortlisted", "Accepted", "Rejected", "Pending"] as const).map((statusOption) => (
                      <button
                        key={statusOption}
                        disabled={isUpdatingCaStatus || selectedCa.status === statusOption}
                        onClick={() => handleUpdateCaStatus(selectedCa.id, statusOption)}
                        className={`px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 ${
                          selectedCa.status === statusOption
                            ? "bg-[#C9A86A] text-[#1A1F1A] border-[#C9A86A]"
                            : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/30 hover:border-[#C9A86A]"
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => exportCaToExcel([selectedCa], selectedCa.id)}
                      className="px-4 py-2 border border-[#8BA06F] bg-[#8BA06F] hover:bg-[#a1b783] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Download this ambassador's registration as an Excel file (.xlsx)"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Export Ambassador Excel</span>
                    </button>
                    <button
                      onClick={() => setConfirmCaDeleteId(selectedCa.id)}
                      className="px-3.5 py-2 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedCa(null)}
                      className="px-5 py-2 border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CA Delete Confirmation Modal */}
        {confirmCaDeleteId && (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-rose-500/50 max-w-sm w-full p-6 text-center relative shadow-2xl my-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#1A1F1A] border border-rose-500/40 text-rose-400 mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#EDE6D3]">Purge CA Registration?</h3>
                <p className="mt-2 font-sans text-[#8A9A7E] text-xs leading-relaxed">
                  Are you certain you want to purge campus ambassador record <strong className="text-[#EDE6D3] font-mono">{confirmCaDeleteId}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmCaDeleteId(null)}
                    className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] hover:bg-[#1A1F1A]/80 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteCa(confirmCaDeleteId)}
                    className="flex-1 bg-rose-700 hover:bg-rose-600 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer"
                  >
                    Purge
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PRIORITY ROUND: CANDIDATE DOSSIER DRAWER
           ======================================================== */}
        {selectedPriorityReg && !isUngaRecord(selectedPriorityReg) && (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in text-left">
            <div className="flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4 text-center">
              <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-3xl w-full p-6 sm:p-8 text-left relative shadow-2xl my-6">
                
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#C9A86A]/30 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                        // PRIORITY DOSSIER
                      </span>
                      <span className="font-mono text-xs text-[#EDE6D3] bg-[#1A1F1A] border border-[#C9A86A]/40 px-2 py-0.5 font-bold">
                        {selectedPriorityReg.id || selectedPriorityReg.uid}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider border ${
                        selectedPriorityReg.status === "Payment Confirmed"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                          : selectedPriorityReg.status === "Portfolio Allotted"
                          ? "bg-[#C9A86A]/20 text-[#C9A86A] border-[#C9A86A]/40"
                          : selectedPriorityReg.status === "Waitlisted"
                          ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                          : selectedPriorityReg.status === "Rejected"
                          ? "bg-rose-950/60 text-rose-400 border-rose-500/40"
                          : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/40"
                      }`}>
                        {selectedPriorityReg.status || "Pending Verification"}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-normal text-[#EDE6D3]">
                      {selectedPriorityReg.name}
                    </h3>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">
                      Submitted on: {selectedPriorityReg.timestamp || selectedPriorityReg.paymentDate || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPriorityReg(null)}
                    className="p-1.5 border border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#8A9A7E] hover:text-[#EDE6D3] hover:border-[#C9A86A] transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Dossier Body */}
                <div className="mt-6 space-y-6 max-h-[68vh] overflow-y-auto pr-2 scrollbar-thin">
                  
                  {/* Financial & Category Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#1A1F1A] border border-[#C9A86A]/30 p-3.5">
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Category</span>
                      <span className="text-xs font-bold text-[#EDE6D3]">
                        {selectedPriorityReg.delegateCategory === "school" ? "School Delegate (₹1000)" : (selectedPriorityReg.delegateCategory === "iist" || selectedPriorityReg.delegateCategory === "iist_internal") ? "IIST Student (₹800)" : "College Non-IIST (₹1299)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Delegation Mode</span>
                      <span className="text-xs font-bold text-[#C9A86A] uppercase">
                        {selectedPriorityReg.delegationMode === "part_of_delegation" || selectedPriorityReg.regType === "contingent"
                          ? "Part of Delegation"
                          : selectedPriorityReg.regType === "double"
                          ? "Double Delegation"
                          : "Individual"}
                      </span>
                      {selectedPriorityReg.isPrivateDelegation && (
                        <span className="text-[9px] font-mono text-amber-400 block font-semibold">Private Delegation</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Registration Fee</span>
                      <span className="text-xs font-bold text-emerald-400">
                        ₹{selectedPriorityReg.feeAmount !== undefined ? selectedPriorityReg.feeAmount : 1299}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Payment Verification</span>
                      <span className={`text-xs font-bold ${selectedPriorityReg.paymentStatus === "Verified" ? "text-emerald-400" : "text-amber-300"}`}>
                        {selectedPriorityReg.paymentStatus || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Personal & Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2">
                        // CANDIDATE PROFILE
                      </span>
                      <div className="space-y-1.5 text-xs text-[#EDE6D3]">
                        <div><strong className="text-[#8A9A7E]">Email:</strong> {selectedPriorityReg.email}</div>
                        <div><strong className="text-[#8A9A7E]">Phone:</strong> {selectedPriorityReg.phone}</div>
                        <div><strong className="text-[#8A9A7E]">Aadhaar:</strong> {selectedPriorityReg.aadharNumber || "Not specified"}</div>
                        <div><strong className="text-[#8A9A7E]">Gender:</strong> {selectedPriorityReg.gender || "Not specified"}</div>
                        <div><strong className="text-[#8A9A7E]">DOB:</strong> {selectedPriorityReg.dob || "Not specified"}</div>
                        <div><strong className="text-[#8A9A7E]">Location:</strong> {selectedPriorityReg.cityState || "Not specified"}</div>
                      </div>
                    </div>

                    <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2">
                        // EMERGENCY CONTACT
                      </span>
                      <div className="space-y-1.5 text-xs text-[#EDE6D3]">
                        <div><strong className="text-[#8A9A7E]">Name:</strong> {selectedPriorityReg.emergencyContactName || "Not specified"}</div>
                        <div><strong className="text-[#8A9A7E]">Relation:</strong> {selectedPriorityReg.emergencyContactRelation || "Not specified"}</div>
                        <div><strong className="text-[#8A9A7E]">Emergency Phone:</strong> {selectedPriorityReg.emergencyContactPhone || "Not specified"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Profile */}
                  <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2">
                      // INSTITUTION & ACADEMIC DOSSIER
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#EDE6D3]">
                      <div>
                        <span className="text-[#8A9A7E] block text-[10px]">Institution:</span>
                        <span className="font-semibold">{selectedPriorityReg.institution}</span>
                      </div>
                      <div>
                        <span className="text-[#8A9A7E] block text-[10px]">Course / Degree:</span>
                        <span>{selectedPriorityReg.course || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[#8A9A7E] block text-[10px]">Year of Study / Grade:</span>
                        <span>{selectedPriorityReg.yearOfStudy || selectedPriorityReg.classGrade || "N/A"}</span>
                      </div>
                    </div>
                    {selectedPriorityReg.rollNumber && (
                      <div className="mt-2 text-xs text-[#8A9A7E]">
                        Student / Roll Number: <strong className="text-[#EDE6D3]">{selectedPriorityReg.rollNumber}</strong>
                      </div>
                    )}
                  </div>

                  {/* Double Delegation Partner (if applicable) */}
                  {selectedPriorityReg.regType === "double" && (
                    <div className="bg-purple-950/20 border border-purple-500/30 p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold block mb-2">
                        // CO-DELEGATE / PARTNER DOSSIER
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#EDE6D3]">
                        <div><strong className="text-[#8A9A7E]">Partner Name:</strong> {selectedPriorityReg.partnerName || "N/A"}</div>
                        <div><strong className="text-[#8A9A7E]">Partner Email:</strong> {selectedPriorityReg.partnerEmail || "N/A"}</div>
                        <div><strong className="text-[#8A9A7E]">Partner Phone:</strong> {selectedPriorityReg.partnerPhone || "N/A"}</div>
                        <div><strong className="text-[#8A9A7E]">Partner Role:</strong> {selectedPriorityReg.partnerRole || "Delegate"}</div>
                        <div><strong className="text-[#8A9A7E]">Partner Ticket ID:</strong> <span className="font-mono text-purple-300 font-bold">{selectedPriorityReg.partnerId || "TBD"}</span></div>
                        <div><strong className="text-[#8A9A7E]">Partner Institution:</strong> {selectedPriorityReg.partnerInstitution || selectedPriorityReg.institution}</div>
                      </div>
                    </div>
                  )}

                  {/* Committee Preferences */}
                  <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2">
                      // PREFERRED COMMITTEES & PORTFOLIOS
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="border border-[#C9A86A]/30 p-2.5 bg-[#2E3B2F]/40">
                        <span className="text-[9px] font-mono uppercase text-[#C9A86A] block">Preference 1</span>
                        <div className="font-bold text-[#EDE6D3] uppercase mt-0.5">{selectedPriorityReg.pref1Committee || "None"}</div>
                        {selectedPriorityReg.pref1Portfolios && selectedPriorityReg.pref1Portfolios.length > 0 ? (
                          <div className="text-[11px] text-[#EDE6D3] mt-1 space-y-0.5">
                            {selectedPriorityReg.pref1Portfolios.map((p, idx) => (
                              <div key={idx} className="truncate text-[#8A9A7E]">
                                <span className="text-[#C9A86A] font-mono text-[9px]">#{idx + 1}:</span> {p}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#8A9A7E] mt-0.5">{selectedPriorityReg.pref1Country || "Any country"}</div>
                        )}
                      </div>
                      <div className="border border-[#8A9A7E]/20 p-2.5 bg-[#2E3B2F]/20">
                        <span className="text-[9px] font-mono uppercase text-[#8A9A7E] block">Preference 2</span>
                        <div className="font-bold text-[#EDE6D3] uppercase mt-0.5">{selectedPriorityReg.pref2Committee || "None"}</div>
                        {selectedPriorityReg.pref2Portfolios && selectedPriorityReg.pref2Portfolios.length > 0 ? (
                          <div className="text-[11px] text-[#EDE6D3] mt-1 space-y-0.5">
                            {selectedPriorityReg.pref2Portfolios.map((p, idx) => (
                              <div key={idx} className="truncate text-[#8A9A7E]">
                                <span className="text-[#8A9A7E] font-mono text-[9px]">#{idx + 1}:</span> {p}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#8A9A7E] mt-0.5">{selectedPriorityReg.pref2Country || "Any country"}</div>
                        )}
                      </div>
                      <div className="border border-[#8A9A7E]/20 p-2.5 bg-[#2E3B2F]/20">
                        <span className="text-[9px] font-mono uppercase text-[#8A9A7E] block">Preference 3</span>
                        <div className="font-bold text-[#EDE6D3] uppercase mt-0.5">{selectedPriorityReg.pref3Committee || "None"}</div>
                        {selectedPriorityReg.pref3Portfolios && selectedPriorityReg.pref3Portfolios.length > 0 ? (
                          <div className="text-[11px] text-[#EDE6D3] mt-1 space-y-0.5">
                            {selectedPriorityReg.pref3Portfolios.map((p, idx) => (
                              <div key={idx} className="truncate text-[#8A9A7E]">
                                <span className="text-[#8A9A7E] font-mono text-[9px]">#{idx + 1}:</span> {p}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#8A9A7E] mt-0.5">{selectedPriorityReg.pref3Country || "Any country"}</div>
                        )}
                      </div>
                    </div>

                    {selectedPriorityReg.priorityPreference && (
                      <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 bg-[#2E3B2F] border border-[#C9A86A]/40 text-xs">
                        <span className="text-[#8A9A7E] font-mono text-[10px] uppercase">Allotment Priority:</span>
                        <span className="font-bold text-[#C9A86A] uppercase">
                          {selectedPriorityReg.priorityPreference === "committee" ? "Committee First" : "Portfolio First"}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-[#8A9A7E]/15 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <strong className="text-[#8A9A7E]">MUN Experience Level:</strong>{" "}
                        <span className="text-[#EDE6D3]">{selectedPriorityReg.munExperience || "Novice"}</span>
                      </div>
                      {selectedPriorityReg.pastMunDetails && (
                        <div>
                          <strong className="text-[#8A9A7E]">Past Conferences / Accolades:</strong>{" "}
                          <span className="text-[#EDE6D3]">{selectedPriorityReg.pastMunDetails}</span>
                        </div>
                      )}
                    </div>

                    {selectedPriorityReg.motivation && (
                      <div className="mt-3 pt-3 border-t border-[#8A9A7E]/15">
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block mb-1">
                          Statement of Motivation:
                        </span>
                        <div className="bg-[#141814] p-3 text-xs text-[#EDE6D3] italic leading-relaxed border border-[#8A9A7E]/20">
                          "{selectedPriorityReg.motivation}"
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Official Merchandise */}
                  <div className={`p-4 border ${selectedPriorityReg.hasMerch ? "bg-amber-950/20 border-amber-500/40" : "bg-[#1A1F1A] border-[#8A9A7E]/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold flex items-center gap-1.5">
                        <Shirt className="h-3.5 w-3.5" />
                        // OFFICIAL COMMEMORATIVE MERCHANDISE
                      </span>
                      {selectedPriorityReg.hasMerch ? (
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Ordered (+₹{selectedPriorityReg.merchAmount || 599})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-mono text-[#8A9A7E] bg-[#141814] border border-[#8A9A7E]/30">
                          Not Purchased
                        </span>
                      )}
                    </div>
                    {selectedPriorityReg.hasMerch ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#EDE6D3] mt-3">
                        <div>
                          <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Size Selected:</span>
                          <span className="font-mono text-sm font-bold text-amber-300 bg-[#141814] px-2 py-0.5 border border-amber-500/30 inline-block mt-0.5">
                            {selectedPriorityReg.merchSize || "M"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Merchandise Add-on:</span>
                          <span className="font-bold text-emerald-400 mt-0.5 block">
                            ₹{selectedPriorityReg.merchAmount || 599}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Fulfillment Status:</span>
                          <span className="text-[#EDE6D3] text-[11px] mt-0.5 block">
                            To be handed at Conference Kit Desk
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#8A9A7E] mt-1">
                        Delegate opted out of the merchandise add-on or is an internal IIST delegate.
                      </p>
                    )}
                  </div>

                  {/* Payment Verification & Screenshot */}
                  <div className="bg-[#1A1F1A] border border-[#C9A86A]/30 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2">
                      // PAYMENT VERIFICATION & UTR PROOF
                    </span>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1 text-xs">
                        <div>
                          <strong className="text-[#8A9A7E]">UTR / Transaction ID:</strong>{" "}
                          <span className="font-mono text-sm text-[#C9A86A] font-bold bg-[#141814] px-2 py-0.5 border border-[#C9A86A]/40 inline-block">
                            {selectedPriorityReg.utrNumber || selectedPriorityReg.transactionId || "Not Provided"}
                          </span>
                          {(selectedPriorityReg.utrNumber || selectedPriorityReg.transactionId) && (
                            <button
                              onClick={() => handleCopyUtr(selectedPriorityReg.utrNumber || selectedPriorityReg.transactionId || "")}
                              className="ml-2 text-xs text-[#8A9A7E] hover:text-[#C9A86A] underline"
                            >
                              Copy
                            </button>
                          )}
                        </div>
                        <div><strong className="text-[#8A9A7E]">Payer Name:</strong> {selectedPriorityReg.payerName || "N/A"}</div>
                        <div><strong className="text-[#8A9A7E]">Payment Mode:</strong> {selectedPriorityReg.paymentMode || "UPI"}</div>
                        {selectedPriorityReg.campusAmbassadorCode && (
                          <div className="pt-1">
                            <strong className="text-[#8BA06F]">Ambassador Code:</strong>{" "}
                            <span className="font-mono text-xs font-bold text-emerald-300 bg-[#141814] px-2 py-0.5 border border-emerald-500/40 inline-block">
                              {selectedPriorityReg.campusAmbassadorCode}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold ml-1.5">(₹50 refund due)</span>
                          </div>
                        )}
                      </div>

                      {/* Screenshot Preview */}
                      {(() => {
                        const receiptUrl = selectedPriorityReg.paymentScreenshotUrl || selectedPriorityReg.paymentProofUrl || (selectedPriorityReg as any).photoUrl;
                        const receiptName = selectedPriorityReg.paymentScreenshotName || (selectedPriorityReg as any).paymentProofName || "payment_receipt";

                        return receiptUrl ? (
                          <div className="flex items-center gap-3 bg-[#141814] p-2 border border-[#8A9A7E]/30 shrink-0">
                            <ProofThumbnail
                              url={receiptUrl}
                              name={receiptName}
                              alt="Payment Proof"
                              className="h-16 w-16"
                              onClick={() => setViewProofModal({
                                url: receiptUrl,
                                name: receiptName,
                                utr: selectedPriorityReg.utrNumber || selectedPriorityReg.transactionId,
                                candidateName: selectedPriorityReg.name
                              })}
                            />
                            <button
                              onClick={() => setViewProofModal({
                                url: receiptUrl,
                                name: receiptName,
                                utr: selectedPriorityReg.utrNumber || selectedPriorityReg.transactionId,
                                candidateName: selectedPriorityReg.name
                              })}
                              className="px-3 py-1.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Enlarge Proof</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-[#8A9A7E] italic">
                            No receipt screenshot uploaded
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Student ID Proof Photo */}
                  <div className="bg-[#1A1F1A] border border-[#8A9A7E]/30 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2">
                      // STUDENT SCHOOL / COLLEGE ID PROOF
                    </span>
                    {(() => {
                      const idProofUrl = selectedPriorityReg.idCardUrl || (selectedPriorityReg as any).idProofUrl;
                      const idProofName = selectedPriorityReg.idCardName || (selectedPriorityReg as any).idProofName || "Student ID Proof";

                      return idProofUrl ? (
                        <div className="flex items-center gap-3 bg-[#141814] p-3 border border-[#8A9A7E]/30">
                          <ProofThumbnail
                            url={idProofUrl}
                            name={idProofName}
                            alt="Student ID Proof"
                            className="h-16 w-24"
                            onClick={() => setViewProofModal({
                              url: idProofUrl,
                              name: idProofName,
                              candidateName: selectedPriorityReg.name
                            })}
                          />
                          <div className="flex-1 text-xs">
                            <span className="text-[#EDE6D3] font-medium block truncate" title={idProofName}>
                              {idProofName}
                            </span>
                            <span className="text-[#8A9A7E] text-[10px] block mt-0.5">
                              Attached for institutional verification
                            </span>
                          </div>
                          <button
                            onClick={() => setViewProofModal({
                              url: idProofUrl,
                              name: idProofName,
                              candidateName: selectedPriorityReg.name
                            })}
                            className="px-3 py-1.5 bg-[#2E3B2F] hover:bg-[#3d4f3e] text-[#EDE6D3] border border-[#C9A86A]/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#C9A86A]" />
                            <span>View ID</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-[#8A9A7E] italic">
                          No School / College ID photo attached.
                        </div>
                      );
                    })()}
                  </div>

                  {/* Portfolio Allotment Card (if allotted) */}
                  {selectedPriorityReg.allottedCountry && selectedPriorityReg.allottedCommittee && (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                        // ALLOTTED DIPLOMATIC PORTFOLIO
                      </span>
                      <div className="text-sm font-serif text-[#EDE6D3]">
                        <strong className="text-[#C9A86A]">{selectedPriorityReg.allottedCountry}</strong> in{" "}
                        <strong className="text-emerald-300 uppercase">{selectedPriorityReg.allottedCommittee}</strong>
                      </div>
                      {selectedPriorityReg.adminNotes && (
                        <div className="text-xs text-[#8A9A7E] mt-1">
                          Admin Notes: {selectedPriorityReg.adminNotes}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Footer Controls */}
                <div className="mt-6 pt-4 border-t border-[#C9A86A]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] mr-1">
                      Set Status:
                    </span>
                    {(["Payment Confirmed", "Portfolio Allotted", "Waitlisted", "Rejected", "Pending Verification"] as const).map((statusOption) => (
                      <button
                        key={statusOption}
                        disabled={isUpdatingPriorityStatus || selectedPriorityReg.status === statusOption}
                        onClick={() => handleUpdatePriorityStatus(selectedPriorityReg.uid || selectedPriorityReg.id || "", statusOption)}
                        className={`px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 ${
                          selectedPriorityReg.status === statusOption
                            ? "bg-[#C9A86A] text-[#1A1F1A] border-[#C9A86A]"
                            : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/30 hover:border-[#C9A86A]"
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <button
                      onClick={() => {
                        setAllotModalReg(selectedPriorityReg);
                        setAllotForm({
                          committee: selectedPriorityReg.allottedCommittee || selectedPriorityReg.pref1Committee || "copuos",
                          country: selectedPriorityReg.allottedCountry || selectedPriorityReg.pref1Country || "",
                          adminNotes: selectedPriorityReg.adminNotes || ""
                        });
                      }}
                      className="px-3.5 py-2 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-sans font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>Allot Portfolio</span>
                    </button>
                    <button
                      onClick={() => exportPriorityToExcel([selectedPriorityReg], selectedPriorityReg.id || selectedPriorityReg.name)}
                      className="px-3.5 py-2 border border-[#C9A86A]/40 bg-[#1A1F1A] hover:bg-[#2E3B2F] text-[#C9A86A] text-xs font-sans font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Export XLSX</span>
                    </button>
                    <button
                      onClick={() => setConfirmPriorityDeleteId(selectedPriorityReg.uid || selectedPriorityReg.id || "")}
                      className="px-3 py-2 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedPriorityReg(null)}
                      className="px-4 py-2 border border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            UNGA (ONLINE COMMITTEE): EXHAUSTIVE DELEGATE DOSSIER MODAL
            Displays EACH AND EVERY detail filled in the UNGA form
           ======================================================== */}
        {(() => {
          const activeUnga = selectedUngaReg || 
            (selectedReg && isUngaRecord(selectedReg) ? selectedReg : null) ||
            (selectedPriorityReg && isUngaRecord(selectedPriorityReg) ? selectedPriorityReg : null);
          if (!activeUnga) return null;
          const closeUngaModal = () => {
            setSelectedUngaReg(null);
            if (selectedReg && isUngaRecord(selectedReg)) setSelectedReg(null);
            if (selectedPriorityReg && isUngaRecord(selectedPriorityReg)) setSelectedPriorityReg(null);
          };

          const calculatedTotalFee = activeUnga.feeAmount !== undefined 
            ? activeUnga.feeAmount 
            : (activeUnga.hasMerch ? 1498 : 899);

          return (
            <div className="fixed inset-0 z-[115] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in text-left">
              <div className="flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4 text-center">
                <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-4xl w-full p-6 sm:p-8 text-left relative shadow-2xl my-6">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-[#C9A86A]/30 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold flex items-center gap-1">
                          <Globe className="h-3 w-3 text-[#C9A86A]" />
                          // UNGA (ONLINE COMMITTEE) DOSSIER
                        </span>
                        <span className="font-mono text-xs text-[#EDE6D3] bg-[#1A1F1A] border border-[#C9A86A]/40 px-2 py-0.5 font-bold">
                          {activeUnga.id || activeUnga.uid}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider border ${
                          activeUnga.status === "Payment Confirmed"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                            : activeUnga.status === "Portfolio Allotted"
                            ? "bg-[#C9A86A]/20 text-[#C9A86A] border-[#C9A86A]/40"
                            : activeUnga.status === "Waitlisted"
                            ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                            : activeUnga.status === "Rejected"
                            ? "bg-rose-950/60 text-rose-400 border-rose-500/40"
                            : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/40"
                        }`}>
                          {activeUnga.status || "Pending Verification"}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#EDE6D3]">
                        {activeUnga.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#8A9A7E]">
                        <span>Submitted on: <strong className="text-[#EDE6D3]">{activeUnga.timestamp || activeUnga.paymentDate || "N/A"}</strong></span>
                        <span>•</span>
                        <span>Accreditation: <strong className="text-[#C9A86A]">{activeUnga.role || "Delegate"}</strong></span>
                        <span>•</span>
                        <span>Mode: <strong className="text-[#C9A86A]">Individual Delegation</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={closeUngaModal}
                      className="p-1.5 border border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#8A9A7E] hover:text-[#EDE6D3] hover:border-[#C9A86A] transition-colors cursor-pointer shrink-0"
                      title="Close Dossier"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Dossier Body - Scrollable */}
                  <div className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                    
                    {/* Financial & Registry Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#1A1F1A] border border-[#C9A86A]/30 p-3.5">
                      <div>
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Committee Chamber</span>
                        <span className="text-xs font-bold text-[#EDE6D3]">
                          UNGA (Online)
                        </span>
                        <span className="text-[10px] text-[#8A9A7E] block mt-0.5">Virtual Sessions</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Delegation Mode</span>
                        <span className="text-xs font-bold text-[#C9A86A] uppercase">
                          Individual Delegation
                        </span>
                        <span className="text-[10px] text-[#8A9A7E] block mt-0.5">Single Seat</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Total Fee Paid</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          ₹{calculatedTotalFee}
                        </span>
                        <span className="text-[10px] text-[#8A9A7E] block mt-0.5">
                          Base: ₹899 {activeUnga.hasMerch ? "+ ₹599 Merch" : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block">Payment Verification</span>
                        <span className={`text-xs font-bold ${activeUnga.paymentStatus === "Verified" ? "text-emerald-400" : activeUnga.paymentStatus === "Rejected" ? "text-rose-400" : "text-amber-300"}`}>
                          {activeUnga.paymentStatus || "Pending"}
                        </span>
                        <span className="text-[10px] text-[#8A9A7E] block mt-0.5 font-mono">
                          Mode: {activeUnga.paymentMode || "UPI"}
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Candidate Personal Demographics & Section 2: Emergency Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Personal Demographics */}
                      <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2.5 flex items-center gap-1.5">
                          <User className="h-3 w-3 text-[#C9A86A]" />
                          // CANDIDATE LEGAL PROFILE & IDENTITY
                        </span>
                        <div className="space-y-2 text-xs text-[#EDE6D3]">
                          <div><strong className="text-[#8A9A7E]">Full Legal Name:</strong> <span className="font-semibold">{activeUnga.name}</span></div>
                          <div><strong className="text-[#8A9A7E]">Email Address:</strong> <a href={`mailto:${activeUnga.email}`} className="text-[#C9A86A] hover:underline">{activeUnga.email}</a></div>
                          <div><strong className="text-[#8A9A7E]">Phone / WhatsApp:</strong> <a href={`tel:${activeUnga.phone}`} className="font-mono text-[#EDE6D3] hover:underline">{activeUnga.phone}</a></div>
                          <div>
                            <strong className="text-[#8A9A7E]">Aadhaar Card Number:</strong>{" "}
                            <span className="font-mono bg-[#141814] px-1.5 py-0.5 border border-[#8A9A7E]/30 text-[#EDE6D3]">
                              {activeUnga.aadharNumber || "Not specified"}
                            </span>
                          </div>
                          <div><strong className="text-[#8A9A7E]">Gender:</strong> {activeUnga.gender || "Prefer not to say"}</div>
                          <div><strong className="text-[#8A9A7E]">Date of Birth:</strong> {activeUnga.dob || "Not specified"}</div>
                          <div><strong className="text-[#8A9A7E]">City & State / Country:</strong> {activeUnga.cityState || "Not specified"}</div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2.5 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-[#C9A86A]" />
                            // EMERGENCY CONTACT DETAILS
                          </span>
                          <div className="space-y-2 text-xs text-[#EDE6D3]">
                            <div><strong className="text-[#8A9A7E]">Contact Name:</strong> {activeUnga.emergencyContactName || "Not specified"}</div>
                            <div><strong className="text-[#8A9A7E]">Relationship:</strong> {activeUnga.emergencyContactRelation || "Parent / Guardian"}</div>
                            <div>
                              <strong className="text-[#8A9A7E]">Emergency Phone:</strong>{" "}
                              <span className="font-mono font-bold text-amber-300">
                                {activeUnga.emergencyContactPhone || "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#8A9A7E]/15 text-[11px] text-[#8A9A7E]">
                          <span className="text-[#C9A86A] font-semibold">Secretariat Note:</span> Verified emergency guardian line on record for all delegate communications and credential security.
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Full Residential / Postal Dispatch Address */}
                    <div className="bg-[#1A1F1A] border-2 border-[#C9A86A]/40 p-4">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#C9A86A]" />
                          // FULL RESIDENTIAL / POSTAL DISPATCH ADDRESS
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5">
                          Required for Certificate / Merch Courier Dispatch
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8A9A7E] mb-2">
                        This is the complete physical address filled in the registration form for delivering the delegate kit, certificates, and merchandise.
                      </p>
                      <div className="bg-[#141814] p-3.5 border border-[#C9A86A]/30 text-xs text-[#EDE6D3] font-sans leading-relaxed whitespace-pre-wrap select-all">
                        {activeUnga.fullAddress ? (
                          activeUnga.fullAddress
                        ) : (
                          <span className="text-amber-400 italic">No full postal address was filled in the form submission.</span>
                        )}
                      </div>
                    </div>

                    {/* Section 4: Institution & Student ID Proof */}
                    <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2.5 flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3 text-[#C9A86A]" />
                        // ACADEMIC INSTITUTION & STUDENT VERIFICATION
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-[#EDE6D3]">
                        <div className="sm:col-span-2">
                          <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Academic Institution</span>
                          <span className="font-semibold text-sm text-[#EDE6D3] block mt-0.5">{activeUnga.institution}</span>
                        </div>
                        <div>
                          <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Course / Degree</span>
                          <span className="font-medium text-[#EDE6D3] block mt-0.5">{activeUnga.course || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Year / Grade</span>
                          <span className="font-medium text-[#EDE6D3] block mt-0.5">{activeUnga.yearOfStudy || activeUnga.classGrade || "N/A"}</span>
                        </div>
                      </div>

                      {activeUnga.rollNumber && (
                        <div className="mt-2.5 text-xs text-[#8A9A7E]">
                          Student / Roll Number: <strong className="text-[#EDE6D3] font-mono">{activeUnga.rollNumber}</strong>
                        </div>
                      )}

                      {/* Student ID Proof Photo Display */}
                      <div className="mt-3.5 pt-3.5 border-t border-[#8A9A7E]/15">
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block mb-1.5">
                          Uploaded School / College ID Card Document:
                        </span>
                        {activeUnga.idCardUrl ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#141814] p-3 border border-[#8A9A7E]/30">
                            <div className="flex items-center gap-3">
                              <ProofThumbnail
                                url={activeUnga.idCardUrl}
                                name={activeUnga.idCardName || "Student ID Proof"}
                                alt="Student ID Proof"
                                className="h-16 w-24"
                                onClick={() => setViewProofModal({
                                  url: activeUnga.idCardUrl || "",
                                  name: activeUnga.idCardName || "Student ID Proof",
                                  candidateName: activeUnga.name
                                })}
                              />
                              <div className="text-xs">
                                <span className="text-[#EDE6D3] font-semibold block">
                                  {activeUnga.idCardName || "Student ID Proof Document"}
                                </span>
                                <span className="text-[#8A9A7E] text-[10px] block mt-0.5">
                                  Click thumbnail or button to preview at full resolution
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setViewProofModal({
                                  url: activeUnga.idCardUrl || "",
                                  name: activeUnga.idCardName || "Student ID Proof",
                                  candidateName: activeUnga.name
                                })}
                                className="px-3 py-1.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Enlarge ID</span>
                              </button>
                              <a
                                href={activeUnga.idCardUrl}
                                download={activeUnga.idCardName || "student_id_proof"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 border border-[#8A9A7E]/30 bg-[#2E3B2F] hover:bg-[#3d4f3e] text-[#EDE6D3] text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#8A9A7E] italic bg-[#141814] p-2.5 border border-[#8A9A7E]/20">
                            No School / College ID card photo was uploaded.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 5: All 5 Ranked Country Preferences */}
                    <div className="bg-[#1A1F1A] border-2 border-[#C9A86A]/30 p-4">
                      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold flex items-center gap-1.5">
                          <Compass className="h-3.5 w-3.5 text-[#C9A86A]" />
                          // ALL 5 RANKED COUNTRY PREFERENCES (UNGA ONLINE)
                        </span>
                        <span className="text-[10px] font-mono text-[#8A9A7E]">
                          Ranked in order of preference (1 to 5)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                        {/* Choice 1 */}
                        <div className="border-2 border-[#C9A86A] bg-[#2E3B2F] p-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="px-1.5 py-0.5 bg-[#C9A86A] text-[#1A1F1A] font-mono text-[9px] font-black uppercase">
                              #1 CHOICE
                            </span>
                            <Sparkles className="h-3 w-3 text-[#C9A86A]" />
                          </div>
                          <div className="mt-2 font-serif text-sm font-bold text-[#EDE6D3] break-words">
                            {(activeUnga.pref1Portfolios && activeUnga.pref1Portfolios[0]) || activeUnga.pref1Country || "None"}
                          </div>
                          <span className="text-[9px] text-[#C9A86A] block mt-1">Top Delegate Choice</span>
                        </div>

                        {/* Choice 2 */}
                        <div className="border border-[#8A9A7E]/30 bg-[#2E3B2F]/40 p-3 text-left">
                          <span className="px-1.5 py-0.5 bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#8A9A7E] font-mono text-[9px] font-bold">
                            #2 CHOICE
                          </span>
                          <div className="mt-2 font-serif text-sm font-bold text-[#EDE6D3] break-words">
                            {(activeUnga.pref1Portfolios && activeUnga.pref1Portfolios[1]) || "None"}
                          </div>
                          <span className="text-[9px] text-[#8A9A7E] block mt-1">Secondary Option</span>
                        </div>

                        {/* Choice 3 */}
                        <div className="border border-[#8A9A7E]/30 bg-[#2E3B2F]/40 p-3 text-left">
                          <span className="px-1.5 py-0.5 bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#8A9A7E] font-mono text-[9px] font-bold">
                            #3 CHOICE
                          </span>
                          <div className="mt-2 font-serif text-sm font-bold text-[#EDE6D3] break-words">
                            {(activeUnga.pref1Portfolios && activeUnga.pref1Portfolios[2]) || "None"}
                          </div>
                          <span className="text-[9px] text-[#8A9A7E] block mt-1">Tertiary Option</span>
                        </div>

                        {/* Choice 4 */}
                        <div className="border border-[#8A9A7E]/30 bg-[#2E3B2F]/40 p-3 text-left">
                          <span className="px-1.5 py-0.5 bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#8A9A7E] font-mono text-[9px] font-bold">
                            #4 CHOICE
                          </span>
                          <div className="mt-2 font-serif text-sm font-bold text-[#EDE6D3] break-words">
                            {(activeUnga.pref1Portfolios && activeUnga.pref1Portfolios[3]) || "None"}
                          </div>
                          <span className="text-[9px] text-[#8A9A7E] block mt-1">Quaternary Option</span>
                        </div>

                        {/* Choice 5 */}
                        <div className="border border-[#8A9A7E]/30 bg-[#2E3B2F]/40 p-3 text-left">
                          <span className="px-1.5 py-0.5 bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#8A9A7E] font-mono text-[9px] font-bold">
                            #5 CHOICE
                          </span>
                          <div className="mt-2 font-serif text-sm font-bold text-[#EDE6D3] break-words">
                            {(activeUnga.pref1Portfolios && activeUnga.pref1Portfolios[4]) || "None"}
                          </div>
                          <span className="text-[9px] text-[#8A9A7E] block mt-1">Quinary Option</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 6: Experience & Academic Intent */}
                    <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold block mb-2.5 flex items-center gap-1.5">
                        <Award className="h-3 w-3 text-[#C9A86A]" />
                        // MUN EXPERIENCE & STATEMENT OF INTENT
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <strong className="text-[#8A9A7E]">MUN Experience Level:</strong>{" "}
                          <span className="font-semibold text-[#EDE6D3]">{activeUnga.munExperience || "Novice"}</span>
                        </div>
                        <div>
                          <strong className="text-[#8A9A7E]">Past MUN Accolades / Distinctions:</strong>{" "}
                          <span className="text-[#EDE6D3]">{activeUnga.pastMunDetails || "None provided"}</span>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-[#8A9A7E]/15">
                        <span className="text-[10px] font-mono text-[#8A9A7E] uppercase block mb-1">
                          Statement of Motivation / Academic Purpose:
                        </span>
                        <div className="bg-[#141814] p-3.5 text-xs text-[#EDE6D3] italic leading-relaxed border border-[#8A9A7E]/20 whitespace-pre-wrap">
                          "{activeUnga.motivation || "No statement compiled."}"
                        </div>
                      </div>
                    </div>

                    {/* Section 7: Official Commemorative Merchandise */}
                    <div className={`p-4 border ${activeUnga.hasMerch ? "bg-amber-950/20 border-amber-500/40" : "bg-[#1A1F1A] border-[#8A9A7E]/20"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold flex items-center gap-1.5">
                          <Shirt className="h-3.5 w-3.5" />
                          // OFFICIAL COMMEMORATIVE MERCHANDISE
                        </span>
                        {activeUnga.hasMerch ? (
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Ordered (+₹599)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-mono text-[#8A9A7E] bg-[#141814] border border-[#8A9A7E]/30">
                            Not Purchased
                          </span>
                        )}
                      </div>
                      {activeUnga.hasMerch ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#EDE6D3] mt-3">
                          <div>
                            <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Size Selected:</span>
                            <span className="font-mono text-sm font-bold text-amber-300 bg-[#141814] px-2 py-0.5 border border-amber-500/30 inline-block mt-0.5">
                              {activeUnga.merchSize || "M"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Merchandise Extra:</span>
                            <span className="font-bold text-emerald-400 mt-0.5 block">
                              ₹599
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">Courier Dispatch:</span>
                            <span className="text-[#EDE6D3] text-[11px] mt-0.5 block leading-snug">
                              To be dispatched via postal courier to the provided address
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#8A9A7E] mt-1">
                          Delegate opted out of the merchandise add-on or is an internal IIST delegate.
                        </p>
                      )}
                    </div>

                    {/* Section 8: Payment Verification & UTR Transaction Proof */}
                    <div className="bg-[#1A1F1A] border-2 border-[#C9A86A]/40 p-4">
                      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A86A] font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#C9A86A]" />
                          // PAYMENT VERIFICATION & UTR TRANSACTION PROOF
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateUngaStatus(activeUnga.uid || activeUnga.id || "", activeUnga.status || "Payment Confirmed", "Verified")}
                            className="px-2 py-0.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
                          >
                            Mark Verified
                          </button>
                          <button
                            onClick={() => handleUpdateUngaStatus(activeUnga.uid || activeUnga.id || "", "Rejected", "Rejected")}
                            className="px-2 py-0.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
                          >
                            Mark Rejected
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono">12-Digit UTR / Transaction ID:</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-sm text-[#C9A86A] font-bold bg-[#141814] px-2 py-1 border border-[#C9A86A]/40 inline-block">
                                {activeUnga.utrNumber || activeUnga.transactionId || "Not Provided"}
                              </span>
                              {(activeUnga.utrNumber || activeUnga.transactionId) && (
                                <button
                                  onClick={() => handleCopyUtr(activeUnga.utrNumber || activeUnga.transactionId || "")}
                                  className="px-2 py-1 bg-[#2E3B2F] hover:bg-[#3d4f3e] text-[#C9A86A] border border-[#C9A86A]/40 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                                  title="Copy UTR to clipboard"
                                >
                                  <Copy className="h-3 w-3" />
                                  <span>{copiedUtr === (activeUnga.utrNumber || activeUnga.transactionId) ? "Copied!" : "Copy"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <div><strong className="text-[#8A9A7E]">Payer Name:</strong> {activeUnga.payerName || "N/A"}</div>
                          <div><strong className="text-[#8A9A7E]">Payment Mode:</strong> {activeUnga.paymentMode || "UPI"}</div>
                          <div><strong className="text-[#8A9A7E]">Payment Date:</strong> {activeUnga.paymentDate || "N/A"}</div>
                          <div>
                            <strong className="text-[#8A9A7E]">Verification Status:</strong>{" "}
                            <span className={`font-mono font-bold ${activeUnga.paymentStatus === "Verified" ? "text-emerald-400" : activeUnga.paymentStatus === "Rejected" ? "text-rose-400" : "text-amber-300"}`}>
                              {activeUnga.paymentStatus || "Pending"}
                            </span>
                          </div>
                        </div>

                        {/* Screenshot Preview */}
                        <div>
                          <span className="text-[#8A9A7E] block text-[10px] uppercase font-mono mb-1">
                            Uploaded Payment Receipt Screenshot:
                          </span>
                          {activeUnga.paymentScreenshotUrl ? (
                            <div className="flex items-center gap-3 bg-[#141814] p-3 border border-[#8A9A7E]/30">
                              <ProofThumbnail
                                url={activeUnga.paymentScreenshotUrl}
                                name={activeUnga.paymentScreenshotName || "payment_receipt.jpg"}
                                alt="Payment Proof"
                                className="h-16 w-16"
                                onClick={() => setViewProofModal({
                                  url: activeUnga.paymentScreenshotUrl || "",
                                  name: activeUnga.paymentScreenshotName,
                                  utr: activeUnga.utrNumber || activeUnga.transactionId,
                                  candidateName: activeUnga.name
                                })}
                              />
                              <div className="flex-1 text-xs">
                                <span className="text-[#EDE6D3] font-semibold block truncate" title={activeUnga.paymentScreenshotName}>
                                  {activeUnga.paymentScreenshotName || "payment_receipt.jpg"}
                                </span>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => setViewProofModal({
                                      url: activeUnga.paymentScreenshotUrl || "",
                                      name: activeUnga.paymentScreenshotName,
                                      utr: activeUnga.utrNumber || activeUnga.transactionId,
                                      candidateName: activeUnga.name
                                    })}
                                    className="px-2.5 py-1 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Enlarge</span>
                                  </button>
                                  <a
                                    href={activeUnga.paymentScreenshotUrl}
                                    download={activeUnga.paymentScreenshotName || "receipt"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 border border-[#8A9A7E]/30 bg-[#2E3B2F] hover:bg-[#3d4f3e] text-[#EDE6D3] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>Download</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-[#8A9A7E] italic bg-[#141814] p-3 border border-[#8A9A7E]/20">
                              No payment receipt screenshot uploaded.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 9: Secretariat Allotment Record (if allotted) */}
                    {activeUnga.allottedCountry && (
                      <div className="bg-emerald-950/30 border border-emerald-500/40 p-4">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                          // ALLOTTED DIPLOMATIC PORTFOLIO
                        </span>
                        <div className="text-sm font-serif text-[#EDE6D3]">
                          Allotted Country: <strong className="text-[#C9A86A] text-base">{activeUnga.allottedCountry}</strong> in{" "}
                          <strong className="text-emerald-300 uppercase">UNGA (Online Committee)</strong>
                        </div>
                        {activeUnga.adminNotes && (
                          <div className="text-xs text-[#8A9A7E] mt-1 pt-1 border-t border-emerald-500/20">
                            Secretariat Notes: <span className="text-[#EDE6D3]">{activeUnga.adminNotes}</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Footer Controls */}
                  <div className="mt-6 pt-4 border-t border-[#C9A86A]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] mr-1">
                        Set Status:
                      </span>
                      {(["Payment Confirmed", "Portfolio Allotted", "Waitlisted", "Rejected", "Pending Verification"] as const).map((statusOption) => (
                        <button
                          key={statusOption}
                          disabled={isUpdatingUngaStatus || activeUnga.status === statusOption}
                          onClick={() => handleUpdateUngaStatus(activeUnga.uid || activeUnga.id || "", statusOption)}
                          className={`px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 ${
                            activeUnga.status === statusOption
                              ? "bg-[#C9A86A] text-[#1A1F1A] border-[#C9A86A]"
                              : "bg-[#1A1F1A] text-[#EDE6D3] border-[#8A9A7E]/30 hover:border-[#C9A86A]"
                          }`}
                        >
                          {statusOption}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <button
                        onClick={() => {
                          setAllotUngaModalReg(activeUnga);
                          setAllotUngaForm({
                            country: activeUnga.allottedCountry || (activeUnga.pref1Portfolios && activeUnga.pref1Portfolios[0]) || activeUnga.pref1Country || "",
                            adminNotes: activeUnga.adminNotes || ""
                          });
                        }}
                        className="px-3.5 py-2 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-sans font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Compass className="h-3.5 w-3.5" />
                        <span>Allot Country</span>
                      </button>
                      <button
                        onClick={() => exportUngaToExcel([activeUnga], activeUnga.id || activeUnga.name)}
                        className="px-3.5 py-2 border border-[#C9A86A]/40 bg-[#1A1F1A] hover:bg-[#2E3B2F] text-[#C9A86A] text-xs font-sans font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Export XLSX</span>
                      </button>
                      <button
                        onClick={() => setConfirmUngaDeleteId(activeUnga.uid || activeUnga.id || "")}
                        className="px-3 py-2 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        onClick={closeUngaModal}
                        className="px-4 py-2 border border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================
            UNGA (ONLINE COMMITTEE): COUNTRY ALLOTMENT MODAL
           ======================================================== */}
        {allotUngaModalReg && (
          <div className="fixed inset-0 z-[125] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in flex items-center justify-center p-4">
            <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-md w-full p-6 text-left relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#C9A86A]/30 pb-3">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                    // UNGA ONLINE ALLOTMENT DESK
                  </span>
                  <h4 className="font-serif text-xl text-[#EDE6D3]">
                    Allot UNGA Country Portfolio
                  </h4>
                  <span className="font-sans text-xs text-[#8A9A7E]">
                    Candidate: <strong className="text-[#EDE6D3]">{allotUngaModalReg.name}</strong> ({allotUngaModalReg.id || allotUngaModalReg.uid})
                  </span>
                </div>
                <button
                  onClick={() => setAllotUngaModalReg(null)}
                  className="p-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#8A9A7E] hover:text-[#EDE6D3] hover:border-[#C9A86A] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Preferences Reference */}
              <div className="mt-4 p-3 bg-[#1A1F1A] border border-[#8A9A7E]/20 text-xs">
                <span className="text-[10px] font-mono text-[#C9A86A] uppercase block mb-1">Candidate's 5 Country Preferences:</span>
                {allotUngaModalReg.pref1Portfolios && allotUngaModalReg.pref1Portfolios.length > 0 ? (
                  <div className="space-y-1">
                    {allotUngaModalReg.pref1Portfolios.map((country, idx) => country ? (
                      <div key={idx} className="flex items-center justify-between text-[#EDE6D3]">
                        <span className="text-[#8A9A7E]">Choice #{idx + 1}:</span>
                        <button
                          type="button"
                          onClick={() => setAllotUngaForm({ ...allotUngaForm, country })}
                          className="font-bold text-[#C9A86A] hover:underline cursor-pointer"
                          title="Click to select as allotted country"
                        >
                          {country}
                        </button>
                      </div>
                    ) : null)}
                  </div>
                ) : (
                  <div className="text-[#EDE6D3]">{allotUngaModalReg.pref1Country || "No specific preferences"}</div>
                )}
              </div>

              {/* Allotment Form */}
              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                    Committee Chamber
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="United Nations General Assembly (UNGA - Online)"
                    className="w-full bg-[#141814] border border-[#8A9A7E]/30 text-[#C9A86A] px-3 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                    Allotted Country Portfolio *
                  </label>
                  <input
                    type="text"
                    value={allotUngaForm.country}
                    onChange={(e) => setAllotUngaForm({ ...allotUngaForm, country: e.target.value })}
                    placeholder="e.g. France / Brazil / Japan"
                    className="w-full bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] px-3 py-2 text-xs focus:outline-none placeholder-[#8A9A7E]/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                    Admin Notes / Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={allotUngaForm.adminNotes}
                    onChange={(e) => setAllotUngaForm({ ...allotUngaForm, adminNotes: e.target.value })}
                    placeholder="e.g. Allotted 1st preference via merit review."
                    className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#EDE6D3] px-3 py-2 text-xs focus:outline-none placeholder-[#8A9A7E]/50 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-3 border-t border-[#C9A86A]/30 flex gap-3">
                <button
                  onClick={() => setAllotUngaModalReg(null)}
                  className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] hover:border-[#C9A86A] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!allotUngaForm.country.trim()}
                  onClick={handleSaveUngaAllotment}
                  className="flex-1 bg-[#C9A86A] hover:bg-[#dfbe7e] py-2.5 text-xs font-bold uppercase tracking-wider text-[#1A1F1A] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  Confirm Allotment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            UNGA (ONLINE COMMITTEE): DELETE CONFIRMATION MODAL
           ======================================================== */}
        {confirmUngaDeleteId && (
          <div className="fixed inset-0 z-[125] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in flex items-center justify-center p-4">
            <div className="bg-[#2E3B2F] border-2 border-rose-500/50 max-w-sm w-full p-6 text-center relative shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#1A1F1A] border border-rose-500/40 text-rose-400 mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-normal text-[#EDE6D3]">Purge UNGA Online Record?</h3>
              <p className="mt-2 font-sans text-[#8A9A7E] text-xs leading-relaxed">
                Are you certain you want to remove UNGA registration <strong className="text-[#EDE6D3] font-mono">{confirmUngaDeleteId}</strong>? This action will permanently remove it from Firestore.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmUngaDeleteId(null)}
                  className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] py-2 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUngaDelete(confirmUngaDeleteId, confirmUngaDeleteId)}
                  className="flex-1 bg-rose-700 hover:bg-rose-600 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md cursor-pointer"
                >
                  Purge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            DOCUMENT & PROOF VIEWER MODAL (IMAGES, PDFS & CLOUD LINKS)
           ======================================================== */}
        {viewProofModal && (
          <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#141814]/95 backdrop-blur-md animate-fade-in flex items-center justify-center p-4">
            <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-2xl w-full p-6 text-left relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#C9A86A]/30 pb-3">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                    {viewProofModal.name?.toLowerCase().includes("id")
                      ? "// CANDIDATE IDENTIFICATION PROOF"
                      : isPdfDocument(viewProofModal.url, viewProofModal.name)
                      ? "// ATTACHED PDF PROOF DOCUMENT"
                      : isDriveCloudLink(viewProofModal.url)
                      ? "// CLOUD DOCUMENT LINK"
                      : "// PAYMENT RECEIPT PROOF"}
                  </span>
                  <h4 className="font-serif text-lg text-[#EDE6D3]">
                    {viewProofModal.candidateName || "Candidate Document"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {viewProofModal.name && (
                      <span className="text-[11px] text-[#8A9A7E] truncate max-w-xs" title={viewProofModal.name}>
                        File: <span className="text-[#EDE6D3]">{viewProofModal.name}</span>
                      </span>
                    )}
                    {viewProofModal.utr && (
                      <span className="font-mono text-xs text-[#8A9A7E]">
                        • UTR: <strong className="text-[#C9A86A]">{viewProofModal.utr}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewProofModal(null)}
                  className="p-1.5 border border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#8A9A7E] hover:text-[#EDE6D3] hover:border-[#C9A86A] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-4 flex flex-col items-center justify-center bg-[#141814] border border-[#8A9A7E]/30 p-2 min-h-[300px] max-h-[70vh] overflow-auto">
                {(() => {
                  const resolvedUrl = resolveMediaUrl(viewProofModal.url);
                  const isPdf = isPdfDocument(viewProofModal.url, viewProofModal.name);
                  const isDrive = isDriveCloudLink(viewProofModal.url);

                  if (isPdf) {
                    return (
                      <div className="w-full h-full flex flex-col items-center">
                        <iframe
                          src={resolvedUrl}
                          title={viewProofModal.name || "Proof PDF"}
                          className="w-full h-[55vh] border-0 rounded bg-white"
                        />
                        <div className="mt-2 text-[11px] text-[#8A9A7E] flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-[#C9A86A]" />
                          <span>PDF Document embedded above. Use browser viewer or download button below.</span>
                        </div>
                      </div>
                    );
                  }

                  if (isDrive) {
                    return (
                      <div className="py-12 px-6 text-center max-w-md mx-auto">
                        <ExternalLink className="h-10 w-10 text-[#C9A86A] mx-auto mb-3" />
                        <h5 className="font-sans text-sm font-bold text-[#EDE6D3] uppercase">Cloud Storage Document</h5>
                        <p className="text-xs text-[#8A9A7E] mt-1.5 mb-4 leading-relaxed">
                          This document is stored on Google Drive / external cloud storage and cannot be displayed in a frame.
                        </p>
                        <a
                          href={resolvedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Open Document in New Tab</span>
                        </a>
                      </div>
                    );
                  }

                  return (
                    <img
                      src={resolvedUrl}
                      alt={viewProofModal.name || "Proof Document"}
                      className="max-h-[60vh] max-w-full object-contain mx-auto"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.img-error-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'img-error-fallback py-10 px-4 text-center text-xs text-[#8A9A7E]';
                          fallback.innerHTML = `
                            <p class="text-rose-400 font-bold mb-1">Unable to display image preview</p>
                            <p class="text-[11px] text-[#8A9A7E] max-w-xs mx-auto mb-3">The attachment may be in an unsupported file format or requires authenticated access.</p>
                            <a href="${resolvedUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[#C9A86A] underline hover:text-[#EDE6D3]">
                              Open Direct Link &rarr;
                            </a>
                          `;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  );
                })()}
              </div>

              <div className="mt-4 pt-3 border-t border-[#C9A86A]/20 flex justify-between items-center">
                <a
                  href={resolveMediaUrl(viewProofModal.url)}
                  download={viewProofModal.name || "proof_document"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>
                    {isPdfDocument(viewProofModal.url, viewProofModal.name) ? "Download / Open PDF" : "Download Proof"}
                  </span>
                </a>
                <button
                  onClick={() => setViewProofModal(null)}
                  className="px-4 py-2 border border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#EDE6D3] text-xs font-sans uppercase tracking-wider cursor-pointer hover:border-[#C9A86A]"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PRIORITY ROUND: PORTFOLIO ALLOTMENT MODAL
           ======================================================== */}
        {allotModalReg && (
          <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in flex items-center justify-center p-4">
            <div className="bg-[#2E3B2F] border-2 border-[#C9A86A] max-w-md w-full p-6 text-left relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#C9A86A]/30 pb-3">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                    // SECRETARIAT ALLOTMENT DESK
                  </span>
                  <h4 className="font-serif text-xl text-[#EDE6D3]">
                    Allot Council Portfolio
                  </h4>
                  <span className="font-sans text-xs text-[#8A9A7E]">
                    Candidate: <strong className="text-[#EDE6D3]">{allotModalReg.name}</strong> ({allotModalReg.id || allotModalReg.uid})
                  </span>
                </div>
                <button
                  onClick={() => setAllotModalReg(null)}
                  className="p-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#8A9A7E] hover:text-[#EDE6D3] hover:border-[#C9A86A] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Preferences Reference */}
              <div className="mt-4 p-3 bg-[#1A1F1A] border border-[#8A9A7E]/20 text-xs">
                <span className="text-[10px] font-mono text-[#C9A86A] uppercase block mb-1">Candidate Preferences:</span>
                <div className="text-[#EDE6D3]"><strong className="text-[#8A9A7E]">1st:</strong> {allotModalReg.pref1Committee?.toUpperCase()} — {allotModalReg.pref1Country || "Any"}</div>
                {allotModalReg.pref2Committee && (
                  <div className="text-[#8A9A7E]"><strong className="text-[#8A9A7E]">2nd:</strong> {allotModalReg.pref2Committee?.toUpperCase()} — {allotModalReg.pref2Country || "Any"}</div>
                )}
                {allotModalReg.pref3Committee && (
                  <div className="text-[#8A9A7E]"><strong className="text-[#8A9A7E]">3rd:</strong> {allotModalReg.pref3Committee?.toUpperCase()} — {allotModalReg.pref3Country || "Any"}</div>
                )}
              </div>

              {/* Allotment Form */}
              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                    Select Allotted Committee *
                  </label>
                  <select
                    value={allotForm.committee}
                    onChange={(e) => setAllotForm({ ...allotForm, committee: e.target.value })}
                    className="w-full bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] px-3 py-2 text-xs focus:outline-none uppercase"
                  >
                    <option value="copuos">UNCOPUOS</option>
                    <option value="unga">UNGA (Online)</option>
                    <option value="unhrc">UNHRC</option>
                    <option value="unodc">UNODC</option>
                    <option value="nes75">NES'75</option>
                    <option value="undp">UNDP</option>
                    <option value="ip_journalism">IP (Journalism)</option>
                    <option value="ip_photojournalism">IP (Photojournalism)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                    Allotted Country / Delegation Portfolio *
                  </label>
                  <input
                    type="text"
                    value={allotForm.country}
                    onChange={(e) => setAllotForm({ ...allotForm, country: e.target.value })}
                    placeholder="e.g. United States of America / Lead Correspondent"
                    className="w-full bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] px-3 py-2 text-xs focus:outline-none placeholder-[#8A9A7E]/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] block mb-1">
                    Admin Notes / Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={allotForm.adminNotes}
                    onChange={(e) => setAllotForm({ ...allotForm, adminNotes: e.target.value })}
                    placeholder="e.g. Allotted 1st choice via priority merit round."
                    className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#EDE6D3] px-3 py-2 text-xs focus:outline-none placeholder-[#8A9A7E]/50 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-3 border-t border-[#C9A86A]/30 flex gap-3">
                <button
                  onClick={() => setAllotModalReg(null)}
                  className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] hover:border-[#C9A86A] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!allotForm.committee || !allotForm.country.trim()}
                  onClick={handleSaveAllotment}
                  className="flex-1 bg-[#C9A86A] hover:bg-[#dfbe7e] py-2.5 text-xs font-bold uppercase tracking-wider text-[#1A1F1A] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  Confirm Allotment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PRIORITY ROUND: DELETE CONFIRMATION MODAL
           ======================================================== */}
        {confirmPriorityDeleteId && (
          <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#141814]/90 backdrop-blur-md animate-fade-in flex items-center justify-center p-4">
            <div className="bg-[#2E3B2F] border-2 border-rose-500/50 max-w-sm w-full p-6 text-center relative shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#1A1F1A] border border-rose-500/40 text-rose-400 mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-normal text-[#EDE6D3]">Purge Priority Record?</h3>
              <p className="mt-2 font-sans text-[#8A9A7E] text-xs leading-relaxed">
                Are you certain you want to remove priority registration <strong className="text-[#EDE6D3] font-mono">{confirmPriorityDeleteId}</strong>? This action will permanently remove it from Firestore.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmPriorityDeleteId(null)}
                  className="flex-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] py-2 text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePriorityDelete(confirmPriorityDeleteId, confirmPriorityDeleteId)}
                  className="flex-1 bg-rose-700 hover:bg-rose-600 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md cursor-pointer"
                >
                  Purge
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
