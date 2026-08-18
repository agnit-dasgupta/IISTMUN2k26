/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { COMMITTEES, COUNTRY_MATRIX } from "../data";
import { RegistrationDetails, PortfolioStatus } from "../types";
import { 
  Rocket, Sparkles, User, Users, Landmark, ChevronRight, ChevronLeft, 
  CheckCircle, Ticket, Calendar, Download, Share2, Phone, Mail, Award, 
  AlertCircle, Search, Globe, X, CheckCircle2, ShieldCheck, Check, Orbit
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, onSnapshot, setDoc, deleteDoc, collection } from "firebase/firestore";
import { motion } from "motion/react";
import { InstitutionSelect } from "./InstitutionSelect";
import QRCodeDisplay from "./QRCodeDisplay";
import { downloadBoardingPassPDF } from "../utils/pdfGenerator";

interface RegistrationProps {
  initialPreference?: { country: string; committee: string } | null;
  clearInitialPreference?: () => void;
}

export default function Registration({ initialPreference, clearInitialPreference }: RegistrationProps) {
  const { user, loading: authLoading, signInWithGoogle, authError, clearAuthError, isSigningIn } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [matrixSearchTerm, setMatrixSearchTerm] = useState("");
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, Partial<Record<"copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>>({});

  // Auto-fill selected trajectory portfolio preferences
  useEffect(() => {
    if (initialPreference) {
      setFormData((prev) => ({
        ...prev,
        pref1Country: initialPreference.country,
        pref1Committee: initialPreference.committee,
      }));
      
      if (user) {
        setStep(2);
        if (clearInitialPreference) {
          clearInitialPreference();
        }
      }
    }
  }, [initialPreference, user, clearInitialPreference]);

  // Fetch live portfolio overrides to filter the matrix dropdown properly
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

  const getPortfolioStatus = (country: string, committee: string): PortfolioStatus => {
    const row = COUNTRY_MATRIX.find(r => r.country === country);
    if (!row) return "Reserved";
    const commKey = committee as "copuos" | "disec" | "aippm" | "unsc";
    return portfolioOverrides[country]?.[commKey] ?? row[commKey];
  };

  const getSelectedPreferences = (): { country: string; committee: string }[] => {
    const prefs: { country: string; committee: string }[] = [];
    if (formData.pref1Country) {
      prefs.push({ country: formData.pref1Country, committee: formData.pref1Committee });
    }
    if (formData.pref2Country) {
      prefs.push({ country: formData.pref2Country, committee: formData.pref2Committee });
    }
    if (formData.pref3Country) {
      prefs.push({ country: formData.pref3Country, committee: formData.pref3Committee });
    }
    return prefs;
  };

  const getSelectionNumber = (country: string, committee: string) => {
    if (formData.pref1Country === country && formData.pref1Committee === committee) return 1;
    if (formData.pref2Country === country && formData.pref2Committee === committee) return 2;
    if (formData.pref3Country === country && formData.pref3Committee === committee) return 3;
    return null;
  };

  const handlePortfolioClick = (country: string, committee: string) => {
    const current = getSelectedPreferences();
    const existingIndex = current.findIndex(
      (p) => p.country === country && p.committee === committee
    );

    let updated: { country: string; committee: string }[];
    if (existingIndex !== -1) {
      // Deselect
      updated = current.filter((_, idx) => idx !== existingIndex);
    } else {
      // Select (if less than 3)
      if (current.length >= 3) return;
      updated = [...current, { country, committee }];
    }

    setFormData((prev) => ({
      ...prev,
      pref1Country: updated[0]?.country ?? "",
      pref1Committee: updated[0]?.committee ?? "",
      pref2Country: updated[1]?.country ?? "",
      pref2Committee: updated[1]?.committee ?? "",
      pref3Country: updated[2]?.country ?? "",
      pref3Committee: updated[2]?.committee ?? "",
    }));
  };

  const [formData, setFormData] = useState({
    regType: "individual" as "individual" | "double" | "contingent",
    name: "",
    email: "",
    phone: "",
    institution: "",
    course: "",
    munExperience: "None",
    role: "Delegate" as "Delegate" | "Photographer",
    pref1Committee: "copuos",
    pref1Country: "",
    pref2Committee: "disec",
    pref2Country: "",
    pref3Committee: "unsc",
    pref3Country: "",
    partnerName: "",
    partnerEmail: "",
    partnerRole: "Delegate" as "Delegate" | "Photographer",
    contingentSize: "5",
    motivation: ""
  });

  const [submittedPass, setSubmittedPass] = useState<RegistrationDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const boardingPassRef = useRef<HTMLDivElement>(null);

  // Auto-fill user profile fields on successful login
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

  // Real-time listener for user's registration document
  useEffect(() => {
    if (!user) {
      setSubmittedPass(null);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "registrations", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSubmittedPass(docSnap.data() as RegistrationDetails);
      } else {
        setSubmittedPass(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `registrations/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 2) {
      if (!formData.name.trim()) newErrors.name = "Full name is required.";
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required.";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
      if (!formData.institution.trim()) newErrors.institution = "College or School name is required.";
      if (!formData.course.trim()) newErrors.course = "Course/Department or Class is required.";
      
      if (formData.regType === "double") {
        if (!formData.partnerName.trim()) newErrors.partnerName = "Partner's full name is required.";
        if (!formData.partnerEmail.trim() || !/\S+@\S+\.\S+/.test(formData.partnerEmail)) {
          newErrors.partnerEmail = "Valid partner email is required.";
        }
      }
    } else if (step === 3) {
      if (!formData.pref1Country.trim()) newErrors.pref1Country = "First choice country portfolio is required.";
      if (!formData.motivation.trim() || formData.motivation.length < 20) {
        newErrors.motivation = "Motivation must be at least 20 characters.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation of all required details across steps
    const newErrors: Record<string, string> = {};
    
    // Contact & Academic details validation (Step 2)
    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required.";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.institution.trim()) newErrors.institution = "College or School name is required.";
    if (!formData.course.trim()) newErrors.course = "Course/Department or Class is required.";
    
    if (formData.regType === "double") {
      if (!formData.partnerName.trim()) newErrors.partnerName = "Partner's full name is required.";
      if (!formData.partnerEmail.trim() || !/\S+@\S+\.\S+/.test(formData.partnerEmail)) {
        newErrors.partnerEmail = "Valid partner email is required.";
      }
    }

    // Preference & Motivation details validation (Step 3)
    if (!formData.pref1Country.trim()) newErrors.pref1Country = "First choice country portfolio is required.";
    if (!formData.motivation.trim() || formData.motivation.length < 20) {
      newErrors.motivation = "Motivation statement must be at least 20 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Missing Details: Please fill up all required fields in your delegate registration and country preferences before submitting.");
      
      const hasContactErrors = newErrors.name || newErrors.email || newErrors.phone || newErrors.institution || newErrors.course || newErrors.partnerName || newErrors.partnerEmail;
      if (hasContactErrors) {
        setStep(2);
      } else {
        setStep(3);
      }
      return;
    }

    if (user) {
      setLoading(true);
      try {
        const commAbbr = 
          formData.pref1Committee === "copuos" ? "COPUOS" :
          formData.pref1Committee === "disec" ? "DISEC" :
          formData.pref1Committee === "aippm" ? "AIPPM" :
          formData.pref1Committee === "unsc" ? "UNSC" : "MUN";

        const primaryRoleAbbr = formData.role === "Photographer" ? "P" : "D";
        const primary4Digit = Math.floor(1000 + Math.random() * 9000);
        const primaryId = `${commAbbr}${primaryRoleAbbr}${primary4Digit}`;

        let partnerId = "";
        if (formData.regType === "double") {
          const partnerRoleAbbr = (formData.partnerRole || "Delegate") === "Photographer" ? "P" : "D";
          const partner4Digit = Math.floor(1000 + Math.random() * 9000);
          partnerId = `${commAbbr}${partnerRoleAbbr}${partner4Digit}`;
        }

        const newReg = {
          id: primaryId,
          ...(partnerId ? { partnerId } : {}),
          userId: user.uid,
          timestamp: new Date().toLocaleString(),
          ...formData
        };
        await setDoc(doc(db, "registrations", user.uid), newReg);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `registrations/${user.uid}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShare = () => {
    if (!submittedPass) return;
    const partnerText = submittedPass.regType === "double" && submittedPass.partnerName
      ? ` & Partner: ${submittedPass.partnerName} (${submittedPass.partnerId || "TBD"})`
      : "";
    navigator.clipboard.writeText(`🚀 I just registered for IIST MUN 2026! Portfolio Preferred: ${submittedPass.pref1Country} in ${submittedPass.pref1Committee.toUpperCase()}. ID: ${submittedPass.id}${partnerText}`);
    alert("🌌 Orbit credentials copied to clipboard! Share with your delegates pool.");
  };

  const handleDownloadReceipt = async () => {
    if (!submittedPass) return;
    setIsDownloading(true);
    try {
      await downloadBoardingPassPDF({
        element: boardingPassRef.current,
        ticketId: submittedPass.id,
        candidateName: submittedPass.name,
        registrationType: "mun",
        details: {
          institution: submittedPass.institution,
          chamber: submittedPass.pref1Committee,
          preferredCountry: submittedPass.pref1Country,
          email: submittedPass.email,
          phone: submittedPass.phone,
          timestamp: submittedPass.timestamp,
        },
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = async () => {
    if (user) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "registrations", user.uid));
        setFormData({
          regType: "individual",
          name: "",
          email: "",
          phone: "",
          institution: "",
          course: "",
          munExperience: "None",
          role: "Delegate",
          pref1Committee: "copuos",
          pref1Country: "",
          pref2Committee: "disec",
          pref2Country: "",
          pref3Committee: "unsc",
          pref3Country: "",
          partnerName: "",
          partnerEmail: "",
          partnerRole: "Delegate",
          contingentSize: "5",
          motivation: ""
        });
        setStep(1);
        setErrors({});
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `registrations/${user.uid}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-[#04060a] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Orionix Cosmic Ambient Glows & Grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(6,182,212,0.18), transparent 70%),
            radial-gradient(ellipse 60% 50% at 90% 40%, rgba(99,102,241,0.12), transparent 70%),
            radial-gradient(ellipse 50% 50% at 10% 70%, rgba(168,85,247,0.1), transparent 70%)
          `
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-4xl"
      >
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono font-semibold tracking-wider text-cyan-300 uppercase shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            // ORBITAL DELEGATE PORTAL
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
            Delegate Registration Matrix
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed font-sans">
            Lock in your credentials, select target portfolios across the live diplomatic council matrix, and claim your cryptographic Boarding Pass.
          </p>
        </div>

        {authLoading ? (
          <div className="text-center py-24 rounded-3xl border border-white/[0.08] bg-[#080d1a]/80 backdrop-blur-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mx-auto" />
            <p className="font-mono text-cyan-400 text-xs mt-4 font-bold tracking-widest uppercase">// ALIGNING TELEMETRY SYSTEMS...</p>
          </div>
        ) : !user ? (
          /* Sign-In Card matching Orionix */
          <div className="text-center py-14 px-6 sm:px-10 max-w-lg mx-auto bg-[#080d1a]/85 border border-white/[0.08] rounded-3xl backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden animate-fade-in">
            <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-6 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              <Rocket className="h-8 w-8 animate-bounce-slow" />
            </div>

            <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold">// SECURE UPLINK REQUIRED</span>
            <h2 className="mt-2 font-sans text-2xl font-extrabold text-white tracking-tight">Identity Uplink Required</h2>
            <p className="mt-3 font-sans text-slate-400 text-xs leading-relaxed">
              To request a delegate portfolio, register country matrix choices, and generate your orbital boarding pass, authenticate your identity with our registry.
            </p>
            
            <button
              onClick={() => signInWithGoogle().catch(() => {})}
              disabled={isSigningIn}
              className={`mt-8 w-full rounded-full px-6 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                isSigningIn 
                  ? "bg-cyan-950/60 border border-cyan-500/30 opacity-75 cursor-not-allowed text-cyan-300" 
                  : "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 hover:shadow-[0_0_35px_rgba(6,182,212,0.45)] active:scale-95"
              }`}
              id="registration-login-btn"
            >
              {isSigningIn ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uplinking Identity...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Sign In with Google
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>

            {authError && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-left animate-fade-in text-xs font-sans">
                <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Connection Interrupted (Popup Restriction)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Your browser blocked or closed the Google sign-in popup. Since this preview runs in a sandboxed iframe, opening in a new tab resolves popup security restrictions instantly.
                </p>
                <div className="mt-3 bg-[#04060a] p-3 rounded-xl border border-white/[0.08] font-mono text-[10px] text-slate-400 break-words">
                  <strong>Telemetry trace:</strong> {authError.message || String(authError)}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      const devUrl = window.location.href;
                      window.open(devUrl, "_blank");
                    }}
                    className="flex-1 rounded-full bg-cyan-600 hover:bg-cyan-500 px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider text-white text-center cursor-pointer transition-all duration-200"
                  >
                    🛰️ Open App in New Tab
                  </button>
                  <button
                    onClick={() => {
                      clearAuthError();
                      signInWithGoogle().catch(() => {});
                    }}
                    className="rounded-full bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider text-slate-300 text-center cursor-pointer transition-colors border border-white/[0.08]"
                  >
                    🔄 Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-24 rounded-3xl border border-white/[0.08] bg-[#080d1a]/80 backdrop-blur-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mx-auto" />
            <p className="font-mono text-cyan-400 text-xs mt-4 font-bold tracking-widest uppercase">// RETRIEVING ORBITAL CLEARANCE...</p>
          </div>
        ) : submittedPass ? (
          /* Confirmed Boarding Pass */
          <div className="animate-fade-in space-y-6" id="boarding-pass-display">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="font-sans text-3xl font-extrabold text-white">Orbit Clearance Approved</h2>
              <p className="font-sans text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
                Your delegate registration is <strong className="text-cyan-400 font-semibold">CONFIRMED</strong>. Confirmation telemetry dispatched to <span className="text-cyan-300 font-mono font-bold">{submittedPass.email}</span>.
              </p>
            </div>

            {/* Orionix Cyber Boarding Pass Card */}
            <div
              ref={boardingPassRef}
              id="mun-boarding-pass-card"
              className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[#080d1a]/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] text-left"
            >
              {/* Top Cyber Edge Beam */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />
              
              {/* Ambient glows inside card */}
              <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="p-6 md:p-10 relative z-10">
                {/* Boarding Pass Header */}
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/[0.08] pb-6 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 font-extrabold text-xl text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-300/40">
                      <Orbit className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="block font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold">// DELEGATE BRIEFING BADGE</span>
                      <h3 className="font-sans text-xl font-extrabold text-white">IIST MUN 2026</h3>
                    </div>
                  </div>
                  
                  {/* Launch Reference Code */}
                  <div className="rounded-2xl border border-cyan-500/30 bg-[#04060a] px-5 py-2.5 text-center shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <span className="block font-mono text-[8px] uppercase tracking-wider text-slate-400 font-bold">Launch Reference</span>
                    <span className="font-mono text-sm sm:text-base font-extrabold text-cyan-300 tracking-wider">{submittedPass.id}</span>
                  </div>
                </div>

                {/* Main Pass Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 items-center border-b border-white/[0.08]">
                  {/* Credentials details */}
                  <div className="md:col-span-2 space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Passenger / Delegate</span>
                        <span className="font-sans text-base font-extrabold text-white">{submittedPass.name}</span>
                        <span className="block font-mono text-[10px] text-cyan-400 font-bold mt-0.5">{submittedPass.id} ({submittedPass.role || "Delegate"})</span>
                        
                        {submittedPass.regType === "double" && submittedPass.partnerName && (
                          <div className="mt-3 pt-2 border-t border-white/[0.06]">
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Partner Delegate</span>
                            <span className="font-sans text-sm font-extrabold text-white">{submittedPass.partnerName}</span>
                            <span className="block font-mono text-[10px] text-indigo-400 font-bold mt-0.5">{submittedPass.partnerId} ({submittedPass.partnerRole || "Delegate"})</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Registry Category</span>
                        <span className="inline-block mt-0.5 font-mono text-[10px] uppercase font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                          {submittedPass.regType} Delegate
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Institution / College</span>
                        <span className="font-sans text-xs text-slate-200 font-bold">{submittedPass.institution}</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Assigned Chamber (Pref)</span>
                        <span className="font-sans text-xs text-cyan-300 uppercase font-bold">{submittedPass.pref1Committee}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Target Portfolio (Pref)</span>
                        <span className="font-sans text-xs font-extrabold text-indigo-300">{submittedPass.pref1Country}</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Launch Date / Venue</span>
                        <span className="font-sans text-[11px] text-slate-300">Sept 18, 2026 &bull; IIST Campus</span>
                      </div>
                    </div>

                    {/* Notice Callout */}
                    <div className="p-3.5 bg-cyan-950/20 rounded-2xl border border-cyan-500/20 text-xs font-sans text-cyan-200/90 leading-relaxed">
                      ⚡ <strong>Portfolio Allotment Status:</strong> Your registration is recorded. Council chamber and country portfolio allotments are evaluated on an early-bird queue by the Executive Secretariat.
                    </div>
                  </div>

                  {/* Right Column: Scannable QR Code */}
                  <div className="flex flex-col items-center justify-center bg-[#04060a] rounded-2xl p-5 border border-white/[0.08] shadow-inner relative group">
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                    
                    <QRCodeDisplay
                      uniqueId={submittedPass.id}
                      candidateName={submittedPass.name}
                      title="IIST MUN 2026 Boarding Pass"
                      size={120}
                      showScannerTest={true}
                    />
                  </div>
                </div>

                {/* Sub Barcode & Telemetry Area */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
                  <div className="text-left">
                    <span className="block font-mono text-[9px] text-slate-500 uppercase tracking-wider">TIMESTAMP LOGGED</span>
                    <span className="font-mono text-[11px] text-slate-300 font-semibold">{submittedPass.timestamp}</span>
                  </div>
                  {/* Barcode representation */}
                  <div className="flex flex-col items-end">
                    <div className="flex gap-0.5 h-7">
                      <div className="w-1 bg-cyan-400"></div>
                      <div className="w-0.5 bg-slate-500"></div>
                      <div className="w-2 bg-white"></div>
                      <div className="w-0.5 bg-cyan-400"></div>
                      <div className="w-1 bg-white"></div>
                      <div className="w-1.5 bg-indigo-400"></div>
                      <div className="w-0.5 bg-white"></div>
                      <div className="w-2 bg-cyan-400"></div>
                      <div className="w-1.5 bg-white"></div>
                      <div className="w-0.5 bg-slate-500"></div>
                      <div className="w-1 bg-white"></div>
                    </div>
                    <span className="font-mono text-[8px] text-cyan-400/80 mt-1 uppercase tracking-widest">SECURED BY TRIVANDRUM TELEMETRY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Post Submission Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                id="receipt-download-btn"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 px-7 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all active:scale-95 cursor-pointer"
              >
                {isDownloading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4 text-white" />
                )}
                {isDownloading ? "Generating PDF..." : "Download Boarding Pass (PDF)"}
              </button>
              
              <button
                onClick={handleShare}
                id="receipt-share-btn"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 px-7 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                Share Orbit Status
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleReset}
                id="receipt-reset-btn"
                className="text-slate-400 hover:text-cyan-300 font-mono text-xs uppercase tracking-wider underline underline-offset-4 cursor-pointer transition-colors"
              >
                Register Another Delegate / Team
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Registration Form Panel */
          <div className="rounded-3xl border border-white/[0.08] bg-[#080d1a]/85 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
            
            {/* Step Indicators Bar */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 sm:gap-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-bold font-mono transition-all duration-300 ${
                      step === num
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/40"
                        : step > num
                        ? "bg-cyan-950/40 text-cyan-300 border border-cyan-500/30"
                        : "bg-[#04060a] text-slate-500 border border-white/[0.08]"
                    }`}>
                      {step > num ? <Check className="h-4 w-4 text-cyan-400" /> : num}
                    </div>
                    {num < 3 && (
                      <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-3 rounded-full transition-all duration-300 ${
                        step > num ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-white/[0.06]"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-right">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">// LAUNCH SEQUENCE</span>
                <span className="font-sans text-xs font-extrabold text-cyan-400">Step {step} of 3</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1: SELECT CATEGORY */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="font-sans text-xl font-bold text-white sm:text-2xl">Select Delegate Division</h2>
                    <p className="font-sans text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                      Choose the allocation framework matching your participation structure.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Individual */}
                    <div
                      id="card-reg-individual"
                      onClick={() => setFormData({ ...formData, regType: "individual" })}
                      className={`rounded-3xl border p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                        formData.regType === "individual"
                          ? "border-cyan-500 bg-gradient-to-b from-cyan-950/30 to-[#080d1a] shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                          : "border-white/[0.08] bg-[#04060a]/60 hover:border-cyan-500/30 hover:bg-[#080d1a]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${formData.regType === "individual" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/[0.04] text-slate-400 group-hover:text-cyan-300"}`}>
                            <User className="h-5 w-5" />
                          </div>
                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${formData.regType === "individual" ? "border-cyan-400 bg-cyan-500 text-black" : "border-slate-700"}`}>
                            {formData.regType === "individual" && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Individual</h3>
                      </div>
                      <p className="mt-2 font-sans text-xs text-slate-400 leading-relaxed">
                        Register as a solo delegate representing a specific country choice.
                      </p>
                    </div>

                    {/* Double Delegation */}
                    <div
                      id="card-reg-double"
                      onClick={() => setFormData({ ...formData, regType: "double" })}
                      className={`rounded-3xl border p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                        formData.regType === "double"
                          ? "border-indigo-500 bg-gradient-to-b from-indigo-950/30 to-[#080d1a] shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                          : "border-white/[0.08] bg-[#04060a]/60 hover:border-indigo-500/30 hover:bg-[#080d1a]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${formData.regType === "double" ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.04] text-slate-400 group-hover:text-indigo-300"}`}>
                            <Users className="h-5 w-5" />
                          </div>
                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${formData.regType === "double" ? "border-indigo-400 bg-indigo-500 text-white" : "border-slate-700"}`}>
                            {formData.regType === "double" && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Double Del</h3>
                      </div>
                      <p className="mt-2 font-sans text-xs text-slate-400 leading-relaxed">
                        Debate as a coordinated pair in COPUOS or UNGA DISEC chambers.
                      </p>
                    </div>

                    {/* Contingent */}
                    <div
                      id="card-reg-contingent"
                      onClick={() => setFormData({ ...formData, regType: "contingent" })}
                      className={`rounded-3xl border p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                        formData.regType === "contingent"
                          ? "border-amber-500 bg-gradient-to-b from-amber-950/30 to-[#080d1a] shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                          : "border-white/[0.08] bg-[#04060a]/60 hover:border-amber-500/30 hover:bg-[#080d1a]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${formData.regType === "contingent" ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.04] text-slate-400 group-hover:text-amber-300"}`}>
                            <Landmark className="h-5 w-5" />
                          </div>
                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${formData.regType === "contingent" ? "border-amber-400 bg-amber-500 text-black" : "border-slate-700"}`}>
                            {formData.regType === "contingent" && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Contingent</h3>
                      </div>
                      <p className="mt-2 font-sans text-xs text-slate-400 leading-relaxed">
                        Submit institutional registrations for multiple school or college delegates.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleNext}
                      id="step1-next-btn"
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 px-7 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_25px_rgba(6,182,212,0.25)] active:scale-95 transition-all cursor-pointer"
                    >
                      Next: Contact Dossier
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DETAILS */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="font-sans text-xl font-bold text-white sm:text-2xl">Contact & Academic Dossier</h2>
                    <p className="font-sans text-xs sm:text-sm text-slate-400 mt-1">
                      Enter your delegate profile credentials and academic affiliation.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                        placeholder="Aarav Nair"
                      />
                      {errors.name && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                        placeholder="name@university.edu"
                      />
                      {errors.email && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                        placeholder="+91 XXXXX XXXXX"
                      />
                      {errors.phone && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Academic Institution / College / School</label>
                      <InstitutionSelect
                        value={formData.institution}
                        onChange={(val) => setFormData({ ...formData, institution: val })}
                        error={errors.institution}
                        placeholder="Select or type School / College in India..."
                        accentColor="cyan"
                        id="reg-institution-select"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Course / Department / Class</label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                        placeholder="B.Tech Aerospace Engineering"
                      />
                      {errors.course && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.course}</p>}
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Previous MUN Experience</label>
                      <select
                        value={formData.munExperience}
                        onChange={(e) => setFormData({ ...formData, munExperience: e.target.value })}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-3 text-xs text-slate-200 outline-none focus:border-cyan-500/50 transition-all font-bold uppercase tracking-wider"
                      >
                        <option value="None" className="bg-[#080d1a]">None (First Timer)</option>
                        <option value="1-2" className="bg-[#080d1a]">1-2 Conferences</option>
                        <option value="3-5" className="bg-[#080d1a]">3-5 Conferences</option>
                        <option value="5+" className="bg-[#080d1a]">5+ (Veteran Delegate)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Participation Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as "Delegate" | "Photographer" })}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-3 text-xs text-slate-200 outline-none focus:border-cyan-500/50 transition-all font-bold uppercase tracking-wider"
                      >
                        <option value="Delegate" className="bg-[#080d1a]">Delegate</option>
                        <option value="Photographer" className="bg-[#080d1a]">Photographer</option>
                      </select>
                    </div>
                  </div>

                  {/* Double Delegation Partner details */}
                  {formData.regType === "double" && (
                    <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-4">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-300 font-bold block">// DOUBLE DELEGATION: PARTNER DETAILS</span>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1 font-bold">Partner Full Name</label>
                          <input
                            type="text"
                            value={formData.partnerName}
                            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                            className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Partner's full name"
                          />
                          {errors.partnerName && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.partnerName}</p>}
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1 font-bold">Partner Email</label>
                          <input
                            type="email"
                            value={formData.partnerEmail}
                            onChange={(e) => setFormData({ ...formData, partnerEmail: e.target.value })}
                            className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="partner@university.edu"
                          />
                          {errors.partnerEmail && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.partnerEmail}</p>}
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1 font-bold">Partner Role</label>
                          <select
                            value={formData.partnerRole}
                            onChange={(e) => setFormData({ ...formData, partnerRole: e.target.value as "Delegate" | "Photographer" })}
                            className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-all font-bold uppercase tracking-wider"
                          >
                            <option value="Delegate" className="bg-[#080d1a]">Delegate</option>
                            <option value="Photographer" className="bg-[#080d1a]">Photographer</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contingent size details */}
                  {formData.regType === "contingent" && (
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300 font-bold block">// CONTINGENT DETAILS</span>
                      <div>
                        <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1 font-bold">Expected Delegation Size</label>
                        <select
                           value={formData.contingentSize}
                           onChange={(e) => setFormData({ ...formData, contingentSize: e.target.value })}
                           className="w-full max-w-xs rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-2.5 text-xs text-slate-200 outline-none font-bold uppercase tracking-wider"
                        >
                          <option value="5-10" className="bg-[#080d1a]">5 to 10 Delegates</option>
                          <option value="11-20" className="bg-[#080d1a]">11 to 20 Delegates</option>
                          <option value="20+" className="bg-[#080d1a]">More than 20 Delegates</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-slate-300 cursor-pointer transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      id="step2-next-btn"
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 px-7 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_25px_rgba(6,182,212,0.25)] active:scale-95 transition-all cursor-pointer"
                    >
                      Next: Portfolios Choice
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PREFERENCES & SUBMISSION */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="font-sans text-xl font-bold text-white sm:text-2xl">Portfolio & Motivation Dossier</h2>
                    <p className="font-sans text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                      Select your target council country portfolios from the live matrix and provide your rationale.
                    </p>
                  </div>

                  {/* Selected Preferences Summary Cards */}
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Your Selected Preferences (Up to 3 in priority order)
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {/* Preference 1 */}
                      <div className={`p-4 rounded-2xl border ${
                        formData.pref1Country 
                          ? "border-cyan-500/40 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] text-white" 
                          : "border-white/[0.08] bg-[#04060a]/50 border-dashed text-slate-500"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-wider text-cyan-400 font-bold mb-1">
                            1st Choice Portfolio
                          </div>
                          {formData.pref1Country ? (
                            <div className="font-sans text-xs font-bold leading-relaxed">
                              {formData.pref1Country}
                              <div className="text-[10px] text-cyan-300 font-medium font-mono uppercase mt-0.5">
                                {COMMITTEES.find(c => c.id === formData.pref1Committee)?.abbreviation || formData.pref1Committee}
                              </div>
                            </div>
                          ) : (
                            <p className="font-sans text-[11px] leading-snug">Click an available cell below...</p>
                          )}
                        </div>
                        {formData.pref1Country && (
                          <button
                            type="button"
                            onClick={() => handlePortfolioClick(formData.pref1Country, formData.pref1Committee)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Preference 2 */}
                      <div className={`p-4 rounded-2xl border ${
                        formData.pref2Country 
                          ? "border-indigo-500/40 bg-indigo-950/30 shadow-[0_0_20px_rgba(99,102,241,0.1)] text-white" 
                          : "border-white/[0.08] bg-[#04060a]/50 border-dashed text-slate-500"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-wider text-indigo-400 font-bold mb-1">
                            2nd Choice Portfolio
                          </div>
                          {formData.pref2Country ? (
                            <div className="font-sans text-xs font-bold leading-relaxed">
                              {formData.pref2Country}
                              <div className="text-[10px] text-indigo-300 font-medium font-mono uppercase mt-0.5">
                                {COMMITTEES.find(c => c.id === formData.pref2Committee)?.abbreviation || formData.pref2Committee}
                              </div>
                            </div>
                          ) : (
                            <p className="font-sans text-[11px] leading-snug">Optional 2nd choice...</p>
                          )}
                        </div>
                        {formData.pref2Country && (
                          <button
                            type="button"
                            onClick={() => handlePortfolioClick(formData.pref2Country, formData.pref2Committee)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Preference 3 */}
                      <div className={`p-4 rounded-2xl border ${
                        formData.pref3Country 
                          ? "border-purple-500/40 bg-purple-950/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] text-white" 
                          : "border-white/[0.08] bg-[#04060a]/50 border-dashed text-slate-500"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-wider text-purple-400 font-bold mb-1">
                            3rd Choice Portfolio
                          </div>
                          {formData.pref3Country ? (
                            <div className="font-sans text-xs font-bold leading-relaxed">
                              {formData.pref3Country}
                              <div className="text-[10px] text-purple-300 font-medium font-mono uppercase mt-0.5">
                                {COMMITTEES.find(c => c.id === formData.pref3Committee)?.abbreviation || formData.pref3Committee}
                              </div>
                            </div>
                          ) : (
                            <p className="font-sans text-[11px] leading-snug">Optional 3rd choice...</p>
                          )}
                        </div>
                        {formData.pref3Country && (
                          <button
                            type="button"
                            onClick={() => handlePortfolioClick(formData.pref3Country, formData.pref3Committee)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {errors.pref1Country && (
                      <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.pref1Country}</p>
                    )}
                  </div>

                  {/* Interactive Portfolio Matrix Panel */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-1.5">
                          <Landmark className="h-4 w-4 text-cyan-400" />
                          Live Available Portfolio Matrix
                        </h3>
                        <p className="font-sans text-[11px] text-slate-400">
                          Click any available cell to select (up to 3). Click again to deselect.
                        </p>
                      </div>

                      {/* Matrix Search */}
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search Country / Portfolio..."
                          value={matrixSearchTerm}
                          onChange={(e) => setMatrixSearchTerm(e.target.value)}
                          className="w-full rounded-full border border-white/[0.08] bg-[#04060a] py-2.5 pl-9 pr-8 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium"
                        />
                        {matrixSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setMatrixSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Matrix table container */}
                    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#04060a]/60 shadow-xl max-h-[350px] scrollbar-thin">
                      <table className="w-full min-w-[650px] border-collapse text-left font-sans text-xs">
                        <thead>
                          <tr className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#080d1a] font-mono text-[9px] uppercase tracking-wider text-slate-400">
                            <th className="px-4 py-3 font-bold bg-[#080d1a]">Nation / Entity</th>
                            <th className="px-4 py-3 font-bold bg-[#080d1a] text-center">COPUOS</th>
                            <th className="px-4 py-3 font-bold bg-[#080d1a] text-center">UNGA DISEC</th>
                            <th className="px-4 py-3 font-bold bg-[#080d1a] text-center">AIPPM</th>
                            <th className="px-4 py-3 font-bold bg-[#080d1a] text-center">UNSC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {(() => {
                            const filtered = COUNTRY_MATRIX.filter((row) => {
                              const matchesSearch = row.country.toLowerCase().includes(matrixSearchTerm.toLowerCase());
                              if (!matchesSearch) return false;

                              return (
                                getPortfolioStatus(row.country, "copuos") === "Available" ||
                                getPortfolioStatus(row.country, "disec") === "Available" ||
                                getPortfolioStatus(row.country, "aippm") === "Available" ||
                                getPortfolioStatus(row.country, "unsc") === "Available"
                              );
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans text-xs">
                                    No available portfolios found matching "{matrixSearchTerm}"
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((row) => {
                              return (
                                <tr key={row.country} className="hover:bg-white/[0.02] transition-all">
                                  <td className="px-4 py-2.5 font-bold text-slate-200">{row.country}</td>
                                  
                                  {["copuos", "disec", "aippm", "unsc"].map((comm) => {
                                    const status = getPortfolioStatus(row.country, comm);
                                    const selNum = getSelectionNumber(row.country, comm);
                                    const hasReachedMax = getSelectedPreferences().length >= 3;

                                    if (status !== "Available") {
                                      return (
                                        <td key={comm} className="px-4 py-2.5 text-center text-slate-700 font-mono text-[10px]">
                                          —
                                        </td>
                                      );
                                    }

                                    return (
                                      <td key={comm} className="px-4 py-2.5 text-center">
                                        {selNum ? (
                                          <button
                                            type="button"
                                            onClick={() => handlePortfolioClick(row.country, comm)}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                                              selNum === 1
                                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20"
                                                : selNum === 2
                                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/20"
                                                : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-purple-500/20"
                                            }`}
                                          >
                                            {selNum === 1 ? "1st Choice" : selNum === 2 ? "2nd Choice" : "3rd Choice"}
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handlePortfolioClick(row.country, comm)}
                                            disabled={hasReachedMax}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                              hasReachedMax ? "opacity-30 cursor-not-allowed border-white/[0.08] bg-white/[0.02] text-slate-500" : ""
                                            }`}
                                          >
                                            Select
                                          </button>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Statement of Motivation */}
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Why do you want to debate this agenda? (Motivation Statement)</label>
                    <textarea
                      rows={4}
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#04060a]/90 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 resize-none leading-relaxed font-medium transition-all"
                      placeholder="Discuss your background, interest in space law, aerospace governance, or international diplomacy (minimum 20 characters)..."
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.motivation ? (
                        <p className="text-[10px] text-rose-400 font-mono font-bold">{errors.motivation}</p>
                      ) : (
                        <span />
                      )}
                      <span className={`text-[10px] font-mono ${formData.motivation.length >= 20 ? "text-cyan-400" : "text-slate-500"}`}>
                        {formData.motivation.length} / 20 min chars
                      </span>
                    </div>
                  </div>

                  {/* Warning label */}
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 flex gap-3 items-start">
                    <AlertCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="font-sans text-xs text-slate-300 leading-relaxed">
                      <span className="text-white font-bold">Note:</span> Portfolio selection is processed on an early-bird basis. Submitting this form reserves your priority queue position for EB review and allotment.
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-slate-300 cursor-pointer transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      id="step3-submit-btn"
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95 transition-all cursor-pointer"
                    >
                      Submit & Board
                      <Rocket className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
