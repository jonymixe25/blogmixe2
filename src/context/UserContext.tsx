/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserData } from '../types';

interface UserContextType {
  user: UserData | null;
  register: (data: Omit<UserData, 'isLoggedIn'>) => void;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);

  const register = (data: Omit<UserData, 'isLoggedIn'>) => {
    setUser({ ...data, isLoggedIn: true });
  };

  const login = (email: string, pass: string) => {
    // Basic mock login - just checks if email matches registered email or is "demo@test.com"
    if ((user && user.email === email) || email === 'demo@test.com') {
      if (user) {
        setUser({ ...user, isLoggedIn: true });
      } else {
        setUser({
          fullName: 'Usuario Demo',
          email: 'demo@test.com',
          birthDate: '1995-01-01',
          isLoggedIn: true
        });
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) setUser({ ...user, isLoggedIn: false });
  };

  return (
    <UserContext.Provider value={{ user, register, login, logout }}>
      {children}
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
