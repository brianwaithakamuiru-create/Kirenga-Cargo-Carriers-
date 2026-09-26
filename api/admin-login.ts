import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

type Request = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};
type Response = {
  status: (code: number) => Response;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

function parseBody(body: unknown): { email?: unknown; password?: unknown } {
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body && typeof body === 'object' ? body as { email?: unknown; password?: unknown } : {};
}

function getAdminApp() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured.');
  const credential = JSON.parse(raw);
  return getApps()[0] || initializeApp({ credential: cert(credential), projectId: credential.project_id });
}

function getHeader(request: Request, name: string) {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function verifyScryptPassword(password: string, encodedHash: string) {
  const parts = encodedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  try {
    const salt = Buffer.from(parts[4], 'base64url');
    const expected = Buffer.from(parts[5], 'base64url');
    const derived = scryptSync(password, salt, expected.length, {
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

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}

export default async function handler(request: Request, response: Response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { email, password } = parseBody(request.body);
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanEmail || typeof password !== 'string' || password.length < 1) {
    return response.status(400).json({ error: 'Enter the administrator email and password.' });
  }

  const configuredEmail = (process.env.ADMIN_SYSTEM_EMAIL || 'kirengacargo@gmail.com').trim().toLowerCase();
  const passwordHash = process.env.ADMIN_SYSTEM_PASSWORD_HASH;

  if (!passwordHash) {
    console.error('ADMIN_SYSTEM_PASSWORD_HASH is not configured.');
    return response.status(503).json({ error: 'Administrator system credentials are not configured.' });
  }

  const forwardedFor = getHeader(request, 'x-forwarded-for');
  const realIp = getHeader(request, 'x-real-ip');
  const ip = realIp || forwardedFor?.split(',')[0]?.trim() || request.socket?.remoteAddress || 'unknown';

  try {
    const app = getAdminApp();
    const firestore = getFirestore(app);
    const adminAuth = getAuth(app);

    if (cleanEmail !== configuredEmail || !verifyScryptPassword(password, passwordHash)) {
      await firestore.collection('adminLoginAudit').add({
        event: 'ADMIN_SYSTEM_LOGIN_FAILED',
        email: cleanEmail,
        ipHash: hashIp(ip),
        createdAt: new Date().toISOString(),
      }).catch(() => {});
      return response.status(401).json({ error: 'Incorrect administrator credentials.' });
    }

    const snapshot = await firestore
      .collection('users')
      .where('email', '==', configuredEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return response.status(403).json({ error: 'Administrator profile is not configured.' });
    }

    const profileDoc = snapshot.docs[0];
    const profile = profileDoc.data();
    const role = String(profile.role || '').toLowerCase();
    const status = String(profile.status || '').toLowerCase();

    if (role !== 'admin' || status !== 'active') {
      return response.status(403).json({ error: 'Administrator account is not active.' });
    }

    const customToken = await adminAuth.createCustomToken(profile.uid || profileDoc.id, {
      admin: true,
      loginMethod: 'system',
    });

    await firestore.collection('adminLoginAudit').add({
      event: 'ADMIN_SYSTEM_LOGIN_SUCCESS',
      uid: profile.uid || profileDoc.id,
      ipHash: hashIp(ip),
      createdAt: new Date().toISOString(),
    }).catch(() => {});

    return response.status(200).json({ success: true, customToken });
  } catch (error: any) {
    console.error('Administrator system login failed:', error?.message || 'unknown error');
    return response.status(503).json({ error: 'Administrator login service is temporarily unavailable.' });
  }
};
