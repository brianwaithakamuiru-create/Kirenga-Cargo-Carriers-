export type ShipmentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'BOOKED'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'LOADING'
  | 'DEPARTED'
  | 'IN_TRANSIT'
  | 'AT_CHECKPOINT'
  | 'BORDER_CUSTOMS'
  | 'ARRIVED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'DELIVERY_EXCEPTION';

export type TripStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'AT_PICKUP'
  | 'LOADING'
  | 'DEPARTED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED';

export type DriverStatus =
  | 'AVAILABLE'
  | 'ON_TRIP'
  | 'OFF_DUTY'
  | 'SUSPENDED'
  | 'INACTIVE';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'LOADING'
  | 'IN_TRANSIT'
  | 'ON_TRIP'
  | 'MAINTENANCE'
  | 'INACTIVE';

export type BookingStatus =
  | 'PENDING'
  | 'BOOKED'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'CANCELLED';

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export type InvoiceStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export type ExpenseStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type InspectionResult = 'PASS' | 'FAIL' | 'NOT_CHECKED';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ShipmentTimelineStage {
  stage: string;
  timestamp: string;
  completed: boolean;
  notes?: string;
  location?: string;
  updatedBy?: string;
  previousStatus?: string;
  newStatus?: string;
}

export type ShipmentTimelineEvent = ShipmentTimelineStage;

