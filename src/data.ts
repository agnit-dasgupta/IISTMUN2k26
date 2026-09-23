/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Committee, SecretariatMember, FAQItem, TimelineEvent, CountryMatrixRow } from "./types";

export const COMMITTEES: Committee[] = [
  {
    id: "uncopuos",
    name: "United Nations Committee on the Peaceful Uses of Outer Space",
    abbreviation: "UNCOPUOS",
    agenda: "Developing multilateral legal frameworks for lunar governance, planetary protection, and active space debris remediation.",
    description: "Serves as the principal international forum for the peaceful governance of space exploration, orbital sustainability, and space resource utilization.",
    logo: "Orbit",
    color: "cyan",
    eb: [
      { name: "Dr. Aditya Sen", role: "Chairperson", avatar: "AS" },
      { name: "Meera Krishnan", role: "Co-Chairperson", avatar: "MK" }
    ],
    guideUrl: "#"
  },
  {
    id: "unhrc",
    name: "United Nations Human Rights Council",
    abbreviation: "UNHRC",
    agenda: "Safeguarding civilian human rights in conflict zones and addressing digital surveillance and AI-driven civil liberty violations.",
    description: "Promotes and protects universal human rights, monitors humanitarian crises, and formulates binding resolutions on civil liberties and migrant protections.",
    logo: "Users",
    color: "purple",
    eb: [
      { name: "Rohan Kapoor", role: "President", avatar: "RK" },
      { name: "Sanya Joseph", role: "Vice-President", avatar: "SJ" }
    ],
    guideUrl: "#"
  },
  {
    id: "unodc",
    name: "United Nations Office on Drugs and Crime",
    abbreviation: "UNODC",
    agenda: "Combating transnational maritime trafficking networks, synthetic drug proliferation, and cyber-enabled financial cartels.",
    description: "Leads global efforts against illicit narcotics, organized criminal syndicates, corruption, and illicit trafficking corridors across borders.",
    logo: "ShieldAlert",
    color: "amber",
    eb: [
      { name: "Vikramaditya Nair", role: "Executive Director", avatar: "VN" },
      { name: "Kritika Chawla", role: "Deputy Director", avatar: "KC" }
    ],
    guideUrl: "#"
  },
  {
    id: "nes75",
    name: "National Emergency Summit 1975",
    abbreviation: "NES'75",
    agenda: "Crisis deliberations on constitutional overreach, national security preservation, civil liberties suspension, and the internal emergency proclamation of 1975.",
    description: "A historic and high-stakes crisis simulation reconstructing the political tremors, cabinet secret meetings, and parliamentary debates of India during the 1975 Emergency.",
    logo: "Landmark",
    color: "emerald",
    eb: [
      { name: "Kunal Deshmukh", role: "Moderator", avatar: "KD" },
      { name: "Anjali Menon", role: "Deputy Moderator", avatar: "AM" }
    ],
    guideUrl: "#"
  },
  {
    id: "unga",
    name: "United Nations General Assembly",
    abbreviation: "UNGA",
    agenda: "Reviewing global geopolitical stability, reforming multilateral institutions, and preventing weaponization in international commons.",
    description: "The premier deliberative organ of the United Nations, bringing together all member states for sovereign equality debate and multilateral treaty formation.",
    logo: "Globe",
    color: "blue",
    eb: [
      { name: "Siddharth Nair", role: "President", avatar: "SN" },
      { name: "Diya Roy", role: "Vice-President", avatar: "DR" }
    ],
    guideUrl: "#"
  },
  {
    id: "undp",
    name: "United Nations Development Programme",
    abbreviation: "UNDP",
    agenda: "Accelerating climate-resilient sustainable development and closing the green finance deficit in the Global South.",
    description: "Drives global development, eradicating poverty, building inclusive economic institutions, and financing resilient infrastructure worldwide.",
    logo: "Leaf",
    color: "teal",
    eb: [
      { name: "Arjun Nambiar", role: "Administrator", avatar: "AN" },
      { name: "Priya Varma", role: "Assistant Administrator", avatar: "PV" }
    ],
    guideUrl: "#"
  },
  {
    id: "ip",
    name: "International Press",
    abbreviation: "IP",
    agenda: "Investigative journalism, committee oversight, press conferences, editorial analysis, and photojournalism across all simulation councils.",
    description: "The dynamic Fourth Estate of IISTMUN 2026, interrogating delegates, publishing daily conference gazettes, and capturing live photo-essays.",
    logo: "Newspaper",
    color: "rose",
    eb: [
      { name: "Tara Bhattacharya", role: "Editor-in-Chief", avatar: "TB" },
      { name: "Farhan Siddiqui", role: "Head of Photography", avatar: "FS" }
    ],
    guideUrl: "#"
  }
];


