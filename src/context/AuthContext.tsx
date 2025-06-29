'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';

// Create a mock user object that matches the User type.
const mockUser: User = {
  uid: 'mock-user-id',
  email: 'owner@smb.com',
  displayName: 'Small Business Owner',
  photoURL: '',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  providerId: 'mock',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({
    token: 'mock-token',
    claims: {},
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    signInProvider: null,
    signInSecondFactor: null,
    expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
   }),
  reload: async () => {},
  toJSON: () => ({}),
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const login = async () => {
    // This function no longer does anything.
    return Promise.resolve();
  };

  const logout = async () => {
    // This function no longer does anything.
    console.log("Logout clicked, but it's a no-op now.");
    return Promise.resolve();
  };

  // Always provide the mock user and set loading to false.
  const value = {
    user: mockUser,
    loading: false,
    isLoggingIn: false,
    login,
    logout
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
