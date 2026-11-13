/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { COMMITTEES, COMMITTEE_PORTFOLIOS, COUNTRY_MATRIX } from "../data";
import { SchoolRegistrationDetails, CountryMatrixRow } from "../types";
import {
  GraduationCap, User, Phone, Mail, MapPin,
  Calendar, ShieldCheck, CheckCircle2, AlertCircle,
  Copy, Check, ArrowLeft, ChevronRight, ChevronLeft,
  Sparkles, Download, School, FileText, Globe, Landmark,
  X, CheckSquare, HeartHandshake, Compass,
  QrCode, CreditCard, PartyPopper, ExternalLink
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot, setDoc, deleteDoc, collection } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import FileUploadZone from "./FileUploadZone";
import QRCodeDisplay from "./QRCodeDisplay";
import { downloadBoardingPassPDF } from "../utils/pdfGenerator";
import { 
  getAvailablePortfoliosForCommittee, 
  PortfolioStateMap, 
  getEffectivePortfolioStatus 
} from "../utils/portfolioMatrix";

// Helper to retrieve available portfolios list for any committee based on country matrix
export const getPortfoliosForCommittee = (committeeId: string, overrides: PortfolioStateMap = {}): string[] => {
  return getAvailablePortfoliosForCommittee(committeeId, overrides, COUNTRY_MATRIX);
};

export const SCHOOL_CLASSES = [
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12"
];

// Available committees for School Round (excludes online UNGA committee)
export const SCHOOL_COMMITTEES = COMMITTEES.filter(c => c.id !== "unga");

interface SchoolRegistrationProps {
  initialPreference?: { country?: string; committee?: string } | null;
  clearInitialPreference?: () => void;
  setActiveTab?: (tab: string) => void;
  embedded?: boolean;
}

