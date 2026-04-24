/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, Eye, EyeOff, ArrowLeft, Calendar, Mail, User, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { register } = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      setError('');
      await register({
        fullName: formData.fullName,
        email: formData.email,
        birthDate: formData.birthDate,
      }, formData.password);
      
      navigate('/profile');
    } catch (err) {
      setError('Error al registrar usuario. Email podría estar en uso.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual side */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-surface p-12 text-text overflow-hidden relative border-r border-white/5">
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 0.2, scale: 1 }}
           className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"
        />
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <span className="text-primary font-bold mb-4 block uppercase tracking-widest text-sm">Únete a la comunidad</span>
          <h2 className="text-6xl font-black tracking-tighter mb-6 leading-none">Registro de Usuario</h2>
          <p className="text-text/50 text-lg max-w-md">Disfruta de la mejor experiencia de streaming con VIDEOSONIC.</p>
        </motion.div>
      </div>

      {/* Form side */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-text/40 hover:text-text transition-colors mb-12 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm">Volver al inicio</span>
          </button>

          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-text mb-2">Crear Cuenta</h1>
            <p className="text-text/50">Regístrate para continuar</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Nombre Completo */}
              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20" size={20} />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                    className="input-field pl-12"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20" size={20} />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="juan@ejemplo.com"
                    className="input-field pl-12"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text/20 hover:text-text/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase tracking-widest mb-2 ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text/20 hover:text-text/60 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase tracking-widest mb-2 ml-1">Fecha de Nacimiento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20" size={20} />
                  <input
                    type="date"
                    name="birthDate"
                    required
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="input-field pl-12 appearance-none color-scheme-dark"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm italic">{error}</p>}

            <button
              type="submit"
              className="btn-primary w-full py-5 text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
            >
              <UserPlus size={18} />
              <span>REGISTRAR</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
