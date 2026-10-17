/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Committee, SecretariatMember, FAQItem, TimelineEvent, CountryMatrixRow } from "./types";

export const COMMITTEES: Committee[] = [
  {
    id: "uncopuos",
    name: "United Nations Committee on the Peaceful Uses of Outer Space",
    abbreviation: "UNCOPOUS",
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
    id: "unga",
    name: "United Nations General Assembly (Online Committee)",
    abbreviation: "UNGA (Online)",
    agenda: "Reviewing global geopolitical stability, reforming multilateral institutions, and preventing weaponization in international commons.",
    description: "The premier deliberative organ of the United Nations conducted entirely online, convening delegates worldwide for sovereign equality debate, global consensus-building, and digital diplomatic multilateralism.",
    logo: "Globe",
    color: "blue",
    eb: [
      { name: "Siddharth Nair", role: "President", avatar: "SN" },
      { name: "Diya Roy", role: "Vice-President", avatar: "DR" }
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
    id: "ip_journalism",
    name: "International Press - Journalism",
    abbreviation: "IP (Journalism)",
    agenda: "Investigative journalism, committee oversight, press conferences, editorial analysis, and daily gazette publications.",
    description: "The dynamic Fourth Estate holding delegates accountable, conducting press conferences, penning incisive investigative features, and publishing daily conference dispatches.",
    logo: "Newspaper",
    color: "rose",
    eb: [
      { name: "Tara Bhattacharya", role: "Editor-in-Chief", avatar: "TB" },
      { name: "Devika Shenoy", role: "Managing Editor", avatar: "DS" }
    ],
    guideUrl: "#"
  },
  {
    id: "ip_photojournalism",
    name: "International Press - Photojournalism",
    abbreviation: "IP (Photojournalism)",
    agenda: "Visual documentation, high-impact photo-essays, debate photography, and press archiving across all simulation chambers.",
    description: "The visual chroniclers of IISTMUN 2026, documenting diplomatic negotiations, heated caucuses, press conferences, and creating the photographic legacy of the summit.",
    logo: "Camera",
    color: "orange",
    eb: [
      { name: "Farhan Siddiqui", role: "Head of Photography", avatar: "FS" },
      { name: "Naveen R.", role: "Lead Photojournalist", avatar: "NR" }
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
  { country: "United States of America", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Russian Federation", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "People's Republic of China", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Kingdom", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of France", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of India", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Available", unsc: "Available" },
  { country: "Japan", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Federal Republic of Germany", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Federative Republic of Brazil", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of South Africa", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Canada", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Commonwealth of Australia", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "State of Israel", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Islamic Republic of Iran", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Democratic People's Rep. of Korea", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Kingdom of Saudi Arabia", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Arab Emirates", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Korea (South)", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Ukraine", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Italy", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Swiss Confederation", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Singapore", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Kingdom of Sweden", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "United Mexican States", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Indonesia", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Arab Republic of Egypt", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  { country: "Republic of Türkiye", uncopuos: "Available", unga: "Available", unhrc: "Available", unodc: "Available", nes75: "Reserved", undp: "Available", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Available", disec: "Available", aippm: "Reserved", unsc: "Available" },
  // NES'75 (National Emergency Summit 1975) Key Historical Portfolios
  { country: "Indira Gandhi (Prime Minister)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Jayaprakash Narayan (Loknayak)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Morarji Desai (Opposition Leader)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Jagjivan Ram (Union Minister)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Fakhruddin Ali Ahmed (President of India)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Siddhartha Shankar Ray (CM West Bengal)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "George Fernandes (Trade Union Leader)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Atal Bihari Vajpayee (BJS)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Lal Krishna Advani (BJS)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  { country: "Charan Singh (Bharatiya Lok Dal)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Available", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Reserved", ip: "Reserved", copuos: "Reserved", disec: "Reserved", aippm: "Available", unsc: "Reserved" },
  // IP (Journalism) Specialized Portfolios
  { country: "Reuters (Investigative Bureau)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Available", ip_photojournalism: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "BBC World Service (Chief Correspondent)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Available", ip_photojournalism: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "The Hindu (Diplomatic Editor)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Available", ip_photojournalism: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "Al Jazeera (Crisis Bureau)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Available", ip_photojournalism: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "The Indian Express (Political Editor)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Available", ip_photojournalism: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "Agence France-Presse (Chief Reporter)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Available", ip_photojournalism: "Reserved", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  // IP (Photojournalism) Specialized Portfolios
  { country: "Associated Press (Photojournalist)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Available", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "Magnum Photos (Lead Photo Essayist)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Available", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "National Geographic (Staff Photographer)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Available", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" },
  { country: "Getty Images (Documentary Photojournalist)", uncopuos: "Reserved", unga: "Reserved", unhrc: "Reserved", unodc: "Reserved", nes75: "Reserved", undp: "Reserved", ip_journalism: "Reserved", ip_photojournalism: "Available", ip: "Available", copuos: "Reserved", disec: "Reserved", aippm: "Reserved", unsc: "Reserved" }
];
