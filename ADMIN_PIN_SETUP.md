# Admin PIN sign-in setup

Admin PIN sign-in asks for the five-digit PIN twice, then verifies it on the server. It does not store the PIN in browser code or GitHub. A successful check creates a Firebase custom token for the existing active administrator account, kirengacargo@gmail.com.

Before enabling PIN sign-in, add these server-only Vercel environment variables for Production and Preview:

- FIREBASE_SERVICE_ACCOUNT: service account JSON with Firebase Authentication user lookup/custom-token permissions and Firestore read/write permission for users and adminPinRateLimits.
- ADMIN_WORKPLACE_PIN: the administrator's five-digit PIN.

Do not prefix either variable with VITE_. Redeploy after setting them. The endpoint permits up to five attempts per IP and fifty attempts globally per fifteen minutes. Configure a Firestore TTL policy for the expiresAt field in adminPinRateLimits to remove expired rate-limit records.

The login screen retains Google sign-in as a recovery option. The numeric PIN is a short secret; use the Vercel deployment's rate limits and restrict access to the Vercel project and Firebase service account.
