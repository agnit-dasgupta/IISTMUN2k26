/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Rocket, Sparkles, User, Phone, Mail, Award, CheckCircle, ArrowLeft, Share2, Download, RefreshCw, Layers, Building2, UserCheck, Users, GraduationCap, FileText, CheckCircle2 } from "lucide-react";
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
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
      if (!formData.institution.trim()) newErrors.institution = "Institution name is required.";
      if (!formData.course.trim()) newErrors.course = "Course/Department or Class is required.";
      if (!formData.motivation.trim() || formData.motivation.length < 15) {
        newErrors.motivation = "Please tell us why you want to attend (at least 15 characters).";
      }
    } else {
      // School / Institutional Registration
      if (!formData.institution.trim()) newErrors.institution = "School / Institution name is required.";
      if (!formData.teacherName.trim()) newErrors.teacherName = "Teacher-in-Charge name is required.";
      if (!formData.teacherDesignation.trim()) newErrors.teacherDesignation = "Designation/Title is required.";
      if (!formData.teacherEmail.trim() || !/\S+@\S+\.\S+/.test(formData.teacherEmail)) newErrors.teacherEmail = "Valid teacher email is required.";
      if (!formData.teacherPhone.trim()) newErrors.teacherPhone = "Teacher phone/WhatsApp is required.";
      if (!formData.estimatedStudents.trim()) newErrors.estimatedStudents = "Please specify estimated students.";
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
          ? (formData.specialRequirements.trim() || "Institutional school workshop delegation.") 
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
    const typeStr = registeredDetails.regType === "school" ? "School Delegation" : "Individual Participant";
    navigator.clipboard.writeText(`🚀 ${typeStr} registered for IIST MUN 2026 Space Technology & Orbital Diplomacy Workshop! Pass Key: ${registeredDetails.id}`);
    alert("🛰️ Workshop pass key copied to clipboard! Share it with your school or team.");
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
    if (window.confirm("Are you sure you want to cancel your workshop registration? This action is permanent.")) {
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-900 border-t-cyan-400" />
          <Layers className="absolute h-6 w-6 text-cyan-400 animate-pulse" />
        </div>
        <p className="mt-4 font-mono text-xs text-slate-400 uppercase tracking-widest">Pinging telemetry arrays...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8 text-left relative z-10"
    >
      
      {/* Back Button */}
      <button
        onClick={() => setActiveTab("home")}
        className="group flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Orbit Control
      </button>

      {/* Main Container */}
      {!user ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 md:p-12 text-center backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/5 blur-[100px] rounded-full"></div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)] mx-auto mb-6">
            <Rocket className="h-6 w-6 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Secure Workshop Identity
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed mb-8">
            Access the Space Technology & Orbital Diplomacy Workshop registration portal. Please sign in with Google to establish your encrypted boarding profile.
          </p>

          <button
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-950 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            {isSigningIn ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Establish Boarding Identity
              </>
            )}
          </button>
        </div>
      ) : registeredDetails ? (
        /* Confirmed Registration Pass card */
        <div className="space-y-6">
          <div
            ref={workshopPassRef}
            id="workshop-boarding-pass-card"
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider mb-2">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {registeredDetails.regType === "school" ? "School Delegation Confirmed" : "Orbital Seat Confirmed"}
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  {registeredDetails.regType === "school" ? "Institutional Workshop Delegation Pass" : "Workshop Boarding Key"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Presented by IIST Faculty & ISRO Researchers</p>
              </div>
              
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl px-5 py-3 text-right">
                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Pass Code</span>
                <span className="font-mono text-base md:text-lg text-emerald-400 font-bold uppercase tracking-widest">{registeredDetails.id}</span>
              </div>
            </div>

            {/* Ticket Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 items-center">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">
                    {registeredDetails.regType === "school" ? "School / Institution Name" : "Participant Name"}
                  </span>
                  <p className="font-sans text-base text-white font-black">{registeredDetails.name}</p>
                </div>

                {registeredDetails.regType === "school" ? (
                  <>
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[9.5px] font-bold uppercase tracking-wider">
                        <UserCheck className="h-3.5 w-3.5" />
                        Teacher in Charge Details
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Teacher Name</span>
                          <p className="font-sans text-xs text-white font-bold">{registeredDetails.teacherName || "N/A"}</p>
                          <p className="font-sans text-[10px] text-slate-400">{registeredDetails.teacherDesignation}</p>
                        </div>
                        <div>
                          <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Official Contact</span>
                          <p className="font-sans text-[10px] text-slate-300 font-mono">{registeredDetails.teacherEmail}</p>
                          <p className="font-sans text-[10px] text-slate-400 font-mono">{registeredDetails.teacherPhone}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Academic Institution</span>
                      <p className="font-sans text-xs text-slate-300 font-bold">{registeredDetails.institution}</p>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Department / Course</span>
                      <p className="font-sans text-xs text-slate-300 font-bold">{registeredDetails.course}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Workshop Event</span>
                    <p className="font-sans text-xs text-white font-extrabold mt-0.5">Space Technology & Orbital Diplomacy</p>
                    <p className="font-sans text-[10px] text-slate-400 leading-relaxed mt-0.5">September 17, 2026 • 14:00 - 18:00 IST</p>
                  </div>

                  {registeredDetails.regType === "school" ? (
                    <div>
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Delegation Size & Grades</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                          Est. {registeredDetails.estimatedStudents || "10+"} Students
                        </span>
                        <span className="rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                          {registeredDetails.gradeLevels || "High School"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Background Level</span>
                      <span className="inline-block rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[9px] font-mono font-bold mt-1 uppercase">
                        {registeredDetails.experience}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-sans text-amber-400/90 leading-relaxed">
                  ⚡ <strong>Workshop Status:</strong> Registration is confirmed. Portfolio and workshop lab seats will be allotted shortly.
                </div>
              </div>

              {/* Scannable QR Code Column */}
              <div className="flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-4 border border-slate-800">
                <QRCodeDisplay
                  uniqueId={registeredDetails.id}
                  candidateName={registeredDetails.name}
                  title="Workshop Boarding Pass"
                  size={120}
                  showScannerTest={true}
                />
              </div>
            </div>

            {/* Statement / Special Notes section */}
            <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl mt-6">
              <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block font-bold">
                {registeredDetails.regType === "school" ? "School Delegation Notes & Requirements" : "Telemetry Objective (Motivation)"}
              </span>
              <p className="font-sans text-xs text-slate-400 leading-relaxed italic mt-1 whitespace-pre-wrap">
                "{registeredDetails.motivation}"
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-800/80">
              <button
                onClick={handleShare}
                className="flex-1 min-w-[140px] rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Key
              </button>

              <button
                onClick={handleDownloadPass}
                disabled={isDownloading}
                className="flex-1 min-w-[140px] rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Generating PDF..." : "Download Pass (PDF)"}
              </button>

              <button
                onClick={handleCancelRegistration}
                className="flex-1 min-w-[140px] rounded-full border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 px-5 py-3 text-xs font-bold uppercase tracking-widest text-red-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                Cancel Seat
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Registration Form */
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/5 blur-[100px] rounded-full"></div>
          
          <div className="border-b border-slate-800 pb-5 mb-6">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest font-bold">Scientific Masterclass</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
              Space Tech & Orbital Diplomacy Registration
            </h2>
            <p className="text-xs text-slate-400 mt-1">Reserve boarding passes for individual participants or register an entire school delegation with a Teacher-in-Charge.</p>

            {/* Registration Mode Switcher */}
            <div className="mt-5 grid grid-cols-2 gap-3 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setRegType("individual")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  regType === "individual"
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <User className="h-4 w-4" />
                Individual Participant
              </button>

              <button
                type="button"
                onClick={() => setRegType("school")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  regType === "school"
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Building2 className="h-4 w-4" />
                School Delegation (Whole School)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {regType === "individual" ? (
              /* INDIVIDUAL FORM FIELDS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Full Name */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                    Full Name of Participant <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border ${errors.name ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl pl-11 pr-4 py-3 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.name && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.name}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                    Email Address <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border ${errors.email ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl pl-11 pr-4 py-3 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.email}</p>}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                    Contact Number (WhatsApp) <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border ${errors.phone ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl pl-11 pr-4 py-3 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.phone}</p>}
                </div>

                {/* Background Level selection */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                    Coding / Technical Background <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                  >
                    <option value="Beginner">Beginner (Curious / Little to no coding)</option>
                    <option value="Intermediate">Intermediate (Basic programming knowledge)</option>
                    <option value="Advanced">Advanced (Working on space tech, physics, or web code)</option>
                  </select>
                </div>

                {/* Academic Institution */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                    Academic Institution / College / School <span className="text-cyan-400">*</span>
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
                    placeholder="Select or type School / College in India..."
                    accentColor="cyan"
                    id="workshop-institution-select"
                  />
                </div>

                {/* Course / Dept */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                    Department / Course of Study <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className={`w-full bg-slate-950 border ${errors.course ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl px-4 py-3 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                    placeholder="e.g. B.Tech Aerospace Engineering or Class 11 Physics"
                  />
                  {errors.course && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.course}</p>}
                </div>
              </div>
            ) : (
              /* SCHOOL DELEGATION FORM FIELDS */
              <div className="space-y-6">
                
                {/* School Name Input */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                    School / Institution Name <span className="text-cyan-400">*</span>
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
                    placeholder="Select or type your School name in India..."
                    accentColor="cyan"
                    id="workshop-school-institution-select"
                  />
                </div>

                {/* Teacher in Charge Section Header */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                    <UserCheck className="h-4 w-4 text-cyan-400" />
                    <div>
                      <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Teacher in Charge / Faculty Advisor</h3>
                      <p className="font-sans text-[10px] text-slate-400">Specify details of the official teacher guiding or coordinating the school delegation.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Teacher Full Name */}
                    <div>
                      <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                        Teacher-in-Charge Full Name <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          name="teacherName"
                          value={formData.teacherName}
                          onChange={handleChange}
                          className={`w-full bg-slate-900 border ${errors.teacherName ? 'border-red-500/50' : 'border-slate-800'} rounded-xl pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                          placeholder="e.g. Dr. Rajesh Sharma"
                        />
                      </div>
                      {errors.teacherName && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.teacherName}</p>}
                    </div>

                    {/* Teacher Designation */}
                    <div>
                      <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                        Designation / Role in School <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          name="teacherDesignation"
                          value={formData.teacherDesignation}
                          onChange={handleChange}
                          className={`w-full bg-slate-900 border ${errors.teacherDesignation ? 'border-red-500/50' : 'border-slate-800'} rounded-xl pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                          placeholder="e.g. PGT Physics / MUN In-Charge / Vice Principal"
                        />
                      </div>
                      {errors.teacherDesignation && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.teacherDesignation}</p>}
                    </div>

                    {/* Teacher Official Email */}
                    <div>
                      <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                        Teacher Official Email Address <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="email"
                          name="teacherEmail"
                          value={formData.teacherEmail}
                          onChange={handleChange}
                          className={`w-full bg-slate-900 border ${errors.teacherEmail ? 'border-red-500/50' : 'border-slate-800'} rounded-xl pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                          placeholder="e.g. rajesh.sharma@school.edu.in"
                        />
                      </div>
                      {errors.teacherEmail && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.teacherEmail}</p>}
                    </div>

                    {/* Teacher Phone */}
                    <div>
                      <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                        Teacher Direct Phone / WhatsApp <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          name="teacherPhone"
                          value={formData.teacherPhone}
                          onChange={handleChange}
                          className={`w-full bg-slate-900 border ${errors.teacherPhone ? 'border-red-500/50' : 'border-slate-800'} rounded-xl pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                          placeholder="e.g. +91 98765 43210"
                        />
                      </div>
                      {errors.teacherPhone && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.teacherPhone}</p>}
                    </div>
                  </div>
                </div>

                {/* Delegation Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estimated Students */}
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                      Estimated Student Delegates Count <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <select
                        name="estimatedStudents"
                        value={formData.estimatedStudents}
                        onChange={handleChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                      >
                        <option value="1-5 Students">1 to 5 Students</option>
                        <option value="5-10 Students">5 to 10 Students</option>
                        <option value="10-20 Students">10 to 20 Students</option>
                        <option value="20-30 Students">20 to 30 Students</option>
                        <option value="30+ Students">30+ Students (Large Contingent)</option>
                      </select>
                    </div>
                    {errors.estimatedStudents && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.estimatedStudents}</p>}
                  </div>

                  {/* Target Grades */}
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                      Target Grade / Class Levels <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        name="gradeLevels"
                        value={formData.gradeLevels}
                        onChange={handleChange}
                        className={`w-full bg-slate-950 border ${errors.gradeLevels ? 'border-red-500/50' : 'border-slate-800'} rounded-xl pl-11 pr-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all`}
                        placeholder="e.g. Class 9 to 12 / Senior Secondary"
                      />
                    </div>
                    {errors.gradeLevels && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.gradeLevels}</p>}
                  </div>
                </div>

                {/* Special Requirements / Notes */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                    Additional Delegation Notes / Requirements (Optional)
                  </label>
                  <textarea
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-sans text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-cyan-500/50 transition-all"
                    placeholder="Share any special logistics requirements, bus arrival info, or topics of interest for your students..."
                  />
                </div>
              </div>
            )}

            {/* Motivation statement text area (for Individual only, or if required) */}
            {regType === "individual" && (
              <div>
                <label className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                  Why are you interested in this Workshop? (Min 15 chars) <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full bg-slate-950 border ${errors.motivation ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl px-4 py-3 font-sans text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-cyan-500/50 transition-all`}
                  placeholder="Share your goals or expectations from this masterclass..."
                />
                {errors.motivation && <p className="text-red-400 font-sans text-[10px] mt-1">{errors.motivation}</p>}
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="flex-1 rounded-full border border-slate-850 hover:bg-slate-850 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
              >
                Abort Launch
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-cyan-600 hover:bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    {regType === "school" ? "Confirm School Delegation Registration" : "Confirm Individual Registration"}
                    <Rocket className="h-4 w-4 animate-bounce-slow" />
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
