/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EBReference {
  name: string;
  role: string; // e.g. "Chairperson", "Co-Chairperson", "Director"
  avatar: string; // letter avatar or initials
}

export interface Committee {
  id: string;
  name: string;
  abbreviation: string;
  agenda: string;
  description: string;
  logo: string; // lucide icon name or emoji
  color: string; // e.g. "cyan" | "purple" | "emerald" | "amber"
  eb: EBReference[];
  guideUrl?: string;
}

export interface SecretariatMember {
  id: string;
  name: string;
  designation: string;
  bio: string;
  email?: string;
  linkedin?: string;
}

export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  location: string;
  category: "ceremony" | "session" | "social" | "other";
}

export interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "registration" | "committees";
}

export type PortfolioStatus = "Available" | "Assigned" | "Reserved" | "Pending" | "N/A";

export interface CountryMatrixRow {
  country: string;
  copuos: PortfolioStatus;
  disec: PortfolioStatus;
  aippm: PortfolioStatus;
  unsc: PortfolioStatus;
}

export interface RegistrationDetails {
  uid?: string;
  id: string;
  timestamp: string;
  regType: "individual" | "double" | "contingent";
  name: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  munExperience: string; // "None" | "1-2" | "3-5" | "5+"
  role: "Delegate" | "Photographer";
  pref1Committee: string;
  pref1Country: string;
  pref2Committee: string;
  pref2Country: string;
  pref3Committee: string;
  pref3Country: string;
  partnerName?: string;
  partnerEmail?: string;
  partnerRole?: "Delegate" | "Photographer";
  partnerId?: string;
  contingentSize?: string;
  motivation: string;
}
