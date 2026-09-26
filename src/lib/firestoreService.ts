import {
  Shipment,
  Trip,
  TripStatus,
  Driver,
  Vehicle,
  Booking,
  Quote,
  Invoice,
  Payment,
  DriverExpense,
  VehicleInspection,
  VehicleIssue,
  DeliveryProof,
  DriverNotification,
  SupportTicket,
  ActivityLog,
  ContactMessage,
  WebsiteSettings,
  Customer,
  ClientNotification,
  ClientDocument,
  LogisticsService,
  LogisticsCountry,
  LogisticsRoute,
  BrandingSettings,
  WebsiteContent,
  WebsiteContentSectionKey,
  UserProfile,
  Department,
  SystemSettings,
  AuditLogEntry,
  AnimationSettings,
} from '../types';
import { db as firestore } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

// Collection names in Firestore
export const COLLECTIONS = {
  SHIPMENTS: 'shipments',
  TRIPS: 'trips',
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  TRAILERS: 'trailers',
  MAINTENANCE: 'maintenance',
  FUEL_RECORDS: 'fuelRecords',
  WAREHOUSE: 'warehouse',
  CHECKPOINTS: 'checkpoints',
  BORDER_CROSSINGS: 'borderCrossings',
  DOCUMENTS: 'documents',
  CLIENTS: 'clients',
  BOOKINGS: 'bookings',
  QUOTES: 'quotes',
  QUOTATIONS: 'quotations',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  DRIVER_EXPENSES: 'driverExpenses',
  OPERATIONAL_EXPENSES: 'expenses',
  VEHICLE_INSPECTIONS: 'vehicleInspections',
  VEHICLE_ISSUES: 'vehicleIssues',
  DELIVERY_PROOFS: 'deliveryProofs',
  DRIVER_NOTIFICATIONS: 'driverNotifications',
  SUPPORT_TICKETS: 'supportTickets',
  ACTIVITY_LOGS: 'activityLogs',
  AUDIT_LOGS: 'auditLogs',
  CONTACT_MESSAGES: 'contactMessages',
  WEBSITE_SETTINGS: 'websiteSettings',
  CUSTOMERS: 'customers',
  CLIENT_NOTIFICATIONS: 'clientNotifications',
  CLIENT_DOCUMENTS: 'clientDocuments',
  SERVICES: 'services',
  COUNTRIES: 'countries',
  ROUTES: 'routes',
  BRANDING: 'branding',
  COMPANY_SETTINGS: 'companySettings',
  ANIMATION_SETTINGS: 'websiteSettings',
  WEBSITE_CONTENT: 'websiteContent',
  USERS: 'users',
  DEPARTMENTS: 'departments',
  SYSTEM_SETTINGS: 'systemSettings',
} as const;

type CollectionKey = keyof typeof COLLECTIONS;

// Simple custom event bus for cross-component and tab sync
const SYNC_EVENT = 'kirenga_firestore_sync';

function notifySubscribers(col: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { collection: col } }));
  }
}

// Persistent Real-Time Firestore Service
// Strictly NO fake/seed data: starts empty if not populated by user/admin actions.
class FirestoreService {
  private getStorageKey(col: string): string {
    return `kcc_firestore_${col}`;
  }

