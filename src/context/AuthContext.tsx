import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateAuthProfile,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  linkWithPopup,
  unlink,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { db } from '../lib/firestoreService';
import { UserProfile, SystemSettings } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: 'admin' | 'worker' | 'driver' | 'staff' | 'customer' | null;
  status: 'active' | 'inactive' | 'suspended' | 'locked' | null;
  loading: boolean;
  isSessionLocked: boolean;
  mustChangePassword: boolean;
  systemSettings: SystemSettings;
  signIn: (emailOrUsername: string, pass: string, remember?: boolean, expectedRole?: 'admin' | 'customer' | 'driver' | 'staff') => Promise<UserProfile>;
  signInWithGoogle: () => Promise<UserProfile>;
  signInWithAdminProvider: (provider: 'apple.com' | 'microsoft.com') => Promise<UserProfile>;
  linkGoogleAccount: () => Promise<void>;
  linkAdminProvider: (provider: 'apple.com' | 'microsoft.com') => Promise<void>;
  registerCustomer: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (emailOrUsername: string) => Promise<void>;
  changePassword: (newPass: string, currentPass?: string) => Promise<void>;
  changeTemporaryPassword: (currentPass: string, newPass: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  unlockSession: (pass: string) => Promise<boolean>;
  lockSession: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const profileCacheRef = useRef(new Map<string, UserProfile>());
  const persistenceRef = useRef<boolean | null>(null);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    id: 'general',
    companyName: 'Kirenga Cargo Carriers',
    logoUrl: '',
    wallpaperUrl: '',
    phone: '+256 700 000 000',
    email: 'operations@kirengacargo.com',
    address: 'Kampala, Uganda | East & Central Africa Corridors',
    sessionTimeoutSeconds: 300,
    theme: 'navy-dark',
  });

  // Load system settings
  useEffect(() => {
    void db.getSystemSettings()
      .then((s) => {
        if (s) setSystemSettings(s);
      })
      .catch((err) => {
        console.warn('System settings could not be loaded; using safe defaults.', err);
      });
  }, []);

  // Fetch Firestore profile for an authenticated user
  const loadProfile = async (uid: string): Promise<UserProfile | null> => {
    const cached = profileCacheRef.current.get(uid);
    if (cached) {
      setUserProfile(cached);
      return cached;
    }
    try {
      const profile = await db.getUserProfile(uid);
      if (profile) {
        profileCacheRef.current.set(uid, profile);
        setUserProfile(profile);
        return profile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
    return null;
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await loadProfile(currentUser.uid);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUserProfile(null);
      setIsSessionLocked(false);
      if (user) {
        const profile = await loadProfile(user.uid);
        // Admin provisioning/repair is handled during the explicit login flow.
        // Do not perform additional Firestore writes from the auth-state listener.

        // Enforce account status check
        if (profile) {
          const st = (profile.status || '').toLowerCase();
          if (st === 'inactive' || st === 'suspended' || st === 'locked') {
            await firebaseSignOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
      } else {
        profileCacheRef.current.clear();
        setUserProfile(null);
        setIsSessionLocked(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Inactivity tracking for automatic session lock
  useEffect(() => {
    if (!currentUser || isSessionLocked) return;

    let timeoutId: any;
    const timeoutSeconds = systemSettings.sessionTimeoutSeconds || 300;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsSessionLocked(true);
      }, timeoutSeconds * 1000);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser, isSessionLocked, systemSettings.sessionTimeoutSeconds]);

  // Sign In implementation
  const signIn = async (emailOrUsername: string, pass: string, remember: boolean = true, expectedRole?: 'admin' | 'customer' | 'driver' | 'staff'): Promise<UserProfile> => {
    const emailToUse = emailOrUsername.trim().toLowerCase();

    // Firebase Authentication is the authoritative credential store.
    // Do not perform unauthenticated username lookups against Firestore:
    // Firestore rules intentionally keep workforce profiles private.
    if (!emailToUse || !emailToUse.includes('@')) {
      throw new Error('Please sign in with your registered email address.');
    }

    // Configure Firebase persistence only when the user's preference changes.
    // Avoid repeating the IndexedDB/session setup on every login attempt.
    if (persistenceRef.current !== remember) {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      persistenceRef.current = remember;
    }

    const normalizedEmail = emailToUse;
    const isAdminEmail = normalizedEmail === 'kirengacargo@gmail.com';

    let authUser: User;
    try {
      const cred = await signInWithEmailAndPassword(auth, emailToUse, pass);
      authUser = cred.user;
    } catch (authErr: any) {
      // Do not query the private users collection before authentication succeeds.
      // This prevents account enumeration and keeps the fast login path database-light.

      // Check for Initial Administrator account bootstrap
      if (isAdminEmail && (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential')) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, emailToUse, pass);
          await sendEmailVerification(newCred.user);
          await firebaseSignOut(auth);
          throw new Error('A verification email was sent to the administrator address. Verify it, then sign in again to finish setup.');
        } catch (bootstrapErr: any) {
          if (bootstrapErr.code === 'auth/email-already-in-use') {
            throw new Error('Incorrect credentials. Please verify your email/username and password.');
          }
          if (bootstrapErr.code === 'auth/weak-password') {
            throw new Error('Administrator password must be at least 6 characters long.');
          }
          throw new Error(`Authentication error: ${bootstrapErr.message}`);
        }
      }

      // Failed-attempt lockout is enforced by Firebase Authentication's
      // anti-abuse protections. Account status is enforced after successful auth
      // from the private Firestore profile, so no sensitive profile query is needed here.

      // Map Firebase error codes to human-readable messages
      if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        throw new Error('Incorrect credentials. Please verify your email/username and password.');
      }
      if (authErr.code === 'auth/user-not-found') {
        throw new Error('No registered account found with these credentials.');
      }
      if (authErr.code === 'auth/user-disabled') {
        throw new Error('Your account is currently unavailable. Contact the Kirenga Cargo Carriers administrator.');
      }
      if (authErr.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Access is temporarily locked. Please try again shortly or reset password.');
      }
      throw new Error(authErr.message || 'Failed to authenticate. Please check your credentials.');
    }

    // Retrieve Firestore Profile
    let profile = await loadProfile(authUser.uid);

    // If profile document does not exist yet for bootstrapped admin
    if (!profile) {
      if (isAdminEmail) {
        if (!authUser.emailVerified) {
          await sendEmailVerification(authUser).catch(() => {});
          await firebaseSignOut(auth);
          throw new Error('Verify the administrator email address before initializing its profile. Check your inbox, then sign in again.');
        }
        const now = new Date().toISOString();
        profile = {
          id: authUser.uid,
          uid: authUser.uid,
          fullName: 'Kirenga Central Administrator',
          username: authUser.email?.split('@')[0] || 'admin',
          email: authUser.email || emailToUse,
          phone: '+256 700 000 000',
          country: 'Uganda',
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
        };
        await db.saveUserProfile(profile);
      } else if (expectedRole === 'customer') {
        if (!authUser.emailVerified) {
          await sendEmailVerification(authUser).catch(() => {});
          await firebaseSignOut(auth);
          throw new Error('Verify your email address before opening your client account. Check your inbox, then sign in again.');
        }
        const now = new Date().toISOString();
        profile = {
          id: authUser.uid,
          uid: authUser.uid,
          fullName: authUser.displayName || authUser.email?.split('@')[0] || 'Client',
          username: authUser.email?.split('@')[0] || undefined,
          email: authUser.email || emailToUse,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          customerId: authUser.uid,
          mustChangePassword: false,
          createdAt: now,
          updatedAt: now,
        };
        await db.saveUserProfile(profile);
      } else {
        throw new Error('User profile record not found in database. Contact administrator.');
      }
    }

    // Existing profile role and status stay authoritative; bootstrap emails do not override them.

    const actualRole = (profile.role || '').toLowerCase();
    const roleMatches = !expectedRole || (expectedRole === 'staff'
      ? ['staff', 'worker', 'operations', 'finance', 'support'].includes(actualRole)
      : actualRole === expectedRole);
    if (!roleMatches) {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      throw new Error('This account belongs to a different workplace. Select the matching portal and sign in again.');
    }

    // Strict Account Status Verification
    const statusNormalized = (profile.status || 'ACTIVE').toLowerCase();
    if (statusNormalized === 'inactive' || statusNormalized === 'suspended' || statusNormalized === 'locked') {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      throw new Error('Your account is currently unavailable. Contact the Kirenga Cargo Carriers administrator.');
    }

    // Complete login from the local authenticated profile immediately.
    // Analytics/bookkeeping are deliberately deferred so they never delay navigation.
    profileCacheRef.current.set(authUser.uid, profile);
    setUserProfile(profile);
    setIsSessionLocked(false);

    // Fire-and-forget: do not make dashboard navigation wait for audit writes.
    void db.logAudit({
      actorUid: authUser.uid,
      actorRole: profile.role || 'USER',
      action: 'USER_LOGIN',
      targetUid: authUser.uid,
      details: `Successful sign-in with role ${profile.role}`,
    }).catch(() => {});

    return profile;
  };

  const signInWithGoogle = async (): Promise<UserProfile> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      login_hint: 'kirengacargo@gmail.com',
      prompt: 'select_account',
    });

    await setPersistence(auth, browserLocalPersistence);
    persistenceRef.current = true;

    let authUser: User;
    try {
      const credential = await signInWithPopup(auth, provider);
      authUser = credential.user;
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error(
          'This administrator account already uses email and password. Sign in with that method once, then link Google under Admin Security → Password. If needed, use Forgot Password first.'
        );
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        throw new Error('Google sign-in was cancelled.');
      }
      throw new Error(err.message || 'Google sign-in failed. Please try again.');
    }

    if (authUser.email?.toLowerCase() !== 'kirengacargo@gmail.com') {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      throw new Error('Use the Google account registered for the Kirenga Cargo administrator.');
    }

    if (!authUser.emailVerified) {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      throw new Error('The administrator Google account must have a verified email address.');
    }

    let profile = await loadProfile(authUser.uid);
    if (!profile) {
      const now = new Date().toISOString();
      profile = {
        id: authUser.uid,
        uid: authUser.uid,
        fullName: authUser.displayName || 'Kirenga Central Administrator',
        username: (authUser.email || 'kirengacargo@gmail.com').split('@')[0],
        email: authUser.email || 'kirengacargo@gmail.com',
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
      };
      try {
        await db.saveUserProfile(profile);
      } catch (err) {
        await firebaseSignOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
        throw err;
      }
    }

    if (profile.role?.toLowerCase() !== 'admin' || profile.status?.toLowerCase() !== 'active') {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      throw new Error('This Google account does not have an active Kirenga Cargo administrator profile.');
    }

    profileCacheRef.current.set(authUser.uid, profile);
    setCurrentUser(authUser);
    setUserProfile(profile);
    setIsSessionLocked(false);
    void db.logAudit({
      actorUid: authUser.uid,
      actorRole: profile.role || 'ADMIN',
      action: 'USER_LOGIN',
      targetUid: authUser.uid,
      details: 'Administrator signed in with Google.',
    }).catch(() => {});
    return profile;
  };

  const signInWithAdminProvider = async (providerId: 'apple.com' | 'microsoft.com'): Promise<UserProfile> => {
    const provider = new OAuthProvider(providerId);
    provider.setCustomParameters({ prompt: 'select_account' });
    if (providerId === 'apple.com') provider.addScope('email');
    await setPersistence(auth, browserLocalPersistence);
    persistenceRef.current = true;

    let authUser: User;
    try {
      authUser = (await signInWithPopup(auth, provider)).user;
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error('This identity is not linked to the administrator account yet. Sign in with the current administrator method and link it under Admin Security.');
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in was cancelled.');
      }
      throw new Error(err.message || 'Administrator identity sign-in failed.');
    }

    const profile = await db.getUserProfile(authUser.uid);
    if (!authUser.emailVerified || !profile || profile.role?.toLowerCase() !== 'admin' || profile.status?.toLowerCase() !== 'active') {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      throw new Error('This identity must be linked to an active administrator account before it can sign in.');
    }

    profileCacheRef.current.set(authUser.uid, profile);
    setCurrentUser(authUser);
    setUserProfile(profile);
    setIsSessionLocked(false);
    void db.logAudit({
      actorUid: authUser.uid,
      actorRole: profile.role,
      action: 'USER_LOGIN',
      targetUid: authUser.uid,
      details: 'Administrator signed in with ' + (providerId === 'apple.com' ? 'Apple' : 'Microsoft') + '.',
    }).catch(() => {});
    return profile;
  };

  const registerCustomer = async (fullName: string, email: string, password: string): Promise<void> => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || password.length < 8) {
      throw new Error('Enter your name, a valid email, and a password of at least 8 characters.');
    }
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    try {
      await firebaseUpdateAuthProfile(credential.user, { displayName: cleanName });
      await sendEmailVerification(credential.user);
    } finally {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  const linkGoogleAccount = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user || user.email?.toLowerCase() !== 'kirengacargo@gmail.com'
        || userProfile?.role?.toLowerCase() !== 'admin'
        || userProfile.status?.toLowerCase() !== 'active') {
      throw new Error('Sign in as the active Kirenga Cargo administrator before linking Google.');
    }
    if (user.providerData.some((item) => item.providerId === 'google.com')) {
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      login_hint: user.email,
      prompt: 'select_account',
    });
    const result = await linkWithPopup(user, provider);
    setCurrentUser(result.user);
    const googleEmail = result.user.providerData.find((item) => item.providerId === 'google.com')?.email?.toLowerCase();
    if (googleEmail !== user.email.toLowerCase()) {
      await unlink(result.user, 'google.com');
      throw new Error('Choose the same administrator email address when linking Google.');
    }

    await db.logAudit({
      actorUid: user.uid,
      actorRole: userProfile.role,
      action: 'GOOGLE_PROVIDER_LINKED',
      targetUid: user.uid,
      details: 'Administrator linked Google sign-in to the existing account.',
    }).catch(() => {});
  };

  const linkAdminProvider = async (providerId: 'apple.com' | 'microsoft.com'): Promise<void> => {
    const user = auth.currentUser;
    if (!user || userProfile?.role?.toLowerCase() !== 'admin' || userProfile.status?.toLowerCase() !== 'active') {
      throw new Error('Sign in as the active administrator before linking another provider.');
    }
    if (user.providerData.some((item) => item.providerId === providerId)) return;
    const provider = new OAuthProvider(providerId);
    provider.setCustomParameters({ prompt: 'select_account' });
    if (providerId === 'apple.com') provider.addScope('email');
    const linkedCredential = await linkWithPopup(user, provider);
    setCurrentUser(linkedCredential.user);
    await db.logAudit({
      actorUid: user.uid,
      actorRole: userProfile.role,
      action: 'ADMIN_PROVIDER_LINKED',
      targetUid: user.uid,
      details: 'Administrator linked ' + (providerId === 'apple.com' ? 'Apple' : 'Microsoft') + ' sign-in.',
    }).catch(() => {});
  };

  // Sign Out
  const signOut = async () => {
    // Sign out immediately; audit logging must never block the logout button.
    const uid = currentUser?.uid;
    const name = userProfile?.fullName;
    void (uid && db.logAudit({
      userId: uid,
      userName: name || 'User',
      action: 'USER_LOGOUT',
      details: 'Session terminated gracefully by user.',
    }).catch(() => {}));
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsSessionLocked(false);
  };

  // Password Reset
  const sendPasswordReset = async (emailOrUsername: string) => {
    const emailToUse = emailOrUsername.trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes('@')) {
      throw new Error('Please enter your registered email address.');
    }
    await sendPasswordResetEmail(auth, emailToUse);
    if (currentUser) {
      void db.logAudit({
        userId: currentUser.uid,
        userName: userProfile?.fullName || 'User',
        action: 'PASSWORD_RESET_REQUESTED',
        details: `Password reset email dispatched to ${emailToUse}`,
      }).catch(() => {});
    }
  };

  // Change Password
  const changePassword = async (newPass: string, currentPass?: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently authenticated.');
    }
    if (currentPass) {
      try {
        await signInWithEmailAndPassword(auth, auth.currentUser.email, currentPass);
      } catch (reauthErr: any) {
        throw new Error('Current password verification failed. Please verify your current password.');
      }
    }
    await firebaseUpdatePassword(auth.currentUser, newPass);
    if (userProfile) {
      await db.logAudit({
        actorUid: auth.currentUser.uid,
        actorRole: userProfile.role || 'ADMIN',
        action: 'PASSWORD_CHANGED',
        targetUid: auth.currentUser.uid,
        details: 'Account password updated successfully via Firebase Authentication.',
      });
    }
  };

  // Change Temporary Password on First Login
  const changeTemporaryPassword = async (currentPass: string, newPass: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently authenticated.');
    }
    // Verify current temporary credentials
    await signInWithEmailAndPassword(auth, auth.currentUser.email, currentPass);
    // Update password in Firebase Auth
    await firebaseUpdatePassword(auth.currentUser, newPass);
    // Update Firestore UserProfile: mustChangePassword: false
    await db.updateUserProfile(auth.currentUser.uid, {
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    });
    await refreshProfile();
    await db.logAudit({
      actorUid: auth.currentUser.uid,
      actorRole: userProfile?.role || 'STAFF',
      action: 'TEMPORARY_PASSWORD_UPDATED',
      targetUid: auth.currentUser.uid,
      details: 'User updated their temporary administrator-provided password to a secure personal password.',
    });
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('User is not authenticated.');
    // Prevent unauthorized role / status escalation through profile update
    const sanitized = { ...updates };
    const userRoleLower = (userProfile?.role || '').toLowerCase();
    if (userRoleLower !== 'admin') {
      delete sanitized.role;
      delete sanitized.status;
      delete sanitized.department;
      delete sanitized.employeeId;
      delete sanitized.createdBy;
      delete sanitized.mustChangePassword;
      delete sanitized.failedLoginAttempts;
    }
    await db.updateUserProfile(currentUser.uid, sanitized);
    await refreshProfile();
    await db.logAudit({
      actorUid: currentUser.uid,
      actorRole: userProfile?.role || 'USER',
      action: 'PROFILE_UPDATED',
      targetUid: currentUser.uid,
      details: `Profile updated with fields: ${Object.keys(sanitized).join(', ')}`,
    });
  };

  // Unlock Session
  const unlockSession = async (pass: string): Promise<boolean> => {
    if (!currentUser?.email) return false;
    try {
      await signInWithEmailAndPassword(auth, currentUser.email, pass);
      setIsSessionLocked(false);
      return true;
    } catch {
      return false;
    }
  };

  const lockSession = () => {
    setIsSessionLocked(true);
  };

  const getNormalizedRole = (): 'admin' | 'worker' | 'driver' | 'staff' | null => {
    if (!userProfile?.role) return null;
    const r = userProfile.role.toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'driver') return 'driver';
    if (r === 'staff') return 'staff';
    if (r === 'customer') return 'customer';
    return 'worker';
  };

  const getNormalizedStatus = (): 'active' | 'inactive' | 'suspended' | 'locked' | null => {
    if (!userProfile?.status) return null;
    const s = userProfile.status.toLowerCase();
    if (s === 'inactive') return 'inactive';
    if (s === 'suspended') return 'suspended';
    if (s === 'locked') return 'locked';
    return 'active';
  };

  const normalizedRole = getNormalizedRole();
  const normalizedStatus = getNormalizedStatus();
  const mustChangePassword = Boolean(userProfile?.mustChangePassword);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role: normalizedRole,
        status: normalizedStatus,
        loading,
        isSessionLocked,
        mustChangePassword,
        systemSettings,
        signIn,
        signInWithGoogle,
        signInWithAdminProvider,
        linkGoogleAccount,
        linkAdminProvider,
        registerCustomer,
        signOut,
        sendPasswordReset,
        changePassword,
        changeTemporaryPassword,
        updateProfile,
        unlockSession,
        lockSession,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
