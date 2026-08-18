/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Committees from "./components/Committees";
import CountryMatrix from "./components/CountryMatrix";
import Schedule from "./components/Schedule";
import Secretariat from "./components/Secretariat";
import FAQs from "./components/FAQs";
import Registration from "./components/Registration";
import AdminDashboard from "./components/AdminDashboard";
import WorkshopRegistration from "./components/WorkshopRegistration";
import { Compass, Globe, Star, ShieldCheck, Mail, ArrowUpRight, Orbit, Sparkles } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [initialPreference, setInitialPreference] = useState<{ country: string; committee: string } | null>(null);

  const renderActiveContent = () => {
    switch (activeTab) {
      case "home":
        return <Home setActiveTab={setActiveTab} />;
      case "committees":
        return <Committees />;
      case "matrix":
        return <CountryMatrix onSelectPreference={(country, committee) => {
          setInitialPreference({ country, committee });
          setActiveTab("register");
        }} />;
      case "schedule":
        return <Schedule />;
      case "secretariat":
        return <Secretariat />;
      case "faq":
        return <FAQs />;
      case "register":
        return <Registration 
          initialPreference={initialPreference} 
          clearInitialPreference={() => setInitialPreference(null)} 
        />;
      case "workshop-register":
        return <WorkshopRegistration setActiveTab={setActiveTab} />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#04060a] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navbar Component */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tabbed Layout Content */}
      <main className="flex-grow relative">
        {renderActiveContent()}
      </main>

      {/* Orionix Dark Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#04060a] py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/[0.06]">
            {/* Branding */}
            <div className="md:col-span-2 space-y-4 text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 font-black text-xs text-white shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                  I
                </div>
                <span className="font-sans text-base font-black text-white tracking-wider uppercase">
                  IIST <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">MUN 2026</span>
                </span>
              </div>
              <p className="font-sans text-xs text-slate-400 leading-relaxed max-w-md">
                Organized by the students of the Indian Institute of Space Science and Technology (IIST), Valiamala, Thiruvananthapuram. Bringing together the brightest minds across India to solve international challenges at the interface of technology and celestial governance.
              </p>
              <div className="flex gap-4 pt-1">
                <a
                  href="mailto:secgen.iistmun@gmail.com"
                  className="text-slate-400 hover:text-cyan-400 transition-colors text-xs flex items-center gap-1.5 font-mono"
                >
                  <Mail className="h-3.5 w-3.5 text-cyan-400" />
                  contact@iistmun.in
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-left space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">// CHAMBERS DOSSIER</h4>
              <ul className="space-y-2 font-sans text-xs">
                <li>
                  <button onClick={() => setActiveTab("committees")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    COPUOS Outer Space
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("committees")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    UNGA Disarmament (DISEC)
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("committees")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    AIPPM Political Meet
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("committees")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    UN Security Council
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources / Portals */}
            <div className="text-left space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">// TELEMETRY PORTALS</h4>
              <ul className="space-y-2 font-sans text-xs">
                <li>
                  <button onClick={() => setActiveTab("matrix")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Portfolio Allocation Matrix
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("register")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Delegate Launch Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("schedule")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Chronos Timetable
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("faq")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Intelligence Dossiers (FAQ)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Subfooter */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                &copy; 2026 IIST MODEL UNITED NATIONS. ALL RIGHTS RESERVED.
              </span>
              <span className="block font-sans text-[10px] text-slate-600 mt-0.5">
                Affiliated with the Indian Space Research Organisation (ISRO).
              </span>
            </div>
            
            <button
              onClick={handleScrollToTop}
              className="group flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all border border-white/[0.08] hover:border-cyan-500/30 rounded-full px-4 py-2 bg-white/[0.02] cursor-pointer"
              id="back-to-orbit-btn"
            >
              Back to Orbit
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform text-cyan-400" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
