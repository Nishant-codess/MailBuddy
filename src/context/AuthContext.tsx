
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
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Define the shape of the signup data
interface SignUpData {
  name: string;
  email: string;
  password:string;
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
      try {
        if (user) {
          // User is signed in.
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          
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
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          }
          
          setUser(user);
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
      } catch (error) {
        console.error("Error during auth state change:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Could not connect to the database. Please check Firestore rules and configuration.",
        });
        setUser(null);
      } finally {
        setLoading(false);
        setIsAuthenticating(false);
      }
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
      let description = "An unexpected error occurred. Please try again.";

      if (error && error.code) {
          switch (error.code) {
              case 'auth/invalid-credential':
                  description = "Invalid credentials. Please check your email and password.";
                  break;
              case 'auth/user-disabled':
                  description = "This account has been disabled.";
                  break;
              case 'auth/too-many-requests':
                  description = "Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.";
                  break;
              default:
                  description = "Login failed. Please try again.";
          }
      }
      
      toast({ variant: "destructive", title: "Login Failed", description });
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
