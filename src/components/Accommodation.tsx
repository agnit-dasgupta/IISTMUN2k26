/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Home,
  ShieldCheck,
  Building,
  Building2,
  Bed,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  ArrowLeft,
  Phone,
  Mail,
  User,
  CreditCard,
  FileText,
  Clock,
  Sparkles,
  MapPin,
  ExternalLink,
  ChevronRight,
  Printer,
  RotateCcw,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFirebase } from "../FirebaseContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, onSnapshot, getDoc, serverTimestamp } from "firebase/firestore";
import FileUploadZone from "./FileUploadZone";
import QRCodeDisplay from "./QRCodeDisplay";
import { AccommodationBooking, AccommodationSettings } from "../types";

interface AccommodationProps {
  setActiveTab: (tab: string) => void;
}

// Default room settings if not yet populated in Firestore
const DEFAULT_SETTINGS: AccommodationSettings = {
  maleFee: 1200,
  femaleFee: 1000,
  maleRoomsAvailable: 0,
  femaleRoomsAvailable: 0,
  maleLocationName: "SPACE Apartments (Out of Campus)",
  femaleLocationName: "IIST Hostels / Guest Quarters, Valiamala (In-Campus)",
  maleDescription:
    "Comfortable hotel accommodation with dedicated private transport shuttle directly connecting the hotel to IIST Valiamala campus during all conference days. Twin/Triple sharing with AC, Wi-Fi, and 24x7 liaison officer support.",
  femaleDescription:
    "Secure on-campus student hostel accommodation situated inside the IIST Valiamala campus. Round-the-clock campus security, biometric checkpoints, walking distance to committee chambers, and dining hall access.",
  contactPerson: "Arnav Jain (USG Finance) / Sonit Nooney (Delegate Affairs)",
  contactPhone: "+91 90827 95092",
  contactEmail: "support@iistmun.org"
};

