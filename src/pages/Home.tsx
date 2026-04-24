/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, LogIn, UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useUser();
  const { settings } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      setError('Credenciales incorrectas o error de conexión');
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 max-w-5xl w-full"
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-16 w-full px-4 gap-6">
          <span className="text-3xl md:text-2xl font-black tracking-tighter text-primary uppercase">{settings.appName}</span>
          <button
            onClick={() => setShowLogin(true)}
            className="w-full md:w-auto px-8 py-3 bg-surface text-text/80 rounded-xl text-sm font-bold hover:text-text transition-colors border border-white/5 active:scale-95"
          >
            Iniciar Sesión
          </button>
        </div>

        <div className="relative aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] border border-white/10 bg-black group">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/97WubZAYumw?autoplay=1&mute=1&list=RD97WubZAYumw&index=1"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
          <div className="absolute top-4 left-4 pointer-events-none">
             <span className="bg-black/60 backdrop-blur-md text-[10px] text-white px-3 py-1 rounded-full border border-white/10 font-bold uppercase tracking-widest">En Vivo</span>
          </div>
        </div>

        <div className="mt-10 md:mt-16 flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center w-full max-w-md mx-auto sm:max-w-none">
          <button
            onClick={() => navigate('/register')}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-3 text-lg px-10 py-5"
          >
            <UserPlus size={22} />
            <span>Crear Cuenta Gratis</span>
          </button>
          <button
            onClick={() => navigate('/feed')}
            className="btn-outline w-full sm:w-auto flex items-center justify-center gap-3 text-lg px-10 py-5"
          >
            <Play size={22} fill="currentColor" />
            <span>Ver Publicaciones</span>
          </button>
        </div>
      </motion.div>

      {/* Floating Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogin(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="fixed z-50 w-full max-w-md glass p-10 mx-4"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-text">Iniciar Sesión</h2>
                <button 
                  onClick={() => setShowLogin(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-text/50"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-text/40 mb-2 uppercase tracking-[0.1em]">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="input-field"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-text/40 mb-2 uppercase tracking-[0.1em]">Contraseña</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 bottom-3 text-text/30 hover:text-text/60 p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

                <div className="flex flex-col gap-3 mt-8">
                  <button type="submit" className="btn-primary w-full shadow-lg shadow-primary/20">
                    Acceder
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="w-full py-3 text-text/50 font-semibold hover:text-text transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
