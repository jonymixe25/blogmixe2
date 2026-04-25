/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  PlusSquare, 
  User, 
  Compass,
  MessageCircle,
  ShieldCheck,
  LogOut,
  Settings as SettingsIcon,
  Bell,
  HardDrive
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const { settings } = useApp();
  const isMobile = useIsMobile();

  const isAdmin = ['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(user?.email?.toLowerCase().trim() || '') || ['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(auth.currentUser?.email?.toLowerCase().trim() || '');

  const navItems = [
    { path: '/', icon: Home, label: 'INICIO' },
    { path: '/feed', icon: Compass, label: 'EXPLORADOR' },
    { path: '/chat', icon: MessageCircle, label: 'CHARLAR' },
    { path: '/publish', icon: PlusSquare, label: 'PUBLICAR' },
    { path: '/profile', icon: User, label: 'PERFIL' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: ShieldCheck, label: 'ADMINISTRACIÓN' });
    navItems.push({ path: '/local-db', icon: HardDrive, label: 'DISCOTECA LOCAL' });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Don't show nav on login/register if not logged in
  if (!user && (location.pathname === '/' || location.pathname === '/register')) {
    return null;
  }

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all ${
                isActive ? 'text-primary' : 'text-text/30'
              }`}
            >
              <item.icon size={20} className={isActive ? 'scale-110' : ''} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="w-24 lg:w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col p-8 z-40 fixed top-0 left-0 h-screen shadow-2xl">
      <div className="mb-16 px-2">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20">
            <span className="text-primary font-black text-2xl uppercase tracking-tighter">{settings.appName.charAt(0)}</span>
          </div>
          <span className="hidden lg:block font-display font-black text-2xl tracking-tighter text-white uppercase group-hover:text-primary transition-colors">{settings.appName}</span>
        </Link>
      </div>

      <div className="flex-1 space-y-2">
        <span className="section-label px-4 mb-4 hidden lg:block">Menú Principal</span>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-primary text-background shadow-[0_0_30px_rgba(190,242,100,0.15)]' 
                  : 'text-text/40 hover:bg-white/[0.03] hover:text-text'
              }`}
            >
              <div className={isActive ? 'text-background' : 'group-hover:scale-110 transition-transform duration-300 group-hover:text-primary'}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`hidden lg:block font-black text-[10px] uppercase tracking-[0.2em] ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-4 pt-10 border-t border-white/5">
        <button className="hidden lg:flex w-full items-center gap-5 px-5 py-4 text-text/30 hover:text-text hover:bg-white/[0.03] rounded-2xl transition-all group">
           <Bell size={20} />
           <span className="font-black text-[10px] uppercase tracking-[0.2em]">Notificaciones</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-5 px-5 py-5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}
