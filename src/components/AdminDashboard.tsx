/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
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
  Copy
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
      allow create: if isAdmin() || (isSignedIn() && request.resource.data.userId == request.auth.uid);
      allow update: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid && request.resource.data.userId == resource.data.userId);
      allow delete: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
    }

    match /workshop_registrations/{registrationId} {
      allow get: if isAdmin() || (isSignedIn() && (registrationId == request.auth.uid || resource.data.userId == request.auth.uid));
      allow list: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if isAdmin() || (isSignedIn() && request.resource.data.userId == request.auth.uid);
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
  CollectionCounts 
} from "../utils/firestoreSeed";
import { RegistrationDetails, CountryMatrixRow, PortfolioStatus, CommitteeId, ContactQuery, EBRegistration, CampusAmbassadorRegistration, WorkshopRegistrationDetails } from "../types";


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

  // New portfolio states
  const [activeSubTab, setActiveSubTab] = useState<"registrations" | "eb" | "campus-ambassador" | "workshop" | "queries" | "database">("registrations");
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, Partial<Record<CommitteeId | "copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>>({});
  
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


  const adminEmails = ["agnit.dg@gmail.com", "iist.mun.club@gmail.com"];
  const isAdmin = Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));

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

  const exportEbToExcel = () => {
    const dataToExport = ebRegistrations.map((r) => ({
      "Dossier ID": r.id,
      "Full Name": r.name,
      "Email": r.email,
      "Phone": r.phone,
      "Institution": r.institution,
      "Course": r.course,
      "Year": r.yearOfStudy,
      "City/State": r.cityState,
      "1st Pref Committee": r.pref1Committee,
      "1st Pref Role": r.pref1Role,
      "2nd Pref Committee": r.pref2Committee,
      "2nd Pref Role": r.pref2Role,
      "Delegate Experience": r.munDelegateCount,
      "EB Experience": r.munEbCount,
      "Status": r.status,
      "Proposed Agenda": r.proposedAgendas,
      "Motivation": r.motivation,
      "CV Link": r.cvUrl || "N/A",
      "Photo Link": r.photoUrl || "N/A",
      "Study Guide Sample": r.sampleStudyGuideLink || "N/A",
      "Timestamp": r.timestamp
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EB Applications");
    XLSX.writeFile(workbook, `IISTMUN_2027_EB_Applications_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast("Exported EB Applications to Excel!");
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

  const exportCaToExcel = () => {
    const dataToExport = caRegistrations.map((r) => ({
      "Fellowship ID": r.id,
      "Ambassador Name": r.name,
      "Email": r.email,
      "WhatsApp Phone": r.phone,
      "Institution": r.institution,
      "Course": r.course,
      "Year": r.yearOfStudy,
      "City/State": r.cityState,
      "Target Mobilization": r.targetMobilization,
      "College Clubs": r.collegeClubs,
      "Social Handles": r.socialHandles,
      "Prior CA Experience": r.priorCaExperience,
      "Status": r.status,
      "Motivation": r.motivation,
      "Promotion Plan": r.promotionPlan,
      "Photo Link": r.photoUrl || "N/A",
      "ID Proof Link": r.idProofUrl || "N/A",
      "Timestamp": r.timestamp
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Campus Ambassadors");
    XLSX.writeFile(workbook, `IISTMUN_2027_Campus_Ambassadors_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast("Exported Campus Ambassadors to Excel!");
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
    return (portfolioOverrides[countryName]?.[committee as CommitteeId] ?? defaultStatus) || "N/A";
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
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveSubTab("queries")}
              className={`flex items-center gap-2 px-4 py-2 border transition-all cursor-pointer text-xs font-sans font-semibold uppercase tracking-wider ${
                activeSubTab === "queries"
                  ? "border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A]"
                  : "border-[#C9A86A]/40 bg-[#2E3B2F] text-[#EDE6D3] hover:bg-[#C9A86A] hover:text-[#1A1F1A]"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Contact Queries ({contactQueries.length})</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={registrations.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-[#C9A86A]/40 bg-[#2E3B2F] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              disabled={registrations.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-[#C9A86A]/40 bg-[#2E3B2F] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-3.5 w-3.5" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-10">
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
            className={`border p-4 text-left shadow-sm cursor-pointer transition-all ${
              activeSubTab === "eb"
                ? "border-[#C9A86A] bg-[#2E3B2F] ring-1 ring-[#C9A86A]"
                : "border-[#C9A86A]/40 bg-[#2E3B2F] hover:border-[#C9A86A]"
            }`}
          >
            <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#C9A86A] font-semibold block">EB APPLICANTS</span>
            <div className="flex justify-between items-end mt-1.5">
              <span className="font-serif text-2xl font-normal text-[#EDE6D3]">{ebRegistrations.length}</span>
              <div className="p-1.5 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A]">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <div 
            onClick={() => setActiveSubTab("campus-ambassador")}
            className={`border p-4 text-left shadow-sm cursor-pointer transition-all ${
              activeSubTab === "campus-ambassador"
                ? "border-[#8BA06F] bg-[#2E3B2F] ring-1 ring-[#8BA06F]"
                : "border-[#8BA06F]/40 bg-[#2E3B2F] hover:border-[#8BA06F]"
            }`}
          >
            <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#8BA06F] font-semibold block">AMBASSADORS</span>
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
            onClick={() => setActiveSubTab("registrations")}
            className={`px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "registrations"
                ? "border-[#C9A86A] text-[#C9A86A] font-semibold"
                : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
            }`}
          >
            Delegate Registrations ({filtered.length})
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
                    <option value="uncopuos">UNCOPUOS</option>
                    <option value="unhrc">UNHRC</option>
                    <option value="unodc">UNODC</option>
                    <option value="nes75">NES'75</option>
                    <option value="unga">UNGA</option>
                    <option value="undp">UNDP</option>
                    <option value="ip">IP</option>
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
                  onClick={exportEbToExcel}
                  disabled={ebRegistrations.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  title="Download all filtered applications as an Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
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
                    <option value="uncopuos" className="bg-[#1A1F1A] text-[#EDE6D3]">UNCOPUOS</option>
                    <option value="unhrc" className="bg-[#1A1F1A] text-[#EDE6D3]">UNHRC</option>
                    <option value="unodc" className="bg-[#1A1F1A] text-[#EDE6D3]">UNODC</option>
                    <option value="nes75" className="bg-[#1A1F1A] text-[#EDE6D3]">NES'75</option>
                    <option value="unga" className="bg-[#1A1F1A] text-[#EDE6D3]">UNGA</option>
                    <option value="undp" className="bg-[#1A1F1A] text-[#EDE6D3]">UNDP</option>
                    <option value="ip" className="bg-[#1A1F1A] text-[#EDE6D3]">INTERNATIONAL PRESS (IP)</option>
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
                  onClick={exportCaToExcel}
                  disabled={caRegistrations.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8BA06F] hover:bg-[#a1b783] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  title="Download all campus ambassadors as an Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
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
                        <th className="p-3">UNCOPUOS</th>
                        <th className="p-3">UNHRC</th>
                        <th className="p-3">UNODC</th>
                        <th className="p-3">NES'75</th>
                        <th className="p-3">UNGA</th>
                        <th className="p-3">UNDP</th>
                        <th className="p-3">IP</th>
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
                              committee="unga"
                              currentStatus={getPortfolioStatus(row.country, "unga", row.unga || "Available")}
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
                              committee="ip"
                              currentStatus={getPortfolioStatus(row.country, "ip", row.ip || "Reserved")}
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
                    onClick={handlePurgeSampleData}
                    disabled={isPurging || isSeeding}
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
                                href="https://console.firebase.google.com/project/gen-lang-client-0802094651/firestore/rules"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#C9A86A] underline font-medium hover:text-white"
                              >
                                Firebase Console &rarr; Firestore Database &rarr; Rules
                              </a>
                            </li>
                            <li>
                              Paste and click <strong className="text-white">"Publish"</strong>, then return here and re-click <strong className="text-white">"Seed All (+ Forms & Records)"</strong>.
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
                              href="https://console.firebase.google.com/project/gen-lang-client-0802094651/firestore/rules"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2E3B2F] border border-[#C9A86A]/40 text-[#EDE6D3] hover:text-white text-xs font-sans font-semibold transition-all"
                            >
                              <span>Open Firebase Rules Console &rarr;</span>
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

        {/* Inspection Modal */}
        {selectedReg && (
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

      </div>
    </div>
  );
}
