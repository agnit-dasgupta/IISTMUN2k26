/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { COMMITTEES, COUNTRY_MATRIX } from "../data";
import { FirstRoundRegistrationDetails, CountryMatrixRow, PortfolioStatus, CommitteeId } from "../types";
import {
  GraduationCap, User, Phone, Mail, MapPin,
  Calendar, ShieldCheck, CheckCircle2, AlertCircle,
  Copy, Check, ArrowLeft, ChevronRight, ChevronLeft,
  Sparkles, Download, School, FileText, Globe, Landmark,
  X, CheckSquare, HeartHandshake, Compass, Filter, Search,
  Tag, ShieldAlert, Award, ExternalLink,
  Layers, CheckCheck, Clock, Ban, CreditCard, QrCode,
  ArrowUp, ArrowDown, Trash2
} from "lucide-react";
import { useFirebase } from "../FirebaseContext";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot, setDoc, deleteDoc, collection } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import FileUploadZone from "./FileUploadZone";
import QRCodeDisplay from "./QRCodeDisplay";
import { downloadBoardingPassPDF } from "../utils/pdfGenerator";
import { InstitutionSelect } from "./InstitutionSelect";
import { getEffectivePortfolioStatus } from "../utils/portfolioMatrix";

export const COLLEGE_DEGREES = [
  "B.Tech / B.E. (Engineering)",
  "B.Sc (Sciences / Mathematics)",
  "B.A. (Arts / Humanities / Social Sciences)",
  "B.Com / BBA / BMS (Commerce & Management)",
  "LL.B / B.A. LL.B / Law Degree",
  "MBBS / BDS / Allied Health Sciences",
  "M.Tech / M.E. (Postgraduate Engineering)",
  "M.Sc (Postgraduate Sciences)",
  "M.A. / MBA / PGDM",
  "Ph.D. / Doctoral Research Scholar",
  "Other Degree / Young Professional"
];

export const COLLEGE_YEARS = [
  "1st Year (Freshman)",
  "2nd Year (Sophomore)",
  "3rd Year (Junior)",
  "4th Year (Senior)",
  "5th Year (Dual Degree / Integrated)",
  "Postgraduate (Masters / PG)",
  "Ph.D. / Research Scholar",
  "Alumni / Working Professional"
];

export const MATRIX_COMMITTEES: { id: CommitteeId; label: string; name: string }[] = [
  { id: "uncopuos", label: "UNCOPOUS", name: "UN Committee on the Peaceful Uses of Outer Space" },
  { id: "unhrc", label: "UNHRC", name: "UN Human Rights Council" },
  { id: "unodc", label: "UNODC", name: "UN Office on Drugs and Crime" },
  { id: "nes75", label: "NES'75", name: "National Emergency Summit 1975" },
  { id: "undp", label: "UNDP", name: "UN Development Programme" },
  { id: "ip", label: "IP", name: "International Press" }
];

export const getCommitteePortfolioMin = (commId?: string): number => {
  return commId === "ip" ? 1 : 5;
};

export const getCommitteePortfolioMax = (commId?: string): number => {
  return commId === "ip" ? 2 : 5;
};

export const getCommitteePortfolioTarget = (commId?: string): number => {
  return commId === "ip" ? 1 : 5;
};

export interface RankedPortfolioPreference {
  rank: number; // Overall rank 1 to 15 (Committee 1 choices have highest preference)
  committeeRank: number; // 1, 2, or 3
  committee: CommitteeId;
  portfolioRank: number; // 1 to 5 within committee
  country: string;
}

interface FirstRoundRegistrationProps {
  initialPreference?: { country?: string; committee?: string } | null;
  clearInitialPreference?: () => void;
  setActiveTab?: (tab: string) => void;
  embedded?: boolean;
}

