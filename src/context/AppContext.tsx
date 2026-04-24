/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface AppSettings {
  appName: string;
}

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({ appName: 'VidaMixe' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'app'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as AppSettings);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const docRef = doc(db, 'config', 'app');
    await setDoc(docRef, { ...settings, ...newSettings }, { merge: true });
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
