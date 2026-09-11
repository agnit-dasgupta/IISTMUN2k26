/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X, 
  Globe, 
  Mail,
  Users,
  Compass,
  Landmark,
  Sparkles
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { motion, AnimatePresence } from "motion/react";
import ScrollProgressBar from "./ScrollProgressBar";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { user, loading, signInWithGoogle, logout } = useFirebase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");

  const adminEmails = ["agnit.dg@gmail.com", "iist.mun.club@gmail.com"];
  const isAdmin = Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));

  // Navigation Items matching the required hierarchy
  const navItems = [
    { id: "home", label: "Home", number: "01", icon: Globe, sectionId: "hero-landing-section" },
    { id: "about-iist", label: "About IIST", number: "02", icon: Landmark, sectionId: "about-iist-section" },
    { id: "about-iistmun", label: "About IISTMUN", number: "03", icon: Sparkles, sectionId: "about-iistmun-section" },
    { id: "map", label: "Campus Map", number: "04", icon: Compass, sectionId: "map-section" },
    { id: "contact", label: "Contact Us", number: "05", icon: Mail, sectionId: "contact-section" },
    { id: "secretariat", label: "Secretariat", number: "06", icon: Users, sectionId: null },
    ...(isAdmin ? [{ id: "admin", label: "Admin Console", number: "07", icon: ShieldCheck, sectionId: null }] : []),
  ];

  // Observe scroll position to highlight active tab
  useEffect(() => {
    if (activeTab !== "home") {
      setActiveSection(activeTab);
      return;
    }

    const sections = [
      { id: "hero-landing-section", tab: "home" },
      { id: "about-iist-section", tab: "about-iist" },
      { id: "about-iistmun-section", tab: "about-iistmun" },
      { id: "map-section", tab: "map" },
      { id: "contact-section", tab: "contact" },
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].tab);
          return;
        }
      }
      setActiveSection("home");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  const handleNavClick = (tabId: string, sectionId?: string | null) => {
    setMobileMenuOpen(false);

    if (tabId === "admin") {
      setActiveTab("admin");
      setActiveSection("admin");
      return;
    }

    if (tabId === "secretariat") {
      setActiveTab("secretariat");
      setActiveSection("secretariat");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setActiveSection(tabId);

    if (activeTab !== "home") {
      setActiveTab("home");
      setTimeout(() => {
        if (sectionId) {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    } else {
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <ScrollProgressBar />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 w-full border-b border-[#C9A86A]/20 bg-[#233124]/90 backdrop-blur-md transition-all duration-300"
        id="main-header-nav"
      >
        <div className="w-full flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 gap-4">
          
          {/* Left Edge: Masthead / Brand Mark */}
          <div className="flex items-center justify-start shrink-0">
            <button
              onClick={() => handleNavClick("home", "hero-landing-section")}
              className="group flex items-center gap-3 sm:gap-3.5 text-left focus:outline-none cursor-pointer select-none py-1"
              id="navbar-brand-btn"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C9A86A]/70 bg-[#1A1F1A] overflow-hidden p-0.5 shadow-md transition-all duration-300 group-hover:border-[#C9A86A] group-hover:shadow-[0_0_12px_rgba(201,168,106,0.35)]">
                <img
                  src="/logo-emblem-transparent.png"
                  alt="IIST MUN 2027"
                  className="h-full w-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              <div className="flex flex-col justify-center shrink-0">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-[#EDE6D3] group-hover:text-[#C9A86A] transition-colors leading-none">
                    IIST MUN
                  </span>
                  <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#C9A86A] border border-[#C9A86A]/30 px-1.5 py-0.5 rounded-none bg-[#2E3B2F]/60">
                    2027 · 14th Ed.
                  </span>
                </div>
                <span className="text-[10px] font-sans tracking-[0.2em] text-[#8A9A7E] uppercase mt-1 whitespace-nowrap">
                  Save · Sustain · Safeguard
                </span>
              </div>
            </button>
          </div>

          {/* Middle: Desktop Centered Navigation Links */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-5 xl:gap-8 mx-4">
            {navItems.map((item) => {
              const isActive = (activeTab === "home" ? activeSection === item.id : activeTab === item.id);
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id, item.sectionId)}
                  className={`group relative py-2 text-xs font-sans uppercase tracking-[0.14em] whitespace-nowrap transition-colors cursor-pointer select-none ${
                    isActive ? "text-[#C9A86A] font-semibold" : "text-[#EDE6D3]/80 hover:text-[#EDE6D3]"
                  }`}
                >
                  <span className="text-[9px] font-mono text-[#8A9A7E] mr-1 opacity-60 group-hover:opacity-100">
                    {item.number}
                  </span>
                  <span>{item.label}</span>
                  
                  {/* Underline draw on active or hover */}
                  <span
                    className={`absolute bottom-0 left-0 h-[1.5px] bg-[#C9A86A] transition-all duration-300 ${
                      isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-70"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Right Edge: Account Information & Contact CTA */}
          <div className="hidden lg:flex items-center justify-end gap-3.5 shrink-0">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border border-[#C9A86A] border-t-transparent" />
            ) : user ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-[#8A9A7E]/20">
                <div className="flex items-center gap-2 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="h-7 w-7 rounded-full border border-[#C9A86A]/40 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2E3B2F] border border-[#C9A86A]/40 text-[10px] font-medium text-[#C9A86A] font-serif">
                      {user.displayName ? user.displayName.split(" ").map(n => n[0]).join("") : "D"}
                    </div>
                  )}
                  <span className="text-xs font-sans text-[#EDE6D3] max-w-[100px] truncate font-medium">
                    {user.displayName?.split(" ")[0] || "Delegate"}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-[#8A9A7E] hover:text-rose-300 transition-colors cursor-pointer"
                  title="Sign Out"
                  id="navbar-logout-btn"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-[0.15em] text-[#EDE6D3]/80 hover:text-[#C9A86A] transition-colors cursor-pointer"
                id="navbar-login-btn"
              >
                <LogIn className="h-3.5 w-3.5 text-[#C9A86A]" />
                Sign In
              </button>
            )}

            {/* Direct Dispatch CTA */}
            <button
              onClick={() => handleNavClick("contact", "contact-section")}
              id="navbar-contact-cta-btn"
              className="px-4 py-2 text-xs font-sans uppercase tracking-[0.18em] border border-[#C9A86A] text-[#EDE6D3] bg-[#2E3B2F]/60 hover:bg-[#C9A86A] hover:text-[#1A1F1A] transition-all duration-200 cursor-pointer"
            >
              Contact Us
            </button>
          </div>

          {/* Mobile & Tablet Controls */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              onClick={() => handleNavClick("contact", "contact-section")}
              id="mobile-contact-btn"
              className="px-3 py-1.5 text-[11px] font-sans uppercase tracking-wider border border-[#C9A86A] bg-[#2E3B2F] text-[#EDE6D3]"
            >
              Contact
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-[#8A9A7E]/30 bg-[#2E3B2F]/40 text-[#EDE6D3] hover:text-[#C9A86A] transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
              id="mobile-menu-toggle-btn"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick-Scroll Bar */}
        <div className="flex lg:hidden border-t border-[#8A9A7E]/15 bg-[#1A1F1A] px-3 py-2 overflow-x-auto scrollbar-none gap-2">
          {navItems.map((item) => {
            const isActive = (activeTab === "home" ? activeSection === item.id : activeTab === item.id);
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => handleNavClick(item.id, item.sectionId)}
                className={`px-3 py-1 text-[11px] font-sans uppercase tracking-wider whitespace-nowrap border shrink-0 transition-colors ${
                  isActive 
                    ? "border-[#C9A86A] bg-[#2E3B2F] text-[#C9A86A] font-semibold" 
                    : "border-transparent text-[#8A9A7E] hover:text-[#EDE6D3]"
                }`}
              >
                <span className="text-[9px] text-[#C9A86A] mr-1">{item.number}</span>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Full Expanded Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-[#C9A86A]/20 bg-[#1A1F1A] p-5 space-y-4"
              id="mobile-expanded-drawer"
            >
              {user ? (
                <div className="flex items-center justify-between p-3 border border-[#C9A86A]/25 bg-[#2E3B2F]/50">
                  <div className="flex items-center gap-2.5">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="h-8 w-8 rounded-full border border-[#C9A86A]/40" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#2E3B2F] border border-[#C9A86A]/40 flex items-center justify-center text-xs text-[#C9A86A] font-serif">
                        {user.displayName?.[0] || "D"}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-serif text-[#EDE6D3]">{user.displayName || "Delegate"}</div>
                      <div className="text-[10px] font-mono text-[#8A9A7E]">{user.email}</div>
                    </div>
                  </div>
                  <button onClick={logout} className="text-xs text-[#8A9A7E] hover:text-rose-400 p-1">
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="w-full py-2.5 border border-[#C9A86A]/40 text-[#EDE6D3] text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#2E3B2F]"
                >
                  <LogIn className="h-4 w-4 text-[#C9A86A]" />
                  Sign In with Google Account
                </button>
              )}

              <div className="space-y-1 pt-2">
                {navItems.map((item) => {
                  const isActive = (activeTab === "home" ? activeSection === item.id : activeTab === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id, item.sectionId)}
                      className={`w-full flex items-center justify-between p-2.5 text-left text-xs uppercase tracking-wider border transition-colors ${
                        isActive
                          ? "border-[#C9A86A]/40 bg-[#2E3B2F] text-[#C9A86A] font-semibold"
                          : "border-transparent text-[#EDE6D3]/80 hover:bg-[#2E3B2F]/40 hover:text-[#EDE6D3]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 text-[#C9A86A]" />
                        <span>{item.label}</span>
                      </span>
                      <span className="font-mono text-[9px] text-[#8A9A7E]">{item.number}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
