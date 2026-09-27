import { randomBytes, scryptSync } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[]> };
type Response = { status: (code: number) => Response; setHeader: (name: string, value: string) => void; json: (body: unknown) => void };

function getHeader(request: Request, name: string) {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getBearerToken(request: Request) {
  const authorization = getHeader(request, 'authorization') || getHeader(request, 'Authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function getAdminApp() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured on Vercel.');
  const credential = JSON.parse(raw);
  return getApps()[0] || initializeApp({ credential: cert(credential), projectId: credential.project_id });
}

function parseBody(body: unknown) {
  if (typeof body === 'string') {
    try { return JSON.parse(body) as Record<string, unknown>; } catch { return {}; }
  }
  return body && typeof body === 'object' ? body as Record<string, unknown> : {};
}

function hashPin(pin: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(pin, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
  return ['scrypt', '16384', '8', '1', salt.toString('base64url'), derived.toString('base64url')].join('$');
}

export default async function handler(request: Request, response: Response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { pin } = parseBody(request.body);
  if (typeof pin !== 'string' || !/^\d{5}$/.test(pin)) {
    return response.status(400).json({ error: 'Admin PIN must be exactly five digits.' });
  }

  const bearerToken = getBearerToken(request);
  if (!bearerToken) return response.status(401).json({ error: 'Administrator authentication is required.' });

  try {
    const app = getAdminApp();
    const adminAuth = getAuth(app);
    const firestore = getFirestore(app);
    const decoded = await adminAuth.verifyIdToken(bearerToken);
    const profile = (await firestore.collection('users').doc(decoded.uid).get()).data();
    const role = String(profile?.role || '').toLowerCase();
    const status = String(profile?.status || '').toLowerCase();

    if (role !== 'admin' || status !== 'active') {
      return response.status(403).json({ error: 'Administrator authorization could not be verified.' });
    }

    await firestore.collection('adminSecurity').doc('config').set({
      adminPinHash: hashPin(pin),
      updatedAt: new Date().toISOString(),
      updatedBy: decoded.uid,
    }, { merge: true });

    await firestore.collection('adminPinAudit').add({
      uid: decoded.uid,
      event: 'ADMIN_PIN_CHANGED',
      createdAt: new Date().toISOString(),
    });

    return response.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Admin PIN configuration failed:', error?.message || 'unknown error');
    return response.status(503).json({ error: 'Administrator PIN could not be updated.' });
  }
}
