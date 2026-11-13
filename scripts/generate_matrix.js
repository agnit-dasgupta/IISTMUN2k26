import * as fs from 'fs';
import * as path from 'path';

const unhrcRaw = [
  'Russia', 'Ukraine', 'United States of America', 'Israel', 'Palestine', 'China', 'India', 'Pakistan', 'Iran', 'Syria',
  'Sudan', 'Democratic Republic of the Congo', 'Myanmar', 'United Kingdom', 'France', 'Türkiye', 'Saudi Arabia', 'Qatar',
  'Egypt', 'United Arab Emirates', 'Ethiopia', 'Somalia', 'Yemen', 'Afghanistan', 'Iraq', 'South Africa', 'Brazil',
  'Germany', 'Japan', 'Switzerland', 'Indonesia', 'South Korea', 'Mexico', 'Colombia', 'South Sudan', 'Kenya',
  'Nigeria', 'Norway', 'Netherlands', 'Ireland', 'Canada', 'Australia', 'Bangladesh', 'Nepal', 'Ghana', 'Malaysia',
  'Chile', 'New Zealand', 'Costa Rica', 'Argentina'
];

const undpRaw = [
  'Armenia', 'Bangladesh', 'Bolivia', 'Brazil', 'Chad', 'China', "Côte d'Ivoire", 'Cuba', 'Denmark', 'Dominican Republic',
  'Estonia', 'Finland', 'Georgia', 'Germany', 'India', 'Jamaica', 'Japan', 'Madagascar', 'Monaco', 'Mozambique',
  'Nauru', 'Nepal', 'New Zealand', 'Nigeria', 'Norway', 'Romania', 'Rwanda', 'Solomon Islands', 'Sweden', 'Switzerland',
  'Tajikistan', 'Tunisia', 'Türkiye', 'United Kingdom', 'United States of America', 'Zambia', 'Afghanistan', 'Australia',
  'Canada', 'Democratic Republic of the Congo', 'Egypt', 'Ethiopia', 'France', 'Indonesia', 'Iran', 'Iraq', 'Israel',
  'Kenya', 'Lebanon', 'Pakistan', 'Qatar', 'Republic of Korea', 'Russian Federation', 'South Africa', 'State of Palestine',
  'Sudan', 'Syrian Arab Republic', 'Ukraine', 'United Arab Emirates', 'Yemen'
];

const unodcRaw = [
  'USA', 'UK', 'France', 'Russia', 'China', 'India', 'Pakistan', 'Myanmar', 'Afghanistan', 'Phillipines',
  'Indonesia', 'South Korea', 'Colombia', 'Brazil', 'Norawy', 'Denmark', 'Germany', 'Spain', 'Cambodia', 'Thailand',
  'Ecuador', 'Nigeria', 'Tanzania', 'Iran', 'Sri Lanka', 'Ghana', 'Cameroon', 'Guinea-Bissau', 'Senegal', 'Kenya',
  'Maldives', 'Mexico', 'Australia', 'Bangladesh', 'Portugal', 'Mauritius', 'Mozambique', 'Somalia', 'Japan', 'Vietnam'
];

const uncopuosRaw = [
  'Albania', 'Algeria', 'Angola', 'Argentina', 'Algeria', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahrain',
  'Bangladesh', 'Belarus', 'Belgium', 'Benin', 'Bolivia (Plurinational State of)', 'Brazil', 'Bulgaria', 'Burkina Faso',
  'Cameroon', 'Canada', 'Chad', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Côte d’Ivoire', 'Cuba', 'Cyprus',
  'Czechia', 'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Ethiopia', 'Finland',
  'France', 'The Gambia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Honduras', 'Hungary', 'India', 'Indonesia',
  'Iran (Islamic Republic of)', 'Iraq', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Latvia', 'Lebanon', 'Libya', 'Luxembourg', 'Malaysia', 'Maldives', 'Malta', 'Mauritius', 'Mexico', 'Mongolia',
  'Morocco', 'Netherlands (Kingdom of the)', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Norway', 'Oman',
  'Pakistan', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Republic of Korea',
  'Romania', 'Russian Federation', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'South Africa', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syrian Arab Republic',
  'Thailand', 'Tunisia', 'Türkiye', 'Ukraine', 'United Arab Emirates', 'United Kingdom of Great Britain and Northern Ireland',
  'United States of America', 'Uruguay', 'Uzbekistan', 'Venezuela (Bolivarian Republic of)', 'Viet Nam', 'Zimbabwe'
];

