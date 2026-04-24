/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserData } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  register: (data: Omit<UserData, 'isLoggedIn'>, password: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ ...userDoc.data() as UserData, isLoggedIn: true });
        } else {
          // Fallback if doc doesn't exist but user is authed (shouldn't happen with our flow)
          setUser({
            fullName: firebaseUser.displayName || 'Usuario',
            email: firebaseUser.email || '',
            birthDate: '',
            isLoggedIn: true
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (data: Omit<UserData, 'isLoggedIn'>, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
    const firebaseUser = userCredential.user;
    
    const userData: UserData = {
      ...data,
      isLoggedIn: true
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      fullName: data.fullName,
      email: data.email,
      birthDate: data.birthDate,
      profilePic: data.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`
    });

    setUser(userData);
  };

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, register, login, logout }}>
      {!loading && children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
