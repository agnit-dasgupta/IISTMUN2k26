/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { COMMITTEES } from "../data";
import { RegistrationDetails } from "../types";
import { Rocket, Sparkles, User, Users, Landmark, ChevronRight, ChevronLeft, CheckCircle, Ticket, Calendar, Download, Share2, Phone, Mail, Award, AlertCircle } from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";

export default function Registration() {
  const { user, loading: authLoading, signInWithGoogle } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    regType: "individual" as "individual" | "double" | "contingent",
    name: "",
    email: "",
    phone: "",
    institution: "",
    course: "",
    munExperience: "None",
    pref1Committee: "copuos",
    pref1Country: "",
    pref2Committee: "disec",
    pref2Country: "",
    pref3Committee: "unsc",
    pref3Country: "",
    partnerName: "",
    partnerEmail: "",
    contingentSize: "5",
    motivation: ""
  });

  const [submittedPass, setSubmittedPass] = useState<RegistrationDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (validateStep() && user) {
      setLoading(true);
      try {
        const randomId = "IIST-" + Math.floor(100000 + Math.random() * 900000);
        const newReg = {
          id: randomId,
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
    navigator.clipboard.writeText(`🚀 I just registered as a delegate for IIST MUN 2026! Portfolio Preferred: ${submittedPass.pref1Country} in ${submittedPass.pref1Committee.toUpperCase()}. Launch Code: ${submittedPass.id}`);
    alert("🌌 Orbit credentials copied to clipboard! Share with your delegates pool.");
  };

  const handleDownloadReceipt = () => {
    alert("🛰️ Generating high-resolution vector boarding pass...\nDownload started successfully for IIST-MUN-2026-BoardingPass.png!");
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
          pref1Committee: "copuos",
          pref1Country: "",
          pref2Committee: "disec",
          pref2Country: "",
          pref3Committee: "unsc",
          pref3Country: "",
          partnerName: "",
          partnerEmail: "",
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
      <div className="relative z-10 mx-auto max-w-4xl">
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
              onClick={signInWithGoogle}
              className="mt-8 w-full rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-900/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              id="registration-login-btn"
            >
              Sign In with Google
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
            <p className="font-sans text-slate-400 text-xs mt-4 font-bold tracking-widest uppercase">// RETRIEVING ORBITAL CLEARANCE...</p>
          </div>
        ) : submittedPass ? (
          <div className="animate-fade-in" id="boarding-pass-display">
            {/* Success message */}
            <div className="text-center mb-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce-slow">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="font-sans text-3xl font-extrabold text-white">Orbit Clearance Approved</h1>
              <p className="font-sans text-sm text-slate-400 mt-2">
                Your delegate file has been loaded into our orbital database successfully. Below is your official Boarding Pass.
              </p>
            </div>

            {/* Futuristic Boarding Pass Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl">
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
                        {submittedPass.regType === "double" && (
                          <span className="block font-sans text-xs text-slate-400">Partner: {submittedPass.partnerName}</span>
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
                  </div>

                  {/* Right Column: Ticket / QR Code simulation */}
                  <div className="flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl p-6 border border-slate-800">
                    {/* Simulated Pixelated QR Code */}
                    <div className="grid grid-cols-6 gap-1 h-20 w-20 bg-white p-2 rounded-lg">
                      <div className="bg-slate-950 col-span-2 row-span-2"></div>
                      <div className="bg-white"></div>
                      <div className="bg-slate-950"></div>
                      <div className="bg-slate-950"></div>
                      <div className="bg-white"></div>
                      <div className="bg-white"></div>
                      <div className="bg-slate-950 col-span-2"></div>
                      <div className="bg-slate-950"></div>
                      <div className="bg-white"></div>
                      <div className="bg-white"></div>
                      <div className="bg-slate-950"></div>
                      <div className="bg-slate-950 col-span-2 row-span-2"></div>
                      <div className="bg-white"></div>
                      <div className="bg-slate-950"></div>
                      <div className="bg-slate-950"></div>
                      <div className="bg-white"></div>
                      <div className="bg-slate-950"></div>
                      <div className="bg-white"></div>
                      <div className="bg-slate-950"></div>
                    </div>
                    <span className="mt-3 font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">Scan at Security</span>
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
                id="receipt-download-btn"
                className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-850 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-slate-200 transition-all active:scale-95"
              >
                <Download className="h-4 w-4 text-slate-400" />
                Download Boarding Pass
              </button>
              <button
                onClick={handleShare}
                id="receipt-share-btn"
                className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 shadow-blue-900/20"
              >
                <Share2 className="h-4 w-4" />
                Share Orbit Status
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleReset}
                id="receipt-reset-btn"
                className="text-slate-500 hover:text-slate-300 font-mono text-xs uppercase tracking-wider underline underline-offset-4"
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
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Academic Institution</label>
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="Indian Institute of Space Science and Technology"
                      />
                      {errors.institution && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.institution}</p>}
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
                  </div>

                  {/* Double Delegation Partner details if double selected */}
                  {formData.regType === "double" && (
                    <div className="rounded-3xl border border-indigo-500/20 bg-indigo-950/5 p-5 space-y-4">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-bold block">// DOUBLE DELEGATION: PARTNER DETAILS</span>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                  <div className="space-y-4">
                    {/* Preference 1 */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-5 rounded-3xl border border-slate-900 bg-slate-950/40">
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold">1st Council Preference</label>
                        <select
                          value={formData.pref1Committee}
                          onChange={(e) => setFormData({ ...formData, pref1Committee: e.target.value })}
                          className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none font-bold uppercase tracking-wider"
                        >
                          {COMMITTEES.map((com) => (
                            <option key={com.id} value={com.id} className="bg-slate-950">{com.abbreviation} - {com.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold">1st Choice Country / Portfolio</label>
                        <input
                          type="text"
                          value={formData.pref1Country}
                          onChange={(e) => setFormData({ ...formData, pref1Country: e.target.value })}
                          className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-750 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-medium"
                          placeholder="e.g. United States or Narendra Modi"
                        />
                        {errors.pref1Country && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold">{errors.pref1Country}</p>}
                      </div>
                    </div>

                    {/* Preference 2 */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-5 rounded-3xl border border-slate-900 bg-slate-950/30 opacity-90">
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold">2nd Council Preference</label>
                        <select
                          value={formData.pref2Committee}
                          onChange={(e) => setFormData({ ...formData, pref2Committee: e.target.value })}
                          className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none font-bold uppercase tracking-wider"
                        >
                          {COMMITTEES.map((com) => (
                            <option key={com.id} value={com.id} className="bg-slate-950">{com.abbreviation} - {com.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold">2nd Choice Country / Portfolio</label>
                        <input
                          type="text"
                          value={formData.pref2Country}
                          onChange={(e) => setFormData({ ...formData, pref2Country: e.target.value })}
                          className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-750 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-medium"
                          placeholder="e.g. Russian Federation"
                        />
                      </div>
                    </div>

                    {/* Preference 3 */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-5 rounded-3xl border border-slate-900 bg-slate-950/20 opacity-80">
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold">3rd Council Preference</label>
                        <select
                          value={formData.pref3Committee}
                          onChange={(e) => setFormData({ ...formData, pref3Committee: e.target.value })}
                          className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none font-bold uppercase tracking-wider"
                        >
                          {COMMITTEES.map((com) => (
                            <option key={com.id} value={com.id} className="bg-slate-950">{com.abbreviation} - {com.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold">3rd Choice Country / Portfolio</label>
                        <input
                          type="text"
                          value={formData.pref3Country}
                          onChange={(e) => setFormData({ ...formData, pref3Country: e.target.value })}
                          className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-750 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-medium"
                          placeholder="e.g. Japan"
                        />
                      </div>
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
      </div>
    </div>
  );
}

