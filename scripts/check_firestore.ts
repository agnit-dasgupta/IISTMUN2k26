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
  console.log('Database ID:', firebaseConfig.firestoreDatabaseId);
  try {
    const portfolioSnap = await getDocs(collection(db, 'portfolio_states'));
    console.log('portfolio_states count:', portfolioSnap.size);
    portfolioSnap.forEach((d) => console.log('portfolio doc:', d.id, d.data()));

    const sentEmailsSnap = await getDocs(collection(db, 'sent_emails'));
    console.log('sent_emails count:', sentEmailsSnap.size);

    const commSnap = await getDocs(collection(db, 'committees'));
    console.log('committees count:', commSnap.size);

    const regSnap = await getDocs(collection(db, 'registrations'));
    console.log('registrations count:', regSnap.size);

    const ebSnap = await getDocs(collection(db, 'eb_registrations'));
    console.log('eb_registrations count:', ebSnap.size);

    const caSnap = await getDocs(collection(db, 'campus_ambassador_registrations'));
    console.log('campus_ambassador_registrations count:', caSnap.size);

    const queriesSnap = await getDocs(collection(db, 'contact_queries'));
    console.log('contact_queries count:', queriesSnap.size);
  } catch (e: any) {
    console.error('Check error:', e?.message || e);
  }
  process.exit(0);
}

run();
