
'use client';

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {User, onAuthStateChanged, signInWithRedirect, signOut} from 'firebase/auth';
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
    try {
      await signInWithRedirect(auth, googleProvider);
      // The onAuthStateChanged listener will handle the user creation and state update
      // after the redirect.
    } catch (error) {
      console.error('Authentication error:', error);
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