export const SECRETARIAT: SecretariatMember[] = [
  {
    id: "sec-gen",
    name: "Niranjan Patil",
    designation: "Secretary-General",
    bio: "Senior aerospace scholar at IIST leading academic chambers and bilateral diplomacy for IISTMUN 2027.",
    email: "support@iistmun.org"
  },
  {
    id: "dir-gen",
    name: "Ananya Bhat",
    designation: "Deputy Secretary General",
    bio: "Aerospace engineering scholar overseeing operations and international delegate collaboration.",
    email: "support@iistmun.org"
  },
  {
    id: "usg-delegate",
    name: "Parth Ray",
    designation: "Director General",
    bio: "Dual Degree Astronomy scholar managing delegate onboarding and committee administration.",
    email: "support@iistmun.org"
  },
  {
    id: "usg-website",
    name: "Agnit Dasgupta",
    designation: "USG Website",
    bio: "Aerospace scholar directing website architecture and technical operations.",
    email: "support@iistmun.org"
  }
];

export const SCHEDULE: { day1: TimelineEvent[]; day2: TimelineEvent[]; day3: TimelineEvent[] } = {
  day1: [
    { time: "08:30 AM - 10:00 AM", title: "Registration & Kit Distribution", description: "Collect delegate kits, placards, and ID badges at the main foyer.", location: "IIST Main Entrance Foyer", category: "other" },
    { time: "10:30 AM - 12:00 PM", title: "Opening Ceremony", description: "Keynote addresses by ISRO scientists, institute leadership, and the Secretary-General.", location: "D3 Seminar Hall / Main Auditorium", category: "ceremony" },
    { time: "12:00 PM - 01:30 PM", title: "Lunch Break", description: "Networking lunch at the Central Dining Hall.", location: "Central Dining Hall", category: "other" },
    { time: "01:30 PM - 05:00 PM", title: "Committee Session I", description: "Roll call, agenda adoption, and General Speakers List (GSL).", location: "Respective Committee Halls", category: "session" },
    { time: "05:30 PM - 07:00 PM", title: "High Tea & Campus Tour", description: "Guided tour of IIST space laboratories and observatory dome.", location: "IIST Campus Grounds", category: "other" }
  ],
  day2: [
    { time: "09:00 AM - 11:30 AM", title: "Committee Session II", description: "Moderated caucuses on core agenda directives.", location: "Respective Committee Halls", category: "session" },
    { time: "11:30 AM - 12:00 PM", title: "Networking & Coffee Break", description: "Informal drafting consultations in foyers.", location: "Respective Committee Foyers", category: "other" },
    { time: "12:00 PM - 01:30 PM", title: "Committee Session III", description: "Introduction of working papers and crisis developments.", location: "Respective Committee Halls", category: "session" },
    { time: "01:30 PM - 02:30 PM", title: "Lunch Break", description: "Lunch break at Central Dining Hall.", location: "Central Dining Hall", category: "other" },
    { time: "02:30 PM - 05:30 PM", title: "Committee Session IV", description: "Consolidating working papers into draft resolutions and amendment voting.", location: "Respective Committee Halls", category: "session" },
    { time: "07:00 PM - 09:30 PM", title: "IIST Delegate Socials & Star Gazing", description: "Dinner, live music, and astronomical stargazing through the IIST observatory telescope.", location: "IIST Observatory Lawn", category: "social" }
  ],
  day3: [
    { time: "09:00 AM - 11:30 AM", title: "Committee Session V", description: "Final resolution presentation, defense, and voting blocks.", location: "Respective Committee Halls", category: "session" },
    { time: "11:30 AM - 01:00 PM", title: "Feedback Session & Commendations", description: "Executive Board reviews and individual delegate feedback.", location: "Respective Committee Halls", category: "session" },
    { time: "01:00 PM - 02:00 PM", title: "Lunch Break", description: "Farewell lunch at Central Dining Hall.", location: "Central Dining Hall", category: "other" },
    { time: "02:30 PM - 04:30 PM", title: "Valedictory Ceremony & Prize Distribution", description: "Awarding Best Delegate, High Commendation, and Best Delegation trophies.", location: "Main Auditorium", category: "ceremony" }
  ]
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Where is the IIST MUN conference hosted?",
    answer: "On-campus at the Indian Institute of Space Science and Technology (IIST), Valiamala, Thiruvananthapuram, Kerala (695547).",
    category: "general"
  },
  {
    question: "Who is eligible to participate?",
    answer: "Undergraduate, postgraduate, and doctoral university students, as well as secondary school students in classes 9 to 12.",
    category: "general"
  },
  {
    question: "How does country allocation work?",
    answer: "Portfolios are assigned based on prior MUN experience, submitted preferences, and application date. Early registrations get priority.",
    category: "registration"
  },
  {
    question: "Is accommodation available for outstation delegates?",
    answer: "Yes. Furnished hostel accommodation and dining are available on-campus for all registered outstation delegates.",
    category: "registration"
  },
  {
    question: "What is the study guide policy?",
    answer: "Comprehensive background guides prepared by the Executive Board will be emailed to registered delegates and downloadable on the website 3 weeks prior.",
    category: "committees"
  },
  {
    question: "What makes IIST MUN unique?",
    answer: "Hosted at Asia's premier space institute, featuring space-focused committees, scientific mentorship, observatory stargazing, and space lab tours.",
    category: "general"
  }
];

