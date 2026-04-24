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
import { db } from '../lib/firebase';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useUser();
  const { settings, updateSettings, loading: settingsLoading } = useApp();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'posts'>('settings');
  const [newAppName, setNewAppName] = useState(settings.appName);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.email === 'ayuuktv42@gmail.com';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    setNewAppName(settings.appName);
  }, [settings.appName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else if (activeTab === 'posts') {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'settings') {
      fetchData();
    }
  }, [activeTab]);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await updateSettings({ appName: newAppName });
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
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <ShieldCheck className="text-primary" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Panel de Control</h1>
            <p className="text-text/40 text-sm font-medium">Gestiona la aplicación sin tocar código</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'bg-surface text-text/50 hover:text-text border border-white/5'}`}
          >
            <Settings size={18} />
            Configuración
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'bg-surface text-text/50 hover:text-text border border-white/5'}`}
          >
            <Users size={18} />
            Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'posts' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'bg-surface text-text/50 hover:text-text border border-white/5'}`}
          >
            <ImageIcon size={18} />
            Publicaciones
          </button>
        </div>

        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-12"
        >
          {activeTab === 'settings' && (
            <div className="max-w-md space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  General
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text/40 mb-2 uppercase tracking-[0.1em]">Nombre de la Aplicación</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      placeholder="Nombre de tu App"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Guardar Cambios
              </button>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white">Gestionar Usuarios</h3>
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30" size={16} />
                   <input 
                    type="text" 
                    placeholder="Buscar usuario..."
                    className="bg-background border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-text/30 tracking-widest">
                      <th className="pb-4 pt-2">Usuario</th>
                      <th className="pb-4 pt-2">Email</th>
                      <th className="pb-4 pt-2">Fecha Nacimiento</th>
                      <th className="pb-4 pt-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                      <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 truncate max-w-[150px] font-bold text-text">{u.fullName}</td>
                        <td className="py-4 text-text/40 italic">{u.email}</td>
                        <td className="py-4 text-text/40">{u.birthDate}</td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-text/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
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
            <div>
              <h3 className="text-xl font-bold text-white mb-8">Moderar Publicaciones</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {posts.map((p) => (
                  <div key={p.id} className="aspect-square bg-background rounded-2xl overflow-hidden relative group border border-white/5">
                    {p.type === 'video' ? (
                      <video src={p.url} className="w-full h-full object-cover opacity-50" />
                    ) : (
                      <img src={p.url} alt="" className="w-full h-full object-cover opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button 
                        onClick={() => handleDeletePost(p.id)}
                        className="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all scale-75 group-hover:scale-100"
                       >
                        <Trash2 size={20} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
