/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Firestore, 
  doc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch,
  deleteDoc
} from "firebase/firestore";
import { 
  COMMITTEES, 
  SECRETARIAT, 
  SCHEDULE, 
  FAQ_ITEMS, 
  COUNTRY_MATRIX 
} from "../data";
import { 
  Committee, 
  SecretariatMember, 
  FAQItem, 
  CountryMatrixRow,
  ContactQuery,
  RegistrationDetails,
  EBRegistration,
  CampusAmbassadorRegistration,
  WorkshopRegistrationDetails
} from "../types";

export interface CollectionCounts {
  committees: number;
  secretariat: number;
  faqs: number;
  schedule: number;
  country_matrix: number;
  portfolio_states: number;
  registrations: number;
  workshop_registrations: number;
  eb_registrations: number;
  campus_ambassador_registrations: number;
  contact_queries: number;
  sent_emails: number;
}

/**
 * Fetch live document counts for all conference collections
 */
export async function fetchCollectionCounts(db: Firestore): Promise<CollectionCounts> {
  const collections = [
    "committees",
    "secretariat",
    "faqs",
    "schedule",
    "country_matrix",
    "portfolio_states",
    "registrations",
    "workshop_registrations",
    "eb_registrations",
    "campus_ambassador_registrations",
    "contact_queries",
    "sent_emails"
  ];

  const counts: Record<string, number> = {};

  await Promise.all(
    collections.map(async (colName) => {
      try {
        const snap = await getDocs(collection(db, colName));
        counts[colName] = snap.size;
      } catch (err) {
        // May be restricted or not yet initialized
        counts[colName] = 0;
      }
    })
  );

  return counts as unknown as CollectionCounts;
}

/**
 * Seed Committees collection
 */
export async function seedCommittees(db: Firestore) {
  // Purge legacy committee documents if present
  const legacyIds = ["copuos", "disec", "aippm", "unsc"];
  for (const legId of legacyIds) {
    try {
      await deleteDoc(doc(db, "committees", legId));
    } catch (e) {
      // Ignore if document did not exist
    }
  }

  const batch = writeBatch(db);
  COMMITTEES.forEach((comm, index) => {
    const docRef = doc(db, "committees", comm.id);
    batch.set(docRef, { ...comm, order: index + 1 }, { merge: true });
  });
  await batch.commit();
}

/**
 * Seed Secretariat collection
 */
export async function seedSecretariat(db: Firestore) {
  const batch = writeBatch(db);
  SECRETARIAT.forEach((member, index) => {
    const docRef = doc(db, "secretariat", member.id);
    batch.set(docRef, { ...member, order: index + 1 }, { merge: true });
  });
  await batch.commit();
}

/**
 * Seed FAQs collection
 */
export async function seedFAQs(db: Firestore) {
  const batch = writeBatch(db);
  FAQ_ITEMS.forEach((faq, index) => {
    const docId = `faq-${index + 1}`;
    const docRef = doc(db, "faqs", docId);
    batch.set(docRef, { id: docId, ...faq, order: index + 1 }, { merge: true });
  });
  await batch.commit();
}

/**
 * Seed Schedule collection
 */
export async function seedSchedule(db: Firestore) {
  const batch = writeBatch(db);
  
  const scheduleData = [
    {
      dayId: "day1",
      name: "Day 1",
      date: "Friday, January 29, 2027",
      events: SCHEDULE.day1,
      order: 1
    },
    {
      dayId: "day2",
      name: "Day 2",
      date: "Saturday, January 30, 2027",
      events: SCHEDULE.day2,
      order: 2
    },
    {
      dayId: "day3",
      name: "Day 3",
      date: "Sunday, January 31, 2027",
      events: SCHEDULE.day3,
      order: 3
    }
  ];

  scheduleData.forEach((day) => {
    const docRef = doc(db, "schedule", day.dayId);
    batch.set(docRef, day, { merge: true });
  });

  await batch.commit();
}

/**
 * Seed Country Matrix collection
 */
