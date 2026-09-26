import { createHash } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
  const credentialJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!credentialJson) throw new Error('Tracking service is not configured.');
  const credential = JSON.parse(credentialJson);
  const app = getApps()[0] || initializeApp({
    credential: cert(credential),
    projectId: credential.project_id,
  });
  return getFirestore(app);
}

function normalizePhone(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } });
    }
    let payload: { trackingNumber?: unknown; phoneNumber?: unknown };
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: 'Enter a valid tracking reference and booking phone number.' }, { status: 400 });
    }
    if (!payload || typeof payload !== 'object') {
      return Response.json({ error: 'Enter a valid tracking reference and booking phone number.' }, { status: 400 });
    }
    const trackingNumber = typeof payload.trackingNumber === 'string' ? payload.trackingNumber.trim().toUpperCase() : '';
    const phoneNumber = normalizePhone(payload.phoneNumber);
    if (!/^KCC-\d{4}-\d{6}$/.test(trackingNumber) || phoneNumber.length < 8 || phoneNumber.length > 15) {
      return Response.json({ error: 'Enter a valid tracking reference and booking phone number.' }, { status: 400 });
    }

    try {
      const db = getAdminDb();
      const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const rateKey = createHash('sha256').update(forwardedFor).digest('hex');
      const rateRef = db.collection('trackingRateLimits').doc(rateKey);
      const now = Date.now();
      const allowed = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(rateRef);
        const data = snapshot.data();
        const windowStart = data?.windowStart || now;
        const attempts = now - windowStart > 15 * 60 * 1000 ? 0 : Number(data?.attempts || 0);
        if (attempts >= 30) return false;
        transaction.set(rateRef, { windowStart: attempts === 0 ? now : windowStart, attempts: attempts + 1 });
        return true;
      });
      if (!allowed) return Response.json({ error: 'Too many tracking attempts. Please try again in 15 minutes.' }, { status: 429 });

      const bookingSnapshot = await db.collection('bookings')
        .where('bookingReference', '==', trackingNumber).limit(1).get();
      if (bookingSnapshot.empty) {
        return Response.json({ error: 'We could not verify that reference and phone number. Check both and try again.' }, { status: 404 });
      }
      const bookingDoc = bookingSnapshot.docs[0];
      const booking = bookingDoc.data();
      if (normalizePhone(booking.phone) !== phoneNumber) {
        return Response.json({ error: 'We could not verify that reference and phone number. Check both and try again.' }, { status: 404 });
      }

      const shipmentSnapshot = await db.collection('shipments')
        .where('bookingId', '==', bookingDoc.id).limit(1).get();
      const shipment = shipmentSnapshot.empty ? null : shipmentSnapshot.docs[0].data();
      const record = shipment || booking;
      const response = {
        id: trackingNumber,
        shipmentNumber: trackingNumber,
        status: safeText(record.status, 'PENDING'),
        originCountry: safeText(record.originCountry || record.pickupCountry, 'Unknown'),
        originCity: safeText(record.originCity || record.pickupLocation, 'Unknown'),
        destinationCountry: safeText(record.destinationCountry || record.deliveryCountry, 'Unknown'),
        destinationCity: safeText(record.destinationCity || record.deliveryLocation, 'Unknown'),
        cargoType: safeText(record.cargoType, 'General Cargo'),
        weightKg: Number(record.weightKg) || 0,
        pickupDate: safeText(record.pickupDate),
        expectedDelivery: safeText(record.expectedDelivery),
        actualDelivery: safeText(record.actualDelivery),
        createdAt: safeText(record.createdAt, new Date().toISOString()),
        updatedAt: safeText(record.updatedAt || record.createdAt, new Date().toISOString()),
      };
      return Response.json({ shipment: response }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.error('Private shipment lookup failed:', error);
      return Response.json({ error: 'Tracking is temporarily unavailable. Please try again later.' }, { status: 503 });
    }
  },
};
