# Firebase authentication provider setup

The website login portal supports:

- **Clients:** verified email and password, with client account creation from the shared portal.
- **Drivers and staff:** email and administrator-issued temporary password; the existing first-login password-change flow applies.
- **Administrators:** the existing administrator Google identity plus Apple and Microsoft identities linked to the same active administrator account.

Apple Pay is a payment method and cannot authenticate a website user. The portal uses Sign in with Apple.

## One-time Firebase Console setup

These provider credentials are account-specific and are not stored in this repository.

1. In Firebase Console, open **Authentication → Sign-in method** for project `kirenga-cargo`.
2. Enable **Email/Password** and **Google** if they are not already enabled.
3. Add the production site hostname to **Authentication → Settings → Authorized domains**. Add `localhost` for local development. Enter hostnames only, without protocol or port.
4. To enable Apple, configure the Apple provider with an Apple Developer Services ID, Team ID, Key ID, and private key. Use the callback URL shown by Firebase in the Apple Developer configuration.
5. To enable Microsoft, register a web application in Microsoft Entra ID, then enter its client ID and client secret in Firebase. Use the callback URL shown by Firebase and select the appropriate tenant.
6. Sign in to the existing administrator account, then open **Admin → Security → Admin Password** and link Apple and Microsoft. Each linked identity stays on the same Firebase UID and administrator profile.

Keep provider secrets in Firebase Console or a managed secret store. Never commit them to the repository.

## Firestore rules

The rules add verified client self-provisioning and scope client reads to records matching that signed-in client's email or UID. Deploy the reviewed rules with the Firebase CLI after merging:

```sh
npx firebase-tools deploy --only firestore:rules --project kirenga-cargo
```

Until provider setup is complete, Apple and Microsoft buttons will return Firebase's provider configuration error.