export interface Shipment {
  id: string;
  shipmentNumber: string; // e.g. KCC-2026-0001
  bookingId?: string;
  bookingReference?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  cargoType: string;
  cargoDescription: string;
  weightKg: number;
  quantity: number;
  dimensions?: string;
  status: ShipmentStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedVehicleId?: string;
  assignedVehicleReg?: string;
  assignedTripId?: string;
  routeDetails?: string;
  pickupDate?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  specialInstructions?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  lastLocationAddress?: string;
  checkpoints?: {
    id: string;
    name: string;
    status: 'PENDING' | 'REACHED' | 'DEPARTED';
    reachedAt?: string;
    departedAt?: string;
    location?: string;
    updatedBy?: string;
  }[];
  timeline: ShipmentTimelineStage[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GPSLocationUpdate {
  id?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  driverId: string;
  vehicleId: string;
  shipmentId: string;
  heading?: number;
  speed?: number;
  accuracy?: number;
  address?: string;
}

export interface Trip {
  id: string;
  tripReference: string; // e.g. KCC-TRIP-2026-00045
  shipmentId: string;
  shipmentNumber: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleReg: string;
  vehicleRegistration?: string;
  originCity?: string;
  originCountry?: string;
  destinationCity?: string;
  destinationCountry?: string;
  customerName: string;
  pickupLocation: string;
  deliveryLocation: string;
  cargoType: string;
  cargoDescription: string;
  cargoWeightKg: number;
  status: TripStatus;
  scheduledPickupDate: string;
  expectedDeliveryDate: string;
  specialInstructions?: string;
  reviewRequested?: boolean;
  reviewReason?: string;
  arrivalAtPickupTimestamp?: string;
  loadingConfirmedTimestamp?: string;
  loadingNotes?: string;
  departedTimestamp?: string;
  arrivedAtDestTimestamp?: string;
  deliveredTimestamp?: string;
  deliveryExceptionReason?: string;
  deliveryExceptionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  driverId: string; // internal reference e.g. KCC-DRV-01
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  assignedVehicleId?: string;
  assignedVehicleReg?: string;
  status: DriverStatus;
  activeTripId?: string;
  employmentType: 'FULL_TIME' | 'CONTRACT' | 'PER_TRIP';
  country: string;
  experienceYears?: number;
  joinedDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string; // e.g. Prime Mover, 30T Semi-Trailer, Flatbed, Box Truck, Refrigerated
  make: string;
  model: string;
  year?: number;
  capacityKg: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  status: VehicleStatus;
  insuranceExpiry?: string;
  inspectionStatus?: 'VALID' | 'PENDING' | 'EXPIRED';
  nextServiceMileage?: string;
  currentLocation?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  lastLocationAddress?: string;
  lastServiceDate?: string;
  operatingCountries?: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  bookingReference: string; // e.g. KCC-2026-000001
  shipmentNumber?: string;
  fullName: string;
  phone: string;
  email: string;
  pickupCountry: string;
  pickupLocation: string;
  deliveryCountry: string;
  deliveryLocation: string;
  cargoType: string;
  cargoDescription: string;
  weightKg: number;
  quantity: number;
  dimensions?: string;
  pickupDate: string;
  deliveryRequirements?: string;
  specialInstructions?: string;
  documentName?: string;
  documentData?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Quote {
  id: string;
  quoteReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  origin: string;
  destination: string;
  cargoType: string;
  weightKg: number;
  transportCost: number;
  additionalCharges: number;
  taxes: number;
  total: number;
  currency: 'USD' | 'KES' | 'UGX' | 'TZS' | 'RWF';
  validUntil: string;
  terms?: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceReference: string; // KCC-INV-2026-XXXXXX
  shipmentId?: string;
  shipmentNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  currency: 'USD' | 'KES' | 'UGX' | 'TZS' | 'RWF';
  dueDate: string;
  status: InvoiceStatus;
  description: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  transactionReference: string; // e.g. KCC-TXN-2026-XXXX
  invoiceId?: string;
  invoiceReference?: string;
  shipmentId?: string;
  customerName: string;
  amount: number;
  currency: string;
  paymentMethod: string; // e.g. Bank Wire / Letter of Credit / Corporate Card
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

export interface DriverExpense {
  id: string;
  driverId: string;
  tripId: string;
  tripReference?: string;
  category: 'Fuel' | 'Tolls' | 'Parking' | 'Accommodation' | 'Border Clearance' | 'Other';
  amount: number;
  currency: string;
  date: string;
  description: string;
  receiptName?: string;
  receiptData?: string;
  status: ExpenseStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VehicleInspection {
  id: string;
  tripId: string;
  driverId: string;
  vehicleId: string;
  timestamp: string;
  items: {
    brakes: InspectionResult;
    tyres: InspectionResult;
    lights: InspectionResult;
    indicators: InspectionResult;
    mirrors: InspectionResult;
    fuel: InspectionResult;
    engine: InspectionResult;
    safetyEquipment: InspectionResult;
    documents: InspectionResult;
    generalCondition: InspectionResult;
  };
  passedOverall: boolean;
  notes?: string;
}

export interface VehicleIssue {
  id: string;
  driverId: string;
  vehicleId: string;
  tripId?: string;
  category: string;
  description: string;
  severity: IssueSeverity;
  photoName?: string;
  photoData?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'REPORTED' | 'RESOLVED';
  createdAt: string;
}

export interface DeliveryProof {
  id: string;
  tripId: string;
  shipmentId: string;
  shipmentNumber: string;
  driverId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientConfirmation: boolean;
  signatureDataUrl?: string;
  deliveryNotes?: string;
  photoName?: string;
  photoData?: string;
  deliveredAt: string;
  validationStatus: 'PENDING' | 'VERIFIED';
}

export interface DriverNotification {
  id: string;
  driverId: string;
  title: string;
  message: string;
  type: 'TRIP' | 'VEHICLE' | 'EXPENSE' | 'SUPPORT' | 'SYSTEM';
  read: boolean;
  tripId?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  requesterName: string;
  requesterRole: 'CUSTOMER' | 'DRIVER';
  requesterId?: string;
  subject: string;
  category: string;
  description: string;
  relatedShipmentNumber?: string;
  status: TicketStatus;
  urgency: 'NORMAL' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  messages: {
    sender: string;
    role: string;
    message: string;
    timestamp: string;
  }[];
}

export interface ActivityLog {
  id: string;
  action: string;
  actor: string;
  role: 'ADMIN' | 'OPERATIONS' | 'DRIVER' | 'CUSTOMER' | 'SYSTEM';
  timestamp: string;
  relatedRecordType: 'SHIPMENT' | 'TRIP' | 'VEHICLE' | 'DRIVER' | 'INVOICE' | 'EXPENSE' | 'BOOKING' | 'SUPPORT' | 'CMS' | 'USER' | 'OPERATION' | 'DOCUMENT';
  relatedRecordId?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'NEW' | 'OPEN' | 'RESOLVED';
  createdAt: string;
  updatedAt?: string;
}

export interface WebsiteSettings {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  businessHours: string;
  wallpaperUrl?: string;
  wallpaperEnabled?: boolean;
  wallpaperOpacity?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Editable CMS & Branding Entities
export interface LogisticsService {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  features: string[];
  imageUrl?: string;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsCountry {
  id: string;
  name: string;
  code: string; // ISO 2/3 letter code e.g. RW, KE, UG, TZ, CD, BI, SS
  capitalCity: string;
  majorHubs: string[];
  description: string;
  active: boolean;
  displayOrder: number;
  flagUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsRoute {
  id: string;
  routeCode: string; // e.g. MBA-KGL, DAR-BUJ
  routeName: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTransitDays: number;
  borderCrossings: string[];
  active: boolean;
  displayOrder: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingSettings {
  id: string;
  companyName: string;
  tagline: string;
  logoUrl?: string;
  logoStoragePath?: string;
  logoVersion?: number;
  faviconUrl?: string;
  logoSize?: number; // 32 to 120 pixels, default 48
  logoPosition?: 'left' | 'center';
  darkLogoUrl?: string;
  lightLogoUrl?: string;
  wallpaperUrl?: string;
  loginBgUrl?: string;
  primaryColorHex?: string;
  accentColorHex?: string;
  supportPhone?: string;
  supportEmail?: string;
  emergencyHotline?: string;
  headquartersAddress?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnimationSettings {
  id: string;
  heroAnimationEnabled: boolean;
  truckAnimationEnabled: boolean;
  routeAnimationEnabled: boolean;
  scrollAnimationsEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  animationIntensity: 'subtle' | 'moderate' | 'dynamic';
  reducedMotionFallback: 'auto' | 'force_reduced' | 'force_animated';
  loadingAnimationEnabled: boolean;
  backgroundAnimationEnabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export type WebsiteContentSectionKey =
  | 'homepage'
  | 'about'
  | 'contact'
  | 'footer'
  | 'seo'
  | 'navigation'
  | 'general';

export interface WebsiteContent {
  id: string;
  sectionKey: WebsiteContentSectionKey;
  title: string;
  subtitle?: string;
  content: Record<string, any>;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | 'admin'
  | 'worker'
  | 'driver'
  | 'staff'
  | 'ADMIN'
  | 'WORKER'
  | 'DRIVER'
  | 'STAFF'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'SUPPORT'
  | 'CUSTOMER';

export type UserAccountStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'locked'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'LOCKED'
  | 'PENDING_APPROVAL';

export interface UserProfile {
  id: string;
  uid: string;
  fullName: string;
  username?: string;
  email: string;
  phone?: string;
  country?: string;
  role: UserRole;
  status: UserAccountStatus;
  department?: string;
  position?: string;
  employeeId?: string;
  jobTitle?: string;
  assignedLocation?: string;
  assignedVehicleId?: string;
  assignedVehicleReg?: string;
  assignedRoute?: string;
  driverReferenceNumber?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  emergencyContact?: string;
  employmentStatus?: string;
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  lastLoginAt?: string;
  photoUrl?: string;
  notes?: string;
  driverId?: string; // Linked driver profile if role is DRIVER
  customerId?: string; // Linked customer profile if role === 'CUSTOMER'
  workplaces?: WorkplaceType[];
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headOfDepartment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  id: string;
  companyName: string;
  logoUrl?: string;
  wallpaperUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  sessionTimeoutSeconds: number; // 20, 30, 40, 60, 300, 600
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  actorUid?: string;
  actorRole?: string;
  action: string;
  targetUid?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
  userId?: string;
  userName?: string;
  targetUserId?: string;
  details?: string;
  ip?: string;
  createdAt: string;
  updatedAt?: string;
}

export type WorkplaceType = 'public' | 'client' | 'admin' | 'operations' | 'driver' | 'finance' | 'support';

export interface Customer {
  id: string;
  customerReference: string; // e.g. KCC-CLI-001
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  accountStatus: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  tier?: 'ENTERPRISE' | 'CORPORATE' | 'STANDARD';
  taxId?: string;
  preferredCurrency?: 'USD' | 'KES' | 'UGX' | 'TZS' | 'RWF';
  createdAt: string;
  updatedAt?: string;
}

export interface ClientNotification {
  id: string;
  customerId: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'SHIPMENT' | 'QUOTE' | 'INVOICE' | 'PAYMENT' | 'DELIVERY' | 'SUPPORT' | 'SYSTEM';
  read: boolean;
  relatedShipmentNumber?: string;
  relatedBookingReference?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientDocument {
  id: string;
  customerId: string;
  title: string;
  documentType: 'PROOF_OF_DELIVERY' | 'CONSIGNMENT_NOTE' | 'COMMERCIAL_INVOICE' | 'PACKING_LIST' | 'CUSTOMS_DECLARATION' | 'INSURANCE_CERTIFICATE';
  relatedShipmentNumber?: string;
  relatedBookingReference?: string;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  verified: boolean;
  downloadUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  clientReference: string; // e.g. KCC-CLI-2026-001
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  city?: string;
  address: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED';
  notes?: string;
  taxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trailer {
  id: string;
  trailerNumber: string; // e.g. TR-KCC-09
  trailerType: 'Flatbed' | 'Lowbed' | 'Skeleton' | 'Box Trailer' | 'Tanker' | 'Refrigerated';
  make?: string;
  year?: number;
  capacityKg: number;
  lengthMeters?: number;
  axles: number;
  status: 'AVAILABLE' | 'ATTACHED' | 'MAINTENANCE' | 'INACTIVE';
  assignedVehicleId?: string;
  assignedVehicleReg?: string;
  inspectionExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  recordNumber: string; // e.g. MR-2026-004
  vehicleId: string;
  vehicleReg: string;
  serviceType: string;
  description: string;
  dateReported: string;
  assignedMechanic: string;
  estimatedCost: number;
  actualCost?: number;
  currency: string;
  status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completionDate?: string;
  notes?: string;
  documents?: { name: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface FuelRecord {
  id: string;
  receiptNumber: string;
  vehicleId: string;
  vehicleReg: string;
  driverId?: string;
  driverName?: string;
  date: string;
  fuelStation: string;
  litres: number;
  pricePerLitre: number;
  totalCost: number;
  currency: string;
  odometerKm: number;
  route?: string;
  receiptDataUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseItem {
  id: string;
  trackingNumber: string;
  cargoDescription: string;
  cargoOwner: string;
  ownerContact?: string;
  storageLocation: string;
  binReference: string;
  status: 'RECEIVED' | 'STORED' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'RELEASED';
  weightKg: number;
  packagesCount: number;
  dateReceived: string;
  expectedDispatchDate?: string;
  releaseDate?: string;
  storageCharges: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckpointRecord {
  id: string;
  checkpointName: string;
  country: string;
  location: string;
  shipmentId?: string;
  shipmentNumber?: string;
  driverId?: string;
  driverName?: string;
  vehicleReg?: string;
  arrivalTimestamp: string;
  departureTimestamp?: string;
  verificationStatus: 'PASSED' | 'FLAGGED' | 'CLEARED' | 'PENDING_DOCUMENTATION';
  inspectorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BorderCrossingRecord {
  id: string;
  borderName: string;
  originCountry: string;
  destinationCountry: string;
  shipmentNumber?: string;
  driverName?: string;
  vehicleReg?: string;
  customsDeclarationNumber?: string;
  clearanceStatus: 'QUEUED' | 'INSPECTION' | 'CLEARED' | 'HELD_AT_BORDER';
  entryTimestamp: string;
  exitTimestamp?: string;
  requiredDocuments: string[];
  officerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsDocument {
  id: string;
  title: string;
  category:
    | 'DRIVER'
    | 'VEHICLE'
    | 'CARGO'
    | 'KEBS'
    | 'CHECKPOINT'
    | 'BORDER'
    | 'INSURANCE'
    | 'LICENCE'
    | 'PERMIT'
    | 'COMPANY';
  referenceId?: string;
  referenceLabel?: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  storagePath?: string;
  fileDataUrl?: string;
  expiryDate?: string;
  notes?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  companyName?: string;
  origin: string;
  destination: string;
  cargoDescription: string;
  weightKg: number;
  baseTransportCost: number;
  fuelSurcharge: number;
  handlingCharges: number;
  customsCharges: number;
  insuranceCharges: number;
  additionalCharges: number;
  discount: number;
  total: number;
  currency: 'USD' | 'KES' | 'UGX' | 'TZS' | 'RWF';
  validUntil: string;
  terms?: string;
  notes?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export interface OperationalExpense {
  id: string;
  expenseNumber: string;
  category:
    | 'Fuel'
    | 'Repairs'
    | 'Tolls'
    | 'Parking'
    | 'Customs'
    | 'Loading'
    | 'Unloading'
    | 'Driver Allowances'
    | 'Office Expenses'
    | 'Other';
  description: string;
  amount: number;
  currency: string;
  date: string;
  linkedType?: 'VEHICLE' | 'DRIVER' | 'SHIPMENT' | 'ROUTE' | 'OPERATION';
  linkedId?: string;
  linkedLabel?: string;
  recordedBy: string;
  receiptDataUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// WORKPLACE COMMAND CENTER & THEMES (REQ 31-48)
// ----------------------------------------------------

export type WorkplaceThemePreset =
  | 'default-kirenga'
  | 'midnight-command'
  | 'blue-operations'
  | 'cyan-logistics'
  | 'executive-dark'
  | 'custom';

export type BackgroundType =
  | 'animated-logistics'
  | 'mesh-gradient'
  | 'deep-grid'
  | 'dark-minimal'
  | 'custom-image';

export type WatermarkPosition = 'center' | 'top-right' | 'bottom-right' | 'top-left' | 'custom';
export type WatermarkSize = 'small' | 'medium' | 'large' | 'custom';

export interface WorkplaceThemeConfig {
  themePreset: WorkplaceThemePreset;
  primaryColorHex: string;
  secondaryColorHex: string;
  accentColorHex: string;
  textColorHex: string;
  backgroundType: BackgroundType;
  backgroundImageUrl?: string;
  backgroundOverlay: 'navy-dark' | 'black-obsidian' | 'cyan-glow' | 'deep-space';
  buttonGlow: 'none' | 'subtle' | 'vibrant';
  cardTransparency: number; // 0.6 to 0.98
  borderBrightness: 'subtle' | 'medium' | 'high';
  animationIntensity: 'subtle' | 'moderate' | 'dynamic';
  animationSpeed: 'slow' | 'normal' | 'fast';
  watermarkEnabled: boolean;
  watermarkOpacity: number; // 0.05 to 0.20
  watermarkSize: WatermarkSize;
  watermarkPosition: WatermarkPosition;
  watermarkBlur: number; // 0 to 20
}

export interface WorkplaceAppearanceSettings {
  id: string;
  globalTheme: WorkplaceThemeConfig;
  adminTheme: WorkplaceThemeConfig;
  staffTheme: WorkplaceThemeConfig;
  driverTheme: WorkplaceThemeConfig;
  allowIndividualThemes: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export type AdminCommandKey =
  | 'overview'
  | 'live-operations'
  | 'cargo-tracking'
  | 'routes'
  | 'vehicles'
  | 'drivers'
  | 'staff'
  | 'clients'
  | 'requests-quotes'
  | 'finance'
  | 'documents'
  | 'reports'
  | 'website-control'
  | 'branding'
  | 'map-control'
  | 'notifications'
  | 'security'
  | 'system-settings'
  | 'workplace-control';

export type StaffCommandKey =
  | 'my-work'
  | 'assigned-tasks'
  | 'cargo-operations'
  | 'client-requests'
  | 'documents'
  | 'vehicles'
  | 'shipments'
  | 'checkpoints'
  | 'messages'
  | 'notifications'
  | 'reports'
  | 'my-profile';

export type DriverCommandKey =
  | 'my-trips'
  | 'active-delivery'
  | 'cargo-details'
  | 'route'
  | 'navigation'
  | 'checkpoints'
  | 'vehicle'
  | 'documents'
  | 'delivery-confirmation'
  | 'incident-report'
  | 'messages'
  | 'notifications'
  | 'my-profile';

export interface UserCommandPermissions {
  userId: string;
  staffCommands?: StaffCommandKey[];
  driverCommands?: DriverCommandKey[];
  adminCommands?: AdminCommandKey[];
  updatedAt: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// FINANCE COMMAND CENTER & TRANSACTIONS (REQ 49-52)
// ----------------------------------------------------

export type FinanceCommandKey =
  | 'overview'
  | 'payments'
  | 'income'
  | 'expenses'
  | 'driver-payments'
  | 'staff-payments'
  | 'client-payments'
  | 'supplier-payments'
  | 'quotes'
  | 'invoices'
  | 'refunds'
  | 'withdrawals'
  | 'transactions'
  | 'cash-flow'
  | 'financial-reports'
  | 'payment-settings'
  | 'audit-log';

export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'DRIVER_PAYMENT'
  | 'STAFF_PAYMENT'
  | 'CLIENT_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'REFUND'
  | 'WITHDRAWAL'
  | 'DEPOSIT'
  | 'SETTLEMENT';

export type KenyanPaymentMethod =
  | 'M-PESA'
  | 'BANK_TRANSFER'
  | 'RTGS'
  | 'EFT'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'CHEQUE';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'RECONCILED' | 'FAILED' | 'CANCELLED';

export interface FinanceTransaction {
  id: string;
  transactionNumber: string; // e.g. KCC-TXN-2026-0001
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  type: TransactionType;
  description: string;
  party: string; // Payer or Payee
  amount: number; // in KES / KSh
  currency: 'KES' | 'USD' | 'UGX' | 'TZS' | 'RWF';
  paymentMethod: KenyanPaymentMethod;
  reference: string; // M-Pesa transaction code, Bank ref, cheque no
  status: TransactionStatus;
  category?: string;
  linkedId?: string;
  linkedType?: 'SHIPMENT' | 'INVOICE' | 'QUOTE' | 'EXPENSE' | 'STAFF' | 'DRIVER' | 'SUPPLIER';
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

