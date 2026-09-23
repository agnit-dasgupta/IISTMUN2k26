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

export type CommitteeId = 
  | "uncopuos"
  | "unhrc"
  | "unodc"
  | "nes75"
  | "unga"
  | "undp"
  | "ip";

export type PortfolioStatus = "Available" | "Assigned" | "Reserved" | "Pending" | "N/A";

export interface CountryMatrixRow {
  country: string;
  uncopuos?: PortfolioStatus;
  unhrc?: PortfolioStatus;
  unodc?: PortfolioStatus;
  nes75?: PortfolioStatus;
  unga?: PortfolioStatus;
  undp?: PortfolioStatus;
  ip?: PortfolioStatus;
  // Legacy aliases for backward compatibility
  copuos?: PortfolioStatus;
  disec?: PortfolioStatus;
  aippm?: PortfolioStatus;
  unsc?: PortfolioStatus;
}


export interface RegistrationDetails {
  uid?: string;
  userId?: string;
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

export interface ContactQuery {
  id?: string;
  name: string;
  email: string;
  category: string;
  message: string;
  timestamp?: string;
  createdAt?: any;
  status?: "pending" | "resolved" | "archived";
  destination?: string;
  source?: string;
}

export interface EBRegistration {
  id: string; // e.g. EB-2027-1049
  userId?: string;
  timestamp: string;
  createdAt?: any;
  status: "Pending" | "Shortlisted" | "Interview Scheduled" | "Accepted" | "Rejected";
  // Personal Details
  name: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  yearOfStudy: string;
  cityState: string;
  // Uploads
  photoUrl?: string;
  photoName?: string;
  cvUrl?: string;
  cvName?: string;
  // Experience
  munDelegateCount: string;
  munEbCount: string;
  experienceSummary: string;
  // Preferences
  pref1Committee: string;
  pref1Role: string;
  pref2Committee: string;
  pref2Role: string;
  // Substantive
  proposedAgendas: string;
  motivation: string;
  sampleStudyGuideLink?: string;
  linkedinProfile?: string;
  adminNotes?: string;
}

export interface CampusAmbassadorRegistration {
  id: string; // e.g. CA-2027-2038
  userId?: string;
  timestamp: string;
  createdAt?: any;
  status: "Pending" | "Verified" | "Shortlisted" | "Accepted" | "Rejected";
  // Personal Details
  name: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  yearOfStudy: string;
  cityState: string;
  // Uploads
  photoUrl?: string;
  photoName?: string;
  idProofUrl?: string;
  idProofName?: string;
  // College & Social
  collegeClubs: string;
  socialHandles: string;
  priorCaExperience: string;
  // Promotion Plan
  motivation: string;
  promotionPlan: string;
  targetMobilization: string; // e.g. "5-10", "10-20", "20-35", "35+"
  adminNotes?: string;
}

export interface WorkshopRegistrationDetails {
  id: string;
  userId: string;
  regType: "individual" | "school";
  name: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  experience: "Beginner" | "Intermediate" | "Advanced";
  motivation: string;
  timestamp: string;
  // School/Institutional specific fields
  teacherName?: string;
  teacherDesignation?: string;
  teacherEmail?: string;
  teacherPhone?: string;
  estimatedStudents?: string;
  gradeLevels?: string;
  specialRequirements?: string;
}

