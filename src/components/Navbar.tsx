/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Rocket, 
  Shield, 
  Calendar, 
  Users, 
  HelpCircle, 
  TableProperties, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Orbit, 
  Sparkles,
  Menu,
  X,
  ChevronRight,
  UserCheck
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

  const isAdmin = user?.email === "agnit.dg@gmail.com";

  const navItems = [
    { id: "home", label: "Orbit", shortLabel: "Orbit", icon: Orbit, badge: null },
    { id: "committees", label: "Committees", shortLabel: "Committees", icon: Shield, badge: "6 Councils" },
    { id: "matrix", label: "Country Matrix", shortLabel: "Matrix", icon: TableProperties, badge: "Live" },
    { id: "schedule", label: "Timeline", shortLabel: "Timeline", icon: Calendar, badge: "3 Days" },
    { id: "secretariat", label: "Secretariat", shortLabel: "Team", icon: Users, badge: null },
    { id: "faq", label: "Intel & FAQ", shortLabel: "FAQ", icon: HelpCircle, badge: null },
    ...(isAdmin ? [{ id: "admin", label: "Admin Command", shortLabel: "Admin", icon: ShieldCheck, badge: "Master" }] : []),
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Scroll Progress Bar at very top */}
      <ScrollProgressBar />

      <header className="sticky top-0 z-50 w-full max-w-full overflow-hidden border-b border-white/[0.08] bg-[#04060a]/90 backdrop-blur-2xl transition-all duration-300">
        {/* Main Header Container */}
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4 w-full min-w-0">
          
          {/* Brand / Logo */}
          <button
            onClick={() => handleNavClick("home")}
            className="group flex items-center gap-2 sm:gap-3 text-left focus:outline-none cursor-pointer select-none shrink min-w-0 py-1"
            id="navbar-brand-btn"
          >
            <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 font-black text-sm sm:text-base text-white shadow-[0_0_15px_rgba(56,189,248,0.35)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(56,189,248,0.55)]">
              I
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-pulse border border-[#04060a]" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base lg:text-lg font-black tracking-wider uppercase text-white flex items-center gap-1 font-display leading-tight whitespace-nowrap">
                  IIST <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">MUN</span>
                </h1>
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-cyan-400 font-bold px-1.5 sm:px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 whitespace-nowrap">
                  2026
                </span>
              </div>
              <span className="hidden md:block text-[9.5px] font-mono tracking-wider text-slate-400 uppercase truncate">
                Premier Space MUN
              </span>
            </div>
          </button>

          {/* Desktop Navigation (XL & Above: 1280px+) */}
          <nav className="hidden xl:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-full p-1.5 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 rounded-full transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? "text-white font-black"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-cyan-500/10 border border-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Compact Navigation (Lg to Xl: 1024px - 1279px) */}
          <nav className="hidden lg:flex xl:hidden items-center gap-0.5 bg-white/[0.03] border border-white/[0.08] rounded-full p-1 backdrop-blur-xl shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-compact-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "text-cyan-300 font-black bg-cyan-500/20 border border-cyan-400/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-3 w-3 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  {item.shortLabel}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs & Auth Area (Desktop: 1024px+) */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3 shrink-0">
            {/* User Authentication Status */}
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            ) : user ? (
              <div className="flex items-center gap-2 pl-2.5 border-l border-white/[0.1]">
                <div className="flex items-center gap-2 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="h-7 w-7 rounded-full border border-cyan-500/50 shadow-[0_0_8px_rgba(56,189,248,0.2)] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[10px] font-bold text-cyan-400 font-mono">
                      {user.displayName ? user.displayName.split(" ").map(n => n[0]).join("") : "U"}
                    </div>
                  )}
                  <div className="hidden xl:flex flex-col text-left min-w-0">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-200 max-w-[80px] truncate" title={user.displayName || ""}>
                      {user.displayName?.split(" ")[0] || "Delegate"}
                    </span>
                    <span className="text-[8.5px] font-mono text-cyan-400/80 leading-none">Active</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-full border border-white/[0.08] hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                  title="Logout"
                  id="navbar-logout-btn"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 border border-white/[0.12] hover:border-cyan-500/40 hover:bg-cyan-500/10 rounded-full text-[11px] xl:text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.2)] whitespace-nowrap"
                id="navbar-login-btn"
              >
                <LogIn className="h-3.5 w-3.5 text-cyan-400" />
                Sign In
              </button>
            )}

            {/* Launch Portal CTA */}
            <button
              onClick={() => handleNavClick("register")}
              id="navbar-register-cta-btn"
              className="relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-white via-slate-100 to-slate-200 px-4 xl:px-5 py-2 text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:from-cyan-300 hover:to-indigo-300 hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 transition-all duration-300 cursor-pointer whitespace-nowrap"
            >
              <Rocket className="h-3.5 w-3.5 text-slate-950" />
              Launch Portal
            </button>
          </div>

          {/* Mobile & Tablet Controls (Right Side: < 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            {/* User Avatar / Quick Login on Mobile */}
            {loading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            ) : user ? (
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-cyan-500/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-cyan-950 text-[9px] font-bold text-cyan-400 font-mono">
                    {user.displayName ? user.displayName.split(" ")[0][0] : "U"}
                  </div>
                )}
                <button
                  onClick={logout}
                  className="p-1 text-slate-400 hover:text-red-400 rounded-full transition-colors"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 border border-white/[0.12] hover:border-cyan-400/40 bg-white/[0.04] text-slate-200 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all whitespace-nowrap"
                id="mobile-signin-btn"
              >
                <LogIn className="h-3 w-3 text-cyan-400" />
                <span>Sign In</span>
              </button>
            )}

            {/* Launch Action Button */}
            <button
              onClick={() => handleNavClick("register")}
              id="mobile-register-btn"
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-black rounded-full text-[10.5px] sm:text-xs tracking-wider uppercase shadow-[0_0_12px_rgba(56,189,248,0.3)] active:scale-95 transition-all whitespace-nowrap"
            >
              <Rocket className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Launch</span>
            </button>

            {/* Hamburger / Expand Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/[0.1] text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all cursor-pointer focus:outline-none"
              aria-label="Toggle Navigation Menu"
              id="mobile-menu-toggle-btn"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
              ) : (
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick-Scroll Navigation Bar with Edge Fades */}
        <div className="relative flex lg:hidden border-t border-white/[0.06] bg-[#04060a]/98 w-full max-w-full min-w-0 overflow-hidden">
          {/* Left subtle fade gradient indicator */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-r from-[#04060a] to-transparent z-10" />
          
          {/* Scrollable track with generous horizontal padding & gap */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none px-3 sm:px-4 py-2 sm:py-2.5 w-full scroll-smooth min-w-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-mobile-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-bold"
                      : "text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/[0.06] active:bg-white/[0.08]"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span className="text-[11px] font-mono uppercase tracking-wider whitespace-nowrap font-medium">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold tracking-tight whitespace-nowrap ${
                      isActive 
                        ? "bg-cyan-400 text-slate-950" 
                        : "bg-white/[0.08] text-slate-400"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right subtle fade gradient indicator */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-l from-[#04060a] to-transparent z-10" />
        </div>

        {/* Mobile Full Expanded Drawer Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden border-t border-white/[0.08] bg-[#070b14]/98 backdrop-blur-3xl shadow-2xl w-full max-w-full"
              id="mobile-expanded-drawer"
            >
              <div className="p-4 sm:p-6 space-y-3.5 max-h-[calc(100vh-130px)] overflow-y-auto">
                {/* User Status Bar if logged in */}
                {user ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Avatar"
                          className="h-9 w-9 rounded-full border border-cyan-400/60 shadow-[0_0_10px_rgba(56,189,248,0.3)] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-900 border border-cyan-400/60 text-xs font-bold text-cyan-300 font-mono">
                          {user.displayName ? user.displayName.split(" ").map(n => n[0]).join("") : "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1 truncate">
                          <UserCheck className="h-3 w-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{user.displayName || "Delegate"}</span>
                        </div>
                        <p className="text-[9.5px] font-mono text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="px-2.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono font-bold flex items-center gap-1 hover:bg-red-500/20 transition-all shrink-0"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    <LogIn className="h-4 w-4 text-cyan-400" />
                    <span>Sign In with Google Account</span>
                  </button>
                )}

                {/* Primary Nav List */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 px-2 py-0.5 font-semibold">
                    Navigation Command
                  </div>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`mobile-drawer-${item.id}`}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 border border-cyan-400/40 text-cyan-300 font-bold shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                            : "bg-white/[0.02] border border-white/[0.05] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? "bg-cyan-500/30 text-cyan-300" : "bg-white/[0.04] text-slate-400"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold tracking-wide truncate">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                              isActive ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40" : "bg-white/[0.06] text-slate-400"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-600"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Direct Registration Shortcuts inside drawer */}
                <div className="pt-2 border-t border-white/[0.08] space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 px-2 font-semibold">
                    Direct Portals
                  </div>
                  
                  <button
                    onClick={() => handleNavClick("register")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(56,189,248,0.3)] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Rocket className="h-3.5 w-3.5 text-cyan-200" />
                      <span>Delegate Registration Portal</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-white/70" />
                  </button>

                  <button
                    onClick={() => handleNavClick("workshop-register")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-cyan-300 font-semibold text-xs uppercase tracking-wider cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Free Pre-MUN Training Workshop</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}


