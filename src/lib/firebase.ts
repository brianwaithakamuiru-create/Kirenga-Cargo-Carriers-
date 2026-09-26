import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  Auth
} from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import config from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

// Initialize Primary Firebase App
export const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Primary Auth instance for current active user session
export const auth: Auth = getAuth(app);

// Firestore instance for the project's default database with auto-detect long-polling
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
})();

// Storage instance
export const storage: FirebaseStorage = getStorage(app);

/**
 * Creates a new user in Firebase Auth without disturbing or logging out
 * the currently signed-in Administrator.
 */
export async function createSecondaryAuthUser(email: string, password: string) {
  let secondaryApp: FirebaseApp;
  const appName = 'SecondaryAdminCreationApp';
  try {
    secondaryApp = getApp(appName);
  } catch {
    secondaryApp = initializeApp(firebaseConfig, appName);
  }

  const secondaryAuth = getAuth(secondaryApp);
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  
  // Immediately sign out from secondary app so state is clean
  try {
    await signOut(secondaryAuth);
  } catch (e) {
    console.warn('Secondary auth cleanup error:', e);
  }

  return userCredential.user;
}

// Test connection on boot (Firebase Integration Skill best practice)
if (typeof window !== 'undefined') {
  (async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error: any) {
      if (
        error?.code === 'unavailable' ||
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('the client is offline'))
      ) {
        // Expected during initial network negotiation or offline mode
      } else {
        console.warn('Firestore connection check notice:', error?.message || error);
      }
    }
  })();
}
