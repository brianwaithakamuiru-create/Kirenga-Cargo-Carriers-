# Kerenga Cargo Couriers — Database

Firestore collections: users, customers, bookings, shipments, trips, drivers, vehicles, documents, notifications, auditLogs, quotes, invoices, transactions, publicTracking, companySettings.

Public tracking must never query private shipment documents directly. A server endpoint verifies the booking reference and customer verification value, then returns only a minimal tracking projection.

Authentication uses Firebase Authentication. Firestore stores application profiles and operational data. Administrative writes should be protected server-side and by Firebase rules/custom claims.

Shipment lifecycle:
CREATED → CONFIRMED → ASSIGNED → LOADING → DEPARTED → IN_TRANSIT → AT_CHECKPOINT → BORDER_CUSTOMS → ARRIVED → OUT_FOR_DELIVERY → DELIVERED

Exceptions: CANCELLED, DELIVERY_EXCEPTION.
