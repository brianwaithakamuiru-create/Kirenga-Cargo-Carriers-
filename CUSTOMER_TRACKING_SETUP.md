# Customer booking receipts and tracking

Customers can submit a booking without creating an account. The confirmation page displays a printable receipt with a KCC booking reference. They can later enter that reference and the same phone number used on the booking to see the latest public shipment status.

## Vercel setup

The private /api/track function uses the Firebase Admin SDK so it can compare the submitted phone number with the private booking record without returning customer contact details to the browser.

1. In Google Cloud / Firebase, create a dedicated service account for the tracking endpoint with only the Firestore permissions needed to read bookings and shipments and write the trackingRateLimits collection.
2. In Vercel, add the full service-account JSON as the FIREBASE_SERVICE_ACCOUNT environment variable for Production and Preview. Keep it server-only; do not use a VITE_ prefix.
3. Redeploy the Vercel project after adding the variable.

Tracking attempts are limited to 30 per source IP per 15-minute window. The endpoint returns only route, cargo category, weight, dates, and status. It never returns the saved phone number, email, customer name, shipment documents, driver details, or GPS coordinates.

The Firestore rules deny direct reads from publicTracking; tracking is available through this server endpoint only. Existing public tracking records remain in Firestore for internal system use, but unauthenticated clients cannot fetch them directly.