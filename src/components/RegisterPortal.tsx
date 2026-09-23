/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Award,
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
  ChevronRight,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  HelpCircle
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { EBRegistration, CampusAmbassadorRegistration } from "../types";
import FileUploadZone from "./FileUploadZone";
import { motion, AnimatePresence } from "motion/react";

interface RegisterPortalProps {
  initialPortalTab?: "eb" | "campus-ambassador";
  setActiveTab: (tab: string) => void;
}

export default function RegisterPortal({ initialPortalTab = "eb", setActiveTab }: RegisterPortalProps) {
  const { user } = useFirebase();
  const [selectedForm, setSelectedForm] = useState<"eb" | "campus-ambassador">(initialPortalTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Success state
  const [submittedEB, setSubmittedEB] = useState<EBRegistration | null>(null);
  const [submittedCA, setSubmittedCA] = useState<CampusAmbassadorRegistration | null>(null);

  // EB Form State
  const [ebForm, setEbForm] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    course: "",
    yearOfStudy: "2nd Year",
    cityState: "",
    photoUrl: "",
    photoName: "",
    cvUrl: "",
    cvName: "",
    munDelegateCount: "3-5 MUNs",
    munEbCount: "1-2 MUNs",
    experienceSummary: "",
    pref1Committee: "uncopuos",
    pref1Role: "Chairperson",
    pref2Committee: "unhrc",
    pref2Role: "Vice-Chairperson",
    proposedAgendas: "",
    motivation: "",
    sampleStudyGuideLink: "",
    linkedinProfile: ""
  });

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
      setEbForm((prev) => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
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
      setSelectedForm(initialPortalTab);
    }
  }, [initialPortalTab]);

  const committeesList = [
    { id: "uncopuos", name: "UNCOPUOS (UN Committee on the Peaceful Uses of Outer Space)" },
    { id: "unhrc", name: "UNHRC (United Nations Human Rights Council)" },
    { id: "unodc", name: "UNODC (United Nations Office on Drugs and Crime)" },
    { id: "nes75", name: "NES'75 (National Emergency Summit 1975)" },
    { id: "unga", name: "UNGA (United Nations General Assembly) [Online Committee]" },
    { id: "undp", name: "UNDP (United Nations Development Programme)" },
    { id: "ip", name: "International Press (IP - Journalism & Photography)" }
  ];

  const ebRolesList = [
    "Chairperson",
    "Vice-Chairperson",
    "Director",
    "Rapporteur",
    "Editor-in-Chief (International Press)",
    "Head of Photography (IP)"
  ];

  const validateEB = () => {
    const err: Record<string, string> = {};
    if (!ebForm.name.trim()) err.name = "Full name is required.";
    if (!ebForm.email.trim() || !/\S+@\S+\.\S+/.test(ebForm.email)) err.email = "Valid email is required.";
    if (!ebForm.phone.trim()) err.phone = "Phone number is required.";
    if (!ebForm.institution.trim()) err.institution = "College or university is required.";
    if (!ebForm.course.trim()) err.course = "Course / Field of study is required.";
    if (!ebForm.cityState.trim()) err.cityState = "City & State is required.";
    if (!ebForm.experienceSummary.trim() || ebForm.experienceSummary.length < 20) {
      err.experienceSummary = "Please summarize your past MUN experience (min 20 characters).";
    }
    if (!ebForm.proposedAgendas.trim() || ebForm.proposedAgendas.length < 20) {
      err.proposedAgendas = "Please outline proposed agenda topics or committee vision.";
    }
    if (!ebForm.motivation.trim() || ebForm.motivation.length < 30) {
      err.motivation = "Please provide your Statement of Purpose (min 30 characters).";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

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

  const handleSubmitEB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEB()) {
      window.scrollTo({ top: 300, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    const regId = `EB-2027-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const payload: EBRegistration = {
      id: regId,
      userId: user?.uid || "guest-applicant",
      timestamp,
      status: "Pending",
      name: ebForm.name.trim(),
      email: ebForm.email.trim().toLowerCase(),
      phone: ebForm.phone.trim(),
      institution: ebForm.institution.trim(),
      course: ebForm.course.trim(),
      yearOfStudy: ebForm.yearOfStudy,
      cityState: ebForm.cityState.trim(),
      photoUrl: ebForm.photoUrl || "",
      photoName: ebForm.photoName || "",
      cvUrl: ebForm.cvUrl || "",
      cvName: ebForm.cvName || "",
      munDelegateCount: ebForm.munDelegateCount,
      munEbCount: ebForm.munEbCount,
      experienceSummary: ebForm.experienceSummary.trim(),
      pref1Committee: ebForm.pref1Committee,
      pref1Role: ebForm.pref1Role,
      pref2Committee: ebForm.pref2Committee,
      pref2Role: ebForm.pref2Role,
      proposedAgendas: ebForm.proposedAgendas.trim(),
      motivation: ebForm.motivation.trim(),
      sampleStudyGuideLink: ebForm.sampleStudyGuideLink.trim() || "",
      linkedinProfile: ebForm.linkedinProfile.trim() || ""
    };

    // Validate payload size does not exceed Firestore's 1,048,576 bytes (1 MiB) limit
    const payloadBytes = new Blob([JSON.stringify(payload)]).size;
    if (payloadBytes > 1030000) {
      alert(
        `Application payload (${(payloadBytes / 1024 / 1024).toFixed(2)} MB) exceeds the Firestore document limit (1 MB). ` +
        `Please attach a smaller photo or provide a Google Drive / OneDrive link for your CV.`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // Save directly and solely to Firebase Firestore
      await setDoc(doc(db, "eb_registrations", regId), payload);
      setSubmittedEB(payload);
      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission failed:", err);
      const isSizeError = err?.message?.includes("exceeds the maximum allowed size");
      alert(
        isSizeError
          ? "Submission failed: Attached files exceed the 1MB database document limit. Please use a Google Drive cloud link for your CV."
          : `Submission encountered an issue (${err?.message || "unknown error"}). Please retry or contact support.`
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] border border-[#8A9A7E]/30 px-2.5 py-1">
              APPLICATIONS NOW OPEN
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#EDE6D3] font-normal tracking-tight leading-tight">
            Leadership & Representation <br />
            <span className="text-[#C9A86A] italic">Registration Dossier</span>
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#EDE6D3]/80 leading-relaxed font-light">
            Welcome to the recruitment portal of <strong className="text-[#EDE6D3]">IIST Model United Nations 2027</strong>.
            Choose your path: apply to preside as an <span className="text-[#C9A86A] font-medium">Executive Board member</span> to guide substantive debate, or join the prestigious <span className="text-[#8BA06F] font-medium">Campus Ambassador Network</span> to mobilize leadership from your academic institution.
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

      {/* Dual Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <button
          type="button"
          onClick={() => {
            setSelectedForm("eb");
            setSubmittedEB(null);
            setSubmittedCA(null);
          }}
          className={`p-5 text-left border transition-all duration-200 cursor-pointer relative ${selectedForm === "eb"
            ? "border-[#C9A86A] bg-[#2E3B2F] shadow-lg"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#C9A86A]/50 hover:bg-[#2E3B2F]/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A86A]">
              SECTION A
            </span>
            <ShieldCheck className={`h-5 w-5 ${selectedForm === "eb" ? "text-[#C9A86A]" : "text-[#8A9A7E]"}`} />
          </div>
          <h2 className="font-serif text-lg sm:text-xl text-[#EDE6D3] font-medium block">
            Executive Board (EB) Registration
          </h2>
          <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
            Apply for Chairperson, Vice-Chair, Director, Rapporteur, or International Press leadership.
          </p>
          {selectedForm === "eb" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C9A86A]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedForm("campus-ambassador");
            setSubmittedEB(null);
            setSubmittedCA(null);
          }}
          className={`p-5 text-left border transition-all duration-200 cursor-pointer relative ${selectedForm === "campus-ambassador"
            ? "border-[#8BA06F] bg-[#2E3B2F] shadow-lg"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#8BA06F]/50 hover:bg-[#2E3B2F]/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8BA06F]">
              SECTION B
            </span>
            <Users className={`h-5 w-5 ${selectedForm === "campus-ambassador" ? "text-[#8BA06F]" : "text-[#8A9A7E]"}`} />
          </div>
          <h2 className="font-serif text-lg sm:text-xl text-[#EDE6D3] font-medium block">
            Campus Ambassador Registration
          </h2>
          <p className="font-sans text-xs text-[#8A9A7E] mt-1 leading-relaxed">
            Represent IISTMUN 2027 at your college, lead institutional contingents, and earn commendations.
          </p>
          {selectedForm === "campus-ambassador" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8BA06F]" />
          )}
        </button>
      </div>

      {/* RENDER SUCCESS CARD IF SUBMITTED */}
      {submittedEB && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-[#C9A86A] bg-[#233124] p-6 sm:p-8 space-y-6 shadow-2xl relative"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#C9A86A]/30">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A86A]/20 border border-[#C9A86A] text-[#C9A86A]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8BA06F] block">
                  SUBMISSION TRANSMITTED & ARCHIVED
                </span>
                <h3 className="font-serif text-2xl text-[#EDE6D3]">
                  Executive Board Application Received
                </h3>
              </div>
            </div>

            <div className="bg-[#1A1F1A] border border-[#C9A86A]/40 px-4 py-2.5 flex items-center justify-between sm:justify-start gap-4">
              <div>
                <span className="block font-mono text-[9px] uppercase tracking-wider text-[#8A9A7E]">
                  DOSSIER REFERENCE ID
                </span>
                <span className="font-mono text-base font-bold text-[#C9A86A]">
                  {submittedEB.id}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(submittedEB.id)}
                className="p-1.5 text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors"
                title="Copy Reference ID"
              >
                {copiedId ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="p-3 bg-[#1A1F1A]/60 border border-[#8A9A7E]/20">
              <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Applicant</span>
              <span className="text-[#EDE6D3] font-medium text-sm block mt-0.5">{submittedEB.name}</span>
              <span className="text-[#8A9A7E] text-[11px]">{submittedEB.email}</span>
            </div>
            <div className="p-3 bg-[#1A1F1A]/60 border border-[#8A9A7E]/20">
              <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">Institution</span>
              <span className="text-[#EDE6D3] font-medium text-sm block mt-0.5">{submittedEB.institution}</span>
              <span className="text-[#8A9A7E] text-[11px]">{submittedEB.course} • {submittedEB.yearOfStudy}</span>
            </div>
            <div className="p-3 bg-[#1A1F1A]/60 border border-[#8A9A7E]/20">
              <span className="text-[#8A9A7E] uppercase text-[10px] tracking-wider block">First Preference</span>
              <span className="text-[#C9A86A] font-medium text-sm block mt-0.5 uppercase">{submittedEB.pref1Role}</span>
              <span className="text-[#8A9A7E] text-[11px] uppercase">{submittedEB.pref1Committee}</span>
            </div>
          </div>

          <div className="p-4 bg-[#1A1F1A] border border-[#C9A86A]/20 text-xs text-[#8A9A7E] space-y-2">
            <p className="leading-relaxed">
              Your application has been logged into the IISTMUN 2027 Secretariat review queue.
              Our recruitment board, led by Deputy Secretary General <strong>Avinash P</strong>, will review your dossier and invite shortlisted applicants for a diplomatic evaluation interview.
            </p>
            <p className="font-mono text-[11px] text-[#C9A86A]">
              For urgent communications or updates to your portfolio submission, contact: +91 81796 94807.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setSubmittedEB(null)}
              className="px-4 py-2 border border-[#C9A86A]/40 text-[#EDE6D3] text-xs uppercase tracking-wider hover:bg-[#2E3B2F] transition-colors cursor-pointer"
            >
              Submit Another Application
            </button>
            <button
              onClick={() => {
                setActiveTab("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 border border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A] text-xs uppercase tracking-wider font-semibold hover:bg-[#EDE6D3] transition-colors cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>
        </motion.div>
      )}

      {submittedCA && (
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
      )}

      {/* FORM 1: EXECUTIVE BOARD REGISTRATION */}
      {!submittedEB && !submittedCA && selectedForm === "eb" && (
        <form onSubmit={handleSubmitEB} className="space-y-8">

          {/* Section 1: Personal & Academic Credentials */}
          <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#C9A86A]/20">
              <User className="h-4 w-4 text-[#C9A86A]" />
              <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                1. Diplomatic & Academic Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={ebForm.name}
                  onChange={(e) => setEbForm({ ...ebForm, name: e.target.value })}
                  placeholder="e.g. S. Ramanujan"
                  className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                />
                {errors.name && <span className="text-rose-400 text-[11px]">{errors.name}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={ebForm.email}
                  onChange={(e) => setEbForm({ ...ebForm, email: e.target.value })}
                  placeholder="e.g. delegate@university.edu"
                  className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                />
                {errors.email && <span className="text-rose-400 text-[11px]">{errors.email}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Phone / WhatsApp Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  value={ebForm.phone}
                  onChange={(e) => setEbForm({ ...ebForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                />
                {errors.phone && <span className="text-rose-400 text-[11px]">{errors.phone}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Current Institution / University <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={ebForm.institution}
                  onChange={(e) => setEbForm({ ...ebForm, institution: e.target.value })}
                  placeholder="e.g. Indian Institute of Space Science and Technology"
                  className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                />
                {errors.institution && <span className="text-rose-400 text-[11px]">{errors.institution}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Degree & Course / Branch <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={ebForm.course}
                  onChange={(e) => setEbForm({ ...ebForm, course: e.target.value })}
                  placeholder="e.g. B.Tech Aerospace Engineering / BA Political Science"
                  className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                />
                {errors.course && <span className="text-rose-400 text-[11px]">{errors.course}</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                    Year of Study
                  </label>
                  <select
                    value={ebForm.yearOfStudy}
                    onChange={(e) => setEbForm({ ...ebForm, yearOfStudy: e.target.value })}
                    className="w-full bg-[#2E3B2F] border border-[#C9A86A]/30 px-3 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                    <option value="Alumnus / Professional">Alumnus / Professional</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                    City & State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={ebForm.cityState}
                    onChange={(e) => setEbForm({ ...ebForm, cityState: e.target.value })}
                    placeholder="e.g. Bengaluru, Karnataka"
                    className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 px-3 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                  />
                  {errors.cityState && <span className="text-rose-400 text-[11px]">{errors.cityState}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Photo and CV File Uploads (Drag & Drop) */}
          <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#C9A86A]/20">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[#C9A86A]" />
                <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                  2. Photograph & Curriculum Vitae (CV) Upload
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#C9A86A] uppercase tracking-wider border border-[#C9A86A]/30 px-2 py-0.5">
                DRAG & DROP SUPPORTED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Photo Upload Zone */}
              <FileUploadZone
                label="Professional Photograph"
                sublabel="Passport-style or formal headshot"
                fileType="image"
                accept="image/png,image/jpeg,image/webp"
                valueUrl={ebForm.photoUrl}
                valueName={ebForm.photoName}
                onChange={(url, name) => setEbForm({ ...ebForm, photoUrl: url, photoName: name })}
                onClear={() => setEbForm({ ...ebForm, photoUrl: "", photoName: "" })}
              />

              {/* CV Upload Zone */}
              <FileUploadZone
                label="Curriculum Vitae (CV) / MUN Resume"
                sublabel="PDF or Word format (Max 8MB)"
                fileType="document"
                accept=".pdf,.doc,.docx"
                valueUrl={ebForm.cvUrl}
                valueName={ebForm.cvName}
                onChange={(url, name) => setEbForm({ ...ebForm, cvUrl: url, cvName: name })}
                onClear={() => setEbForm({ ...ebForm, cvUrl: "", cvName: "" })}
              />
            </div>
          </div>

          {/* Section 3: MUN Experience & Background */}
          <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#C9A86A]/20">
              <Award className="h-4 w-4 text-[#C9A86A]" />
              <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                3. MUN Track Record & Presidium Experience
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Total MUNs as Delegate
                </label>
                <select
                  value={ebForm.munDelegateCount}
                  onChange={(e) => setEbForm({ ...ebForm, munDelegateCount: e.target.value })}
                  className="w-full bg-[#2E3B2F] border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                >
                  <option value="0 MUNs">0 MUNs</option>
                  <option value="1-2 MUNs">1 - 2 MUNs</option>
                  <option value="3-5 MUNs">3 - 5 MUNs</option>
                  <option value="6-10 MUNs">6 - 10 MUNs</option>
                  <option value="10+ MUNs">10+ MUNs</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Total MUNs as Executive Board / Secretariat
                </label>
                <select
                  value={ebForm.munEbCount}
                  onChange={(e) => setEbForm({ ...ebForm, munEbCount: e.target.value })}
                  className="w-full bg-[#2E3B2F] border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                >
                  <option value="0 MUNs (First EB Application)">0 MUNs (First EB Application)</option>
                  <option value="1-2 MUNs">1 - 2 MUNs</option>
                  <option value="3-5 MUNs">3 - 5 MUNs</option>
                  <option value="6-10 MUNs">6 - 10 MUNs</option>
                  <option value="10+ MUNs">10+ MUNs</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                Detailed Summary of Past MUN Experience & Awards Won <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                value={ebForm.experienceSummary}
                onChange={(e) => setEbForm({ ...ebForm, experienceSummary: e.target.value })}
                placeholder="List key conferences, committees moderated or attended, executive board appointments, and major delegate accolades (Best Delegate, High Commendation, etc.)."
                className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none leading-relaxed"
              />
              {errors.experienceSummary && <span className="text-rose-400 text-[11px]">{errors.experienceSummary}</span>}
            </div>
          </div>

          {/* Section 4: Committee & Position Preferences */}
          <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#C9A86A]/20">
              <Compass className="h-4 w-4 text-[#C9A86A]" />
              <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                4. Committee & Role Preferences
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Preference 1 */}
              <div className="p-4 border border-[#C9A86A]/40 bg-[#2E3B2F]/20 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] block">
                  PRIMARY PREFERENCE (1ST CHOICE)
                </span>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs text-[#EDE6D3] font-medium">Committee</label>
                  <select
                    value={ebForm.pref1Committee}
                    onChange={(e) => setEbForm({ ...ebForm, pref1Committee: e.target.value })}
                    className="w-full bg-[#1A1F1A] border border-[#C9A86A]/30 p-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                  >
                    {committeesList.map((comm) => (
                      <option key={comm.id} value={comm.id}>{comm.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs text-[#EDE6D3] font-medium">Desired Position</label>
                  <select
                    value={ebForm.pref1Role}
                    onChange={(e) => setEbForm({ ...ebForm, pref1Role: e.target.value })}
                    className="w-full bg-[#1A1F1A] border border-[#C9A86A]/30 p-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                  >
                    {ebRolesList.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preference 2 */}
              <div className="p-4 border border-[#8A9A7E]/30 bg-[#2E3B2F]/20 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                  SECONDARY PREFERENCE (2ND CHOICE)
                </span>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs text-[#EDE6D3] font-medium">Committee</label>
                  <select
                    value={ebForm.pref2Committee}
                    onChange={(e) => setEbForm({ ...ebForm, pref2Committee: e.target.value })}
                    className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 p-2.5 text-xs text-[#EDE6D3] focus:border-[#8A9A7E] focus:outline-none"
                  >
                    {committeesList.map((comm) => (
                      <option key={comm.id} value={comm.id}>{comm.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs text-[#EDE6D3] font-medium">Desired Position</label>
                  <select
                    value={ebForm.pref2Role}
                    onChange={(e) => setEbForm({ ...ebForm, pref2Role: e.target.value })}
                    className="w-full bg-[#1A1F1A] border border-[#8A9A7E]/30 p-2.5 text-xs text-[#EDE6D3] focus:border-[#8A9A7E] focus:outline-none"
                  >
                    {ebRolesList.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Substantive Vision & Agendas */}
          <div className="border border-[#C9A86A]/30 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#C9A86A]/20">
              <Sparkles className="h-4 w-4 text-[#C9A86A]" />
              <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                5. Agendas, Vision & Motivation
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Proposed Agenda Topic & Framing for 1st Preference Committee <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={ebForm.proposedAgendas}
                  onChange={(e) => setEbForm({ ...ebForm, proposedAgendas: e.target.value })}
                  placeholder="State the proposed agenda title, core conflict/treaty mechanism, and why this topic fits the theme of IISTMUN 2027 (Save • Sustain • Safeguard)."
                  className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none leading-relaxed"
                />
                {errors.proposedAgendas && <span className="text-rose-400 text-[11px]">{errors.proposedAgendas}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                  Statement of Purpose: Why should you be appointed to the Executive Board of IISTMUN 2027? <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={ebForm.motivation}
                  onChange={(e) => setEbForm({ ...ebForm, motivation: e.target.value })}
                  placeholder="Detail your leadership philosophy, approach to rookie vs seasoned delegates, and how you will ensure high-caliber substantive debate."
                  className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none leading-relaxed"
                />
                {errors.motivation && <span className="text-rose-400 text-[11px]">{errors.motivation}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                    Sample Background Guide / Writing Sample Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={ebForm.sampleStudyGuideLink}
                    onChange={(e) => setEbForm({ ...ebForm, sampleStudyGuideLink: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium">
                    LinkedIn / Portfolio URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={ebForm.linkedinProfile}
                    onChange={(e) => setEbForm({ ...ebForm, linkedinProfile: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-[#2E3B2F]/40 border border-[#C9A86A]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <span className="font-sans text-xs text-[#8A9A7E]">
              All submitted applications are legally archived and transmitted directly to the Secretariat.
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 border border-[#C9A86A] bg-[#C9A86A] text-[#1A1F1A] font-sans text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#EDE6D3] hover:border-[#EDE6D3] transition-all duration-200 cursor-pointer disabled:opacity-60 shadow-lg"
            >
              {isSubmitting ? "Transmitting Dossier..." : "Submit EB Application"}
            </button>
          </div>
        </form>
      )}

      {/* FORM 2: CAMPUS AMBASSADOR REGISTRATION */}
      {!submittedEB && !submittedCA && selectedForm === "campus-ambassador" && (
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
                  WhatsApp Contact Number <span className="text-rose-400">*</span>
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
                  College / University Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={caForm.institution}
                  onChange={(e) => setCaForm({ ...caForm, institution: e.target.value })}
                  placeholder="e.g. St. Xavier's College / IIT Madras / NIT Calicut"
                  className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                />
                {errors.institution && <span className="text-rose-400 text-[11px]">{errors.institution}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                  Course & Degree <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={caForm.course}
                  onChange={(e) => setCaForm({ ...caForm, course: e.target.value })}
                  placeholder="e.g. B.A. Economics / B.Tech Computer Science"
                  className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                />
                {errors.course && <span className="text-rose-400 text-[11px]">{errors.course}</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Year of Study
                  </label>
                  <select
                    value={caForm.yearOfStudy}
                    onChange={(e) => setCaForm({ ...caForm, yearOfStudy: e.target.value })}
                    className="w-full bg-[#2E3B2F] border border-[#8BA06F]/30 px-3 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    City & State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={caForm.cityState}
                    onChange={(e) => setCaForm({ ...caForm, cityState: e.target.value })}
                    placeholder="e.g. Kochi, Kerala"
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  />
                  {errors.cityState && <span className="text-rose-400 text-[11px]">{errors.cityState}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Photo and College ID / Resume Uploads (Drag & Drop) */}
          <div className="border border-[#8BA06F]/40 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#8BA06F]/20">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[#8BA06F]" />
                <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                  2. Photo & Verification Upload
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#8BA06F] uppercase tracking-wider border border-[#8BA06F]/30 px-2 py-0.5">
                DRAG & DROP SUPPORTED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Photo Upload Zone */}
              <FileUploadZone
                label="Profile Photograph"
                sublabel="Portrait image for CA accreditation badge"
                fileType="image"
                accept="image/png,image/jpeg,image/webp"
                valueUrl={caForm.photoUrl}
                valueName={caForm.photoName}
                onChange={(url, name) => setCaForm({ ...caForm, photoUrl: url, photoName: name })}
                onClear={() => setCaForm({ ...caForm, photoUrl: "", photoName: "" })}
              />

              {/* Student ID Proof / Resume Upload Zone */}
              <FileUploadZone
                label="Student ID Card / Resume"
                sublabel="Proof of college enrollment or CV (PDF/Doc)"
                fileType="document"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                valueUrl={caForm.idProofUrl}
                valueName={caForm.idProofName}
                onChange={(url, name) => setCaForm({ ...caForm, idProofUrl: url, idProofName: name })}
                onClear={() => setCaForm({ ...caForm, idProofUrl: "", idProofName: "" })}
              />
            </div>
          </div>

          {/* Section 3: Leadership & Socials */}
          <div className="border border-[#8BA06F]/40 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#8BA06F]/20">
              <Users className="h-4 w-4 text-[#8BA06F]" />
              <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                3. Campus Presence & Outreach Background
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                    Clubs / Student Bodies you are associated with
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
                    Social Media Handles (Instagram / LinkedIn)
                  </label>
                  <input
                    type="text"
                    value={caForm.socialHandles}
                    onChange={(e) => setCaForm({ ...caForm, socialHandles: e.target.value })}
                    placeholder="@yourhandle or linkedin.com/in/..."
                    className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                  Prior Experience as Campus Ambassador or Event Organizer
                </label>
                <input
                  type="text"
                  value={caForm.priorCaExperience}
                  onChange={(e) => setCaForm({ ...caForm, priorCaExperience: e.target.value })}
                  placeholder="e.g. Served as ambassador for Techfest, MUN, or managed literary fest promotions."
                  className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Motivation & Mobilization Strategy */}
          <div className="border border-[#8BA06F]/40 bg-[#1A1F1A]/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#8BA06F]/20">
              <Sparkles className="h-4 w-4 text-[#8BA06F]" />
              <h3 className="font-serif text-lg text-[#EDE6D3] font-medium">
                4. Outreach Plan & Mobilization Vision
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                  Why do you wish to represent IISTMUN 2027 as Campus Ambassador? <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={caForm.motivation}
                  onChange={(e) => setCaForm({ ...caForm, motivation: e.target.value })}
                  placeholder="Express your vision, connection to MUN culture, and enthusiasm to champion India's space diplomacy conference."
                  className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none leading-relaxed"
                />
                {errors.motivation && <span className="text-rose-400 text-[11px]">{errors.motivation}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                  How do you plan to promote the conference in your college? <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={caForm.promotionPlan}
                  onChange={(e) => setCaForm({ ...caForm, promotionPlan: e.target.value })}
                  placeholder="Outline your planned initiatives (e.g. WhatsApp batch group broadcasts, faculty permissions for classroom presentations, debating club tie-ups, campus noticeboards)."
                  className="w-full bg-[#2E3B2F]/40 border border-[#8BA06F]/30 p-3 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none leading-relaxed"
                />
                {errors.promotionPlan && <span className="text-rose-400 text-[11px]">{errors.promotionPlan}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs uppercase tracking-wider text-[#8BA06F] font-medium">
                  Estimated Number of Delegates you can Mobilize / Register
                </label>
                <select
                  value={caForm.targetMobilization}
                  onChange={(e) => setCaForm({ ...caForm, targetMobilization: e.target.value })}
                  className="w-full bg-[#2E3B2F] border border-[#8BA06F]/30 px-3.5 py-2.5 text-xs text-[#EDE6D3] focus:border-[#8BA06F] focus:outline-none"
                >
                  <option value="5-10 Delegates">5 - 10 Delegates</option>
                  <option value="10-20 Delegates">10 - 20 Delegates (Full Contingent)</option>
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
      )}

    </div>
  );
}
