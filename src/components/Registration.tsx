/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { COMMITTEES, COUNTRY_MATRIX } from "../data";
import { RegistrationDetails, PortfolioStatus } from "../types";
import { 
  User, Users, Landmark, ChevronRight, ChevronLeft, 
  Download, Share2, AlertCircle, Search, X, Check,
  ShieldCheck, FileText, CheckCircle2
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
    contingentSize: "5-10",
    motivation: ""
  });

  const [submittedPass, setSubmittedPass] = useState<RegistrationDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const boardingPassRef = useRef<HTMLDivElement>(null);

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

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 2) {
      if (!formData.name.trim()) newErrors.name = "Full name is required.";
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required.";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
      if (!formData.institution.trim()) newErrors.institution = "Institution or School name is required.";
      if (!formData.course.trim()) newErrors.course = "Course / Major / Class is required.";
      
      if (formData.regType === "double") {
        if (!formData.partnerName.trim()) newErrors.partnerName = "Partner full name is required.";
        if (!formData.partnerEmail.trim() || !/\S+@\S+\.\S+/.test(formData.partnerEmail)) {
          newErrors.partnerEmail = "Valid partner email is required.";
        }
      }
    } else if (step === 3) {
      if (!formData.pref1Country.trim()) newErrors.pref1Country = "Primary country portfolio preference is required.";
      if (!formData.motivation.trim() || formData.motivation.length < 20) {
        newErrors.motivation = "Motivation dossier must be at least 20 characters.";
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
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required.";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.institution.trim()) newErrors.institution = "College or School name is required.";
    if (!formData.course.trim()) newErrors.course = "Course / Class is required.";
    
    if (formData.regType === "double") {
      if (!formData.partnerName.trim()) newErrors.partnerName = "Partner full name is required.";
      if (!formData.partnerEmail.trim() || !/\S+@\S+\.\S+/.test(formData.partnerEmail)) {
        newErrors.partnerEmail = "Valid partner email is required.";
      }
    }

    if (!formData.pref1Country.trim()) newErrors.pref1Country = "1st choice country portfolio is required.";
    if (!formData.motivation.trim() || formData.motivation.length < 20) {
      newErrors.motivation = "Motivation statement must be at least 20 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Incomplete Dossier: Please verify all required academic credentials and country portfolio preferences.");
      
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
    navigator.clipboard.writeText(`IIST MUN 2026 Registration Confirmed! Portfolio Preference: ${submittedPass.pref1Country} in ${submittedPass.pref1Committee.toUpperCase()}. Accreditation ID: ${submittedPass.id}${partnerText}`);
    alert("Accreditation details copied to clipboard!");
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
          contingentSize: "5-10",
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
    <div className="bg-[#1A1F1A] text-[#EDE6D3] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden paper-grain font-sans selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]">
      
      {/* Background subtle botanical parchment ambient glow */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,106,0.12), transparent 70%),
            radial-gradient(ellipse 50% 50% at 90% 60%, rgba(46,59,47,0.4), transparent 70%)
          `
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-4xl"
      >
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 border border-[#C9A86A]/40 bg-[#2E3B2F]/60 text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-[#C9A86A] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A86A]" />
            Official Delegate Accreditation &bull; IIST MUN 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-wide text-[#EDE6D3]">
            Delegate Registration Dossier
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#8A9A7E] max-w-xl mx-auto leading-relaxed">
            Select your participation division, submit academic credentials, choose preference portfolios from the live council matrix, and claim your Diplomatic Boarding Pass.
          </p>
        </div>

        {authLoading ? (
          <div className="text-center py-24 border border-[#C9A86A]/20 bg-[#2E3B2F]/40 backdrop-blur-md">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A86A] border-t-transparent mx-auto" />
            <p className="font-sans text-[#C9A86A] text-xs mt-4 font-semibold tracking-widest uppercase">
              Verifying Accreditation Session...
            </p>
          </div>
        ) : !user ? (
          /* Sign-In Card matching Archival Theme */
          <div className="text-center py-12 px-6 sm:px-10 max-w-lg mx-auto bg-[#2E3B2F]/50 border border-[#C9A86A]/30 backdrop-blur-md shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[#C9A86A] text-[#C9A86A] mb-6 font-serif text-2xl font-bold bg-[#1A1F1A]">
              IM
            </div>

            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold">
              Accreditation Verification
            </span>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-[#EDE6D3]">
              Authentication Required
            </h2>
            <p className="mt-3 text-[#8A9A7E] text-xs leading-relaxed max-w-sm mx-auto">
              Authenticate your identity to lock in country preferences, preserve your early-bird allocation priority, and generate your conference boarding pass.
            </p>
            
            <button
              onClick={() => signInWithGoogle().catch(() => {})}
              disabled={isSigningIn}
              className={`mt-8 w-full px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                isSigningIn 
                  ? "bg-[#2E3B2F] border border-[#C9A86A]/40 text-[#C9A86A] opacity-75 cursor-not-allowed" 
                  : "bg-[#C9A86A] text-[#1A1F1A] hover:bg-[#bfa060] active:scale-95 shadow-md"
              }`}
              id="registration-login-btn"
            >
              {isSigningIn ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A1F1A] border-t-transparent" />
                  Connecting Identity...
                </>
              ) : (
                <>
                  Sign In with Google
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>

            {authError && (
              <div className="mt-6 p-4 bg-[#1A1F1A] border border-[#8B5A3C] text-left animate-fade-in text-xs">
                <div className="flex items-center gap-2 text-[#C9A86A] font-semibold mb-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#8B5A3C]" />
                  <span>Connection Interrupted (Popup Security)</span>
                </div>
                <p className="text-[#8A9A7E] leading-relaxed text-[11px]">
                  Browser blocked or closed the sign-in popup. Opening the app in a new tab bypasses iframe sandbox restrictions immediately.
                </p>
                <div className="mt-3 bg-[#2E3B2F]/40 p-2.5 border border-[#8A9A7E]/20 font-mono text-[10px] text-[#EDE6D3] break-words">
                  <strong>Trace:</strong> {authError.message || String(authError)}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      const devUrl = window.location.href;
                      window.open(devUrl, "_blank");
                    }}
                    className="flex-1 bg-[#C9A86A] hover:bg-[#bfa060] px-4 py-2 font-sans text-[10px] uppercase font-semibold tracking-wider text-[#1A1F1A] text-center cursor-pointer transition-all"
                  >
                    Open App in New Tab
                  </button>
                  <button
                    onClick={() => {
                      clearAuthError();
                      signInWithGoogle().catch(() => {});
                    }}
                    className="bg-[#2E3B2F] hover:bg-[#3d4d3e] px-4 py-2 font-sans text-[10px] uppercase font-semibold tracking-wider text-[#EDE6D3] text-center cursor-pointer transition-colors border border-[#C9A86A]/30"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-24 border border-[#C9A86A]/20 bg-[#2E3B2F]/40 backdrop-blur-md">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A86A] border-t-transparent mx-auto" />
            <p className="font-sans text-[#C9A86A] text-xs mt-4 font-semibold tracking-widest uppercase">
              Retrieving Accreditation Record...
            </p>
          </div>
        ) : submittedPass ? (
          /* Confirmed Diplomatic Boarding Pass (Ticket Stub) */
          <div className="animate-fade-in space-y-6" id="boarding-pass-display">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#C9A86A] text-[#C9A86A] mb-3 bg-[#2E3B2F]/50">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#EDE6D3]">
                Accreditation Confirmed
              </h2>
              <p className="text-xs sm:text-sm text-[#8A9A7E] mt-2 max-w-xl mx-auto leading-relaxed">
                Your delegate registration is recorded with the Secretariat. Dispatch confirmation sent to <span className="text-[#C9A86A] font-mono font-bold">{submittedPass.email}</span>.
              </p>
            </div>

            {/* Perforated Archival Boarding Pass Ticket */}
            <div
              ref={boardingPassRef}
              id="mun-boarding-pass-card"
              className="relative bg-[#EDE6D3] text-[#1A1F1A] border-2 border-[#C9A86A] shadow-2xl p-0 overflow-hidden font-sans"
            >
              {/* Header Banner */}
              <div className="bg-[#2E3B2F] text-[#EDE6D3] px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#C9A86A] gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 border border-[#C9A86A] flex items-center justify-center font-serif text-lg font-bold text-[#C9A86A] bg-[#1A1F1A]">
                    IM
                  </div>
                  <div>
                    <div className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#C9A86A]">
                      Official Diplomatic Boarding Pass
                    </div>
                    <div className="font-serif text-xl sm:text-2xl font-bold tracking-wide">
                      IIST Model United Nations 2026
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-sans text-[8px] uppercase tracking-wider text-[#8A9A7E] block">Dossier ID</span>
                  <span className="font-mono text-sm sm:text-base font-bold text-[#C9A86A] bg-[#1A1F1A] px-3 py-1 border border-[#C9A86A]/40 inline-block">
                    {submittedPass.id}
                  </span>
                </div>
              </div>

              {/* Main Ticket Body with Perforation */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0 relative">
                
                {/* Left Main Stub (8 cols) */}
                <div className="md:col-span-8 p-6 sm:p-8 space-y-6 text-left border-b md:border-b-0 md:border-r border-dashed border-[#8A9A7E]/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Delegate Name
                      </span>
                      <span className="font-serif text-lg sm:text-xl font-bold text-[#1A1F1A] block">
                        {submittedPass.name}
                      </span>
                      <span className="font-sans text-[10px] text-[#5B6B4F] font-medium">
                        Role: {submittedPass.role || "Delegate"}
                      </span>
                      
                      {submittedPass.regType === "double" && submittedPass.partnerName && (
                        <div className="mt-3 pt-2 border-t border-[#8A9A7E]/30">
                          <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                            Co-Delegate (Partner)
                          </span>
                          <span className="font-serif text-base font-bold text-[#1A1F1A] block">
                            {submittedPass.partnerName}
                          </span>
                          <span className="font-mono text-[10px] text-[#5B6B4F]">
                            ID: {submittedPass.partnerId || "TBD"} &bull; {submittedPass.partnerRole || "Delegate"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Registration Division
                      </span>
                      <span className="inline-block mt-1 font-sans text-[10px] uppercase font-bold text-[#2E3B2F] bg-[#2E3B2F]/10 px-2.5 py-1 border border-[#2E3B2F]/30">
                        {submittedPass.regType} Delegation
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#8A9A7E]/30 pt-4">
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Academic Institution
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#1A1F1A]">
                        {submittedPass.institution}
                      </span>
                    </div>
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Target Council (Pref)
                      </span>
                      <span className="font-sans text-xs font-bold text-[#8B5A3C] uppercase">
                        {submittedPass.pref1Committee}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#8A9A7E]/30 pt-4">
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Preferred Country / Portfolio
                      </span>
                      <span className="font-sans text-xs font-bold text-[#2E3B2F]">
                        {submittedPass.pref1Country}
                      </span>
                    </div>
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Dates & Venue
                      </span>
                      <span className="font-sans text-[11px] text-[#1A1F1A]">
                        Sept 18–20, 2026 &bull; IIST Valiamala
                      </span>
                    </div>
                  </div>

                  {/* Stamp notice */}
                  <div className="p-3 bg-[#2E3B2F]/10 border-l-2 border-[#C9A86A] text-[11px] text-[#2E3B2F] leading-relaxed">
                    <strong>Accreditation Notice:</strong> Country and chamber allotments are assigned by the Executive Secretariat following early-bird review. Present this pass at registration check-in.
                  </div>
                </div>

                {/* Right Verification Stub (4 cols) with QR and Stamp */}
                <div className="md:col-span-4 p-6 sm:p-8 flex flex-col justify-between items-center bg-[#EDE6D3]/60 relative">
                  
                  <div className="text-center w-full">
                    <span className="font-sans text-[8px] uppercase tracking-[0.2em] text-[#5B6B4F] font-bold block mb-2">
                      Official Security Stamp
                    </span>

                    {/* QR Code Container */}
                    <div className="p-2 border border-[#C9A86A] bg-white inline-block shadow-sm">
                      <QRCodeDisplay
                        uniqueId={submittedPass.id}
                        candidateName={submittedPass.name}
                        title="IIST MUN 2026 Boarding Pass"
                        size={110}
                        showScannerTest={false}
                      />
                    </div>
                  </div>

                  {/* Archival Seal Emblem watermark */}
                  <div className="mt-4 pt-3 border-t border-[#8A9A7E]/30 text-center w-full">
                    <div className="font-serif text-xs font-bold tracking-widest text-[#2E3B2F] uppercase">
                      Save &bull; Sustain &bull; Safeguard
                    </div>
                    <div className="font-mono text-[9px] text-[#5B6B4F] mt-1">
                      Logged: {submittedPass.timestamp}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Perforated Cut line styling */}
              <div className="bg-[#2E3B2F] text-[#EDE6D3] px-6 py-2 flex items-center justify-between text-[9px] font-sans uppercase tracking-[0.16em]">
                <span>Valiamala, Thiruvananthapuram &bull; Kerala, India</span>
                <span className="text-[#C9A86A]">Archival Registry Entry #2026-IIST</span>
              </div>
            </div>

            {/* Post Submission Action Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                id="receipt-download-btn"
                className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] disabled:opacity-50 px-7 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isDownloading ? (
                  <div className="h-4 w-4 border-2 border-[#1A1F1A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4 text-[#1A1F1A]" />
                )}
                {isDownloading ? "Preparing Document..." : "Download Boarding Pass (PDF)"}
              </button>
              
              <button
                onClick={handleShare}
                id="receipt-share-btn"
                className="flex items-center gap-2 border border-[#C9A86A] bg-[#2E3B2F] hover:bg-[#3d4d3e] px-7 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-[#C9A86A]" />
                Copy Accreditation Details
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleReset}
                id="receipt-reset-btn"
                className="text-[#8A9A7E] hover:text-[#C9A86A] font-sans text-xs uppercase tracking-wider underline underline-offset-4 cursor-pointer transition-colors"
              >
                Register Another Delegate / Team
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Registration Form Panel */
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/40 p-6 sm:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden">
            
            {/* Step Indicators Bar */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#8A9A7E]/20">
              <div className="flex items-center gap-2 sm:gap-4">
                {[
                  { num: 1, label: "Division" },
                  { num: 2, label: "Credentials" },
                  { num: 3, label: "Portfolios" }
                ].map((s) => (
                  <div key={s.num} className="flex items-center">
                    <div className={`flex h-8 w-8 items-center justify-center text-xs font-semibold font-sans transition-all duration-300 ${
                      step === s.num
                        ? "bg-[#C9A86A] text-[#1A1F1A] font-bold"
                        : step > s.num
                        ? "bg-[#1A1F1A] text-[#C9A86A] border border-[#C9A86A]/40"
                        : "bg-[#1A1F1A]/60 text-[#8A9A7E] border border-[#8A9A7E]/20"
                    }`}>
                      {step > s.num ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : s.num}
                    </div>
                    <span className="hidden sm:inline-block ml-2 text-xs font-sans uppercase tracking-wider text-[#EDE6D3]">
                      {s.label}
                    </span>
                    {s.num < 3 && (
                      <div className={`w-6 sm:w-12 h-px mx-2 sm:mx-3 transition-all duration-300 ${
                        step > s.num ? "bg-[#C9A86A]" : "bg-[#8A9A7E]/30"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-right">
                <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#8A9A7E] font-semibold">
                  Section
                </span>
                <span className="font-sans text-xs font-bold text-[#C9A86A]">
                  Step {step} of 3
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1: SELECT CATEGORY */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Select Participation Division
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8A9A7E] mt-1 leading-relaxed">
                      Choose the delegation structure matching your conference participation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Individual */}
                    <div
                      id="card-reg-individual"
                      onClick={() => setFormData({ ...formData, regType: "individual" })}
                      className={`border p-5 sm:p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                        formData.regType === "individual"
                          ? "border-[#C9A86A] bg-[#2E3B2F] shadow-lg"
                          : "border-[#8A9A7E]/30 bg-[#1A1F1A]/80 hover:border-[#C9A86A]/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-2.5 border ${formData.regType === "individual" ? "border-[#C9A86A] text-[#C9A86A] bg-[#1A1F1A]" : "border-[#8A9A7E]/30 text-[#8A9A7E]"}`}>
                            <User className="h-5 w-5" />
                          </div>
                          <div className={`h-4 w-4 border flex items-center justify-center ${formData.regType === "individual" ? "border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A]" : "border-[#8A9A7E]/50"}`}>
                            {formData.regType === "individual" && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="text-[10px] font-sans font-semibold tracking-widest text-[#C9A86A] uppercase mb-1">
                          Solo Delegate
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#EDE6D3]">
                          Individual Delegate
                        </h3>
                        <div className="font-serif text-xl font-normal text-[#EDE6D3] mt-2">
                          ₹999 <span className="text-xs font-sans text-[#8A9A7E]">/ delegate</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-[#8A9A7E] leading-relaxed">
                        Register as an independent delegate in any of the 4 committees.
                      </p>
                    </div>

                    {/* Double Delegation */}
                    <div
                      id="card-reg-double"
                      onClick={() => setFormData({ ...formData, regType: "double" })}
                      className={`border p-5 sm:p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                        formData.regType === "double"
                          ? "border-[#C9A86A] bg-[#2E3B2F] shadow-lg"
                          : "border-[#8A9A7E]/30 bg-[#1A1F1A]/80 hover:border-[#C9A86A]/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-2.5 border ${formData.regType === "double" ? "border-[#C9A86A] text-[#C9A86A] bg-[#1A1F1A]" : "border-[#8A9A7E]/30 text-[#8A9A7E]"}`}>
                            <Users className="h-5 w-5" />
                          </div>
                          <div className={`h-4 w-4 border flex items-center justify-center ${formData.regType === "double" ? "border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A]" : "border-[#8A9A7E]/50"}`}>
                            {formData.regType === "double" && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="text-[10px] font-sans font-semibold tracking-widest text-[#C9A86A] uppercase mb-1">
                          Co-Delegates Pair
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#EDE6D3]">
                          Double Delegation
                        </h3>
                        <div className="font-serif text-xl font-normal text-[#EDE6D3] mt-2">
                          ₹1,699 <span className="text-xs font-sans text-[#8A9A7E]">/ team</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-[#8A9A7E] leading-relaxed">
                        Debate as a coordinated pair in COPUOS or UNGA DISEC councils.
                      </p>
                    </div>

                    {/* Contingent */}
                    <div
                      id="card-reg-contingent"
                      onClick={() => setFormData({ ...formData, regType: "contingent" })}
                      className={`border p-5 sm:p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                        formData.regType === "contingent"
                          ? "border-[#C9A86A] bg-[#2E3B2F] shadow-lg"
                          : "border-[#8A9A7E]/30 bg-[#1A1F1A]/80 hover:border-[#C9A86A]/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-2.5 border ${formData.regType === "contingent" ? "border-[#C9A86A] text-[#C9A86A] bg-[#1A1F1A]" : "border-[#8A9A7E]/30 text-[#8A9A7E]"}`}>
                            <Landmark className="h-5 w-5" />
                          </div>
                          <div className={`h-4 w-4 border flex items-center justify-center ${formData.regType === "contingent" ? "border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A]" : "border-[#8A9A7E]/50"}`}>
                            {formData.regType === "contingent" && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="text-[10px] font-sans font-semibold tracking-widest text-[#C9A86A] uppercase mb-1">
                          Institutional Block
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#EDE6D3]">
                          Institutional Contingent
                        </h3>
                        <div className="font-serif text-xl font-normal text-[#EDE6D3] mt-2">
                          ₹899 <span className="text-xs font-sans text-[#8A9A7E]">/ delegate</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-[#8A9A7E] leading-relaxed">
                        Institutional registrations for delegations with 5+ members.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleNext}
                      id="step1-next-btn"
                      className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] active:scale-95 transition-all cursor-pointer"
                    >
                      Next: Delegate Dossier
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DETAILS */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Contact & Academic Dossier
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8A9A7E] mt-1">
                      Enter your accredited profile credentials and academic institutional affiliation.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                        placeholder="e.g. Aarav Nair"
                      />
                      {errors.name && <p className="text-[10px] text-[#8B5A3C] mt-1 font-semibold">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                        placeholder="name@university.edu"
                      />
                      {errors.email && <p className="text-[10px] text-[#8B5A3C] mt-1 font-semibold">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                        placeholder="+91 XXXXX XXXXX"
                      />
                      {errors.phone && <p className="text-[10px] text-[#8B5A3C] mt-1 font-semibold">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Academic Institution / School / College
                      </label>
                      <InstitutionSelect
                        value={formData.institution}
                        onChange={(val) => setFormData({ ...formData, institution: val })}
                        error={errors.institution}
                        placeholder="Select or type School / College..."
                        id="reg-institution-select"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Course / Major / Class
                      </label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                        placeholder="e.g. B.Tech Aerospace Engineering / Class 12"
                      />
                      {errors.course && <p className="text-[10px] text-[#8B5A3C] mt-1 font-semibold">{errors.course}</p>}
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Previous MUN Experience
                      </label>
                      <select
                        value={formData.munExperience}
                        onChange={(e) => setFormData({ ...formData, munExperience: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] transition-all font-semibold uppercase tracking-wider"
                      >
                        <option value="None" className="bg-[#1A1F1A]">None (First-Time Delegate)</option>
                        <option value="1-2" className="bg-[#1A1F1A]">1–2 Conferences</option>
                        <option value="3-5" className="bg-[#1A1F1A]">3–5 Conferences</option>
                        <option value="5+" className="bg-[#1A1F1A]">5+ Conferences (Veteran)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Role in Council
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as "Delegate" | "Photographer" })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] transition-all font-semibold uppercase tracking-wider"
                      >
                        <option value="Delegate" className="bg-[#1A1F1A]">Delegate</option>
                        <option value="Photographer" className="bg-[#1A1F1A]">International Press (IP)</option>
                      </select>
                    </div>
                  </div>

                  {/* Double Delegation Partner details */}
                  {formData.regType === "double" && (
                    <div className="border border-[#C9A86A]/40 bg-[#2E3B2F]/60 p-5 space-y-4">
                      <span className="font-sans text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                        Double Delegation: Co-Delegate Credentials
                      </span>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Partner Full Name</label>
                          <input
                            type="text"
                            value={formData.partnerName}
                            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                            className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                            placeholder="Co-delegate's full name"
                          />
                          {errors.partnerName && <p className="text-[10px] text-[#8B5A3C] mt-1 font-semibold">{errors.partnerName}</p>}
                        </div>
                        <div>
                          <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Partner Email</label>
                          <input
                            type="email"
                            value={formData.partnerEmail}
                            onChange={(e) => setFormData({ ...formData, partnerEmail: e.target.value })}
                            className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                            placeholder="partner@university.edu"
                          />
                          {errors.partnerEmail && <p className="text-[10px] text-[#8B5A3C] mt-1 font-semibold">{errors.partnerEmail}</p>}
                        </div>
                        <div>
                          <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Partner Role</label>
                          <select
                            value={formData.partnerRole}
                            onChange={(e) => setFormData({ ...formData, partnerRole: e.target.value as "Delegate" | "Photographer" })}
                            className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] transition-all font-semibold uppercase tracking-wider"
                          >
                            <option value="Delegate" className="bg-[#1A1F1A]">Delegate</option>
                            <option value="Photographer" className="bg-[#1A1F1A]">International Press</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contingent size details */}
                  {formData.regType === "contingent" && (
                    <div className="border border-[#C9A86A]/40 bg-[#2E3B2F]/60 p-5 space-y-2">
                      <span className="font-sans text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold block">
                        Contingent Details
                      </span>
                      <div>
                        <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Estimated Delegation Size</label>
                        <select
                           value={formData.contingentSize}
                           onChange={(e) => setFormData({ ...formData, contingentSize: e.target.value })}
                           className="w-full max-w-xs border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-2.5 text-xs text-[#EDE6D3] outline-none font-semibold uppercase tracking-wider"
                        >
                          <option value="5-10" className="bg-[#1A1F1A]">5 to 10 Delegates</option>
                          <option value="11-20" className="bg-[#1A1F1A]">11 to 20 Delegates</option>
                          <option value="20+" className="bg-[#1A1F1A]">20+ Delegates (Large Delegation)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-[#8A9A7E]/20">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-1.5 border border-[#8A9A7E]/40 bg-[#1A1F1A] hover:bg-[#2E3B2F] px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] cursor-pointer transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      id="step2-next-btn"
                      className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] active:scale-95 transition-all cursor-pointer"
                    >
                      Next: Portfolio Preferences
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PREFERENCES & SUBMISSION */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Portfolio Preferences & Motivation
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8A9A7E] mt-1 leading-relaxed">
                      Select up to 3 country portfolios from the live council matrix and submit your statement of motivation.
                    </p>
                  </div>

                  {/* Selected Preferences Summary Cards */}
                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold">
                      Your Selected Priorities (Up to 3 in priority order)
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {/* Preference 1 */}
                      <div className={`p-4 border ${
                        formData.pref1Country 
                          ? "border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3]" 
                          : "border-[#8A9A7E]/30 bg-[#1A1F1A]/60 border-dashed text-[#8A9A7E]"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-sans text-[9px] uppercase tracking-wider text-[#C9A86A] font-semibold mb-1">
                            1st Choice Portfolio
                          </div>
                          {formData.pref1Country ? (
                            <div className="font-serif text-base font-bold leading-relaxed text-[#EDE6D3]">
                              {formData.pref1Country}
                              <div className="text-[10px] text-[#C9A86A] font-sans uppercase font-medium mt-0.5">
                                {COMMITTEES.find(c => c.id === formData.pref1Committee)?.abbreviation || formData.pref1Committee}
                              </div>
                            </div>
                          ) : (
                            <p className="font-sans text-xs text-[#8A9A7E]">Click an available cell below...</p>
                          )}
                        </div>
                        {formData.pref1Country && (
                          <button
                            type="button"
                            onClick={() => handlePortfolioClick(formData.pref1Country, formData.pref1Committee)}
                            className="absolute top-2 right-2 p-1 text-[#8A9A7E] hover:text-[#EDE6D3] transition-all cursor-pointer"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Preference 2 */}
                      <div className={`p-4 border ${
                        formData.pref2Country 
                          ? "border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3]" 
                          : "border-[#8A9A7E]/30 bg-[#1A1F1A]/60 border-dashed text-[#8A9A7E]"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-sans text-[9px] uppercase tracking-wider text-[#C9A86A] font-semibold mb-1">
                            2nd Choice Portfolio
                          </div>
                          {formData.pref2Country ? (
                            <div className="font-serif text-base font-bold leading-relaxed text-[#EDE6D3]">
                              {formData.pref2Country}
                              <div className="text-[10px] text-[#C9A86A] font-sans uppercase font-medium mt-0.5">
                                {COMMITTEES.find(c => c.id === formData.pref2Committee)?.abbreviation || formData.pref2Committee}
                              </div>
                            </div>
                          ) : (
                            <p className="font-sans text-xs text-[#8A9A7E]">Optional 2nd choice...</p>
                          )}
                        </div>
                        {formData.pref2Country && (
                          <button
                            type="button"
                            onClick={() => handlePortfolioClick(formData.pref2Country, formData.pref2Committee)}
                            className="absolute top-2 right-2 p-1 text-[#8A9A7E] hover:text-[#EDE6D3] transition-all cursor-pointer"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Preference 3 */}
                      <div className={`p-4 border ${
                        formData.pref3Country 
                          ? "border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3]" 
                          : "border-[#8A9A7E]/30 bg-[#1A1F1A]/60 border-dashed text-[#8A9A7E]"
                      } transition-all relative flex flex-col justify-between min-h-[90px]`}>
                        <div>
                          <div className="font-sans text-[9px] uppercase tracking-wider text-[#C9A86A] font-semibold mb-1">
                            3rd Choice Portfolio
                          </div>
                          {formData.pref3Country ? (
                            <div className="font-serif text-base font-bold leading-relaxed text-[#EDE6D3]">
                              {formData.pref3Country}
                              <div className="text-[10px] text-[#C9A86A] font-sans uppercase font-medium mt-0.5">
                                {COMMITTEES.find(c => c.id === formData.pref3Committee)?.abbreviation || formData.pref3Committee}
                              </div>
                            </div>
                          ) : (
                            <p className="font-sans text-xs text-[#8A9A7E]">Optional 3rd choice...</p>
                          )}
                        </div>
                        {formData.pref3Country && (
                          <button
                            type="button"
                            onClick={() => handlePortfolioClick(formData.pref3Country, formData.pref3Committee)}
                            className="absolute top-2 right-2 p-1 text-[#8A9A7E] hover:text-[#EDE6D3] transition-all cursor-pointer"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {errors.pref1Country && (
                      <p className="text-[10px] text-[#8B5A3C] mt-1 font-semibold">{errors.pref1Country}</p>
                    )}
                  </div>

                  {/* Interactive Portfolio Matrix Panel */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-lg text-[#EDE6D3] flex items-center gap-1.5 font-bold">
                          <Landmark className="h-4 w-4 text-[#C9A86A]" />
                          Live Available Council Matrix
                        </h3>
                        <p className="font-sans text-xs text-[#8A9A7E]">
                          Click any available country cell to add/remove your preference.
                        </p>
                      </div>

                      {/* Matrix Search */}
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A9A7E]" />
                        <input
                          type="text"
                          placeholder="Search Nation / Entity..."
                          value={matrixSearchTerm}
                          onChange={(e) => setMatrixSearchTerm(e.target.value)}
                          className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] py-2 pl-9 pr-8 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all"
                        />
                        {matrixSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setMatrixSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9A7E] hover:text-[#EDE6D3]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Matrix table container */}
                    <div className="overflow-x-auto border border-[#8A9A7E]/30 bg-[#1A1F1A]/80 shadow-md max-h-[340px] scrollbar-thin">
                      <table className="w-full min-w-[650px] border-collapse text-left font-sans text-xs">
                        <thead>
                          <tr className="sticky top-0 z-10 border-b border-[#8A9A7E]/30 bg-[#2E3B2F] text-[9px] uppercase tracking-wider text-[#C9A86A]">
                            <th className="px-4 py-3 font-semibold bg-[#2E3B2F]">Nation / Entity</th>
                            <th className="px-4 py-3 font-semibold bg-[#2E3B2F] text-center">COPUOS</th>
                            <th className="px-4 py-3 font-semibold bg-[#2E3B2F] text-center">UNGA DISEC</th>
                            <th className="px-4 py-3 font-semibold bg-[#2E3B2F] text-center">AIPPM</th>
                            <th className="px-4 py-3 font-semibold bg-[#2E3B2F] text-center">UNSC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8A9A7E]/15">
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
                                  <td colSpan={5} className="px-4 py-8 text-center text-[#8A9A7E] font-sans text-xs">
                                    No available portfolios found matching "{matrixSearchTerm}"
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((row) => {
                              return (
                                <tr key={row.country} className="hover:bg-[#2E3B2F]/40 transition-colors">
                                  <td className="px-4 py-2.5 font-semibold text-[#EDE6D3]">{row.country}</td>
                                  
                                  {["copuos", "disec", "aippm", "unsc"].map((comm) => {
                                    const status = getPortfolioStatus(row.country, comm);
                                    const selNum = getSelectionNumber(row.country, comm);
                                    const hasReachedMax = getSelectedPreferences().length >= 3;

                                    if (status !== "Available") {
                                      return (
                                        <td key={comm} className="px-4 py-2.5 text-center text-[#8A9A7E]/40 font-mono text-[10px]">
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
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#C9A86A] text-[#1A1F1A] text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
                                          >
                                            {selNum === 1 ? "1st Choice" : selNum === 2 ? "2nd Choice" : "3rd Choice"}
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handlePortfolioClick(row.country, comm)}
                                            disabled={hasReachedMax}
                                            className={`inline-flex items-center gap-1 px-3 py-1 border border-[#C9A86A]/40 bg-[#2E3B2F] hover:bg-[#3d4d3e] text-[#C9A86A] text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                                              hasReachedMax ? "opacity-30 cursor-not-allowed border-[#8A9A7E]/20 text-[#8A9A7E]" : ""
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
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                      Statement of Motivation & Diplomatic Interest (Minimum 20 characters)
                    </label>
                    <textarea
                      rows={4}
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] resize-none leading-relaxed font-medium transition-all"
                      placeholder="Outline your background, interest in multilateral diplomacy, environmental sustainability, space security, or legislative debate..."
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.motivation ? (
                        <p className="text-[10px] text-[#8B5A3C] font-semibold">{errors.motivation}</p>
                      ) : (
                        <span />
                      )}
                      <span className={`text-[10px] font-sans ${formData.motivation.length >= 20 ? "text-[#C9A86A]" : "text-[#8A9A7E]"}`}>
                        {formData.motivation.length} / 20 min chars
                      </span>
                    </div>
                  </div>

                  {/* Secretariat notice */}
                  <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/40 p-4 flex gap-3 items-start">
                    <ShieldCheck className="h-5 w-5 text-[#C9A86A] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#EDE6D3] leading-relaxed">
                      <span className="font-bold text-[#C9A86A]">Secretariat Review:</span> Country portfolio allotment follows early-bird queue precedence. Submitting this accreditation dossier reserves your position for EB allotment.
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-[#8A9A7E]/20">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-1.5 border border-[#8A9A7E]/40 bg-[#1A1F1A] hover:bg-[#2E3B2F] px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] cursor-pointer transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      id="step3-submit-btn"
                      className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      Submit Accreditation & Claim Pass
                      <FileText className="h-4 w-4" />
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
