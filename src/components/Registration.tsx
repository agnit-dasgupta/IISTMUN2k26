/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { COMMITTEES } from "../data";
import { RegistrationDetails } from "../types";
import {
  User, Users, Landmark, ChevronRight, ChevronLeft,
  Download, Share2, AlertCircle, Check,
  ShieldCheck, FileText, CheckCircle2, QrCode, Copy,
  CreditCard, Sparkles, Building2, MapPin, Phone, Mail,
  Calendar, HelpCircle, ArrowLeft, RefreshCw,
  Clock, ShieldAlert, Award, ExternalLink,
  Shirt, ShoppingBag, Ruler, X, Tag, FileSpreadsheet
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, getDoc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { InstitutionSelect } from "./InstitutionSelect";
import FileUploadZone from "./FileUploadZone";
import QRCodeDisplay from "./QRCodeDisplay";
import { downloadBoardingPassPDF } from "../utils/pdfGenerator";

// Priority Round Committees (offline/on-campus simulation chambers; excludes UNGA Online Committee)
export const PRIORITY_COMMITTEES = COMMITTEES.filter(c => c.id !== "unga");
export const NES75_PORTFOLIO_LINK = "https://docs.google.com/spreadsheets/d/1jXZQ9IHvoSYjUnrJBU5lFZpJFb-iJZy19LqRj7p-dDY/edit?usp=sharing";

export const isIISTInstitution = (institution?: string): boolean => {
  if (!institution) return false;
  const lower = institution.toLowerCase().trim();
  if (lower.includes("indian institute of space science")) return true;
  if (lower.includes("space science and technology") && lower.includes("thiruvananthapuram")) return true;
  if (/\biist\b/i.test(lower)) return true;
  return false;
};

export const MERCH_SIZES = [
  { value: "XS", label: "XS (Chest 36\" / Height 25\")" },
  { value: "S", label: "S (Chest 38\" / Height 26\")" },
  { value: "M", label: "M (Chest 40\" / Height 27\")" },
  { value: "L", label: "L (Chest 42\" / Height 28\")" },
  { value: "XL", label: "XL (Chest 44\" / Height 29\")" },
  { value: "XXL", label: "XXL (Chest 46\" / Height 30\")" },
  { value: "XXXL", label: "XXXL (Chest 48\" / Height 31\")" },
];

interface RegistrationProps {
  initialPreference?: { country?: string; committee: string } | null;
  clearInitialPreference?: () => void;
  setActiveTab?: (tab: string) => void;
  embedded?: boolean;
}

export default function Registration({ initialPreference, clearInitialPreference, setActiveTab, embedded = false }: RegistrationProps) {
  const { user, loading: authLoading, signInWithGoogle, authError, clearAuthError, isSigningIn } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Round & Category
    round: "priority" as const,
    isPriority: true,
    regType: "individual" as "individual" | "double" | "contingent",
    delegationMode: "individual" as "individual" | "part_of_delegation",
    delegateCategory: "college" as "college",
    isPrivateDelegation: false,

    // Stage 1: Personal
    name: "",
    email: "",
    phone: "",
    aadharNumber: "",
    gender: "Prefer not to say",
    dob: "",
    cityState: "",
    emergencyContactName: "",
    emergencyContactRelation: "Parent",
    emergencyContactPhone: "",

    // Stage 2: Academic
    institution: "",
    course: "",
    yearOfStudy: "1st Year",
    classGrade: "Class 11",
    rollNumber: "",
    role: "Delegate" as "Delegate" | "Photographer" | "Journalist",
    idCardUrl: "",
    idCardName: "",
    campusAmbassadorCode: "",

    // Double Delegation partner details
    partnerName: "",
    partnerEmail: "",
    partnerPhone: "",
    partnerInstitution: "",
    partnerRole: "Delegate" as "Delegate" | "Photographer" | "Journalist",
    contingentSize: "5-10",

    // Stage 3: Experience & Council Preferences
    munExperience: "None",
    pastMunDetails: "",
    pref1Committee: "uncopuos",
    pref1Country: "",
    pref1Portfolios: ["", "", "", "", ""],
    pref2Committee: "unhrc",
    pref2Country: "",
    pref2Portfolios: ["", "", "", "", ""],
    pref3Committee: "unodc",
    pref3Country: "",
    pref3Portfolios: ["", "", "", "", ""],
    priorityPreference: "committee" as "committee" | "portfolio" | undefined,
    motivation: "",

    // Logistics (Accommodation removed - Day Delegate / Self-Arranged)
    accommodationRequired: "no" as "yes" | "no",
    checkInDate: "",
    checkOutDate: "",
    roomPreference: "",
    dietaryPreference: "",
    specialMedicalNeeds: "",

    // Stage 4: Payment & Transaction
    feeAmount: 1299,
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

  // Dynamic fee calculation based on Category and Merchandise selection
  const calculateTotalFee = (): number => {
    const isIIST = isIISTInstitution(formData.institution);
    const merchExtra = (!isIIST && formData.hasMerch) ? 599 : 0;
    return 1299 + merchExtra;
  };

  const calculatedFee = calculateTotalFee();

  // Auto-fill selected committee preferences if navigated with initial preference
  useEffect(() => {
    if (initialPreference) {
      if (initialPreference.committee === "unga") {
        if (setActiveTab) {
          setActiveTab("register-portal-unga");
          return;
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          pref1Committee: initialPreference.committee || prev.pref1Committee,
        }));
      }

      setStep(3); // jump directly to preferences step if initiated from link
      if (clearInitialPreference) {
        clearInitialPreference();
      }
    }
  }, [initialPreference, clearInitialPreference, setActiveTab]);

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

  // Real-time listener for user's priority registration document
  useEffect(() => {
    if (!user) {
      try {
        const cached = localStorage.getItem("iistmun_last_priority_pass");
        if (cached) {
          setSubmittedPass(JSON.parse(cached));
        }
      } catch { }
      return;
    }

    setLoading(true);
    const docRef = doc(db, "priority_registrations", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RegistrationDetails;
        setSubmittedPass(data);
        setLoading(false);
      } else {
        // Fallback: Check if registration exists under registrations collection
        getDoc(doc(db, "registrations", user.uid)).then((legacySnap) => {
          if (legacySnap.exists()) {
            const data = legacySnap.data() as RegistrationDetails;
            if (data.round === "priority" || data.isPriority) {
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
                const match = res.data?.find((r: any) => r.userId === user.uid || (r.email && r.email.toLowerCase() === user.email?.toLowerCase()));
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
        }).catch(() => {
          setSubmittedPass(null);
          setLoading(false);
        });
      }
    }, (error) => {
      console.warn("Priority registration snapshot warning:", error);
      // Try server fallback if Firestore rules block client read
      fetch("/api/registrations")
        .then(res => res.json())
        .then(res => {
          const match = res.data?.find((r: any) => r.userId === user.uid || (r.email && r.email.toLowerCase() === user.email?.toLowerCase()));
          if (match) setSubmittedPass(match);
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    });

    return () => unsubscribe();
  }, [user]);

  // Stage Validations (4 Stages)
  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // Stage 1: Personal Identification
      if (!formData.name.trim()) newErrors.name = "Full candidate name is required.";
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "A valid contact email address is required.";
      }
      if (!formData.phone.trim() || formData.phone.length < 8) {
        newErrors.phone = "A valid WhatsApp / Phone contact number is required.";
      }
      const rawId = formData.aadharNumber.replace(/\s+/g, "").toUpperCase();
      if (!rawId) {
        newErrors.aadharNumber = "Aadhaar or Passport Number is mandatory for campus security clearance.";
      } else if (/^\d+$/.test(rawId)) {
        if (rawId.length !== 12 && (rawId.length < 8 || rawId.length > 9)) {
          newErrors.aadharNumber = "Please enter a valid 12-digit Aadhaar Number or Passport Number.";
        }
      } else if (!/^[A-Z0-9]{6,15}$/.test(rawId)) {
        newErrors.aadharNumber = "Please enter a valid 12-digit Aadhaar Number or Passport Number (6-15 alphanumeric characters).";
      }
      if (!formData.cityState.trim()) {
        newErrors.cityState = "Current City & State of residence is required.";
      }
      if (!formData.dob.trim()) {
        newErrors.dob = "Date of Birth is required for conference accreditation.";
      }
      if (!formData.emergencyContactName.trim()) {
        newErrors.emergencyContactName = "Emergency contact name is required.";
      }
      if (!formData.emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = "Emergency contact phone is required.";
      }
    } else if (currentStep === 2) {
      // Stage 2: Academic & Institutional
      if (!formData.institution.trim()) {
        newErrors.institution = "Academic institution / College / University name is required.";
      }
      if (!formData.course.trim()) {
        newErrors.course = "Course / Degree / Major is required.";
      }
    } else if (currentStep === 3) {
      // Stage 3: Committee Preferences & Motivation
      if (!formData.pref1Committee) {
        newErrors.pref1Committee = "1st choice committee preference is required.";
      }
      if (!formData.pref2Committee) {
        newErrors.pref2Committee = "2nd choice committee preference is required.";
      }
      if (!formData.pref3Committee) {
        newErrors.pref3Committee = "3rd choice committee preference is required.";
      }
      const isIp1 = formData.pref1Committee.startsWith("ip");
      if (!isIp1 && (!formData.pref1Portfolios || formData.pref1Portfolios.length < 5 || formData.pref1Portfolios.some(p => !p.trim()))) {
        newErrors.pref1Portfolios = "All 5 portfolio choices are mandatory for 1st preference.";
      }
      const isIp2 = formData.pref2Committee.startsWith("ip");
      if (!isIp2 && (!formData.pref2Portfolios || formData.pref2Portfolios.length < 5 || formData.pref2Portfolios.some(p => !p.trim()))) {
        newErrors.pref2Portfolios = "All 5 portfolio choices are mandatory for 2nd preference.";
      }
      const isIp3 = formData.pref3Committee.startsWith("ip");
      if (!isIp3 && (!formData.pref3Portfolios || formData.pref3Portfolios.length < 5 || formData.pref3Portfolios.some(p => !p.trim()))) {
        newErrors.pref3Portfolios = "All 5 portfolio choices are mandatory for 3rd preference.";
      }
      if (!formData.priorityPreference) {
        newErrors.priorityPreference = "Please select whether you prioritize committee or portfolio allotment.";
      }
      if (!formData.motivation.trim() || formData.motivation.length < 20) {
        newErrors.motivation = "Statement of motivation must be at least 20 characters.";
      }
    } else if (currentStep === 4) {
      // Stage 4: Payment (Non-mandatory)
      if (!formData.agreedToTerms) {
        newErrors.agreedToTerms = "You must acknowledge the accreditation terms to submit.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 3) {
        // Case 1 vs Case 2:
        // Case 2: For students who have selected IIST, no pop up to be shown.
        if (isIISTInstitution(formData.institution)) {
          setStep(4);
          window.scrollTo({ top: 120, behavior: "smooth" });
        } else {
          // Case 1: For students who have selected colleges except IIST,
          // display a popup just before final payment stage.
          setShowMerchModal(true);
        }
        return;
      }
      setStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleConfirmMerch = () => {
    if (!selectedMerchSize) {
      setMerchSizeError("Please select a size to proceed.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      hasMerch: true,
      merchSize: selectedMerchSize,
    }));
    setShowMerchModal(false);
    setMerchSizeError("");
    setStep(4);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSkipMerch = () => {
    setFormData((prev) => ({
      ...prev,
      hasMerch: false,
    }));
    setShowMerchModal(false);
    setMerchSizeError("");
    setStep(4);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setLoading(true);

    try {
      // Format Committee Code for Ticket ID
      const commAbbr =
        formData.pref1Committee === "uncopuos" ? "COPUOS" :
          formData.pref1Committee === "unga" ? "UNGA" :
            formData.pref1Committee === "unhrc" ? "UNHRC" :
              formData.pref1Committee === "unodc" ? "UNODC" :
                formData.pref1Committee === "nes75" ? "NES75" :
                  formData.pref1Committee === "undp" ? "UNDP" :
                    formData.pref1Committee === "ip_journalism" ? "IP-JOUR" :
                      formData.pref1Committee === "ip_photojournalism" ? "IP-PHOTO" : "MUN";

      const roleCode = formData.role === "Photographer" ? "P" : formData.role === "Journalist" ? "J" : "D";
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const primaryTicketId = `PRIO-${commAbbr}-${roleCode}${random4}`;

      const timestamp = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      const utr = (formData.utrNumber || formData.transactionId).trim();

      const newRegistration: RegistrationDetails = {
        id: primaryTicketId,
        userId: user?.uid || `guest-${Date.now()}`,
        timestamp,
        round: "priority",
        isPriority: true,
        regType: formData.delegationMode === "part_of_delegation" ? "contingent" : "individual",
        delegationMode: formData.delegationMode,
        isPrivateDelegation: false,
        delegateCategory: "college",
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        aadharNumber: formData.aadharNumber.trim(),
        gender: formData.gender,
        dob: formData.dob,
        cityState: formData.cityState.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactRelation: formData.emergencyContactRelation,
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        institution: formData.institution.trim(),
        course: formData.course.trim(),
        yearOfStudy: formData.yearOfStudy,
        rollNumber: formData.rollNumber.trim(),
        role: formData.role,
        partnerName: formData.partnerName.trim(),
        partnerEmail: formData.partnerEmail.trim().toLowerCase(),
        partnerPhone: formData.partnerPhone.trim(),
        partnerInstitution: formData.partnerInstitution.trim(),
        partnerRole: formData.partnerRole,
        contingentSize: formData.contingentSize,
        munExperience: formData.munExperience,
        pref1Committee: formData.pref1Committee,
        pref1Country: formData.pref1Portfolios.filter(Boolean).join(", ") || (formData.pref1Committee.startsWith("ip") ? "N/A" : formData.pref1Country.trim()),
        pref1Portfolios: formData.pref1Committee.startsWith("ip") && formData.pref1Portfolios.every(p => !p.trim())
          ? ["N/A", "N/A", "N/A", "N/A", "N/A"]
          : formData.pref1Portfolios.map(p => p.trim() || (formData.pref1Committee.startsWith("ip") ? "N/A" : "")),
        pref2Committee: formData.pref2Committee,
        pref2Country: formData.pref2Portfolios.filter(Boolean).join(", ") || (formData.pref2Committee.startsWith("ip") ? "N/A" : formData.pref2Country.trim()),
        pref2Portfolios: formData.pref2Committee.startsWith("ip") && formData.pref2Portfolios.every(p => !p.trim())
          ? ["N/A", "N/A", "N/A", "N/A", "N/A"]
          : formData.pref2Portfolios.map(p => p.trim() || (formData.pref2Committee.startsWith("ip") ? "N/A" : "")),
        pref3Committee: formData.pref3Committee,
        pref3Country: formData.pref3Portfolios.filter(Boolean).join(", ") || (formData.pref3Committee.startsWith("ip") ? "N/A" : formData.pref3Country.trim()),
        pref3Portfolios: formData.pref3Committee.startsWith("ip") && formData.pref3Portfolios.every(p => !p.trim())
          ? ["N/A", "N/A", "N/A", "N/A", "N/A"]
          : formData.pref3Portfolios.map(p => p.trim() || (formData.pref3Committee.startsWith("ip") ? "N/A" : "")),
        priorityPreference: formData.priorityPreference,
        motivation: formData.motivation.trim(),
        accommodationRequired: "no",
        feeAmount: calculatedFee,
        campusAmbassadorCode: formData.campusAmbassadorCode.trim().toUpperCase(),
        idCardUrl: formData.idCardUrl || "",
        idCardName: formData.idCardName || "",
        hasMerch: !isIISTInstitution(formData.institution) && formData.hasMerch,
        merchSize: (!isIISTInstitution(formData.institution) && formData.hasMerch) ? (formData.merchSize || "M") : "",
        merchAmount: (!isIISTInstitution(formData.institution) && formData.hasMerch) ? 599 : 0,
        paymentMode: formData.paymentMode,
        transactionId: utr,
        utrNumber: utr,
        payerName: formData.payerName.trim(),
        paymentDate: formData.paymentDate || "",
        paymentScreenshotUrl: formData.paymentScreenshotUrl || "",
        paymentScreenshotName: formData.paymentScreenshotName || "",
        paymentStatus: calculatedFee === 0 ? "Verified" : "Pending",
        status: calculatedFee === 0 ? "Payment Confirmed" : "Pending Verification"
      };

      // Strip any undefined keys so Firestore SDK never throws Unsupported field value: undefined
      const cleanRegistration: Record<string, any> = {};
      for (const [key, val] of Object.entries(newRegistration)) {
        if (val !== undefined) {
          cleanRegistration[key] = val;
        }
      }

      // 1. Write to local server backup endpoint (guaranteed to succeed and immediately feed Admin Console)
      try {
        await fetch("/api/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanRegistration)
        });
      } catch (backupErr) {
        console.warn("Local server backup note:", backupErr);
      }

      // 2. Persist in Firestore 'priority_registrations' (dedicated priority collection with unique ticket ID)
      try {
        await setDoc(doc(db, "priority_registrations", primaryTicketId), cleanRegistration);
        console.log("[FIREBASE SUCCESS] Priority registration uploaded to priority_registrations:", primaryTicketId);
      } catch (prioErr) {
        console.warn("Firestore 'priority_registrations' ticketId write status:", prioErr);
        if (user?.uid) {
          try {
            await setDoc(doc(db, "priority_registrations", user.uid), cleanRegistration);
          } catch (e2) {
            console.warn("Firestore 'priority_registrations' uid write status:", e2);
          }
        }
      }

      // 3. Persist in Firestore 'registrations' (the primary conference registry collection)
      try {
        await setDoc(doc(db, "registrations", primaryTicketId), cleanRegistration);
        console.log("[FIREBASE SUCCESS] Priority registration uploaded to registrations:", primaryTicketId);
      } catch (regErr) {
        console.warn("Firestore 'registrations' ticketId write status:", regErr);
        if (user?.uid) {
          try {
            await setDoc(doc(db, "registrations", user.uid), cleanRegistration);
          } catch (e2) {
            console.warn("Firestore 'registrations' uid write status:", e2);
          }
        }
      }

      // Cache locally in localStorage for persistent session
      try {
        localStorage.setItem("iistmun_last_priority_pass", JSON.stringify(cleanRegistration));
      } catch { }

      setSubmittedPass(newRegistration);
      window.scrollTo({ top: 80, behavior: "smooth" });
    } catch (err) {
      console.error("Priority submission failed:", err);
      alert("Submission encountered an issue. Please verify your internet connection or contact the secretariat.");
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
    const commName = COMMITTEES.find(c => c.id === submittedPass.pref1Committee)?.name || submittedPass.pref1Committee?.toUpperCase();
    const shareText = `IIST MUN 2027 Priority Round Accreditation Confirmed! Primary Committee Choice: ${commName}. Accreditation ID: ${submittedPass.id}.`;
    navigator.clipboard.writeText(shareText);
    alert("Accreditation summary copied to clipboard!");
  };

  const handleDownloadReceipt = async () => {
    if (!submittedPass) return;
    setIsDownloading(true);
    try {
      const commObj = COMMITTEES.find(c => c.id === submittedPass.pref1Committee);
      await downloadBoardingPassPDF({
        element: boardingPassRef.current,
        ticketId: submittedPass.id,
        candidateName: submittedPass.name,
        registrationType: "mun",
        details: {
          institution: submittedPass.institution,
          courseOrGrade: submittedPass.course,
          chamber: commObj ? `${commObj.abbreviation} (${commObj.name})` : submittedPass.pref1Committee,
          preferredCountry: submittedPass.pref1Country || "Allotment via Secretariat",
          email: submittedPass.email,
          phone: submittedPass.phone,
          timestamp: submittedPass.timestamp,
        },
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResetRegistration = async () => {
    if (confirm("Are you sure you want to start a new priority registration?")) {
      if (user) {
        try {
          await deleteDoc(doc(db, "priority_registrations", user.uid));
        } catch { }
        try {
          await deleteDoc(doc(db, "registrations", user.uid));
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
    { num: 3, title: "Preferences", icon: Landmark },
    { num: 4, title: "Payment", icon: CreditCard }
  ];

  return (
    <div className={embedded ? "relative text-[#EDE6D3] text-left pt-2 pb-8" : "bg-[#1A1F1A] text-[#EDE6D3] min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden paper-grain font-sans selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3]"}>

      {/* Background botanical parchment ambient glow */}
      {!embedded && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,106,0.14), transparent 70%),
              radial-gradient(ellipse 50% 50% at 90% 60%, rgba(46,59,47,0.45), transparent 70%)
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#C9A86A]/50 bg-[#2E3B2F]/80 text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-[#C9A86A] mb-3 shadow-sm">
            <Sparkles className="h-3 w-3 text-[#C9A86A] animate-pulse" />
            <span>Priority Round Registrations &bull; IIST MUN 2027</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-wide text-[#EDE6D3]">
            Priority Delegate Dossier
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-[#8A9A7E] max-w-xl mx-auto leading-relaxed">
            Early accreditation intake for college delegates. Secure priority council allotment, early study guide access, and subsidized registration privileges.
          </p>

          {/* Priority Perks Bar */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto text-[10px] font-mono uppercase tracking-wider text-[#C9A86A]">
            <span className="px-2.5 py-1 bg-[#2E3B2F]/60 border border-[#C9A86A]/30">
              College Non-IIST: ₹1299
            </span>
            <span className="px-2.5 py-1 bg-[#2E3B2F]/60 border border-[#C9A86A]/30">
              Portfolio Allotment: Rolling Priority Basis
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
          /* CONFIRMED BOARDING PASS & ACCREDITATION STUB            */
          /* ======================================================== */
          <div className="space-y-8 animate-fade-in text-left" id="boarding-pass-display">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#C9A86A] text-[#C9A86A] mb-3 bg-[#2E3B2F]/70 shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#EDE6D3]">
                Priority Registration Confirmed
              </h2>
              <p className="text-xs sm:text-sm text-[#8A9A7E] mt-2 max-w-xl mx-auto leading-relaxed">
                Your priority accreditation dossier is logged with the Executive Secretariat. Dispatch notification and receipt recorded for <span className="text-[#C9A86A] font-mono font-bold">{submittedPass.email}</span>.
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

            {/* Perforated Archival Boarding Pass Ticket */}
            <div
              ref={boardingPassRef}
              id="mun-boarding-pass-card"
              className="relative bg-[#EDE6D3] text-[#1A1F1A] border-2 border-[#C9A86A] shadow-2xl p-0 overflow-hidden font-sans"
            >
              {/* Header Banner */}
              <div className="bg-[#2E3B2F] text-[#EDE6D3] px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#C9A86A] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 border border-[#C9A86A] rounded-full flex items-center justify-center bg-[#1A1F1A] p-1 shrink-0 shadow-sm">
                    <img
                      src="/logo-emblem-transparent.png"
                      alt="IIST MUN 2027"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold">
                      Priority Round Accreditation Pass
                    </div>
                    <div className="font-serif text-xl sm:text-2xl font-bold tracking-wide">
                      IIST Model United Nations 2027
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center sm:flex-col items-end gap-2 sm:gap-0">
                  <span className="font-sans text-[8px] uppercase tracking-wider text-[#8A9A7E] block">Dossier ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm sm:text-base font-bold text-[#C9A86A] bg-[#1A1F1A] px-3 py-1 border border-[#C9A86A]/40 inline-block">
                      {submittedPass.id}
                    </span>
                    <button
                      onClick={handleCopyTicket}
                      title="Copy Dossier ID"
                      className="p-1 bg-[#1A1F1A] text-[#8A9A7E] hover:text-[#C9A86A] border border-[#C9A86A]/30 transition-colors"
                    >
                      {copiedTicketId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Ticket Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0 relative">

                {/* Left Main Stub (8 cols) */}
                <div className="md:col-span-8 p-6 sm:p-8 space-y-5 text-left border-b md:border-b-0 md:border-r border-dashed border-[#8A9A7E]/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Delegate Name
                      </span>
                      <span className="font-serif text-lg sm:text-xl font-bold text-[#1A1F1A] block">
                        {submittedPass.name}
                      </span>
                      <span className="font-sans text-[10px] text-[#5B6B4F] font-medium">
                        Role: {submittedPass.role || "Delegate"} &bull; {submittedPass.gender || "Delegate"}
                      </span>

                      {submittedPass.regType === "double" && submittedPass.partnerName && (
                        <div className="mt-2.5 pt-2 border-t border-[#8A9A7E]/30">
                          <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                            Co-Delegate Partner
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
                        Accreditation Division
                      </span>
                      <span className="inline-block mt-1 font-sans text-[10px] uppercase font-bold text-[#2E3B2F] bg-[#2E3B2F]/10 px-2.5 py-1 border border-[#2E3B2F]/30">
                        {submittedPass.delegateCategory?.toUpperCase() || "COLLEGE"} &bull; {submittedPass.delegationMode === "part_of_delegation" || submittedPass.regType === "contingent" ? "PART OF DELEGATION" : submittedPass.regType.toUpperCase()}{submittedPass.isPrivateDelegation ? " (PRIVATE)" : ""}
                      </span>
                      <div className="mt-2 font-mono text-[10px] text-[#5B6B4F]">
                        City: {submittedPass.cityState || "Kerala"}
                      </div>
                      {submittedPass.aadharNumber && (
                        <div className="mt-1 font-mono text-[10px] text-[#5B6B4F]">
                          {submittedPass.aadharNumber.replace(/\s+/g, "").length === 12 && /^\d+$/.test(submittedPass.aadharNumber.replace(/\s+/g, ""))
                            ? `Aadhaar: ${submittedPass.aadharNumber.replace(/(\d{4})\s*(\d{4})\s*(\d{4})/, "XXXX XXXX $3")}`
                            : `Passport: ${submittedPass.aadharNumber}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#8A9A7E]/30 pt-4">
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Academic Institution
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#1A1F1A] block truncate max-w-xs">
                        {submittedPass.institution}
                      </span>
                      <span className="font-sans text-[10px] text-[#5B6B4F]">
                        {submittedPass.course} {submittedPass.yearOfStudy ? `(${submittedPass.yearOfStudy})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        1st Choice Committee
                      </span>
                      <span className="font-sans text-xs font-bold text-[#8B5A3C] uppercase block">
                        {COMMITTEES.find(c => c.id === submittedPass.pref1Committee)?.name || submittedPass.pref1Committee?.toUpperCase()}
                      </span>
                      {submittedPass.pref1Portfolios && submittedPass.pref1Portfolios.length > 0 ? (
                        <span className="font-sans text-[9px] text-[#2E3B2F] block mt-0.5 truncate" title={submittedPass.pref1Portfolios.filter(Boolean).join(", ")}>
                          Portfolios: {submittedPass.pref1Portfolios.filter(Boolean).join(", ")}
                        </span>
                      ) : submittedPass.pref1Country ? (
                        <span className="font-sans text-[9px] text-[#2E3B2F] block mt-0.5 truncate">
                          Portfolios: {submittedPass.pref1Country}
                        </span>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {submittedPass.pref2Committee && (
                          <span className="font-sans text-[9px] text-[#5B6B4F]">
                            2nd: {COMMITTEES.find(c => c.id === submittedPass.pref2Committee)?.abbreviation || submittedPass.pref2Committee?.toUpperCase()}
                            {submittedPass.pref3Committee ? ` • 3rd: ${COMMITTEES.find(c => c.id === submittedPass.pref3Committee)?.abbreviation || submittedPass.pref3Committee?.toUpperCase()}` : ""}
                          </span>
                        )}
                        {submittedPass.priorityPreference && (
                          <span className="font-mono text-[8px] uppercase font-bold text-[#8B5A3C] bg-[#8B5A3C]/10 px-1.5 py-0.2 border border-[#8B5A3C]/30 inline-block">
                            Priority: {submittedPass.priorityPreference === "committee" ? "Committee" : "Portfolio"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#8A9A7E]/30 pt-4">
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Conference Venue
                      </span>
                      <span className="font-sans text-xs font-bold text-[#2E3B2F]">
                        IIST Valiamala Campus, Trivandrum
                      </span>
                    </div>
                    <div>
                      <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-[#5B6B4F] font-bold">
                        Event Dates
                      </span>
                      <span className="font-sans text-[11px] text-[#1A1F1A]">
                        30 Jan – 1 Feb 2027 &bull; IIST Valiamala
                      </span>
                    </div>
                  </div>

                  {/* Stamp Notice */}
                  <div className="p-3 bg-[#2E3B2F]/10 border-l-2 border-[#C9A86A] text-[11px] text-[#2E3B2F] leading-relaxed">
                    <strong>Priority Allotment Protocol:</strong> Committee portfolios will be assigned and emailed by the Secretariat based on candidate preferences and merit. Please present this ticket at the registration desk upon campus arrival.
                    {submittedPass.campusAmbassadorCode && (
                      <div className="mt-1 font-mono text-[10px] text-[#8B5A3C] font-semibold">
                        Ambassador Code: {submittedPass.campusAmbassadorCode}
                      </div>
                    )}
                    {submittedPass.idCardUrl && (
                      <div className="mt-0.5 text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 inline" /> Student ID Proof Attached
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Verification Stub (4 cols) with QR and Stamp */}
                <div className="md:col-span-4 p-6 sm:p-8 flex flex-col justify-between items-center bg-[#EDE6D3]/60 relative text-center">

                  <div className="w-full">
                    <span className="font-sans text-[8px] uppercase tracking-[0.2em] text-[#5B6B4F] font-bold block mb-2">
                      Official Security Stamp
                    </span>

                    {/* QR Code Container */}
                    <div className="p-2 border border-[#C9A86A] bg-white inline-block shadow-sm">
                      <QRCodeDisplay
                        uniqueId={submittedPass.id}
                        candidateName={submittedPass.name}
                        title="IIST MUN 2027 Priority Pass"
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
                    {submittedPass.feeAmount !== undefined && (
                      <div className="font-mono text-[10px] font-bold text-[#8B5A3C] mt-1">
                        {submittedPass.utrNumber ? `Amount Paid: ₹${submittedPass.feeAmount}` : `Registration Fee: ₹${submittedPass.feeAmount} (Payment Pending)`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Perforated Cut line styling */}
              <div className="bg-[#2E3B2F] text-[#EDE6D3] px-6 py-2.5 flex items-center justify-between text-[9px] font-sans uppercase tracking-[0.16em]">
                <span>Valiamala, Thiruvananthapuram &bull; Kerala, India</span>
                <span className="text-[#C9A86A]">Priority Intake Batch &bull; 14th Edition</span>
              </div>
            </div>

            {/* Post Submission Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3.5 pt-2">
              <button
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                id="receipt-download-btn"
                className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] disabled:opacity-50 px-7 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isDownloading ? (
                  <div className="h-4 w-4 border-2 border-[#1A1F1A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4 text-[#1A1F1A]" />
                )}
                {isDownloading ? "Synthesizing PDF..." : "Download Priority Pass (PDF)"}
              </button>

              <button
                onClick={handleSharePass}
                id="receipt-share-btn"
                className="flex items-center gap-2 border border-[#C9A86A] bg-[#2E3B2F] hover:bg-[#3d4d3e] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#EDE6D3] transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-[#C9A86A]" />
                Copy Accreditation Details
              </button>

              <button
                onClick={handleResetRegistration}
                className="flex items-center gap-2 border border-[#8A9A7E]/40 bg-[#1A1F1A] hover:bg-[#2E3B2F] px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#8A9A7E] hover:text-[#EDE6D3] transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MULTI-STAGE DYNAMIC REGISTRATION FORM                   */
          /* ======================================================== */
          <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/40 p-5 sm:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden text-left">

            {/* Top Stepper Indicator */}
            <div className="mb-8 pb-6 border-b border-[#8A9A7E]/20">
              <div className="flex items-center justify-between mb-4">
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#C9A86A]" />
                  Priority Round Intake Progress
                </span>
                <span className="font-mono text-xs text-[#EDE6D3] font-bold">
                  Step {step} of 4
                </span>
              </div>

              {/* Visual Multi-Stage Progress Stepper */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {stepLabels.map((s) => {
                  const Icon = s.icon;
                  const isCurrent = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => {
                        if (isDone) setStep(s.num);
                      }}
                      className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 text-left transition-all border ${isCurrent
                        ? "border-[#C9A86A] bg-[#C9A86A]/15 text-[#C9A86A]"
                        : isDone
                          ? "border-[#8A9A7E]/40 bg-[#1A1F1A]/80 text-[#EDE6D3] hover:border-[#C9A86A]/60 cursor-pointer"
                          : "border-[#8A9A7E]/15 bg-[#1A1F1A]/40 text-[#8A9A7E]/50 cursor-not-allowed"
                        }`}
                    >
                      <div className={`h-6 w-6 rounded-none flex items-center justify-center shrink-0 text-[10px] font-bold ${isCurrent
                        ? "bg-[#C9A86A] text-[#1A1F1A]"
                        : isDone
                          ? "bg-[#2E3B2F] text-[#C9A86A] border border-[#C9A86A]/40"
                          : "bg-[#1A1F1A] text-[#8A9A7E]/50 border border-[#8A9A7E]/20"
                        }`}>
                        {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : s.num}
                      </div>
                      <div className="hidden sm:block min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-semibold block truncate">
                          {s.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Authentication Quick Sync Banner */}
            {!user && (
              <div className="mb-6 p-3.5 border border-[#C9A86A]/30 bg-[#1A1F1A]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-[#2E3B2F] border border-[#C9A86A]/40 flex items-center justify-center text-[#C9A86A] shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="text-[#EDE6D3] font-medium block">Want to auto-fill details and sync your Boarding Pass?</span>
                    <span className="text-[#8A9A7E] text-[11px]">Signing in with Google preserves your accreditation across devices.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signInWithGoogle().catch(() => { })}
                  disabled={isSigningIn}
                  className="px-3.5 py-1.5 border border-[#C9A86A] bg-[#C9A86A]/10 hover:bg-[#C9A86A] text-[#C9A86A] hover:text-[#1A1F1A] text-[11px] font-sans font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer"
                >
                  {isSigningIn ? "Connecting..." : "Sign In with Google"}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ======================================================== */}
              {/* STAGE 1: PERSONAL IDENTIFICATION                         */}
              {/* ======================================================== */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Stage 1: Candidate Identification
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8A9A7E] mt-1 leading-relaxed">
                      Enter your personal profile credentials as they should appear on your official conference accreditation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Full Name */}
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Full Name (As on ID / Certificate) *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                        placeholder="e.g. Diya Roy"
                      />
                      {errors.name && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Official Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                        placeholder="diya.roy@example.com"
                      />
                      {errors.email && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.email}</p>}
                    </div>

                    {/* Phone / WhatsApp */}
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        WhatsApp & Contact Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                        placeholder="+91 98765 43210"
                      />
                      {errors.phone && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.phone}</p>}
                    </div>

                    {/* Aadhaar or Passport Number */}
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold flex items-center justify-between">
                        <span>Aadhaar or Passport Number *</span>
                        <span className="text-[9px] font-mono text-[#8A9A7E] font-normal">UID / Passport</span>
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
                        className={`w-full border ${errors.aadharNumber ? "border-rose-400" : "border-[#8A9A7E]/30"} bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-mono tracking-widest`}
                        placeholder="XXXX XXXX XXXX or Passport No."
                      />
                      {errors.aadharNumber ? (
                        <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.aadharNumber}</p>
                      ) : (
                        <p className="text-[10px] text-[#8A9A7E]/75 mt-1 font-sans">
                          Mandatory for ISRO / IIST campus gate security verification.
                        </p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] transition-all font-medium"
                      >
                        <option value="Male" className="bg-[#1A1F1A]">Male</option>
                        <option value="Female" className="bg-[#1A1F1A]">Female</option>
                        <option value="Non-Binary" className="bg-[#1A1F1A]">Non-Binary</option>
                        <option value="Prefer not to say" className="bg-[#1A1F1A]">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] transition-all font-medium"
                      />
                      {errors.dob && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.dob}</p>}
                    </div>

                    {/* City & State */}
                    <div className="sm:col-span-2">
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        City & State of Residence *
                      </label>
                      <input
                        type="text"
                        value={formData.cityState}
                        onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                        placeholder="e.g. Thiruvananthapuram, Kerala"
                      />
                      {errors.cityState && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.cityState}</p>}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="border border-[#8A9A7E]/25 bg-[#1A1F1A]/60 p-4 sm:p-5 space-y-3">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold block flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-[#C9A86A]" />
                      Emergency Contact Dossier (Parent / Guardian) *
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Contact Full Name *</label>
                        <input
                          type="text"
                          value={formData.emergencyContactName}
                          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                          placeholder="Parent / Guardian Name"
                        />
                        {errors.emergencyContactName && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.emergencyContactName}</p>}
                      </div>
                      <div>
                        <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Relationship</label>
                        <select
                          value={formData.emergencyContactRelation}
                          onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                        >
                          <option value="Parent" className="bg-[#1A1F1A]">Parent / Father / Mother</option>
                          <option value="Guardian" className="bg-[#1A1F1A]">Guardian</option>
                          <option value="Teacher" className="bg-[#1A1F1A]">Faculty / Teacher</option>
                          <option value="Sibling" className="bg-[#1A1F1A]">Sibling / Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Emergency Phone Number *</label>
                        <input
                          type="tel"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                          placeholder="+91 XXXXX XXXXX"
                        />
                        {errors.emergencyContactPhone && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.emergencyContactPhone}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#8A9A7E]/20">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      Next: Academic Profile
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STAGE 2: ACADEMIC & INSTITUTIONAL PROFILE                */}
              {/* ======================================================== */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Stage 2: Institutional & Delegate Profile
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8A9A7E] mt-1 leading-relaxed">
                      Select your delegate category and academic credentials.
                    </p>
                    {/* Active Delegate Category (Category A: College) */}
                    <div className="mb-4">
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-2 font-semibold">
                        Delegate Category *
                      </label>
                      <div className="p-4 border border-[#C9A86A] bg-[#2E3B2F] shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A86A] font-bold bg-[#1A1F1A] px-2 py-0.5 border border-[#C9A86A]/40">
                              Category A
                            </span>
                            <h4 className="font-serif text-base font-bold text-[#EDE6D3]">College Delegate</h4>
                          </div>
                          <span className="text-xs text-[#8A9A7E] block">
                            Undergraduate &amp; Postgraduate Students (Non-IIST) across India and abroad
                          </span>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <span className="text-[9px] uppercase tracking-wider text-[#8A9A7E] block">Registration Fee</span>
                          <span className="text-base font-mono text-[#C9A86A] font-bold">₹1,299</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* Institution */}
                      <div className="sm:col-span-2">
                        <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                          College / University / Institution Name *
                        </label>
                        <InstitutionSelect
                          value={formData.institution}
                          onChange={(val) => setFormData({ ...formData, institution: val })}
                          error={errors.institution}
                          placeholder="Search or type your College / University name..."
                        />
                      </div>

                      {/* Course / Degree */}
                      <div>
                        <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                          Degree / Course / Major *
                        </label>
                        <input
                          type="text"
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] transition-all font-medium"
                          placeholder="e.g. B.Tech Aerospace / B.A. Economics / LL.B"
                        />
                        {errors.course && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.course}</p>}
                      </div>

                      {/* Year of Study */}
                      <div>
                        <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                          Year of Study
                        </label>
                        <select
                          value={formData.yearOfStudy}
                          onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                        >
                          <option value="1st Year" className="bg-[#1A1F1A]">1st Year (Freshman)</option>
                          <option value="2nd Year" className="bg-[#1A1F1A]">2nd Year (Sophomore)</option>
                          <option value="3rd Year" className="bg-[#1A1F1A]">3rd Year (Junior)</option>
                          <option value="4th Year" className="bg-[#1A1F1A]">4th Year (Senior)</option>
                          <option value="5th Year / PG" className="bg-[#1A1F1A]">5th Year / Postgraduate</option>
                        </select>
                      </div>

                      {/* Desired Council Role */}
                      <div className="sm:col-span-2">
                        <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                          Role Type
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => {
                            const newRole = e.target.value as any;
                            setFormData({
                              ...formData,
                              role: newRole,
                              ...(newRole === "Journalist" ? { pref1Committee: "ip_journalism" } : {}),
                              ...(newRole === "Photographer" ? { pref1Committee: "ip_photojournalism" } : {})
                            });
                          }}
                          className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                        >
                          <option value="Delegate" className="bg-[#1A1F1A]">Committee Delegate</option>
                          <option value="Journalist" className="bg-[#1A1F1A]">International Press (Journalist)</option>
                          <option value="Photographer" className="bg-[#1A1F1A]">International Press (Photojournalist)</option>
                        </select>
                      </div>

                      {/* Photo of School / College ID Upload Option */}
                      <div className="sm:col-span-2 border border-[#8A9A7E]/30 bg-[#1A1F1A] p-4 text-left">
                        <div className="mb-2">
                          <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-[#C9A86A]" />
                            Photo of  College ID (Optional)
                          </label>
                          <p className="text-[11px] text-[#8A9A7E] mt-0.5 leading-relaxed">
                            Attach a clear photo or scanned copy of your student identity card or bonafide letter for campus security verification.
                          </p>
                        </div>
                        <FileUploadZone
                          label="Upload School or College ID Card"
                          sublabel="Attach photo/scan (JPG/PNG/PDF, max 5MB) or provide Google Drive link"
                          fileType="image"
                          maxSizeMB={5}
                          valueUrl={formData.idCardUrl}
                          valueName={formData.idCardName}
                          onChange={(url, name) => setFormData({ ...formData, idCardUrl: url, idCardName: name })}
                          onClear={() => setFormData({ ...formData, idCardUrl: "", idCardName: "" })}
                        />
                      </div>

                      {/* Campus Ambassador Referral Code */}
                      <div className="sm:col-span-2 border border-[#8BA06F]/40 bg-[#1A1F1A] p-4 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                          <label className="block font-sans text-[10px] uppercase tracking-wider text-[#8BA06F] font-semibold flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5 text-[#8BA06F]" />
                            Campus Ambassador Code (Optional)
                          </label>
                        </div>
                        <input
                          type="text"
                          value={formData.campusAmbassadorCode}
                          onChange={(e) => setFormData({ ...formData, campusAmbassadorCode: e.target.value.toUpperCase() })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#233124] px-4 py-2.5 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#8BA06F] font-mono tracking-wider transition-all"
                          placeholder="e.g. CA-2027-XXXX or Ambassador Code"
                        />
                      </div>
                    </div>
                  </div>

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
                      className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      Next: Portfolio Preferences
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STAGE 3: PORTFOLIO PREFERENCES & MOTIVATION             */}
              {/* ======================================================== */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Stage 3: Council Preferences & Dossier
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8A9A7E] mt-1 leading-relaxed">
                      Select your council priorities and preferred sovereign portfolio or press bureau.
                    </p>
                  </div>

                  {/* Prior Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Prior MUN Experience Level *
                      </label>
                      <select
                        value={formData.munExperience}
                        onChange={(e) => setFormData({ ...formData, munExperience: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                      >
                        <option value="None" className="bg-[#1A1F1A]">First-Time Delegate (0 Conferences)</option>
                        <option value="1-2" className="bg-[#1A1F1A]">Beginner (1–2 Conferences)</option>
                        <option value="3-5" className="bg-[#1A1F1A]">Intermediate (3–5 Conferences)</option>
                        <option value="5+" className="bg-[#1A1F1A]">Veteran / Experienced (6+ Conferences)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                        Previous Accolades / Notable Committees (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.pastMunDetails}
                        onChange={(e) => setFormData({ ...formData, pastMunDetails: e.target.value })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A]"
                        placeholder="e.g. Best Delegate (UNSC), High Commendation (COPUOS)"
                      />
                    </div>
                  </div>

                  {/* 3 Preference Selectors with 5 Mandatory Portfolios Each */}
                  <div className="space-y-5">
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold">
                        Council &amp; Committee Preferences (Ranked 1 to 3) *
                      </label>
                      <p className="text-[11px] text-[#8A9A7E] mt-0.5">
                        Select your preferred simulation chambers and specify exactly 5 ranked portfolio / country choices for each committee. All 5 portfolio choices per committee are mandatory (Note: N/A for IP).
                      </p>
                      {/* Global NES'75 Portfolio Link Callout */}
                      <div className="mt-2.5 p-3 bg-[#1A1F1A] border border-[#C9A86A]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-[#C9A86A] shrink-0" />
                          <div className="text-left">
                            <span className="text-xs text-[#EDE6D3] block">
                              Interested in <strong className="text-[#C9A86A]">National Emergency Summit 1975 (NES'75)</strong>?
                            </span>
                            <span className="text-[10px] text-[#8A9A7E] block">
                              Note: The NES'75 portfolio reference sheet is just a suggestion.
                            </span>
                          </div>
                        </div>
                        <a
                          href={NES75_PORTFOLIO_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A86A] hover:text-[#e0c388] transition-colors shrink-0"
                        >
                          <span>Open NES'75 Portfolio Reference Sheet</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Preference 1 Card */}
                    <div className="p-4 sm:p-5 border border-[#C9A86A] bg-[#2E3B2F]/80 shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold bg-[#1A1F1A] px-2 py-0.5 border border-[#C9A86A]/40">
                            1st Preference *
                          </span>
                          <span className="text-xs font-serif font-bold text-[#EDE6D3]">Primary Preference</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#C9A86A]">All 5 Portfolios Required</span>
                      </div>

                      <div className="mb-3">
                        <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                          Select Committee *
                        </label>
                        <select
                          value={formData.pref1Committee}
                          onChange={(e) => setFormData({ ...formData, pref1Committee: e.target.value })}
                          className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-medium"
                        >
                          {PRIORITY_COMMITTEES.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#1A1F1A]">
                              {c.abbreviation} - {c.name}
                            </option>
                          ))}
                        </select>
                        {errors.pref1Committee && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.pref1Committee}</p>}

                        {/* NES'75 Portfolio Reference Sheet Link */}
                        {formData.pref1Committee === "nes75" && (
                          <div className="mt-2.5 p-3 bg-[#141814] border border-[#C9A86A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-[#C9A86A] shrink-0" />
                              <div className="text-left">
                                <span className="font-serif text-xs font-bold text-[#EDE6D3] block">
                                  NES'75 Portfolio Reference Matrix
                                </span>
                                <span className="text-[10px] text-[#8A9A7E] block">
                                  Review available cabinet portfolios, ministers, and opposition leaders. <strong className="text-[#C9A86A]">Note:</strong> The portfolio link is just a suggestion.
                                </span>
                              </div>
                            </div>
                            <a
                              href={NES75_PORTFOLIO_LINK}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] font-sans font-bold text-[10px] uppercase tracking-wider shrink-0 transition-colors shadow"
                            >
                              <span>View Portfolios</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* 5 Portfolio Inputs for Preference 1 */}
                      <div className="pt-3 border-t border-[#8A9A7E]/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold">
                            5 Portfolio / Country Choices for 1st Preference (Ranked 1 to 5) *
                          </label>
                          <span className="text-[10px] font-mono text-[#C9A86A]/90 bg-[#1A1F1A] px-2 py-0.5 border border-[#C9A86A]/30 self-start sm:self-auto font-medium">
                            Note: N/A for IP
                          </span>
                        </div>
                        {formData.pref1Committee.startsWith("ip") && (
                          <div className="mb-2.5 p-2 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[11px] text-[#EDE6D3] flex items-center gap-2">
                            <span className="text-[#C9A86A] font-semibold">Note:</span> Portfolio selection is N/A for International Press (IP). You may enter "N/A" or leave empty.
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                          {[0, 1, 2, 3, 4].map((idx) => (
                            <div key={idx}>
                              <span className="block text-[9px] font-mono text-[#8A9A7E] mb-1">
                                Portfolio {idx + 1} {formData.pref1Committee.startsWith("ip") ? "(Optional)" : "*"}
                              </span>
                              <input
                                type="text"
                                value={formData.pref1Portfolios[idx] || ""}
                                onChange={(e) => {
                                  const next = [...formData.pref1Portfolios];
                                  next[idx] = e.target.value;
                                  setFormData({ ...formData, pref1Portfolios: next });
                                  if (errors.pref1Portfolios) {
                                    setErrors({ ...errors, pref1Portfolios: "" });
                                  }
                                }}
                                className={`w-full border ${errors.pref1Portfolios && !formData.pref1Portfolios[idx]?.trim() ? "border-rose-400 bg-rose-950/20" : "border-[#8A9A7E]/30"} bg-[#1A1F1A] px-3 py-2 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/40 outline-none focus:border-[#C9A86A] transition-all font-medium`}
                                placeholder={
                                  formData.pref1Committee === "nes75"
                                    ? `NES'75 Leader #${idx + 1}`
                                    : formData.pref1Committee.startsWith("ip")
                                      ? `N/A for IP`
                                      : `Country Choice #${idx + 1}`
                                }
                              />
                            </div>
                          ))}
                        </div>
                        {errors.pref1Portfolios && (
                          <p className="text-[10px] text-rose-400 mt-1.5 font-semibold">{errors.pref1Portfolios}</p>
                        )}
                      </div>
                    </div>

                    {/* Preference 2 Card */}
                    <div className="p-4 sm:p-5 border border-[#8A9A7E]/30 bg-[#1A1F1A] hover:border-[#C9A86A]/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold bg-[#2E3B2F] px-2 py-0.5 border border-[#8A9A7E]/40">
                            2nd Preference *
                          </span>
                          <span className="text-xs font-serif font-bold text-[#EDE6D3]">Alternate Preference 1</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8A9A7E]">All 5 Portfolios Required</span>
                      </div>

                      <div className="mb-3">
                        <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                          Select Committee *
                        </label>
                        <select
                          value={formData.pref2Committee}
                          onChange={(e) => setFormData({ ...formData, pref2Committee: e.target.value })}
                          className="w-full border border-[#8A9A7E]/40 bg-[#141814] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-medium"
                        >
                          {PRIORITY_COMMITTEES.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#1A1F1A]">
                              {c.abbreviation} - {c.name}
                            </option>
                          ))}
                        </select>
                        {errors.pref2Committee && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.pref2Committee}</p>}

                        {/* NES'75 Portfolio Reference Sheet Link */}
                        {formData.pref2Committee === "nes75" && (
                          <div className="mt-2.5 p-3 bg-[#141814] border border-[#C9A86A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-[#C9A86A] shrink-0" />
                              <div className="text-left">
                                <span className="font-serif text-xs font-bold text-[#EDE6D3] block">
                                  NES'75 Portfolio Reference Matrix
                                </span>
                                <span className="text-[10px] text-[#8A9A7E] block">
                                  Review available cabinet portfolios, ministers, and opposition leaders. <strong className="text-[#C9A86A]">Note:</strong> The portfolio link is just a suggestion.
                                </span>
                              </div>
                            </div>
                            <a
                              href={NES75_PORTFOLIO_LINK}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] font-sans font-bold text-[10px] uppercase tracking-wider shrink-0 transition-colors shadow"
                            >
                              <span>View Portfolios</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* 5 Portfolio Inputs for Preference 2 */}
                      <div className="pt-3 border-t border-[#8A9A7E]/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold">
                            5 Portfolio / Country Choices for 2nd Preference (Ranked 1 to 5) *
                          </label>
                          <span className="text-[10px] font-mono text-[#C9A86A]/90 bg-[#1A1F1A] px-2 py-0.5 border border-[#C9A86A]/30 self-start sm:self-auto font-medium">
                            Note: N/A for IP
                          </span>
                        </div>
                        {formData.pref2Committee.startsWith("ip") && (
                          <div className="mb-2.5 p-2 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[11px] text-[#EDE6D3] flex items-center gap-2">
                            <span className="text-[#C9A86A] font-semibold">Note:</span> Portfolio selection is N/A for International Press (IP). You may enter "N/A" or leave empty.
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                          {[0, 1, 2, 3, 4].map((idx) => (
                            <div key={idx}>
                              <span className="block text-[9px] font-mono text-[#8A9A7E] mb-1">
                                Portfolio {idx + 1} {formData.pref2Committee.startsWith("ip") ? "(Optional)" : "*"}
                              </span>
                              <input
                                type="text"
                                value={formData.pref2Portfolios[idx] || ""}
                                onChange={(e) => {
                                  const next = [...formData.pref2Portfolios];
                                  next[idx] = e.target.value;
                                  setFormData({ ...formData, pref2Portfolios: next });
                                  if (errors.pref2Portfolios) {
                                    setErrors({ ...errors, pref2Portfolios: "" });
                                  }
                                }}
                                className={`w-full border ${errors.pref2Portfolios && !formData.pref2Portfolios[idx]?.trim() ? "border-rose-400 bg-rose-950/20" : "border-[#8A9A7E]/30"} bg-[#141814] px-3 py-2 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/40 outline-none focus:border-[#C9A86A] transition-all font-medium`}
                                placeholder={
                                  formData.pref2Committee === "nes75"
                                    ? `NES'75 Leader #${idx + 1}`
                                    : formData.pref2Committee.startsWith("ip")
                                      ? `N/A for IP`
                                      : `Country Choice #${idx + 1}`
                                }
                              />
                            </div>
                          ))}
                        </div>
                        {errors.pref2Portfolios && (
                          <p className="text-[10px] text-rose-400 mt-1.5 font-semibold">{errors.pref2Portfolios}</p>
                        )}
                      </div>
                    </div>

                    {/* Preference 3 Card */}
                    <div className="p-4 sm:p-5 border border-[#8A9A7E]/30 bg-[#1A1F1A] hover:border-[#C9A86A]/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[9px] uppercase tracking-widest text-[#8A9A7E] font-bold bg-[#2E3B2F] px-2 py-0.5 border border-[#8A9A7E]/40">
                            3rd Preference *
                          </span>
                          <span className="text-xs font-serif font-bold text-[#EDE6D3]">Alternate Preference 2</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8A9A7E]">All 5 Portfolios Required</span>
                      </div>

                      <div className="mb-3">
                        <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                          Select Committee *
                        </label>
                        <select
                          value={formData.pref3Committee}
                          onChange={(e) => setFormData({ ...formData, pref3Committee: e.target.value })}
                          className="w-full border border-[#8A9A7E]/40 bg-[#141814] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-medium"
                        >
                          {PRIORITY_COMMITTEES.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#1A1F1A]">
                              {c.abbreviation} - {c.name}
                            </option>
                          ))}
                        </select>
                        {errors.pref3Committee && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.pref3Committee}</p>}

                        {/* NES'75 Portfolio Reference Sheet Link */}
                        {formData.pref3Committee === "nes75" && (
                          <div className="mt-2.5 p-3 bg-[#141814] border border-[#C9A86A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-[#C9A86A] shrink-0" />
                              <div className="text-left">
                                <span className="font-serif text-xs font-bold text-[#EDE6D3] block">
                                  NES'75 Portfolio Reference Matrix
                                </span>
                                <span className="text-[10px] text-[#8A9A7E] block">
                                  Review available cabinet portfolios, ministers, and opposition leaders. <strong className="text-[#C9A86A]">Note:</strong> The portfolio link is just a suggestion.
                                </span>
                              </div>
                            </div>
                            <a
                              href={NES75_PORTFOLIO_LINK}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] font-sans font-bold text-[10px] uppercase tracking-wider shrink-0 transition-colors shadow"
                            >
                              <span>View Portfolios</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* 5 Portfolio Inputs for Preference 3 */}
                      <div className="pt-3 border-t border-[#8A9A7E]/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold">
                            5 Portfolio / Country Choices for 3rd Preference (Ranked 1 to 5) *
                          </label>
                          <span className="text-[10px] font-mono text-[#C9A86A]/90 bg-[#1A1F1A] px-2 py-0.5 border border-[#C9A86A]/30 self-start sm:self-auto font-medium">
                            Note: N/A for IP
                          </span>
                        </div>
                        {formData.pref3Committee.startsWith("ip") && (
                          <div className="mb-2.5 p-2 bg-[#1A1F1A] border border-[#C9A86A]/30 text-[11px] text-[#EDE6D3] flex items-center gap-2">
                            <span className="text-[#C9A86A] font-semibold">Note:</span> Portfolio selection is N/A for International Press (IP). You may enter "N/A" or leave empty.
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                          {[0, 1, 2, 3, 4].map((idx) => (
                            <div key={idx}>
                              <span className="block text-[9px] font-mono text-[#8A9A7E] mb-1">
                                Portfolio {idx + 1} {formData.pref3Committee.startsWith("ip") ? "(Optional)" : "*"}
                              </span>
                              <input
                                type="text"
                                value={formData.pref3Portfolios[idx] || ""}
                                onChange={(e) => {
                                  const next = [...formData.pref3Portfolios];
                                  next[idx] = e.target.value;
                                  setFormData({ ...formData, pref3Portfolios: next });
                                  if (errors.pref3Portfolios) {
                                    setErrors({ ...errors, pref3Portfolios: "" });
                                  }
                                }}
                                className={`w-full border ${errors.pref3Portfolios && !formData.pref3Portfolios[idx]?.trim() ? "border-rose-400 bg-rose-950/20" : "border-[#8A9A7E]/30"} bg-[#141814] px-3 py-2 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/40 outline-none focus:border-[#C9A86A] transition-all font-medium`}
                                placeholder={
                                  formData.pref3Committee === "nes75"
                                    ? `NES'75 Leader #${idx + 1}`
                                    : formData.pref3Committee.startsWith("ip")
                                      ? `N/A for IP`
                                      : `Country Choice #${idx + 1}`
                                }
                              />
                            </div>
                          ))}
                        </div>
                        {errors.pref3Portfolios && (
                          <p className="text-[10px] text-rose-400 mt-1.5 font-semibold">{errors.pref3Portfolios}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Allotment Priority Preference: 2 Checkboxes */}
                  <div className="p-4 sm:p-5 border border-[#8A9A7E]/30 bg-[#1A1F1A]">
                    <div className="mb-3">
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold">
                        Allotment Priority Preference *
                      </label>
                      <p className="text-[11px] text-[#8A9A7E] mt-0.5">
                        In case of high candidate contention during allocation, indicate whether you prioritize your Committee choice or your Portfolio choice:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Checkbox 1: Prioritize Committee */}
                      <div
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            priorityPreference: prev.priorityPreference === "committee" ? undefined : "committee"
                          }));
                          if (errors.priorityPreference) {
                            setErrors(prev => ({ ...prev, priorityPreference: "" }));
                          }
                        }}
                        className={`p-3.5 border cursor-pointer transition-all flex items-start gap-3 select-none ${formData.priorityPreference === "committee"
                          ? "border-[#C9A86A] bg-[#2E3B2F] shadow-md"
                          : "border-[#8A9A7E]/30 bg-[#141814] hover:border-[#C9A86A]/40"
                          }`}
                      >
                        <input
                          type="checkbox"
                          id="priorityCommitteeCheckbox"
                          checked={formData.priorityPreference === "committee"}
                          onChange={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({
                              ...prev,
                              priorityPreference: e.target.checked ? "committee" : undefined
                            }));
                            if (errors.priorityPreference) {
                              setErrors(prev => ({ ...prev, priorityPreference: "" }));
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded-none accent-[#C9A86A] cursor-pointer"
                        />
                        <div>
                          <span className="font-sans text-xs text-[#EDE6D3] font-bold block">
                            Prioritize Committee
                          </span>
                          <span className="font-sans text-[11px] text-[#8A9A7E] block mt-0.5 leading-relaxed">
                            I prefer being allotted to my top committee, even if assigned an alternate portfolio/country.
                          </span>
                        </div>
                      </div>

                      {/* Checkbox 2: Prioritize Portfolio */}
                      <div
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            priorityPreference: prev.priorityPreference === "portfolio" ? undefined : "portfolio"
                          }));
                          if (errors.priorityPreference) {
                            setErrors(prev => ({ ...prev, priorityPreference: "" }));
                          }
                        }}
                        className={`p-3.5 border cursor-pointer transition-all flex items-start gap-3 select-none ${formData.priorityPreference === "portfolio"
                          ? "border-[#C9A86A] bg-[#2E3B2F] shadow-md"
                          : "border-[#8A9A7E]/30 bg-[#141814] hover:border-[#C9A86A]/40"
                          }`}
                      >
                        <input
                          type="checkbox"
                          id="priorityPortfolioCheckbox"
                          checked={formData.priorityPreference === "portfolio"}
                          onChange={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({
                              ...prev,
                              priorityPreference: e.target.checked ? "portfolio" : undefined
                            }));
                            if (errors.priorityPreference) {
                              setErrors(prev => ({ ...prev, priorityPreference: "" }));
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded-none accent-[#C9A86A] cursor-pointer"
                        />
                        <div>
                          <span className="font-sans text-xs text-[#EDE6D3] font-bold block">
                            Prioritize Portfolio
                          </span>
                          <span className="font-sans text-[11px] text-[#8A9A7E] block mt-0.5 leading-relaxed">
                            I prefer representing my top portfolio/country choice, even if placed in an alternate committee.
                          </span>
                        </div>
                      </div>
                    </div>
                    {errors.priorityPreference && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-2">{errors.priorityPreference}</p>
                    )}
                  </div>

                  {/* Statement of Motivation */}
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1.5 font-semibold">
                      Statement of Motivation & Diplomatic Intent (Min 20 characters) *
                    </label>
                    <textarea
                      rows={4}
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      className="w-full border border-[#8A9A7E]/30 bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] resize-none leading-relaxed font-medium transition-all"
                      placeholder="Outline your background, interest in multilateral diplomacy, environmental sustainability, space security, or why you wish to represent these particular portfolios..."
                    />
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      {errors.motivation ? (
                        <p className="text-rose-400 font-semibold">{errors.motivation}</p>
                      ) : (
                        <span className="text-[#8A9A7E]">Share your substantive debate interests</span>
                      )}
                      <span className={`font-mono ${formData.motivation.length >= 20 ? "text-[#C9A86A]" : "text-[#8A9A7E]"}`}>
                        {formData.motivation.length} / 20 min characters
                      </span>
                    </div>
                  </div>

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
                      className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      Next: Fee Payment & Verification
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STAGE 4: PAYMENT, OFFICIAL UPI QR CODE & SUBMISSION      */}
              {/* ======================================================== */}
              {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                      Stage 4: Fee Payment & Transaction Verification
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8A9A7E] mt-1 leading-relaxed">
                      Complete your Priority Round registration fee payment using the official QR code or UPI ID, or complete payment later (payment is non-mandatory).
                    </p>
                  </div>

                  {/* Dynamic Fee Calculation Card */}
                  <div className="border border-[#C9A86A]/40 bg-[#2E3B2F]/70 p-5 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#C9A86A]/20 pb-4">
                      <div>
                        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-bold block">
                          Priority Round Assessment
                        </span>
                        <h3 className="font-serif text-xl font-normal text-[#EDE6D3] mt-0.5">
                          {isIISTInstitution(formData.institution)
                            ? "IIST Delegate Priority Fee"
                            : formData.hasMerch
                              ? "College Delegate Priority Fee + Merch"
                              : "College Delegate Priority Fee"}
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
                        <strong className="text-[#EDE6D3]">
                          ₹1,299
                        </strong>
                      </div>
                      {!isIISTInstitution(formData.institution) && formData.hasMerch && (
                        <div>
                          <span>Merch ({formData.merchSize}):</span>{" "}
                          <strong className="text-emerald-400">
                            +₹599
                          </strong>
                        </div>
                      )}
                      <div>
                        <span>Accreditation Round:</span>{" "}
                        <strong className="text-[#EDE6D3]">
                          Priority Intake
                        </strong>
                      </div>
                      <div>
                        <span>Portfolio Allotment:</span>{" "}
                        <strong className="text-emerald-400">Priority Tier</strong>
                      </div>
                    </div>
                  </div>

                  {/* Merchandise Management Banner (Non-IIST Students Only) */}
                  {!isIISTInstitution(formData.institution) && (
                    <div className="border border-[#C9A86A]/30 bg-[#1A1F1A] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#2E3B2F] border border-[#C9A86A]/40 flex items-center justify-center text-[#C9A86A] shrink-0">
                          <Shirt className="h-5 w-5" />
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
                                Selected Size: <strong className="text-[#C9A86A] font-mono font-bold">{formData.merchSize}</strong> • Included in your total payment
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-[#EDE6D3] block">
                                Official Conference T-Shirt (Optional Upgrade)
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
                              className="px-3 py-1.5 border border-[#C9A86A] text-[#C9A86A] hover:bg-[#C9A86A]/10 text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Change Size
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
                  <div className="border-2 border-[#C9A86A] bg-[#141814] p-6 text-center relative overflow-hidden shadow-2xl">
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

                      {/* Payment Credentials & Step-by-Step Instructions */}
                      <div className="text-left space-y-3.5">
                        <div className="space-y-1">
                          <span className="font-sans text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                            Direct UPI ID
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-bold text-[#C9A86A] bg-[#1A1F1A] px-3.5 py-1.5 border border-[#C9A86A]/40 inline-block select-all">
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
                        <div className="border border-[#8A9A7E]/30 bg-[#1A1F1A] p-3 text-[11px] text-[#EDE6D3] space-y-1.5 leading-relaxed">
                          <div className="flex items-start gap-1.5">
                            <span className="text-[#C9A86A] font-bold">1.</span>
                            <span>Scan the official QR code or pay to <strong className="text-[#C9A86A]">arnav.tpj@oksbi</strong> (Optional at registration).</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-[#C9A86A] font-bold">2.</span>
                            <span>If paid, copy the <strong>12-digit UTR / UPI Transaction Reference Number</strong> from your payment receipt.</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-[#C9A86A] font-bold">3.</span>
                            <span>Enter the UTR number and upload the screenshot proof below if available, or proceed without payment to submit your priority dossier.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campus Ambassador Referral Code Card */}
                  <div className="border border-[#8BA06F]/50 bg-[#1A1F1A] p-5 text-left shadow-lg">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#8BA06F]/20">
                      <Award className="h-4 w-4 text-[#8BA06F]" />
                      <span className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-bold">
                        Campus Ambassador Referral Code
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-sans text-[10px] uppercase tracking-wider text-[#EDE6D3] font-semibold">
                        Campus Ambassador Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.campusAmbassadorCode}
                        onChange={(e) => setFormData({ ...formData, campusAmbassadorCode: e.target.value.toUpperCase() })}
                        className="w-full border border-[#8A9A7E]/30 bg-[#233124] px-4 py-2.5 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#8BA06F] font-mono tracking-wider transition-all"
                        placeholder="e.g. CA-2027-XXXX or Ambassador Code"
                      />
                    </div>
                  </div>

                  {/* Payment Verification Input Fields */}
                  <div className="border border-[#8A9A7E]/30 bg-[#1A1F1A]/80 p-5 space-y-4">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold block flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#C9A86A]" />
                      Payment Transaction Credentials
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Payment Mode */}
                      <div>
                        <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Payment Mode </label>
                        <select
                          value={formData.paymentMode}
                          onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                        >
                          <option value="UPI" className="bg-[#1A1F1A]">UPI / QR Scan</option>
                          <option value="Google Pay" className="bg-[#1A1F1A]">Google Pay</option>
                          <option value="PhonePe" className="bg-[#1A1F1A]">PhonePe</option>
                          <option value="Paytm" className="bg-[#1A1F1A]">Paytm</option>
                          <option value="Net Banking / IMPS" className="bg-[#1A1F1A]">Net Banking / IMPS Transfer</option>
                        </select>
                      </div>

                      {/* UTR / Transaction ID */}
                      <div>
                        <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">
                          UPI Ref / 12-Digit UTR Number
                        </label>
                        <input
                          type="text"
                          value={formData.utrNumber}
                          onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value, transactionId: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] font-mono"
                          placeholder="e.g. 403819284729"
                        />
                        {errors.utrNumber && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.utrNumber}</p>}
                      </div>

                      {/* Payer Name */}
                      <div>
                        <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">
                          Payer Name (Bank / UPI Account Holder)
                        </label>
                        <input
                          type="text"
                          value={formData.payerName}
                          onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A]"
                          placeholder="Name on bank / UPI account"
                        />
                        {errors.payerName && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.payerName}</p>}
                      </div>

                      {/* Date of Payment */}
                      <div>
                        <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Date of Payment </label>
                        <input
                          type="date"
                          value={formData.paymentDate}
                          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                          className="w-full border border-[#8A9A7E]/30 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A]"
                        />
                      </div>
                    </div>

                    {/* Screenshot Upload Zone */}
                    <div>
                      <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1.5 font-semibold">
                        Payment Confirmation Screenshot (JPEG / PNG / PDF)
                      </label>
                      <FileUploadZone
                        label="Upload UPI Payment Receipt"
                        sublabel="Attach payment screenshot or provide cloud drive link (optional)"
                        fileType="image"
                        maxSizeMB={5}
                        valueUrl={formData.paymentScreenshotUrl}
                        valueName={formData.paymentScreenshotName}
                        onChange={(url, name) => setFormData({ ...formData, paymentScreenshotUrl: url, paymentScreenshotName: name })}
                        onClear={() => setFormData({ ...formData, paymentScreenshotUrl: "", paymentScreenshotName: "" })}
                      />
                    </div>
                  </div>

                  {/* Priority Round Protocol & Guidelines Document Attachment */}
                  <div className="border border-[#C9A86A]/40 bg-[#141814] p-4 sm:p-5 relative overflow-hidden shadow-xl transition-all hover:border-[#C9A86A]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A86A]/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="h-11 w-11 rounded-lg bg-[#C9A86A]/10 border border-[#C9A86A]/30 flex items-center justify-center shrink-0 text-[#C9A86A]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-bold">
                              Official Priority Round Document
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9A7E] bg-[#1A1F1A] border border-[#8A9A7E]/30 px-2 py-0.5">
                              PDF Document
                            </span>
                          </div>
                          <h3 className="font-serif text-sm sm:text-base text-[#EDE6D3] font-medium">
                            Priority Round Guidelines & Allotment Policy
                          </h3>
                          <p className="text-[11px] text-[#8A9A7E] leading-relaxed max-w-xl">
                            Please review the official Priority Round document before checking the declaration and submitting your accreditation dossier.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <a
                          href="/Priority_Round.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                          id="view-priority-round-pdf"
                        >
                          <span>Read in New Tab</span>
                          <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                        </a>
                        <a
                          href="/Priority_Round.pdf"
                          download="Priority_Round.pdf"
                          title="Download Priority Round PDF"
                          className="p-2.5 border border-[#8A9A7E]/40 hover:border-[#C9A86A] bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] transition-all cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Declaration Checkbox */}
                  <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/40 p-4 space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreedToTerms}
                        onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded-none accent-[#C9A86A] cursor-pointer"
                      />
                      <span className="text-xs text-[#EDE6D3] leading-relaxed">
                        I hereby declare that all information furnished in this priority accreditation dossier is accurate, any payment reference provided belongs to my registration, and I have read and agree to the{" "}
                        <a
                          href="/Priority_Round.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#C9A86A] underline hover:text-[#d6b77c] inline-flex items-center gap-0.5 font-semibold"
                        >
                          Priority Round Guidelines (Priority_Round.pdf)
                          <ExternalLink className="h-3 w-3 inline ml-0.5" />
                        </a>{" "}
                        and IISTMUN 2027 conference allotment protocols.
                      </span>
                    </label>
                    {errors.agreedToTerms && (
                      <p className="text-[10px] text-rose-400 font-semibold pl-7">{errors.agreedToTerms}</p>
                    )}
                  </div>

                  {/* Navigation & Submit Buttons */}
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
                      disabled={loading}
                      id="priority-submit-btn"
                      className="flex items-center gap-2 bg-[#C9A86A] hover:bg-[#bfa060] disabled:opacity-50 px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-[#1A1F1A] shadow-lg active:scale-95 transition-all cursor-pointer font-bold"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-[#1A1F1A] border-t-transparent rounded-full animate-spin" />
                          Submitting Accreditation...
                        </>
                      ) : (
                        <>
                          Submit Priority Dossier & Claim Pass
                          <FileText className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}
        {/* ======================================================== */}
        {/* CONDITIONAL INTERMEDIATE STAGE: MERCHANDISE POPUP MODAL  */}
        {/* ======================================================== */}
        <AnimatePresence>
          {showMerchModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative w-full max-w-3xl border-2 border-[#C9A86A] bg-[#1A1F1A] text-[#EDE6D3] shadow-2xl overflow-hidden my-auto text-left"
              >
                {/* Golden accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#C9A86A]/40 via-[#C9A86A] to-[#C9A86A]/40" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleSkipMerch}
                  className="absolute top-4 right-4 p-1.5 text-[#8A9A7E] hover:text-[#EDE6D3] hover:bg-[#2E3B2F] border border-[#8A9A7E]/30 transition-all cursor-pointer z-10"
                  title="Skip and proceed to payment"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="p-5 sm:p-7 space-y-6">
                  {/* Modal Header */}
                  <div className="pr-8">
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
                      Would you like to purchase the official conference merchandise before finalizing your accreditation payment?
                    </p>
                  </div>

                  {/* Main Content Grid: Image Preview (Left) & Selection Panel (Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

                    {/* Left Column: Visual Showcase with Tabs */}
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

                      {/* Image Viewer Container */}
                      <div className="relative border border-[#C9A86A]/40 bg-[#141814] p-3 flex items-center justify-center min-h-[280px] max-h-[320px] overflow-hidden group">
                        {merchViewTab === "front" && (
                          <motion.img
                            key="front"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            src="/merch_front.png"
                            alt="IISTMUN Official Merch Front"
                            className="max-h-[290px] w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
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
                            className="max-h-[290px] w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
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
                            className="max-h-[290px] w-auto object-contain mx-auto"
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

                    {/* Right Column: Details, Size Selection, and CTAs */}
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
                            Choose T-Shirt Size *
                          </label>
                          <button
                            type="button"
                            onClick={() => setMerchViewTab("size_chart")}
                            className="text-[10px] text-[#C9A86A] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                          >
                            <Ruler className="h-3 w-3" />
                            <span>View Size Chart</span>
                          </button>
                        </div>

                        <select
                          value={selectedMerchSize}
                          onChange={(e) => {
                            setSelectedMerchSize(e.target.value);
                            if (merchSizeError) setMerchSizeError("");
                          }}
                          className={`w-full border ${merchSizeError ? "border-rose-400" : "border-[#8A9A7E]/40"
                            } bg-[#141814] px-3.5 py-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-medium transition-all cursor-pointer`}
                        >
                          <option value="" disabled className="bg-[#1A1F1A]">
                            -- Select your size --
                          </option>
                          {MERCH_SIZES.map((sz) => (
                            <option key={sz.value} value={sz.value} className="bg-[#1A1F1A]">
                              {sz.label}
                            </option>
                          ))}
                        </select>
                        {merchSizeError && (
                          <p className="text-[10px] text-rose-400 font-semibold mt-1">{merchSizeError}</p>
                        )}
                      </div>

                      {/* Summary notice */}
                      <div className="text-[11px] text-[#8A9A7E] border-l-2 border-[#C9A86A] pl-3 py-1 bg-[#141814]/60 leading-relaxed">
                        If selected, <strong className="text-[#EDE6D3]">₹599</strong> will be added to your total payment amount (Total: <strong className="text-[#C9A86A]">₹1,898</strong>). Collect your t-shirt at the IISTMUN on-campus kit desk.
                      </div>

                      {/* Action Decision Buttons */}
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
                          <span>No, Skip &amp; Proceed to Payment</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

