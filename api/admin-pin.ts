import { createHash, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => ApiResponse;
  json: (body: unknown) => void;
};

function getHeader(request: ApiRequest, name: string): string | undefined {
  const value = request.headers?.[name.toLowerCase()] ?? request.headers?.[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

function getAdminApp() {
  const credentialJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!credentialJson) throw new Error('Admin PIN service is not configured.');

  let credential: { project_id?: string };
  try {
    credential = JSON.parse(credentialJson);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.');
  }

  return getApps()[0] || initializeApp({
    credential: cert(JSON.parse(credentialJson)),
    projectId: credential.project_id,
  });
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function equalSecret(a: string, b: string): boolean {
  const left = digest(a);
  const right = digest(b);
  return timingSafeEqual(left, right);
}

function parseBody(body: unknown): { pin?: unknown; confirmation?: unknown } {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (body && typeof body === 'object') {
    return body as { pin?: unknown; confirmation?: unknown };
  }
  return {};
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const payload = parseBody(request.body);
  const pin = typeof payload.pin === 'string' ? payload.pin : '';
  const confirmation = typeof payload.confirmation === 'string' ? payload.confirmation : '';

  if (!/^\d{5}$/.test(pin) || pin !== confirmation) {
    return response.status(400).json({
      error: 'Enter the same five-digit administrator PIN in both fields.',
    });
  }

  const configuredPin = process.env.ADMIN_WORKPLACE_PIN;
  if (!configuredPin || !/^\d{5}$/.test(configuredPin)) {
    console.error('ADMIN_WORKPLACE_PIN is missing or invalid.');
    return response.status(503).json({
      error: 'Administrator PIN sign-in is not configured on the server yet.',
    });
  }

  try {
    const app = getAdminApp();
    const firestore = getFirestore(app);

    const forwardedFor = getHeader(request, 'x-forwarded-for');
    const realIp = getHeader(request, 'x-real-ip');
    const ip = realIp || forwardedFor?.split(',')[0]?.trim() || request.socket?.remoteAddress || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');

    const ipRef = firestore.collection('adminPinRateLimits').doc(ipHash);
    const globalRef = firestore.collection('adminPinRateLimits').doc('global');
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;

    const allowed = await firestore.runTransaction(async (transaction) => {
      const [ipSnapshot, globalSnapshot] = await Promise.all([
        transaction.get(ipRef),
        transaction.get(globalRef),
      ]);

      const ipData = ipSnapshot.data();
      const globalData = globalSnapshot.data();

      const ipWindow = Number(ipData?.windowStart || now);
      const globalWindow = Number(globalData?.windowStart || now);

      const ipCount = now - ipWindow >= windowMs ? 0 : Number(ipData?.attempts || 0);
      const globalCount = now - globalWindow >= windowMs ? 0 : Number(globalData?.attempts || 0);

      if (ipCount >= 5 || globalCount >= 50) return false;

      const expiresAt = new Date(now + windowMs);

      transaction.set(ipRef, {
        windowStart: ipCount === 0 ? now : ipWindow,
        attempts: ipCount + 1,
        expiresAt,
      });

      transaction.set(globalRef, {
        windowStart: globalCount === 0 ? now : globalWindow,
        attempts: globalCount + 1,
        expiresAt,
      });

      return true;
    });

    if (!allowed) {
      return response.status(429).json({
        error: 'Too many PIN attempts. Try again in 15 minutes.',
      });
    }

    if (!equalSecret(pin, configuredPin)) {
      return response.status(401).json({
        error: 'PIN could not be verified. Check the digits and try again.',
      });
    }

    const adminAuth = getAuth(app);
    const adminUser = await adminAuth.getUserByEmail('kirengacargo@gmail.com');
    const profileSnapshot = await firestore.collection('users').doc(adminUser.uid).get();
    const profile = profileSnapshot.data();

    const role = String(profile?.role || '').toLowerCase();
    const status = String(profile?.status || '').toLowerCase();

    if (!adminUser.emailVerified || !profile || role !== 'admin' || status !== 'active') {
      return response.status(403).json({
        error: 'The administrator account is not active.',
      });
    }

    const token = await adminAuth.createCustomToken(adminUser.uid);
    return response.status(200).json({ token });
  } catch (error) {
    console.error('Admin PIN sign-in failed:', error);
    return response.status(503).json({
      error: 'PIN sign-in is temporarily unavailable. Please try again later.',
    });
  }
}
