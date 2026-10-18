import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(cfg);
const db = getFirestore(app, cfg.firestoreDatabaseId);

const sanitizeData = (data: any) => {
  const clean: any = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
};

async function run() {
  const localFile = path.join(process.cwd(), 'data', 'local_registrations.json');
  if (!fs.existsSync(localFile)) {
    console.log('No local_registrations.json found.');
    return;
  }

  const all = JSON.parse(fs.readFileSync(localFile, 'utf8'));
  const ungaRecords = all.filter((r: any) => 
    r.isUnga === true || r.round === 'online' || r.pref1Committee === 'unga' || (typeof r.id === 'string' && r.id.startsWith('UNGA'))
  );

  console.log(`Found ${ungaRecords.length} UNGA records in local_registrations.json`);

  for (const reg of ungaRecords) {
    const docId = reg.userId || reg.id;
    const clean = sanitizeData({
      ...reg,
      uid: docId,
      partnerRole: reg.partnerRole || "Delegate",
      contingentSize: reg.contingentSize || "1",
      merchSize: reg.hasMerch ? (reg.merchSize || "M") : "",
      pastMunDetails: reg.pastMunDetails || "",
      paymentScreenshotUrl: reg.paymentScreenshotUrl || "",
      paymentScreenshotName: reg.paymentScreenshotName || "",
      idCardUrl: reg.idCardUrl || "",
      idCardName: reg.idCardName || ""
    });

    try {
      await setDoc(doc(db, 'unga_registrations', docId), clean);
      console.log(`Uploaded to unga_registrations/${docId} (${clean.name})`);
    } catch (e: any) {
      console.error(`Error uploading ${docId} to unga_registrations:`, e.message);
    }

    try {
      await setDoc(doc(db, 'registrations', docId), clean);
      console.log(`Uploaded to registrations/${docId} (${clean.name})`);
    } catch (e: any) {
      console.error(`Error uploading ${docId} to registrations:`, e.message);
    }
  }

  console.log('Sync completed!');
  process.exit(0);
}

run();