const nes75HighPriority = [
  'Indira Gandhi – Prime Minister of India',
  'Sanjay Gandhi – Influential Political Figure and Youth Congress Leader',
  'Siddhartha Shankar Ray – Chief Minister of West Bengal and Legal Adviser to Indira Gandhi',
  'Bansi Lal – Chief Minister of Haryana',
  'Om Mehta – Minister of State for Home Affairs',
  'R. K. Dhawan – Principal Private Secretary to the Prime Minister',
  'D. K. Barooah – President of the Indian National Congress',
  'Y. B. Chavan – Minister of External Affairs',
  'K. Brahmananda Reddy – Union Home Minister',
  'Jagjivan Ram – Defence Minister',
  'H. R. Gokhale – Union Law Minister',
  'V. C. Shukla – Minister of Information and Broadcasting',
  'P. N. Dhar – Principal Secretary to the Prime Minister',
  'Jayaprakash Narayan – Leader of the JP Movement',
  'Morarji Desai – Senior Opposition Leader',
  'Charan Singh – Bharatiya Lok Dal Leader',
  'Atal Bihari Vajpayee – Bharatiya Jana Sangh Leader',
  'L. K. Advani – Bharatiya Jana Sangh Leader',
  'George Fernandes – Socialist Leader and Labour Organiser',
  'Raj Narain – Socialist Leader and Petitioner in the Election Case Against Indira Gandhi',
  'Madhu Limaye – Socialist Opposition Leader',
  'K Kamaraj – Congress Dissident Opposed to the Emergency',
  'Nanaji Deshmukh – Jana Sangh Leader and Opposition Organiser',
  'Subramanian Swamy – Opposition Politician',
  'Karpuri Thakur – Socialist Leader from Bihar',
  'Madhu Dandavate – Socialist Leader and Opposition Parliamentarian',
  'M. Karunanidhi – Chief Minister of Tamil Nadu',
  'C. Achutha Menon – Chief Minister of Kerala',
  'E. M. S. Namboodiripad – Leader of the Opposition in the Kerala Legislative Assembly',
  'Jyoti Basu – CPI(M) Leader from West Bengal',
  'M. G. Ramachandran – AIADMK Founder and Tamil Nadu Political Leader',
  'Jagmohanlal Sinha – Allahabad High Court Judge Who Ruled Against Indira Gandhi’s Election',
  'Niren De – Attorney General of India',
  'K. Karunakaran – Senior Congress Leader and Home Minister from Kerala',
  'Kuldip Nayar – Journalist and Critic of the Emergency'
];

const nes75LowPriority = [
  'Rukhsana Sultana – Associate of Sanjay Gandhi',
  'Chandra Sekhar - Congress Dissident who opposed emergency',
  'Navin Chawla – Civil Servant Associated with Delhi Administration',
  'Khushwant Singh – Writer and Journalist',
  'Bal Thackeray – Founder of Shiv Sena',
  'Lalu Prasad Yadav – Student Activist Associated with the Bihar Movement',
  'Hemvati Nandan Bahuguna – Senior Congress Leader Who Later Opposed Indira Gandhi',
  'Sheikh Abdullah – Chief Minister of Jammu and Kashmir',
  'Babubhai J. Patel – Gujarat Opposition Leader and Later Chief Minister',
  'S. Nijalingappa – Senior Congress Leader Associated with the Congress Split',
  'Parkash Singh Badal – Akali Dal Leader from Punjab',
  'Harkishan Singh Surjeet – Senior CPI(M) Leader and Opposition Organiser',
  'Ramnath Goenka - Owner of Indian Express',
  'Swaran Singh – Senior Union Cabinet Minister',
  'Lalu Prasad Yadav’s Bihar Student Movement Colleague – Student Representative of the JP Movement'
];

const canonicalMap = {
  'USA': 'United States of America',
  'United States of America': 'United States of America',
  'UK': 'United Kingdom',
  'United Kingdom': 'United Kingdom',
  'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom',
  'Russia': 'Russian Federation',
  'Russian Federation': 'Russian Federation',
  'South Korea': 'Republic of Korea',
  'Republic of Korea': 'Republic of Korea',
  'Palestine': 'State of Palestine',
  'State of Palestine': 'State of Palestine',
  'Iran': 'Iran (Islamic Republic of)',
  'Iran (Islamic Republic of)': 'Iran (Islamic Republic of)',
  'Syria': 'Syrian Arab Republic',
  'Syrian Arab Republic': 'Syrian Arab Republic',
  'Bolivia': 'Bolivia (Plurinational State of)',
  'Bolivia (Plurinational State of)': 'Bolivia (Plurinational State of)',
  "Côte d'Ivoire": "Côte d'Ivoire",
  'Côte d’Ivoire': "Côte d'Ivoire",
  'Phillipines': 'Philippines',
  'Philippines': 'Philippines',
  'Norawy': 'Norway',
  'Norway': 'Norway',
  'Vietnam': 'Viet Nam',
  'Viet Nam': 'Viet Nam',
  'Netherlands': 'Netherlands',
  'Netherlands (Kingdom of the)': 'Netherlands',
  'Venezuela (Bolivarian Republic of)': 'Venezuela (Bolivarian Republic of)',
  'Tanzania': 'United Republic of Tanzania',
};

