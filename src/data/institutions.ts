/**
 * List of prominent Indian Colleges, Universities, Engineering & Science Institutes,
 * Law Schools, and Higher Secondary Schools for MUN & Workshop Registration.
 */

export interface InstitutionCategory {
  category: string;
  items: string[];
}

export const INDIAN_INSTITUTIONS: InstitutionCategory[] = [
  {
    category: "Host & Space Institutes",
    items: [
      "Indian Institute of Space Science and Technology (IIST), Thiruvananthapuram",
      "Indian Institute of Science (IISc), Bengaluru",
      "ISRO Training & Research Units",
      "Indian Institute of Remote Sensing (IIRS), Dehradun",
    ]
  },
  {
    category: "Indian Institutes of Technology (IITs)",
    items: [
      "IIT Bombay",
      "IIT Delhi",
      "IIT Madras",
      "IIT Kharagpur",
      "IIT Kanpur",
      "IIT Roorkee",
      "IIT Guwahati",
      "IIT Hyderabad",
      "IIT (BHU) Varanasi",
      "IIT Indore",
      "IIT Gandhinagar",
      "IIT Ropar",
      "IIT Patna",
      "IIT Bhubaneswar",
      "IIT Mandi",
      "IIT Jodhpur",
      "IIT Tirupati",
      "IIT Palakkad",
      "IIT Goa",
      "IIT Jammu",
      "IIT Dharwad",
      "IIT Bhilai",
      "IIT (ISM) Dhanbad",
    ]
  },
  {
    category: "National Institutes of Technology (NITs) & IIITs",
    items: [
      "NIT Calicut",
      "NIT Tiruchirappalli (NITT)",
      "NIT Surathkal (Karnataka)",
      "NIT Warangal",
      "NIT Rourkela",
      "VNIT Nagpur",
      "MNIT Jaipur",
      "MNNIT Allahabad",
      "NIT Kurukshetra",
      "NIT Durgapur",
      "NIT Silchar",
      "IIIT Hyderabad",
      "IIIT Bangalore",
      "IIIT Delhi",
      "IIIT Allahabad",
      "IIITM Gwalior",
      "IIIT Kancheepuram",
      "IIIT Kottayam",
    ]
  },
  {
    category: "IISERs & Major Research Institutes",
    items: [
      "IISER Thiruvananthapuram",
      "IISER Pune",
      "IISER Kolkata",
      "IISER Mohali",
      "IISER Bhopal",
      "IISER Tirupati",
      "IISER Berhampur",
      "TIFR Mumbai",
      "NISER Bhubaneswar",
      "Raman Research Institute, Bengaluru",
    ]
  },
  {
    category: "Colleges & Universities (South India / Kerala)",
    items: [
      "College of Engineering Trivandrum (CET)",
      "University of Kerala, Thiruvananthapuram",
      "APJ Abdul Kalam Technological University (KTU)",
      "Mahatma Gandhi University, Kottayam",
      "University of Calicut",
      "Government Engineering College Barton Hill, TVM",
      "TKM College of Engineering, Kollam",
      "Mar Athanasius College of Engineering, Kothamangalam",
      "Rajagiri School of Engineering & Technology, Kochi",
      "Model Engineering College, Kochi",
      "Mar Ivanios College, Thiruvananthapuram",
      "St. Teresa's College, Ernakulam",
      "Loyola College, Chennai",
      "Madras Christian College (MCC), Chennai",
      "Stella Maris College, Chennai",
      "Anna University, Chennai",
      "PSG College of Technology, Coimbatore",
      "VIT Vellore",
      "SRM Institute of Science and Technology",
      "Amrita Vishwa Vidyapeetham",
      "SSN College of Engineering, Chennai",
      "Christ University, Bengaluru",
      "St. Joseph's University, Bengaluru",
      "RV College of Engineering (RVCE), Bengaluru",
      "BMS College of Engineering, Bengaluru",
      "Ramaiah Institute of Technology, Bengaluru",
      "PES University, Bengaluru",
      "Manipal Academy of Higher Education (MAHE)",
      "BITS Pilani (Pilani / Goa / Hyderabad)",
      "University of Hyderabad (HCU)",
      "Osmania University, Hyderabad",
    ]
  },
  {
    category: "Colleges & Universities (Pan-India)",
    items: [
      "St. Stephen's College, Delhi University",
      "Shri Ram College of Commerce (SRCC), Delhi",
      "Hindu College, Delhi University",
      "Miranda House, Delhi University",
      "Hansraj College, Delhi University",
      "Lady Shri Ram College (LSR), Delhi",
      "Jawaharlal Nehru University (JNU), New Delhi",
      "Jamia Millia Islamia, New Delhi",
      "Ashoka University, Sonipat",
      "O.P. Jindal Global University, Sonipat",
      "St. Xavier's College, Mumbai",
      "St. Xavier's College, Kolkata",
      "Jadavpur University, Kolkata",
      "Presidency University, Kolkata",
      "Banaras Hindu University (BHU), Varanasi",
      "Aligarh Muslim University (AMU)",
      "Savitribai Phule Pune University",
      "Symbiosis International University, Pune",
      "NMIMS, Mumbai",
      "VJTI, Mumbai",
      "COEP Technological University, Pune",
      "NLSIU Bengaluru / NALSAR Hyderabad / NLU Pan-India",
      "AIIMS New Delhi / AIIMS Pan-India",
    ]
  },
  {
    category: "Schools & Higher Secondary Institutions",
    items: [
      "Kendriya Vidyalaya (KV) - Pan India",
      "Jawahar Navodaya Vidyalaya (JNV) - Pan India",
      "Army Public School (APS) - Pan India",
      "Delhi Public School (DPS) - Pan India",
      "Loyola School, Thiruvananthapuram",
      "St. Thomas Residential School, Thiruvananthapuram",
      "Bharatiya Vidya Bhavan (BVB) - Pan India",
      "DAV Public School - Pan India",
      "Modern School, Barakhamba Road, New Delhi",
      "The Mother's International School, New Delhi",
      "Cathedral & John Connon School, Mumbai",
      "Bombay Scottish School, Mumbai",
      "La Martiniere College / Girls, Lucknow & Kolkata",
      "St. Xavier's Collegiate School, Kolkata",
      "The Doon School, Dehradun",
      "Mayo College, Ajmer",
      "Chinmaya Vidyalaya - Pan India",
      "Sainik School - Pan India",
      "National Public School (NPS), Bengaluru",
      "Saraswati Shishu Mandir - Pan India",
    ]
  }
];

// Flattened list for quick searching
export const ALL_INSTITUTIONS_FLAT: string[] = INDIAN_INSTITUTIONS.flatMap(c => c.items);
