
'use client';

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {User, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut} from 'firebase/auth';
import {auth, googleProvider, createUserProfileDocument} from '@/lib/firebase';
import {useRouter} from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const login = async () => {
    setLoading(true); // Indicate that the login process has started
    try {
      // Try to sign in with a popup first.
      await signInWithPopup(auth, googleProvider);
      // If successful, onAuthStateChanged will handle the user state and setLoading(false).
    } catch (error: any) {
      // If the popup is blocked by the browser or cancelled, fall back to a redirect.
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
        // After redirect, onAuthStateChanged will handle the user state.
      } else {
        console.error('Authentication error:', error);
        setLoading(false); // Stop loading only if there was an unexpected error.
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        await createUserProfileDocument(userAuth);
        setUser(userAuth);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {user, loading, login, logout};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
