/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { COMMITTEES, COUNTRY_MATRIX } from "../data";
import { RegistrationDetails, PortfolioStatus, CountryMatrixRow } from "../types";
import { Rocket, Sparkles, User, Users, Landmark, ChevronRight, ChevronLeft, CheckCircle, Ticket, Calendar, Download, Share2, Phone, Mail, Award, AlertCircle, Search, Globe, X, CheckCircle2 } from "lucide-react";
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
      alert("🚨 Missing Details! Please fill up all required fields in your delegate registration and country preferences before boarding.");
      
      // If contact details are missing, direct the user back to Step 2
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
    <div className="bg-[#020617] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%)" }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-4xl"
      >
        {authLoading ? (
          <div className="text-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
            <p className="font-sans text-slate-400 text-xs mt-4 font-bold tracking-widest uppercase">// ALIGNING TELEMETRY SYSTEMS...</p>
          </div>
        ) : !user ? (
          <div className="text-center py-16 px-6 max-w-lg mx-auto bg-slate-900/40 border border-slate-800/40 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6">
              <Rocket className="h-8 w-8 animate-bounce-slow" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-blue-400 font-bold">// UPLINK CONTEXT</span>
            <h1 className="mt-2 font-sans text-2xl font-black text-white uppercase tracking-tight">Identity Uplink Required</h1>
            <p className="mt-3 font-sans text-slate-400 text-xs leading-relaxed">
              To request a delegate portfolio, register your country matrix choices, and lock in your boarding pass, you must establish a secure link with our cloud registry.
            </p>
            <button
              onClick={() => signInWithGoogle().catch(() => {})}
              disabled={isSigningIn}
              className={`mt-8 w-full rounded-full px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-900/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                isSigningIn 
                  ? "bg-blue-850 opacity-75 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-500 active:scale-95"
              }`}
              id="registration-login-btn"
            >
              {isSigningIn ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent animate-spin-slow" />
                  Uplinking Identity...
                </>
              ) : (
                <>
                  Sign In with Google
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>

            {authError && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-left animate-fade-in text-xs font-sans">
                <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>🔒 Connection Interrupted (Iframe Sandbox Restriction)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Your browser blocked or closed the Google sign-in popup. Since this preview runs inside a sandboxed iframe, popups are frequently restricted by browser security policies.
                </p>
                <div className="mt-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 break-words">
                  <strong>Telemetry trace:</strong> {authError.message || String(authError)}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      // Retrieve the full development/preview URL
                      const devUrl = window.location.href;
                      window.open(devUrl, "_blank");
                    }}
                    className="flex-1 rounded-full bg-blue-600 hover:bg-blue-50 px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider text-white hover:text-blue-900 text-center cursor-pointer transition-all duration-200"
                  >
                    🛰️ Open App in New Tab
                  </button>
                  <button
                    onClick={() => {
                      clearAuthError();
                      signInWithGoogle().catch(() => {});
                    }}
                    className="rounded-full bg-slate-800 hover:bg-slate-700 px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider text-slate-300 text-center cursor-pointer transition-colors"
                  >
                    🔄 Retry
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 mt-2.5 text-center italic leading-normal">
                  Pro-Tip: Clicking "Open App in New Tab" runs the app as a top-level window, which permits popup authentication perfectly.
                </p>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
            <p className="font-sans text-slate-400 text-xs mt-4 font-bold tracking-widest uppercase">// RETRIEVING ORBITAL CLEARANCE...</p>
          </div>
        ) : submittedPass ? (
          <div className="animate-fade-in space-y-6" id="boarding-pass-display">
            {/* Success message */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 animate-bounce-slow">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="font-sans text-3xl font-extrabold text-white">Orbit Clearance Approved</h1>
              <p className="font-sans text-sm text-slate-400 mt-2 max-w-xl mx-auto">
                Your delegate registration is <strong className="text-emerald-400 font-semibold">CONFIRMED</strong>. A confirmation email has been dispatched to <span className="text-cyan-300 font-mono font-bold">{submittedPass.email}</span>. Your portfolio will be allotted shortly.
              </p>
            </div>

            {/* Futuristic Boarding Pass Card */}
            <div
              ref={boardingPassRef}
              id="mun-boarding-pass-card"
              className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl text-left"
            >
              {/* Outer Glow Borders */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />
              
              {/* Card Watermark */}
              <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

              <div className="p-6 md:p-10">
                {/* Boarding Pass Header */}
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-lg text-white border border-blue-450 shadow-[0_0_15px_rgba(37,99,235,0.25)]">
                      I
                    </div>
                    <div className="text-left">
                      <span className="block font-mono text-[9px] uppercase tracking-widest text-blue-450 font-bold">// DELEGATE BRIEFING BADGE</span>
                      <h2 className="font-sans text-lg font-black text-white">IIST MUN 2026</h2>
                    </div>
                  </div>
                  
                  {/* Launch Code */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-center">
                    <span className="block font-mono text-[8px] uppercase tracking-wider text-slate-500 font-bold">Launch Reference</span>
                    <span className="font-mono text-sm font-extrabold text-blue-400">{submittedPass.id}</span>
                  </div>
                </div>

                {/* Main Pass Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 items-center border-b border-slate-800">
                  {/* Left Column: Delegate Credentials */}
                  <div className="md:col-span-2 space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Passenger / Delegate</span>
                        <span className="font-sans text-base font-extrabold text-white">{submittedPass.name}</span>
                        <span className="block font-mono text-[9.5px] text-blue-400 font-bold mt-0.5">{submittedPass.id} ({submittedPass.role || "Delegate"})</span>
                        
                        {submittedPass.regType === "double" && submittedPass.partnerName && (
                          <div className="mt-3 pt-2 border-t border-slate-800/40">
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Partner Delegate</span>
                            <span className="font-sans text-sm font-extrabold text-white">{submittedPass.partnerName}</span>
                            <span className="block font-mono text-[9.5px] text-indigo-400 font-bold mt-0.5">{submittedPass.partnerId} ({submittedPass.partnerRole || "Delegate"})</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Registry Category</span>
                        <span className="font-sans text-xs font-semibold text-blue-400 capitalize">{submittedPass.regType} Delegate</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Institution / College</span>
                        <span className="font-sans text-xs text-slate-300 font-bold">{submittedPass.institution}</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Assigned Chamber (Pref)</span>
                        <span className="font-sans text-xs text-white uppercase font-bold">{submittedPass.pref1Committee}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Target Portfolio (Pref)</span>
                        <span className="font-sans text-xs font-extrabold text-indigo-400">{submittedPass.pref1Country}</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Launch Date / Venue</span>
                        <span className="font-sans text-[11px] text-slate-400">Sept 18, 2026 &bull; IIST Campus</span>
                      </div>
                    </div>

                    {/* Notice Callout */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-sans text-amber-400/90 leading-relaxed">
                      ⚡ <strong>Portfolio Allotment Status:</strong> Your registration is confirmed. Committee and country portfolio will be allotted shortly by the Executive Secretariat.
                    </div>
                  </div>

                  {/* Right Column: Scannable QR Code */}
                  <div className="flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                    <QRCodeDisplay
                      uniqueId={submittedPass.id}
                      candidateName={submittedPass.name}
                      title="IIST MUN 2026 Boarding Pass"
                      size={120}
                      showScannerTest={true}
                    />
                  </div>
                </div>

                {/* Sub Barcode Area */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
                  <div className="text-left">
                    <span className="block font-mono text-[9px] text-slate-500">TIMESTAMP LOGGED</span>
                    <span className="font-sans text-[11px] text-slate-400">{submittedPass.timestamp}</span>
                  </div>
                  {/* Barcode representation */}
                  <div className="flex flex-col items-end">
                    <div className="flex gap-0.5 h-8">
                      <div className="w-1 bg-white"></div>
                      <div className="w-0.5 bg-white"></div>
                      <div className="w-2 bg-white"></div>
                      <div className="w-0.5 bg-white"></div>
                      <div className="w-1 bg-white"></div>
                      <div className="w-1.5 bg-white"></div>
                      <div className="w-0.5 bg-white"></div>
                      <div className="w-2 bg-white"></div>
                      <div className="w-1.5 bg-white"></div>
                      <div className="w-0.5 bg-white"></div>
                      <div className="w-1 bg-white"></div>
                    </div>
                    <span className="font-mono text-[9px] text-slate-500 mt-1">SECURED BY TRIVANDRUM TELEMETRY</span>
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
                className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 cursor-pointer"
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
                className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 shadow-blue-900/20 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                Share Orbit Status
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleReset}
                id="receipt-reset-btn"
                className="text-slate-500 hover:text-slate-300 font-mono text-xs uppercase tracking-wider underline underline-offset-4 cursor-pointer"
              >
                Register Another Delegate / Team
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 sm:p-10 backdrop-blur-md shadow-2xl">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-900">
              <div className="flex items-center gap-2 sm:gap-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold font-mono transition-all duration-300 ${
                      step === num
                        ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        : step > num
                        ? "bg-blue-950/40 text-blue-450 border border-blue-900/40"
                        : "bg-slate-950 text-slate-500 border border-slate-850"
                    }`}>
                      {num}
                    </div>
                    {num < 3 && (
                      <div className={`w-6 sm:w-12 h-0.5 mx-1.5 sm:mx-2 ${
                        step > num ? "bg-blue-900/30" : "bg-slate-900"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-right">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Launch Sequence</span>
                <span className="font-sans text-xs font-bold text-blue-400">Step {step} of 3</span>
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
                      Choose the allocation framework for your participation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Individual */}
                    <div
                      id="card-reg-individual"
                      onClick={() => setFormData({ ...formData, regType: "individual" })}
                      className={`rounded-3xl border p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        formData.regType === "individual"
                          ? "border-blue-500 bg-blue-950/20 shadow-[0_0_20px_rgba(37,99,235,0.15)] animate-pulse-slow"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <User className={`h-5 w-5 ${formData.regType === "individual" ? "text-blue-400" : "text-slate-400"}`} />
                        <h3 className="mt-4 font-sans text-sm font-bold text-white uppercase tracking-wider">Individual</h3>
                      </div>
                      <p className="mt-2 font-sans text-xs text-slate-400 leading-relaxed">
                        Register as a single delegate representing a specific country choice.
                      </p>
                    </div>

                    {/* Double Delegation */}
                    <div
                      id="card-reg-double"
                      onClick={() => setFormData({ ...formData, regType: "double" })}
                      className={`rounded-3xl border p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        formData.regType === "double"
                          ? "border-indigo-500 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <Users className={`h-5 w-5 ${formData.regType === "double" ? "text-indigo-400" : "text-slate-400"}`} />
                        <h3 className="mt-4 font-sans text-sm font-bold text-white uppercase tracking-wider">Double Del</h3>
                      </div>
                      <p className="mt-2 font-sans text-xs text-slate-400 leading-relaxed">
                        Debate as a pair in COPUOS or UNGA DISEC chambers.
                      </p>
                    </div>

                    {/* Contingent */}
                    <div
                      id="card-reg-contingent"
                      onClick={() => setFormData({ ...formData, regType: "contingent" })}
                      className={`rounded-3xl border p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        formData.regType === "contingent"
                          ? "border-amber-500 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <Landmark className={`h-5 w-5 ${formData.regType === "contingent" ? "text-amber-400" : "text-slate-400"}`} />
                        <h3 className="mt-4 font-sans text-sm font-bold text-white uppercase tracking-wider">Contingent</h3>
                      </div>
                      <p className="mt-2 font-sans text-xs text-slate-400 leading-relaxed">
                        Submit institutional registrations for multiple delegates at once.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleNext}
                      id="step1-next-btn"
                      className="flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-95 transition-all"
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
                      Let's record your delegate profile information.
                    </p>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
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
                        className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
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
                        className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
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
                        accentColor="blue"
                        id="reg-institution-select"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Course / Department / Class</label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="B.Tech Aerospace Engineering"
                      />
                      {errors.course && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.course}</p>}
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Previous MUN Experience</label>
                      <select
                        value={formData.munExperience}
                        onChange={(e) => setFormData({ ...formData, munExperience: e.target.value })}
                        className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-wider"
                      >
                        <option value="None" className="bg-slate-950">None (First Timer)</option>
                        <option value="1-2" className="bg-slate-950">1-2 Conferences</option>
                        <option value="3-5" className="bg-slate-950">3-5 Conferences</option>
                        <option value="5+" className="bg-slate-950">5+ (Veteran Delegate)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Participation Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as "Delegate" | "Photographer" })}
                        className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-wider"
                      >
                        <option value="Delegate" className="bg-slate-950">Delegate</option>
                        <option value="Photographer" className="bg-slate-950">Photographer</option>
                      </select>
                    </div>
                  </div>

                  {/* Double Delegation Partner details if double selected */}
                  {formData.regType === "double" && (
                    <div className="rounded-3xl border border-indigo-500/20 bg-indigo-950/5 p-5 space-y-4">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-bold block">// DOUBLE DELEGATION: PARTNER DETAILS</span>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1">Partner Full Name</label>
                          <input
                            type="text"
                            value={formData.partnerName}
                            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                            className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                            placeholder="Partner's full name"
                          />
                          {errors.partnerName && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.partnerName}</p>}
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1">Partner Email</label>
                          <input
                            type="email"
                            value={formData.partnerEmail}
                            onChange={(e) => setFormData({ ...formData, partnerEmail: e.target.value })}
                            className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                            placeholder="partner@university.edu"
                          />
                          {errors.partnerEmail && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.partnerEmail}</p>}
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1">Partner Role</label>
                          <select
                            value={formData.partnerRole}
                            onChange={(e) => setFormData({ ...formData, partnerRole: e.target.value as "Delegate" | "Photographer" })}
                            className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500/50 transition-all font-bold uppercase tracking-wider"
                          >
                            <option value="Delegate" className="bg-slate-950">Delegate</option>
                            <option value="Photographer" className="bg-slate-950">Photographer</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contingent size if contingent selected */}
                  {formData.regType === "contingent" && (
                    <div className="rounded-3xl border border-amber-500/20 bg-amber-950/5 p-5 space-y-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400 font-bold block">// CONTINGENT DETAILS</span>
                      <div>
                        <label className="block font-mono text-[9px] uppercase text-slate-400 mb-1">Expected Delegation Size</label>
                        <select
                           value={formData.contingentSize}
                           onChange={(e) => setFormData({ ...formData, contingentSize: e.target.value })}
                           className="w-full max-w-xs rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none font-bold uppercase tracking-wider"
                        >
                          <option value="5-10" className="bg-slate-950">5 to 10 Delegates</option>
                          <option value="11-20" className="bg-slate-950">11 to 20 Delegates</option>
                          <option value="20+" className="bg-slate-950">More than 20 Delegates</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 hover:bg-slate-900 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      id="step2-next-btn"
                      className="flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-95 transition-all"
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
                      Identify your target councils and country choices to complete registration.
                    </p>
                  </div>

                  {/* Selected Preferences Visual Cards */}
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Your Selected Preferences (Up to 3 in order of selection)
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {/* Preference 1 */}
                      <div className={`p-4 rounded-2xl border ${
                        formData.pref1Country 
                          ? "border-blue-500/40 bg-blue-950/20 shadow-lg shadow-blue-500/5 text-white" 
                          : "border-slate-800 bg-slate-950/20 border-dashed text-slate-500"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-wider text-blue-400 font-bold mb-1">
                            1st Choice Portfolio
                          </div>
                          {formData.pref1Country ? (
                            <div className="font-sans text-xs font-bold leading-relaxed">
                              {formData.pref1Country}
                              <div className="text-[10px] text-slate-400 font-medium font-mono uppercase mt-0.5">
                                {COMMITTEES.find(c => c.id === formData.pref1Committee)?.abbreviation || formData.pref1Committee}
                              </div>
                            </div>
                          ) : (
                            <p className="font-sans text-[11px] leading-snug">Click an available portfolio below...</p>
                          )}
                        </div>
                        {formData.pref1Country && (
                          <button
                            type="button"
                            onClick={() => handlePortfolioClick(formData.pref1Country, formData.pref1Committee)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-850 text-slate-400 hover:text-white transition-all"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Preference 2 */}
                      <div className={`p-4 rounded-2xl border ${
                        formData.pref2Country 
                          ? "border-indigo-500/40 bg-indigo-950/20 shadow-lg shadow-indigo-500/5 text-white" 
                          : "border-slate-800 bg-slate-950/20 border-dashed text-slate-500"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-wider text-indigo-400 font-bold mb-1">
                            2nd Choice Portfolio
                          </div>
                          {formData.pref2Country ? (
                            <div className="font-sans text-xs font-bold leading-relaxed">
                              {formData.pref2Country}
                              <div className="text-[10px] text-slate-400 font-medium font-mono uppercase mt-0.5">
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
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-850 text-slate-400 hover:text-white transition-all"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Preference 3 */}
                      <div className={`p-4 rounded-2xl border ${
                        formData.pref3Country 
                          ? "border-purple-500/40 bg-purple-950/20 shadow-lg shadow-purple-500/5 text-white" 
                          : "border-slate-800 bg-slate-950/20 border-dashed text-slate-500"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-wider text-purple-400 font-bold mb-1">
                            3rd Choice Portfolio
                          </div>
                          {formData.pref3Country ? (
                            <div className="font-sans text-xs font-bold leading-relaxed">
                              {formData.pref3Country}
                              <div className="text-[10px] text-slate-400 font-medium font-mono uppercase mt-0.5">
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
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-850 text-slate-400 hover:text-white transition-all"
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
                          <Landmark className="h-4 w-4 text-blue-500" />
                          Live Available Portfolio Matrix
                        </h3>
                        <p className="font-sans text-[11px] text-slate-400">
                          Click any available cell to select. Maximum of 3. Click again to deselect.
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
                          className="w-full rounded-full border border-slate-800 bg-slate-950 py-2 pl-9 pr-8 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 transition-all font-medium"
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
                    <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/40 shadow-xl max-h-[350px] scrollbar-thin">
                      <table className="w-full min-w-[650px] border-collapse text-left font-sans text-xs">
                        <thead>
                          <tr className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950 font-mono text-[9px] uppercase tracking-wider text-slate-450">
                            <th className="px-4 py-3 font-bold bg-slate-950">Nation / Character</th>
                            <th className="px-4 py-3 font-bold bg-slate-950 text-center">COPUOS</th>
                            <th className="px-4 py-3 font-bold bg-slate-950 text-center">UNGA DISEC</th>
                            <th className="px-4 py-3 font-bold bg-slate-950 text-center">AIPPM</th>
                            <th className="px-4 py-3 font-bold bg-slate-950 text-center">UNSC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60">
                          {(() => {
                            const filtered = COUNTRY_MATRIX.filter((row) => {
                              const matchesSearch = row.country.toLowerCase().includes(matrixSearchTerm.toLowerCase());
                              if (!matchesSearch) return false;

                              // Only show rows that contain at least one Available portfolio
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
                                <tr key={row.country} className="hover:bg-slate-900/20 transition-all">
                                  <td className="px-4 py-2.5 font-bold text-slate-200">{row.country}</td>
                                  
                                  {["copuos", "disec", "aippm", "unsc"].map((comm) => {
                                    const status = getPortfolioStatus(row.country, comm);
                                    const selNum = getSelectionNumber(row.country, comm);
                                    const hasReachedMax = getSelectedPreferences().length >= 3;

                                    if (status !== "Available") {
                                      return (
                                        <td key={comm} className="px-4 py-2.5 text-center text-slate-750 font-mono text-[10px]">
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
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-md ${
                                              selNum === 1
                                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10"
                                                : selNum === 2
                                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/10"
                                                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/10"
                                            }`}
                                          >
                                            {selNum === 1 ? "1st Choice" : selNum === 2 ? "2nd Choice" : "3rd Choice"}
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handlePortfolioClick(row.country, comm)}
                                            disabled={hasReachedMax}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider transition-all ${
                                              hasReachedMax ? "opacity-40 cursor-not-allowed border-slate-850 bg-slate-900/10 text-slate-500" : ""
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
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none leading-relaxed font-medium"
                      placeholder="Discuss your background, interest in space law, aerospace technology, or international diplomacy (minimum 20 characters)..."
                    />
                    {errors.motivation && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.motivation}</p>}
                  </div>

                  {/* Warning label */}
                  <div className="rounded-3xl border border-blue-900/30 bg-blue-950/20 p-5 flex gap-3 items-start">
                    <AlertCircle className="h-5 w-5 text-blue-450 shrink-0 mt-0.5" />
                    <p className="font-sans text-xs text-slate-400 leading-relaxed">
                      <span className="text-white font-bold">Note:</span> Portfolio selection is processed on an early-bird basis. Submitting this form secures your entry queue and reserves your preferred profile slot for EB review.
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 hover:bg-slate-900 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      id="step3-submit-btn"
                      className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-900/10 active:scale-95 transition-all"
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