  private readCollection<T>(col: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.getStorageKey(col));
      if (!data) return [];
      return JSON.parse(data) as T[];
    } catch (e) {
      console.error(`Error reading collection ${col}:`, e);
      return [];
    }
  }

  private writeCollection<T>(col: string, items: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(col), JSON.stringify(items));
      notifySubscribers(col);
    } catch (e) {
      console.error(`Error writing collection ${col}:`, e);
    }
  }

  // Subscribe to real-time changes
  public subscribe(col: string, callback: () => void): () => void {
    let firestoreUnsub: (() => void) | null = null;
    try {
      firestoreUnsub = onSnapshot(collection(firestore, col), (snap) => {
        const items: any[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id }));
        this.writeCollection(col, items);
        callback();
      }, (err) => {
        // Fallback silently if offline or rules restricted
      });
    } catch (e) {
      // ignore
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail || customEvent.detail.collection === col || customEvent.detail.collection === '*') {
        callback();
      }
    };
    window.addEventListener(SYNC_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      if (firestoreUnsub) firestoreUnsub();
      window.removeEventListener(SYNC_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }

  // Generic CRUD
  public async getAll<T extends { id: string }>(col: string): Promise<T[]> {
    try {
      const snap = await getDocs(collection(firestore, col));
      if (!snap.empty) {
        const items: T[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as T));
        this.writeCollection(col, items);
        return items;
      } else {
        // Empty in Firestore: sync local storage
        this.writeCollection(col, []);
        return [];
      }
    } catch (err) {
      // Return cached local collection if offline
      return this.readCollection<T>(col);
    }
  }

  public async getById<T extends { id: string }>(col: string, id: string): Promise<T | null> {
    try {
      const snap = await getDoc(doc(firestore, col, id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as T;
      }
    } catch (err) {
      // fallback
    }
    const items = this.readCollection<T>(col);
    return items.find((item) => item.id === id) || null;
  }

  public async add<T = any>(
    col: string,
    item: T | any
  ): Promise<T> {
    const id = item.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newItem = {
      createdAt: (item as any).createdAt || now,
      updatedAt: (item as any).updatedAt || now,
      ...item,
      id,
    } as unknown as T;

    try {
      await setDoc(doc(firestore, col, id), newItem as any);
    } catch (err) {
      console.warn(`Firestore write warning for ${col}:`, err);
    }

    const items = this.readCollection<T>(col);
    items.unshift(newItem);
    this.writeCollection(col, items);
    return newItem;
  }

  public async update<T extends { id?: string }>(col: string, id: string, updates: Partial<T> | any): Promise<T> {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(firestore, col, id), { ...updates, updatedAt: now });
    } catch (err) {
      console.warn(`Firestore update warning for ${col}:`, err);
    }

    const items = this.readCollection<T>(col);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) {
      const newItem = { id, ...updates, updatedAt: now } as unknown as T;
      items.unshift(newItem);
      this.writeCollection(col, items);
      return newItem;
    }
    const updated = { ...items[index], ...updates, updatedAt: now };
    items[index] = updated;
    this.writeCollection(col, items);
    return updated;
  }

  public async delete(col: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, col, id));
    } catch (err) {
      console.warn(`Firestore delete warning for ${col}:`, err);
    }
    const items = this.readCollection<{ id: string }>(col);
    const filtered = items.filter((i) => i.id !== id);
    this.writeCollection(col, filtered);
  }

  // --- Workforce & Users Management ---

  public async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(firestore, COLLECTIONS.USERS, uid));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id, uid: snap.id } as UserProfile;
      }
    } catch (err) {
      console.warn('Error reading user profile:', err);
    }
    const local = this.readCollection<UserProfile>(COLLECTIONS.USERS);
    return local.find((u) => u.uid === uid || u.id === uid) || null;
  }

  public async getUserByUsername(username: string): Promise<UserProfile | null> {
    const cleanUsername = username.trim().toLowerCase();
    try {
      const q = query(
        collection(firestore, COLLECTIONS.USERS),
        where('username', '==', cleanUsername)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { ...d.data(), id: d.id, uid: d.id } as UserProfile;
      }
    } catch (err) {
      console.warn('Error querying by username:', err);
    }
    const local = this.readCollection<UserProfile>(COLLECTIONS.USERS);
    return local.find((u) => u.username?.toLowerCase() === cleanUsername) || null;
  }

  public async saveUserProfile(profile: UserProfile): Promise<void> {
    const uid = profile.uid || profile.id;
    const now = new Date().toISOString();
    const docData: UserProfile = {
      ...profile,
      id: uid,
      uid,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(firestore, COLLECTIONS.USERS, uid), docData);
    } catch (err) {
      console.warn('Error saving user profile to Firestore:', err);
    }
    const items = this.readCollection<UserProfile>(COLLECTIONS.USERS);
    const idx = items.findIndex((u) => u.uid === uid);
    if (idx !== -1) items[idx] = docData;
    else items.unshift(docData);
    this.writeCollection(COLLECTIONS.USERS, items);
  }

  public async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(firestore, COLLECTIONS.USERS, uid), { ...updates, updatedAt: now });
    } catch (err) {
      console.warn('Error updating user profile in Firestore:', err);
    }
    const items = this.readCollection<UserProfile>(COLLECTIONS.USERS);
    const idx = items.findIndex((u) => u.uid === uid);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updatedAt: now };
      this.writeCollection(COLLECTIONS.USERS, items);
    }
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    return this.getAll<UserProfile>(COLLECTIONS.USERS);
  }

  public async deleteUser(uid: string): Promise<void> {
    await this.delete(COLLECTIONS.USERS, uid);
  }

  // --- Departments Management ---

  public async getDepartments(): Promise<Department[]> {
    return this.getAll<Department>(COLLECTIONS.DEPARTMENTS);
  }

  public async saveDepartment(dept: Department): Promise<Department> {
    if (dept.id) {
      return this.update<Department>(COLLECTIONS.DEPARTMENTS, dept.id, dept);
    }
    return this.add<Department>(COLLECTIONS.DEPARTMENTS, dept);
  }

  public async deleteDepartment(id: string): Promise<void> {
    await this.delete(COLLECTIONS.DEPARTMENTS, id);
  }

  // --- System Settings & Session Security ---

  public async getSystemSettings(): Promise<SystemSettings> {
    const settings = await this.getById<SystemSettings>(COLLECTIONS.SYSTEM_SETTINGS, 'general');
    if (settings) return settings;
    return {
      id: 'general',
      companyName: 'Kirenga Cargo Carriers',
      logoUrl: '',
      wallpaperUrl: '',
      phone: '+256 700 000 000',
      email: 'operations@kirengacargo.com',
      address: 'Kampala, Uganda | East & Central Africa Corridors',
      sessionTimeoutSeconds: 300, // 5 minutes default
      theme: 'navy-dark',
    };
  }

  public async updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    const current = await this.getSystemSettings();
    const updated = { ...current, ...settings, updatedAt: new Date().toISOString() };
    await this.add<SystemSettings>(COLLECTIONS.SYSTEM_SETTINGS, updated);
  }

  public async saveSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    return this.updateSystemSettings(settings);
  }

  // --- Audit Log Management ---

  public async logAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
    const now = new Date().toISOString();
    const log: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      ...entry,
    };
    await this.add(COLLECTIONS.ACTIVITY_LOGS, log);
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.ACTIVITY_LOGS),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const items: AuditLogEntry[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as AuditLogEntry));
        return items;
      }
    } catch (err) {
      // fallback
    }
    return this.getAll<AuditLogEntry>(COLLECTIONS.ACTIVITY_LOGS);
  }

  // Activity Logger
  public async logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    await this.add(COLLECTIONS.ACTIVITY_LOGS, newLog);
  }

  // --- Specific Business Operations ---

  // Tracking query: find shipment by exact shipmentNumber
  public async getShipmentByNumber(shipmentNumber: string): Promise<Shipment | null> {
    const cleaned = shipmentNumber.trim().toUpperCase();
    const shipments = await this.getAll<Shipment>(COLLECTIONS.SHIPMENTS);
    return shipments.find((s) => s.shipmentNumber.toUpperCase() === cleaned) || null;
  }

  // Create Booking — optimized for fast customer submission
  public async createBooking(data: Omit<Booking, 'id' | 'bookingReference' | 'status' | 'createdAt'>): Promise<Booking> {
    const now = Date.now();
    const year = new Date(now).getFullYear();
    // Avoid reading the entire bookings collection just to calculate a sequence number.
    // Timestamp-derived references remain unique without a database round trip.
    const bookingReference = `KCC-${year}-${String(now).slice(-6)}`;
    const booking: Booking = {
      ...data,
      id: `bk_${now}`,
      bookingReference,
      status: 'PENDING',
      createdAt: new Date(now).toISOString(),
    };

    // The booking itself is the critical operation. Return as soon as it is saved;
    // audit activity is non-critical and can be recorded in the background.
    const saved = await this.add(COLLECTIONS.BOOKINGS, booking);

    void this.logActivity({
      action: 'Booking Created',
      actor: data.fullName,
      role: 'CUSTOMER',
      relatedRecordType: 'BOOKING',
      relatedRecordId: saved.id,
      details: `New cargo booking ${bookingReference} from ${data.pickupLocation} to ${data.deliveryLocation}`,
    }).catch((err) => {
      console.warn('Booking activity log failed without blocking the booking:', err);
    });

    return saved;
  }

  // Convert Booking into Shipment or Create Direct Shipment
  public async createShipment(
    data: Omit<Shipment, 'id' | 'shipmentNumber' | 'status' | 'timeline' | 'createdAt' | 'updatedAt'>,
    options?: { bookingId?: string }
  ): Promise<Shipment> {
    const count = (await this.getAll<Shipment>(COLLECTIONS.SHIPMENTS)).length + 1;
    const year = new Date().getFullYear();
    const shipmentNumber = `KCC-${year}-${String(count).padStart(6, '0')}`;
    const now = new Date().toISOString();

    const shipment: Shipment = {
      ...data,
      id: `sh_${Date.now()}`,
      shipmentNumber,
      bookingId: options?.bookingId,
      status: 'CONFIRMED',
      timeline: [
        {
          stage: 'Booking Created',
          timestamp: now,
          completed: true,
          notes: 'Shipment registered in Kirenga logistics system.',
        },
        {
          stage: 'Confirmed',
          timestamp: now,
          completed: true,
          notes: 'Logistics coordination verified.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.add(COLLECTIONS.SHIPMENTS, shipment);

    if (options?.bookingId) {
      await this.update<Booking>(COLLECTIONS.BOOKINGS, options.bookingId, {
        status: 'CONFIRMED',
      });
    }

    await this.logActivity({
      action: 'Shipment Created',
      actor: 'Admin/Operations',
      role: 'ADMIN',
      relatedRecordType: 'SHIPMENT',
      relatedRecordId: saved.id,
      details: `Created shipment ${shipmentNumber} for ${data.customerName}`,
    });

    return saved;
  }

  // Dispatch Management: Assign Driver + Vehicle to Shipment
  public async createTrip(params: {
    shipmentId: string;
    driverId: string;
    vehicleId: string;
    scheduledPickupDate: string;
    expectedDeliveryDate?: string;
    specialInstructions?: string;
  }): Promise<Trip> {
    return this.createDispatch({
      ...params,
      expectedDeliveryDate: params.expectedDeliveryDate || '',
    });
  }

  public async createDispatch(params: {
    shipmentId: string;
    driverId: string;
    vehicleId: string;
    scheduledPickupDate: string;
    expectedDeliveryDate: string;
    specialInstructions?: string;
  }): Promise<Trip> {
    const shipment = await this.getById<Shipment>(COLLECTIONS.SHIPMENTS, params.shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const driver = await this.getById<Driver>(COLLECTIONS.DRIVERS, params.driverId);
    if (!driver) throw new Error('Driver not found');

    const vehicle = await this.getById<Vehicle>(COLLECTIONS.VEHICLES, params.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    // Prevent conflicting assignment
    if (driver.status === 'ON_TRIP' || driver.status === 'SUSPENDED') {
      throw new Error(`Driver ${driver.fullName} is currently ${driver.status} and cannot be assigned`);
    }
    if (vehicle.status === 'IN_TRANSIT' || vehicle.status === 'MAINTENANCE') {
      throw new Error(`Vehicle ${vehicle.registrationNumber} is currently ${vehicle.status} and cannot be assigned`);
    }

    const trips = await this.getAll<Trip>(COLLECTIONS.TRIPS);
    const year = new Date().getFullYear();
    const tripReference = `KCC-TRIP-${year}-${String(trips.length + 1).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const trip: Trip = {
      id: `trip_${Date.now()}`,
      tripReference,
      shipmentId: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      driverId: driver.id,
      driverName: driver.fullName,
      vehicleId: vehicle.id,
      vehicleReg: vehicle.registrationNumber,
      customerName: shipment.customerName,
      pickupLocation: `${shipment.originCity}, ${shipment.originCountry}`,
      deliveryLocation: `${shipment.destinationCity}, ${shipment.destinationCountry}`,
      cargoType: shipment.cargoType,
      cargoDescription: shipment.cargoDescription,
      cargoWeightKg: shipment.weightKg,
      status: 'ASSIGNED',
      scheduledPickupDate: params.scheduledPickupDate,
      expectedDeliveryDate: params.expectedDeliveryDate,
      specialInstructions: params.specialInstructions,
      createdAt: now,
      updatedAt: now,
    };

    const savedTrip = await this.add(COLLECTIONS.TRIPS, trip);

    // Update Shipment
    const updatedTimeline = [...shipment.timeline];
    updatedTimeline.push({
      stage: 'Vehicle Assigned',
      timestamp: now,
      completed: true,
      notes: `Assigned to Driver ${driver.fullName} with Vehicle ${vehicle.registrationNumber}`,
    });

    await this.update<Shipment>(COLLECTIONS.SHIPMENTS, shipment.id, {
      status: 'ASSIGNED',
      assignedDriverId: driver.id,
      assignedDriverName: driver.fullName,
      assignedVehicleId: vehicle.id,
      assignedVehicleReg: vehicle.registrationNumber,
      assignedTripId: savedTrip.id,
      expectedDelivery: params.expectedDeliveryDate,
      timeline: updatedTimeline,
    });

    // Update Driver & Vehicle status
    await this.update<Driver>(COLLECTIONS.DRIVERS, driver.id, {
      status: 'ON_TRIP',
      activeTripId: savedTrip.id,
      assignedVehicleId: vehicle.id,
      assignedVehicleReg: vehicle.registrationNumber,
    });

    await this.update<Vehicle>(COLLECTIONS.VEHICLES, vehicle.id, {
      status: 'ASSIGNED',
      assignedDriverId: driver.id,
      assignedDriverName: driver.fullName,
    });

    // Send driver notification
    await this.add<DriverNotification>(COLLECTIONS.DRIVER_NOTIFICATIONS, {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      driverId: driver.id,
      title: 'New Trip Assigned',
      message: `You have been assigned trip ${tripReference} for shipment ${shipment.shipmentNumber} to ${trip.deliveryLocation}.`,
      type: 'TRIP',
      read: false,
      tripId: savedTrip.id,
      createdAt: now,
    });

    // Send client notification
    if (shipment.customerName || shipment.customerEmail) {
      await this.add<ClientNotification>(COLLECTIONS.CLIENT_NOTIFICATIONS, {
        id: `cnotif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        customerId: shipment.customerName,
        title: 'Carrier Dispatched',
        message: `Carrier ${vehicle.registrationNumber} (Driver: ${driver.fullName}) assigned to your shipment ${shipment.shipmentNumber}.`,
        type: 'SHIPMENT',
        read: false,
        relatedShipmentNumber: shipment.shipmentNumber,
        createdAt: now,
      });
    }

    // Log Activity
    await this.logActivity({
      action: 'Dispatch Created',
      actor: 'Admin/Operations',
      role: 'OPERATIONS',
      relatedRecordType: 'TRIP',
      relatedRecordId: savedTrip.id,
      details: `Dispatched trip ${tripReference} to driver ${driver.fullName} with vehicle ${vehicle.registrationNumber}`,
    });

    return savedTrip;
  }

  // Driver Action 1: Accept Trip or Request Review
  public async driverAcceptTrip(tripId: string, driverId: string): Promise<Trip> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, tripId);
    if (!trip || trip.driverId !== driverId) throw new Error('Trip not found or unauthorized');
    if (trip.status !== 'ASSIGNED') throw new Error(`Cannot accept trip with status ${trip.status}`);

    const now = new Date().toISOString();
    const updated = await this.update<Trip>(COLLECTIONS.TRIPS, tripId, {
      status: 'ACCEPTED',
    });

    // Activity
    await this.logActivity({
      action: 'Trip Accepted',
      actor: trip.driverName,
      role: 'DRIVER',
      relatedRecordType: 'TRIP',
      relatedRecordId: tripId,
      details: `Driver accepted trip ${trip.tripReference}`,
    });

    return updated;
  }

  public async driverRequestReview(tripId: string, driverId: string, reason: string): Promise<Trip> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, tripId);
    if (!trip || trip.driverId !== driverId) throw new Error('Trip not found or unauthorized');

    const updated = await this.update<Trip>(COLLECTIONS.TRIPS, tripId, {
      reviewRequested: true,
      reviewReason: reason,
    });

    await this.logActivity({
      action: 'Trip Review Requested',
      actor: trip.driverName,
      role: 'DRIVER',
      relatedRecordType: 'TRIP',
      relatedRecordId: tripId,
      details: `Driver requested review for trip ${trip.tripReference}. Reason: ${reason}`,
    });

    return updated;
  }

  public async updateTripStatus(params: {
    tripId: string;
    status: TripStatus;
    actorName?: string;
    notes?: string;
  }): Promise<Trip> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, params.tripId);
    if (!trip) throw new Error('Trip not found');

    const updated = await this.update<Trip>(COLLECTIONS.TRIPS, params.tripId, {
      status: params.status,
    });

    await this.logActivity({
      action: `Trip Status Updated to ${params.status}`,
      actor: params.actorName || 'Driver',
      role: 'DRIVER',
      relatedRecordType: 'TRIP',
      relatedRecordId: params.tripId,
      details: params.notes || `Trip status updated to ${params.status}`,
    });

    return updated;
  }

  // Driver Action 2: Arrive at Pickup
  public async driverArriveAtPickup(tripId: string, driverId: string): Promise<Trip> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, tripId);
    if (!trip || trip.driverId !== driverId) throw new Error('Trip not found or unauthorized');
    if (trip.status !== 'ACCEPTED') throw new Error(`Cannot arrive at pickup from status ${trip.status}`);

    const now = new Date().toISOString();
    const updated = await this.update<Trip>(COLLECTIONS.TRIPS, tripId, {
      status: 'AT_PICKUP',
      arrivalAtPickupTimestamp: now,
    });

    const shipment = await this.getById<Shipment>(COLLECTIONS.SHIPMENTS, trip.shipmentId);
    if (shipment) {
      const timeline = [...shipment.timeline];
      timeline.push({
        stage: 'Driver Arrived at Pickup',
        timestamp: now,
        completed: true,
        notes: 'Vehicle arrived at pickup location for loading.',
        location: trip.pickupLocation,
      });
      await this.update<Shipment>(COLLECTIONS.SHIPMENTS, shipment.id, {
        status: 'ASSIGNED',
        timeline,
      });
    }

    await this.logActivity({
      action: 'Arrived at Pickup',
      actor: trip.driverName,
      role: 'DRIVER',
      relatedRecordType: 'TRIP',
      relatedRecordId: tripId,
      details: `Driver arrived at pickup location for trip ${trip.tripReference}`,
    });

    return updated;
  }

  // Driver Action 3: Start Loading & Confirm Loading
  public async driverConfirmLoading(tripId: string, driverId: string, loadingNotes?: string): Promise<Trip> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, tripId);
    if (!trip || trip.driverId !== driverId) throw new Error('Trip not found or unauthorized');
    if (trip.status !== 'AT_PICKUP' && trip.status !== 'LOADING') {
      throw new Error(`Cannot confirm loading from status ${trip.status}`);
    }

    const now = new Date().toISOString();
    const updated = await this.update<Trip>(COLLECTIONS.TRIPS, tripId, {
      status: 'LOADING',
      loadingConfirmedTimestamp: now,
      loadingNotes,
    });

    const shipment = await this.getById<Shipment>(COLLECTIONS.SHIPMENTS, trip.shipmentId);
    if (shipment) {
      const timeline = [...shipment.timeline];
      timeline.push({
        stage: 'Loading Completed',
        timestamp: now,
        completed: true,
        notes: loadingNotes || 'Cargo inspected and verified on vehicle.',
      });
      await this.update<Shipment>(COLLECTIONS.SHIPMENTS, shipment.id, {
        status: 'LOADING',
        timeline,
      });
    }

    // Update vehicle to LOADING
    await this.update<Vehicle>(COLLECTIONS.VEHICLES, trip.vehicleId, {
      status: 'LOADING',
    });

    await this.logActivity({
      action: 'Loading Confirmed',
      actor: trip.driverName,
      role: 'DRIVER',
      relatedRecordType: 'TRIP',
      relatedRecordId: tripId,
      details: `Driver confirmed cargo loaded for trip ${trip.tripReference}`,
    });

    return updated;
  }

  // Driver Action 4: Depart / Start Trip (Shipment becomes IN_TRANSIT)
  public async driverStartTrip(tripId: string, driverId: string): Promise<Trip> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, tripId);
    if (!trip || trip.driverId !== driverId) throw new Error('Trip not found or unauthorized');
    if (trip.status !== 'LOADING' && trip.status !== 'DEPARTED') {
      throw new Error(`Cannot start trip from status ${trip.status}`);
    }

    const now = new Date().toISOString();
    const updated = await this.update<Trip>(COLLECTIONS.TRIPS, tripId, {
      status: 'IN_TRANSIT',
      departedTimestamp: now,
    });

    const shipment = await this.getById<Shipment>(COLLECTIONS.SHIPMENTS, trip.shipmentId);
    if (shipment) {
      const timeline = [...shipment.timeline];
      timeline.push({
        stage: 'Dispatched & In Transit',
        timestamp: now,
        completed: true,
        notes: `Carrier en route to ${trip.deliveryLocation}.`,
      });
      await this.update<Shipment>(COLLECTIONS.SHIPMENTS, shipment.id, {
        status: 'IN_TRANSIT',
        timeline,
      });
    }

    await this.update<Vehicle>(COLLECTIONS.VEHICLES, trip.vehicleId, {
      status: 'IN_TRANSIT',
    });

    await this.logActivity({
      action: 'Trip Started (In Transit)',
      actor: trip.driverName,
      role: 'DRIVER',
      relatedRecordType: 'TRIP',
      relatedRecordId: tripId,
      details: `Trip ${trip.tripReference} departed. Shipment ${trip.shipmentNumber} is now IN_TRANSIT.`,
    });

    return updated;
  }

  // Driver Action 5: Arrive at Destination
  public async driverArriveAtDestination(tripId: string, driverId: string): Promise<Trip> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, tripId);
    if (!trip || trip.driverId !== driverId) throw new Error('Trip not found or unauthorized');
    if (trip.status !== 'IN_TRANSIT') throw new Error(`Cannot arrive at destination from status ${trip.status}`);

    const now = new Date().toISOString();
    const updated = await this.update<Trip>(COLLECTIONS.TRIPS, tripId, {
      status: 'ARRIVED',
      arrivedAtDestTimestamp: now,
    });

    const shipment = await this.getById<Shipment>(COLLECTIONS.SHIPMENTS, trip.shipmentId);
    if (shipment) {
      const timeline = [...shipment.timeline];
      timeline.push({
        stage: 'Arrived at Destination',
        timestamp: now,
        completed: true,
        notes: `Carrier arrived at destination ${trip.deliveryLocation}. Ready for delivery handover.`,
      });
      await this.update<Shipment>(COLLECTIONS.SHIPMENTS, shipment.id, {
        status: 'OUT_FOR_DELIVERY',
        timeline,
      });
    }

    await this.logActivity({
      action: 'Arrived at Destination',
      actor: trip.driverName,
      role: 'DRIVER',
      relatedRecordType: 'TRIP',
      relatedRecordId: tripId,
      details: `Trip ${trip.tripReference} arrived at destination ${trip.deliveryLocation}`,
    });

    return updated;
  }

  // Driver Action 6: Submit Proof of Delivery (DELIVERED!)
  public async driverSubmitPOD(params: {
    tripId: string;
    driverId: string;
    recipientName: string;
    recipientPhone?: string;
    signatureDataUrl?: string;
    deliveryNotes?: string;
    photoName?: string;
    photoData?: string;
  }): Promise<DeliveryProof> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, params.tripId);
    if (!trip || trip.driverId !== params.driverId) throw new Error('Trip not found or unauthorized');
    if (trip.status !== 'ARRIVED') throw new Error(`Cannot complete delivery from status ${trip.status}`);
    if (!params.recipientName.trim()) throw new Error('Recipient name is required');

    // Duplicate check
    const existing = await this.getAll<DeliveryProof>(COLLECTIONS.DELIVERY_PROOFS);
    if (existing.some((p) => p.tripId === params.tripId)) {
      throw new Error('Proof of delivery has already been submitted for this trip');
    }

    const now = new Date().toISOString();
    const proof: DeliveryProof = {
      id: `pod_${Date.now()}`,
      tripId: trip.id,
      shipmentId: trip.shipmentId,
      shipmentNumber: trip.shipmentNumber,
      driverId: params.driverId,
      recipientName: params.recipientName.trim(),
      recipientPhone: params.recipientPhone?.trim(),
      recipientConfirmation: true,
      signatureDataUrl: params.signatureDataUrl,
      deliveryNotes: params.deliveryNotes?.trim(),
      photoName: params.photoName,
      photoData: params.photoData,
      deliveredAt: now,
      validationStatus: 'VERIFIED',
    };

    const savedProof = await this.add(COLLECTIONS.DELIVERY_PROOFS, proof);

    // Update trip to DELIVERED
    await this.update<Trip>(COLLECTIONS.TRIPS, trip.id, {
      status: 'DELIVERED',
      deliveredTimestamp: now,
    });

    // Update shipment to DELIVERED
    const shipment = await this.getById<Shipment>(COLLECTIONS.SHIPMENTS, trip.shipmentId);
    if (shipment) {
      const timeline = [...shipment.timeline];
      timeline.push({
        stage: 'Delivered',
        timestamp: now,
        completed: true,
        notes: `Cargo delivered successfully to ${params.recipientName}. Signed & verified.`,
      });
      await this.update<Shipment>(COLLECTIONS.SHIPMENTS, shipment.id, {
        status: 'DELIVERED',
        actualDelivery: now,
        timeline,
      });

      // Send real-time client notification
      await this.add<ClientNotification>(COLLECTIONS.CLIENT_NOTIFICATIONS, {
        id: `cnotif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        customerId: shipment.customerName,
        title: 'Consignment Successfully Delivered',
        message: `Shipment ${shipment.shipmentNumber} has been delivered to ${params.recipientName}. Signed Proof of Delivery is now accessible in your documents.`,
        type: 'DELIVERY',
        read: false,
        relatedShipmentNumber: shipment.shipmentNumber,
        createdAt: now,
      });

      // Add Client Document for verified Proof of Delivery
      await this.add<ClientDocument>(COLLECTIONS.CLIENT_DOCUMENTS, {
        id: `cdoc_${Date.now()}`,
        customerId: shipment.customerName,
        title: `Proof of Delivery - ${shipment.shipmentNumber}`,
        documentType: 'PROOF_OF_DELIVERY',
        relatedShipmentNumber: shipment.shipmentNumber,
        fileName: `POD_${shipment.shipmentNumber}.pdf`,
        fileSize: '1.4 MB',
        uploadedAt: now,
        verified: true,
      });
    }

    // Free up driver and vehicle
    await this.update<Driver>(COLLECTIONS.DRIVERS, trip.driverId, {
      status: 'AVAILABLE',
      activeTripId: undefined,
    });

    await this.update<Vehicle>(COLLECTIONS.VEHICLES, trip.vehicleId, {
      status: 'AVAILABLE',
      assignedDriverId: undefined,
      assignedDriverName: undefined,
    });

    await this.logActivity({
      action: 'Delivery Completed',
      actor: trip.driverName,
      role: 'DRIVER',
      relatedRecordType: 'SHIPMENT',
      relatedRecordId: trip.shipmentId,
      details: `Delivery completed for shipment ${trip.shipmentNumber}. Handed over to ${params.recipientName}`,
    });

    return savedProof;
  }

  // Driver Action 7: Report Delivery Exception
  public async driverReportDeliveryIssue(params: {
    tripId: string;
    driverId: string;
    reason: string;
    notes: string;
  }): Promise<Trip> {
    const trip = await this.getById<Trip>(COLLECTIONS.TRIPS, params.tripId);
    if (!trip || trip.driverId !== params.driverId) throw new Error('Trip not found or unauthorized');

    const now = new Date().toISOString();
    const updated = await this.update<Trip>(COLLECTIONS.TRIPS, params.tripId, {
      deliveryExceptionReason: params.reason,
      deliveryExceptionNotes: params.notes,
    });

    const shipment = await this.getById<Shipment>(COLLECTIONS.SHIPMENTS, trip.shipmentId);
    if (shipment) {
      const timeline = [...shipment.timeline];
      timeline.push({
        stage: 'Delivery Exception',
        timestamp: now,
        completed: false,
        notes: `Exception: ${params.reason}. ${params.notes}`,
      });
      await this.update<Shipment>(COLLECTIONS.SHIPMENTS, shipment.id, {
        status: 'DELIVERY_EXCEPTION',
        timeline,
      });
    }

    await this.logActivity({
      action: 'Delivery Exception Reported',
      actor: trip.driverName,
      role: 'DRIVER',
      relatedRecordType: 'TRIP',
      relatedRecordId: params.tripId,
      details: `Delivery issue on trip ${trip.tripReference}: ${params.reason} - ${params.notes}`,
    });

    return updated;
  }

  // Pre-trip Inspection
  public async submitVehicleInspection(inspection: Omit<VehicleInspection, 'id' | 'timestamp'>): Promise<VehicleInspection> {
    const newInspection: VehicleInspection = {
      ...inspection,
      id: `insp_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const saved = await this.add(COLLECTIONS.VEHICLE_INSPECTIONS, newInspection);
    await this.logActivity({
      action: 'Pre-trip Vehicle Inspection',
      actor: 'Driver',
      role: 'DRIVER',
      relatedRecordType: 'VEHICLE',
      relatedRecordId: inspection.vehicleId,
      details: `Pre-trip check ${newInspection.passedOverall ? 'PASSED' : 'FAILED with issues'}`,
    });
    return saved;
  }

  // Vehicle Issue
  public async submitVehicleIssue(issue: Omit<VehicleIssue, 'id' | 'createdAt' | 'status'>): Promise<VehicleIssue> {
    const newIssue: VehicleIssue = {
      ...issue,
      id: `viss_${Date.now()}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    const saved = await this.add(COLLECTIONS.VEHICLE_ISSUES, newIssue);
    await this.logActivity({
      action: `Vehicle Problem Reported (${issue.severity})`,
      actor: 'Driver',
      role: 'DRIVER',
      relatedRecordType: 'VEHICLE',
      relatedRecordId: issue.vehicleId,
      details: `${issue.category}: ${issue.description}`,
    });
    return saved;
  }

  // Driver Expense
  public async submitDriverExpense(expense: Omit<DriverExpense, 'id' | 'status' | 'createdAt'>): Promise<DriverExpense> {
    const newExpense: DriverExpense = {
      ...expense,
      id: `exp_${Date.now()}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    const saved = await this.add(COLLECTIONS.DRIVER_EXPENSES, newExpense);
    await this.logActivity({
      action: 'Expense Submitted',
      actor: 'Driver',
      role: 'DRIVER',
      relatedRecordType: 'EXPENSE',
      relatedRecordId: saved.id,
      details: `${expense.category} - ${expense.currency} ${expense.amount}`,
    });
    return saved;
  }

  // Support Tickets
  public async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<SupportTicket> {
    const count = (await this.getAll<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS)).length + 1;
    const year = new Date().getFullYear();
    const ticketNumber = `KCC-TCK-${year}-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newTicket: SupportTicket = {
      ...ticket,
      id: `tck_${Date.now()}`,
      ticketNumber,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          sender: ticket.requesterName,
          role: ticket.requesterRole,
          message: ticket.description,
          timestamp: now,
        },
      ],
    };

    const saved = await this.add(COLLECTIONS.SUPPORT_TICKETS, newTicket);
    await this.logActivity({
      action: 'Support Ticket Created',
      actor: ticket.requesterName,
      role: ticket.requesterRole,
      relatedRecordType: 'SUPPORT',
      relatedRecordId: saved.id,
      details: `Ticket ${ticketNumber}: ${ticket.subject} (${ticket.category})`,
    });
    return saved;
  }

  // Contact Form Submission
  public async submitContactMessage(message: Omit<ContactMessage, 'id' | 'status' | 'createdAt'>): Promise<ContactMessage> {
    const msg: ContactMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    const saved = await this.add(COLLECTIONS.CONTACT_MESSAGES, msg);
    await this.logActivity({
      action: 'Contact Message Received',
      actor: message.name,
      role: 'CUSTOMER',
      relatedRecordType: 'BOOKING',
      relatedRecordId: saved.id,
      details: `Message from ${message.email}: ${message.subject}`,
    });
    return saved;
  }

  // --- Client & Customer Portal Methods ---
  public async getAuthorizedCustomers(): Promise<Customer[]> {
    return this.getAll<Customer>(COLLECTIONS.CUSTOMERS);
  }

  // Convert Booking directly to Shipment
  public async confirmBookingToShipment(bookingId: string, actorName = 'Operations Central Desk'): Promise<Shipment> {
    const booking = await this.getById<Booking>(COLLECTIONS.BOOKINGS, bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    const shipment = await this.createShipment(
      {
        customerName: booking.fullName,
        customerEmail: booking.email,
        customerPhone: booking.phone,
        originCountry: booking.pickupCountry,
        originCity: booking.pickupLocation,
        destinationCountry: booking.deliveryCountry,
        destinationCity: booking.deliveryLocation,
        cargoType: booking.cargoType,
        cargoDescription: booking.cargoDescription,
        weightKg: booking.weightKg,
        quantity: booking.quantity,
        dimensions: booking.dimensions,
        pickupDate: booking.pickupDate,
        specialInstructions: booking.specialInstructions,
      },
      { bookingId: booking.id }
    );

    await this.logActivity({
      action: 'Booking Confirmed to Shipment',
      actor: actorName,
      role: 'OPERATIONS',
      relatedRecordType: 'BOOKING',
      relatedRecordId: bookingId,
      details: `Booking ${booking.bookingReference} confirmed and converted to Shipment ${shipment.shipmentNumber}`,
    });

    return shipment;
  }

  // --- CMS Content, Services, Countries, Routes, and Branding ---
  public async getServices(): Promise<LogisticsService[]> {
    const list = await this.getAll<LogisticsService>(COLLECTIONS.SERVICES);
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public async getCountries(): Promise<LogisticsCountry[]> {
    const list = await this.getAll<LogisticsCountry>(COLLECTIONS.COUNTRIES);
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public async getRoutes(): Promise<LogisticsRoute[]> {
    const list = await this.getAll<LogisticsRoute>(COLLECTIONS.ROUTES);
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public async getBranding(): Promise<BrandingSettings | null> {
    const list = await this.getAll<BrandingSettings>(COLLECTIONS.BRANDING);
    if (list.length > 0) return list[0];
    const companyList = await this.getAll<any>(COLLECTIONS.COMPANY_SETTINGS);
    if (companyList.length > 0) {
      return {
        id: companyList[0].id || 'branding_main',
        companyName: companyList[0].companyName || 'KIRENGA CARGO CARRIERS',
        tagline: companyList[0].tagline || 'Reliable Cargo Transportation Across East Africa and Beyond',
        logoUrl: companyList[0].logoUrl,
        logoStoragePath: companyList[0].logoStoragePath,
        logoVersion: companyList[0].logoVersion,
        faviconUrl: companyList[0].faviconUrl,
        logoSize: companyList[0].logoSize || 48,
        logoPosition: companyList[0].logoPosition || 'left',
        darkLogoUrl: companyList[0].darkLogoUrl,
        lightLogoUrl: companyList[0].lightLogoUrl,
        createdAt: companyList[0].createdAt || new Date().toISOString(),
        updatedAt: companyList[0].updatedAt || new Date().toISOString(),
      };
    }
    return null;
  }

  public async saveBranding(branding: Partial<BrandingSettings>): Promise<BrandingSettings> {
    const existing = await this.getBranding();
    const now = new Date().toISOString();
    let saved: BrandingSettings;
    if (existing) {
      saved = await this.update<BrandingSettings>(COLLECTIONS.BRANDING, existing.id, {
        ...branding,
        updatedAt: now,
      });
    } else {
      saved = await this.add<BrandingSettings>(COLLECTIONS.BRANDING, {
        ...branding,
        id: 'branding_main',
        createdAt: now,
        updatedAt: now,
      });
    }
    // Also sync to companySettings/company as required
    await this.update<any>(COLLECTIONS.COMPANY_SETTINGS, 'company', {
      ...branding,
      id: 'company',
      updatedAt: now,
    });
    return saved;
  }

  public async getAnimationSettings(): Promise<AnimationSettings> {
    const list = await this.getAll<AnimationSettings>(COLLECTIONS.ANIMATION_SETTINGS);
    const existing = list.find((s) => s.id === 'animations') || list[0];
    if (existing) return existing;
    return {
      id: 'animations',
      heroAnimationEnabled: true,
      truckAnimationEnabled: true,
      routeAnimationEnabled: true,
      scrollAnimationsEnabled: true,
      animationSpeed: 'normal',
      animationIntensity: 'moderate',
      reducedMotionFallback: 'auto',
      loadingAnimationEnabled: true,
      backgroundAnimationEnabled: true,
      updatedAt: new Date().toISOString(),
    };
  }

  public async saveAnimationSettings(settings: Partial<AnimationSettings>): Promise<AnimationSettings> {
    const current = await this.getAnimationSettings();
    const now = new Date().toISOString();
    const merged: AnimationSettings = {
      ...current,
      ...settings,
      id: 'animations',
      updatedAt: now,
    };
    return this.update<AnimationSettings>(COLLECTIONS.ANIMATION_SETTINGS, 'animations', merged);
  }

  public async getWebsiteContent(sectionKey: WebsiteContentSectionKey): Promise<WebsiteContent | null> {
    const all = await this.getAll<WebsiteContent>(COLLECTIONS.WEBSITE_CONTENT);
    return all.find((c) => c.sectionKey === sectionKey) || null;
  }

  public async saveWebsiteContent(
    sectionKey: WebsiteContentSectionKey,
    title: string,
    content: Record<string, any>,
    subtitle?: string,
    metaDescription?: string
  ): Promise<WebsiteContent> {
    const existing = await this.getWebsiteContent(sectionKey);
    const now = new Date().toISOString();
    if (existing) {
      return this.update<WebsiteContent>(COLLECTIONS.WEBSITE_CONTENT, existing.id, {
        title,
        subtitle,
        content,
        metaDescription,
        updatedAt: now,
      });
    } else {
      return this.add<WebsiteContent>(COLLECTIONS.WEBSITE_CONTENT, {
        id: `content_${sectionKey}`,
        sectionKey,
        title,
        subtitle,
        content,
        metaDescription,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // --- User Profiles & Access Control ---
  public async getUsers(): Promise<UserProfile[]> {
    return this.getAll<UserProfile>(COLLECTIONS.USERS);
  }

  public async getUserByUid(uid: string): Promise<UserProfile | null> {
    const all = await this.getAll<UserProfile>(COLLECTIONS.USERS);
    return all.find((u) => u.uid === uid) || null;
  }

  public async createUserProfile(user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const now = new Date().toISOString();
    return this.add<UserProfile>(COLLECTIONS.USERS, {
      ...user,
      id: user.uid,
      createdAt: now,
      updatedAt: now,
    });
  }

  public async acceptQuote(quoteId: string, customerName: string): Promise<Quote> {
    const updated = await this.update<Quote>(COLLECTIONS.QUOTES, quoteId, {
      status: 'ACCEPTED',
    });
    await this.logActivity({
      action: 'Quotation Accepted by Customer',
      actor: customerName,
      role: 'CUSTOMER',
      relatedRecordType: 'BOOKING',
      relatedRecordId: quoteId,
      details: `${customerName} accepted logistics quotation ${updated.quoteReference}`,
    });
    await this.add<ClientNotification>(COLLECTIONS.CLIENT_NOTIFICATIONS, {
      id: `cnotif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerId: customerName,
      title: 'Quotation Accepted',
      message: `You accepted quote ${updated.quoteReference} (Total: ${updated.currency} ${updated.total.toLocaleString()}). Operations will prepare shipment booking.`,
      type: 'QUOTE',
      read: false,
      createdAt: new Date().toISOString(),
    });
    return updated;
  }

  public async rejectQuote(quoteId: string, customerName: string, reason?: string): Promise<Quote> {
    const updated = await this.update<Quote>(COLLECTIONS.QUOTES, quoteId, {
      status: 'REJECTED',
    });
    await this.logActivity({
      action: 'Quotation Rejected by Customer',
      actor: customerName,
      role: 'CUSTOMER',
      relatedRecordType: 'BOOKING',
      relatedRecordId: quoteId,
      details: `${customerName} declined quotation ${updated.quoteReference}. Reason: ${reason || 'Terms not acceptable'}`,
    });
    return updated;
  }

  public async payInvoice(params: {
    invoiceId: string;
    invoiceReference: string;
    shipmentNumber?: string;
    customerName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
  }): Promise<{ payment: Payment; invoice: Invoice }> {
    const now = new Date().toISOString();
    const txnRef = `KCC-TXN-${Date.now().toString().slice(-6)}`;
    
    // 1. Create Payment record
    const payment: Payment = {
      id: `pay_${Date.now()}`,
      transactionReference: txnRef,
      invoiceId: params.invoiceId,
      invoiceReference: params.invoiceReference,
      shipmentId: params.shipmentNumber,
      customerName: params.customerName,
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      status: 'SUCCESS',
      timestamp: now,
      notes: `Settled online via ${params.paymentMethod}`,
    };
    const savedPayment = await this.add(COLLECTIONS.PAYMENTS, payment);

    // 2. Update Invoice to SUCCESS / PAID
    const updatedInvoice = await this.update<Invoice>(COLLECTIONS.INVOICES, params.invoiceId, {
      status: 'SUCCESS',
    });

    // 3. Client notification
    await this.add<ClientNotification>(COLLECTIONS.CLIENT_NOTIFICATIONS, {
      id: `cnotif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerId: params.customerName,
      title: 'Payment Confirmed & Receipt Issued',
      message: `Payment of ${params.currency} ${params.amount.toLocaleString()} for invoice ${params.invoiceReference} was successfully confirmed (Txn: ${txnRef}).`,
      type: 'PAYMENT',
      read: false,
      relatedShipmentNumber: params.shipmentNumber,
      createdAt: now,
    });

    // 4. Log Activity
    await this.logActivity({
      action: 'Invoice Paid',
      actor: params.customerName,
      role: 'CUSTOMER',
      relatedRecordType: 'INVOICE',
      relatedRecordId: params.invoiceId,
      details: `Settled invoice ${params.invoiceReference} for ${params.currency} ${params.amount.toLocaleString()} via ${params.paymentMethod}`,
    });

    return { payment: savedPayment, invoice: updatedInvoice };
  }

  public async markClientNotificationAsRead(id: string): Promise<void> {
    await this.update<ClientNotification>(COLLECTIONS.CLIENT_NOTIFICATIONS, id, {
      read: true,
    });
  }

  public async markAllClientNotificationsAsRead(customerId: string): Promise<void> {
    const all = await this.getAll<ClientNotification>(COLLECTIONS.CLIENT_NOTIFICATIONS);
    for (const notif of all) {
      if (!notif.read && (notif.customerId === customerId || notif.customerId === '*')) {
        await this.update<ClientNotification>(COLLECTIONS.CLIENT_NOTIFICATIONS, notif.id, {
          read: true,
        });
      }
    }
  }
}

export const db = new FirestoreService();

