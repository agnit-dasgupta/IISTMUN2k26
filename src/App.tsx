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
import CherryBlossomBackground from "./components/CherryBlossomBackground";
import { motion } from "motion/react";
import { Compass, Globe, Star, ShieldCheck, Mail, ArrowUpRight, Orbit, Sparkles } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [initialPreference, setInitialPreference] = useState<{ country: string; committee: string } | null>(null);

  const renderActiveContent = () => {
    switch (activeTab) {
      case "home":
      case "contact":
      case "how-to-reach":
      case "map":
      case "about-iist":
      case "about-iistmun":
        return <Home setActiveTab={setActiveTab} />;
      case "secretariat":
        return <Secretariat />;
      case "committees":
        return <Committees />;
      case "matrix":
        return <CountryMatrix onSelectPreference={(country, committee) => {
          setInitialPreference({ country, committee });
          setActiveTab("register");
        }} />;
      case "schedule":
        return <Schedule />;
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

  const navigateToSection = (sectionId: string) => {
    setActiveTab("home");
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#1A1F1A] text-[#EDE6D3] selection:bg-[#F8C8DC]/30 selection:text-[#EDE6D3] paper-grain font-sans relative">
      
      {/* Growing Cherry Blossom Background Branches & Cascading Petals */}
      <CherryBlossomBackground />

      {/* Navbar Component */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tabbed Layout Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, delay: 1.6, ease: "easeOut" }}
        className="flex-grow relative z-10"
      >
        {renderActiveContent()}
      </motion.main>

      {/* Archival Diplomatic Footer */}
      <footer className="relative z-10 border-t border-[#C9A86A]/20 bg-[#141814] py-14 px-4 sm:px-6 lg:px-8 text-left">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#8A9A7E]/20">
            {/* Branding */}
            <div className="md:col-span-2 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C9A86A]/60 bg-[#1A1F1A] overflow-hidden p-0.5 shadow-sm">
                  <img
                    src="/logo-emblem-transparent.png"
                    alt="IIST MUN 2027"
                    className="h-full w-full object-contain filter drop-shadow-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl font-normal text-[#EDE6D3] tracking-wide block">
                      IIST MUN <span className="text-[#C9A86A]">2027</span>
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-[#C9A86A]/30 bg-[#C9A86A]/10 text-[9px] font-mono text-[#C9A86A] uppercase tracking-wider">
                      14TH EDITION
                    </span>
                  </div>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8A9A7E] block mt-0.5">
                    14th Edition · Save · Sustain · Safeguard
                  </span>
                </div>
              </div>
              <p className="font-sans text-xs text-[#8A9A7E] leading-relaxed max-w-md">
                The premier diplomatic convocation organized by the Indian Institute of Space Science and Technology (IIST), Valiamala, Thiruvananthapuram. Convening future leaders to debate environmental resilience, sustainable exploration, and global diplomacy.
              </p>
              <div className="flex gap-4 pt-1">
                <a
                  href="mailto:support@iistmun.org"
                  className="text-[#8A9A7E] hover:text-[#C9A86A] transition-colors text-xs flex items-center gap-1.5 font-mono"
                >
                  <Mail className="h-3.5 w-3.5 text-[#C9A86A]" />
                  support@iistmun.org
                </a>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="text-left space-y-3">
              <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold">Convocation Navigation</h4>
              <ul className="space-y-2 font-sans text-xs">
                <li>
                  <button onClick={() => navigateToSection("hero-landing-section")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    Home &bull; Countdown
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateToSection("about-iist-section")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    About IIST
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateToSection("about-iistmun-section")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    About IISTMUN
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateToSection("map-section")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    Interactive Campus Map
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateToSection("contact-section")} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    Contact Us
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab("secretariat"); handleScrollToTop(); }} className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors cursor-pointer">
                    Secretariat Board
                  </button>
                </li>
              </ul>
            </div>

            {/* Registrations & Fellowship */}
            <div className="text-left space-y-3">
              <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-semibold">Registrations & Fellowship</h4>
              <ul className="space-y-2 font-sans text-xs text-[#8A9A7E]">
                <li>
                  <span className="text-[#C9A86A]">Executive Board (EB)</span>
                  <span className="block text-[10px] text-[#8A9A7E]/70">Opening Soon &bull; Applications Launching</span>
                </li>
                <li>
                  <span className="text-[#C9A86A]">Campus Ambassador</span>
                  <span className="block text-[10px] text-[#8A9A7E]/70">Opening Soon &bull; Outreach Network</span>
                </li>
                <li>
                  <span className="text-[#EDE6D3]/80">IIST Valiamala Campus</span>
                  <span className="block text-[10px] text-[#8A9A7E]/70">Thiruvananthapuram, Kerala &bull; 695547</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Subfooter */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="block font-sans text-[10px] uppercase tracking-[0.15em] text-[#8A9A7E]/70 font-medium">
                &copy; 2027 IIST MODEL UNITED NATIONS. ALL RIGHTS RESERVED.
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
