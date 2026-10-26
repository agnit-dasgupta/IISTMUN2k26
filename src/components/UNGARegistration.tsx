/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { COMMITTEES, COUNTRY_MATRIX } from "../data";
import { RegistrationDetails } from "../types";
import {
  User, Globe, ChevronRight, ChevronLeft,
  Download, Share2, Check,
  ShieldCheck, CheckCircle2, QrCode, Copy,
  CreditCard, Sparkles, Building2,
  ArrowLeft, Clock,
  Shirt, ShoppingBag, X, Laptop, Ruler
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { InstitutionSelect } from "./InstitutionSelect";
import FileUploadZone from "./FileUploadZone";
import QRCodeDisplay from "./QRCodeDisplay";
import { downloadBoardingPassPDF } from "../utils/pdfGenerator";
import { isIISTInstitution, MERCH_SIZES } from "./Registration";

// UNGA Committee metadata
export const UNGA_COMMITTEE_INFO = {
  id: "unga",
  name: "United Nations General Assembly (Online Committee)",
  abbreviation: "UNGA (Online)",
  description: "The premier deliberative organ of the United Nations conducted entirely online, convening delegates worldwide for sovereign equality debate, global consensus-building, and digital diplomatic multilateralism.",
  logo: "Globe",
  color: "gold",
  guideUrl: "#"
};

// Available Sovereign Member States for UNGA from COUNTRY_MATRIX
export const UNGA_MEMBER_STATES: string[] = COUNTRY_MATRIX
  .filter(r => r.unga && r.unga !== "N/A" && r.unga !== "Reserved")
  .map(r => r.country);

interface UNGARegistrationProps {
  initialPreference?: { country?: string; committee?: string } | null;
  clearInitialPreference?: () => void;
  setActiveTab?: (tab: string) => void;
  embedded?: boolean;
}

export default function UNGARegistration({
  initialPreference,
  clearInitialPreference,
  setActiveTab,
  embedded = false
}: UNGARegistrationProps) {
  const { user, loading: authLoading, signInWithGoogle, isSigningIn } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Round & Committee Metadata
    round: "online" as const,
    isPriority: false,
    isUnga: true,
    regType: "individual" as const,
    delegationMode: "individual" as const,
    delegateCategory: "college" as const,
    isPrivateDelegation: false,

    // Stage 1: Personal
    name: "",
    email: "",
    phone: "",
    aadharNumber: "",
    gender: "Prefer not to say",
    dob: "",
    cityState: "",
    fullAddress: "",
    emergencyContactName: "",
    emergencyContactRelation: "Parent",
    emergencyContactPhone: "",

    // Stage 2: Academic
    institution: "",
    course: "",
    yearOfStudy: "1st Year",
    classGrade: "Class 11",
    rollNumber: "",
    role: "Delegate" as const,
    idCardUrl: "",
    idCardName: "",
    campusAmbassadorCode: "",

    // Delegation partner details (UNGA is strictly Individual Delegation only)
    partnerName: "",
    partnerEmail: "",
    partnerPhone: "",
    partnerInstitution: "",
    partnerRole: "Delegate" as const,
    contingentSize: "1",

    // Stage 3: Experience & UNGA Preferences
    munExperience: "None",
    pastMunDetails: "",
    pref1Committee: "unga",
    pref1Country: "",
    pref1Portfolios: ["", "", "", "", ""],
    priorityPreference: "portfolio" as const,
    motivation: "",

    // Logistics (Online Committee)
    accommodationRequired: "no" as const,

    // Stage 4: Payment & Transaction
    feeAmount: 899,
    paymentMode: "UPI",
    transactionId: "",
    utrNumber: "",
    payerName: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentScreenshotUrl: "",
    paymentScreenshotName: "",
    agreedToTerms: false,

    // Merchandise Selection
    hasMerch: false,
    merchSize: "M"
  });

  // Merchandise Modal States
  const [showMerchModal, setShowMerchModal] = useState(false);
  const [merchViewTab, setMerchViewTab] = useState<"front" | "back" | "size_chart">("front");
  const [selectedMerchSize, setSelectedMerchSize] = useState<string>("M");
  const [merchSizeError, setMerchSizeError] = useState("");

  const [submittedPass, setSubmittedPass] = useState<RegistrationDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const boardingPassRef = useRef<HTMLDivElement>(null);

  // UNGA fee calculation: flat ₹899 base fee for all delegates; optional merchandise is ₹599 extra (only available for non-IIST delegates)
  const calculateTotalFee = (): number => {
    const isIIST = isIISTInstitution(formData.institution);
    const merchExtra = (!isIIST && formData.hasMerch) ? 599 : 0;
    return 899 + merchExtra;
  };

  const calculatedFee = calculateTotalFee();

  // Auto-fill selected country portfolio if navigated with initial preference
  useEffect(() => {
    if (initialPreference) {
      if (initialPreference.country) {
        setFormData(prev => {
          const nextPorts = [...prev.pref1Portfolios];
          nextPorts[0] = initialPreference.country || "";
          return {
            ...prev,
            pref1Country: initialPreference.country || prev.pref1Country,
            pref1Portfolios: nextPorts
          };
        });
      }

      setStep(3); // Jump directly to preferences step if initiated from matrix link
      if (clearInitialPreference) {
        clearInitialPreference();
      }
    }
  }, [initialPreference, clearInitialPreference]);

  // Auto-fill user profile fields on successful login
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

  // Real-time listener for user's UNGA registration document
  useEffect(() => {
    if (!user) {
      try {
        const cached = localStorage.getItem("iistmun_last_unga_pass");
        if (cached) {
          setSubmittedPass(JSON.parse(cached));
        }
      } catch { }
      return;
    }

    setLoading(true);
    const docRef = doc(db, "unga_registrations", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RegistrationDetails;
        setSubmittedPass(data);
        setLoading(false);
      } else {
        // Fallback: Check if registration exists under main registrations collection
        getDoc(doc(db, "registrations", `${user.uid}_unga`)).then((ungaDocSnap) => {
          if (ungaDocSnap.exists()) {
            const data = ungaDocSnap.data() as RegistrationDetails;
            setSubmittedPass(data);
            setLoading(false);
            return;
          }
          return getDoc(doc(db, "registrations", user.uid)).then((legacySnap) => {
            if (legacySnap.exists()) {
              const data = legacySnap.data() as RegistrationDetails;
              if (data.pref1Committee === "unga" || data.round === "online" || (data.id && data.id.startsWith("UNGA"))) {
                setSubmittedPass(data);
              } else {
                setSubmittedPass(null);
              }
              setLoading(false);
            } else {
              // Check server fallback
              fetch("/api/registrations")
                .then(res => res.json())
                .then(res => {
                  const match = res.data?.find((r: any) =>
                    (r.userId === user.uid || (r.email && r.email.toLowerCase() === user.email?.toLowerCase())) &&
                    (r.pref1Committee === "unga" || r.round === "online" || (r.id && r.id.startsWith("UNGA")))
                  );
                  if (match) {
                    setSubmittedPass(match);
                  } else {
                    setSubmittedPass(null);
                  }
                  setLoading(false);
                })
                .catch(() => {
                  setSubmittedPass(null);
                  setLoading(false);
                });
            }
          });
        }).catch(() => {
          setSubmittedPass(null);
          setLoading(false);
        });
      }
    }, (error) => {
      console.warn("UNGA registration snapshot warning:", error);
      fetch("/api/registrations")
        .then(res => res.json())
        .then(res => {
          const match = res.data?.find((r: any) =>
            (r.userId === user.uid || (r.email && r.email.toLowerCase() === user.email?.toLowerCase())) &&
            (r.pref1Committee === "unga" || r.round === "online" || (r.id && r.id.startsWith("UNGA")))
          );
          if (match) {
            setSubmittedPass(match);
          } else {
            setSubmittedPass(null);
          }
          setLoading(false);
        })
        .catch(() => {
          setSubmittedPass(null);
          setLoading(false);
        });
    });

    return () => unsubscribe();
  }, [user]);

  // Validation routines per step
  const validateStep = (s: number): boolean => {
    const err: Record<string, string> = {};

    if (s === 1) {
      if (!formData.name.trim()) err.name = "Full name is required.";
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) err.email = "Valid email address is required.";
      if (!formData.phone.trim() || formData.phone.length < 10) err.phone = "Valid 10-digit phone number is required.";
      const rawUngaId = formData.aadharNumber.replace(/\s+/g, "").toUpperCase();
      if (!rawUngaId) {
        err.aadharNumber = "Aadhaar or Passport number is required.";
      } else if (/^\d+$/.test(rawUngaId)) {
        if (rawUngaId.length !== 12 && (rawUngaId.length < 8 || rawUngaId.length > 9)) {
          err.aadharNumber = "Please enter a valid 12-digit Aadhaar number or Passport number.";
        }
      } else if (!/^[A-Z0-9]{6,15}$/.test(rawUngaId)) {
        err.aadharNumber = "Please enter a valid 12-digit Aadhaar number or Passport number (6-15 alphanumeric characters).";
      }
      if (!formData.dob) err.dob = "Date of birth is required.";
      if (!formData.cityState.trim()) err.cityState = "City and state are required.";
      if (!formData.fullAddress.trim() || formData.fullAddress.length < 8) {
        err.fullAddress = "Full residential / postal address is required.";
      }
      if (!formData.emergencyContactName.trim()) err.emergencyContactName = "Emergency contact name is required.";
      if (!formData.emergencyContactPhone.trim() || formData.emergencyContactPhone.length < 10) {
        err.emergencyContactPhone = "Valid 10-digit emergency phone number is required.";
      }
    }

    if (s === 2) {
      if (!formData.institution.trim()) err.institution = "Institution name is required.";
      if (!formData.course.trim()) err.course = "Course / Degree is required.";
      if (!formData.rollNumber.trim()) err.rollNumber = "Student roll number is required.";

      // ID Card photo upload validation
      if (!formData.idCardUrl) {
        err.idCardUrl = "Please upload a photo or scan of your School / College ID card for verification.";
      }
    }

    if (s === 3) {
      const p1Filled = formData.pref1Portfolios.filter(p => Boolean(p && p.trim()));
      if (p1Filled.length === 0 && !formData.pref1Country.trim()) {
        err.pref1Portfolios = "Please enter your primary Country choice for UNGA.";
      }
      if (!formData.motivation.trim() || formData.motivation.length < 20) {
        err.motivation = "Please provide your statement of motivation (minimum 20 characters).";
      }
    }

    if (s === 4) {
      if (!formData.agreedToTerms) {
        err.agreedToTerms = "You must acknowledge and accept the conference guidelines and online simulation chamber protocols.";
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 3) {
        // Conditional merchandise pop-up ONLY for non-IIST delegates before step 4
        if (isIISTInstitution(formData.institution)) {
          setStep(4);
          window.scrollTo({ top: 120, behavior: "smooth" });
        } else {
          setShowMerchModal(true);
        }
        return;
      }
      setStep(prev => prev + 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleConfirmMerch = () => {
    if (!selectedMerchSize) {
      setMerchSizeError("Please select a size to proceed.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      hasMerch: true,
      merchSize: selectedMerchSize
    }));
    setShowMerchModal(false);
    setMerchSizeError("");
    setStep(4);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSkipMerch = () => {
    setFormData(prev => ({
      ...prev,
      hasMerch: false
    }));
    setShowMerchModal(false);
    setMerchSizeError("");
    setStep(4);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setLoading(true);

    try {
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const primaryTicketId = `UNGA-D${random4}`;

      const timestamp = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      const utr = (formData.utrNumber || formData.transactionId).trim();
      const primaryDocId = user?.uid || primaryTicketId;

      const newRegistration: RegistrationDetails = {
        id: primaryTicketId,
        uid: primaryDocId,
        userId: user?.uid || primaryTicketId,
        timestamp,
        round: "online",
        isPriority: false,
        isUnga: true,
        regType: "individual",
        delegationMode: "individual",
        isPrivateDelegation: false,
        delegateCategory: "college",
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        aadharNumber: formData.aadharNumber.trim(),
        gender: formData.gender,
        dob: formData.dob,
        cityState: formData.cityState.trim(),
        fullAddress: formData.fullAddress.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactRelation: formData.emergencyContactRelation,
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        institution: formData.institution.trim(),
        course: formData.course.trim(),
        yearOfStudy: formData.yearOfStudy,
        rollNumber: formData.rollNumber.trim(),
        role: "Delegate",
        partnerName: "",
        partnerEmail: "",
        partnerPhone: "",
        partnerInstitution: "",
        partnerRole: "Delegate",
        contingentSize: "1",
        munExperience: formData.munExperience,
        pastMunDetails: formData.pastMunDetails?.trim() || "",
        pref1Committee: "unga",
        pref1Country: formData.pref1Portfolios.filter(Boolean).join(", ") || formData.pref1Country.trim(),
        pref1Portfolios: formData.pref1Portfolios.map(p => p.trim()),
        pref2Committee: "unga",
        pref2Country: "",
        pref2Portfolios: [],
        pref3Committee: "unga",
        pref3Country: "",
        pref3Portfolios: [],
        priorityPreference: "portfolio",
        motivation: formData.motivation.trim(),
        accommodationRequired: "no",
        feeAmount: calculatedFee,
        campusAmbassadorCode: formData.campusAmbassadorCode?.trim() || "",
        idCardUrl: formData.idCardUrl || "",
        idCardName: formData.idCardName || "",
        hasMerch: !isIISTInstitution(formData.institution) && formData.hasMerch,
        merchSize: (!isIISTInstitution(formData.institution) && formData.hasMerch) ? (formData.merchSize || "M") : "",
        merchAmount: (!isIISTInstitution(formData.institution) && formData.hasMerch) ? 599 : 0,
        paymentMode: formData.paymentMode,
        transactionId: utr,
        utrNumber: utr,
        payerName: formData.payerName.trim(),
        paymentDate: formData.paymentDate,
        paymentScreenshotUrl: formData.paymentScreenshotUrl || "",
        paymentScreenshotName: formData.paymentScreenshotName || "",
        paymentStatus: "Pending",
        status: "Pending Verification"
      };

      // Strip any undefined keys so Firestore SDK never throws Unsupported field value: undefined
      const cleanRegistration: Record<string, any> = {};
      for (const [key, val] of Object.entries(newRegistration)) {
        if (val !== undefined) {
          cleanRegistration[key] = val;
        }
      }

      // 1. Write to local server backup endpoint (feeds local server backup if available)
      try {
        await fetch("/api/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanRegistration)
        });
      } catch (backupErr) {
        console.warn("Local server backup note:", backupErr);
      }

      // 2. Persist in Firestore 'unga_registrations' (dedicated UNGA collection with unique ticket ID)
      let ungaFirestoreSuccess = false;
      try {
        await setDoc(doc(db, "unga_registrations", primaryTicketId), cleanRegistration);
        ungaFirestoreSuccess = true;
        console.log("[FIREBASE SUCCESS] UNGA registration uploaded to unga_registrations:", primaryTicketId);
      } catch (ungaErr) {
        console.error("Firestore 'unga_registrations' ticketId write status:", ungaErr);
        if (user?.uid) {
          try {
            await setDoc(doc(db, "unga_registrations", user.uid), cleanRegistration);
            ungaFirestoreSuccess = true;
          } catch (fallbackErr) {
            console.error("Firestore 'unga_registrations' uid write status:", fallbackErr);
          }
        }
      }

      // 3. Persist in Firestore 'registrations' (the primary conference registry)
      try {
        await setDoc(doc(db, "registrations", primaryTicketId), cleanRegistration);
        console.log("[FIREBASE SUCCESS] UNGA registration uploaded to registrations:", primaryTicketId);
      } catch (regErr) {
        console.warn("Firestore 'registrations' ticketId write status:", regErr);
        if (user?.uid) {
          try {
            await setDoc(doc(db, "registrations", `${user.uid}_unga`), cleanRegistration);
          } catch (e3) {
            console.warn("Firestore 'registrations' uid write status:", e3);
          }
        }
      }

      // 4. Cache locally in localStorage for persistent session
      try {
        localStorage.setItem("iistmun_last_unga_pass", JSON.stringify(cleanRegistration));
      } catch { }

      setSubmittedPass(cleanRegistration as RegistrationDetails);
      window.scrollTo({ top: 80, behavior: "smooth" });
    } catch (err) {
      console.error("UNGA submission failed:", err);
      alert("Submission encountered an issue. Please check your internet connection or contact the secretariat.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("arnav.tpj@oksbi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleCopyTicket = () => {
    if (!submittedPass) return;
    navigator.clipboard.writeText(submittedPass.id);
    setCopiedTicketId(true);
    setTimeout(() => setCopiedTicketId(false), 2500);
  };

  const handleSharePass = () => {
    if (!submittedPass) return;
    const shareText = `IIST MUN 2027 UNGA (Online Committee) Registration Confirmed! Council: United Nations General Assembly (Online). Accreditation ID: ${submittedPass.id}.`;
    navigator.clipboard.writeText(shareText);
    alert("Accreditation summary copied to clipboard!");
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
          courseOrGrade: submittedPass.course,
          chamber: "UNGA (Online Committee)",
          preferredCountry: submittedPass.pref1Country,
          email: submittedPass.email,
          phone: submittedPass.phone,
          timestamp: submittedPass.timestamp
        }
      });
    } catch (err) {
      console.error("Failed to generate PDF boarding pass:", err);
      alert("Could not generate PDF boarding pass. Please take a screenshot of your confirmed pass.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResetRegistration = async () => {
    if (confirm("Are you sure you wish to start a new UNGA online registration? This will clear your current local session.")) {
      try {
        localStorage.removeItem("iistmun_last_unga_pass");
      } catch { }
      if (user) {
        try {
          await deleteDoc(doc(db, "unga_registrations", user.uid));
        } catch { }
      }
      if (submittedPass?.id) {
        try {
          await deleteDoc(doc(db, "unga_registrations", submittedPass.id));
        } catch { }
      }
      setSubmittedPass(null);
      setStep(1);
      setErrors({});
    }
  };

  const stepLabels = [
    { num: 1, title: "Candidate", icon: User },
    { num: 2, title: "Academic", icon: Building2 },
    { num: 3, title: "UNGA Matrix", icon: Globe },
    { num: 4, title: "Payment", icon: CreditCard }
  ];

  return (
    <div className={embedded ? "relative text-[#EDE6D3] text-left pt-2 pb-8" : "bg-[#1A1F1A] text-[#EDE6D3] min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden paper-grain font-sans selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]"}>

      {/* Ambient background glow consistent with other forms */}
      {!embedded && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,106,0.15), transparent 70%),
              radial-gradient(ellipse 50% 50% at 90% 60%, rgba(46,59,47,0.4), transparent 70%)
            `
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-4xl"
      >
        {/* Navigation back breadcrumb */}
        {!embedded && setActiveTab && (
          <button
            onClick={() => {
              setActiveTab("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.16em] text-[#8A9A7E] hover:text-[#C9A86A] transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Return to Convocation Home
          </button>
        )}

        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#C9A86A]/40 bg-[#2E3B2F]/40 text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-[#C9A86A] mb-3 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#C9A86A]" />
            <span>ONLINE COMMITTEE REGISTRATION &bull; IIST MUN 2027</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-wide text-[#EDE6D3]">
            UNGA (Online Committee)
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-[#8A9A7E] max-w-xl mx-auto leading-relaxed">
            Official registration portal for the United Nations General Assembly conducted entirely online. Deliberate globally from anywhere with accredited delegates worldwide.
          </p>

          {/* Online Perks Bar */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto text-[10px] font-mono uppercase tracking-wider text-[#C9A86A]">
            <span className="px-2.5 py-1 bg-[#2E3B2F]/60 border border-[#C9A86A]/30 flex items-center gap-1.5">
              <Laptop className="h-3 w-3 text-[#C9A86A]" />
              100% Online Simulation Chamber
            </span>
            <span className="px-2.5 py-1 bg-[#2E3B2F]/60 border border-[#C9A86A]/30">
              Dates: 16th & 17th Jan 2027
            </span>
            <span className="px-2.5 py-1 bg-[#2E3B2F]/60 border border-[#C9A86A]/30">
              Registration Fee: ₹899
            </span>
          </div>
        </div>

        {authLoading ? (
          <div className="text-center py-24 border border-[#C9A86A]/20 bg-[#2E3B2F]/40 backdrop-blur-md">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A86A] border-t-transparent mx-auto" />
            <p className="font-sans text-[#C9A86A] text-xs mt-4 font-semibold tracking-widest uppercase">
              Verifying Accreditation Session...
            </p>
          </div>
        ) : submittedPass ? (
          /* ======================================================== */
          /* CONFIRMED BOARDING PASS & ACCREDITATION STUB             */
          /* ======================================================== */
          <div className="space-y-8 animate-fade-in text-left" id="unga-boarding-pass-display">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#C9A86A] text-[#C9A86A] mb-3 bg-[#2E3B2F]/70 shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#EDE6D3]">
                UNGA Registration Confirmed
              </h2>
              <p className="text-xs sm:text-sm text-[#8A9A7E] mt-2 max-w-xl mx-auto leading-relaxed">
                Your online accreditation dossier is logged with the Executive Secretariat for <span className="text-[#C9A86A] font-mono font-bold">{submittedPass.email}</span>. Meeting access credentials and background briefs will be dispatched via email.
              </p>
            </div>

            {/* Verification Status Pill */}
            <div className="flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Status: {submittedPass.status || "Pending Verification"}
              </span>
              {submittedPass.utrNumber && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2E3B2F] border border-[#C9A86A]/40 text-[#C9A86A] text-xs font-mono">
                  UTR: {submittedPass.utrNumber}
                </span>
              )}
            </div>

            {/* Diplomatic Boarding Pass Artifact */}
            <div
              ref={boardingPassRef}
              id="unga-boarding-pass-artifact"
              className="border-2 border-[#C9A86A]/80 bg-[#1A1F1A] p-6 sm:p-8 relative overflow-hidden shadow-2xl space-y-6"
            >
              {/* Header inside ticket */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-[#C9A86A]/30 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full border border-[#C9A86A]/60 bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A]">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C9A86A] block">
                      OFFICIAL VIRTUAL BOARDING PASS &bull; IIST MUN 2027
                    </span>
                    <h3 className="font-serif text-2xl text-[#EDE6D3]">
                      United Nations General Assembly (Online)
                    </h3>
                  </div>
                </div>

                <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 px-4 py-2 text-right self-stretch sm:self-auto flex sm:block justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8A9A7E] block">
                    ACCREDITATION ID
                  </span>
                  <span className="font-mono text-lg font-bold text-[#C9A86A]">
                    {submittedPass.id}
                  </span>
                </div>
              </div>

              {/* Delegate Particulars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="p-3 bg-[#2E3B2F]/40 border border-[#8A9A7E]/20">
                  <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Delegate Name</span>
                  <span className="text-[#EDE6D3] font-medium text-sm block mt-0.5">{submittedPass.name}</span>
                  <span className="text-[#8A9A7E] text-[11px]">{submittedPass.phone}</span>
                </div>
                <div className="p-3 bg-[#2E3B2F]/40 border border-[#8A9A7E]/20">
                  <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Institution</span>
                  <span className="text-[#EDE6D3] font-medium text-sm block mt-0.5">{submittedPass.institution}</span>
                  <span className="text-[#8A9A7E] text-[11px]">{submittedPass.course}</span>
                </div>
                <div className="p-3 bg-[#2E3B2F]/40 border border-[#8A9A7E]/20">
                  <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Committee Chamber</span>
                  <span className="text-[#C9A86A] font-medium text-sm block mt-0.5">UNGA (Online Committee)</span>
                  <span className="text-[#8A9A7E] text-[11px]">Virtual Deliberation Chamber</span>
                </div>
                <div className="p-3 bg-[#2E3B2F]/40 border border-[#8A9A7E]/20">
                  <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Primary Country Choice</span>
                  <span className="text-[#EDE6D3] font-medium text-sm block mt-0.5">
                    {submittedPass.pref1Portfolios?.[0] || submittedPass.pref1Country || "Assigned by Presidium"}
                  </span>
                  <span className="text-[#8A9A7E] text-[11px]">Ranked Portfolio Choice #1</span>
                </div>
                <div className="p-3 bg-[#2E3B2F]/40 border border-[#8A9A7E]/20">
                  <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Fee Assessed &amp; Status</span>
                  <span className="text-emerald-400 font-medium text-sm block mt-0.5">
                    ₹{submittedPass.feeAmount ?? 899} ({submittedPass.paymentStatus || "Pending Verification"})
                  </span>
                  <span className="text-[#8A9A7E] text-[11px]">
                    {submittedPass.hasMerch ? `Includes Official Merch (${submittedPass.merchSize})` : "Standard Virtual Pass"}
                  </span>
                </div>
                <div className="p-3 bg-[#2E3B2F]/40 border border-[#8A9A7E]/20">
                  <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Delegation Format</span>
                  <span className="text-[#EDE6D3] font-medium text-sm block mt-0.5">
                    Individual Delegate
                  </span>
                  <span className="text-[#8A9A7E] text-[11px]">
                    100% Online Committee
                  </span>
                </div>
              </div>

              {/* QR verification stub inside pass */}
              <div className="p-4 bg-[#2E3B2F]/40 border border-[#C9A86A]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <QRCodeDisplay
                    uniqueId={submittedPass.id}
                    candidateName={submittedPass.name}
                    title="IIST MUN 2027 UNGA Online"
                    size={70}
                    showScannerTest={false}
                  />
                  <div className="text-xs">
                    <span className="font-mono text-[#C9A86A] font-semibold block uppercase">
                      VIRTUAL DIPLOMATIC ACCREDITATION PASS
                    </span>
                    <p className="text-[#8A9A7E] text-[11px] leading-relaxed mt-0.5">
                      Present this accreditation ID or QR pass during session roll calls and procedural votes on the virtual platform.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyTicket()}
                    className="px-3 py-1.5 border border-[#C9A86A]/40 text-[#EDE6D3] text-xs font-sans uppercase hover:bg-[#2E3B2F] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedTicketId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedTicketId ? "Copied" : "Copy ID"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#8A9A7E]/20">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadReceipt}
                  disabled={isDownloading}
                  className="px-5 py-2.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] font-sans text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>{isDownloading ? "Generating PDF..." : "Download Boarding Pass (PDF)"}</span>
                </button>
                <button
                  onClick={handleSharePass}
                  className="px-4 py-2.5 border border-[#8A9A7E]/40 hover:border-[#C9A86A] text-[#EDE6D3] text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share Pass</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetRegistration}
                  className="px-4 py-2 border border-rose-500/40 text-rose-300 hover:bg-rose-950/30 text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Register Another Online Delegate
                </button>
                {setActiveTab && (
                  <button
                    onClick={() => {
                      setActiveTab("home");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-2 border border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A] text-xs uppercase tracking-wider font-semibold hover:bg-[#EDE6D3] transition-colors cursor-pointer"
                  >
                    Return to Home
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MULTI-STAGE UNGA REGISTRATION FORM                      */
          /* ======================================================== */
          <div className="space-y-8">

            {/* Stepper Progress Bar */}
            <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/40 p-3 sm:p-4 backdrop-blur-md">
              <div className="grid grid-cols-4 gap-2">
                {stepLabels.map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <div
                      key={s.num}
                      className={`flex items-center gap-2 p-2 border transition-all text-left ${isActive
                        ? "border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3] shadow-md"
                        : isDone
                          ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                          : "border-[#8A9A7E]/20 bg-[#1A1F1A]/60 text-[#8A9A7E]"
                        }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-none flex items-center justify-center text-xs font-mono font-bold shrink-0 ${isActive
                          ? "bg-[#C9A86A] text-[#1A1F1A]"
                          : isDone
                            ? "bg-emerald-500 text-[#1A1F1A]"
                            : "bg-[#2E3B2F] text-[#8A9A7E]"
                          }`}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" /> : s.num}
                      </div>
                      <div className="hidden sm:block min-w-0">
                        <span className="block text-[9px] uppercase tracking-widest font-mono text-[#8A9A7E]">
                          Stage 0{s.num}
                        </span>
                        <span className="font-sans text-xs font-medium truncate block">
                          {s.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Google Authentication Status Card */}
            {!user && (
              <div className="border border-[#C9A86A]/40 bg-[#2E3B2F]/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border border-[#C9A86A]/60 bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm sm:text-base text-[#EDE6D3] font-medium">
                      Express Authentication via Google
                    </h4>
                    <p className="text-xs text-[#8A9A7E] mt-0.5 leading-relaxed">
                      Sign in to auto-fill identity details, save your dossier in real-time, and retain your virtual boarding pass.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={isSigningIn}
                  className="px-4 py-2 border border-[#C9A86A] bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] text-xs font-sans uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer shadow-md flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{isSigningIn ? "Connecting..." : "Sign in with Google"}</span>
                </button>
              </div>
            )}

            {/* STAGE 1: PERSONAL CREDENTIALS */}
            {step === 1 && (
              <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/95 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#C9A86A]/20 pb-4">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                      STAGE 01 OF 04 &bull; DELEGATE IDENTITY
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Personal Credentials &amp; Verification
                    </h2>
                  </div>
                  <div className="h-10 w-10 border border-[#C9A86A]/40 bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                    <User className="h-5 w-5" />
                  </div>
                </div>

                {/* Delegation Format: Individual Delegation Only */}
                <div className="flex items-center gap-3 p-3.5 bg-[#2E3B2F]/40 border border-[#C9A86A]/30 text-xs">
                  <div className="h-8 w-8 rounded-none border border-[#C9A86A]/40 bg-[#1A1F1A] flex items-center justify-center text-[#C9A86A] shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold block">
                      DELEGATION FORMAT: INDIVIDUAL DELEGATION
                    </span>
                    <p className="text-[#8A9A7E] text-[11px] mt-0.5 leading-relaxed">
                      UNGA (Online Committee) registrations are strictly individual delegations. Double delegation and college delegation options are not available for this committee.
                    </p>
                  </div>
                </div>

                {/* Personal particulars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      Full Legal Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Siddharth Nair"
                      className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                    />
                    {errors.name && <span className="text-rose-400 text-[11px]">{errors.name}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="siddharth@example.com"
                      className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                    />
                    {errors.email && <span className="text-rose-400 text-[11px]">{errors.email}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      WhatsApp Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                    />
                    {errors.phone && <span className="text-rose-400 text-[11px]">{errors.phone}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      Aadhaar or Passport Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.aadharNumber}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        const clean = val.replace(/[^A-Z0-9 ]/g, "");
                        const noSpace = clean.replace(/\s+/g, "");
                        if (/^\d+$/.test(noSpace)) {
                          const digits = noSpace.slice(0, 12);
                          const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                          setFormData({ ...formData, aadharNumber: formatted });
                        } else {
                          setFormData({ ...formData, aadharNumber: noSpace.slice(0, 15) });
                        }
                      }}
                      placeholder="XXXX XXXX XXXX or Passport No."
                      className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none font-mono"
                    />
                    {errors.aadharNumber && <span className="text-rose-400 text-[11px]">{errors.aadharNumber}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      Date of Birth <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                    />
                    {errors.dob && <span className="text-rose-400 text-[11px]">{errors.dob}</span>}
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      Current City &amp; State / Country <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cityState}
                      onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                      placeholder="e.g. New Delhi, Delhi / London, United Kingdom"
                      className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                    />
                    {errors.cityState && <span className="text-rose-400 text-[11px]">{errors.cityState}</span>}
                  </div>

                  {/* Input for Full Postal / Residential Address */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      Full Residential / Postal Address <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.fullAddress}
                      onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                      placeholder="Door / Flat No., Building / House Name, Street, Area / Landmark, City, State & PIN Code"
                      className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 p-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:border-[#C9A86A] focus:outline-none leading-relaxed"
                    />
                    {errors.fullAddress && <span className="text-rose-400 text-[11px] block">{errors.fullAddress}</span>}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="pt-4 border-t border-[#8A9A7E]/20 space-y-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] block">
                    EMERGENCY CONTACT REFERENCE
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-sans text-[11px] uppercase tracking-wider text-[#EDE6D3] block">
                        Contact Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        placeholder="Parent / Guardian Name"
                        className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3 py-2 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                      {errors.emergencyContactName && <span className="text-rose-400 text-[10px]">{errors.emergencyContactName}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-sans text-[11px] uppercase tracking-wider text-[#EDE6D3] block">
                        Relation
                      </label>
                      <select
                        value={formData.emergencyContactRelation}
                        onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                        className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 px-3 py-2 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      >
                        <option value="Parent">Parent</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Faculty Advisor">Faculty Advisor</option>
                        <option value="Sibling">Sibling</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-sans text-[11px] uppercase tracking-wider text-[#EDE6D3] block">
                        Emergency Phone <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3 py-2 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                      {errors.emergencyContactPhone && <span className="text-rose-400 text-[10px]">{errors.emergencyContactPhone}</span>}
                    </div>
                  </div>
                </div>

                {/* Next button */}
                <div className="flex justify-end pt-4 border-t border-[#8A9A7E]/20">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] font-sans text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <span>Proceed to Academic Dossier</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: ACADEMIC CREDENTIALS & ID CARD */}
            {step === 2 && (
              <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/95 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#C9A86A]/20 pb-4">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                      STAGE 02 OF 04 &bull; INSTITUTIONAL VERIFICATION
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Academic Institution &amp; ID Proof
                    </h2>
                  </div>
                  <div className="h-10 w-10 border border-[#C9A86A]/40 bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      College / University / School Name <span className="text-rose-400">*</span>
                    </label>
                    <InstitutionSelect
                      value={formData.institution}
                      onChange={(val) => {
                        setFormData({ ...formData, institution: val });
                        if (errors.institution) setErrors({ ...errors, institution: "" });
                      }}
                      error={errors.institution}
                      placeholder="Type or select your academic institution..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                        Course / Degree <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        placeholder="e.g. B.Tech Aerospace / B.A. Pol Sci"
                        className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                      {errors.course && <span className="text-rose-400 text-[11px]">{errors.course}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                        Year of Study
                      </label>
                      <select
                        value={formData.yearOfStudy}
                        onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                        className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      >
                        <option value="1st Year">1st Year (UG)</option>
                        <option value="2nd Year">2nd Year (UG)</option>
                        <option value="3rd Year">3rd Year (UG)</option>
                        <option value="4th Year">4th Year (UG)</option>
                        <option value="Postgraduate">Postgraduate (PG)</option>
                        <option value="School Student">School Student</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                        Student Roll / Reg No. <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        placeholder="e.g. 23BTECH042"
                        className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                      {errors.rollNumber && <span className="text-rose-400 text-[11px]">{errors.rollNumber}</span>}
                    </div>
                  </div>

                  {/* College ID Card Upload */}
                  <div className="pt-2">
                    <FileUploadZone
                      label="School or College ID Card"
                      sublabel="Upload photo or scan of your valid student ID card or bona fide certificate (PNG, JPG, or PDF, max 600KB)."
                      fileType="document"
                      accept=".pdf,image/*"
                      maxSizeMB={0.6}
                      valueUrl={formData.idCardUrl}
                      valueName={formData.idCardName}
                      onChange={(url, name) => setFormData({ ...formData, idCardUrl: url, idCardName: name })}
                      onClear={() => setFormData({ ...formData, idCardUrl: "", idCardName: "" })}
                      error={errors.idCardUrl}
                    />
                  </div>
                </div>

                {/* Back / Next buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-[#8A9A7E]/20">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 border border-[#8A9A7E]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:bg-[#2E3B2F] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] font-sans text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <span>Proceed to UNGA Preferences</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: UNGA PORTFOLIO PREFERENCES & EXPERIENCE */}
            {step === 3 && (
              <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/95 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#C9A86A]/20 pb-4">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                      STAGE 03 OF 04 &bull; VIRTUAL CHAMBER PREFERENCES
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      UNGA Country Portfolio Choices
                    </h2>
                  </div>
                  <div className="h-10 w-10 border border-[#C9A86A]/40 bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                    <Globe className="h-5 w-5" />
                  </div>
                </div>

                {/* Committee Overview Banner */}
                <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/40 p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#C9A86A] animate-pulse" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold">
                        SELECTED COMMITTEE CHAMBER: UNGA (ONLINE)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/30">
                      100% Virtual Simulation
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg text-[#EDE6D3]">
                      United Nations General Assembly (Online Committee)
                    </h3>
                    <p className="text-xs text-[#8A9A7E] mt-1 leading-relaxed">
                      {UNGA_COMMITTEE_INFO.description}
                    </p>
                  </div>


                </div>

                {/* 5 Ranked Country Preferences - Text Inputs Only (Dropdown Removed) */}
                <div className="space-y-4">
                  <div>
                    <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-bold block">
                      Ranked Country Preferences (Top 5 Sovereign States) <span className="text-rose-400">*</span>
                    </label>
                    <p className="text-[11px] text-[#8A9A7E] mt-0.5">
                      Enter up to 5 member state countries in order of your diplomatic representation preference.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[#2E3B2F]/30 border border-[#8A9A7E]/30">
                        <span className="font-mono text-xs text-[#C9A86A] font-bold w-28 shrink-0 flex items-center gap-1.5">
                          <span>Choice 0{idx + 1}</span>
                          {idx === 0 && <span className="text-[9px] px-1 bg-[#C9A86A] text-[#1A1F1A] font-mono font-bold">Top</span>}
                        </span>

                        <div className="flex-grow">
                          <input
                            type="text"
                            value={formData.pref1Portfolios[idx] || ""}
                            onChange={(e) => {
                              const next = [...formData.pref1Portfolios];
                              next[idx] = e.target.value;
                              setFormData({
                                ...formData,
                                pref1Country: idx === 0 ? e.target.value : formData.pref1Country,
                                pref1Portfolios: next
                              });
                              if (errors.pref1Portfolios) setErrors({ ...errors, pref1Portfolios: "" });
                            }}
                            placeholder={idx === 0 ? "e.g. United States of America (Top Preference) *" : `Country preference #${idx + 1}`}
                            className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 focus:border-[#C9A86A] focus:outline-none font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.pref1Portfolios && <span className="text-rose-400 text-[11px] block">{errors.pref1Portfolios}</span>}
                </div>

                {/* Experience & Motivation */}
                <div className="pt-4 border-t border-[#8A9A7E]/20 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                        Prior Model UN Experience
                      </label>
                      <select
                        value={formData.munExperience}
                        onChange={(e) => setFormData({ ...formData, munExperience: e.target.value })}
                        className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      >
                        <option value="None">None (First MUN Simulation)</option>
                        <option value="1-2">1 - 2 Previous MUNs</option>
                        <option value="3-5">3 - 5 Previous MUNs (Intermediate)</option>
                        <option value="5+">5+ Previous MUNs (Experienced Delegate)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                        Key Past Accolades / Portfolios (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.pastMunDetails}
                        onChange={(e) => setFormData({ ...formData, pastMunDetails: e.target.value })}
                        placeholder="e.g. Best Delegate UNHRC 2024, High Commendation"
                        className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                      Statement of Motivation &amp; Foreign Policy Rationale <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      placeholder="Outline why you wish to represent your preferred country in the UNGA Online Chamber, your diplomatic perspective, and past conference interest..."
                      className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      {errors.motivation ? (
                        <span className="text-rose-400">{errors.motivation}</span>
                      ) : (
                        <span className="text-[#8A9A7E]">Min 20 characters</span>
                      )}
                      <span className={`font-mono ${formData.motivation.length >= 20 ? "text-emerald-400" : "text-[#8A9A7E]"}`}>
                        {formData.motivation.length} / 20 chars
                      </span>
                    </div>
                  </div>
                </div>

                {/* Back / Next buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-[#8A9A7E]/20">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 border border-[#8A9A7E]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:bg-[#2E3B2F] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] font-sans text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <span>Proceed to Fee Payment</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 4: FEE PAYMENT, QR VERIFICATION & SUBMISSION */}
            {step === 4 && (
              <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/95 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#C9A86A]/20 pb-4">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                      STAGE 04 OF 04 &bull; OFFICIAL UPI PAYMENT &amp; DISPATCH
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Fee Assessment &amp; Transaction Verification
                    </h2>
                  </div>
                  <div className="h-10 w-10 border border-[#C9A86A]/40 bg-[#2E3B2F] flex items-center justify-center text-[#C9A86A]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>

                {/* Dynamic Fee Calculation Card */}
                <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/30 p-5 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#C9A86A]/20 pb-4">
                    <div>
                      <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-bold block">
                        UNGA (Online Committee) Assessment
                      </span>
                      <h3 className="font-serif text-xl font-normal text-[#EDE6D3] mt-0.5">
                        {!isIISTInstitution(formData.institution) && formData.hasMerch
                          ? "Online Delegate Fee (₹899) + Official Merch (₹599)"
                          : "Online Delegate Registration Fee (₹899)"}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="font-sans text-[9px] uppercase tracking-wider text-[#8A9A7E] block">Total Amount Payable</span>
                      <span className="font-serif text-3xl font-bold text-[#C9A86A]">
                        ₹{calculatedFee}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs font-sans text-[#8A9A7E]">
                    <div>
                      <span>Base Registration:</span>{" "}
                      <strong className="text-[#EDE6D3]">₹899 (Flat Fee)</strong>
                    </div>
                    {!isIISTInstitution(formData.institution) && formData.hasMerch && (
                      <div>
                        <span>Merch ({formData.merchSize}):</span>{" "}
                        <strong className="text-emerald-400">+₹599</strong>
                      </div>
                    )}
                    <div>
                      <span>Committee:</span>{" "}
                      <strong className="text-[#C9A86A]">UNGA (Online)</strong>
                    </div>
                    <div>
                      <span>Chamber Format:</span>{" "}
                      <strong className="text-emerald-400">100% Virtual Conclave</strong>
                    </div>
                  </div>
                </div>

                {/* Merchandise Management Banner (Conditional for Non-IIST Delegates Only) */}
                {!isIISTInstitution(formData.institution) && (
                  <div className="border border-[#C9A86A]/30 bg-[#1A1F1A] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="h-12 w-12 bg-[#141814] border border-[#C9A86A]/40 p-0.5 shrink-0 overflow-hidden cursor-pointer hover:border-[#C9A86A] transition-colors relative group"
                        onClick={() => {
                          setSelectedMerchSize(formData.merchSize || "M");
                          setShowMerchModal(true);
                        }}
                        title="Click to preview official conference merchandise"
                      >
                        <img
                          src="/merch_front.png"
                          alt="IISTMUN Official Merch T-Shirt"
                          className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-110"
                        />
                      </div>
                      <div className="text-xs">
                        {formData.hasMerch ? (
                          <>
                            <span className="font-bold text-[#EDE6D3] flex items-center gap-2">
                              Official Conference T-Shirt Included
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 border border-emerald-500/40 font-bold">
                                +₹599
                              </span>
                            </span>
                            <span className="text-[#8A9A7E] text-[11px] block mt-0.5">
                              Selected Size: <strong className="text-[#C9A86A] font-mono font-bold">{formData.merchSize}</strong> • Delivered to your postal address
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-[#EDE6D3] block">
                              Official Conference T-Shirt (Optional Home Delivery)
                            </span>
                            <span className="text-[#8A9A7E] text-[11px] block mt-0.5">
                              Commemorative limited edition ISRO space heritage tee for ₹599.
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      {formData.hasMerch ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMerchSize(formData.merchSize || "M");
                              setShowMerchModal(true);
                            }}
                            className="px-3 py-1.5 border border-[#C9A86A] text-[#C9A86A] hover:bg-[#C9A86A]/10 text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Shirt className="h-3 w-3" />
                            <span>Change Size</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, hasMerch: false }))}
                            className="px-3 py-1.5 border border-rose-500/40 text-rose-300 hover:bg-rose-950/30 text-[10px] font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMerchSize("M");
                            setShowMerchModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer shadow flex items-center gap-1.5"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>+ Add Merch (₹599)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Official UPI QR Payment Card */}
                <div className="border-2 border-[#C9A86A] bg-[#1A1F1A] p-6 text-center relative overflow-hidden shadow-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A86A]/20 border border-[#C9A86A] text-[#C9A86A] text-[10px] font-mono uppercase tracking-widest font-bold mb-4">
                    <QrCode className="h-3.5 w-3.5 text-[#C9A86A]" />
                    <span>OFFICIAL UPI QR PAYMENT</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Official UPI QR Graphic */}
                    <div className="flex flex-col items-center">
                      <div className="relative p-2.5 bg-white border-2 border-[#C9A86A] shadow-2xl inline-block max-w-[240px] sm:max-w-[260px] w-full">
                        <img
                          src="/UPI-QR-IIST-MUN-2026.png"
                          alt="IIST MUN Official UPI QR Code - Arnav Jain"
                          className="w-full h-auto object-contain block mx-auto rounded"
                        />
                        <div className="mt-2 py-1.5 px-3 bg-[#1A1F1A] text-center border border-[#C9A86A]/40 flex items-center justify-between">
                          <span className="font-mono text-[9px] text-[#8A9A7E] uppercase tracking-wider">Amount Due:</span>
                          <span className="font-mono text-xs font-bold text-[#C9A86A]">₹{calculatedFee}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#8A9A7E] font-mono mt-2">
                        Scan to pay ₹{calculatedFee} with any UPI app
                      </span>
                    </div>

                    {/* Payment Credentials & Instructions */}
                    <div className="text-left space-y-3.5">
                      <div className="space-y-1">
                        <span className="font-sans text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                          Direct UPI ID
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-[#C9A86A] bg-[#2E3B2F] px-3.5 py-1.5 border border-[#C9A86A]/40 inline-block select-all">
                            arnav.tpj@oksbi
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-3 py-1.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {copiedUpi ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copiedUpi ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-[#8A9A7E] space-y-1">
                        <div>
                          <span className="text-[#EDE6D3] font-semibold">Account Holder:</span>{" "}
                          Pankaj Kumar Jain
                        </div>
                        <div>
                          <span className="text-[#EDE6D3] font-semibold">Accepted Applications:</span>{" "}
                          Google Pay, PhonePe, Paytm, BHIM, Cred, Mobile Banking
                        </div>
                      </div>

                      {/* 3 Step Guide */}
                      <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/30 p-3 text-[11px] text-[#EDE6D3] space-y-1.5 leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <span className="text-[#C9A86A] font-bold">1.</span>
                          <span>Scan the official QR code or transfer ₹{calculatedFee} to <strong className="text-[#C9A86A]">arnav.tpj@oksbi</strong>.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-[#C9A86A] font-bold">2.</span>
                          <span>Copy the <strong>12-digit UTR / UPI Transaction Reference Number</strong> from your payment receipt.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-[#C9A86A] font-bold">3.</span>
                          <span>Enter the UTR number and upload the screenshot proof below to finalize accreditation.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Verification Input Fields */}
                <div className="border border-[#8A9A7E]/30 bg-[#1A1F1A]/80 p-5 space-y-4">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold block flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>PAYMENT TRANSACTION DETAILS</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                        12-digit UPI Reference / UTR
                      </label>
                      <input
                        type="text"
                        value={formData.utrNumber}
                        onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value, transactionId: e.target.value })}
                        placeholder="e.g. 429182749102"
                        className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] font-mono tracking-wider focus:border-[#C9A86A] focus:outline-none"
                      />
                      {errors.utrNumber && <span className="text-rose-400 text-[11px]">{errors.utrNumber}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                        Payer Name in UPI App
                      </label>
                      <input
                        type="text"
                        value={formData.payerName}
                        onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                        placeholder="Name on bank / UPI account"
                        className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                      {errors.payerName && <span className="text-rose-400 text-[11px]">{errors.payerName}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                        Date of Transfer
                      </label>
                      <input
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Screenshot File Upload */}
                  <div className="pt-2">
                    <FileUploadZone
                      label="Payment Receipt Screenshot (Optional)"
                      sublabel="Upload screenshot or PDF receipt clearly showing the UTR number, date, and ₹ amount paid (max 1MB)."
                      fileType="document"
                      accept=".pdf,image/*"
                      maxSizeMB={1.0}
                      valueUrl={formData.paymentScreenshotUrl}
                      valueName={formData.paymentScreenshotName}
                      onChange={(url, name) => setFormData({ ...formData, paymentScreenshotUrl: url, paymentScreenshotName: name })}
                      onClear={() => setFormData({ ...formData, paymentScreenshotUrl: "", paymentScreenshotName: "" })}
                      error={errors.paymentScreenshotUrl}
                    />
                  </div>
                </div>

                {/* Declaration Checkbox */}
                <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/30 p-4 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded-none accent-[#C9A86A] cursor-pointer"
                    />
                    <span className="text-xs text-[#EDE6D3] leading-relaxed">
                      I hereby declare that all information furnished in this UNGA (Online Committee) accreditation dossier is accurate, any payment reference provided belongs to my registration, and I agree to the IISTMUN 2027 conference guidelines and online simulation chamber allotment protocols.
                    </span>
                  </label>
                  {errors.agreedToTerms && (
                    <span className="text-rose-400 text-[11px] block">{errors.agreedToTerms}</span>
                  )}
                </div>

                {/* Back / Submit Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#8A9A7E]/20">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full sm:w-auto px-5 py-2.5 border border-[#8A9A7E]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:bg-[#2E3B2F] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Matrix Choices</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 border border-[#C9A86A] bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-200 cursor-pointer disabled:opacity-60 shadow-xl flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A1F1A] border-t-transparent" />
                        <span>Dispatching UNGA Dossier...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Submit UNGA Online Registration</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* MERCHANDISE SELECTION & SIZE CHART MODAL (CONDITIONAL POP-UP FOR NON-IIST DELEGATES) */}
      <AnimatePresence>
        {showMerchModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-[#141814] border-2 border-[#C9A86A] shadow-2xl p-6 sm:p-8 text-left my-8"
            >
              <button
                type="button"
                onClick={handleSkipMerch}
                className="absolute right-4 top-4 border border-[#8A9A7E]/40 p-1.5 text-[#EDE6D3] hover:text-[#C9A86A] hover:border-[#C9A86A] transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="border-b border-[#C9A86A]/30 pb-4 mb-5">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold bg-[#2E3B2F] px-2.5 py-0.5 border border-[#C9A86A]/40 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#C9A86A]" />
                    Exclusive Delegate Merch Offer
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/30">
                    ₹599 ONLY
                  </span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal leading-tight">
                  Official IISTMUN 2027 Edition T-Shirt
                </h3>
                <p className="text-xs sm:text-sm text-[#8A9A7E] mt-1 leading-relaxed">
                  Would you like to purchase the official conference commemorative merchandise delivered directly to your residential postal address?
                </p>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left Column: Visual Showcase */}
                <div className="space-y-3">
                  {/* View Switcher Tabs */}
                  <div className="flex border border-[#8A9A7E]/30 bg-[#141814] p-0.5">
                    <button
                      type="button"
                      onClick={() => setMerchViewTab("front")}
                      className={`flex-1 py-1.5 text-[10px] font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer ${merchViewTab === "front"
                        ? "bg-[#C9A86A] text-[#1A1F1A] shadow"
                        : "text-[#8A9A7E] hover:text-[#EDE6D3]"
                        }`}
                    >
                      Front View
                    </button>
                    <button
                      type="button"
                      onClick={() => setMerchViewTab("back")}
                      className={`flex-1 py-1.5 text-[10px] font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer ${merchViewTab === "back"
                        ? "bg-[#C9A86A] text-[#1A1F1A] shadow"
                        : "text-[#8A9A7E] hover:text-[#EDE6D3]"
                        }`}
                    >
                      Back View
                    </button>
                    <button
                      type="button"
                      onClick={() => setMerchViewTab("size_chart")}
                      className={`flex-1 py-1.5 text-[10px] font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${merchViewTab === "size_chart"
                        ? "bg-[#C9A86A] text-[#1A1F1A] shadow"
                        : "text-[#8A9A7E] hover:text-[#EDE6D3]"
                        }`}
                    >
                      <Ruler className="h-3 w-3" />
                      Size Chart
                    </button>
                  </div>

                  {/* Main Image Viewer Container */}
                  <div className="relative border border-[#C9A86A]/40 bg-[#141814] p-3 flex items-center justify-center min-h-[260px] max-h-[300px] overflow-hidden group">
                    {merchViewTab === "front" && (
                      <motion.img
                        key="front"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        src="/merch_front.png"
                        alt="IISTMUN Official Merch Front"
                        className="max-h-[260px] w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {merchViewTab === "back" && (
                      <motion.img
                        key="back"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        src="/merch_back.png"
                        alt="IISTMUN Official Merch Back"
                        className="max-h-[260px] w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {merchViewTab === "size_chart" && (
                      <motion.img
                        key="size_chart"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        src="/size_chart.png"
                        alt="IISTMUN Official T-Shirt Size Chart"
                        className="max-h-[260px] w-auto object-contain mx-auto"
                      />
                    )}
                  </div>

                  {/* Thumbnail Switchers */}
                  <div className="flex items-center gap-2 justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => setMerchViewTab("front")}
                      className={`h-11 w-11 border p-0.5 bg-[#141814] transition-all cursor-pointer ${merchViewTab === "front" ? "border-[#C9A86A] ring-1 ring-[#C9A86A]" : "border-[#8A9A7E]/30 opacity-70 hover:opacity-100"
                        }`}
                      title="Front view"
                    >
                      <img src="/merch_front.png" alt="Front thumbnail" className="h-full w-full object-contain" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMerchViewTab("back")}
                      className={`h-11 w-11 border p-0.5 bg-[#141814] transition-all cursor-pointer ${merchViewTab === "back" ? "border-[#C9A86A] ring-1 ring-[#C9A86A]" : "border-[#8A9A7E]/30 opacity-70 hover:opacity-100"
                        }`}
                      title="Back view"
                    >
                      <img src="/merch_back.png" alt="Back thumbnail" className="h-full w-full object-contain" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMerchViewTab("size_chart")}
                      className={`h-11 w-11 border p-0.5 bg-[#141814] transition-all cursor-pointer flex flex-col items-center justify-center ${merchViewTab === "size_chart" ? "border-[#C9A86A] ring-1 ring-[#C9A86A]" : "border-[#8A9A7E]/30 opacity-70 hover:opacity-100"
                        }`}
                      title="Size chart"
                    >
                      <Ruler className="h-4 w-4 text-[#C9A86A]" />
                      <span className="text-[7px] font-mono text-[#8A9A7E] uppercase">CHART</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Details, Size Selection, and Actions */}
                <div className="space-y-4 text-left">
                  {/* Price and Description Box */}
                  <div className="p-3.5 border border-[#8A9A7E]/30 bg-[#2E3B2F]/60 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-sans text-[10px] uppercase tracking-wider text-[#8A9A7E] font-semibold">
                        Conference Edition Price
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-[#8A9A7E] line-through mr-2">₹899</span>
                        <span className="font-serif text-2xl font-bold text-[#C9A86A]">₹599</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#EDE6D3]/90 leading-relaxed pt-1 border-t border-[#8A9A7E]/20">
                      Iconic ISRO Space Transport artwork on the front with the historic Chandrayaan Moon Landing celebration on the back. 100% premium combed cotton.
                    </p>
                  </div>

                  {/* Size Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold">
                        Choose T-Shirt Size (Unisex Standard Fit) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setMerchViewTab("size_chart")}
                        className="text-[10px] text-[#C9A86A] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                      >
                        <Ruler className="h-3 w-3" />
                        <span>View Chart</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {MERCH_SIZES.map((sz) => (
                        <button
                          key={sz.value}
                          type="button"
                          onClick={() => {
                            setSelectedMerchSize(sz.value);
                            if (merchSizeError) setMerchSizeError("");
                          }}
                          className={`py-2 text-xs font-mono font-bold border transition-all cursor-pointer ${selectedMerchSize === sz.value
                            ? "border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A]"
                            : "border-[#8A9A7E]/30 bg-[#1A1F1A] text-[#EDE6D3] hover:border-[#C9A86A]"
                            }`}
                        >
                          {sz.value}
                        </button>
                      ))}
                    </div>
                    {merchSizeError && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-1">{merchSizeError}</p>
                    )}
                  </div>

                  {/* Delivery Notice */}
                  <div className="text-[11px] text-[#8A9A7E] border-l-2 border-[#C9A86A] pl-3 py-1 bg-[#141814]/60 leading-relaxed">
                    If selected, <strong className="text-[#EDE6D3]">₹599</strong> will be added to your total payment amount (Total: <strong className="text-[#C9A86A]">₹1,498</strong>). Delivered directly to your provided residential postal address.
                  </div>

                  {/* Decision Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmMerch}
                      className="w-full flex items-center justify-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] px-5 py-3 font-sans text-xs font-bold uppercase tracking-wider text-[#1A1F1A] transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Yes, Add to Registration (+₹599)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSkipMerch}
                      className="w-full flex items-center justify-center gap-1.5 border border-[#8A9A7E]/40 bg-[#1A1F1A] hover:bg-[#2E3B2F] px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all cursor-pointer"
                    >
                      <span>No Thanks, Proceed to Payment (₹899)</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
