'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Define the shape of the signup data
interface SignUpData {
  name: string;
  email: string;
  password: string;
}

// Define the shape of the login data
interface LoginData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticating: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // User is signed in.
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        // This syncs user data on first login after signup, or updates last login time
        if (!docSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        } else {
          // Existing user, update last login time
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        }
        setUser(user);
        // If user is on an auth page, redirect to dashboard
        if (pathname === '/login' || pathname === '/signup') {
          router.push('/dashboard');
        }
      } else {
        // User is signed out.
        setUser(null);
        if (pathname.startsWith('/dashboard')) {
            router.push('/login');
        }
      }
      setLoading(false);
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, [router, pathname, toast]);

  const login = async ({ email, password }: LoginData) => {
    setIsAuthenticating(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle redirect and state updates
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({ variant: "destructive", title: "Login Failed", description: "Please check your email and password." });
      setIsAuthenticating(false);
    }
  };
  
  const signup = async ({ name, email, password }: SignUpData) => {
    setIsAuthenticating(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Manually update user in state, since onAuthStateChanged might be slow
      setUser({ ...userCredential.user, displayName: name });

      // onAuthStateChanged will also run and handle firestore doc creation
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    }
  };

  const value = {
    user,
    loading,
    isAuthenticating,
    login,
    signup,
    logout,
  };

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