export async function seedCountryMatrix(db: Firestore) {
  // Batch write (Firestore limits 500 ops per batch)
  const batch = writeBatch(db);
  COUNTRY_MATRIX.forEach((row) => {
    // Sanitize document ID for Firestore
    const docId = row.country.replace(/\//g, "-").replace(/\s+/g, "_");
    const docRef = doc(db, "country_matrix", docId);
    batch.set(docRef, row, { merge: true });
  });
  await batch.commit();
}

/**
 * Seed all core conference collections into Firestore
 */
export async function seedAllConferenceData(db: Firestore): Promise<{ success: boolean; message: string }> {
  const steps: { name: string; fn: (db: Firestore) => Promise<void> }[] = [
    { name: "Committees", fn: seedCommittees },
    { name: "Secretariat", fn: seedSecretariat },
    { name: "FAQs", fn: seedFAQs },
    { name: "Schedule", fn: seedSchedule },
    { name: "Country Matrix", fn: seedCountryMatrix },
  ];

  const errors: string[] = [];
  let successfulCount = 0;

  for (const step of steps) {
    try {
      await step.fn(db);
      successfulCount++;
    } catch (err: any) {
      console.warn(`Seeding failed for ${step.name}:`, err);
      errors.push(`${step.name}: ${err?.message || "Permission denied"}`);
    }
  }

  if (errors.length === 0) {
    return {
      success: true,
      message: "Successfully synchronized all 5 conference collections (Committees, Secretariat, FAQs, Schedule, Country Matrix) to Firestore!"
    };
  }

  return {
    success: false,
    message: `${errors.join("; ")} (Note: Ensure firestore.rules has been published to the Firebase Console).`
  };
}

/**
 * Known sample IDs previously generated for testing
 */
const KNOWN_SAMPLE_IDS = new Set([
  "QUERY-2027-101",
  "QUERY-2027-102",
  "QUERY-2027-103",
  "COPUOSD2041",
  "UNSCD8832",
  "sample-user-01",
  "sample-user-02",
  "sample-reg-individual-01",
  "sample-reg-double-02",
  "EB-2027-1049",
  "EB-2027-2194",
  "EB-2027-401",
  "EB-2027-402",
  "sample-eb-01",
  "sample-eb-02",
  "CA-2027-1011",
  "CA-2027-501",
  "sample-ca-01",
  "SCH-WS-102941",
  "WS-883192",
  "sample-workshop-sch-01",
  "sample-workshop-ind-02",
  "sample-ws-01",
  "sample-ws-02"
]);

/**
 * Remove all example/sample dummy records from the database collections
 */
export async function purgeSampleData(db: Firestore): Promise<{ success: boolean; count: number; message: string }> {
  const collectionsToCheck = [
    "contact_queries",
    "registrations",
    "eb_registrations",
    "campus_ambassador_registrations",
    "workshop_registrations"
  ];

  let deletedCount = 0;
  const batch = writeBatch(db);
  let batchOps = 0;

  for (const colName of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const docSnap of snap.docs) {
        const id = docSnap.id;
        const data = docSnap.data();
        const email = (data.email || "").toString().toLowerCase();
        const userId = (data.userId || "").toString().toLowerCase();
        const name = (data.name || "").toString();

        const isSample = 
          KNOWN_SAMPLE_IDS.has(id) ||
          id.startsWith("sample-") ||
          id.startsWith("QUERY-2027-") ||
          userId.startsWith("sample-") ||
          email.includes("@example.com") ||
          name === "Rhea Nair" ||
          name === "Prof. Arvind Ramanathan" ||
          name === "Vikram Malhotra" ||
          name === "Aaditya Sen" ||
          name === "Pooja Sundaram" ||
          name === "Siddharth Rajan" ||
          name === "Ananya Deshmukh" ||
          name === "Kavya Menon" ||
          name === "St. Thomas Central School, Trivandrum" ||
          name === "Tanvi Kulkarni";

        if (isSample) {
          batch.delete(docSnap.ref);
          deletedCount++;
          batchOps++;
        }
      }
    } catch (err) {
      console.warn(`Could not scan ${colName} for sample data:`, err);
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  return {
    success: true,
    count: deletedCount,
    message: deletedCount > 0 
      ? `Successfully purged ${deletedCount} example record(s) from the database!` 
      : "No example records found. The database collections are completely clean."
  };
}

