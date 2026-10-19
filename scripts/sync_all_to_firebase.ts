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

  const all: any[] = JSON.parse(fs.readFileSync(localFile, 'utf8'));
  console.log(`Found ${all.length} records in local_registrations.json`);

  let prioritySuccess = 0;
  let ungaSuccess = 0;
  let regSuccess = 0;

  for (const reg of all) {
    const ticketId = reg.id;
    if (!ticketId) {
      console.warn('Skipping registration without id:', reg);
      continue;
    }

    const isUnga = Boolean(
      reg.isUnga === true ||
      reg.round === 'online' ||
      reg.pref1Committee === 'unga' ||
      ticketId.startsWith('UNGA')
    );

    const clean = sanitizeData({
      ...reg,
      id: ticketId,
      uid: ticketId,
      userId: reg.userId || ticketId,
      round: isUnga ? 'online' : 'priority',
      isPriority: !isUnga,
      isUnga: isUnga,
      hasMerch: Boolean(reg.hasMerch),
      merchSize: reg.hasMerch ? (reg.merchSize || 'M') : '',
      merchAmount: reg.hasMerch ? (reg.merchAmount || 599) : 0,
      paymentScreenshotUrl: reg.paymentScreenshotUrl || '',
      paymentScreenshotName: reg.paymentScreenshotName || '',
      idCardUrl: reg.idCardUrl || '',
      idCardName: reg.idCardName || '',
      campusAmbassadorCode: reg.campusAmbassadorCode || '',
      partnerName: reg.partnerName || '',
      partnerEmail: reg.partnerEmail || '',
      partnerPhone: reg.partnerPhone || '',
      partnerInstitution: reg.partnerInstitution || '',
      partnerRole: reg.partnerRole || 'Delegate',
      contingentSize: reg.contingentSize || (isUnga ? '1' : '5-10'),
      pastMunDetails: reg.pastMunDetails || '',
    });

    // 1. Primary registrations collection
    try {
      await setDoc(doc(db, 'registrations', ticketId), clean);
      regSuccess++;
      console.log(`[registrations] Saved ${ticketId} (${clean.name})`);
    } catch (e: any) {
      console.error(`[registrations] Error on ${ticketId}:`, e.message);
    }

    // 2. Specific collection (priority_registrations or unga_registrations)
    if (isUnga) {
      try {
        await setDoc(doc(db, 'unga_registrations', ticketId), clean);
        ungaSuccess++;
        console.log(`[unga_registrations] Saved ${ticketId} (${clean.name})`);
      } catch (e: any) {
        console.error(`[unga_registrations] Error on ${ticketId}:`, e.message);
      }
    } else {
      try {
        await setDoc(doc(db, 'priority_registrations', ticketId), clean);
        prioritySuccess++;
        console.log(`[priority_registrations] Saved ${ticketId} (${clean.name})`);
      } catch (e: any) {
        console.error(`[priority_registrations] Error on ${ticketId}:`, e.message);
      }
    }
  }

  console.log(`\nSync Summary:`);
  console.log(`- registrations: ${regSuccess}/${all.length}`);
  console.log(`- priority_registrations: ${prioritySuccess}`);
  console.log(`- unga_registrations: ${ungaSuccess}`);
  process.exit(0);
}

run();
