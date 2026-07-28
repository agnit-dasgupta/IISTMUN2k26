/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authError: Error | null;
  clearAuthError: () => void;
  isSigningIn: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    
    // Configure Custom Parameters for Google Provider
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Authentication failed during Google Sign-In:", err.message);
      setAuthError(err);
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Sign-out error:", errMsg);
      throw error;
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, signInWithGoogle, logout, authError, clearAuthError, isSigningIn }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
