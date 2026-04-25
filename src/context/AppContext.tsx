/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface AppSettings {
  appName: string;
  heroTitle: string;
  heroSubtitle: string;
  maintenanceMode: boolean;
  announcement: string;
  categories: string[];
}

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'VidaMixe',
  heroTitle: 'Vida Mixe',
  heroSubtitle: 'Plataforma de Streaming Comunitario',
  maintenanceMode: false,
  announcement: '',
  categories: ['Tendencias', 'Música', 'Arte', 'Cultura', 'Noticias']
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'app'), (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as AppSettings);
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
