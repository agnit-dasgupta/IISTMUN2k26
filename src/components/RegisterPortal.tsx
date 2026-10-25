/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  MapPin,
  FileText,
  Compass,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Award,
  ShieldCheck,
  Globe
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { CampusAmbassadorRegistration } from "../types";
import FileUploadZone from "./FileUploadZone";
import { motion, AnimatePresence } from "motion/react";
import Registration from "./Registration";
import UNGARegistration from "./UNGARegistration";

export const EB_REGISTRATIONS_OPEN = false;

interface RegisterPortalProps {
  initialPortalTab?: "priority" | "unga" | "campus-ambassador" | "eb";
  initialPreference?: { country?: string; committee: string } | null;
  clearInitialPreference?: () => void;
  setActiveTab: (tab: string) => void;
}

export default function RegisterPortal({
  initialPortalTab = "priority",
  initialPreference,
  clearInitialPreference,
  setActiveTab
}: RegisterPortalProps) {
  const { user } = useFirebase();
  const [selectedForm, setSelectedForm] = useState<"priority" | "unga" | "campus-ambassador">(
    initialPortalTab === "campus-ambassador"
      ? "campus-ambassador"
      : initialPortalTab === "unga"
        ? "unga"
        : "priority"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Success state for Campus Ambassador
  const [submittedCA, setSubmittedCA] = useState<CampusAmbassadorRegistration | null>(null);

  // CA Form State
  const [caForm, setCaForm] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    course: "",
    yearOfStudy: "2nd Year",
    cityState: "",
    photoUrl: "",
    photoName: "",
    idProofUrl: "",
    idProofName: "",
    collegeClubs: "",
    socialHandles: "",
    priorCaExperience: "Yes, served as ambassador for college fests",
    motivation: "",
    promotionPlan: "",
    targetMobilization: "10-20 Delegates"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill user credentials when signed in
  useEffect(() => {
    if (user) {
      setCaForm((prev) => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

  // Update selected form if prop changes
  useEffect(() => {
    if (initialPortalTab) {
      setSelectedForm(
        initialPortalTab === "campus-ambassador"
          ? "campus-ambassador"
          : initialPortalTab === "unga"
            ? "unga"
            : "priority"
      );
    }
  }, [initialPortalTab]);

  const validateCA = () => {
    const err: Record<string, string> = {};
    if (!caForm.name.trim()) err.name = "Full name is required.";
    if (!caForm.email.trim() || !/\S+@\S+\.\S+/.test(caForm.email)) err.email = "Valid email is required.";
    if (!caForm.phone.trim()) err.phone = "WhatsApp phone number is required.";
    if (!caForm.institution.trim()) err.institution = "College / University is required.";
    if (!caForm.course.trim()) err.course = "Degree / Course is required.";
    if (!caForm.cityState.trim()) err.cityState = "City & State is required.";
    if (!caForm.motivation.trim() || caForm.motivation.length < 20) {
      err.motivation = "Please tell us why you want to represent IISTMUN (min 20 characters).";
    }
    if (!caForm.promotionPlan.trim() || caForm.promotionPlan.length < 20) {
      err.promotionPlan = "Please outline your campus outreach plan (min 20 characters).";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmitCA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCA()) {
      window.scrollTo({ top: 300, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    const regId = `CA-2027-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const payload: CampusAmbassadorRegistration = {
      id: regId,
      userId: user?.uid || "guest-ambassador",
      timestamp,
      status: "Pending",
      name: caForm.name.trim(),
      email: caForm.email.trim().toLowerCase(),
      phone: caForm.phone.trim(),
      institution: caForm.institution.trim(),
      course: caForm.course.trim(),
      yearOfStudy: caForm.yearOfStudy,
      cityState: caForm.cityState.trim(),
      photoUrl: caForm.photoUrl || "",
      photoName: caForm.photoName || "",
      idProofUrl: caForm.idProofUrl || "",
      idProofName: caForm.idProofName || "",
      collegeClubs: caForm.collegeClubs.trim() || "",
      socialHandles: caForm.socialHandles.trim() || "",
      priorCaExperience: caForm.priorCaExperience.trim(),
      motivation: caForm.motivation.trim(),
      promotionPlan: caForm.promotionPlan.trim(),
      targetMobilization: caForm.targetMobilization
    };

    // Validate payload size does not exceed Firestore's 1,048,576 bytes (1 MiB) limit
    const caPayloadBytes = new Blob([JSON.stringify(payload)]).size;
    if (caPayloadBytes > 1030000) {
      alert(
        `Application payload (${(caPayloadBytes / 1024 / 1024).toFixed(2)} MB) exceeds the Firestore document limit (1 MB). ` +
        `Please attach a smaller photo or provide a Google Drive / OneDrive link for your ID proof.`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // Save directly and solely to Firebase Firestore
      await setDoc(doc(db, "campus_ambassador_registrations", regId), payload);
      setSubmittedCA(payload);
      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission failed:", err);
      const isSizeError = err?.message?.includes("exceeds the maximum allowed size");
      alert(
        isSizeError
          ? "Submission failed: Attached files exceed the 1MB database document limit. Please use a Google Drive cloud link for your ID proof."
          : `Submission encountered an issue (${err?.message || "unknown error"}). Please retry or contact support.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-left">

      {/* Back to Home CTA */}
      <button
        onClick={() => {
          setActiveTab("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="group inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.16em] text-[#8A9A7E] hover:text-[#C9A86A] transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Return to Portal Convocation
      </button>

      {/* Hero Masthead */}
      <div className="relative border border-[#C9A86A]/30 bg-[#233124]/90 backdrop-blur-md p-6 sm:p-8 lg:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] bg-[#2E3B2F] border border-[#C9A86A]/40 px-2.5 py-1">
              CONVOCATION DISPATCH • 14TH EDITION
            </span>
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] border border-[#C9A86A]/40 bg-[#C9A86A]/10 px-2.5 py-1 font-semibold">
              PRIORITY OPEN &bull; UNGA (ONLINE) OPEN &bull; CAMPUS AMBASSADOR OPEN
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#EDE6D3] font-normal tracking-tight leading-tight">
            Accreditation &amp; Representation <br />
            <span className="text-[#C9A86A] italic">Registration Dossier</span>
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#EDE6D3]/80 leading-relaxed font-light">
            Welcome to the official registration portal of <strong className="text-[#EDE6D3]">IIST Model United Nations 2027</strong>.
            Priority delegate applications for on-campus chambers and <span className="text-[#C9A86A] font-medium">UNGA (Online Committee)</span> registrations are now live with rolling portfolio allotments. You can also join the prestigious <span className="text-[#8BA06F] font-medium">Campus Ambassador Network</span> to represent IISTMUN at your academic institution.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[#8A9A7E]">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>support@iistmun.org</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#C9A86A]" />
              <span>Niranjan Patil (SG): +91 9881416709</span>
            </div>
          </div>
        </div>

        {/* Subtle decorative crest badge */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <img src="/logo-emblem-transparent.png" alt="Emblem" className="w-64 h-64 object-contain" />
        </div>
      </div>

      {/* Triad Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {/* Section A: Priority Registrations (On-Campus) */}
        <button
          type="button"
          onClick={() => {
            setSelectedForm("priority");
            setSubmittedCA(null);
          }}
          className={`p-5 text-left border transition-all duration-200 cursor-pointer relative ${selectedForm === "priority"
            ? "border-[#C9A86A] bg-[#2E3B2F] shadow-lg"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#C9A86A]/50 hover:bg-[#2E3B2F]/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A]">
              SECTION A &bull; ON-CAMPUS
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#1A1F1A] bg-[#C9A86A] font-bold px-2 py-0.5">
                NOW OPEN
              </span>
              <Sparkles className={`h-5 w-5 ${selectedForm === "priority" ? "text-[#C9A86A]" : "text-[#8A9A7E]"}`} />
            </div>
          </div>
          <h2 className="font-serif text-lg text-[#EDE6D3] font-medium block">
            Priority Delegate Registration
          </h2>

          {selectedForm === "priority" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C9A86A]" />
          )}
        </button>

        {/* Section B: UNGA (Online Committee) Registration */}
        <button
          type="button"
          onClick={() => {
            setSelectedForm("unga");
            setSubmittedCA(null);
          }}
          className={`p-5 text-left border transition-all duration-200 cursor-pointer relative ${selectedForm === "unga"
            ? "border-[#C9A86A] bg-[#2E3B2F] shadow-lg"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#C9A86A]/50 hover:bg-[#2E3B2F]/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A]">
              SECTION B &bull; ONLINE
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#1A1F1A] bg-[#C9A86A] px-2 py-0.5 font-bold">
                NOW OPEN
              </span>
              <Globe className={`h-5 w-5 ${selectedForm === "unga" ? "text-[#C9A86A]" : "text-[#8A9A7E]"}`} />
            </div>
          </div>
          <h2 className="font-serif text-lg text-[#EDE6D3] font-medium block">
            UNGA (Online Committee)
          </h2>
          <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
            Dates: 16th & 17th Jan 2027
          </p>
          {selectedForm === "unga" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C9A86A]" />
          )}
        </button>

        {/* Section C: Campus Ambassador Registration */}
        <button
          type="button"
          onClick={() => {
            setSelectedForm("campus-ambassador");
            setSubmittedCA(null);
          }}
          className={`p-5 text-left border transition-all duration-200 cursor-pointer relative ${selectedForm === "campus-ambassador"
            ? "border-[#8BA06F] bg-[#2E3B2F] shadow-lg"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#8BA06F]/50 hover:bg-[#2E3B2F]/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8BA06F]">
              SECTION C &bull; OUTREACH
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5">
                NOW OPEN
              </span>
              <Users className={`h-5 w-5 ${selectedForm === "campus-ambassador" ? "text-[#8BA06F]" : "text-[#8A9A7E]"}`} />
            </div>
          </div>
          <h2 className="font-serif text-lg text-[#EDE6D3] font-medium block">
            Campus Ambassador
          </h2>
          <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
            Represent IISTMUN 2027 at your college, lead contingents &amp; earn rewards.
          </p>
          {selectedForm === "campus-ambassador" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8BA06F]" />
          )}
        </button>
      </div>

      {/* SECTION A: PRIORITY REGISTRATION FORM */}
      {selectedForm === "priority" && (
        <Registration
          embedded={true}
          initialPreference={initialPreference}
          clearInitialPreference={clearInitialPreference}
          setActiveTab={setActiveTab}
        />
      )}

      {/* SECTION B: UNGA ONLINE REGISTRATION FORM */}
      {selectedForm === "unga" && (
        <UNGARegistration
          embedded={true}
          initialPreference={initialPreference}
          clearInitialPreference={clearInitialPreference}
          setActiveTab={setActiveTab}
        />
      )}

      {/* SECTION B: CAMPUS AMBASSADOR REGISTRATION */}
      {selectedForm === "campus-ambassador" && (
        submittedCA ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-[#8BA06F] bg-[#233124] p-6 sm:p-8 space-y-6 shadow-2xl relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#8BA06F]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8BA06F]/20 border border-[#8BA06F] text-[#8BA06F]">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8BA06F] block">
                    REGISTRATION ACKNOWLEDGED
                  </span>
                  <h3 className="font-serif text-2xl text-[#EDE6D3]">
                    Campus Ambassador Dossier Registered
                  </h3>
                </div>
              </div>

              <div className="bg-[#1A1F1A] border border-[#8BA06F]/40 px-4 py-2.5 flex items-center justify-between sm:justify-start gap-4">
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-[#8A9A7E]">
                    FELLOWSHIP ID
                  </span>
                  <span className="font-mono text-base font-bold text-[#8BA06F]">
                    {submittedCA.id}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(submittedCA.id)}
                  className="p-1.5 text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors"
                  title="Copy Fellowship ID"
                >
                  {copiedId ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
              <div className="p-3 bg-[#1A1F1A]/60 border border-[#8A9A7E]/20">
                <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Ambassador</span>
                <span className="text-[#EDE6D3] font-medium text-sm block mt-0.5">{submittedCA.name}</span>
                <span className="text-[#8A9A7E] text-[11px]">{submittedCA.phone}</span>
              </div>
              <div className="p-3 bg-[#1A1F1A]/60 border border-[#8A9A7E]/20">
                <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Campus</span>
                <span className="text-[#EDE6D3] font-medium text-sm block mt-0.5">{submittedCA.institution}</span>
                <span className="text-[#8A9A7E] text-[11px]">{submittedCA.cityState}</span>
              </div>
              <div className="p-3 bg-[#1A1F1A]/60 border border-[#8A9A7E]/20">
                <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Target Mobilization</span>
                <span className="text-[#8BA06F] font-medium text-sm block mt-0.5">{submittedCA.targetMobilization}</span>
                <span className="text-[#8A9A7E] text-[11px]">{submittedCA.course}</span>
              </div>
            </div>

            <div className="p-4 bg-[#1A1F1A] border border-[#8BA06F]/20 text-xs text-[#8A9A7E] space-y-2">
              <p className="leading-relaxed">
                Welcome to the IISTMUN 2027 Campus Ambassador network! The Outreach and External Affairs wing will reach out with your institutional kit, delegate referral guidelines, and ambassador perks.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSubmittedCA(null)}
                className="px-4 py-2 border border-[#8BA06F]/40 text-[#EDE6D3] text-xs uppercase tracking-wider hover:bg-[#2E3B2F] transition-colors cursor-pointer"
              >
                Register Another Campus
              </button>
              <button
                onClick={() => {
                  setActiveTab("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2 border border-[#8BA06F] bg-[#8BA06F] text-[#1A1F1A] text-xs uppercase tracking-wider font-semibold hover:bg-[#EDE6D3] transition-colors cursor-pointer"
              >
                Return to Homepage
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmitCA} className="space-y-8">

            {/* Section 1: Ambassador Credentials */}
            <div className="border border-[#8BA06F]/40 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#8BA06F]/20">
                <User className="h-4 w-4 text-[#8BA06F]" />
                <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                  1. Campus Ambassador Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={caForm.name}
                    onChange={(e) => setCaForm({ ...caForm, name: e.target.value })}
                    placeholder="e.g. Ananya Sen"
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  />
                  {errors.name && <span className="text-rose-400 text-[11px]">{errors.name}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={caForm.email}
                    onChange={(e) => setCaForm({ ...caForm, email: e.target.value })}
                    placeholder="e.g. ananya@college.edu"
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  />
                  {errors.email && <span className="text-rose-400 text-[11px]">{errors.email}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Phone / WhatsApp Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={caForm.phone}
                    onChange={(e) => setCaForm({ ...caForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  />
                  {errors.phone && <span className="text-rose-400 text-[11px]">{errors.phone}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    College / University <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={caForm.institution}
                    onChange={(e) => setCaForm({ ...caForm, institution: e.target.value })}
                    placeholder="e.g. St. Xavier's College, Mumbai"
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  />
                  {errors.institution && <span className="text-rose-400 text-[11px]">{errors.institution}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Degree / Course <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={caForm.course}
                    onChange={(e) => setCaForm({ ...caForm, course: e.target.value })}
                    placeholder="e.g. B.Tech Aerospace / B.A. Political Science"
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  />
                  {errors.course && <span className="text-rose-400 text-[11px]">{errors.course}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Year of Study
                  </label>
                  <select
                    value={caForm.yearOfStudy}
                    onChange={(e) => setCaForm({ ...caForm, yearOfStudy: e.target.value })}
                    className="w-full bg-[#1A1F1A] border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  >
                    <option value="1st Year">1st Year (UG)</option>
                    <option value="2nd Year">2nd Year (UG)</option>
                    <option value="3rd Year">3rd Year (UG)</option>
                    <option value="4th Year">4th Year (UG)</option>
                    <option value="Postgraduate">Postgraduate (PG)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    City &amp; State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={caForm.cityState}
                    onChange={(e) => setCaForm({ ...caForm, cityState: e.target.value })}
                    placeholder="e.g. Bengaluru, Karnataka"
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  />
                  {errors.cityState && <span className="text-rose-400 text-[11px]">{errors.cityState}</span>}
                </div>
              </div>
            </div>

            {/* Section 2: Verification Credentials & ID */}
            <div className="border border-[#8BA06F]/40 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#8BA06F]/20">
                <ShieldCheck className="h-4 w-4 text-[#8BA06F]" />
                <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                  2. Institutional Verification &amp; Passport Photo
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <FileUploadZone
                    label="Passport-Style Photograph"
                    sublabel="Headshot for official CA badge & ambassador dossier (JPG/PNG, max 500KB)."
                    fileType="image"
                    accept="image/*"
                    maxSizeMB={0.5}
                    valueUrl={caForm.photoUrl}
                    valueName={caForm.photoName}
                    onChange={(url, name) => setCaForm({ ...caForm, photoUrl: url, photoName: name })}
                    onClear={() => setCaForm({ ...caForm, photoUrl: "", photoName: "" })}
                  />
                </div>

                <div>
                  <FileUploadZone
                    label="College ID Proof / Bona Fide"
                    sublabel="Valid College ID card scan or signed institutional bona fide (max 600KB)."
                    fileType="document"
                    accept=".pdf,image/*"
                    maxSizeMB={0.6}
                    valueUrl={caForm.idProofUrl}
                    valueName={caForm.idProofName}
                    onChange={(url, name) => setCaForm({ ...caForm, idProofUrl: url, idProofName: name })}
                    onClear={() => setCaForm({ ...caForm, idProofUrl: "", idProofName: "" })}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Outreach Strategy & Mobilization */}
            <div className="border border-[#8BA06F]/40 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#8BA06F]/20">
                <Users className="h-4 w-4 text-[#8BA06F]" />
                <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                  3. Outreach Strategy &amp; Mobilization Plan
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                      Campus Clubs / Societies Affiliations
                    </label>
                    <input
                      type="text"
                      value={caForm.collegeClubs}
                      onChange={(e) => setCaForm({ ...caForm, collegeClubs: e.target.value })}
                      placeholder="e.g. Debating Society, Rotaract, Student Council"
                      className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                      LinkedIn / Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={caForm.socialHandles}
                      onChange={(e) => setCaForm({ ...caForm, socialHandles: e.target.value })}
                      placeholder="@username or linkedin.com/in/..."
                      className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Why do you wish to represent IISTMUN 2027? <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={caForm.motivation}
                    onChange={(e) => setCaForm({ ...caForm, motivation: e.target.value })}
                    placeholder="Share your interest in space diplomacy and your motivation for joining the ambassador network..."
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none leading-relaxed"
                  />
                  {errors.motivation && <span className="text-rose-400 text-[11px]">{errors.motivation}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Delegation Mobilization &amp; Promotion Strategy <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={caForm.promotionPlan}
                    onChange={(e) => setCaForm({ ...caForm, promotionPlan: e.target.value })}
                    placeholder="How do you intend to publicize IISTMUN in your institution? (WhatsApp groups, departmental circulars, MUN society collaborations...)"
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none leading-relaxed"
                  />
                  {errors.promotionPlan && <span className="text-rose-400 text-[11px]">{errors.promotionPlan}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Target Delegate Mobilization
                  </label>
                  <select
                    value={caForm.targetMobilization}
                    onChange={(e) => setCaForm({ ...caForm, targetMobilization: e.target.value })}
                    className="w-full bg-[#1A1F1A] border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  >
                    <option value="5-10 Delegates">5 - 10 Delegates (Standard Contingent)</option>
                    <option value="10-20 Delegates">10 - 20 Delegates (Priority Delegation)</option>
                    <option value="20-35 Delegates">20 - 35 Delegates (Mega Contingent)</option>
                    <option value="35+ Delegates">35+ Delegates (Multi-College Delegation)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <span className="font-sans text-xs text-[#8A9A7E]">
                Campus Ambassadors receive official IISTMUN certification, free conference kit, and contingent rewards.
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 border border-[#8BA06F] bg-[#8BA06F] text-[#1A1F1A] font-sans text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#EDE6D3] hover:border-[#EDE6D3] transition-all duration-200 cursor-pointer disabled:opacity-60 shadow-lg"
              >
                {isSubmitting ? "Registering Ambassador..." : "Submit Campus Ambassador Registration"}
              </button>
            </div>
          </form>
        )
      )}

    </div>
  );
}
