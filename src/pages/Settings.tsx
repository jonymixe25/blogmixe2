/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Calendar, 
  Camera, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Settings() {
  const { user, updateProfile, deleteAccount } = useUser();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'deleting'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) return null;

  const handleDelete = async () => {
    setStatus('deleting');
    try {
      await deleteAccount();
      navigate('/');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('Error al eliminar cuenta. Es posible que necesites volver a iniciar sesión para realizar esta acción.');
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    
    try {
      await updateProfile({
        fullName,
        profilePic
      });
      setStatus('success');
      setMessage('Perfil actualizado correctamente');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Error al actualizar el perfil');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-16 md:pl-32 lg:pl-80 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-16">
          <Link to="/profile" className="inline-flex items-center gap-3 text-text/30 hover:text-primary transition-all mb-8 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Volver al Mi Espacio</span>
          </Link>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white uppercase mb-4 leading-none">
            Ajustes de <br />
            <span className="text-primary">Cuenta</span>
          </h1>
          <p className="text-text/30 font-bold uppercase tracking-[0.3em] text-[10px]">Gestiona tu identidad digital</p>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Avatar Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4"
          >
            <div className="glass p-1 items-start">
              <div className="p-10 text-center relative overflow-hidden group">
                <div className="relative inline-block mb-10">
                  <div className="w-48 h-48 rounded-[40px] overflow-hidden bg-background border-[10px] border-white/[0.03] shadow-2xl relative z-10 p-2">
                     <div className="w-full h-full rounded-[32px] overflow-hidden">
                      <img 
                        src={profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                     </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <span className="section-label mb-0 block">Foto de Perfil (URL)</span>
                  <input 
                    type="text"
                    value={profilePic}
                    onChange={(e) => setProfilePic(e.target.value)}
                    placeholder="https://..."
                    className="input-field py-4 text-center rounded-[20px] bg-white/[0.01] border-white/5 shadow-inner text-[10px]"
                  />
                  <p className="text-[8px] text-text/20 uppercase tracking-widest font-black">Recomendado: 512x512px</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Section */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8"
          >
            <div className="glass p-1">
              <form onSubmit={handleSave} className="p-10 md:p-12 space-y-10">
                <div className="space-y-4">
                   <div className="flex items-center gap-4 mb-4">
                    <span className="section-label mb-0">Información Personal</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text/20 uppercase tracking-[0.3em]">Nombre Completo</label>
                      <div className="flex items-center gap-5 py-4 bg-white/[0.01] px-6 rounded-2xl border border-white/5 shadow-inner focus-within:border-primary/30 transition-all">
                        <User size={18} className="text-primary/40" />
                        <input 
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-transparent border-none outline-none w-full font-bold text-white uppercase tracking-tighter"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 opacity-50 cursor-not-allowed">
                      <label className="text-[10px] font-black text-text/20 uppercase tracking-[0.3em]">Email (No Editable)</label>
                      <div className="flex items-center gap-5 py-4 bg-white/[0.01] px-6 rounded-2xl border border-white/5 shadow-inner">
                        <Mail size={18} className="text-text/20" />
                        <span className="font-bold text-text/30 lowercase">{user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-6">
                  {status === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-primary/10 border border-primary/20 text-primary p-6 rounded-3xl flex items-center gap-4 shadow-2xl"
                    >
                      <CheckCircle2 size={24} />
                      <span className="text-xs font-black uppercase tracking-widest leading-none">{message}</span>
                    </motion.div>
                  )}

                  {status === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-3xl flex items-center gap-4 shadow-2xl"
                    >
                      <AlertCircle size={24} />
                      <span className="text-xs font-black uppercase tracking-widest leading-none">{message}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="btn-primary w-full py-6 flex items-center justify-center gap-4 shadow-2xl group relative overflow-hidden"
                  >
                    {status === 'saving' ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span className="tracking-[0.2em] font-black">GUARDANDO...</span>
                      </>
                    ) : (
                      <>
                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="tracking-[0.2em] font-black">GUARDAR CAMBIOS</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="p-10 md:p-12 border-t border-red-500/10 bg-red-500/[0.01]">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-[10px] font-black text-red-500/40 uppercase tracking-[0.3em]">Zona de Peligro</span>
                  <div className="flex-1 h-px bg-red-500/10" />
                </div>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-3 text-red-500/40 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest group"
                  >
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                    Eliminar mi cuenta permanentemente
                  </button>
                ) : (
                  <div className="space-y-6">
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                      ¿Estás seguro? Esta acción es irreversible y borrará todos tus datos.
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={handleDelete}
                        disabled={status === 'deleting'}
                        className="bg-red-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        {status === 'deleting' ? <Loader2 className="animate-spin" size={14} /> : null}
                        Confirmar Eliminación
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-text/30 hover:text-text px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
