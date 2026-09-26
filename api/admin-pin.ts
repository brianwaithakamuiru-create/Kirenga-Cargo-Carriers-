import { createHash, timingSafeEqual } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

type Request = { method?: string; body?: unknown };
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

function safeEqual(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

export default async function handler(request: Request, response: Response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { pin } = parseBody(request.body);
  if (typeof pin !== 'string' || !/^\d{5}$/.test(pin)) {
    return response.status(400).json({ error: 'Enter the five-digit administrator PIN.' });
  }

  const configuredPin = process.env.ADMIN_WORKPLACE_PIN;
  if (!configuredPin || !/^\d{5}$/.test(configuredPin)) {
    return response.status(503).json({ error: 'Administrator PIN sign-in is not configured on the server. Add ADMIN_WORKPLACE_PIN in Vercel.' });
  }

  try {
    if (!safeEqual(pin, configuredPin)) return response.status(401).json({ error: 'Incorrect administrator PIN.' });

    const app = getAdminApp();
    const adminAuth = getAuth(app);
    const firestore = getFirestore(app);
    let adminUser;
    try {
      adminUser = await adminAuth.getUserByEmail('kirengacargo@gmail.com');
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') throw error;
      adminUser = await adminAuth.createUser({
        email: 'kirengacargo@gmail.com',
        emailVerified: true,
        disabled: false,
      });
    }

    const profileSnapshot = await firestore.collection('users').doc(adminUser.uid).get();
    const profile = profileSnapshot.data();

    if (!profile) {
      const now = new Date().toISOString();
      await firestore.collection('users').doc(adminUser.uid).set({
        id: adminUser.uid,
        uid: adminUser.uid,
        fullName: 'Kirenga Central Administrator',
        username: 'admin',
        email: adminUser.email || 'kirengacargo@gmail.com',
        phone: '',
        country: 'Kenya',
        role: 'ADMIN',
        status: 'ACTIVE',
        department: 'Administration',
        employeeId: 'KCC-ADM-001',
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lastLoginAt: now,
        workplaces: ['admin', 'operations', 'driver', 'finance', 'support'],
        createdAt: now,
        updatedAt: now,
      });
    } else if (String(profile.role || '').toLowerCase() !== 'admin' || String(profile.status || '').toLowerCase() !== 'active') {
      return response.status(403).json({ error: 'The administrator Firebase profile is inactive or does not have the ADMIN role.' });
    }

    const token = await adminAuth.createCustomToken(adminUser.uid, { role: 'admin' });
    return response.status(200).json({ token });
  } catch (error: any) {
    console.error('Admin PIN sign-in failed:', error);
    return response.status(503).json({ error: error?.message || 'Administrator PIN sign-in could not be completed.' });
  }
}
