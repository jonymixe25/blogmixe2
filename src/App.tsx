/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { AppProvider } from './context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Publish from './pages/Publish';
import Feed from './pages/Feed';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import SettingsPage from './pages/Settings';
import LocalDatabase from './pages/LocalDatabase';
import Navigation from './components/Navigation';
import { useUser } from './context/UserContext';
import { useApp } from './context/AppContext';
import { auth, db } from './lib/firebase';
import { AlertTriangle, Phone, PhoneOff, Video } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import VideoCall from './pages/VideoCall';

function CallNotification() {
  const { user } = useUser();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !auth.currentUser) return;

    const q = query(
      collection(db, 'calls'), 
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setIncomingCall({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!incomingCall) return null;

  const handleAccept = () => {
    navigate(`/call/room/${incomingCall.id}`);
    setIncomingCall(null);
  };

  const handleReject = async () => {
    await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'rejected' });
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-8 right-8 z-[2000] w-80 glass border-primary/20 p-6 flex flex-col gap-6 shadow-[0_32px_64px_-16px_rgba(var(--color-primary),0.3)]"
      >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-bounce">
          <Video className="text-primary" size={24} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-white">Llamada Entrante</h4>
          <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Alguien quiere hablar contigo</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={handleAccept}
          className="flex-1 bg-primary text-background py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Phone size={14} />
          Aceptar
        </button>
        <button 
          onClick={handleReject}
          className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <PhoneOff size={14} />
          Rechazar
        </button>
      </div>
    </motion.div>
  </AnimatePresence>
  );
}

function AppContent() {
  const { user, loading: userLoading } = useUser();
  const { settings, loading: settingsLoading } = useApp();

  if (userLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Admin bypasses maintenance
  const isAdmin = ['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(user?.email?.toLowerCase().trim() || '') || 
                  ['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(auth?.currentUser?.email?.toLowerCase().trim() || '');

  if (settings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
        <AlertTriangle size={64} className="text-primary mb-8" />
        <h1 className="text-5xl font-display font-black text-white uppercase tracking-tighter mb-4">Núcleo en <span className="text-primary">Mantenimiento</span></h1>
        <p className="text-text/40 font-bold uppercase tracking-widest text-[10px] max-w-xs">{settings.announcement || 'Estamos afinando los sistemas para una mejor experiencia.'}</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30">
        <Navigation />
        <CallNotification />
        {settings.announcement && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-background py-1 px-4 text-center overflow-hidden h-6 flex items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">
              [SISTEMA] : {settings.announcement}
            </span>
          </div>
        )}
        <div className={settings.announcement ? 'pt-6' : ''}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:profileId" element={<Profile />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/local-db" element={<LocalDatabase />} />
            <Route path="/call/:userId" element={<VideoCall />} />
            <Route path="/call/room/:callId" element={<VideoCall />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AppProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </AppProvider>
  );
}
