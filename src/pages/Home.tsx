/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      {/* Immersive Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-accent/10 blur-[150px] rounded-full" />
      </div>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 p-8 flex items-center justify-between z-30 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center backdrop-blur-md">
            <span className="text-primary font-black text-xl uppercase tracking-tighter">{settings.appName.charAt(0)}</span>
          </div>
          <span className="font-display font-black text-xl tracking-tighter text-white uppercase">{settings.appName}</span>
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowLogin(true)}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-text/40 hover:text-primary transition-colors py-2 px-4"
        >
          Iniciar Sesión
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-6xl w-full relative z-10"
      >
        <div className="mb-2 w-full flex justify-center">
          <span className="section-label">{settings.heroSubtitle}</span>
        </div>

        <h1 className="text-7xl md:text-[180px] font-display font-black text-white leading-[0.85] tracking-tighter uppercase mb-12">
          {settings.heroTitle.split(' ').length > 1 ? (
            <>
              {settings.heroTitle.split(' ')[0]} <br />
              <span className="text-primary translate-x-4 md:translate-x-12 inline-block">
                {settings.heroTitle.split(' ').slice(1).join(' ')}
              </span>
            </>
          ) : (
            <span className="text-primary">{settings.heroTitle}</span>
          )}
        </h1>

        <div className="relative max-w-4xl mx-auto mb-16 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-[40px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative aspect-video w-full rounded-[40px] overflow-hidden shadow-2xl border border-white/5 bg-surface backdrop-blur-3xl">
            <iframe
              className="w-full h-full grayscale-[0.2] contrast-125 opacity-80 group-hover:opacity-100 transition-all duration-700 hover:scale-[1.01]"
              src="https://www.youtube.com/embed/97WubZAYumw?autoplay=1&mute=1&loop=1&playlist=97WubZAYumw"
              title="Community Spotlight"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="absolute top-6 left-6 pointer-events-none">
              <div className="flex items-center gap-3">
                <span className="bg-red-500 text-[9px] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">En Vivo</span>
                <span className="glass-dark px-3 py-1 rounded-full text-[9px] text-white/60 font-bold uppercase tracking-widest border border-white/10">Ayutla de los Libres</span>
              </div>
            </div>
            
            <div className="absolute bottom-10 left-10 right-10 text-left">
               <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">ESPLENDOR CULTURAL</h3>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Descubriendo nuestras raíces a través de la lente</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button
            onClick={() => navigate('/register')}
            className="btn-primary flex items-center justify-center gap-4"
          >
            <UserPlus size={18} />
            <span>Únete a la Comunidad</span>
          </button>
          <button
            onClick={() => navigate('/feed')}
            className="btn-outline flex items-center justify-center gap-4"
          >
            <Play size={18} fill="currentColor" />
            <span>Explorar Contenido</span>
          </button>
        </div>
      </motion.div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogin(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="fixed z-50 w-full max-w-sm glass p-10 mx-4 border-white/10"
            >
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-display font-black tracking-tighter text-white uppercase mb-2">Bienvenido</h2>
                <p className="text-text/30 text-[10px] font-bold uppercase tracking-widest">Ingresa tus credenciales</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="section-label mb-2">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ayuuk@mixe.com"
                    className="input-field rounded-2xl"
                  />
                </div>

                <div className="relative">
                  <label className="section-label mb-2">Contraseña</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 bottom-4 text-text/20 hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>}

                <div className="flex flex-col gap-4 mt-10">
                  <button type="submit" className="btn-primary w-full tracking-[0.2em] shadow-xl">
                    Entrar
                  </button>
                  <Link 
                    to="/register" 
                    className="text-[10px] font-black uppercase tracking-widest text-text/30 hover:text-white text-center transition-colors"
                  >
                    ¿No tienes cuenta? Regístrate
                  </Link>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
