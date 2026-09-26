import { createHash, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  const credentialJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!credentialJson) throw new Error('Admin PIN service is not configured.');
  const credential = JSON.parse(credentialJson);
  return getApps()[0] || initializeApp({
    credential: cert(credential),
    projectId: credential.project_id,
  });
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function equalSecret(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } });
    }

    let payload: { pin?: unknown; confirmation?: unknown } | null;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: 'Enter the five-digit PIN twice.' }, { status: 400 });
    }
    if (!payload || typeof payload !== 'object') {
      return Response.json({ error: 'Enter the five-digit PIN twice.' }, { status: 400 });
    }
    const pin = typeof payload.pin === 'string' ? payload.pin : '';
    const confirmation = typeof payload.confirmation === 'string' ? payload.confirmation : '';
    if (!/^\d{5}$/.test(pin) || pin !== confirmation) {
      return Response.json({ error: 'The two five-digit PIN entries must match.' }, { status: 400 });
    }

    const configuredPin = process.env.ADMIN_WORKPLACE_PIN;
    if (!configuredPin || !/^\d{5}$/.test(configuredPin)) {
      return Response.json({ error: 'Admin PIN sign-in is not configured on the server yet.' }, { status: 503 });
    }

    try {
      const app = getAdminApp();
      const firestore = getFirestore(app);
      const ip = request.headers.get('x-real-ip')
        || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || 'unknown';
      const ipHash = createHash('sha256').update(ip).digest('hex');
      const ipRef = firestore.collection('adminPinRateLimits').doc(ipHash);
      const globalRef = firestore.collection('adminPinRateLimits').doc('global');
      const now = Date.now();
      const windowMs = 15 * 60 * 1000;
      const allowed = await firestore.runTransaction(async (transaction) => {
        const ipSnapshot = await transaction.get(ipRef);
        const globalSnapshot = await transaction.get(globalRef);
        const ipData = ipSnapshot.data();
        const globalData = globalSnapshot.data();
        const ipWindow = Number(ipData?.windowStart || now);
        const globalWindow = Number(globalData?.windowStart || now);
        const ipCount = now - ipWindow >= windowMs ? 0 : Number(ipData?.attempts || 0);
        const globalCount = now - globalWindow >= windowMs ? 0 : Number(globalData?.attempts || 0);
        if (ipCount >= 5 || globalCount >= 50) return false;
        const nextWindow = now + windowMs;
        transaction.set(ipRef, {
          windowStart: ipCount === 0 ? now : ipWindow,
          attempts: ipCount + 1,
          expiresAt: new Date(nextWindow),
        });
        transaction.set(globalRef, {
          windowStart: globalCount === 0 ? now : globalWindow,
          attempts: globalCount + 1,
          expiresAt: new Date(nextWindow),
        });
        return true;
      });
      if (!allowed) {
        return Response.json({ error: 'Too many PIN attempts. Try again in 15 minutes.' }, { status: 429 });
      }
      if (!equalSecret(pin, configuredPin)) {
        return Response.json({ error: 'PIN could not be verified. Check the digits and try again.' }, { status: 401 });
      }

      const adminAuth = getAuth(app);
      const adminUser = await adminAuth.getUserByEmail('kirengacargo@gmail.com');
      const profileSnapshot = await firestore.collection('users').doc(adminUser.uid).get();
      const profile = profileSnapshot.data();
      if (
        !adminUser.emailVerified
        || !profile
        || !['admin', 'ADMIN'].includes(String(profile.role || ''))
        || !['active', 'ACTIVE'].includes(String(profile.status || ''))
      ) {
        return Response.json({ error: 'The administrator account is not active.' }, { status: 403 });
      }

      const token = await adminAuth.createCustomToken(adminUser.uid);
      return Response.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.error('Admin PIN sign-in failed:', error);
      return Response.json({ error: 'PIN sign-in is temporarily unavailable. Please try again later.' }, { status: 503 });
    }
  },
};
