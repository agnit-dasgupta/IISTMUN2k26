/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, User, Phone, Mail, Award, CheckCircle, ArrowLeft, 
  Share2, Download, RefreshCw, Layers, Building2, UserCheck, 
  Users, GraduationCap, FileText, CheckCircle2, ShieldCheck, Compass
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { motion } from "motion/react";
import { InstitutionSelect } from "./InstitutionSelect";
import QRCodeDisplay from "./QRCodeDisplay";
import { downloadBoardingPassPDF } from "../utils/pdfGenerator";

interface WorkshopRegistrationProps {
  setActiveTab: (tab: string) => void;
}

export interface WorkshopRegistrationDetails {
  id: string;
  userId: string;
  regType: "individual" | "school";
  name: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  experience: "Beginner" | "Intermediate" | "Advanced";
  motivation: string;
  timestamp: string;
  // School/Institutional specific fields
  teacherName?: string;
  teacherDesignation?: string;
  teacherEmail?: string;
  teacherPhone?: string;
  estimatedStudents?: string;
  gradeLevels?: string;
  specialRequirements?: string;
}

export default function WorkshopRegistration({ setActiveTab }: WorkshopRegistrationProps) {
  const { user, loading: authLoading, signInWithGoogle, isSigningIn } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [regType, setRegType] = useState<"individual" | "school">("individual");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    course: "",
    experience: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    motivation: "",
    // Teacher in charge details
    teacherName: "",
    teacherDesignation: "",
    teacherEmail: "",
    teacherPhone: "",
    estimatedStudents: "10-15",
    gradeLevels: "Class 9 to 12",
    specialRequirements: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registeredDetails, setRegisteredDetails] = useState<WorkshopRegistrationDetails | null>(null);
  const [loadingReg, setLoadingReg] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const workshopPassRef = useRef<HTMLDivElement>(null);

  // Auto-fill user name/email when logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || "",
        teacherEmail: prev.teacherEmail || user.email || "",
        teacherName: prev.teacherName || user.displayName || "",
      }));
    }
  }, [user]);

  // Fetch existing registration for current user if any
  useEffect(() => {
    if (!user) {
      setRegisteredDetails(null);
      setLoadingReg(false);
      return;
    }

    setLoadingReg(true);
    const docRef = doc(db, "workshop_registrations", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as WorkshopRegistrationDetails;
        setRegisteredDetails(data);
        if (data.regType) {
          setRegType(data.regType);
        }
      } else {
        setRegisteredDetails(null);
      }
      setLoadingReg(false);
    }, (error) => {
      console.error("Error fetching workshop registration:", error instanceof Error ? error.message : "Fetch error");
      setLoadingReg(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newErrors: Record<string, string> = {};

    if (regType === "individual") {
      if (!formData.name.trim()) newErrors.name = "Full name is required.";
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required.";
      if (!formData.phone.trim()) newErrors.phone = "Contact phone number is required.";
      if (!formData.institution.trim()) newErrors.institution = "Academic institution name is required.";
      if (!formData.course.trim()) newErrors.course = "Course / Department or Class is required.";
      if (!formData.motivation.trim() || formData.motivation.length < 15) {
        newErrors.motivation = "Please state your academic intent (minimum 15 characters).";
      }
    } else {
      // School / Institutional Registration
      if (!formData.institution.trim()) newErrors.institution = "School / Institution name is required.";
      if (!formData.teacherName.trim()) newErrors.teacherName = "Teacher-in-Charge name is required.";
      if (!formData.teacherDesignation.trim()) newErrors.teacherDesignation = "Designation / Academic Title is required.";
      if (!formData.teacherEmail.trim() || !/\S+@\S+\.\S+/.test(formData.teacherEmail)) newErrors.teacherEmail = "Valid institutional teacher email is required.";
      if (!formData.teacherPhone.trim()) newErrors.teacherPhone = "Teacher contact phone number is required.";
      if (!formData.estimatedStudents.trim()) newErrors.estimatedStudents = "Please specify estimated delegation count.";
      if (!formData.gradeLevels.trim()) newErrors.gradeLevels = "Please specify target class / grade levels.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const ticketId = regType === "school" 
        ? `SCH-WS-${Math.floor(100000 + Math.random() * 900000)}` 
        : `WS-${Math.floor(100000 + Math.random() * 900000)}`;

      const newReg: WorkshopRegistrationDetails = {
        id: ticketId,
        userId: user.uid,
        regType,
        name: regType === "school" ? formData.institution.trim() : formData.name.trim(),
        email: regType === "school" ? formData.teacherEmail.trim() : formData.email.trim(),
        phone: regType === "school" ? formData.teacherPhone.trim() : formData.phone.trim(),
        institution: formData.institution.trim(),
        course: regType === "school" ? `School Delegation (${formData.gradeLevels})` : formData.course.trim(),
        experience: formData.experience,
        motivation: regType === "school" 
          ? (formData.specialRequirements.trim() || "Official school delegation for Space Technology Workshop.") 
          : formData.motivation.trim(),
        timestamp: new Date().toLocaleString(),
        ...(regType === "school" && {
          teacherName: formData.teacherName.trim(),
          teacherDesignation: formData.teacherDesignation.trim(),
          teacherEmail: formData.teacherEmail.trim(),
          teacherPhone: formData.teacherPhone.trim(),
          estimatedStudents: formData.estimatedStudents.trim(),
          gradeLevels: formData.gradeLevels.trim(),
          specialRequirements: formData.specialRequirements.trim(),
        }),
      };

      await setDoc(doc(db, "workshop_registrations", user.uid), newReg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workshop_registrations/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!registeredDetails) return;
    const typeStr = registeredDetails.regType === "school" ? "School Delegation" : "Individual Delegate";
    navigator.clipboard.writeText(`IIST MUN 2026 Space Technology & Orbital Diplomacy Workshop Pass: ${registeredDetails.id} (${typeStr} - ${registeredDetails.name})`);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleDownloadPass = async () => {
    if (!registeredDetails) return;
    setIsDownloading(true);
    try {
      await downloadBoardingPassPDF({
        element: workshopPassRef.current,
        ticketId: registeredDetails.id,
        candidateName: registeredDetails.name,
        registrationType: "workshop",
        details: {
          institution: registeredDetails.institution,
          courseOrGrade: registeredDetails.course,
          email: registeredDetails.email,
          phone: registeredDetails.phone,
          timestamp: registeredDetails.timestamp,
        },
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!user) return;
    if (window.confirm("Are you sure you want to surrender your workshop accreditation record? This action is irreversible.")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "workshop_registrations", user.uid));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `workshop_registrations/${user.uid}`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (authLoading || loadingReg) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#1A1F1A]">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A86A]/70 bg-[#2E3B2F] p-1.5 shadow-md animate-pulse mb-4">
          <img
            src="/logo-emblem-transparent.png"
            alt="IIST MUN 2027"
            className="h-full w-full object-contain"
          />
        </div>
        <p className="font-serif text-sm text-[#EDE6D3] tracking-wide">Accessing Diplomatic Archives...</p>
        <p className="font-sans text-[10px] text-[#8A9A7E] uppercase tracking-[0.2em] mt-1">Verifying Academic Credentials</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8 text-left relative z-10"
    >
      {/* Return to Secretariat Header */}
      <div className="flex items-center justify-between border-b border-[#C9A86A]/20 pb-4 mb-8">
        <button
          onClick={() => setActiveTab("home")}
          className="group flex items-center gap-2 font-sans text-xs uppercase tracking-[0.18em] text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform text-[#C9A86A]" />
          Return to Overview
        </button>
        <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] border border-[#C9A86A]/30 bg-[#2E3B2F]/60 px-2.5 py-1">
          Workshop Dispatch 2026
        </div>
      </div>

      {/* Main Container */}
      {!user ? (
        <div className="bg-[#2E3B2F] border border-[#C9A86A]/30 p-8 md:p-12 text-center shadow-2xl relative">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A86A]/70 bg-[#1A1F1A] p-2 mx-auto mb-6 shadow-md">
            <img
              src="/logo-emblem-transparent.png"
              alt="IIST MUN 2027"
              className="h-full w-full object-contain filter drop-shadow-sm"
            />
          </div>

          <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#C9A86A] font-bold block mb-2">
            Section 04 • Academic Masterclass
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#EDE6D3] font-normal tracking-wide mb-3">
            Space Technology & Orbital Diplomacy
          </h2>
          <p className="font-sans text-sm text-[#EDE6D3]/80 max-w-xl mx-auto leading-relaxed mb-8">
            Access the official workshop registration portal for the masterclass curated by IIST Faculty and ISRO researchers. Please sign in with Google to establish your verified academic accreditation profile.
          </p>

          <button
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="inline-flex items-center gap-3 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] transition-all cursor-pointer disabled:opacity-50 shadow-md"
          >
            {isSigningIn ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A1F1A] border-t-transparent" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#1A1F1A"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#1A1F1A"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#1A1F1A"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#1A1F1A"/>
                </svg>
                Authenticate with Google
              </>
            )}
          </button>
        </div>
      ) : registeredDetails ? (
        /* Confirmed Workshop Accreditation Card (Archival Diplomatic Boarding Pass) */
        <div className="space-y-6">
          <div
            ref={workshopPassRef}
            id="workshop-boarding-pass-card"
            className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 md:p-8 shadow-2xl relative text-left"
          >
            {/* Top Seal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#C9A86A]/20 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#C9A86A] font-sans text-[9px] font-bold uppercase tracking-[0.18em]">
                    <CheckCircle className="h-3 w-3 text-[#C9A86A]" />
                    {registeredDetails.regType === "school" ? "Official School Delegation" : "Individual Seat Confirmed"}
                  </span>
                  <span className="font-mono text-[9px] text-[#8A9A7E] uppercase tracking-widest">
                    Dispatch # {registeredDetails.id}
                  </span>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl text-[#EDE6D3] font-normal tracking-wide">
                  {registeredDetails.regType === "school" ? "Institutional Workshop Delegation Pass" : "Workshop Accreditation Pass"}
                </h2>
                <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                  Presented by Indian Institute of Space Science and Technology
                </p>
              </div>
              
              <div className="bg-[#1A1F1A] border border-[#C9A86A]/40 p-3.5 text-right shrink-0">
                <span className="font-sans text-[9px] text-[#8A9A7E] uppercase tracking-[0.2em] block font-bold">Credential Key</span>
                <span className="font-mono text-base md:text-lg text-[#C9A86A] font-bold tracking-widest block mt-0.5">{registeredDetails.id}</span>
              </div>
            </div>

            {/* Ticket Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <span className="font-sans text-[9px] text-[#8A9A7E] uppercase tracking-[0.18em] block font-semibold">
                    {registeredDetails.regType === "school" ? "School / Institution Name" : "Accredited Participant"}
                  </span>
                  <p className="font-serif text-xl text-[#EDE6D3] font-bold tracking-wide mt-0.5">{registeredDetails.name}</p>
                </div>

                {registeredDetails.regType === "school" ? (
                  <div className="bg-[#1A1F1A] p-4 border border-[#8A9A7E]/20 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[#C9A86A] font-sans text-[10px] font-bold uppercase tracking-[0.16em]">
                      <UserCheck className="h-3.5 w-3.5 text-[#C9A86A]" />
                      Faculty Advisor / Teacher-in-Charge
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#8A9A7E]/20">
                      <div>
                        <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block">Teacher Name</span>
                        <p className="font-sans text-xs text-[#EDE6D3] font-bold">{registeredDetails.teacherName || "N/A"}</p>
                        <p className="font-sans text-[10px] text-[#8A9A7E]">{registeredDetails.teacherDesignation}</p>
                      </div>
                      <div>
                        <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block">Official Contact</span>
                        <p className="font-mono text-[10px] text-[#EDE6D3]">{registeredDetails.teacherEmail}</p>
                        <p className="font-mono text-[10px] text-[#8A9A7E]">{registeredDetails.teacherPhone}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 bg-[#1A1F1A] p-3.5 border border-[#8A9A7E]/20">
                    <div>
                      <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Institution</span>
                      <p className="font-sans text-xs text-[#EDE6D3] font-medium truncate mt-0.5">{registeredDetails.institution}</p>
                    </div>
                    <div>
                      <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Course / Class</span>
                      <p className="font-sans text-xs text-[#EDE6D3] font-medium truncate mt-0.5">{registeredDetails.course}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Masterclass Module</span>
                    <p className="font-serif text-sm text-[#EDE6D3] font-bold mt-0.5">Space Technology & Orbital Diplomacy</p>
                    <p className="font-sans text-[10px] text-[#8A9A7E] mt-0.5">September 17, 2026 • IIST Campus</p>
                  </div>

                  {registeredDetails.regType === "school" ? (
                    <div>
                      <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Delegation Scope</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A] px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider">
                          Est. {registeredDetails.estimatedStudents || "10+"} Students
                        </span>
                        <span className="bg-[#1A1F1A] border border-[#8A9A7E]/30 text-[#8A9A7E] px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider">
                          {registeredDetails.gradeLevels || "High School"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">Experience Tier</span>
                      <span className="inline-block bg-[#1A1F1A] border border-[#C9A86A]/30 text-[#C9A86A] px-2.5 py-0.5 text-[9px] font-sans font-bold mt-1 uppercase tracking-wider">
                        {registeredDetails.experience}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-[#1A1F1A] border border-[#C9A86A]/30 text-xs font-sans text-[#EDE6D3] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#C9A86A] shrink-0" />
                  <span><strong>Accreditation Notice:</strong> Seat officially logged. Workshop lab schedules and study packets will be released prior to commencement.</span>
                </div>
              </div>

              {/* Scannable QR Code Column */}
              <div className="flex flex-col items-center justify-center bg-[#1A1F1A] border border-[#C9A86A]/30 p-5">
                <QRCodeDisplay
                  uniqueId={registeredDetails.id}
                  candidateName={registeredDetails.name}
                  title="IIST MUN Workshop Pass"
                  subtitle="Scan at Academic Verification Desk"
                  size={120}
                  showScannerTest={true}
                />
              </div>
            </div>

            {/* Statement / Special Notes section */}
            <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4 mt-6">
              <span className="font-sans text-[8.5px] text-[#8A9A7E] uppercase tracking-wider block font-semibold">
                {registeredDetails.regType === "school" ? "Institutional Notes & Requirements" : "Academic Statement & Intent"}
              </span>
              <p className="font-sans text-xs text-[#EDE6D3]/90 leading-relaxed italic mt-1 whitespace-pre-wrap">
                "{registeredDetails.motivation}"
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-[#C9A86A]/20">
              <button
                onClick={handleShare}
                className="flex-1 min-w-[140px] bg-[#1A1F1A] hover:bg-[#252b25] border border-[#C9A86A]/40 px-5 py-3 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#EDE6D3] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="h-3.5 w-3.5 text-[#C9A86A]" />
                {copiedKey ? "Pass Key Copied!" : "Share Pass Key"}
              </button>

              <button
                onClick={handleDownloadPass}
                disabled={isDownloading}
                className="flex-1 min-w-[140px] bg-[#C9A86A] hover:bg-[#bfa060] disabled:opacity-50 px-5 py-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-[#1A1F1A] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <div className="h-4 w-4 border-2 border-[#1A1F1A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-[#1A1F1A]" />
                )}
                {isDownloading ? "Compiling PDF..." : "Download Official Pass (PDF)"}
              </button>

              <button
                onClick={handleCancelRegistration}
                className="flex-1 min-w-[140px] border border-rose-500/30 hover:bg-rose-900/20 px-5 py-3 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-rose-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Surrender Seat
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Registration Form */
        <div className="bg-[#2E3B2F] border border-[#C9A86A]/30 p-6 md:p-8 shadow-2xl relative">
          
          <div className="border-b border-[#C9A86A]/20 pb-5 mb-6">
            <div className="flex items-center gap-2 text-[#C9A86A]">
              <Compass className="h-4 w-4 text-[#C9A86A]" />
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-semibold">Section 04 • Academic Masterclass</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal tracking-wide mt-1">
              Space Tech & Orbital Diplomacy Registration
            </h2>
            <p className="font-sans text-xs text-[#8A9A7E] mt-1">
              Register an individual delegate or enroll an entire institutional school contingent coordinated by a Teacher-in-Charge.
            </p>

            {/* Registration Mode Switcher */}
            <div className="mt-6 grid grid-cols-2 gap-3 p-1 bg-[#1A1F1A] border border-[#C9A86A]/30">
              <button
                type="button"
                onClick={() => setRegType("individual")}
                className={`flex items-center justify-center gap-2 py-3 px-4 font-sans text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer ${
                  regType === "individual"
                    ? "bg-[#2E3B2F] text-[#C9A86A] border border-[#C9A86A]/50 shadow-sm"
                    : "text-[#8A9A7E] hover:text-[#EDE6D3] hover:bg-[#2E3B2F]/40"
                }`}
              >
                <User className="h-3.5 w-3.5 text-[#C9A86A]" />
                Individual Delegate
              </button>

              <button
                type="button"
                onClick={() => setRegType("school")}
                className={`flex items-center justify-center gap-2 py-3 px-4 font-sans text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer ${
                  regType === "school"
                    ? "bg-[#2E3B2F] text-[#C9A86A] border border-[#C9A86A]/50 shadow-sm"
                    : "text-[#8A9A7E] hover:text-[#EDE6D3] hover:bg-[#2E3B2F]/40"
                }`}
              >
                <Building2 className="h-3.5 w-3.5 text-[#C9A86A]" />
                School Delegation (Institutional)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {regType === "individual" ? (
              /* INDIVIDUAL FORM FIELDS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Full Name */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                    Full Name of Delegate <span className="text-[#C9A86A]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full bg-[#1A1F1A] border ${errors.name ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} pl-11 pr-4 py-3 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.name && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.name}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                    Email Address <span className="text-[#C9A86A]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full bg-[#1A1F1A] border ${errors.email ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} pl-11 pr-4 py-3 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                      placeholder="Enter active email address"
                    />
                  </div>
                  {errors.email && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.email}</p>}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                    Contact Number (WhatsApp) <span className="text-[#C9A86A]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full bg-[#1A1F1A] border ${errors.phone ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} pl-11 pr-4 py-3 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {errors.phone && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.phone}</p>}
                </div>

                {/* Background Level selection */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                    Technical / Physics Background <span className="text-[#C9A86A]">*</span>
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 px-4 py-3 font-sans text-xs text-[#EDE6D3] focus:outline-none focus:border-[#C9A86A] transition-all cursor-pointer"
                  >
                    <option value="Beginner" className="bg-[#1A1F1A] text-[#EDE6D3]">Beginner (Introductory interest in space sciences)</option>
                    <option value="Intermediate" className="bg-[#1A1F1A] text-[#EDE6D3]">Intermediate (Familiar with high school physics / basic code)</option>
                    <option value="Advanced" className="bg-[#1A1F1A] text-[#EDE6D3]">Advanced (Engaged in astronomy, rocketry, or aerospace projects)</option>
                  </select>
                </div>

                {/* Academic Institution */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                    School / College / University <span className="text-[#C9A86A]">*</span>
                  </label>
                  <InstitutionSelect
                    value={formData.institution}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, institution: val }));
                      if (errors.institution) {
                        setErrors((prev) => ({ ...prev, institution: "" }));
                      }
                    }}
                    error={errors.institution}
                    placeholder="Search or select School / University..."
                    id="workshop-institution-select"
                  />
                </div>

                {/* Course / Dept */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                    Department / Class of Study <span className="text-[#C9A86A]">*</span>
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className={`w-full bg-[#1A1F1A] border ${errors.course ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} px-4 py-3 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                    placeholder="e.g. B.Tech Aerospace / Class 12 PCM"
                  />
                  {errors.course && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.course}</p>}
                </div>
              </div>
            ) : (
              /* SCHOOL DELEGATION FORM FIELDS */
              <div className="space-y-6">
                
                {/* School Name Input */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                    School / Institution Full Name <span className="text-[#C9A86A]">*</span>
                  </label>
                  <InstitutionSelect
                    value={formData.institution}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, institution: val }));
                      if (errors.institution) {
                        setErrors((prev) => ({ ...prev, institution: "" }));
                      }
                    }}
                    error={errors.institution}
                    placeholder="Select or enter school name..."
                    id="workshop-school-institution-select"
                  />
                </div>

                {/* Teacher in Charge Section Header */}
                <div className="bg-[#1A1F1A] border border-[#C9A86A]/30 p-4 md:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#8A9A7E]/20 pb-3">
                    <UserCheck className="h-4 w-4 text-[#C9A86A]" />
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#EDE6D3] tracking-wide">Teacher in Charge / Faculty Advisor</h3>
                      <p className="font-sans text-[10px] text-[#8A9A7E]">Specify credentials of the supervising educator coordinating the school delegation.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Teacher Full Name */}
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                        Teacher Full Name <span className="text-[#C9A86A]">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                        <input
                          type="text"
                          name="teacherName"
                          value={formData.teacherName}
                          onChange={handleChange}
                          className={`w-full bg-[#2E3B2F]/60 border ${errors.teacherName ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} pl-11 pr-4 py-2.5 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                          placeholder="e.g. Dr. Rajesh Sharma"
                        />
                      </div>
                      {errors.teacherName && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.teacherName}</p>}
                    </div>

                    {/* Teacher Designation */}
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                        Official Academic Designation <span className="text-[#C9A86A]">*</span>
                      </label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                        <input
                          type="text"
                          name="teacherDesignation"
                          value={formData.teacherDesignation}
                          onChange={handleChange}
                          className={`w-full bg-[#2E3B2F]/60 border ${errors.teacherDesignation ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} pl-11 pr-4 py-2.5 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                          placeholder="e.g. PGT Physics / MUN Faculty Advisor"
                        />
                      </div>
                      {errors.teacherDesignation && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.teacherDesignation}</p>}
                    </div>

                    {/* Teacher Official Email */}
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                        Teacher Institutional Email <span className="text-[#C9A86A]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                        <input
                          type="email"
                          name="teacherEmail"
                          value={formData.teacherEmail}
                          onChange={handleChange}
                          className={`w-full bg-[#2E3B2F]/60 border ${errors.teacherEmail ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} pl-11 pr-4 py-2.5 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                          placeholder="rajesh.sharma@school.edu.in"
                        />
                      </div>
                      {errors.teacherEmail && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.teacherEmail}</p>}
                    </div>

                    {/* Teacher Phone */}
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                        Teacher Direct Phone / WhatsApp <span className="text-[#C9A86A]">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                        <input
                          type="text"
                          name="teacherPhone"
                          value={formData.teacherPhone}
                          onChange={handleChange}
                          className={`w-full bg-[#2E3B2F]/60 border ${errors.teacherPhone ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} pl-11 pr-4 py-2.5 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      {errors.teacherPhone && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.teacherPhone}</p>}
                    </div>
                  </div>
                </div>

                {/* Delegation Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estimated Students */}
                  <div>
                    <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                      Estimated Student Delegates <span className="text-[#C9A86A]">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                      <select
                        name="estimatedStudents"
                        value={formData.estimatedStudents}
                        onChange={handleChange}
                        className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 pl-11 pr-4 py-2.5 font-sans text-xs text-[#EDE6D3] focus:outline-none focus:border-[#C9A86A] transition-all cursor-pointer"
                      >
                        <option value="1-5 Students" className="bg-[#1A1F1A]">1 to 5 Students</option>
                        <option value="5-10 Students" className="bg-[#1A1F1A]">5 to 10 Students</option>
                        <option value="10-20 Students" className="bg-[#1A1F1A]">10 to 20 Students</option>
                        <option value="20-30 Students" className="bg-[#1A1F1A]">20 to 30 Students</option>
                        <option value="30+ Students" className="bg-[#1A1F1A]">30+ Students (Large Contingent)</option>
                      </select>
                    </div>
                    {errors.estimatedStudents && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.estimatedStudents}</p>}
                  </div>

                  {/* Target Grades */}
                  <div>
                    <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                      Target Classes / Grade Levels <span className="text-[#C9A86A]">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A9A7E]" />
                      <input
                        type="text"
                        name="gradeLevels"
                        value={formData.gradeLevels}
                        onChange={handleChange}
                        className={`w-full bg-[#1A1F1A] border ${errors.gradeLevels ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} pl-11 pr-4 py-2.5 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                        placeholder="e.g. Class 9 to 12"
                      />
                    </div>
                    {errors.gradeLevels && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.gradeLevels}</p>}
                  </div>
                </div>

                {/* Special Requirements / Notes */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                    Special Delegation Logistics or Curricular Notes (Optional)
                  </label>
                  <textarea
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 px-4 py-3 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all"
                    placeholder="Provide details on transport logistics, student focus areas, or dietary accommodations..."
                  />
                </div>
              </div>
            )}

            {/* Motivation statement text area (for Individual only) */}
            {regType === "individual" && (
              <div>
                <label className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8A9A7E] block font-semibold mb-1.5">
                  Academic Intent & Motivation (Min 15 characters) <span className="text-[#C9A86A]">*</span>
                </label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full bg-[#1A1F1A] border ${errors.motivation ? 'border-rose-500/60' : 'border-[#8A9A7E]/30'} px-4 py-3 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:outline-none focus:border-[#C9A86A] transition-all`}
                  placeholder="Outline your academic goals, research interests, or expectations from this masterclass..."
                />
                {errors.motivation && <p className="text-rose-400 font-mono text-[10px] mt-1">{errors.motivation}</p>}
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex gap-4 pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="flex-1 border border-[#8A9A7E]/30 hover:bg-[#1A1F1A] px-5 py-3 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#C9A86A] hover:bg-[#bfa060] px-5 py-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-[#1A1F1A] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A1F1A] border-t-transparent" />
                ) : (
                  <>
                    {regType === "school" ? "Transmit Institutional Dossier" : "Transmit Accreditation Request"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
}
