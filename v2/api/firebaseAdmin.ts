import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');

const credentials = JSON.parse(raw);
const adminApp = getApps().length ? getApps()[0] : initializeApp({ credential: cert(credentials) });
export const adminDb = getFirestore(adminApp);
