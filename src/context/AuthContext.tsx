import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, fallbackUser?: User | null) => {
    try {
      const docRef = doc(db, 'profiles', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else if (fallbackUser) {
        // Initialize basic profile
        const newProf: UserProfile = {
          id: uid,
          name: fallbackUser.displayName || '',
          email: fallbackUser.email || '',
          avatarUrl: fallbackUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackUser.email || 'User')}&backgroundColor=000000&textColor=ffffff`,
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, newProf);
        setProfile(newProf);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      try {
        await sendEmailVerification(res.user);
      } catch (e) {
        console.warn('Could not send email verification:', e);
      }

      const newProf: UserProfile = {
        id: res.user.uid,
        name: name || '',
        email: res.user.email || email,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}&backgroundColor=000000&textColor=ffffff`,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'profiles', res.user.uid), newProf);
        setProfile(newProf);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `profiles/${res.user.uid}`);
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    if (res.user) {
      const docRef = doc(db, 'profiles', res.user.uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        const newProf: UserProfile = {
          id: res.user.uid,
          name: res.user.displayName || '',
          email: res.user.email || '',
          avatarUrl: res.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(res.user.displayName || 'User')}&backgroundColor=000000&textColor=ffffff`,
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, newProf);
        setProfile(newProf);
      } else {
        setProfile(snap.data() as UserProfile);
      }
    }
  };

  const sendResetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const path = `profiles/${user.uid}`;
    try {
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'profiles', user.uid), updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const needsOnboarding = Boolean(
    user && (!profile || !profile.name || profile.name.trim().length < 2)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        needsOnboarding,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        sendResetPassword,
        logout,
        updateUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