export default function FirstRoundRegistration({
  initialPreference,
  clearInitialPreference,
  setActiveTab,
  embedded = false
}: FirstRoundRegistrationProps) {
  const { user, loading: authLoading, signInWithGoogle, isSigningIn } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [copiedTicketId, setCopiedTicketId] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submittedPass, setSubmittedPass] = useState<FirstRoundRegistrationDetails | null>(null);
  const [viewingPass, setViewingPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const boardingPassRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Personal Details
    name: "",
    email: "",
    phone: "",
    gender: "Prefer not to say",
    dob: "",
    cityState: "",
    fullAddress: "",

    // Emergency Contact
    emergencyContactName: "",
    emergencyContactRelation: "Parent",
    emergencyContactPhone: "",

    // Identity Clearance (Mandatory)
    aadharNumber: "",
    aadharPhotoUrl: "",
    aadharPhotoName: "",
    idCardUrl: "",
    idCardName: "",

    // College / Higher Institution Details
    institution: "",
    course: "",
    yearOfStudy: "2nd Year (Sophomore)",
    rollNumber: "",

    // Campus Ambassador Referral Code (Optional)
    campusAmbassadorCode: "",

    // Model UN Experience
    munExperience: "None",
    pastMunDetails: "",

    // Preferences (Synchronized with selectedPrefs)
    pref1Committee: "",
    pref1Country: "",
    pref2Committee: "",
    pref2Country: "",
    pref3Committee: "",
    pref3Country: "",
    motivation: "",

    // Logistics
    accommodationRequired: "no" as "yes" | "no",

    // Delegate Socials (Complimentary / No additional charge in First Round)
    attendingSocials: true,

    // Payment Information (Stage IV)
    paymentMode: "UPI / QR Scan",
    utrNumber: "",
    payerName: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentScreenshotUrl: "",
    paymentScreenshotName: "",
    agreedToTerms: false
  });

  // Committee Preferences (3 distinct committees in order of preference)
  const [selectedCommittees, setSelectedCommittees] = useState<CommitteeId[]>([]);
  // Portfolios selected per committee in order of preference (exactly 5 per committee = 15 total)
  const [committeePortfolios, setCommitteePortfolios] = useState<Record<string, string[]>>({});

  // Fee for First Round is strictly Rs 1,299 (Socials has no extra charge)
  const calculatedFee = 1299;

  // Live synchronization with Country Matrix & Portfolio States
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, Partial<Record<CommitteeId | "copuos" | "disec" | "aippm" | "unsc", PortfolioStatus>>>>({});
  const [matrixRows, setMatrixRows] = useState<CountryMatrixRow[]>(COUNTRY_MATRIX);

  // Council View Active Tab & Filter States
  const [activeCouncilTab, setActiveCouncilTab] = useState<CommitteeId>("uncopuos");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<"all" | "Available">("all");

  // Total portfolios count across all selected committees
  const totalPortfoliosCount = useMemo(() => {
    return selectedCommittees.reduce((sum, commId) => sum + (committeePortfolios[commId]?.length || 0), 0);
  }, [selectedCommittees, committeePortfolios]);

  // Minimum portfolios required based on chosen committees (5 per regular committee, 1 for IP)
  const minPortfoliosCount = useMemo(() => {
    if (selectedCommittees.length === 0) return 15;
    return selectedCommittees.reduce((sum, commId) => sum + getCommitteePortfolioMin(commId), 0);
  }, [selectedCommittees]);

  // Target portfolios count based on chosen committees (5 per regular committee, actual chosen or 1 for IP)
  const targetPortfoliosCount = useMemo(() => {
    if (selectedCommittees.length === 0) return 15;
    return selectedCommittees.reduce((sum, commId) => sum + (committeePortfolios[commId]?.length || getCommitteePortfolioMin(commId)), 0);
  }, [selectedCommittees, committeePortfolios]);

  // Overall ranked preferences: 15 portfolios across 3 committees
  // Committee 1 (Choice 1 to 5 = Rank 1 to 5 - Highest Priority)
  // Committee 2 (Choice 1 to 5 = Rank 6 to 10)
  // Committee 3 (Choice 1 to 5 = Rank 11 to 15)
  const allRankedPreferences = useMemo(() => {
    const list: RankedPortfolioPreference[] = [];
    selectedCommittees.forEach((commId, cIdx) => {
      const ports = committeePortfolios[commId] || [];
      ports.forEach((country, pIdx) => {
        list.push({
          rank: list.length + 1,
          committeeRank: cIdx + 1,
          committee: commId,
          portfolioRank: pIdx + 1,
          country
        });
      });
    });
    return list;
  }, [selectedCommittees, committeePortfolios]);

  // Helper to load existing/cached preferences
  const loadRegistrationPreferences = (data: FirstRoundRegistrationDetails) => {
    if (data.committeePreferences && data.committeePreferences.length > 0) {
      const comms = data.committeePreferences.map(cp => cp.committee as CommitteeId);
      setSelectedCommittees(comms);
      const portMap: Record<string, string[]> = {};
      data.committeePreferences.forEach(cp => {
        portMap[cp.committee] = cp.portfolios || [];
      });
      setCommitteePortfolios(portMap);
    } else if (data.pref1Portfolios || data.pref2Portfolios || data.pref3Portfolios) {
      const comms = [data.pref1Committee, data.pref2Committee, data.pref3Committee].filter(Boolean) as CommitteeId[];
      setSelectedCommittees(comms);
      setCommitteePortfolios({
        [data.pref1Committee]: data.pref1Portfolios || (data.pref1Country ? [data.pref1Country] : []),
        [data.pref2Committee]: data.pref2Portfolios || (data.pref2Country ? [data.pref2Country] : []),
        [data.pref3Committee]: data.pref3Portfolios || (data.pref3Country ? [data.pref3Country] : [])
      });
    } else if (data.preferences && data.preferences.length > 0) {
      const comms: CommitteeId[] = [];
      const portMap: Record<string, string[]> = {};
      data.preferences.forEach(p => {
        const cId = p.committee as CommitteeId;
        if (!comms.includes(cId)) comms.push(cId);
        if (!portMap[cId]) portMap[cId] = [];
        if (!portMap[cId].includes(p.country)) portMap[cId].push(p.country);
      });
      setSelectedCommittees(comms);
      setCommitteePortfolios(portMap);
    } else if (data.pref1Committee || data.pref2Committee || data.pref3Committee) {
      const comms = [data.pref1Committee, data.pref2Committee, data.pref3Committee].filter(Boolean) as CommitteeId[];
      setSelectedCommittees(comms);
      const portMap: Record<string, string[]> = {};
      if (data.pref1Committee && data.pref1Country) portMap[data.pref1Committee] = [data.pref1Country];
      if (data.pref2Committee && data.pref2Country) portMap[data.pref2Committee] = [data.pref2Country];
      if (data.pref3Committee && data.pref3Country) portMap[data.pref3Committee] = [data.pref3Country];
      setCommitteePortfolios(portMap);
    }
  };

  // Subscribe to live portfolio states and country matrix
  useEffect(() => {
    const unsubOverrides = onSnapshot(collection(db, "portfolio_states"), (snapshot) => {
      const overrides: typeof portfolioOverrides = {};
      snapshot.forEach(docSnap => {
        overrides[docSnap.id] = docSnap.data() as any;
      });
      setPortfolioOverrides(overrides);
    }, () => {
      // Fallback to local server API
      fetch("/api/portfolio-states")
        .then(res => res.json())
        .then(json => {
          if (json && json.status === "success" && json.data) {
            setPortfolioOverrides(json.data);
          }
        })
        .catch(() => { });
    });

    const unsubMatrix = onSnapshot(collection(db, "country_matrix"), (snapshot) => {
      if (!snapshot.empty) {
        if (snapshot.size >= 100) {
          const rows: CountryMatrixRow[] = [];
          snapshot.forEach(docSnap => rows.push(docSnap.data() as CountryMatrixRow));
          setMatrixRows(rows);
        } else {
          const firestoreMap = new Map<string, CountryMatrixRow>();
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as CountryMatrixRow;
            firestoreMap.set(data.country, data);
          });
          const merged = COUNTRY_MATRIX.map(row => {
            const live = firestoreMap.get(row.country);
            return live ? { ...row, ...live } : row;
          });
          setMatrixRows(merged);
        }
      }
    }, () => { });

    return () => {
      unsubOverrides();
      unsubMatrix();
    };
  }, []);

  // Sync selectedCommittees & committeePortfolios with formData.pref1/2/3
  useEffect(() => {
    const c1 = selectedCommittees[0] || "";
    const c2 = selectedCommittees[1] || "";
    const c3 = selectedCommittees[2] || "";

    const c1Ports = committeePortfolios[c1] || [];
    const c2Ports = committeePortfolios[c2] || [];
    const c3Ports = committeePortfolios[c3] || [];

    setFormData(prev => ({
      ...prev,
      pref1Committee: c1,
      pref1Country: c1Ports[0] || "",
      pref2Committee: c2,
      pref2Country: c2Ports[0] || "",
      pref3Committee: c3,
      pref3Country: c3Ports[0] || ""
    }));
  }, [selectedCommittees, committeePortfolios]);

  // Handle Initial Preference from external link / country matrix page
  useEffect(() => {
    if (initialPreference && initialPreference.country && initialPreference.committee) {
      const commId = initialPreference.committee as CommitteeId;
      setActiveCouncilTab(commId);
      setSelectedCommittees(prev => {
        if (!prev.includes(commId) && prev.length < 3) {
          return [...prev, commId];
        }
        return prev;
      });
      setCommitteePortfolios(prev => {
        const existing = prev[commId] || [];
        if (!existing.includes(initialPreference.country!) && existing.length < 5) {
          return {
            ...prev,
            [commId]: [...existing, initialPreference.country!]
          };
        }
        return prev;
      });
      if (clearInitialPreference) {
        clearInitialPreference();
      }
    }
  }, [initialPreference, clearInitialPreference]);

  // Autofill user credentials when logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || "",
        payerName: prev.payerName || user.displayName || ""
      }));
    }
  }, [user]);

  // Check cached pass in localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem("iistmun_last_first_round_pass");
      if (cached && !submittedPass) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.id || parsed.name)) {
          setSubmittedPass(parsed);
          loadRegistrationPreferences(parsed);
        }
      }
    } catch { }
  }, []);

  // Check existing registration in Firestore
  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | null = null;

    try {
      const docRef = doc(db, "first_round_registrations", user.uid);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as FirstRoundRegistrationDetails;
          setSubmittedPass(data);
          loadRegistrationPreferences(data);
        } else {
          // Check local backup table
          fetch("/api/first-round-registrations")
            .then(res => res.json())
            .then(json => {
              if (json && json.status === "success" && Array.isArray(json.data)) {
                const found = json.data.find((r: any) =>
                  (user.uid && (r.userId === user.uid || r.uid === user.uid || r.id === user.uid)) ||
                  (user.email && r.email && r.email.toLowerCase() === user.email.toLowerCase())
                );
                if (found) {
                  setSubmittedPass(found);
                  loadRegistrationPreferences(found);
                }
              }
            })
            .catch(() => { });
        }
      }, () => { });
    } catch { }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Get effective portfolio status
  const getPortfolioStatus = (row: CountryMatrixRow, committee: CommitteeId): PortfolioStatus => {
    return portfolioOverrides[row.country]?.[committee] ?? row[committee] ?? "N/A";
  };

  // Get portfolio selection details in committee and overall
  const getSelectedInfo = (country: string, committee: CommitteeId) => {
    const commIndex = selectedCommittees.indexOf(committee);
    if (commIndex === -1) return null;
    const ports = committeePortfolios[committee] || [];
    const portIndex = ports.indexOf(country);
    if (portIndex === -1) return null;

    const overall = allRankedPreferences.find(p => p.country === country && p.committee === committee);
    return {
      committeeRank: commIndex + 1,
      portfolioRankInComm: portIndex + 1,
      overallRank: overall ? overall.rank : commIndex * 5 + portIndex + 1
    };
  };

  // Toggle selection on a portfolio: Order of clicking is portfolio preference order!
  const handleTogglePortfolio = (country: string, committee: CommitteeId) => {
    const currentPorts = committeePortfolios[committee] || [];
    const isAlreadySelected = currentPorts.includes(country);

    if (isAlreadySelected) {
      // Deselect: remove from this committee
      const updated = currentPorts.filter(c => c !== country);
      setCommitteePortfolios(prev => ({
        ...prev,
        [committee]: updated
      }));
    } else {
      // Ensure committee is in selectedCommittees
      let currentCommittees = [...selectedCommittees];
      if (!currentCommittees.includes(committee)) {
        if (currentCommittees.length >= 3) {
          const commName = MATRIX_COMMITTEES.find(c => c.id === committee)?.label || committee.toUpperCase();
          alert(`You have already chosen 3 committees. Please remove one of your chosen committees from the preference dock above to select portfolios in ${commName}.`);
          return;
        }
        currentCommittees.push(committee);
        setSelectedCommittees(currentCommittees);
      }

      // Check limit of portfolios per committee (up to 2 for IP, exactly 5 for other committees)
      const maxLimit = getCommitteePortfolioMax(committee);
      if (currentPorts.length >= maxLimit) {
        const commName = MATRIX_COMMITTEES.find(c => c.id === committee)?.label || committee.toUpperCase();
        alert(`You have already selected ${maxLimit} portfolios for ${commName}. Deselect one of your existing choices in this committee to pick a different portfolio.`);
        return;
      }

      // Add portfolio to this committee
      setCommitteePortfolios(prev => ({
        ...prev,
        [committee]: [...(prev[committee] || []), country]
      }));

      // Clear preference error if resolved
      if (errors.preferences) {
        setErrors(prev => {
          const next = { ...prev };
          delete next.preferences;
          return next;
        });
      }
    }
  };

  // Move committee up or down in preference order
  const handleMoveCommittee = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= selectedCommittees.length) return;
    const next = [...selectedCommittees];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setSelectedCommittees(next);
  };

  // Remove a committee and its selected portfolios
  const handleRemoveCommittee = (committee: CommitteeId) => {
    setSelectedCommittees(prev => prev.filter(c => c !== committee));
    setCommitteePortfolios(prev => {
      const next = { ...prev };
      delete next[committee];
      return next;
    });
  };

  // Remove a specific portfolio from a committee
  const handleRemovePortfolio = (committee: CommitteeId, country: string) => {
    setCommitteePortfolios(prev => ({
      ...prev,
      [committee]: (prev[committee] || []).filter(c => c !== country)
    }));
  };

  // Count available seats in any committee
  const countAvailableInCouncil = (committee: CommitteeId): number => {
    let count = 0;
    matrixRows.forEach(row => {
      const st = getPortfolioStatus(row, committee);
      if (st === "Available") count++;
    });
    return count;
  };

  // ================= COUNCIL VIEW: SHOW SELECTED AND AVAILABLE SEATS FIRST =================
  const councilPortfoliosSorted = useMemo(() => {
    const getStatusPriority = (item: { isSelected: boolean; status: PortfolioStatus }) => {
      if (item.isSelected) return 0;
      if (item.status === "Available") return 1;
      if (item.status === "Reserved") return 2;
      if (item.status === "Assigned") return 3;
      return 4;
    };

    // 1. Filter by search text for nation portfolios
    const list = matrixRows.filter(row => {
      if (!matrixSearch.trim()) return true;
      const q = matrixSearch.toLowerCase().trim();
      const c = row.country.toLowerCase();
      if (c.includes(q)) return true;
      if (q === "usa" && c.includes("united states")) return true;
      if (q === "uk" && c.includes("united kingdom")) return true;
      if (q === "uae" && c.includes("united arab emirates")) return true;
      if (q === "russia" && c.includes("russian")) return true;
      return false;
    });

    const currentPorts = committeePortfolios[activeCouncilTab] || [];

    // 2. Map row to status & preference info
    const items = list.map(row => {
      const status = getPortfolioStatus(row, activeCouncilTab);
      const portRankInComm = currentPorts.indexOf(row.country) >= 0 ? currentPorts.indexOf(row.country) + 1 : null;
      const isSelected = portRankInComm !== null;
      const selectedInfo = isSelected ? getSelectedInfo(row.country, activeCouncilTab) : null;
      return {
        country: row.country,
        row,
        status,
        isSelected,
        portRankInComm,
        selectedInfo
      };
    });

    // 3. Status filter
    const statusFiltered = matrixStatusFilter === "Available"
      ? items.filter(it => it.status === "Available" || it.isSelected)
      : items;

    // 4. SORT: Selected portfolios first, then Available seats!
    return statusFiltered.sort((a, b) => {
      const pDiff = getStatusPriority(a) - getStatusPriority(b);
      if (pDiff !== 0) return pDiff;
      if (a.isSelected && b.isSelected) {
        return (a.portRankInComm || 0) - (b.portRankInComm || 0);
      }
      return a.country.localeCompare(b.country);
    });
  }, [matrixRows, activeCouncilTab, matrixSearch, matrixStatusFilter, portfolioOverrides, selectedCommittees, committeePortfolios, allRankedPreferences]);

  // Validation across 4 stages
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = "Full name is required.";
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = "Valid email address is required.";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required.";
      } else {
        const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
        if (cleanPhone.length < 10) {
          newErrors.phone = "Please enter a valid 10-digit phone number.";
        }
      }
      if (!formData.dob) newErrors.dob = "Date of birth is required.";
      if (!formData.cityState.trim()) newErrors.cityState = "City and State are required.";
      if (!formData.emergencyContactName.trim()) {
        newErrors.emergencyContactName = "Emergency contact name is required.";
      }
      if (!formData.emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = "Emergency contact phone is required.";
      } else {
        const cleanEmer = formData.emergencyContactPhone.replace(/[^0-9]/g, "");
        if (cleanEmer.length < 10) {
          newErrors.emergencyContactPhone = "Please enter a valid 10-digit emergency contact number.";
        }
      }
    }

    if (currentStep === 2) {
      if (!formData.institution.trim()) newErrors.institution = "College / University name is required.";
      if (!formData.course.trim()) newErrors.course = "Field of study / degree is required.";
      if (!formData.yearOfStudy) newErrors.yearOfStudy = "Year of study is required.";

      const rawAadhar = formData.aadharNumber.replace(/\s+/g, "").toUpperCase();
      if (!rawAadhar) {
        newErrors.aadharNumber = "Aadhaar or Passport Number is mandatory for campus security clearance.";
      } else if (/^\d+$/.test(rawAadhar)) {
        if (rawAadhar.length !== 12) {
          newErrors.aadharNumber = "Aadhaar number must be exactly 12 digits.";
        }
      } else if (rawAadhar.length < 6 || rawAadhar.length > 15) {
        newErrors.aadharNumber = "Passport number must be 6 to 15 alphanumeric characters.";
      }

      if (!formData.aadharPhotoUrl) {
        newErrors.aadharPhotoUrl = "Uploading Aadhaar Card or Passport copy is mandatory.";
      }
      if (!formData.idCardUrl) {
        newErrors.idCardUrl = "Uploading College ID card / Bonafide certificate is mandatory.";
      }
    }

    if (currentStep === 3) {
      if (selectedCommittees.length < 3) {
        newErrors.preferences = `Please select all 3 committees in your order of preference (${selectedCommittees.length}/3 currently selected).`;
      } else {
        const c1 = selectedCommittees[0];
        const c2 = selectedCommittees[1];
        const c3 = selectedCommittees[2];
        const t1 = getCommitteePortfolioMin(c1);
        const t2 = getCommitteePortfolioMin(c2);
        const t3 = getCommitteePortfolioMin(c3);
        const c1Count = committeePortfolios[c1]?.length || 0;
        const c2Count = committeePortfolios[c2]?.length || 0;
        const c3Count = committeePortfolios[c3]?.length || 0;

        if (c1Count < t1 || c2Count < t2 || c3Count < t3) {
          const missing: string[] = [];
          if (c1Count < t1) missing.push(`${c1.toUpperCase()} (${c1Count}/${t1} min)`);
          if (c2Count < t2) missing.push(`${c2.toUpperCase()} (${c2Count}/${t2} min)`);
          if (c3Count < t3) missing.push(`${c3.toUpperCase()} (${c3Count}/${t3} min)`);
          newErrors.preferences = `Please choose all required portfolios for your chosen committees (minimum ${minPortfoliosCount} portfolios). Still needed in: ${missing.join(", ")}.`;
        }
      }
      if (!formData.motivation.trim()) {
        newErrors.motivation = "Statement of Purpose / Past MUN awards & achievements is mandatory.";
      }
    }

    if (currentStep === 4) {
      if (!formData.paymentMode.trim()) {
        newErrors.paymentMode = "Payment mode is mandatory.";
      }

      if (!formData.utrNumber.trim()) {
        newErrors.utrNumber = "12-digit UTR / UPI Reference Number is mandatory.";
      } else {
        const cleanUtr = formData.utrNumber.trim().replace(/\s+/g, "");
        if (cleanUtr.length < 6) {
          newErrors.utrNumber = "Please enter a valid 12-digit UTR / UPI Reference Number.";
        }
      }

      if (!formData.payerName.trim()) {
        newErrors.payerName = "Payer account name (bank / UPI holder) is mandatory.";
      }

      if (!formData.paymentDate.trim()) {
        newErrors.paymentDate = "Date of payment is mandatory.";
      }

      if (!formData.paymentScreenshotUrl.trim()) {
        newErrors.paymentScreenshotUrl = "Uploading payment confirmation screenshot or receipt is mandatory.";
      }

      if (!formData.agreedToTerms) {
        newErrors.agreedToTerms = "You must accept the terms and conditions written in First_Round_Registration.pdf to proceed.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("87786201@ubin");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      alert("Please ensure all mandatory details, 3 Council preferences, and payment information are provided.");
      return;
    }

    setLoading(true);

    const ticketId = `FR-2027-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });
    const isoDate = now.toISOString();

    const payload: FirstRoundRegistrationDetails = {
      id: ticketId,
      uid: user?.uid || ticketId,
      userId: user?.uid || `guest-first-round-${Date.now()}`,
      timestamp,
      createdAt: isoDate,
      updatedAt: isoDate,
      round: "first_round",
      status: "Pending Verification",

      // Personal Details
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      gender: formData.gender || "Prefer not to say",
      dob: formData.dob || "",
      cityState: formData.cityState.trim(),
      fullAddress: formData.fullAddress.trim(),

      // Emergency Contact
      emergencyContactName: formData.emergencyContactName.trim(),
      emergencyContactRelation: formData.emergencyContactRelation || "Parent",
      emergencyContactPhone: formData.emergencyContactPhone.trim(),

      // Security Clearance & ID
      aadharNumber: formData.aadharNumber.trim(),
      aadharPhotoUrl: formData.aadharPhotoUrl || "",
      aadharPhotoName: formData.aadharPhotoName || "Aadhaar_Passport.jpg",
      idCardUrl: formData.idCardUrl || "",
      idCardName: formData.idCardName || "College_ID_Card.jpg",

      // Academic (College & Higher)
      institution: formData.institution.trim(),
      course: formData.course.trim(),
      yearOfStudy: formData.yearOfStudy,
      rollNumber: formData.rollNumber.trim(),

      // Optional Campus Ambassador Code
      campusAmbassadorCode: formData.campusAmbassadorCode.trim().toUpperCase(),

      // Model UN Experience
      munExperience: formData.munExperience || "None",
      pastMunDetails: formData.pastMunDetails.trim(),

      // 3 Ranked Committees & 15 Portfolios (Order of Selection & Preference)
      pref1Committee: selectedCommittees[0] || "",
      pref1Country: committeePortfolios[selectedCommittees[0]]?.[0] || "",
      pref1Portfolios: committeePortfolios[selectedCommittees[0]] || [],

      pref2Committee: selectedCommittees[1] || "",
      pref2Country: committeePortfolios[selectedCommittees[1]]?.[0] || "",
      pref2Portfolios: committeePortfolios[selectedCommittees[1]] || [],

      pref3Committee: selectedCommittees[2] || "",
      pref3Country: committeePortfolios[selectedCommittees[2]]?.[0] || "",
      pref3Portfolios: committeePortfolios[selectedCommittees[2]] || [],

      committeePreferences: selectedCommittees.map((commId, idx) => ({
        rank: idx + 1,
        committee: commId,
        committeeName: MATRIX_COMMITTEES.find(c => c.id === commId)?.name || commId.toUpperCase(),
        portfolios: committeePortfolios[commId] || []
      })),

      preferences: allRankedPreferences.map(p => ({
        rank: p.rank,
        committeeRank: p.committeeRank,
        committee: p.committee,
        portfolioRank: p.portfolioRank,
        country: p.country
      })),
      motivation: formData.motivation.trim(),

      // Logistics
      accommodationRequired: formData.accommodationRequired || "no",

      // Delegate Socials (Complimentary in First Round) & Fixed Fee Amount
      attendingSocials: Boolean(formData.attendingSocials),
      feeAmount: 1299,

      // Payment Details with UPI QR
      paymentMode: formData.paymentMode || "UPI / QR Scan",
      transactionId: formData.utrNumber.trim(),
      utrNumber: formData.utrNumber.trim(),
      payerName: formData.payerName.trim() || formData.name.trim(),
      paymentDate: formData.paymentDate || isoDate.split("T")[0],
      paymentScreenshotUrl: formData.paymentScreenshotUrl || "",
      paymentScreenshotName: formData.paymentScreenshotName || "",
      paymentStatus: "Pending",
      agreedToTerms: Boolean(formData.agreedToTerms)
    };

    // Clean payload of undefined keys
    const cleanPayload: Record<string, any> = {};
    for (const [key, val] of Object.entries(payload)) {
      if (val !== undefined) {
        cleanPayload[key] = val;
      }
    }

    // Validate size within 1MB limit
    const payloadBytes = new Blob([JSON.stringify(cleanPayload)]).size;
    if (payloadBytes > 1030000) {
      alert(`Application payload (${(payloadBytes / 1024 / 1024).toFixed(2)} MB) exceeds the Firestore document limit (1 MB). Please upload smaller documents or link URLs.`);
      setLoading(false);
      return;
    }

    try {
      // 1. Persist to Express local backup table
      try {
        await fetch("/api/first-round-registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload)
        });
      } catch (backupErr) {
        console.warn("Local first-round backup notice:", backupErr);
      }

      // 2. Persist in separate dedicated Firestore table 'first_round_registrations'
      let firestoreWriteSuccess = false;
      try {
        await setDoc(doc(db, "first_round_registrations", ticketId), cleanPayload);
        firestoreWriteSuccess = true;
        console.log("[FIREBASE SUCCESS] First Round registration stored in first_round_registrations:", ticketId);
      } catch (firestoreErr: any) {
        console.error("Firestore 'first_round_registrations' ticketId write error:", firestoreErr);
      }

      if (user?.uid) {
        try {
          await setDoc(doc(db, "first_round_registrations", user.uid), cleanPayload);
          firestoreWriteSuccess = true;
        } catch (uidErr: any) {
          console.error("Firestore 'first_round_registrations' uid write error:", uidErr);
        }
      }

      if (!firestoreWriteSuccess) {
        console.warn("[FIREBASE WARNING] Cloud Firestore write queued or stored in backup table.");
      }

      // 3. Cache in localStorage
      try {
        localStorage.setItem("iistmun_last_first_round_pass", JSON.stringify(cleanPayload));
      } catch { }

      setSubmittedPass(cleanPayload as FirstRoundRegistrationDetails);
      setViewingPass(true);
      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch (err: any) {
      console.error("First Round submission failed:", err);
      alert(`Submission encountered an issue (${err?.message || "unknown error"}). Please retry or contact the secretariat.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTicketId(true);
    setTimeout(() => setCopiedTicketId(false), 2500);
  };

  const handleDownloadPDF = async () => {
    if (!submittedPass) return;
    setIsDownloading(true);
    try {
      const p1CommitteeObj = COMMITTEES.find(c => c.id === submittedPass.pref1Committee);
      await downloadBoardingPassPDF({
        element: boardingPassRef.current,
        ticketId: submittedPass.id,
        candidateName: submittedPass.name,
        registrationType: "mun",
        details: {
          institution: submittedPass.institution,
          courseOrGrade: `${submittedPass.course} (${submittedPass.yearOfStudy})`,
          chamber: p1CommitteeObj ? p1CommitteeObj.abbreviation : submittedPass.pref1Committee,
          preferredCountry: submittedPass.pref1Country,
          email: submittedPass.email,
          phone: submittedPass.phone,
          timestamp: submittedPass.timestamp
        }
      });
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  // ================= VIEW: CONFIRMED BOARDING PASS =================
  if (viewingPass && submittedPass) {
    const p1 = COMMITTEES.find(c => c.id === submittedPass.pref1Committee);
    const p2 = COMMITTEES.find(c => c.id === submittedPass.pref2Committee);
    const p3 = COMMITTEES.find(c => c.id === submittedPass.pref3Committee);

    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 text-left">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.16em] text-[#8A9A7E] hover:text-[#C9A86A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Return to Convocation Portal
          </button>

          <button
            type="button"
            onClick={() => {
              setViewingPass(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#C9A86A]/40 bg-[#1A1F1A] text-xs font-sans text-[#C9A86A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] transition-colors cursor-pointer uppercase tracking-wider font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Registration Form
          </button>
        </div>

        {/* Success Banner */}
        <div className="bg-[#233124] border border-[#C9A86A] p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#C9A86A]">
                <CheckCircle2 className="h-8 w-8 text-[#C9A86A]" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] block">
                  FIRST ROUND DOSSIER TRANSMITTED
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE6D3] font-normal">
                  Accreditation Confirmed
                </h2>
                <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">
                  Your First Round delegate registration (College &amp; Higher) has been lodged in the official registry. Registration Fee: <strong className="text-[#C9A86A]">₹1,299</strong> (Delegate Socials Included).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isDownloading ? "Synthesizing PDF..." : "Download Boarding Pass"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Receipt / Verification Status Card */}
        <div className="bg-[#1A1F1A] border border-[#C9A86A]/40 p-4 mb-6 flex items-start gap-3 text-left">
          <CreditCard className="h-5 w-5 text-[#C9A86A] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-serif text-sm font-semibold text-[#EDE6D3] block">
              Registration Fee: ₹1,299 &bull; {submittedPass.utrNumber ? "Payment Remittance Submitted" : "Pending Verification"}
            </span>
            <p className="text-[#8A9A7E] mt-0.5 leading-relaxed">
              {submittedPass.utrNumber ? (
                <>Transaction Reference / UTR: <strong className="text-[#C9A86A] font-mono">{submittedPass.utrNumber}</strong> ({submittedPass.paymentMode || "UPI"}). Secretariat accounts will verify your payment and dispatch allotment credentials to your email.</>
              ) : (
                <>Payment status is currently pending verification. Please retain your ticket ID for on-campus verification.</>
              )}
            </p>
          </div>
        </div>

        {/* Boarding Pass Document Card */}
        <div
          ref={boardingPassRef}
          id="first-round-boarding-pass-print"
          className="bg-[#2E3B2F] border-2 border-[#C9A86A] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A86A]/30 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <img src="/logo-emblem-transparent.png" alt="IISTMUN Crest" className="w-12 h-12 object-contain" />
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C9A86A] block font-bold">
                  COLLEGIATE DELEGATE ACCREDITATION PASS
                </span>
                <h3 className="font-serif text-2xl text-[#EDE6D3] tracking-wide">
                  IIST Model United Nations 2027
                </h3>
                <span className="font-sans text-[10px] text-[#8A9A7E] tracking-wider uppercase block">
                  Indian Institute of Space Science and Technology &bull; Valiamala, Trivandrum
                </span>
              </div>
            </div>

            {/* Ticket Stamp */}
            <div className="border border-[#C9A86A] bg-[#1A1F1A] px-4 py-2.5 text-center sm:text-right shrink-0">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] block">
                TICKET IDENTIFIER
              </span>
              <div className="flex items-center justify-center sm:justify-end gap-2 mt-0.5">
                <span className="font-mono text-base font-bold text-[#C9A86A]">
                  {submittedPass.id}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(submittedPass.id)}
                  className="p-1 hover:text-[#C9A86A] transition-colors cursor-pointer"
                  title="Copy Ticket ID"
                >
                  {copiedTicketId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-[#8A9A7E]" />}
                </button>
              </div>
            </div>
          </div>

          {/* Dossier Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Candidate & Academic Clearance */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8A9A7E] block">Candidate Legal Name</span>
                  <strong className="text-sm font-serif text-[#EDE6D3] block">{submittedPass.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8A9A7E] block">Accreditation Tier</span>
                  <strong className="text-xs font-mono text-[#C9A86A] block">First Round (College &amp; Higher)</strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8A9A7E] block">College / University</span>
                  <span className="text-[#EDE6D3] font-sans block">{submittedPass.institution}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8A9A7E] block">Course &amp; Academic Year</span>
                  <span className="text-[#EDE6D3] font-sans block">{submittedPass.course} &bull; {submittedPass.yearOfStudy}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8A9A7E] block">Roll / Reg Number</span>
                  <span className="text-[#EDE6D3] font-mono block">{submittedPass.rollNumber || "Not Provided"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8A9A7E] block">Campus Ambassador Referral</span>
                  <span className="text-[#C9A86A] font-mono block">{submittedPass.campusAmbassadorCode || "None (Direct Entry)"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8A9A7E] block">Registration Fee</span>
                  <span className="text-emerald-400 font-mono font-bold block">₹1,299 (Socials Included)</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8A9A7E] block">Payment Reference</span>
                  <span className="text-[#C9A86A] font-mono block">{submittedPass.utrNumber ? `UTR: ${submittedPass.utrNumber}` : "Pending"}</span>
                </div>
              </div>

              {/* Ranked Country Matrix Preferences across 3 Committees */}
              {(() => {
                const p1 = submittedPass.pref1Portfolios && submittedPass.pref1Portfolios.length > 0 ? submittedPass.pref1Portfolios : (submittedPass.pref1Country ? [submittedPass.pref1Country] : []);
                const p2 = submittedPass.pref2Portfolios && submittedPass.pref2Portfolios.length > 0 ? submittedPass.pref2Portfolios : (submittedPass.pref2Country ? [submittedPass.pref2Country] : []);
                const p3 = submittedPass.pref3Portfolios && submittedPass.pref3Portfolios.length > 0 ? submittedPass.pref3Portfolios : (submittedPass.pref3Country ? [submittedPass.pref3Country] : []);
                const totalLogged = p1.length + p2.length + p3.length;
                return (
                  <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#C9A86A]/20 pb-2">
                      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#C9A86A] block font-bold">
                        REGISTERED COUNCIL PREFERENCES ({totalLogged || targetPortfoliosCount} PORTFOLIOS ACROSS 3 COMMITTEES)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {totalLogged || targetPortfoliosCount} Portfolios Logged
                      </span>
                    </div>
                    <div className="space-y-3 text-xs">
                      {/* Comm 1 */}
                      <div className="p-3 bg-[#2E3B2F] border border-[#C9A86A]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#1A1F1A] bg-[#C9A86A] font-bold px-2 py-0.5">
                            #1 COMMITTEE PREFERENCE (HIGHEST PRIORITY): {(submittedPass.pref1Committee || "").toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                          {p1.map((port, idx) => (
                            <div key={idx} className="p-2 bg-[#1A1F1A] border border-[#C9A86A]/30">
                              <span className="text-[8px] font-mono text-[#C9A86A] block">Choice #{idx + 1} (Rank {idx + 1})</span>
                              <strong className="text-xs font-serif text-[#EDE6D3] block line-clamp-1">{port}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comm 2 */}
                      <div className="p-3 bg-[#2E3B2F] border border-[#C9A86A]/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#EDE6D3] bg-[#1A1F1A] border border-[#C9A86A]/40 font-bold px-2 py-0.5">
                            #2 COMMITTEE PREFERENCE: {(submittedPass.pref2Committee || "").toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                          {p2.map((port, idx) => (
                            <div key={idx} className="p-2 bg-[#1A1F1A] border border-[#C9A86A]/30">
                              <span className="text-[8px] font-mono text-[#8A9A7E] block">Choice #{idx + 1} (Rank {p1.length + idx + 1})</span>
                              <strong className="text-xs font-serif text-[#EDE6D3] block line-clamp-1">{port}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comm 3 */}
                      <div className="p-3 bg-[#2E3B2F] border border-[#C9A86A]/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#EDE6D3] bg-[#1A1F1A] border border-[#C9A86A]/40 font-bold px-2 py-0.5">
                            #3 COMMITTEE PREFERENCE: {(submittedPass.pref3Committee || "").toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                          {p3.map((port, idx) => (
                            <div key={idx} className="p-2 bg-[#1A1F1A] border border-[#C9A86A]/30">
                              <span className="text-[8px] font-mono text-[#8A9A7E] block">Choice #{idx + 1} (Rank {p1.length + p2.length + idx + 1})</span>
                              <strong className="text-xs font-serif text-[#EDE6D3] block line-clamp-1">{port}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* QR Security Verification Stub */}
            <div className="flex flex-col items-center justify-between border border-[#C9A86A]/30 bg-[#1A1F1A] p-5 text-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A9A7E] block mb-2 font-semibold">
                OFFICIAL VERIFICATION EMBLEM
              </span>

              <div className="p-2 border-2 border-[#C9A86A] bg-white shadow-xl inline-block">
                <QRCodeDisplay
                  uniqueId={submittedPass.id}
                  candidateName={submittedPass.name}
                  title="IIST MUN 2027 First Round Accreditation"
                  size={120}
                  showScannerTest={false}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[#8A9A7E]/20 text-center w-full">
                <div className="font-serif text-[11px] font-bold tracking-widest text-[#EDE6D3] uppercase">
                  Valiamala Convocation
                </div>
                <div className="font-mono text-[9px] text-[#8A9A7E] mt-0.5">
                  Logged: {submittedPass.timestamp}
                </div>
                <div className="font-mono text-[10px] text-emerald-400 font-bold mt-1">
                  Status: {submittedPass.status}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Band */}
          <div className="border-t border-[#C9A86A]/30 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-[#8A9A7E]">
            <span>INDIAN INSTITUTE OF SPACE SCIENCE AND TECHNOLOGY &bull; VALIAMALA, TRIVANDRUM</span>
            <span className="text-[#C9A86A]">FIRST ROUND ACCREDITATION &bull; 14TH EDITION</span>
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW: MULTI-STAGE REGISTRATION FORM =================
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 text-left">
      {/* Existing Pass Quick Banner */}
      {submittedPass && !viewingPass && (
        <div className="mb-6 p-4 border border-[#C9A86A] bg-[#233124] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#C9A86A]" />
            <span className="text-xs font-sans text-[#EDE6D3]">
              Existing First Round application found for <strong className="text-[#C9A86A]">{submittedPass.name}</strong> ({submittedPass.id}).
            </span>
          </div>
          <button
            onClick={() => {
              setViewingPass(true);
              window.scrollTo({ top: 100, behavior: "smooth" });
            }}
            className="px-3.5 py-1.5 bg-[#C9A86A] text-[#1A1F1A] text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer"
          >
            View Boarding Pass
          </button>
        </div>
      )}

      {/* Header Masthead */}
      <div className="relative border border-[#C9A86A]/40 bg-[#233124]/90 backdrop-blur-md p-6 sm:p-8 mb-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C9A86A] bg-[#2E3B2F] border border-[#C9A86A]/40 px-2.5 py-1">
              CONVOCATION DISPATCH • 14TH EDITION
            </span>
            <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#1A1F1A] bg-[#C9A86A] px-2.5 py-1 font-bold">
              FIRST ROUND NOW OPEN • COLLEGE &amp; HIGHER
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#EDE6D3] font-normal tracking-tight">
            First Round Accreditation <br />
            <span className="text-[#C9A86A] italic">College &amp; Higher Level Candidates</span>
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#EDE6D3]/85 leading-relaxed font-light">
            Welcome to the First Round Registration for undergraduate, postgraduate, and doctoral scholars across all academic disciplines. Registration fee is <strong className="text-[#C9A86A]">₹1,299</strong> (Delegate Socials included). Select your 3 preferences directly from the live Council View below.
          </p>
        </div>

        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <img src="/logo-emblem-transparent.png" alt="Emblem" className="w-64 h-64 object-contain" />
        </div>
      </div>

      {/* 4-Stage Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`p-3 border transition-all text-left cursor-pointer ${step === 1
            ? "border-[#C9A86A] bg-[#2E3B2F] shadow-md"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#C9A86A]/40"
            }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] block">STAGE I</span>
          <span className="font-serif text-xs text-[#EDE6D3] font-medium block mt-0.5">Personal Dossier</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (validateStep(1)) setStep(2);
          }}
          className={`p-3 border transition-all text-left cursor-pointer ${step === 2
            ? "border-[#C9A86A] bg-[#2E3B2F] shadow-md"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#C9A86A]/40"
            }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] block">STAGE II</span>
          <span className="font-serif text-xs text-[#EDE6D3] font-medium block mt-0.5">Collegiate Clearance</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (validateStep(1) && validateStep(2)) setStep(3);
          }}
          className={`p-3 border transition-all text-left cursor-pointer ${step === 3
            ? "border-[#C9A86A] bg-[#2E3B2F] shadow-md"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#C9A86A]/40"
            }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] block">STAGE III</span>
          <span className="font-serif text-xs text-[#EDE6D3] font-medium block mt-0.5">Council Preferences</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (validateStep(1) && validateStep(2) && validateStep(3)) setStep(4);
          }}
          className={`p-3 border transition-all text-left cursor-pointer ${step === 4
            ? "border-[#C9A86A] bg-[#2E3B2F] shadow-md"
            : "border-[#C9A86A]/20 bg-[#1A1F1A]/70 hover:border-[#C9A86A]/40"
            }`}
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#C9A86A] block">STAGE IV</span>
          <span className="font-serif text-xs text-[#EDE6D3] font-medium block mt-0.5">Payment &amp; QR</span>
        </button>
      </div>

      {/* FORM BODY */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================= STEP 1: PERSONAL & EMERGENCY DETAILS ================= */}
        {step === 1 && (
          <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#C9A86A]/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE I &bull; DELEGATE IDENTITY
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                Personal &amp; Emergency Contact Records
              </h2>
              <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                Please provide your official credentials exactly as they appear on your government photo identity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Advait Sharma"
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                />
                {errors.name && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.name}</p>}
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Primary Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. advait.sharma@college.edu"
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                />
                {errors.email && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.email}</p>}
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                />
                {errors.phone && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.phone}</p>}
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                />
                {errors.dob && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.dob}</p>}
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                >
                  <option value="Male" className="bg-[#1A1F1A]">Male</option>
                  <option value="Female" className="bg-[#1A1F1A]">Female</option>
                  <option value="Non-Binary" className="bg-[#1A1F1A]">Non-Binary</option>
                  <option value="Prefer not to say" className="bg-[#1A1F1A]">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  City &amp; State *
                </label>
                <input
                  type="text"
                  value={formData.cityState}
                  onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                  placeholder="e.g. Bengaluru, Karnataka"
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                />
                {errors.cityState && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.cityState}</p>}
              </div>
            </div>

            <div>
              <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                Permanent Residential Address (Optional)
              </label>
              <textarea
                value={formData.fullAddress}
                onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                rows={2}
                placeholder="Residential street, apartment / hostel, pin code..."
                className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] p-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
              />
            </div>

            <div className="border-t border-[#C9A86A]/20 pt-4 space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold block">
                EMERGENCY / GUARDIAN CONTACT DETAILS
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                  />
                  {errors.emergencyContactName && (
                    <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.emergencyContactName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    Relationship *
                  </label>
                  <select
                    value={formData.emergencyContactRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                    className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                  >
                    <option value="Parent" className="bg-[#1A1F1A]">Parent (Father / Mother)</option>
                    <option value="Legal Guardian" className="bg-[#1A1F1A]">Legal Guardian</option>
                    <option value="Sibling" className="bg-[#1A1F1A]">Sibling / Relative</option>
                    <option value="Faculty / Mentor" className="bg-[#1A1F1A]">Faculty Advisor / Mentor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    Emergency Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="e.g. +91 94470 12345"
                    className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer"
              >
                <span>Proceed to Collegiate Clearance</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: COLLEGIATE CLEARANCE & ACADEMICS ================= */}
        {step === 2 && (
          <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#C9A86A]/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE II &bull; COLLEGIATE &amp; IDENTITY CLEARANCE
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                Academic Institution &amp; Verification Documents
              </h2>
              <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                First Round delegates must submit proof of college enrollment and government identity for ISRO/IIST campus gate security passes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  College / University / Higher Institution Name *
                </label>
                <InstitutionSelect
                  value={formData.institution}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, institution: val }));
                    if (errors.institution) setErrors(prev => ({ ...prev, institution: "" }));
                  }}
                  error={errors.institution}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    Field of Study / Degree *
                  </label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => {
                      setFormData({ ...formData, course: e.target.value });
                      if (errors.course) setErrors(prev => ({ ...prev, course: "" }));
                    }}
                    placeholder="e.g. B.Tech Aerospace Engineering, B.Sc Physics, B.A. Economics..."
                    className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans placeholder-[#8A9A7E]/50"
                  />
                  {errors.course && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.course}</p>}
                </div>

                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    Academic Year of Study *
                  </label>
                  <select
                    value={formData.yearOfStudy}
                    onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                    className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                  >
                    {COLLEGE_YEARS.map(yr => (
                      <option key={yr} value={yr} className="bg-[#1A1F1A]">{yr}</option>
                    ))}
                  </select>
                  {errors.yearOfStudy && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.yearOfStudy}</p>}
                </div>

                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                    College Registration No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. SC22B088"
                    className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                  />
                </div>
              </div>

              {/* Campus Ambassador Referral Code Input */}
              <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-4 sm:p-5 relative shadow-md">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#C9A86A]/20">
                  <Tag className="h-4 w-4 text-[#C9A86A]" />
                  <span className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-bold">
                    Campus Ambassador Referral Code (Optional)
                  </span>
                </div>
                <p className="font-sans text-[11px] text-[#8A9A7E] mb-3 leading-relaxed">
                  If you were referred by an appointed IISTMUN Campus Ambassador from your university, enter their unique referral code below.
                </p>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={formData.campusAmbassadorCode}
                    onChange={(e) => setFormData({ ...formData, campusAmbassadorCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. CA-2027-1042 or AMBASSADOR-CODE"
                    className="w-full border border-[#8A9A7E]/40 bg-[#2E3B2F] px-4 py-2 text-xs text-[#EDE6D3] uppercase font-mono tracking-wider outline-none focus:border-[#C9A86A]"
                  />
                  {formData.campusAmbassadorCode.trim() && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 mt-1.5 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Referral tag recorded: {formData.campusAmbassadorCode.trim()}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Aadhaar / Passport Identification Number *
                </label>
                <input
                  type="text"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                  placeholder="12-digit Aadhaar Number or Passport Number"
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-mono tracking-wider"
                />
                {errors.aadharNumber && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.aadharNumber}</p>
                )}
              </div>
            </div>

            {/* Document Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Aadhaar Card / Passport Copy *
                </label>
                <p className="font-sans text-[11px] text-[#8A9A7E] mb-2">
                  Front face scan of your government identity document.
                </p>
                <FileUploadZone
                  label="Upload Aadhaar Card or Passport Copy"
                  sublabel="Attach clear scan or photo (JPG, PNG, PDF up to 1MB)"
                  fileType="document"
                  accept="image/*,.pdf"
                  valueUrl={formData.aadharPhotoUrl}
                  valueName={formData.aadharPhotoName}
                  onChange={(url, name) => {
                    setFormData(prev => ({ ...prev, aadharPhotoUrl: url, aadharPhotoName: name }));
                    if (errors.aadharPhotoUrl) setErrors(prev => ({ ...prev, aadharPhotoUrl: "" }));
                  }}
                  onClear={() => setFormData(prev => ({ ...prev, aadharPhotoUrl: "", aadharPhotoName: "" }))}
                  required={true}
                />
                {errors.aadharPhotoUrl && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.aadharPhotoUrl}</p>
                )}
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  College ID Card *
                </label>
                <p className="font-sans text-[11px] text-[#8A9A7E] mb-2">
                  Official college student identification card or institutional bonafide letter.
                </p>
                <FileUploadZone
                  label="Upload College ID Card / Bonafide Certificate"
                  sublabel="Attach official college ID card or bonafide letter (JPG, PNG, PDF up to 1MB)"
                  fileType="document"
                  accept="image/*,.pdf"
                  valueUrl={formData.idCardUrl}
                  valueName={formData.idCardName}
                  onChange={(url, name) => {
                    setFormData(prev => ({ ...prev, idCardUrl: url, idCardName: name }));
                    if (errors.idCardUrl) setErrors(prev => ({ ...prev, idCardUrl: "" }));
                  }}
                  onClear={() => setFormData(prev => ({ ...prev, idCardUrl: "", idCardName: "" }))}
                  required={true}
                />
                {errors.idCardUrl && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.idCardUrl}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:border-[#C9A86A] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer"
              >
                <span>Proceed to Council Preferences</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: COUNCIL VIEW PREFERENCES (AVAILABLE SEATS FIRST) ================= */}
        {step === 3 && (
          <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#C9A86A]/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE III &bull; COUNCIL &amp; PORTFOLIO ALLOCATION
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                Ranked Preferences (Council View)
              </h2>
              <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                <strong>1.</strong> The order in which you choose committees determines your committee preference order (1st, 2nd, and 3rd).<br />
                <strong>2.</strong> Per committee, it is mandatory to choose 5 portfolios in order of preference (for International Press, select 1 or both portfolios).<br />
                <strong>3.</strong> Portfolios in your 1st Committee hold the highest overall preference.
              </p>
            </div>

            {/* Quick Experience, Accommodation & Campus Ambassador Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Prior MUN Experience *
                </label>
                <select
                  value={formData.munExperience}
                  onChange={(e) => setFormData({ ...formData, munExperience: e.target.value })}
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                >
                  <option value="None" className="bg-[#1A1F1A]">None &bull; First Time Delegate</option>
                  <option value="1-2" className="bg-[#1A1F1A]">1 &ndash; 2 Conferences</option>
                  <option value="3-5" className="bg-[#1A1F1A]">3 &ndash; 5 Conferences</option>
                  <option value="5+" className="bg-[#1A1F1A]">5+ Conferences (Veteran)</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                  Accommodation Needed? *
                </label>
                <select
                  value={formData.accommodationRequired}
                  onChange={(e) => setFormData({ ...formData, accommodationRequired: e.target.value as "yes" | "no" })}
                  className="w-full border border-[#8A9A7E]/40 bg-[#1A1F1A] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans"
                >
                  <option value="no" className="bg-[#1A1F1A]">No </option>
                  <option value="yes" className="bg-[#1A1F1A]">Yes</option>
                </select>
              </div>
            </div>

            {/* ================= PREFERENCE TRAY: LIVE DIPLOMATIC DOCK ================= */}
            <div className="border-2 border-[#C9A86A] bg-[#1A1F1A] p-5 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C9A86A]/20 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C9A86A]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-bold">
                    DIPLOMATIC ALLOCATION DOCK ({totalPortfoliosCount} PORTFOLIOS ACROSS {selectedCommittees.length}/3 COMMITTEES)
                  </span>
                </div>
                {totalPortfoliosCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCommittees([]);
                      setCommitteePortfolios({});
                    }}
                    className="text-[10px] font-sans uppercase tracking-wider text-[#8A9A7E] hover:text-rose-400 underline transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Clear All Preferences
                  </button>
                )}
              </div>

              {/* Progress Summary Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#EDE6D3]">
                    Overall Progress: <strong className={totalPortfoliosCount === targetPortfoliosCount ? "text-emerald-400" : "text-[#C9A86A]"}>{totalPortfoliosCount} / {targetPortfoliosCount} Portfolios</strong>
                  </span>
                  <span className="text-[#8A9A7E]">
                    {selectedCommittees.length} of 3 Committees Configured
                  </span>
                </div>
                <div className="w-full bg-[#2E3B2F] h-2 rounded-none overflow-hidden border border-[#C9A86A]/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#C9A86A] to-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (totalPortfoliosCount / targetPortfoliosCount) * 100)}%` }}
                  />
                </div>
              </div>

              {errors.preferences && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.preferences}</span>
                </div>
              )}

              {/* 3 Committee Preference Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {[0, 1, 2].map((slotIdx) => {
                  const commId = selectedCommittees[slotIdx];
                  const commObj = commId ? MATRIX_COMMITTEES.find(c => c.id === commId) : null;
                  const ports = commId ? (committeePortfolios[commId] || []) : [];
                  const commMax = getCommitteePortfolioMax(commId);
                  const rankLabels = ["1ST", "2ND", "3RD"];
                  const prevCounts = selectedCommittees.slice(0, slotIdx).reduce((acc, c) => acc + (committeePortfolios[c]?.length || 0), 0);
                  const overallStartRank = prevCounts + 1;
                  const isTopPriority = slotIdx === 0;

                  return (
                    <div
                      key={slotIdx}
                      className={`p-4 border-2 transition-all flex flex-col justify-between ${commId
                        ? isTopPriority
                          ? "border-[#C9A86A] bg-[#2E3B2F] shadow-lg ring-1 ring-[#C9A86A]/40"
                          : "border-[#C9A86A]/60 bg-[#253026]"
                        : "border-dashed border-[#C9A86A]/30 bg-[#1A1F1A]/50"
                        }`}
                    >
                      <div>
                        {/* Committee Header & Controls */}
                        <div className="flex items-start justify-between gap-1.5 mb-2 pb-2 border-b border-[#C9A86A]/20">
                          <div>
                            <span className={`font-mono text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 inline-block mb-1 ${isTopPriority
                              ? "bg-[#C9A86A] text-[#1A1F1A]"
                              : "bg-[#1A1F1A] text-[#EDE6D3] border border-[#C9A86A]/40"
                              }`}>
                              ★ {rankLabels[slotIdx]} COMMITTEE PREF {isTopPriority && "(MOST PREFERRED)"}
                            </span>
                            <h4 className="font-serif text-sm font-semibold text-[#EDE6D3] leading-snug">
                              {commObj ? commObj.label : `Select Committee #${slotIdx + 1}`}
                            </h4>
                            <span className="font-mono text-[9px] text-[#8A9A7E] block mt-0.5">
                              {commId ? (
                                commId === "ip"
                                  ? `${ports.length === 0 ? "0 Selected (1 Required, 2 Allowed)" : ports.length === 1 ? `Rank ${overallStartRank} • 1 Selected (2nd Optional)` : `Ranks ${overallStartRank}–${overallStartRank + 1} • 2/2 Selected`}`
                                  : `Ranks ${overallStartRank}–${overallStartRank + 4} • ${ports.length}/5 Selected`
                              ) : "Awaiting committee selection"}
                            </span>
                          </div>

                          {commId && (
                            <div className="flex items-center gap-1 shrink-0">
                              {slotIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveCommittee(slotIdx, "up")}
                                  className="p-1 bg-[#1A1F1A] border border-[#C9A86A]/30 hover:border-[#C9A86A] text-[#8A9A7E] hover:text-[#C9A86A] cursor-pointer"
                                  title="Increase Preference Rank (Move Up)"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </button>
                              )}
                              {slotIdx < selectedCommittees.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveCommittee(slotIdx, "down")}
                                  className="p-1 bg-[#1A1F1A] border border-[#C9A86A]/30 hover:border-[#C9A86A] text-[#8A9A7E] hover:text-[#C9A86A] cursor-pointer"
                                  title="Decrease Preference Rank (Move Down)"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveCommittee(commId)}
                                className="p-1 bg-[#1A1F1A] border border-rose-500/30 hover:border-rose-500 text-[#8A9A7E] hover:text-rose-400 cursor-pointer"
                                title="Remove Committee"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Portfolio Slots */}
                        <div className="space-y-1.5 my-2">
                          {Array.from({ length: commMax }).map((_, portIdx) => {
                            const country = ports[portIdx];
                            const overallRank = overallStartRank + portIdx;
                            const isOptional = commId === "ip" && portIdx === 1;

                            return (
                              <div
                                key={portIdx}
                                className={`p-2 text-xs flex items-center justify-between border transition-all ${country
                                  ? "bg-[#1A1F1A] border-[#C9A86A]/40 text-[#EDE6D3]"
                                  : isOptional
                                    ? "bg-[#141814]/25 border-dashed border-[#8A9A7E]/30 text-[#8A9A7E]/50"
                                    : "bg-[#141814]/40 border-dashed border-[#8A9A7E]/20 text-[#8A9A7E]/60"
                                  }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                  <span className={`font-mono text-[9px] px-1 py-0.2 font-bold shrink-0 ${country
                                    ? isTopPriority
                                      ? "bg-[#C9A86A] text-[#1A1F1A]"
                                      : "bg-[#2E3B2F] text-[#C9A86A] border border-[#C9A86A]/40"
                                    : "text-[#8A9A7E]/50"
                                    }`}>
                                    #{portIdx + 1}
                                  </span>
                                  <span className="font-serif text-xs truncate">
                                    {country || (
                                      <span className="font-sans text-[10px] italic">
                                        {isOptional ? "Choice #2 (Optional)" : `Choice #${portIdx + 1} empty`}
                                      </span>
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-mono text-[9px] text-[#8A9A7E]/80">
                                    R#{overallRank}
                                  </span>
                                  {country && commId && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePortfolio(commId, country)}
                                      className="text-[#8A9A7E] hover:text-rose-400 p-0.5 cursor-pointer"
                                      title="Remove choice"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-[#C9A86A]/20 mt-2">
                        {commId ? (
                          <button
                            type="button"
                            onClick={() => setActiveCouncilTab(commId)}
                            className={`w-full py-1 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer border ${activeCouncilTab === commId
                              ? "bg-[#C9A86A] text-[#1A1F1A] font-bold border-[#C9A86A]"
                              : "bg-[#1A1F1A] text-[#C9A86A] border-[#C9A86A]/40 hover:bg-[#2E3B2F]"
                              }`}
                          >
                            {activeCouncilTab === commId ? "Currently Viewing Chamber" : "Browse & Select in This Chamber"}
                          </button>
                        ) : (
                          <span className="block text-center text-[10px] font-sans text-[#8A9A7E]/70 py-1">
                            Click a council tab below to add
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Committee Selector Pills (if fewer than 3 chosen) */}
              {selectedCommittees.length < 3 && (
                <div className="p-3 bg-[#233124] border border-[#C9A86A]/40 text-xs flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A86A] font-semibold">
                    Click to add as Committee Preference #{selectedCommittees.length + 1}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {MATRIX_COMMITTEES.filter(c => !selectedCommittees.includes(c.id)).map(comm => (
                      <button
                        key={comm.id}
                        type="button"
                        onClick={() => {
                          setSelectedCommittees(prev => [...prev, comm.id]);
                          setActiveCouncilTab(comm.id);
                        }}
                        className="px-2.5 py-1 bg-[#1A1F1A] border border-[#C9A86A]/40 hover:border-[#C9A86A] hover:bg-[#C9A86A] hover:text-[#1A1F1A] text-[#EDE6D3] text-[10px] font-sans uppercase font-bold transition-colors cursor-pointer"
                      >
                        + Add {comm.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ================= THE COUNCIL VIEW INTERFACE ================= */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-4 sm:p-5 space-y-4">
              <div className="border-b border-[#C9A86A]/20 pb-3">
                <h3 className="font-serif text-lg text-[#EDE6D3] font-medium flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-[#C9A86A]" />
                  Portfolio Matrix of Committees
                </h3>
                <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">
                  Browse by committee chamber below. Select portfolios in each of your 3 committees. Selected and Available portfolios appear first.
                </p>
              </div>

              {/* Council Tabs Selector */}
              <div className="flex flex-wrap gap-2 border-b border-[#C9A86A]/20 pb-3">
                {MATRIX_COMMITTEES.map(comm => {
                  const availCount = countAvailableInCouncil(comm.id);
                  const isCurrent = activeCouncilTab === comm.id;
                  const commRankIdx = selectedCommittees.indexOf(comm.id);
                  const portsCount = committeePortfolios[comm.id]?.length || 0;

                  return (
                    <button
                      key={comm.id}
                      type="button"
                      onClick={() => setActiveCouncilTab(comm.id)}
                      className={`px-3 py-2 text-xs font-sans uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${isCurrent
                        ? "bg-[#C9A86A] text-[#1A1F1A] font-bold shadow-md"
                        : "border border-[#C9A86A]/30 bg-[#2E3B2F] text-[#EDE6D3] hover:border-[#C9A86A]"
                        }`}
                    >
                      <span>{comm.label}</span>
                      {commRankIdx !== -1 ? (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 font-bold ${isCurrent ? "bg-[#1A1F1A] text-[#C9A86A]" : "bg-emerald-950/90 text-emerald-300 border border-emerald-500/40"
                          }`}>
                          #{commRankIdx + 1} PREF ({portsCount}/{comm.id === "ip" ? "1-2" : "5"})
                        </span>
                      ) : (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs ${isCurrent ? "bg-[#1A1F1A] text-[#C9A86A]" : "bg-[#1A1F1A]/70 text-emerald-400"
                          }`}>
                          {comm.id === "ip" ? "Select 1 or 2" : `${availCount} Open`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Council Masthead */}
              <div className="bg-[#2E3B2F]/60 border-l-2 border-[#C9A86A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-sm font-semibold text-[#EDE6D3]">
                      {MATRIX_COMMITTEES.find(c => c.id === activeCouncilTab)?.name}
                    </span>
                    {selectedCommittees.includes(activeCouncilTab) ? (
                      <span className="font-mono text-[9px] bg-[#C9A86A] text-[#1A1F1A] font-bold px-1.5 py-0.2">
                        COMMITTEE PREFERENCE #{selectedCommittees.indexOf(activeCouncilTab) + 1} ({committeePortfolios[activeCouncilTab]?.length || 0}/{activeCouncilTab === "ip" ? "1-2" : "5"} PORTFOLIOS)
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] bg-[#1A1F1A] text-[#C9A86A] border border-[#C9A86A]/40 px-1.5 py-0.2">
                        {selectedCommittees.length < 3 ? `+ Click any portfolio to add as Preference #${selectedCommittees.length + 1}` : "3 Committees already chosen"}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-[#8A9A7E] block mt-0.5">
                    Council Code: {activeCouncilTab.toUpperCase()} &bull; Total Available Seats: <strong className="text-emerald-400">{countAvailableInCouncil(activeCouncilTab)}</strong>
                  </span>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2">
                  <div className="relative min-w-[180px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A9A7E]" />
                    <input
                      type="text"
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      placeholder="Search nation..."
                      className="w-full border border-[#C9A86A]/30 bg-[#1A1F1A] py-1.5 pl-8 pr-2.5 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E] outline-none focus:border-[#C9A86A]"
                    />
                    {matrixSearch && (
                      <button
                        type="button"
                        onClick={() => setMatrixSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A9A7E] hover:text-[#EDE6D3]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center border border-[#C9A86A]/30 bg-[#1A1F1A] p-0.5">
                    <button
                      type="button"
                      onClick={() => setMatrixStatusFilter("all")}
                      className={`px-2 py-1 text-[9px] font-sans uppercase tracking-wider cursor-pointer ${matrixStatusFilter === "all" ? "bg-[#C9A86A] text-[#1A1F1A] font-bold" : "text-[#8A9A7E]"
                        }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatrixStatusFilter("Available")}
                      className={`px-2 py-1 text-[9px] font-sans uppercase tracking-wider cursor-pointer ${matrixStatusFilter === "Available" ? "bg-[#C9A86A] text-[#1A1F1A] font-bold" : "text-[#8A9A7E]"
                        }`}
                    >
                      Available
                    </button>
                  </div>
                </div>
              </div>

              {/* Council Portfolios Grid - Selected & Available Seats First */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
                {councilPortfoliosSorted.length > 0 ? (
                  councilPortfoliosSorted.map((item) => {
                    const isClickable = item.status === "Available" || item.status === "Reserved";
                    const isSelected = item.isSelected;
                    const commPorts = committeePortfolios[activeCouncilTab] || [];
                    const isCommFull = commPorts.length >= getCommitteePortfolioMax(activeCouncilTab);

                    return (
                      <div
                        key={item.country}
                        onClick={() => {
                          if (isClickable || isSelected) {
                            handleTogglePortfolio(item.country, activeCouncilTab);
                          }
                        }}
                        className={`p-3 border transition-all text-left relative cursor-pointer ${isSelected
                          ? "border-2 border-[#C9A86A] bg-[#2E3B2F] shadow-lg ring-1 ring-[#C9A86A]"
                          : isCommFull
                            ? "border-[#8A9A7E]/20 bg-[#1A1F1A]/60 opacity-60"
                            : item.status === "Available"
                              ? "border-emerald-500/30 bg-[#1A1F1A] hover:border-[#C9A86A] hover:bg-[#233124]"
                              : item.status === "Reserved"
                                ? "border-[#C9A86A]/40 bg-[#1A1F1A]/80 hover:border-[#C9A86A]"
                                : "border-[#8A9A7E]/10 bg-[#141814]/40 opacity-40 cursor-not-allowed"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#8A9A7E]">
                            {activeCouncilTab.toUpperCase()}
                          </span>

                          {isSelected ? (
                            <span className="font-mono text-[9px] bg-[#C9A86A] text-[#1A1F1A] font-bold px-1.5 py-0.2 shadow-sm">
                              CHOICE #{item.portRankInComm} &bull; R#{item.selectedInfo?.overallRank}
                            </span>
                          ) : (
                            <span className={`font-mono text-[8px] uppercase px-1.5 py-0.2 ${item.status === "Available"
                              ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 font-semibold"
                              : item.status === "Reserved"
                                ? "text-[#C9A86A] bg-[#C9A86A]/20 border border-[#C9A86A]/40"
                                : "text-[#8A9A7E]/60 bg-[#1A1F1A]"
                              }`}>
                              {item.status === "Available" ? "Available" : item.status === "Reserved" ? "Special EB" : item.status}
                            </span>
                          )}
                        </div>

                        <strong className="font-serif text-xs text-[#EDE6D3] block line-clamp-1 mb-1">
                          {item.country}
                        </strong>

                        <div className="mt-2 text-[10px] font-sans">
                          {isSelected ? (
                            <span className="text-rose-400 font-semibold inline-flex items-center gap-1">
                              <X className="h-3 w-3" /> Click to Deselect
                            </span>
                          ) : isCommFull ? (
                            <span className="text-[#8A9A7E]/70 font-mono text-[9px]">
                              {commPorts.length}/{getCommitteePortfolioMax(activeCouncilTab)} Selected in Council
                            </span>
                          ) : isClickable ? (
                            <span className="text-emerald-400/90 group-hover:text-[#C9A86A]">
                              + Add as Choice #{commPorts.length + 1}{activeCouncilTab === "ip" && commPorts.length === 1 ? " (Optional)" : ""}
                            </span>
                          ) : (
                            <span className="text-[#8A9A7E]/50 flex items-center gap-1">
                              <Ban className="h-2.5 w-2.5" /> Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center text-[#8A9A7E] font-sans text-xs">
                    No portfolios matched your search query in this chamber.
                  </div>
                )}
              </div>
            </div>

            {/* Statement of Purpose / Past MUN Achievements */}
            <div>
              <label className="block font-sans text-xs uppercase tracking-wider text-[#C9A86A] mb-1 font-semibold">
                Statement of Purpose / Past MUN Awards &amp; Achievements *
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => {
                  setFormData({ ...formData, motivation: e.target.value });
                  if (errors.motivation) {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.motivation;
                      return next;
                    });
                  }
                }}
                rows={3}
                placeholder="Mention past conference awards, gavels, diplomatic resolutions, or motivation for your top preference (if first-time delegate, state your motivation)..."
                className={`w-full border bg-[#1A1F1A] p-3 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] font-sans leading-relaxed ${errors.motivation ? "border-rose-500" : "border-[#8A9A7E]/40"}`}
              />
              {errors.motivation && (
                <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.motivation}</p>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:border-[#C9A86A] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={
                  selectedCommittees.length < 3 ||
                  selectedCommittees.some(c => (committeePortfolios[c]?.length || 0) < getCommitteePortfolioMin(c))
                }
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span>Proceed to Payment with QR ({totalPortfoliosCount} Portfolios Chosen)</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: PAYMENT WITH OFFICIAL UPI QR CODE ================= */}
        {step === 4 && (
          <div className="bg-[#2E3B2F] border border-[#C9A86A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#C9A86A]/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] block">
                STAGE IV &bull; OFFICIAL UPI QR PAYMENT &amp; DISPATCH
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#EDE6D3] font-normal">
                Remit Registration Fee via Official QR Code
              </h2>
              <p className="font-sans text-xs text-[#8A9A7E] mt-1">
                Scan the official IIST MUN QR code below with any UPI application (GPay, PhonePe, Paytm, Cred, BHIM) to remit your registration fee of <strong className="text-[#C9A86A]">₹1,299</strong>.
              </p>
            </div>

            {/* Total Payable Assessment Banner */}
            <div className="border border-[#C9A86A]/50 bg-[#1A1F1A] p-5 text-left shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#C9A86A]/20 pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A86A] font-bold block">
                    FIRST ROUND ACCREDITATION CHARGE
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#EDE6D3] mt-0.5">
                    Total Amount Due: ₹1,299
                  </h3>
                  <p className="font-sans text-xs text-[#8A9A7E] mt-0.5">
                    Includes conference registration, committee materials, campus entry badge, and delegate socials night.
                  </p>
                </div>
                <div className="sm:text-right bg-[#2E3B2F] sm:bg-transparent p-3 sm:p-0 border sm:border-0 border-[#C9A86A]/30 w-full sm:w-auto">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-[#8A9A7E] block">Amount Due</span>
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#C9A86A]">
                    ₹1,299
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs font-sans text-[#8A9A7E]">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider">Base Registration:</span>
                  <strong className="text-[#EDE6D3] font-mono">₹1,299</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider">Socials Night:</span>
                  <strong className="text-emerald-400 font-mono">Included</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider">Locked Preferences:</span>
                  <strong className="text-emerald-400 font-mono">3 of 3 Portfolios</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider">Referral Code:</span>
                  <strong className="text-[#C9A86A] font-mono">{formData.campusAmbassadorCode || "None"}</strong>
                </div>
              </div>
            </div>

            {/* Official UPI QR Payment Card */}
            <div className="border-2 border-[#C9A86A] bg-[#141814] p-6 text-center relative overflow-hidden shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A86A]/20 border border-[#C9A86A] text-[#C9A86A] text-[10px] font-mono uppercase tracking-widest font-bold mb-4">
                <QrCode className="h-3.5 w-3.5 text-[#C9A86A]" />
                <span>OFFICIAL UPI QR PAYMENT</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Official UPI QR Graphic */}
                <div className="flex flex-col items-center">
                  <div className="relative p-2.5 bg-white border-2 border-[#C9A86A] shadow-2xl inline-block max-w-[240px] sm:max-w-[260px] w-full">
                    <img
                      src="/rayparthmilaQR.png"
                      alt="IIST MUN Official UPI QR Code - Ray Parth Milind"
                      className="w-full h-auto object-contain block mx-auto rounded"
                    />
                    <div className="mt-2 py-1.5 px-3 bg-[#1A1F1A] text-center border border-[#C9A86A]/40 flex items-center justify-between">
                      <span className="font-mono text-[9px] text-[#8A9A7E] uppercase tracking-wider">Amount:</span>
                      <span className="font-mono text-xs font-bold text-[#C9A86A]">₹1,299</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#8A9A7E] font-mono mt-2">
                    Scan with any UPI app to remit ₹1,299
                  </span>
                  <a
                    href="/rayparthmilaQR.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-[#1A1F1A] border border-[#C9A86A]/40 hover:border-[#C9A86A] text-[10px] font-mono text-[#C9A86A] hover:text-[#EDE6D3] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View / Download Official QR (rayparthmilaQR.pdf)</span>
                  </a>
                </div>

                {/* Direct UPI Credentials & Instructions */}
                <div className="text-left space-y-3.5">
                  <div className="space-y-1">
                    <span className="font-sans text-[10px] uppercase tracking-wider text-[#8A9A7E] block">
                      Direct UPI ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-[#C9A86A] bg-[#1A1F1A] px-3.5 py-1.5 border border-[#C9A86A]/40 inline-block select-all">
                        87786201@ubin
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-3 py-1.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] text-xs font-sans font-semibold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedUpi ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedUpi ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[#8A9A7E] space-y-1">
                    <div>
                      <span className="text-[#EDE6D3] font-semibold">Account Holder:</span>{" "}
                      Ray Parth Milind
                    </div>
                    <div>
                      <span className="text-[#EDE6D3] font-semibold">Bank:</span>{" "}
                      Union Bank of India
                    </div>
                    <div>
                      <span className="text-[#EDE6D3] font-semibold">Accepted Applications:</span>{" "}
                      Google Pay, PhonePe, Paytm, BHIM, Cred, Mobile Banking
                    </div>
                  </div>

                  {/* 3 Step Guide */}
                  <div className="border border-[#8A9A7E]/30 bg-[#1A1F1A] p-3 text-[11px] text-[#EDE6D3] space-y-1.5 leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#C9A86A] font-bold">1.</span>
                      <span>Scan the official QR code or transfer ₹1,299 to <strong className="text-[#C9A86A]">87786201@ubin</strong>.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#C9A86A] font-bold">2.</span>
                      <span>Copy the <strong>12-digit UTR / UPI Transaction Reference Number</strong> from your payment receipt.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#C9A86A] font-bold">3.</span>
                      <span>Enter the UTR number and attach the screenshot below to lodge your First Round registration.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details Entry Form */}
            <div className="border border-[#8A9A7E]/30 bg-[#1A1F1A]/80 p-5 space-y-4">
              <span className="font-sans text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold block flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-[#C9A86A]" />
                Payment Transaction Credentials
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Mode */}
                <div>
                  <label className="block font-sans text-[9px] uppercase text-[#C9A86A] mb-1 font-semibold">
                    Payment Mode *
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => {
                      setFormData({ ...formData, paymentMode: e.target.value });
                      if (errors.paymentMode) {
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.paymentMode;
                          return next;
                        });
                      }
                    }}
                    className={`w-full border bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] ${errors.paymentMode ? "border-rose-500" : "border-[#8A9A7E]/30"}`}
                  >
                    <option value="UPI / QR Scan" className="bg-[#1A1F1A]">UPI / QR Scan</option>
                    <option value="Google Pay" className="bg-[#1A1F1A]">Google Pay</option>
                    <option value="PhonePe" className="bg-[#1A1F1A]">PhonePe</option>
                    <option value="Paytm" className="bg-[#1A1F1A]">Paytm</option>
                    <option value="Net Banking / IMPS" className="bg-[#1A1F1A]">Net Banking / IMPS Transfer</option>
                  </select>
                  {errors.paymentMode && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.paymentMode}</p>}
                </div>

                {/* UTR / UPI Reference Number */}
                <div>
                  <label className="block font-sans text-[9px] uppercase text-[#C9A86A] mb-1 font-semibold">
                    12-Digit UTR / UPI Reference Number *
                  </label>
                  <input
                    type="text"
                    value={formData.utrNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, utrNumber: e.target.value });
                      if (errors.utrNumber) {
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.utrNumber;
                          return next;
                        });
                      }
                    }}
                    className={`w-full border bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] font-mono ${errors.utrNumber ? "border-rose-500" : "border-[#8A9A7E]/30"}`}
                    placeholder="e.g. 403819284729"
                  />
                  {errors.utrNumber && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.utrNumber}</p>}
                </div>

                {/* Payer Account Name */}
                <div>
                  <label className="block font-sans text-[9px] uppercase text-[#C9A86A] mb-1 font-semibold">
                    Payer Name (Bank / UPI Account Holder) *
                  </label>
                  <input
                    type="text"
                    value={formData.payerName}
                    onChange={(e) => {
                      setFormData({ ...formData, payerName: e.target.value });
                      if (errors.payerName) {
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.payerName;
                          return next;
                        });
                      }
                    }}
                    className={`w-full border bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/50 outline-none focus:border-[#C9A86A] ${errors.payerName ? "border-rose-500" : "border-[#8A9A7E]/30"}`}
                    placeholder="Name on bank / UPI account"
                  />
                  {errors.payerName && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.payerName}</p>}
                </div>

                {/* Date of Payment */}
                <div>
                  <label className="block font-sans text-[9px] uppercase text-[#C9A86A] mb-1 font-semibold">
                    Date of Payment *
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => {
                      setFormData({ ...formData, paymentDate: e.target.value });
                      if (errors.paymentDate) {
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.paymentDate;
                          return next;
                        });
                      }
                    }}
                    className={`w-full border bg-[#2E3B2F] px-3.5 py-2.5 text-xs text-[#EDE6D3] outline-none focus:border-[#C9A86A] ${errors.paymentDate ? "border-rose-500" : "border-[#8A9A7E]/30"}`}
                  />
                  {errors.paymentDate && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.paymentDate}</p>}
                </div>
              </div>

              {/* Screenshot Upload Zone */}
              <div>
                <label className="block font-sans text-[9px] uppercase text-[#C9A86A] mb-1.5 font-semibold">
                  Payment Confirmation Screenshot (JPEG / PNG / PDF) *
                </label>
                <FileUploadZone
                  label="Upload UPI Payment Receipt"
                  sublabel="Attach payment screenshot or provide receipt proof (JPG, PNG, PDF up to 5MB)"
                  fileType="image"
                  maxSizeMB={5}
                  valueUrl={formData.paymentScreenshotUrl}
                  valueName={formData.paymentScreenshotName}
                  onChange={(url, name) => {
                    setFormData({ ...formData, paymentScreenshotUrl: url, paymentScreenshotName: name });
                    if (errors.paymentScreenshotUrl) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.paymentScreenshotUrl;
                        return next;
                      });
                    }
                  }}
                  onClear={() => setFormData({ ...formData, paymentScreenshotUrl: "", paymentScreenshotName: "" })}
                />
                {errors.paymentScreenshotUrl && (
                  <p className="text-[10px] text-rose-400 mt-1.5 font-semibold">{errors.paymentScreenshotUrl}</p>
                )}
              </div>
            </div>

            {/* Official Terms & Conditions Document Box */}
            <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-4 sm:p-5 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 text-[#C9A86A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A86A] block">
                      Official Document
                    </span>
                    <h3 className="font-serif text-sm sm:text-base text-[#EDE6D3] font-bold">
                      First Round Registration Terms &amp; Conditions
                    </h3>
                    <p className="text-[11px] text-[#8A9A7E] leading-relaxed max-w-xl">
                      Please review the official First Round Registration terms, allotment policies, and code of conduct before accepting and submitting your application.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <a
                    href="/First_Round_Registration.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A86A] hover:bg-[#bfa060] text-[#1A1F1A] text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                    id="view-first-round-pdf"
                  >
                    <span>Read Terms (PDF)</span>
                    <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                  </a>
                  <a
                    href="/First_Round_Registration.pdf"
                    download="First_Round_Registration.pdf"
                    title="Download First Round Registration PDF"
                    className="p-2.5 border border-[#8A9A7E]/40 hover:border-[#C9A86A] bg-[#1A1F1A] text-[#EDE6D3] hover:text-[#C9A86A] transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Declaration & Terms Acceptance Checkbox */}
            <div className={`border p-4 transition-all ${errors.agreedToTerms ? "border-rose-500 bg-rose-950/20" : "border-[#C9A86A]/40 bg-[#1A1F1A]"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="firstRoundAgreedToTerms"
                  checked={Boolean(formData.agreedToTerms)}
                  onChange={(e) => {
                    setFormData({ ...formData, agreedToTerms: e.target.checked });
                    if (errors.agreedToTerms) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.agreedToTerms;
                        return next;
                      });
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded-none accent-[#C9A86A] cursor-pointer"
                />
                <span className="text-xs text-[#EDE6D3] leading-relaxed">
                  I have read, understood, and accept the terms and conditions written in{" "}
                  <a
                    href="/First_Round_Registration.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C9A86A] underline hover:text-[#d6b77c] inline-flex items-center gap-0.5 font-semibold"
                  >
                    First_Round_Registration.pdf
                    <ExternalLink className="h-3 w-3 inline ml-0.5" />
                  </a>
                  , and agree to abide by the allotment guidelines, payment verification protocols, and conference code of conduct for IISTMUN 2026.
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="text-[10px] text-rose-400 font-semibold pl-7 mt-1.5">{errors.agreedToTerms}</p>
              )}
            </div>

            {/* Submission Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#C9A86A]/20">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1F1A] border border-[#C9A86A]/40 text-[#EDE6D3] font-sans text-xs uppercase tracking-wider hover:border-[#C9A86A] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A86A] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#bfa060] transition-colors cursor-pointer shadow-lg disabled:opacity-50"
              >
                <CheckSquare className="h-4 w-4" />
                <span>{loading ? "Lodging Registration..." : "Submit First Round Registration (₹1,299)"}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
