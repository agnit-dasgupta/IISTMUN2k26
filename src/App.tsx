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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#1A1F1A] text-[#EDE6D3] selection:bg-[#C9A86A]/30 selection:text-[#EDE6D3] paper-grain font-sans">
      
      {/* Navbar Component */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tabbed Layout Content */}
      <main className="flex-grow relative">
        {renderActiveContent()}
      </main>

      {/* Archival Diplomatic Footer */}
      <footer className="relative z-10 border-t border-[#C9A86A]/20 bg-[#141814] py-14 px-4 sm:px-6 lg:px-8 text-left">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#8A9A7E]/20">
            {/* Branding */}
            <div className="md:col-span-2 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A86A] bg-[#2E3B2F] text-[#C9A86A] font-serif text-sm">
                  IM
                </div>
                <div>
                  <span className="font-serif text-xl font-normal text-[#EDE6D3] tracking-wide block">
                    IIST MUN <span className="text-[#C9A86A]">2026</span>
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] block">
                    Save · Sustain · Safeguard
                  </span>
                </div>
              </div>
              <p className="font-sans text-xs text-[#8A9A7E] leading-relaxed max-w-md">
                The premier diplomatic convocation organized by the Indian Institute of Space Science and Technology (IIST), Valiamala, Thiruvananthapuram. Convening future leaders to debate environmental resilience, sustainable exploration, and global diplomacy.
              </p>
              <div className="flex gap-4 pt-1">
                <a
                  href="mailto:contact@iistmun.in"
                  className="text-[#8A9A7E] hover:text-[#C9A86A] transition-colors text-xs flex items-center gap-1.5 font-mono"
                >
                  <Mail className="h-3.5 w-3.5 text-[#C9A86A]" />
                  contact@iistmun.in
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-left space-y-3">
              <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold">Committees</h4>
              <ul className="space-y-2 font-sans text-xs">
                <li>
                  <button onClick={() => setActiveTab("committees")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    COPUOS Outer Space
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("committees")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    UNGA Disarmament (DISEC)
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("committees")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    AIPPM Political Assembly
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("committees")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    UN Security Council
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources / Portals */}
            <div className="text-left space-y-3">
              <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold">Dispatches & Portals</h4>
              <ul className="space-y-2 font-sans text-xs">
                <li>
                  <button onClick={() => setActiveTab("matrix")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    Country Matrix
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("register")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    Delegate Registration
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("schedule")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    Conference Schedule
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("faq")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    Field Guide & FAQ
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Subfooter */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="block font-sans text-[10px] uppercase tracking-[0.15em] text-[#8A9A7E]/70 font-medium">
                &copy; 2026 IIST MODEL UNITED NATIONS. ALL RIGHTS RESERVED.
              </span>
              <span className="block font-sans text-[10px] text-[#8A9A7E]/50 mt-0.5">
                Indian Institute of Space Science and Technology · Valiamala, Trivandrum
              </span>
            </div>
            
            <button
              onClick={handleScrollToTop}
              className="group flex items-center gap-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[#8A9A7E] hover:text-[#EDE6D3] transition-all border border-[#C9A86A]/30 hover:border-[#C9A86A] px-4 py-2 bg-[#2E3B2F]/40 cursor-pointer"
              id="back-to-orbit-btn"
            >
              Return to Top
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform text-[#C9A86A]" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