export const COUNTRY_MATRIX: CountryMatrixRow[] = [
  { country: "United States of America", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Russian Federation", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "People's Republic of China", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Kingdom", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of France", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of India", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Available", unsc: "Available" },
  { country: "Japan", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Federal Republic of Germany", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Federative Republic of Brazil", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of South Africa", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Canada", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Commonwealth of Australia", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "State of Israel", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Islamic Republic of Iran", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Democratic People's Rep. of Korea", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Kingdom of Saudi Arabia", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Arab Emirates", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Korea (South)", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Ukraine", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Italy", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Swiss Confederation", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Singapore", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Kingdom of Sweden", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Mexican States", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Indonesia", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Arab Republic of Egypt", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Türkiye", uncopuos: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", unga: "Available", undp: "Available", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  // NES'75 (National Emergency Summit 1975) Key Historical Portfolios
  { country: "Indira Gandhi (Prime Minister)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Jayaprakash Narayan (Loknayak)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Morarji Desai (Opposition Leader)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Jagjivan Ram (Union Minister)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Fakhruddin Ali Ahmed (President of India)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Siddhartha Shankar Ray (CM West Bengal)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "George Fernandes (Trade Union Leader)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Atal Bihari Vajpayee (BJS)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Lal Krishna Advani (BJS)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Charan Singh (Bharatiya Lok Dal)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", unga: "Reserved", undp: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  // IP (International Press) Specialized Portfolios
  { country: "Reuters (Investigative Bureau)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", unga: "Reserved", undp: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "BBC World Service (Chief Correspondent)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", unga: "Reserved", undp: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "The Hindu (Diplomatic Editor)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", unga: "Reserved", undp: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "Al Jazeera (Crisis Bureau)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", unga: "Reserved", undp: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "The Indian Express (Political Editor)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", unga: "Reserved", undp: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "Associated Press (Photojournalist)", uncopuos: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", unga: "Reserved", undp: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" }
];
