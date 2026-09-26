import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
type Response = { status: (code: number) => Response; setHeader: (name: string, value: string) => Response; json: (body: unknown) => void };

function parseBody(body: unknown): { pin?: unknown } {
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body && typeof body === 'object' ? body as { pin?: unknown } : {};
}

function getAdminApp() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured on Vercel.');
  let credential: any;
  try { credential = JSON.parse(raw); } catch { throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.'); }
  return getApps()[0] || initializeApp({ credential: cert(credential), projectId: credential.project_id });
}

function getHeader(request: Request, name: string) { const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()]; return Array.isArray(value) ? value[0] : value; }

function getBearerToken(request: Request) {
  const authorization = getHeader(request, 'authorization') || getHeader(request, 'Authorization');
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\\s+(.+)$/i);
  return match?.[1] || null;
}

function verifyScryptPin(pin: string, encodedHash: string) {
  const parts = encodedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  try {
    const salt = Buffer.from(parts[4], 'base64url');
    const expected = Buffer.from(parts[5], 'base64url');
    const derived = scryptSync(pin, salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: 32 * 1024 * 1024,
    });
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

async function writePinAudit(firestore: ReturnType<typeof getFirestore>, data: Record<string, unknown>) {
  try {
    await firestore.collection('adminPinAudit').add({
      ...data,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin PIN audit write failed:', error);
  }
}


export default async function handler(request: Request, response: Response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { pin } = parseBody(request.body);
  if (typeof pin !== 'string' || !/^\\d{5}$/.test(pin)) {
    return response.status(400).json({ error: 'Enter the five-digit administrator PIN.' });
  }

  const pinHash = process.env.ADMIN_WORKPLACE_PIN_HASH;
  if (!pinHash) {
    console.error('ADMIN_WORKPLACE_PIN_HASH is not configured on the trusted backend.');
    return response.status(503).json({ error: 'Administrator PIN verification is not configured on the server.' });
  }

  const bearerToken = getBearerToken(request);
  if (!bearerToken) {
    return response.status(401).json({ error: 'Administrator authentication is required.' });
  }

  try {
    const app = getAdminApp();
    const adminAuth = getAuth(app);
    const firestore = getFirestore(app);

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(bearerToken);
    } catch {
      return response.status(401).json({ error: 'Administrator authentication is required.' });
    }

    const profileSnapshot = await firestore.collection('users').doc(decodedToken.uid).get();
    const profile = profileSnapshot.data();
    const role = String(profile?.role || '').toLowerCase();
    const status = String(profile?.status || '').toLowerCase();

    if (role !== 'admin' || status !== 'active') {
      return response.status(403).json({ error: 'Administrator authorization could not be verified.' });
    }

    const forwardedFor = getHeader(request, 'x-forwarded-for');
    const realIp = getHeader(request, 'x-real-ip');
    const ip = realIp || forwardedFor?.split(',')[0]?.trim() || request.socket?.remoteAddress || 'unknown';
    const ipHash = createHash('sha256').update(ip + ':' + decodedToken.uid).digest('hex');
    const rateRef = firestore.collection('adminPinRateLimits').doc(ipHash);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;

    const allowed = await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(rateRef);
      const data = snapshot.data();
      const windowStart = Number(data?.windowStart || now);
      const attempts = now - windowStart >= windowMs ? 0 : Number(data?.attempts || 0);

      if (attempts >= 5) return false;

      transaction.set(rateRef, {
        windowStart: attempts === 0 ? now : windowStart,
        attempts: attempts + 1,
        expiresAt: new Date(now + windowMs),
        uid: decodedToken.uid,
      });

      return true;
    });

    if (!allowed) {
      await writePinAudit(firestore, {
        uid: decodedToken.uid,
        event: 'ADMIN_PIN_RATE_LIMITED',
        ipHash,
      });
      return response.status(429).json({ error: 'Too many verification attempts. Please try again later.' });
    }

    const validPin = verifyScryptPin(pin, pinHash);

    if (!validPin) {
      await writePinAudit(firestore, {
        uid: decodedToken.uid,
        event: 'ADMIN_PIN_FAILED',
        ipHash,
      });
      return response.status(401).json({ error: 'Incorrect Admin PIN. Access denied.' });
    }

    await writePinAudit(firestore, {
      uid: decodedToken.uid,
      event: 'ADMIN_PIN_VERIFIED',
      ipHash,
    });

    return response.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Admin PIN verification failed:', error?.message || 'unknown error');
    return response.status(503).json({ error: 'Administrator PIN verification could not be completed.' });
  }
}
