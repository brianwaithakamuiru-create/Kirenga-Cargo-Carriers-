import express from 'express';
import crypto from 'node:crypto';
import { adminDb } from './firebaseAdmin';

const app = express();
app.use(express.json({ limit: '1mb' }));

const hash = (value: string) => crypto.createHash('sha256').update(value.trim()).digest('hex');

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'kerenga-cargo-couriers-v2', timestamp: new Date().toISOString() });
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { senderName, phone, email, origin, destination, cargoDescription, weightKg, packages } = req.body ?? {};
    if (!senderName || !phone || !origin || !destination || !cargoDescription) {
      return res.status(400).json({ error: 'Required booking fields are missing.' });
    }

    const year = new Date().getFullYear();
    const reference = 'KCC-' + year + '-' + crypto.randomInt(100000, 999999);
    const now = new Date().toISOString();

    await adminDb.collection('bookings').doc(reference).set({
      reference,
      senderName,
      phone,
      email: email || null,
      phoneHash: hash(phone),
      origin,
      destination,
      cargoDescription,
      weightKg: Number(weightKg || 0),
      packages: Number(packages || 1),
      status: 'PENDING',
      createdAt: now,
      updatedAt: now
    });

    await adminDb.collection('shipments').doc(reference).set({
      shipmentNumber: reference,
      trackingNumber: reference,
      origin,
      destination,
      cargoDescription,
      weightKg: Number(weightKg || 0),
      status: 'CREATED',
      timeline: [{ stage: 'CREATED', timestamp: now, completed: true }],
      createdAt: now,
      updatedAt: now
    });

    return res.status(201).json({ reference, status: 'PENDING' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to create booking.' });
  }
});

app.post('/api/track', async (req, res) => {
  try {
    const { trackingNumber, phone } = req.body ?? {};
    if (!trackingNumber || !phone) {
      return res.status(400).json({ error: 'Tracking reference and phone are required.' });
    }

    const booking = await adminDb.collection('bookings').doc(String(trackingNumber)).get();
    if (!booking.exists || booking.data()?.phoneHash !== hash(String(phone))) {
      return res.status(404).json({ error: 'Shipment could not be verified.' });
    }

    const shipment = await adminDb.collection('shipments').doc(String(trackingNumber)).get();
    if (!shipment.exists) return res.status(404).json({ error: 'Shipment record not found.' });

    const data = shipment.data()!;
    return res.json({
      trackingNumber: data.trackingNumber,
      status: data.status,
      origin: data.origin,
      destination: data.destination,
      cargoDescription: data.cargoDescription,
      weightKg: data.weightKg,
      timeline: data.timeline || [],
      updatedAt: data.updatedAt
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Tracking service unavailable.' });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log('Kerenga API listening on :' + port));
