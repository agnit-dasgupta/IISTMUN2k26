import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log('Project ID:', firebaseConfig.projectId);
  try {
    for (const col of ['portfolio_states', 'committees', 'registrations', 'priority_registrations', 'unga_registrations', 'eb_registrations', 'campus_ambassador_registrations', 'contact_queries', 'sent_emails']) {
      try {
        const snap = await getDocs(collection(db, col));
        console.log(`${col} count:`, snap.size);
        snap.forEach((d) => {
          const data = d.data();
          console.log(`  [${col}] doc:`, d.id, {
            id: data.id,
            name: data.name,
            round: data.round,
            isPriority: data.isPriority,
            isUnga: data.isUnga,
            pref1Committee: data.pref1Committee,
            paymentScreenshotUrl: data.paymentScreenshotUrl ? (data.paymentScreenshotUrl.slice(0, 40) + '...') : undefined,
            idCardUrl: data.idCardUrl ? (data.idCardUrl.slice(0, 40) + '...') : undefined,
          });
        });
      } catch (err: any) {
        console.warn(`${col} error:`, err?.message || err);
      }
    }
  } catch (e: any) {
    console.error('Check error:', e?.message || e);
  }
  process.exit(0);
}

run();