const resolve = (name) => canonicalMap[name.trim()] || name.trim();

// Collect all sovereign nations
const countryMap = new Map();

function registerCountry(name) {
  const cName = resolve(name);
  if (!countryMap.has(cName)) {
    countryMap.set(cName, {
      country: cName,
      uncopuos: 'N/A',
      unga: 'Available',
      unhrc: 'N/A',
      unodc: 'N/A',
      nes75: 'N/A',
      undp: 'N/A',
      ip_journalism: 'N/A',
      ip_photojournalism: 'N/A',
      ip: 'N/A',
      copuos: 'N/A',
      disec: 'N/A',
      aippm: 'N/A',
      unsc: 'N/A'
    });
  }
  return cName;
}

// 1. UNCOPUOS
const uncopuosSet = new Set();
for (const raw of uncopuosRaw) {
  const cName = registerCountry(raw);
  countryMap.get(cName).uncopuos = 'Available';
  countryMap.get(cName).copuos = 'Available';
  uncopuosSet.add(cName);
}

// 2. UNHRC
const unhrcSet = new Set();
for (const raw of unhrcRaw) {
  const cName = registerCountry(raw);
  countryMap.get(cName).unhrc = 'Available';
  unhrcSet.add(cName);
}

// 3. UNDP
const undpSet = new Set();
for (const raw of undpRaw) {
  const cName = registerCountry(raw);
  countryMap.get(cName).undp = 'Available';
  undpSet.add(cName);
}

// 4. UNODC
const unodcSet = new Set();
for (const raw of unodcRaw) {
  const cName = registerCountry(raw);
  countryMap.get(cName).unodc = 'Available';
  unodcSet.add(cName);
}

console.log('Unique sovereign nations:', countryMap.size);
console.log('UNCOPUOS set size:', uncopuosSet.size);
console.log('UNHRC set size:', unhrcSet.size);
console.log('UNDP set size:', undpSet.size);
console.log('UNODC set size:', unodcSet.size);

// Sort country rows alphabetically
const sortedSovereignRows = Array.from(countryMap.values()).sort((a, b) => a.country.localeCompare(b.country));

// 5. NES'75 Portfolios (35 High-Priority + 15 Low-Priority = 50 total)
const nes75Rows = [];
const nes75List = [...nes75HighPriority, ...nes75LowPriority];

nes75List.forEach((leader) => {
  nes75Rows.push({
    country: leader,
    uncopuos: 'N/A',
    unga: 'N/A',
    unhrc: 'N/A',
    unodc: 'N/A',
    nes75: 'Available',
    undp: 'N/A',
    ip_journalism: 'N/A',
    ip_photojournalism: 'N/A',
    ip: 'N/A',
    copuos: 'N/A',
    disec: 'N/A',
    aippm: 'Available', // legacy compatibility
    unsc: 'N/A'
  });
});

console.log('NES75 rows:', nes75Rows.length);

const masterMatrix = [...sortedSovereignRows, ...nes75Rows];
console.log('Master matrix total rows:', masterMatrix.length);

// Save to data/local_country_matrix.json
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(dataDir, 'local_country_matrix.json'),
  JSON.stringify(masterMatrix, null, 2),
  'utf-8'
);
console.log('Saved data/local_country_matrix.json');

// Also save committee portfolios breakdown for easy reference and API
const committeePortfolios = {
  unhrc: Array.from(unhrcSet).sort(),
  undp: Array.from(undpSet).sort(),
  nes75: {
    total: 50,
    highPriority: nes75HighPriority,
    lowPriority: nes75LowPriority,
    all: nes75List
  },
  unodc: Array.from(unodcSet).sort(),
  uncopuos: Array.from(uncopuosSet).sort(),
  ip_journalism: [],
  ip_photojournalism: [],
  unga: sortedSovereignRows.map(r => r.country)
};

fs.writeFileSync(
  path.join(dataDir, 'local_committees.json'),
  JSON.stringify(committeePortfolios, null, 2),
  'utf-8'
);
console.log('Saved data/local_committees.json');

