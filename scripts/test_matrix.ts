import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(cfg);
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'country_matrix'));
    console.log('country_matrix count:', snap.size);
    if (snap.size > 0) {
      console.log('first doc:', snap.docs[0].id, snap.docs[0].data());
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

run();