export default function SchoolRegistration({
  initialPreference,
  clearInitialPreference,
  setActiveTab,
  embedded = false
}: SchoolRegistrationProps) {
  const { user, loading: authLoading, signInWithGoogle, isSigningIn } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [copiedTicketId, setCopiedTicketId] = useState(false);
  const [submittedPass, setSubmittedPass] = useState<SchoolRegistrationDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const boardingPassRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Personal Details
    name: "",
    email: "",
    phone: "",
    gender: "Prefer not to say",
    dob: "",
    cityState: "",
    fullAddress: "",

    // Guardian / Emergency Contact
    emergencyContactName: "",
    emergencyContactRelation: "Parent",
    emergencyContactPhone: "",

    // Identity Clearance (Mandatory)
    aadharNumber: "",
    aadharPhotoUrl: "",
    aadharPhotoName: "",
    idCardUrl: "",
    idCardName: "",

    // School Details
    institution: "",
    classGrade: "Class 11",
    rollNumber: "",

    // Model UN Experience
    munExperience: "None",
    pastMunDetails: "",

    // 3 Committee & Portfolio Preferences (Dropdowns, excludes UNGA)
    pref1Committee: (initialPreference?.committee && initialPreference.committee !== "unga")
      ? initialPreference.committee
      : "uncopuos",
    pref1Country: (initialPreference?.committee !== "unga" ? initialPreference?.country : "") || "",
    pref2Committee: "unhrc",
    pref2Country: "",
    pref3Committee: "unodc",
    pref3Country: "",
    motivation: "",

    // Logistics
    accommodationRequired: "no" as "yes" | "no",

    // Delegate Socials & Fee Payment
    attendingSocials: false,
    paymentMode: "UPI",
    transactionId: "",
    utrNumber: "",
    payerName: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentScreenshotUrl: "",
    paymentScreenshotName: ""
  });

  const [copiedUpi, setCopiedUpi] = useState(false);
  const handleCopyUpi = () => {
    navigator.clipboard.writeText("arnav.tpj@oksbi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };
  const calculatedFee = formData.attendingSocials ? 1148 : 999;

  // Live synchronization with Country Matrix & Portfolio States
  const [portfolioOverrides, setPortfolioOverrides] = useState<PortfolioStateMap>({});
  const [matrixRows, setMatrixRows] = useState<CountryMatrixRow[]>(COUNTRY_MATRIX);

  useEffect(() => {
    const unsubOverrides = onSnapshot(collection(db, "portfolio_states"), (snapshot) => {
      const overrides: PortfolioStateMap = {};
      snapshot.forEach(docSnap => {
        overrides[docSnap.id] = docSnap.data() as any;
      });
      setPortfolioOverrides(overrides);
    }, () => {
      // Fallback to local server API
      fetch("/api/portfolio-states")
        .then(res => res.json())
        .then(json => {
          if (json && json.status === "success" && json.data) {
            setPortfolioOverrides(json.data);
          }
        })
        .catch(() => {});
    });

    const unsubMatrix = onSnapshot(collection(db, "country_matrix"), (snapshot) => {
      if (!snapshot.empty && snapshot.size >= 100) {
        const rows: CountryMatrixRow[] = [];
        snapshot.forEach(docSnap => rows.push(docSnap.data() as CountryMatrixRow));
        setMatrixRows(rows);
      }
    }, () => {});

    return () => {
      unsubOverrides();
      unsubMatrix();
    };
  }, []);

  // Compute available portfolios for each preference from Country Matrix & Overrides
  const availablePref1 = useMemo(() => {
    return getAvailablePortfoliosForCommittee(formData.pref1Committee, portfolioOverrides, matrixRows);
  }, [formData.pref1Committee, portfolioOverrides, matrixRows]);

  const availablePref2 = useMemo(() => {
    return getAvailablePortfoliosForCommittee(formData.pref2Committee, portfolioOverrides, matrixRows);
  }, [formData.pref2Committee, portfolioOverrides, matrixRows]);

  const availablePref3 = useMemo(() => {
    return getAvailablePortfoliosForCommittee(formData.pref3Committee, portfolioOverrides, matrixRows);
  }, [formData.pref3Committee, portfolioOverrides, matrixRows]);

  // Ensure portfolio options default nicely when committee or availability changes
  useEffect(() => {
    if (availablePref1.length > 0 && (!formData.pref1Country || !availablePref1.includes(formData.pref1Country))) {
      setFormData(prev => ({ ...prev, pref1Country: availablePref1[0] }));
    }
  }, [availablePref1]);

  useEffect(() => {
    if (availablePref2.length > 0 && (!formData.pref2Country || !availablePref2.includes(formData.pref2Country))) {
      setFormData(prev => ({ ...prev, pref2Country: availablePref2[0] }));
    }
  }, [availablePref2]);

  useEffect(() => {
    if (availablePref3.length > 0 && (!formData.pref3Country || !availablePref3.includes(formData.pref3Country))) {
      setFormData(prev => ({ ...prev, pref3Country: availablePref3[0] }));
    }
  }, [availablePref3]);

  // Autofill user credentials if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

  // Sync external initial preference (excluding UNGA online committee)
  useEffect(() => {
    if (initialPreference && initialPreference.committee && initialPreference.committee !== "unga") {
      setFormData(prev => ({
        ...prev,
        pref1Committee: initialPreference.committee || prev.pref1Committee,
        pref1Country: initialPreference.country || prev.pref1Country
      }));
      if (clearInitialPreference) {
        clearInitialPreference();
      }
    }
  }, [initialPreference, clearInitialPreference]);

  // Check if existing registration exists in Firestore or local API for this user
  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | null = null;

    try {
      const docRef = doc(db, "school_registrations", user.uid);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SchoolRegistrationDetails;
          setSubmittedPass(data);
        } else {
          // Check local server backup
          fetch("/api/school-registrations")
            .then(res => res.json())
            .then(json => {
              if (json && json.status === "success" && Array.isArray(json.data)) {
                const found = json.data.find((r: any) =>
                  (user.uid && (r.userId === user.uid || r.uid === user.uid || r.id === user.uid)) ||
                  (user.email && r.email && r.email.toLowerCase() === user.email.toLowerCase())
                );
                if (found) {
                  setSubmittedPass(found);
                }
              }
            })
            .catch(() => { });
        }
      }, () => { });
    } catch {
      // Ignore initial subscription issues
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Step Validation
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = "Full name is required.";
      if (!formData.email.trim()) {
        newErrors.email = "Email address is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone / WhatsApp number is required.";
      } else {
        const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
        if (cleanPhone.length < 10) {
          newErrors.phone = "Please enter a valid 10-digit mobile number.";
        }
      }
      if (!formData.dob) newErrors.dob = "Date of birth is required.";
      if (!formData.cityState.trim()) newErrors.cityState = "City and State are required.";
      if (!formData.emergencyContactName.trim()) {
        newErrors.emergencyContactName = "Parent / Guardian name is required.";
      }
      if (!formData.emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = "Emergency contact phone is required.";
      } else {
        const cleanEmer = formData.emergencyContactPhone.replace(/[^0-9]/g, "");
        if (cleanEmer.length < 10) {
          newErrors.emergencyContactPhone = "Please enter a valid 10-digit emergency contact number.";
        }
      }
    }

    if (currentStep === 2) {
      if (!formData.institution.trim()) newErrors.institution = "School name is required.";
      if (!formData.classGrade) newErrors.classGrade = "Please select your current class/grade.";

      // Mandatory Aadhaar or Passport validation
      const rawAadhar = formData.aadharNumber.replace(/\s+/g, "").toUpperCase();
      if (!rawAadhar) {
        newErrors.aadharNumber = "Aadhaar or Passport Number is mandatory for campus security clearance.";
      } else if (/^\d+$/.test(rawAadhar)) {
        if (rawAadhar.length !== 12) {
          newErrors.aadharNumber = "Aadhaar number must be exactly 12 digits.";
        }
      } else if (rawAadhar.length < 6 || rawAadhar.length > 15) {
        newErrors.aadharNumber = "Passport number must be 6 to 15 alphanumeric characters.";
      }

      // Mandatory Aadhaar / Passport Document Upload
      if (!formData.aadharPhotoUrl) {
        newErrors.aadharPhotoUrl = "Uploading Aadhaar Card or Passport copy is mandatory.";
      }

      // Mandatory School ID Card Upload
      if (!formData.idCardUrl) {
        newErrors.idCardUrl = "Uploading School ID card / bona fide certificate is mandatory.";
      }
    }

    if (currentStep === 3) {
      if (!formData.pref1Committee) newErrors.pref1Committee = "First preference committee is required.";
      if (!formData.pref1Country) newErrors.pref1Country = "First preference portfolio is required.";
      if (!formData.pref2Committee) newErrors.pref2Committee = "Second preference committee is required.";
      if (!formData.pref2Country) newErrors.pref2Country = "Second preference portfolio is required.";
      if (!formData.pref3Committee) newErrors.pref3Committee = "Third preference committee is required.";
      if (!formData.pref3Country) newErrors.pref3Country = "Third preference portfolio is required.";
    }

    if (currentStep === 4) {
      if (formData.utrNumber.trim()) {
        const cleanUtr = formData.utrNumber.replace(/[^a-zA-Z0-9]/g, "");
        if (cleanUtr.length < 6) {
          newErrors.utrNumber = "Please enter a valid 12-digit UPI reference or UTR transaction number.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      alert("Please check the form for any missing mandatory fields.");
      return;
    }

    setLoading(true);

    const ticketId = `SCH-2027-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const payload: SchoolRegistrationDetails = {
      id: ticketId,
      uid: user?.uid,
      userId: user?.uid || `guest-school-${Date.now()}`,
      timestamp,
      round: "school",
      status: "Pending Verification",

      // Personal Details
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      gender: formData.gender,
      dob: formData.dob,
      cityState: formData.cityState.trim(),
      fullAddress: formData.fullAddress.trim(),

      // Guardian
      emergencyContactName: formData.emergencyContactName.trim(),
      emergencyContactRelation: formData.emergencyContactRelation,
      emergencyContactPhone: formData.emergencyContactPhone.trim(),

      // Mandatory Identity & School Documents
      aadharNumber: formData.aadharNumber.trim(),
      aadharPhotoUrl: formData.aadharPhotoUrl,
      aadharPhotoName: formData.aadharPhotoName || "Aadhaar_Passport.jpg",
      idCardUrl: formData.idCardUrl,
      idCardName: formData.idCardName || "School_ID_Card.jpg",

      // Academic
      institution: formData.institution.trim(),
      classGrade: formData.classGrade,
      rollNumber: formData.rollNumber.trim(),

      // MUN Experience
      munExperience: formData.munExperience,
      pastMunDetails: formData.pastMunDetails.trim(),

      // 3 Preferences (Dropdowns)
      pref1Committee: formData.pref1Committee,
      pref1Country: formData.pref1Country,
      pref2Committee: formData.pref2Committee,
      pref2Country: formData.pref2Country,
      pref3Committee: formData.pref3Committee,
      pref3Country: formData.pref3Country,
      motivation: formData.motivation.trim(),

      // Logistics
      accommodationRequired: formData.accommodationRequired,

      // Delegate Socials & Fee Payment
      attendingSocials: Boolean(formData.attendingSocials),
      feeAmount: calculatedFee,
      paymentMode: formData.paymentMode || "UPI",
      transactionId: formData.utrNumber.trim() || formData.transactionId.trim() || undefined,
      utrNumber: formData.utrNumber.trim() || undefined,
      paymentDate: formData.paymentDate || new Date().toISOString().slice(0, 10),
      paymentScreenshotUrl: formData.paymentScreenshotUrl || undefined,
      paymentScreenshotName: formData.paymentScreenshotName || undefined,
      paymentStatus: (formData.utrNumber.trim() || formData.paymentScreenshotUrl) ? "Pending" : "Pending"
    };

    // Check payload size limit
    const payloadBytes = new Blob([JSON.stringify(payload)]).size;
    if (payloadBytes > 1030000) {
      alert(
        `Application payload (${(payloadBytes / 1024 / 1024).toFixed(2)} MB) exceeds the Firestore document limit (1 MB). ` +
        `Please attach smaller photos or provide link URLs.`
      );
      setLoading(false);
      return;
    }

    try {
      // 1. Persist to Express local backup table
      try {
        await fetch("/api/school-registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (backupErr) {
        console.warn("Local school registrations API write notice:", backupErr);
      }

      // 2. Persist in dedicated Firestore 'school_registrations' collection
      try {
        await setDoc(doc(db, "school_registrations", ticketId), payload);
        if (user?.uid) {
          await setDoc(doc(db, "school_registrations", user.uid), payload);
        }
        console.log("[FIREBASE SUCCESS] School registration persisted to school_registrations:", ticketId);
      } catch (firestoreErr: any) {
        console.error("Firestore 'school_registrations' write error:", firestoreErr);
      }

      setSubmittedPass(payload);
      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(`Submission encountered an issue (${err?.message || "unknown error"}). Please retry or contact secretariat.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTicketId(true);
    setTimeout(() => setCopiedTicketId(false), 2500);
  };

  const handleDownloadPDF = async () => {
    if (!submittedPass) return;
    setIsDownloading(true);
    try {
      const p1CommitteeObj = COMMITTEES.find(c => c.id === submittedPass.pref1Committee);
      await downloadBoardingPassPDF({
        element: boardingPassRef.current,
        ticketId: submittedPass.id,
        candidateName: submittedPass.name,
        registrationType: "mun",
        details: {
          institution: submittedPass.institution,
          courseOrGrade: submittedPass.classGrade,
          chamber: p1CommitteeObj ? p1CommitteeObj.abbreviation : submittedPass.pref1Committee,
          preferredCountry: submittedPass.pref1Country,
          email: submittedPass.email,
          phone: submittedPass.phone,
          timestamp: submittedPass.timestamp
        }
      });
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  // If already registered and submitted pass exists, show boarding pass view
  if (submittedPass) {
    const p1 = COMMITTEES.find(c => c.id === submittedPass.pref1Committee);
    const p2 = COMMITTEES.find(c => c.id === submittedPass.pref2Committee);
    const p3 = COMMITTEES.find(c => c.id === submittedPass.pref3Committee);

    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 text-left">
        {/* Return Button */}
        <button
          onClick={() => {
            if (setActiveTab) setActiveTab("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="group inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.16em] text-[#8A9A7E] hover:text-[#C9A86A] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Return to Convocation Portal
        </button>

        {/* Success Banner */}
        <div className="bg-[#233124] border border-[#C9A86A] p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#C9A86A]">
                <CheckCircle2 className="h-8 w-8 text-[#C9A86A]" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] block">
                  SCHOOL ROUND DOSSIER TRANSMITTED
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                  Accreditation Confirmed
                </h2>
                <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">
                  Your school round delegate application has been lodged in the official registry. Registration fee: ₹{submittedPass.feeAmount || (submittedPass.attendingSocials ? 1148 : 999)}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isDownloading ? "Synthesizing PDF..." : "Download Boarding Pass"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Boarding Pass Card */}
        <div
          ref={boardingPassRef}
          id="school-boarding-pass-print"
          className="bg-[#2E3B2F] border-2 border-[#C9A86A] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A86A]/30 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <img src="/logo-emblem-transparent.png" alt="IISTMUN Crest" className="w-12 h-12 object-contain" />
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C9A86A] block font-bold">
                  OFFICIAL ACCREDITATION PASS &bull; SCHOOL ROUND
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal tracking-wide">
                  IIST Model United Nations 2027
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#1A1F1A] border border-[#C9A86A]/40 px-3.5 py-1.5 self-start sm:self-auto">
              <span className="font-mono text-xs text-[#EDE6D3] font-bold tracking-widest">{submittedPass.id}</span>
              <button
                onClick={() => copyToClipboard(submittedPass.id)}
                className="text-[#8A9A7E] hover:text-[#C9A86A] transition-colors cursor-pointer p-1"
                title="Copy Ticket ID"
              >
                {copiedTicketId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left mb-6">
            <div>
              <span className="font-sans text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                Candidate Name
              </span>
              <span className="font-serif text-lg text-[#EDE6D3] font-medium block mt-0.5">
                {submittedPass.name}
              </span>
              <span className="font-mono text-xs text-[#C9A86A] block mt-0.5">
                {submittedPass.email}
              </span>
            </div>

            <div>
              <span className="font-sans text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                School &amp; Grade
              </span>
              <span className="font-sans text-sm text-[#EDE6D3] font-medium block mt-0.5">
                {submittedPass.institution}
              </span>
              <span className="font-mono text-xs text-[#C9A86A] block mt-0.5">
                {submittedPass.classGrade} {submittedPass.rollNumber ? `&bull; Roll: ${submittedPass.rollNumber}` : ""}
              </span>
            </div>

            <div>
              <span className="font-sans text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                Fee &amp; Socials Night
              </span>
              <span className="font-serif text-lg text-[#C9A86A] font-bold block mt-0.5">
                ₹{submittedPass.feeAmount || (submittedPass.attendingSocials ? 1148 : 999)}
              </span>
              <span className="font-mono text-xs text-[#EDE6D3] block mt-0.5">
                Socials: {submittedPass.attendingSocials ? "Included (+₹149)" : "Not Included"}
              </span>
              <span className="font-mono text-[10px] text-[#8A9A7E] block mt-0.5">
                Status: {submittedPass.status || "Pending Verification"}
                {submittedPass.utrNumber ? ` &bull; UTR: ${submittedPass.utrNumber}` : ""}
              </span>
            </div>
          </div>

          {/* Preferences Summary */}
          <div className="border-t border-[#C9A86A]/20 pt-5 mb-6">
            <span className="font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold block mb-3">
              Ranked Committee &amp; Portfolio Preferences
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#1A1F1A]/80 border border-[#C9A86A]/30">
                <span className="font-mono text-[9px] text-[#C9A86A] uppercase tracking-wider block">
                  1st Preference
                </span>
                <span className="font-sans text-xs text-[#EDE6D3] font-bold block mt-0.5">
                  {p1?.abbreviation || submittedPass.pref1Committee}
                </span>
                <span className="font-mono text-[11px] text-[#8A9A7E] block">
                  Portfolio: <strong className="text-[#EDE6D3]">{submittedPass.pref1Country}</strong>
                </span>
              </div>

              <div className="p-3 bg-[#1A1F1A]/80 border border-[#C9A86A]/20">
                <span className="font-mono text-[9px] text-[#8A9A7E] uppercase tracking-wider block">
                  2nd Preference
                </span>
                <span className="font-sans text-xs text-[#EDE6D3] font-bold block mt-0.5">
                  {p2?.abbreviation || submittedPass.pref2Committee}
                </span>
                <span className="font-mono text-[11px] text-[#8A9A7E] block">
                  Portfolio: <strong className="text-[#EDE6D3]">{submittedPass.pref2Country}</strong>
                </span>
              </div>

              <div className="p-3 bg-[#1A1F1A]/80 border border-[#C9A86A]/20">
                <span className="font-mono text-[9px] text-[#8A9A7E] uppercase tracking-wider block">
                  3rd Preference
                </span>
                <span className="font-sans text-xs text-[#EDE6D3] font-bold block mt-0.5">
                  {p3?.abbreviation || submittedPass.pref3Committee}
                </span>
                <span className="font-mono text-[11px] text-[#8A9A7E] block">
                  Portfolio: <strong className="text-[#EDE6D3]">{submittedPass.pref3Country}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Footer with Security QR Stamp */}
          <div className="border-t border-[#C9A86A]/30 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8A9A7E]">
            <div className="flex items-center gap-3">
              <QRCodeDisplay
                uniqueId={submittedPass.id}
                candidateName={submittedPass.name}
                title="IIST MUN 2026 Boarding Pass"
                subtitle="School Round Security Stamp"
                size={70}
                showScannerTest={false}
              />
              <div className="text-left">
                <span className="text-[10px] text-[#EDE6D3] block font-bold">
                  INDIAN INSTITUTE OF SPACE SCIENCE &amp; TECHNOLOGY
                </span>
                <span className="text-[9px] text-[#8A9A7E] block">
                  Valiamala PO, Thiruvananthapuram, Kerala &bull; 695547
                </span>
                <span className="text-[9px] text-[#C9A86A] block mt-0.5">
                  Aadhaar/Passport: {submittedPass.aadharNumber.replace(/(\d{4})\s*(\d{4})\s*(\d{4})/, "XXXX XXXX $3")}
                </span>
              </div>
            </div>

            <div className="text-right">

              <span className="text-[9px] text-[#8A9A7E] block">
                Lodged at: {submittedPass.timestamp}
              </span>
            </div>
          </div>
        </div>

        {/* New Submission or Retake CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (confirm("Would you like to register another student delegation?")) {
                setSubmittedPass(null);
                setStep(1);
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  gender: "Prefer not to say",
                  dob: "",
                  cityState: "",
                  fullAddress: "",
                  emergencyContactName: "",
                  emergencyContactRelation: "Parent",
                  emergencyContactPhone: "",
                  aadharNumber: "",
                  aadharPhotoUrl: "",
                  aadharPhotoName: "",
                  idCardUrl: "",
                  idCardName: "",
                  institution: "",
                  classGrade: "Class 11",
                  rollNumber: "",
                  munExperience: "None",
                  pastMunDetails: "",
                  pref1Committee: "uncopuos",
                  pref1Country: "",
                  pref2Committee: "unhrc",
                  pref2Country: "",
                  pref3Committee: "unodc",
                  pref3Country: "",
                  motivation: "",
                  accommodationRequired: "no",
                  attendingSocials: false,
                  paymentMode: "UPI",
                  transactionId: "",
                  utrNumber: "",
                  payerName: "",
                  paymentDate: new Date().toISOString().slice(0, 10),
                  paymentScreenshotUrl: "",
                  paymentScreenshotName: ""
                });
              }
            }}
            className="text-xs font-mono uppercase tracking-widest text-[#8A9A7E] hover:text-[#C9A86A] transition-colors underline cursor-pointer"
          >
            Register Another School Delegate
          </button>
        </div>
      </div>
    );
  }

  // Active form view
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 text-left">
      {/* Return Button if not embedded */}
      {!embedded && (
        <button
          onClick={() => {
            if (setActiveTab) setActiveTab("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="group inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.16em] text-[#8A9A7E] hover:text-[#C9A86A] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Return to Portal Convocation
        </button>
      )}

      {/* Hero Header */}
      <div className="bg-[#233124] border border-[#C9A86A] p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] bg-[#1A1F1A] border border-[#C9A86A]/40 px-2.5 py-1">
              SECTION A &bull; SCHOOL REGISTRATIONS
            </span>
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#1A1F1A] bg-[#C9A86A] px-2.5 py-1 font-bold">
              FEE: ₹999 &bull; ₹1,148 WITH SOCIALS
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl text-[#EDE6D3] font-normal tracking-tight">
            School Round Registration Dossier
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#EDE6D3]/80 leading-relaxed font-light">
            Welcome to the dedicated School Delegation round for secondary students (Classes 8 through 12).
            Select your 3 committee and portfolio preferences, upload your required school identity and Aadhaar/Passport documents, and receive your instant accreditation pass.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[#8A9A7E]">
            <div className="flex items-center gap-1.5">
              <School className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>Classes 8 to 12 Eligible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>Mandatory School ID &amp; Aadhaar/Passport Clearance</span>
            </div>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <img src="/logo-emblem-transparent.png" alt="Emblem" className="w-56 h-56 object-contain" />
        </div>
      </div>

      {/* Multi-Step Stepper Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8">
        <div
          onClick={() => step > 1 && setStep(1)}
          className={`p-3 sm:p-4 border transition-all text-left cursor-pointer ${step === 1
            ? "border-[#C9A86A] bg-[#2E3B2F]"
            : step > 1
              ? "border-[#8A9A7E]/50 bg-[#1A1F1A] hover:border-[#C9A86A]/50"
              : "border-[#8A9A7E]/20 bg-[#1A1F1A]/50 opacity-60"
            }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] block">
            STEP 01
          </span>
          <span className="font-serif text-xs sm:text-sm text-[#EDE6D3] font-medium block mt-0.5">
            Student &amp; Guardian
          </span>
        </div>

        <div
          onClick={() => step > 2 && setStep(2)}
          className={`p-3 sm:p-4 border transition-all text-left cursor-pointer ${step === 2
            ? "border-[#C9A86A] bg-[#2E3B2F]"
            : step > 2
              ? "border-[#8A9A7E]/50 bg-[#1A1F1A] hover:border-[#C9A86A]/50"
              : "border-[#8A9A7E]/20 bg-[#1A1F1A]/50 opacity-60"
            }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] block">
            STEP 02
          </span>
          <span className="font-serif text-xs sm:text-sm text-[#EDE6D3] font-medium block mt-0.5">
            School &amp; Verification
          </span>
        </div>

        <div
          onClick={() => step > 3 && setStep(3)}
          className={`p-3 sm:p-4 border transition-all text-left cursor-pointer ${step === 3
            ? "border-[#C9A86A] bg-[#2E3B2F]"
            : step > 3
              ? "border-[#8A9A7E]/50 bg-[#1A1F1A] hover:border-[#C9A86A]/50"
              : "border-[#8A9A7E]/20 bg-[#1A1F1A]/50 opacity-60"
            }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] block">
            STEP 03
          </span>
          <span className="font-serif text-xs sm:text-sm text-[#EDE6D3] font-medium block mt-0.5">
            Chambers &amp; Socials
          </span>
        </div>

        <div
          className={`p-3 sm:p-4 border transition-all text-left ${step === 4
            ? "border-[#C9A86A] bg-[#2E3B2F]"
            : "border-[#8A9A7E]/20 bg-[#1A1F1A]/50 opacity-60"
            }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] block">
            STEP 04
          </span>
          <span className="font-serif text-xs sm:text-sm text-[#EDE6D3] font-medium block mt-0.5">
            Fee &amp; Payment
          </span>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ================= STEP 1: PERSONAL & GUARDIAN DETAILS ================= */}
        {step === 1 && (
          <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#C9A86A]/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE I &bull; CANDIDATE PROFILE
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                Student &amp; Emergency Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Full Name (As on School ID / Certificate) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className={`w-full border ${errors.name ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans`}
                />
                {errors.name && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aarav.sharma@example.com"
                  className={`w-full border ${errors.email ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-mono`}
                />
                {errors.email && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className={`w-full border ${errors.phone ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-mono`}
                />
                {errors.phone && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.phone}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                >
                  <option value="Male" className="bg-[#1A1F1A]">Male</option>
                  <option value="Female" className="bg-[#1A1F1A]">Female</option>
                  <option value="Other" className="bg-[#1A1F1A]">Other</option>
                  <option value="Prefer not to say" className="bg-[#1A1F1A]">Prefer not to say</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className={`w-full border ${errors.dob ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-mono`}
                />
                {errors.dob && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.dob}</p>}
              </div>

              {/* City & State */}
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  City &amp; State *
                </label>
                <input
                  type="text"
                  value={formData.cityState}
                  onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                  placeholder="e.g. Thiruvananthapuram, Kerala"
                  className={`w-full border ${errors.cityState ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans`}
                />
                {errors.cityState && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.cityState}</p>}
              </div>
            </div>

            {/* Emergency / Guardian Contact */}
            <div className="border-t border-[#C9A86A]/20 pt-5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold block mb-3">
                Parent / Legal Guardian / Emergency Contact
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className={`w-full border ${errors.emergencyContactName ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans`}
                  />
                  {errors.emergencyContactName && (
                    <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.emergencyContactName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    Relation *
                  </label>
                  <select
                    value={formData.emergencyContactRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                    className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                  >
                    <option value="Parent" className="bg-[#1A1F1A]">Parent / Mother / Father</option>
                    <option value="Guardian" className="bg-[#1A1F1A]">Legal Guardian</option>
                    <option value="Teacher" className="bg-[#1A1F1A]">School Faculty / Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    Emergency Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="e.g. 9811122233"
                    className={`w-full border ${errors.emergencyContactPhone ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-mono`}
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer shadow-md"
              >
                <span>Continue to School &amp; Documents</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SCHOOL & MANDATORY CLEARANCE DOCUMENTS ================= */}
        {step === 2 && (
          <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#C9A86A]/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE II &bull; ACADEMIC &amp; MANDATORY IDENTIFICATION
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                School Verification &amp; Security Clearance
              </h2>
              <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                Security clearance documents are mandatory for entry into the Indian Institute of Space Science and Technology (IIST) campus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* School Name */}
              <div className="sm:col-span-2">
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  School / Institution Name *
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g. Loyola School, Thiruvananthapuram / Delhi Public School"
                  className={`w-full border ${errors.institution ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans`}
                />
                {errors.institution && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.institution}</p>}
              </div>

              {/* Class / Grade Dropdown */}
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Current Class / Grade *
                </label>
                <select
                  value={formData.classGrade}
                  onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans font-medium"
                >
                  {SCHOOL_CLASSES.map(cls => (
                    <option key={cls} value={cls} className="bg-[#1A1F1A]">
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Roll / Admission No */}
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Student Roll / Admission Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="e.g. 2024-ADM-8492"
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-mono"
                />
              </div>

              {/* Aadhaar or Passport Number */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-semibold">
                    Aadhaar Number or Passport Number *
                  </label>
                  <span className="text-[10px] font-mono text-[#8A9A7E]">12-Digit UID or Passport Code</span>
                </div>
                <input
                  type="text"
                  value={formData.aadharNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    const noSpace = val.replace(/\s+/g, "");
                    if (/^\d+$/.test(noSpace)) {
                      const formatted = noSpace.slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ");
                      setFormData({ ...formData, aadharNumber: formatted });
                    } else {
                      setFormData({ ...formData, aadharNumber: noSpace.slice(0, 15) });
                    }
                  }}
                  placeholder="XXXX XXXX XXXX (12 digits) or Passport Number"
                  className={`w-full border ${errors.aadharNumber ? "border-rose-400" : "border-[#8A9A7E]/40"} bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-mono tracking-wider`}
                />
                {errors.aadharNumber && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.aadharNumber}</p>
                )}
              </div>
            </div>

            {/* Document Uploads (Aadhaar & School ID) */}
            <div className="border-t border-[#C9A86A]/20 pt-5 space-y-5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold block mb-1">
                  Mandatory Security Documents *
                </span>
                <p className="font-sans text-xs text-[#8A9A7E] mb-4">
                  Please attach clear images or scanned PDFs of your Aadhaar card / Passport and your official School ID card. Max 1MB each.
                </p>
              </div>

              {/* File Upload Zone 1: Aadhaar Card or Passport Copy */}
              <div className="p-4 bg-[#1A1F1A] border border-[#C9A86A]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-bold text-[#EDE6D3] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#C9A86A]" />
                    <span>Aadhaar Card or Passport Copy *</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#C9A86A]">Required</span>
                </div>
                <FileUploadZone
                  label="Upload Aadhaar Card / Passport Document"
                  sublabel="Attach clear front copy of Aadhaar Card or Passport (JPG, PNG, PDF up to 1MB)"
                  fileType="document"
                  accept="image/*,.pdf"
                  valueUrl={formData.aadharPhotoUrl}
                  valueName={formData.aadharPhotoName}
                  onChange={(url, name) => setFormData({ ...formData, aadharPhotoUrl: url, aadharPhotoName: name })}
                  onClear={() => setFormData({ ...formData, aadharPhotoUrl: "", aadharPhotoName: "" })}
                  required={true}
                />
                {errors.aadharPhotoUrl && (
                  <p className="text-[10px] text-rose-400 font-semibold">{errors.aadharPhotoUrl}</p>
                )}
              </div>

              {/* File Upload Zone 2: School ID Card Copy */}
              <div className="p-4 bg-[#1A1F1A] border border-[#C9A86A]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-bold text-[#EDE6D3] flex items-center gap-2">
                    <School className="h-4 w-4 text-[#C9A86A]" />
                    <span>School ID Card *</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#C9A86A]">Required</span>
                </div>
                <FileUploadZone
                  label="Upload School ID Card / Bona Fide Certificate"
                  sublabel="Attach current school identity card or bonafide letter signed by principal (JPG, PNG, PDF up to 1MB)"
                  fileType="document"
                  accept="image/*,.pdf"
                  valueUrl={formData.idCardUrl}
                  valueName={formData.idCardName}
                  onChange={(url, name) => setFormData({ ...formData, idCardUrl: url, idCardName: name })}
                  onClear={() => setFormData({ ...formData, idCardUrl: "", idCardName: "" })}
                  required={true}
                />
                {errors.idCardUrl && (
                  <p className="text-[10px] text-rose-400 font-semibold">{errors.idCardUrl}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:border-[#C9A86A] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer shadow-md"
              >
                <span>Continue to Committee Preferences</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: COMMITTEE & PORTFOLIO PREFERENCES (3 TOTAL, DROPDOWNS) ================= */}
        {step === 3 && (
          <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#C9A86A]/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE III &bull; COMMITTEES &amp; PORTFOLIO PREFERENCES
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                Ranked Simulation Preferences (3 in Total)
              </h2>
              <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                Select your 3 preferred Committees and corresponding portfolios from the dropdown menus below.
              </p>
            </div>

            {/* Model UN Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Prior MUN Experience *
                </label>
                <select
                  value={formData.munExperience}
                  onChange={(e) => setFormData({ ...formData, munExperience: e.target.value })}
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                >
                  <option value="None" className="bg-[#1A1F1A]">None &bull; First Time Delegate</option>
                  <option value="1-2" className="bg-[#1A1F1A]">1 &ndash; 2 Conferences</option>
                  <option value="3-5" className="bg-[#1A1F1A]">3 &ndash; 5 Conferences</option>
                  <option value="5+" className="bg-[#1A1F1A]">5+ Conferences (Veteran Delegate)</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Accommodation Needed? *
                </label>
                <select
                  value={formData.accommodationRequired}
                  onChange={(e) => setFormData({ ...formData, accommodationRequired: e.target.value as "yes" | "no" })}
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                >
                  <option value="no" className="bg-[#1A1F1A]">No </option>
                  <option value="yes" className="bg-[#1A1F1A]">Yes  </option>
                </select>
              </div>
            </div>

            {/* 3 PREFERENCES CARDS */}
            <div className="space-y-4 pt-2">
              {/* PREFERENCE 1 */}
              <div className="p-5 bg-[#1A1F1A] border-2 border-[#C9A86A] space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#C9A86A]/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1F1A] bg-[#C9A86A] font-bold px-2 py-0.5">
                      PREFERENCE 1
                    </span>
                    <span className="font-serif text-sm font-semibold text-[#EDE6D3]">
                      Primary Committee *
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#C9A86A]">Highest Priority</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                      Select Committee *
                    </label>
                    <select
                      value={formData.pref1Committee}
                      onChange={(e) => setFormData({ ...formData, pref1Committee: e.target.value })}
                      className="w-full border border-[#8A9A7E]/40 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans font-medium"
                    >
                      {SCHOOL_COMMITTEES.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#1A1F1A]">
                          {c.abbreviation} &ndash; {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold flex items-center justify-between">
                      <span>Select Portfolio / Country *</span>
                      <span className="font-mono text-[9px] text-[#8A9A7E] font-normal">
                        {formData.pref1Committee.startsWith("ip") ? "N/A for IP" : `${availablePref1.length} Available`}
                      </span>
                    </label>
                    <select
                      value={formData.pref1Country}
                      onChange={(e) => setFormData({ ...formData, pref1Country: e.target.value })}
                      className="w-full border border-[#8A9A7E]/40 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans font-medium"
                    >
                      <option value="" disabled className="bg-[#1A1F1A]">
                        {formData.pref1Committee.startsWith("ip") ? "-- Portfolio N/A for IP --" : `-- Select Available Portfolio (${availablePref1.length}) --`}
                      </option>
                      {availablePref1.map(portfolio => (
                        <option key={portfolio} value={portfolio} className="bg-[#1A1F1A]">
                          {portfolio}
                        </option>
                      ))}
                    </select>
                    {errors.pref1Country && (
                      <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.pref1Country}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* PREFERENCE 2 */}
              <div className="p-5 bg-[#1A1F1A] border border-[#C9A86A]/60 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#C9A86A]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDE6D3] bg-[#2E3B2F] border border-[#C9A86A]/40 font-bold px-2 py-0.5">
                      PREFERENCE 2
                    </span>
                    <span className="font-serif text-sm font-semibold text-[#EDE6D3]">
                      Secondary Simulation Committee *
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8A9A7E]">Second Priority</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                      Select Committee *
                    </label>
                    <select
                      value={formData.pref2Committee}
                      onChange={(e) => setFormData({ ...formData, pref2Committee: e.target.value })}
                      className="w-full border border-[#8A9A7E]/40 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans font-medium"
                    >
                      {SCHOOL_COMMITTEES.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#1A1F1A]">
                          {c.abbreviation} &ndash; {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold flex items-center justify-between">
                      <span>Select Portfolio / Country *</span>
                      <span className="font-mono text-[9px] text-[#8A9A7E] font-normal">
                        {formData.pref2Committee.startsWith("ip") ? "N/A for IP" : `${availablePref2.length} Available`}
                      </span>
                    </label>
                    <select
                      value={formData.pref2Country}
                      onChange={(e) => setFormData({ ...formData, pref2Country: e.target.value })}
                      className="w-full border border-[#8A9A7E]/40 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans font-medium"
                    >
                      <option value="" disabled className="bg-[#1A1F1A]">
                        {formData.pref2Committee.startsWith("ip") ? "-- Portfolio N/A for IP --" : `-- Select Available Portfolio (${availablePref2.length}) --`}
                      </option>
                      {availablePref2.map(portfolio => (
                        <option key={portfolio} value={portfolio} className="bg-[#1A1F1A]">
                          {portfolio}
                        </option>
                      ))}
                    </select>
                    {errors.pref2Country && (
                      <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.pref2Country}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* PREFERENCE 3 */}
              <div className="p-5 bg-[#1A1F1A] border border-[#C9A86A]/40 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#C9A86A]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDE6D3] bg-[#2E3B2F] border border-[#C9A86A]/40 font-bold px-2 py-0.5">
                      PREFERENCE 3
                    </span>
                    <span className="font-serif text-sm font-semibold text-[#EDE6D3]">
                      Tertiary Simulation Committee *
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8A9A7E]">Third Priority</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                      Select Committee *
                    </label>
                    <select
                      value={formData.pref3Committee}
                      onChange={(e) => setFormData({ ...formData, pref3Committee: e.target.value })}
                      className="w-full border border-[#8A9A7E]/40 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans font-medium"
                    >
                      {SCHOOL_COMMITTEES.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#1A1F1A]">
                          {c.abbreviation} &ndash; {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold flex items-center justify-between">
                      <span>Select Portfolio / Country *</span>
                      <span className="font-mono text-[9px] text-[#8A9A7E] font-normal">
                        {formData.pref3Committee.startsWith("ip") ? "N/A for IP" : `${availablePref3.length} Available`}
                      </span>
                    </label>
                    <select
                      value={formData.pref3Country}
                      onChange={(e) => setFormData({ ...formData, pref3Country: e.target.value })}
                      className="w-full border border-[#8A9A7E]/40 bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans font-medium"
                    >
                      <option value="" disabled className="bg-[#1A1F1A]">
                        {formData.pref3Committee.startsWith("ip") ? "-- Portfolio N/A for IP --" : `-- Select Available Portfolio (${availablePref3.length}) --`}
                      </option>
                      {availablePref3.map(portfolio => (
                        <option key={portfolio} value={portfolio} className="bg-[#1A1F1A]">
                          {portfolio}
                        </option>
                      ))}
                    </select>
                    {errors.pref3Country && (
                      <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.pref3Country}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation / SOP */}
            <div>
              <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                Statement of Purpose / Motivation (Optional)
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                rows={3}
                placeholder="Please write about your past MUN awards and achievements, if any."
                className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] p-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans leading-relaxed"
              />
            </div>



            {/* Delegate Socials Night Option Card */}
            <div className={`p-5 border-2 transition-all space-y-3 ${formData.attendingSocials ? "bg-[#233124] border-[#C9A86A]" : "bg-[#1A1F1A] border-[#8A9A7E]/40 hover:border-[#C9A86A]/60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="schoolSocialsCheckbox"
                    checked={formData.attendingSocials}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendingSocials: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded-none accent-[#C9A86A] cursor-pointer"
                  />
                  <div>
                    <label htmlFor="schoolSocialsCheckbox" className="font-serif text-base text-[#EDE6D3] font-medium cursor-pointer block">
                      Attend Delegate Socials Night (+₹149)
                    </label>
                    <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
                      Experience an unforgettable evening of cultural music, networking, games, and fellowship with fellow delegates on campus.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-mono text-[10px] text-[#C9A86A] bg-[#1A1F1A] border border-[#C9A86A]/30 px-2 py-0.5">
                        Base Round: ₹999
                      </span>
                      {formData.attendingSocials ? (
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 font-bold">
                          Socials Included: ₹1,148 Total
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#8A9A7E] bg-[#1A1F1A] border border-[#8A9A7E]/30 px-2 py-0.5">
                          Socials Not Included (₹999 Total)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-serif text-xl font-bold text-[#C9A86A]">
                    ₹{calculatedFee}
                  </span>
                  <span className="text-[9px] font-mono text-[#8A9A7E] block">Round Fee</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:border-[#C9A86A] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-7 py-3 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer shadow-lg"
              >
                <span>Continue to Fee Payment &amp; Verification</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: FEE PAYMENT & TRANSACTION VERIFICATION ================= */}
        {step === 4 && (
          <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#C9A86A]/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE IV &bull; FEE PAYMENT &amp; TRANSACTION VERIFICATION
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                School Round Assessment &amp; UPI Payment
              </h2>
              <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                Complete your School Round registration fee payment using the official QR code or UPI ID. Enter your UTR reference number and attach receipt below.
              </p>
            </div>

            {/* Dynamic Assessment Breakdown Card */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-5 text-left shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#C9A86A]/20 pb-4">
                <div>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-bold block">
                    Assessed Registration Fee
                  </span>
                  <h3 className="font-serif text-xl font-normal text-[#EDE6D3] mt-0.5">
                    School Delegation Pass {formData.attendingSocials ? "+ Delegate Socials Night" : ""}
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
                  <strong className="text-[#EDE6D3]">₹999</strong>
                </div>
                <div>
                  <span>Socials Night:</span>{" "}
                  <strong className={formData.attendingSocials ? "text-emerald-400" : "text-[#8A9A7E]"}>
                    {formData.attendingSocials ? "+₹149" : "Not Included (₹0)"}
                  </strong>
                </div>
                <div>
                  <span>Academic Grade:</span>{" "}
                  <strong className="text-[#EDE6D3] font-mono">{formData.classGrade}</strong>
                </div>
                <div>
                  <span>Accreditation Round:</span>{" "}
                  <strong className="text-[#C9A86A]">School Round</strong>
                </div>
              </div>
            </div>

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
                      alt="IIST MUN Official UPI QR Code"
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

                {/* Credentials & Copy Helper */}
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
                      <span>Scan the QR code or pay ₹{calculatedFee} to <strong className="text-[#C9A86A]">arnav.tpj@oksbi</strong>.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#C9A86A] font-bold">2.</span>
                      <span>Copy the <strong>12-digit UTR / UPI Transaction Reference Number</strong> from your payment receipt.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#C9A86A] font-bold">3.</span>
                      <span>Enter the UTR number and attach screenshot receipt below to lodge your registration.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details Input Fields */}
            <div className="border border-[#8A9A7E]/30 bg-[#1A1F1A]/80 p-5 space-y-4">
              <span className="font-sans text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold block flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-[#C9A86A]" />
                Payment Transaction Credentials
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Mode */}
                <div>
                  <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Payment Mode</label>
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
                </div>

                {/* Date of Payment */}
                <div>
                  <label className="block font-sans text-[9px] uppercase text-[#8A9A7E] mb-1 font-semibold">Date of Payment</label>
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
                  sublabel="Attach payment screenshot or provide cloud drive link"
                  fileType="image"
                  maxSizeMB={5}
                  valueUrl={formData.paymentScreenshotUrl}
                  valueName={formData.paymentScreenshotName}
                  onChange={(url, name) => setFormData({ ...formData, paymentScreenshotUrl: url, paymentScreenshotName: name })}
                  onClear={() => setFormData({ ...formData, paymentScreenshotUrl: "", paymentScreenshotName: "" })}
                  required={false}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:border-[#C9A86A] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer shadow-lg disabled:opacity-50"
              >
                <CheckSquare className="h-4 w-4" />
                <span>{loading ? "Lodging Registration..." : "Submit School Registration"}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
