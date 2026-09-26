import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { db } from '../lib/firestoreService';
import { UserProfile, SystemSettings } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: 'admin' | 'worker' | 'driver' | 'staff' | null;
  status: 'active' | 'inactive' | 'suspended' | 'locked' | null;
  loading: boolean;
  isSessionLocked: boolean;
  mustChangePassword: boolean;
  systemSettings: SystemSettings;
  signIn: (emailOrUsername: string, pass: string, remember?: boolean) => Promise<UserProfile>;
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
    db.getSystemSettings().then((s) => {
      if (s) setSystemSettings(s);
    });
  }, []);

  // Fetch Firestore profile for an authenticated user
  const loadProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const profile = await db.getUserProfile(uid);
      if (profile) {
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
      if (user) {
        let profile = await loadProfile(user.uid);
        const userEmail = (user.email || '').toLowerCase();
        const isAdminEmail =
          userEmail === 'kirengacargocariers@gmail.com' ||
          userEmail === 'kirengacarogocariers@gmail.com' ||
          userEmail === 'brianwaithakamuiru@gmail.com';

        // Auto-provision or repair Admin profile if authenticated as Kirenga Administrator
        if (isAdminEmail) {
          const now = new Date().toISOString();
          if (!profile) {
            profile = {
              id: user.uid,
              uid: user.uid,
              fullName: 'Kirenga Central Administrator',
              username: user.email?.split('@')[0] || 'admin',
              email: user.email || 'kirengacargocariers@gmail.com',
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
            try {
              await db.saveUserProfile(profile);
              setUserProfile(profile);
            } catch (err) {
              console.error('Error auto-saving admin profile in listener:', err);
            }
          } else if (profile.role !== 'ADMIN' || profile.status !== 'ACTIVE') {
            await db.updateUserProfile(user.uid, { role: 'ADMIN', status: 'ACTIVE' });
            profile.role = 'ADMIN';
            profile.status = 'ACTIVE';
            setUserProfile(profile);
          }
        }

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
  const signIn = async (emailOrUsername: string, pass: string, remember: boolean = true): Promise<UserProfile> => {
    const input = emailOrUsername.trim();
    let emailToUse = input;

    // Set auth persistence based on Remember Me preference
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

    let prospectiveUser: UserProfile | null = null;

    // If input does not contain '@', look up email by username in Firestore
    if (!input.includes('@')) {
      const lowerInput = input.toLowerCase();
      if (
        lowerInput === 'admin' ||
        lowerInput === 'kirengacargocariers' ||
        lowerInput === 'kcc-admin' ||
        lowerInput === 'central-admin'
      ) {
        emailToUse = 'kirengacargocariers@gmail.com';
      } else {
        prospectiveUser = await db.getUserByUsername(input);
        if (!prospectiveUser || !prospectiveUser.email) {
          throw new Error(`No workforce account found for username "${input}". Please verify and try again.`);
        }
        emailToUse = prospectiveUser.email;
      }
    } else {
      // Check if user exists by email for status checks
      const allUsers = await db.getAllUsers();
      prospectiveUser = allUsers.find(u => u.email.toLowerCase() === input.toLowerCase()) || null;
    }

    // Pre-auth status check if user profile exists
    if (prospectiveUser) {
      const st = (prospectiveUser.status || '').toLowerCase();
      if (st === 'inactive' || st === 'suspended' || st === 'locked') {
        throw new Error('Your account is currently unavailable. Contact the Kirenga Cargo Carriers administrator.');
      }
    }

    const isAdminEmail =
      emailToUse.toLowerCase() === 'kirengacargocariers@gmail.com' ||
      emailToUse.toLowerCase() === 'kirengacarogocariers@gmail.com' ||
      emailToUse.toLowerCase() === 'brianwaithakamuiru@gmail.com';

    let authUser: User;
    try {
      const cred = await signInWithEmailAndPassword(auth, emailToUse, pass);
      authUser = cred.user;
    } catch (authErr: any) {
      // Check for Initial Administrator account bootstrap
      if (isAdminEmail && (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential')) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, emailToUse, pass);
          authUser = newCred.user;
          // Create the admin user profile in Firestore
          const now = new Date().toISOString();
          const adminDoc: UserProfile = {
            id: authUser.uid,
            uid: authUser.uid,
            fullName: 'Kirenga Central Administrator',
            username: emailToUse.split('@')[0],
            email: emailToUse,
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
          await db.saveUserProfile(adminDoc);
          setUserProfile(adminDoc);
          await db.logAudit({
            actorUid: authUser.uid,
            actorRole: 'ADMIN',
            action: 'INITIAL_ADMIN_BOOTSTRAP',
            targetUid: authUser.uid,
            details: 'Initial administrator account securely initialized via Firebase Authentication.',
          });
          return adminDoc;
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

      // Track failed login attempts for account lockout protection
      if (
        prospectiveUser &&
        (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential')
      ) {
        const attempts = (prospectiveUser.failedLoginAttempts || 0) + 1;
        if (attempts >= 5) {
          await db.updateUserProfile(prospectiveUser.uid, {
            status: 'LOCKED',
            failedLoginAttempts: attempts,
          });
          await db.logAudit({
            actorUid: prospectiveUser.uid,
            actorRole: prospectiveUser.role || 'WORKER',
            action: 'ACCOUNT_LOCKED',
            targetUid: prospectiveUser.uid,
            details: `Account automatically locked following ${attempts} failed login attempts.`,
          });
          throw new Error('Your account is currently unavailable. Contact the Kirenga Cargo Carriers administrator.');
        } else {
          await db.updateUserProfile(prospectiveUser.uid, {
            failedLoginAttempts: attempts,
          });
        }
      }

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
      } else {
        throw new Error('User profile record not found in database. Contact administrator.');
      }
    }

    // Ensure ADMIN role for administrator email
    if (isAdminEmail && (profile.role !== 'ADMIN' || profile.status !== 'ACTIVE')) {
      await db.updateUserProfile(authUser.uid, { role: 'ADMIN', status: 'ACTIVE' });
      profile.role = 'ADMIN';
      profile.status = 'ACTIVE';
    }

    // Strict Account Status Verification
    const statusNormalized = (profile.status || 'ACTIVE').toLowerCase();
    if (statusNormalized === 'inactive' || statusNormalized === 'suspended' || statusNormalized === 'locked') {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      throw new Error('Your account is currently unavailable. Contact the Kirenga Cargo Carriers administrator.');
    }

    // Reset failed login attempts and update lastLoginAt on successful login
    const nowIso = new Date().toISOString();
    await db.updateUserProfile(authUser.uid, {
      failedLoginAttempts: 0,
      lastLoginAt: nowIso,
    });
    profile.failedLoginAttempts = 0;
    profile.lastLoginAt = nowIso;

    // Audit Log
    await db.logAudit({
      actorUid: authUser.uid,
      actorRole: profile.role || 'USER',
      action: 'USER_LOGIN',
      targetUid: authUser.uid,
      details: `Successful sign-in with role ${profile.role} from ${profile.country || 'East Africa'}`,
    });

    setUserProfile(profile);
    setIsSessionLocked(false);
    return profile;
  };

  // Sign Out
  const signOut = async () => {
    if (currentUser && userProfile) {
      try {
        await db.logAudit({
          userId: currentUser.uid,
          userName: userProfile.fullName,
          action: 'USER_LOGOUT',
          details: 'Session terminated gracefully by user.',
        });
      } catch (e) {
        // ignore
      }
    }
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsSessionLocked(false);
  };

  // Password Reset
  const sendPasswordReset = async (emailOrUsername: string) => {
    const input = emailOrUsername.trim();
    let emailToUse = input;
    if (!input.includes('@')) {
      const userDoc = await db.getUserByUsername(input);
      if (!userDoc || !userDoc.email) {
        throw new Error(`Username "${input}" not found.`);
      }
      emailToUse = userDoc.email;
    }
    await sendPasswordResetEmail(auth, emailToUse);
    if (currentUser) {
      await db.logAudit({
        userId: currentUser.uid,
        userName: userProfile?.fullName || 'User',
        action: 'PASSWORD_RESET_REQUESTED',
        details: `Password reset email dispatched to ${emailToUse}`,
      });
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
