/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Committee, SecretariatMember, FAQItem, TimelineEvent, CountryMatrixRow } from "./types";

export const COMMITTEES: Committee[] = [
  {
    id: "copuos",
    name: "Committee on the Peaceful Uses of Outer Space",
    abbreviation: "COPUOS",
    agenda: "Developing International Legal Frameworks for Space Mining Rights, Lunar Settlements, and Orbital Debris Mitigation.",
    description: "As the flagship committee of India's premier Space Science Institute, COPUOS focuses on balancing commercial space exploration interests with planetary protection and environmental sustainability of near-Earth orbits.",
    logo: "Orbit",
    color: "cyan",
    eb: [
      { name: "Dr. Aditya Sen", role: "Chairperson", avatar: "AS" },
      { name: "Meera Krishnan", role: "Co-Chairperson", avatar: "MK" }
    ],
    guideUrl: "#"
  },
  {
    id: "disec",
    name: "Disarmament and International Security Committee",
    abbreviation: "UNGA DISEC",
    agenda: "Preventing an Arms Race in Outer Space (PAROS) and Mitigating State-Sponsored Cyber Warfare on Satellite Communications.",
    description: "DISEC addresses international security and weapons threats. Delegates will draft frameworks to halt militarization of orbits and protect global satellite communication lines from cyber attacks.",
    logo: "ShieldAlert",
    color: "purple",
    eb: [
      { name: "Rohan Kapoor", role: "President", avatar: "RK" },
      { name: "Sanya Joseph", role: "Vice-President", avatar: "SJ" }
    ],
    guideUrl: "#"
  },
  {
    id: "aippm",
    name: "All India Political Parties Meet",
    abbreviation: "AIPPM",
    agenda: "Reviewing India's New Space Privatization Policy, FDI in Aerospace, and Enhancing National Defense Space Infrastructure.",
    description: "A forum simulating vibrant Indian democratic discourse. Leaders will debate the implications of transferring ISRO technologies to private startups, establishing national space command wings, and regulatory challenges.",
    logo: "Users",
    color: "amber",
    eb: [
      { name: "Kunal Deshmukh", role: "Moderator", avatar: "KD" },
      { name: "Anjali Menon", role: "Deputy Moderator", avatar: "AM" }
    ],
    guideUrl: "#"
  },
  {
    id: "unsc",
    name: "United Nations Security Council",
    abbreviation: "UNSC",
    agenda: "Securing Space Assets during Global Armed Conflicts and Establishing Crisis Response Frameworks for Orbital Crises.",
    description: "The primary organ for maintaining international peace and security. Featuring interactive freeze crises and real-time security alerts regarding anti-satellite missile tests and territorial threats.",
    logo: "Globe",
    color: "emerald",
    eb: [
      { name: "Siddharth Nair", role: "President", avatar: "SN" },
      { name: "Diya Roy", role: "Vice-President", avatar: "DR" }
    ],
    guideUrl: "#"
  }
];

export const SECRETARIAT: SecretariatMember[] = [
  {
    id: "sec-gen",
    name: "Niranjan Patil",
    designation: "Secretary-General",
    bio: "Senior aerospace engineering scholar at IIST with extensive national MUN credentials. Leading academic chambers, strategic space law directives, and bilateral diplomacy for IISTMUN 2027.",
    email: "support@iistmun.org"
  },
  {
    id: "dir-gen",
    name: "Ananya Bhat",
    designation: "Deputy Secretary General",
    bio: "Aerospace engineering scholar with a passion for international relations and diplomacy. Committed to ensuring that IISTMUN 2027 provides a platform for meaningful dialogue and collaboration among future leaders.",
    email: "support@iistmun.org"
  },
  {
    id: "usg-delegate",
    name: "Parth Ray",
    designation: "Director General",
    bio: "Pursuing Dual Degree in Astronomy & Earth System Sciences. Manages delegate onboarding, committee administration, Executive Board selection protocols, and country allocations.",
    email: "support@iistmun.org"
  },
  {
    id: "usg-website",
    name: "Agnit Dasgupta",
    designation: "USG Website",
    bio: "Physics major and investigative editorialist. Directs the international press corps, committee dispatch journalism, satirical daily gazettes, and photography documentation.",
    email: "support@iistmun.org"
  }
];

