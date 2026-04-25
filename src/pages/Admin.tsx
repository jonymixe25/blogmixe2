/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Users, 
  Image as ImageIcon, 
  Trash2, 
  Save, 
  Search,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useUser();
  const { settings, updateSettings, loading: settingsLoading } = useApp();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'posts'>('settings');
  const [formData, setFormData] = useState({
    appName: settings.appName,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    maintenanceMode: settings.maintenanceMode,
    announcement: settings.announcement,
    categories: settings.categories.join(', ')
  });
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = ['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(user?.email?.toLowerCase().trim() || '') || ['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(auth.currentUser?.email?.toLowerCase().trim() || '');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    setFormData({
      appName: settings.appName,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      maintenanceMode: settings.maintenanceMode,
      announcement: settings.announcement,
      categories: settings.categories.join(', ')
    });
  }, [settings]);

  useEffect(() => {
    if (activeTab === 'settings') return;

    setLoading(true);
    let q;
    if (activeTab === 'users') {
      q = query(collection(db, 'users'));
    } else {
      q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    }

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (activeTab === 'users') {
        setUsers(data);
      } else {
        setPosts(data);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return unsub;
  }, [activeTab]);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await updateSettings({ 
        appName: formData.appName,
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        maintenanceMode: formData.maintenanceMode,
        announcement: formData.announcement,
        categories: formData.categories.split(',').map(c => c.trim()).filter(Boolean)
      });
      alert('Configuración guardada!');
    } catch (err) {
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('¿Eliminar este usuario definitivamente?')) {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('¿Eliminar esta publicación definitivamente?')) {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 sm:px-12 bg-background md:pl-32 lg:pl-80 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-0.5 bg-primary rounded-full shadow-[0_0_15px_rgba(190,242,100,0.5)]" />
              <span className="section-label mb-0">Sistema de Control</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-white uppercase leading-none">
              Command <br />
              <span className="text-primary italic">Center</span>
            </h1>
          </div>
          
          <div className="glass p-1">
            <div className="flex bg-white/[0.02] rounded-2xl overflow-hidden p-1">
              {(['settings', 'users', 'posts'] as const).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-primary text-background shadow-2xl' 
                      : 'text-text/30 hover:text-white'
                  }`}
                >
                  {tab === 'settings' && <Settings size={14} />}
                  {tab === 'users' && <Users size={14} />}
                  {tab === 'posts' && <ImageIcon size={14} />}
                  {tab === 'settings' ? 'Config' : tab === 'users' ? 'Usuarios' : 'Contenido'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-1 items-start"
        >
          <div className="p-8 md:p-16">
            {activeTab === 'settings' && (
              <div className="max-w-3xl space-y-16">
                {/* Branding Section */}
                <div className="space-y-10">
                  <div className="flex items-center gap-4">
                    <span className="section-label mb-0">Identidad Visual</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Nombre de la App</label>
                      <input 
                        type="text"
                        className="input-field py-4 px-6 rounded-2xl bg-white/[0.01] border-white/5 shadow-inner font-bold"
                        value={formData.appName}
                        onChange={(e) => setFormData({...formData, appName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Título Hero</label>
                      <input 
                        type="text"
                        className="input-field py-4 px-6 rounded-2xl bg-white/[0.01] border-white/5 shadow-inner font-bold"
                        value={formData.heroTitle}
                        onChange={(e) => setFormData({...formData, heroTitle: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Subtítulo Hero</label>
                    <textarea 
                      className="input-field py-4 px-6 rounded-2xl bg-white/[0.01] border-white/5 shadow-inner font-bold min-h-[100px]"
                      value={formData.heroSubtitle}
                      onChange={(e) => setFormData({...formData, heroSubtitle: e.target.value})}
                    />
                  </div>
                </div>

                {/* System Section */}
                <div className="space-y-10">
                  <div className="flex items-center gap-4">
                    <span className="section-label mb-0">Configuración de Sistema</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Anuncio Global (Marquesina)</label>
                      <input 
                        type="text"
                        className="input-field py-4 px-6 rounded-2xl bg-white/[0.01] border-white/5 shadow-inner font-bold"
                        value={formData.announcement}
                        placeholder="Escribe un mensaje para todos los usuarios..."
                        onChange={(e) => setFormData({...formData, announcement: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Categorías de Contenido (Separadas por comas)</label>
                      <input 
                        type="text"
                        className="input-field py-4 px-6 rounded-2xl bg-white/[0.01] border-white/5 shadow-inner font-bold font-mono text-[10px]"
                        value={formData.categories}
                        onChange={(e) => setFormData({...formData, categories: e.target.value})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.01] border border-white/5">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase tracking-tight text-white">Modo Mantenimiento</h4>
                        <p className="text-[10px] font-bold text-text/20 uppercase tracking-widest">Bloquea el acceso al público</p>
                      </div>
                      <button 
                        onClick={() => setFormData({...formData, maintenanceMode: !formData.maintenanceMode})}
                        className={`w-14 h-8 rounded-full transition-all relative ${formData.maintenanceMode ? 'bg-primary' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: formData.maintenanceMode ? 24 : 4 }}
                          className={`absolute top-1 w-6 h-6 rounded-full shadow-xl ${formData.maintenanceMode ? 'bg-background' : 'bg-white/40'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="btn-primary w-full py-6 flex items-center justify-center gap-4 shadow-2xl group"
                  >
                    <Save size={20} className="group-hover:translate-x-1 transition-transform" />
                    <span className="tracking-[0.2em] font-black">ACTUALIZAR NÚCLEO DEL SISTEMA</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                  <div className="space-y-2">
                    <span className="section-label mb-0">Gestión de Identidades</span>
                    <p className="text-[9px] font-black text-text/20 uppercase tracking-[0.2em]">Total {users.length} ciudadanos digitales registrados</p>
                  </div>
                  <div className="relative w-full md:w-80">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                     <input 
                      type="text" 
                      placeholder="BUSCAR IDENTIDAD..."
                      className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-xs focus:outline-none focus:border-primary/30 transition-all font-bold uppercase tracking-widest placeholder:text-text/10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                      <tr className="text-[10px] uppercase font-black text-text/20 tracking-[0.3em]">
                        <th className="px-8 pb-4">Ciudadano</th>
                        <th className="px-8 pb-4">Digital Mail</th>
                        <th className="px-8 pb-4">Origen</th>
                        <th className="px-8 pb-4 text-right">Protocolo</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-4">
                      {users.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                        <tr key={u.id} className="group relative">
                          <td className="bg-white/[0.01] border-y border-l border-white/5 px-8 py-6 rounded-l-[24px] first-child:rounded-l-[24px]">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-primary font-black uppercase text-sm border border-white/5">
                                {u.fullName.charAt(0)}
                              </div>
                              <span className="font-display font-black text-white uppercase tracking-tight">{u.fullName}</span>
                            </div>
                          </td>
                          <td className="bg-white/[0.01] border-y border-white/5 px-8 py-6 text-text/30 font-bold lowercase">{u.email}</td>
                          <td className="bg-white/[0.01] border-y border-white/5 px-8 py-6 text-text/30 font-black text-[10px] uppercase tracking-widest">{u.birthDate}</td>
                          <td className="bg-white/[0.01] border-y border-r border-white/5 px-8 py-6 text-right rounded-r-[24px]">
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-3 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="section-label mb-0">Moderación de Activos</span>
                    <p className="text-[9px] font-black text-text/20 uppercase tracking-[0.2em]">{posts.length} Obra(s) publicadas en el sistema</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {posts.map((p) => (
                    <div key={p.id} className="aspect-square bg-white/[0.01] rounded-[32px] overflow-hidden relative group border border-white/5 shadow-2xl transition-all duration-500 hover:scale-105">
                      {p.type === 'video' ? (
                        <video src={p.url} className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                      ) : (
                        <img src={p.url} alt="" className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                      )}
                      
                      <div className="absolute top-3 left-3">
                        <span className="glass-dark px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-primary/60 border border-primary/20">
                          {p.type}
                        </span>
                      </div>

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-6">
                         <button 
                          onClick={() => handleDeletePost(p.id)}
                          className="w-14 h-14 bg-red-500 text-white rounded-2xl shadow-2xl hover:bg-red-600 transition-all scale-75 group-hover:scale-100 flex items-center justify-center hover:rotate-12"
                         >
                          <Trash2 size={24} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
