/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  PlusSquare, 
  User, 
  Compass,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '../context/UserContext';

export default function Navigation() {
  const location = useLocation();
  const { user } = useUser();

  const isAdmin = user?.email === 'ayuuktv42@gmail.com';

  const navItems = [
    { path: '/feed', icon: Compass, label: 'Explorar' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/publish', icon: PlusSquare, label: 'Publicar' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  // Don't show nav on login/register if not logged in
  if (!user && (location.pathname === '/' || location.pathname === '/register')) {
    return null;
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-dark px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-8 shadow-2xl backdrop-blur-2xl"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className="relative group flex flex-col items-center gap-1"
            >
              <item.icon 
                size={24} 
                className={`transition-colors duration-300 ${isActive ? 'text-primary' : 'text-text/40 group-hover:text-text'}`}
              />
              <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-primary' : 'text-text/20 group-hover:text-text/60'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="nav-pill"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#00E5FF]"
                />
              )}
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}