export const SCHEDULE: { day1: TimelineEvent[]; day2: TimelineEvent[]; day3: TimelineEvent[] } = {
  day1: [
    { time: "08:30 AM - 10:00 AM", title: "Registration & Kit Distribution", description: "Collect your delegate kits, placards, and ID badges at the main IIST foyer.", location: "IIST Main Entrance Foyer", category: "other" },
    { time: "10:30 AM - 12:00 PM", title: "Opening Ceremony", description: "Keynote speeches by prominent ISRO scientists, directors, and the Secretary-General on Save · Sustain · Safeguard directives.", location: "D3 Seminar Hall / Main Auditorium", category: "ceremony" },
    { time: "12:00 PM - 01:30 PM", title: "Lunch Break", description: "Networking lunch for delegates, executive board, and organizing committee.", location: "Central Dining Hall", category: "other" },
    { time: "01:30 PM - 05:00 PM", title: "Committee Session I", description: "Establishment of agenda, roll-call, and initiation of General Speakers List (GSL).", location: "Respective Committee Halls", category: "session" },
    { time: "05:30 PM - 07:00 PM", title: "High Tea & Campus Tour", description: "Guided tour of IIST's state-of-the-art space labs, observatory dome, and research centers.", location: "IIST Campus Grounds", category: "other" }
  ],
  day2: [
    { time: "09:00 AM - 11:30 AM", title: "Committee Session II", description: "Debate intensifies with moderated caucuses focusing on core agenda directives.", location: "Respective Committee Halls", category: "session" },
    { time: "11:30 AM - 12:00 PM", title: "Networking & Coffee Break", description: "Informal drafting collaborations in the lobbies.", location: "Respective Committee Foyers", category: "other" },
    { time: "12:00 PM - 01:30 PM", title: "Committee Session III", description: "Introduction of working papers and crisis developments for UNSC/COPUOS.", location: "Respective Committee Halls", category: "session" },
    { time: "01:30 PM - 02:30 PM", title: "Lunch Break", description: "Fueling up for a high-intensity afternoon.", location: "Central Dining Hall", category: "other" },
    { time: "02:30 PM - 05:30 PM", title: "Committee Session IV", description: "Merging working papers into draft resolutions and voting on amendments.", location: "Respective Committee Halls", category: "session" },
    { time: "07:00 PM - 09:30 PM", title: "IIST Delegate Socials & Star Gazing", description: "A starry night featuring acoustic music, dinner, and astronomical star gazing through the IIST observatory telescope.", location: "IIST Observatory Lawn", category: "social" }
  ],
  day3: [
    { time: "09:00 AM - 11:30 AM", title: "Committee Session V", description: "Final resolution readings, defense, and crucial voting blocks.", location: "Respective Committee Halls", category: "session" },
    { time: "11:30 AM - 01:00 PM", title: "Feedback Session & Commendations", description: "Executive Board reviews, personal delegate feedback, and signing off journals.", location: "Respective Committee Halls", category: "session" },
    { time: "01:00 PM - 02:00 PM", title: "Lunch Break", description: "Closing network discussions over lunch.", location: "Central Dining Hall", category: "other" },
    { time: "02:30 PM - 04:30 PM", title: "Valedictory Ceremony & Prize Distribution", description: "Awarding Best Delegate, High Commendation, Special Mention, and Best Delegation trophies.", location: "Main Auditorium", category: "ceremony" }
  ]
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Where is the IIST MUN conference hosted?",
    answer: "The conference is hosted on-campus at the Indian Institute of Space Science and Technology (IIST), located in Valiamala, Thiruvananthapuram, Kerala - 695547.",
    category: "general"
  },
  {
    question: "Who is eligible to participate?",
    answer: "Any student currently enrolled in an undergraduate, postgraduate, or doctoral program at a recognized university/college, or secondary school students in classes 9 to 12 can register as delegates.",
    category: "general"
  },
  {
    question: "How does the country matrix allocation work?",
    answer: "Portfolios (countries/leaders) are allocated based on your MUN experience, preferences filled in the registration form, and the date of registration. Early registrations get higher preference for top portfolios.",
    category: "registration"
  },
  {
    question: "Is accommodation available for outstation delegates?",
    answer: "Yes, fully furnished student hostel sharing accommodation is available on-campus for all registered outstation delegates. You can opt for accommodation during the registration step. Affordable meals are also served in our dining facilities.",
    category: "registration"
  },
  {
    question: "What is the study guide policy?",
    answer: "Detailed study guides drafted by our seasoned Executive Boards will be sent to all registered delegates via email, and will be downloadable on the website 3 weeks prior to the conference.",
    category: "committees"
  },
  {
    question: "What makes IIST MUN unique?",
    answer: "IIST MUN is one of the only Model UN conferences hosted inside an institute sponsored by ISRO (Indian Space Research Organisation). Our space-related committees (like COPUOS) feature specialized scientific and technical counsel, stargazing socials at the observatory, and tours of world-class space technology laboratories.",
    category: "general"
  }
];

export const COUNTRY_MATRIX: CountryMatrixRow[] = [
  { country: "United States of America", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Russian Federation", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "People's Republic of China", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Kingdom", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of France", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of India", copuos: "Available", disec: "Available", aippm: "Available", unsc: "Available" },
  { country: "Japan", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Federal Republic of Germany", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Federative Republic of Brazil", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of South Africa", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Canada", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Commonwealth of Australia", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "State of Israel", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Islamic Republic of Iran", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Democratic People's Rep. of Korea", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Kingdom of Saudi Arabia", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Arab Emirates", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Korea (South)", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Ukraine", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Italy", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Swiss Confederation", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Singapore", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Kingdom of Sweden", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Mexican States", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Indonesia", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Narendra Modi (AIPPM only)", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Rahul Gandhi (AIPPM only)", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Amit Shah (AIPPM only)", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "S. Jaishankar (AIPPM only)", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Mamata Banerjee (AIPPM only)", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Arvind Kejriwal (AIPPM only)", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" }
];