export default function Accommodation({ setActiveTab }: AccommodationProps) {
  const { user } = useFirebase();

  // Settings from Firestore
  const [settings, setSettings] = useState<AccommodationSettings>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Form State
  const [gender, setGender] = useState<"male" | "female">("male");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    aadharNumber: "",
    aadharPhotoUrl: "",
    aadharPhotoName: "",
    institution: "",
    specialRequests: "",
    // Payment
    transactionId: "",
    paymentScreenshotUrl: "",
    paymentScreenshotName: "",
    payerName: "",
    paymentDate: new Date().toISOString().split("T")[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<AccommodationBooking | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Auto-fill user credentials when logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

  // Real-time synchronization of room settings from Firestore & server
  useEffect(() => {
    // Fallback sync from local server if available
    fetch("/api/accommodation-settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success" && res.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => { });

    try {
      const unsub = onSnapshot(
        doc(db, "accommodation_settings", "inventory"),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<AccommodationSettings>;
            setSettings((prev) => ({
              ...prev,
              ...data
            }));
          }
          setLoadingSettings(false);
        },
        (error) => {
          console.warn("Accommodation settings fetch note (using defaults):", error.message);
          setLoadingSettings(false);
        }
      );
      return () => unsub();
    } catch {
      setLoadingSettings(false);
    }
  }, []);

  const activeFee = gender === "male" ? settings.maleFee : settings.femaleFee;
  const activeLocation = gender === "male" ? settings.maleLocationName : settings.femaleLocationName;
  const activeDescription = gender === "male" ? settings.maleDescription : settings.femaleDescription;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("arnav.tpj@oksbi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Validation function
  const validateForm = () => {
    const errs: Record<string, string> = {};

    // 1. Mandatory Name
    if (!formData.name.trim()) {
      errs.name = "Candidate full name is mandatory.";
    } else if (formData.name.trim().length < 3) {
      errs.name = "Full name must be at least 3 characters long.";
    }

    // 2. Mandatory Phone
    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!cleanPhone) {
      errs.phone = "Phone number is mandatory.";
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
    }

    // 3. Mandatory Email
    if (!formData.email.trim()) {
      errs.email = "Email address is mandatory.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    // 4. Mandatory Aadhar Card number (12 digits)
    const cleanAadhar = formData.aadharNumber.replace(/[\s-]/g, "");
    if (!cleanAadhar) {
      errs.aadharNumber = "Aadhar card number is mandatory.";
    } else if (!/^\d{12}$/.test(cleanAadhar)) {
      errs.aadharNumber = "Aadhar card number must be exactly 12 numeric digits.";
    }

    // 5. Mandatory Transaction ID (UTR)
    if (!formData.transactionId.trim()) {
      errs.transactionId = "Payment UTR or Transaction ID is mandatory.";
    } else if (formData.transactionId.trim().length < 6) {
      errs.transactionId = "Enter a valid UTR / Transaction reference number.";
    }

    // 6. Mandatory Payment Screenshot
    if (!formData.paymentScreenshotUrl) {
      errs.paymentScreenshotUrl = "Payment receipt screenshot is mandatory.";
    }

    // 7. Terms declaration
    if (!termsAccepted) {
      errs.terms = "You must acknowledge the accommodation and campus security regulations.";
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errs)[0];
      const el = document.getElementById(`field-${firstErrorField}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 350, behavior: "smooth" });
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const bookingId = `ACC-2027-${Math.floor(10000 + Math.random() * 90000)}`;
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const payload: AccommodationBooking = {
      id: bookingId,
      userId: user?.uid || "guest-delegate",
      timestamp,
      createdAt: serverTimestamp(),
      name: formData.name.trim(),
      gender,
      accommodationType: gender === "male" ? "out-of-campus" : "in-campus",
      aadharNumber: formData.aadharNumber.replace(/[\s-]/g, ""),
      aadharPhotoUrl: formData.aadharPhotoUrl,
      aadharPhotoName: formData.aadharPhotoName || "Aadhar_Card.jpg",
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      institution: formData.institution.trim() || "Not Specified",
      specialRequests: formData.specialRequests.trim(),
      // Payment details
      paymentAmount: activeFee,
      transactionId: formData.transactionId.trim(),
      utrNumber: formData.transactionId.trim(),
      paymentScreenshotUrl: formData.paymentScreenshotUrl,
      paymentScreenshotName: formData.paymentScreenshotName || "Payment_Screenshot.jpg",
      payerName: formData.payerName.trim() || formData.name.trim(),
      paymentDate: formData.paymentDate,
      paymentMode: "UPI / QR",
      // Status
      status: "Pending",
      adminNotes: ""
    };

    try {
      // 1. Save to Firestore collection 'accommodation_bookings'
      const docRef = doc(db, "accommodation_bookings", bookingId);
      await setDoc(docRef, payload);

      // 2. Also back up to local server endpoint if available
      try {
        await fetch("/api/accommodations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (backupErr) {
        console.warn("Local server backup skipped or not reachable:", backupErr);
      }

      setSubmissionSuccess(payload);
      window.scrollTo({ top: 120, behavior: "smooth" });
    } catch (err: unknown) {
      console.error("Accommodation submission error:", err);
      // Attempt local backup even if Firestore fails
      try {
        await fetch("/api/accommodations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        setSubmissionSuccess(payload);
        window.scrollTo({ top: 120, behavior: "smooth" });
      } catch {
        handleFirestoreError(err, OperationType.CREATE, "accommodation_bookings");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetForm = () => {
    setSubmissionSuccess(null);
    setFormData({
      name: user?.displayName || "",
      email: user?.email || "",
      phone: "",
      aadharNumber: "",
      aadharPhotoUrl: "",
      aadharPhotoName: "",
      institution: "",
      specialRequests: "",
      transactionId: "",
      paymentScreenshotUrl: "",
      paymentScreenshotName: "",
      payerName: "",
      paymentDate: new Date().toISOString().split("T")[0]
    });
    setTermsAccepted(false);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-left font-sans">
      {/* Return Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setActiveTab("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="group inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.16em] text-[#8A9A7E] hover:text-[#C9A86A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Conference Home</span>
        </button>

        <span className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-widest border border-[#C9A86A]/30 bg-[#2E3B2F]/40 px-2.5 py-1">
          IIST MUN 2027 &bull; DIPLOMATIC LODGING
        </span>
      </div>

      {/* Hero Header Banner */}
      <div className="relative border border-[#C9A86A]/30 bg-[#233124]/90 backdrop-blur-md p-6 sm:p-8 lg:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">

          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#EDE6D3] font-normal tracking-tight leading-tight">
            Delegate Accommodation &amp; <br />
            <span className="text-[#C9A86A] italic">Campus Lodging Portal</span>
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#EDE6D3]/80 leading-relaxed font-light">
            Official lodging allotment for accredited delegates of{" "}
            <strong className="text-[#EDE6D3]">IIST Model United Nations 2027</strong>. In accordance with
            institutional safety directives, <strong className="text-[#C9A86A]">Female Delegates</strong> are
            accommodated within the secure IIST Valiamala Campus, while{" "}
            <strong className="text-[#8BA06F]">Male Delegates</strong> are accommodated at designated off-campus
            partner hotels.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[#8A9A7E]">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>Valiamala, Thiruvananthapuram, Kerala</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>{settings.contactEmail || "support@iistmun.org"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>{settings.contactPhone || "+91 90827 95092"}</span>
            </div>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Bed className="w-72 h-72 text-[#C9A86A]" />
        </div>
      </div>

      {/* Confirmation Pass Display (Shown upon successful submission) */}
      <AnimatePresence>
        {submissionSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-12 border-2 border-[#C9A86A] bg-[#1A1F1A] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            id="accommodation-confirmation-pass"
          >
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#C9A86A]/30 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#2E3B2F] border border-[#C9A86A] flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#EDE6D3] font-normal">
                    Accommodation Booking Confirmed
                  </h3>
                  <span className="font-sans text-[11px] text-[#8A9A7E]">
                    Your lodging reservation has been registered with the IIST MUN Secretariat.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-[#2E3B2F] hover:bg-[#3d4d3e] border border-[#C9A86A]/40 text-[#C9A86A] text-xs font-sans font-medium uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Pass
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3.5 py-1.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Book Another
                </button>
              </div>
            </div>

            {/* Pass Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-center">
              {/* QR Code and Pass ID */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#233124] border border-[#C9A86A]/30">
                <QRCodeDisplay
                  uniqueId={submissionSuccess.id}
                  candidateName={submissionSuccess.name}
                  title="IIST MUN Lodging Boarding Pass"
                  subtitle="Scan at Accommodation Security Desk"
                  size={150}
                  showScannerTest={false}
                />
                <span className="mt-3 font-mono text-[10px] text-[#8A9A7E] uppercase tracking-wider">
                  BOOKING REFERENCE: <strong className="text-[#C9A86A]">{submissionSuccess.id}</strong>
                </span>
              </div>

              {/* Booking Details */}
              <div className="md:col-span-2 space-y-3 font-sans text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-[#8A9A7E]/20 pb-4">
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9A7E] block">Delegate Name</span>
                    <strong className="text-sm text-[#EDE6D3]">{submissionSuccess.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9A7E] block">Gender &amp; Category</span>
                    <strong className="text-[#C9A86A] uppercase font-mono">
                      {submissionSuccess.gender} &bull;{" "}
                      {submissionSuccess.gender === "female" ? "In-Campus" : "Out of Campus"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9A7E] block">Contact Phone</span>
                    <span className="text-[#EDE6D3] font-mono">{submissionSuccess.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-[#8A9A7E]/20 pb-4">
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9A7E] block">Allotted Venue</span>
                    <p className="text-[#EDE6D3] font-medium">
                      {submissionSuccess.gender === "female"
                        ? settings.femaleLocationName
                        : settings.maleLocationName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9A7E] block">Room Assignment</span>
                    <p className="text-emerald-400 font-mono font-bold">
                      {submissionSuccess.roomAllotted || "Provisional Slot Allocated"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9A7E] block">Payment UTR</span>
                    <span className="font-mono text-[#C9A86A] font-bold">{submissionSuccess.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9A7E] block">Fee Paid</span>
                    <span className="font-mono text-[#EDE6D3]">₹{submissionSuccess.paymentAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9A7E] block">Verification Status</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-mono">
                      Under Review
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-[#2E3B2F]/40 border border-[#C9A86A]/20 text-[11px] text-[#8A9A7E] space-y-1">
                  <p>
                    <strong className="text-[#EDE6D3]">Notice for Physical Check-in:</strong> Please carry your
                    original physical Aadhar card matching number{" "}
                    <span className="font-mono text-[#C9A86A]">
                      XXXX-XXXX-{submissionSuccess.aadharNumber.slice(-4)}
                    </span>{" "}
                    and display this boarding pass at the reception counter.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Accommodation Form */}
      <form onSubmit={handleSubmit} className="space-y-10" id="accommodation-booking-form">
        {/* SECTION 1: GENDER SELECTION & ALLOTMENT CATEGORY */}
        <section className="border border-[#C9A86A]/30 bg-[#233124]/70 p-6 sm:p-8 shadow-xl relative">
          <div className="flex items-center justify-between mb-5 border-b border-[#8A9A7E]/20 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE 01 &bull; SEAT DESIGNATION
              </span>
              <h2 className="font-serif text-2xl text-[#EDE6D3] font-normal">
                Section 1: Select Gender &amp; Lodging Scope
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase px-2 py-0.5 border border-emerald-500/30 bg-[#1A1F1A] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Female: {settings.femaleRoomsAvailable ?? 0} Available
              </span>
              <span className="text-[10px] font-mono text-sky-400 uppercase px-2 py-0.5 border border-sky-500/30 bg-[#1A1F1A] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                Male: {settings.maleRoomsAvailable ?? 0} Available
              </span>
            </div>
          </div>

          <p className="font-sans text-xs text-[#8A9A7E] mb-6 leading-relaxed">
            Please designate your gender to review corresponding lodging parameters. In compliance with campus
            regulations, female candidates are provided strictly in-campus lodging, and male candidates are
            arranged with off-campus partner hotel quarters with continuous shuttle connectivity.
          </p>

          {/* Gender Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="field-gender">
            {/* Female Selection Card */}
            <div
              onClick={() => setGender("female")}
              className={`p-6 border-2 transition-all duration-300 cursor-pointer relative overflow-hidden text-left ${gender === "female"
                ? "border-[#C9A86A] bg-[#2E3B2F] shadow-[0_0_20px_rgba(201,168,106,0.18)]"
                : "border-[#8A9A7E]/30 bg-[#1A1F1A]/80 hover:border-[#C9A86A]/50 hover:bg-[#2E3B2F]/30"
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold">
                  FEMALE DELEGATE &bull; IN-CAMPUS
                </span>
                <span
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${gender === "female" ? "border-[#C9A86A] bg-[#C9A86A]" : "border-[#8A9A7E]/50"
                    }`}
                >
                  {gender === "female" && <Check className="h-3 w-3 text-[#1A1F1A] stroke-[3]" />}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Building className="h-6 w-6 text-[#C9A86A]" />
                <h3 className="font-serif text-xl text-[#EDE6D3] font-normal">In-Campus Accommodation</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30">
                  Location: IIST Valiamala Hostels
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${(settings.femaleRoomsAvailable ?? 0) > 0
                    ? "text-emerald-300 bg-emerald-950/80 border-emerald-500/50"
                    : "text-rose-400 bg-rose-950/80 border-rose-500/50"
                    }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${(settings.femaleRoomsAvailable ?? 0) > 0
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-rose-500"
                      }`}
                  />
                  {(settings.femaleRoomsAvailable ?? 0) > 0
                    ? `${settings.femaleRoomsAvailable} Rooms Available`
                    : "No Rooms Available"}
                </span>
              </div>

              <p className="font-sans text-xs text-[#8A9A7E] leading-relaxed mb-4">
                Secure hostel quarters inside IIST Campus.
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#8A9A7E]/20 text-xs">
                <div>
                  <span className="text-[10px] text-[#8A9A7E] block uppercase">Lodging Fee</span>
                  <span className="font-mono text-base font-bold text-[#C9A86A]">
                    ₹{settings.femaleFee}{" "}
                    <span className="text-[10px] font-normal text-[#8A9A7E]">/ delegate</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#8A9A7E] block uppercase">Included:</span>
                  <span
                    className={`font-mono text-xs font-bold flex items-center justify-end gap-1.5 ${(settings.femaleRoomsAvailable ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                  >
                    <span>
                      Breakfast, Wifi
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Male Selection Card */}
            <div
              onClick={() => setGender("male")}
              className={`p-6 border-2 transition-all duration-300 cursor-pointer relative overflow-hidden text-left ${gender === "male"
                ? "border-[#C9A86A] bg-[#2E3B2F] shadow-[0_0_20px_rgba(201,168,106,0.18)]"
                : "border-[#8A9A7E]/30 bg-[#1A1F1A]/80 hover:border-[#C9A86A]/50 hover:bg-[#2E3B2F]/30"
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold">
                  MALE DELEGATE &bull; OUT OF CAMPUS
                </span>
                <span
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${gender === "male" ? "border-[#C9A86A] bg-[#C9A86A]" : "border-[#8A9A7E]/50"
                    }`}
                >
                  {gender === "male" && <Check className="h-3 w-3 text-[#1A1F1A] stroke-[3]" />}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-6 w-6 text-[#C9A86A]" />
                <h3 className="font-serif text-xl text-[#EDE6D3] font-normal">Out of Campus Accommodation</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono text-sky-300 bg-sky-950/60 border border-sky-500/30">
                  Location: Partner Hotels
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${(settings.maleRoomsAvailable ?? 0) > 0
                    ? "text-sky-300 bg-sky-950/80 border-sky-500/50"
                    : "text-rose-400 bg-rose-950/80 border-rose-500/50"
                    }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${(settings.maleRoomsAvailable ?? 0) > 0
                      ? "bg-sky-400 animate-pulse"
                      : "bg-rose-500"
                      }`}
                  />
                  {(settings.maleRoomsAvailable ?? 0) > 0
                    ? `${settings.maleRoomsAvailable} Rooms Available`
                    : "No Rooms Available"}
                </span>
              </div>

              <p className="font-sans text-xs text-[#8A9A7E] leading-relaxed mb-4">
                Partner hotel rooms near campus.
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#8A9A7E]/20 text-xs">
                <div>
                  <span className="text-[10px] text-[#8A9A7E] block uppercase">Lodging Fee</span>
                  <span className="font-mono text-base font-bold text-[#C9A86A]">
                    ₹{settings.maleFee}{" "}
                    <span className="text-[10px] font-normal text-[#8A9A7E]">/ delegate</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#8A9A7E] block uppercase">Included:</span>
                  <span
                    className={`font-mono text-xs font-bold flex items-center justify-end gap-1.5 ${(settings.maleRoomsAvailable ?? 0) > 0 ? "text-sky-400" : "text-rose-400"
                      }`}
                  >
                    <span>
                      Breakfast, Bus service
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: MANDATORY DELEGATE IDENTIFICATION */}
        <section className="border border-[#C9A86A]/30 bg-[#233124]/70 p-6 sm:p-8 shadow-xl relative">
          <div className="flex items-center justify-between mb-5 border-b border-[#8A9A7E]/20 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE 02 &bull; DELEGATE DOSSIER
              </span>
              <h2 className="font-serif text-2xl text-[#EDE6D3] font-normal">
                Section 2: Personal Identification &amp; Aadhar Verification
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#C9A86A] uppercase px-2 py-0.5 border border-[#C9A86A]/30 bg-[#1A1F1A]">
              Required Credentials
            </span>
          </div>

          <p className="font-sans text-xs text-[#8A9A7E] mb-6">
            All fields marked with <span className="text-rose-400 font-bold">*</span> are mandatory for campus entry
            and ISRO security clearance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5" id="field-name">
              <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-[#C9A86A]" />
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Full name as printed on Govt ID"
                className={`w-full bg-[#1A1F1A] border px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none transition-colors ${errors.name ? "border-rose-500 ring-1 ring-rose-500" : "border-[#8A9A7E]/30"
                  }`}
              />
              {errors.name && (
                <span className="text-rose-400 text-[11px] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5" id="field-email">
              <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-[#C9A86A]" />
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                placeholder="delegate@institution.edu or personal"
                className={`w-full bg-[#1A1F1A] border px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none transition-colors ${errors.email ? "border-rose-500 ring-1 ring-rose-500" : "border-[#8A9A7E]/30"
                  }`}
              />
              {errors.email && (
                <span className="text-rose-400 text-[11px] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </span>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5" id="field-phone">
              <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-[#C9A86A]" />
                Contact Phone / WhatsApp <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                maxLength={13}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                placeholder="10-digit Indian Mobile Number"
                className={`w-full bg-[#1A1F1A] border px-3.5 py-2.5 text-xs text-[#EDE6D3] font-mono focus:border-[#C9A86A] focus:outline-none transition-colors ${errors.phone ? "border-rose-500 ring-1 ring-rose-500" : "border-[#8A9A7E]/30"
                  }`}
              />
              {errors.phone && (
                <span className="text-rose-400 text-[11px] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.phone}
                </span>
              )}
            </div>

            {/* Aadhar Card Number */}
            <div className="space-y-1.5" id="field-aadharNumber">
              <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-[#C9A86A]" />
                Aadhar Card Number (12 Digits) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.aadharNumber}
                maxLength={14}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, "");
                  setFormData({ ...formData, aadharNumber: val });
                  if (errors.aadharNumber) setErrors({ ...errors, aadharNumber: "" });
                }}
                placeholder="XXXX XXXX XXXX (12 digits)"
                className={`w-full bg-[#1A1F1A] border px-3.5 py-2.5 text-xs text-[#EDE6D3] font-mono tracking-widest focus:border-[#C9A86A] focus:outline-none transition-colors ${errors.aadharNumber ? "border-rose-500 ring-1 ring-rose-500" : "border-[#8A9A7E]/30"
                  }`}
              />
              {errors.aadharNumber && (
                <span className="text-rose-400 text-[11px] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.aadharNumber}
                </span>
              )}
            </div>

            {/* Institution / College */}
            <div className="space-y-1.5">
              <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                College / University / School Name
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g. IIT Bombay / St. Stephen's / IIST"
                className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
              />
            </div>
          </div>

          {/* Special Requests or Dietary Info */}
          <div className="mt-5 space-y-1.5">
            <label className="font-sans text-xs uppercase tracking-wider text-[#8A9A7E] font-medium block">
              Special Medical / Dietary / Physical Assistance Requirements (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              placeholder="Any specific allergies, medical requirements, or travel assistance..."
              className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
            />
          </div>
        </section>

        {/* SECTION 3: QR CODE PAYMENT & TRANSACTION CLEARANCE */}
        <section className="border border-[#C9A86A]/30 bg-[#233124]/70 p-6 sm:p-8 shadow-xl relative">
          <div className="flex items-center justify-between mb-5 border-b border-[#8A9A7E]/20 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE 03 &bull; FINANCIAL CLEARANCE
              </span>
              <h2 className="font-serif text-2xl text-[#EDE6D3] font-normal">
                Section 3: UPI QR Payment &amp; Remittance Proof
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#C9A86A] uppercase px-2 py-0.5 border border-[#C9A86A]/30 bg-[#1A1F1A]">
              Official Remittance
            </span>
          </div>

          <p className="font-sans text-xs text-[#8A9A7E] mb-6">
            Accommodation dues must be cleared in advance to lock your vacant room number. Scan the official UPI
            QR code or remit directly via UPI ID.
          </p>

          {/* Payment Card & QR Display */}
          <div className="border-2 border-[#C9A86A] bg-[#1A1F1A] p-6 text-center relative overflow-hidden shadow-2xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A86A]/20 border border-[#C9A86A] text-[#C9A86A] text-[10px] font-mono uppercase tracking-widest font-bold mb-5">
              <QrCode className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>OFFICIAL IIST MUN ACCOMMODATION UPI QR</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Graphic with Price Tag */}
              <div className="flex flex-col items-center">
                <div className="relative p-2.5 bg-white border-2 border-[#C9A86A] shadow-2xl inline-block max-w-[240px] sm:max-w-[260px] w-full">
                  <img
                    src="/UPI-QR-IIST-MUN-2026.png"
                    alt="Official IIST MUN UPI QR Code"
                    className="w-full h-auto object-contain block mx-auto rounded"
                  />
                  <div className="mt-2 py-1.5 px-3 bg-[#1A1F1A] text-center border border-[#C9A86A]/40 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[#8A9A7E] uppercase tracking-wider">
                      Amount Due:
                    </span>
                    <span className="font-mono text-sm font-bold text-[#C9A86A]">
                      ₹{activeFee}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[#8A9A7E] font-mono mt-2">
                  Scan to remit ₹{activeFee} ({gender === "female" ? "In-Campus" : "Out-of-Campus"})
                </span>
              </div>

              {/* Remittance Details */}
              <div className="text-left space-y-4">
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
                      {copiedUpi ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedUpi ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[#8A9A7E] space-y-1">
                  <div>
                    <span className="text-[#EDE6D3] font-semibold">Account Holder:</span> Pankaj Kumar Jain
                  </div>
                  <div>
                    <span className="text-[#EDE6D3] font-semibold">Accepted Modes:</span> Google Pay, PhonePe,
                    Paytm, BHIM, Cred, Mobile Banking
                  </div>
                </div>

                <div className="border border-[#C9A86A]/30 bg-[#2E3B2F]/30 p-3 text-[11px] text-[#EDE6D3] space-y-1.5 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#C9A86A] font-bold">1.</span>
                    <span>
                      Scan QR code or transfer <strong>₹{activeFee}</strong> to{" "}
                      <span className="text-[#C9A86A] font-mono">arnav.tpj@oksbi</span>.
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#C9A86A] font-bold">2.</span>
                    <span>
                      Copy the <strong>12-digit UTR / UPI Transaction Reference Number</strong> from your payment receipt.
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#C9A86A] font-bold">3.</span>
                    <span>
                      Enter the transaction ID and upload the payment receipt screenshot below.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Payment Fields */}
          <div className="border border-[#8A9A7E]/30 bg-[#1A1F1A] p-5 space-y-4">
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold block flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>MANDATORY REMITTANCE CREDENTIALS</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Transaction ID / UTR (Mandatory) */}
              <div className="space-y-1.5" id="field-transactionId">
                <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                  Transaction ID / 12-Digit UTR <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => {
                    setFormData({ ...formData, transactionId: e.target.value });
                    if (errors.transactionId) setErrors({ ...errors, transactionId: "" });
                  }}
                  placeholder="e.g. 509281749201"
                  className={`w-full bg-[#2E3B2F]/40 border px-3.5 py-2.5 text-xs text-[#EDE6D3] font-mono tracking-wider focus:border-[#C9A86A] focus:outline-none transition-colors ${errors.transactionId ? "border-rose-500 ring-1 ring-rose-500" : "border-[#8A9A7E]/30"
                    }`}
                />
                {errors.transactionId && (
                  <span className="text-rose-400 text-[11px] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.transactionId}
                  </span>
                )}
              </div>

              {/* Payer Name */}
              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                  Payer Name in Bank / UPI App
                </label>
                <input
                  type="text"
                  value={formData.payerName}
                  onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                  placeholder="Name as registered on UPI"
                  className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#EDE6D3] font-medium block">
                  Date of Remittance
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full bg-[#2E3B2F]/40 border border-[#8A9A7E]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Screenshot (Mandatory) */}
            <div className="pt-2" id="field-paymentScreenshotUrl">
              <FileUploadZone
                label="Payment Receipt Screenshot *"
                sublabel="Upload screenshot or PDF receipt clearly showing the UTR number, date, and ₹ amount paid."
                fileType="document"
                accept=".pdf,image/*"
                maxSizeMB={5.0}
                required={true}
                valueUrl={formData.paymentScreenshotUrl}
                valueName={formData.paymentScreenshotName}
                onChange={(url, name) => {
                  setFormData({
                    ...formData,
                    paymentScreenshotUrl: url,
                    paymentScreenshotName: name
                  });
                  if (errors.paymentScreenshotUrl)
                    setErrors({ ...errors, paymentScreenshotUrl: "" });
                }}
                onClear={() =>
                  setFormData({
                    ...formData,
                    paymentScreenshotUrl: "",
                    paymentScreenshotName: ""
                  })
                }
                error={errors.paymentScreenshotUrl}
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: CODE OF CONDUCT & SUBMIT */}
        <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-6 space-y-5">
          {/* Accommodation Policy Document Banner */}
          <div className="border border-[#C9A86A]/30 bg-[#233124]/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#2E3B2F] border border-[#C9A86A]/30 text-[#C9A86A] shrink-0 mt-0.5">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-wider font-bold">
                    Official Document
                  </span>
                </div>
                <h4 className="font-serif text-sm sm:text-base text-[#EDE6D3] font-normal">
                  Accommodation Policy &amp; Code of Conduct
                </h4>
                <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">
                  Please review the accommodation guidelines, room allocation rules, and campus curfew regulations before submitting your application.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <a
                href="/Accommodation_Policy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                id="view-accommodation-policy-pdf"
              >
                <span>Read Policy (PDF)</span>
                <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
              </a>
              <a
                href="/Accommodation_Policy.pdf"
                download="Accommodation_Policy.pdf"
                title="Download Accommodation Policy PDF"
                className="p-2.5 border border-[#8A9A7E]/40 hover:border-[#C9A86A] bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none text-left" id="field-terms">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (errors.terms) setErrors({ ...errors, terms: "" });
              }}
              className="mt-1 h-4 w-4 rounded-none border-[#C9A86A] bg-[#2E3B2F] text-[#C9A86A] focus:ring-0 cursor-pointer"
            />
            <span className="font-sans text-xs text-[#EDE6D3] leading-relaxed">
              I certify that all details submitted (including my name, contact information, Aadhar card number,
              and transaction reference) are accurate and belong to me. I agree to abide by the{" "}
              <a
                href="/Accommodation_Policy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#C9A86A] underline hover:text-[#d6b77c] inline-flex items-center gap-0.5 font-semibold"
              >
                Accommodation Policy (Accomodation_Policy.pdf)
                <ExternalLink className="h-3 w-3 inline ml-0.5" />
              </a>
              , IIST Campus Security regulations, hostel curfew policies (11:00 PM for on-campus blocks), and disciplinary
              guidelines during the duration of IIST MUN 2027.
            </span>
          </label>
          {errors.terms && (
            <span className="text-rose-400 text-xs flex items-center gap-1 font-sans">
              <AlertCircle className="h-3.5 w-3.5" /> {errors.terms}
            </span>
          )}

          <div className="pt-3 border-t border-[#8A9A7E]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-mono text-[11px] text-[#8A9A7E]">
              Total Lodging Remittance:{" "}
              <strong className="text-base text-[#C9A86A]">₹{activeFee}</strong> ({gender === "female" ? "In-Campus" : "Out of Campus"})
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-3.5 text-xs font-sans font-bold uppercase tracking-[0.2em] border transition-all duration-200 cursor-pointer shadow-xl flex items-center justify-center gap-2 ${isSubmitting
                ? "border-[#8A9A7E]/40 bg-[#2E3B2F] text-[#8A9A7E] cursor-wait"
                : "border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A] hover:bg-[#EDE6D3] hover:text-[#1A1F1A]"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-[#8A9A7E] border-t-transparent rounded-full animate-spin" />
                  <span>TRANSMITTING DOSSIER TO FIREBASE...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>SUBMIT ACCOMMODATION APPLICATION</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

