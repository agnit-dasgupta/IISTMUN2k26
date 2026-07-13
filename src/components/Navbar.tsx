/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Rocket, Shield, Calendar, Users, HelpCircle, TableProperties, ClipboardEdit, Star, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useFirebase } from "../FirebaseContext";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { user, loading, signInWithGoogle, logout } = useFirebase();

  const isAdmin = user?.email === "agnit.dg@gmail.com";

  const navItems = [
    { id: "home", label: "Orbit", icon: Rocket },
    { id: "committees", label: "Committees", icon: Shield },
    { id: "matrix", label: "Portfolio Matrix", icon: TableProperties },
    { id: "schedule", label: "Timeline", icon: Calendar },
    { id: "secretariat", label: "Secretariat", icon: Users },
    { id: "faq", label: "Intel (FAQ)", icon: HelpCircle },
    ...(isAdmin ? [{ id: "admin", label: "Admin Panel", icon: ShieldCheck }] : []),
    { id: "register", label: "Launch Portal", icon: ClipboardEdit, highlight: true }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <button
          onClick={() => setActiveTab("home")}
          className="group flex items-center gap-3 text-left focus:outline-none"
          id="navbar-brand-btn"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-lg text-white border border-blue-400/50 shadow-[0_0_15px_rgba(37,99,235,0.25)] transition-all duration-300 group-hover:scale-105">
            I
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-light tracking-widest uppercase text-slate-100">
              IIST <span className="font-bold text-blue-500">MUN</span> <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block sm:inline ml-0 sm:ml-1 font-bold">2026</span>
            </h1>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`transition-all duration-300 text-xs font-semibold tracking-widest uppercase flex items-center gap-1.5 ${
                  item.highlight
                    ? "px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95"
                    : isActive
                    ? "text-blue-400 bg-blue-950/40 border border-blue-900/60 rounded-full px-4 py-1.5 font-bold shadow-md"
                    : "text-slate-400 hover:text-blue-400"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive && !item.highlight ? "text-blue-400 animate-pulse" : "text-inherit"}`} />
                {item.label}
              </button>
            );
          })}

          {/* User Authentication Status */}
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent ml-2" />
          ) : user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-900">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-7 w-7 rounded-full border border-blue-500/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-950 border border-blue-500/30 text-[10px] font-bold text-blue-400 font-mono">
                    {user.displayName ? user.displayName.split(" ").map(n => n[0]).join("") : "U"}
                  </div>
                )}
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 max-w-[80px] truncate animate-fade-in" title={user.displayName || ""}>
                  {user.displayName?.split(" ")[0] || "Delegate"}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-full border border-slate-900 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all duration-300 cursor-pointer"
                title="Logout"
                id="navbar-logout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="ml-2 flex items-center gap-1.5 px-4 py-2 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-600/10 rounded-full text-xs font-bold uppercase tracking-wider text-blue-400 transition-all duration-300 cursor-pointer"
              id="navbar-login-btn"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center gap-2">
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2" />
          ) : user ? (
            <div className="flex items-center gap-2 mr-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="h-6 w-6 rounded-full border border-blue-500/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-950 text-[9px] font-bold text-blue-400">
                  U
                </div>
              )}
              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-red-400"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-3 py-1 mr-2 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => setActiveTab("register")}
            id="mobile-register-btn"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] font-bold tracking-wider uppercase transition-all"
          >
            Launch
          </button>
        </div>
      </div>

      {/* Mobile Tab bar - quick access */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-900 bg-slate-950/95 py-1.5 scrollbar-none px-2 justify-between w-full">
        {navItems.filter(item => !item.highlight).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-mobile-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md min-w-[50px] transition-all duration-200 ${
                isActive ? "text-blue-400 font-bold" : "text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[9px] font-mono uppercase tracking-wider">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
