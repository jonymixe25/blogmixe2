/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Home, 
  Video, 
  Upload,
  MessageSquare, 
  Settings, 
  LogOut, 
  Mail, 
  Calendar, 
  Hash,
  ChevronRight,
  PlayCircle,
  ImageIcon,
  Download,
  AlertCircle,
  Compass,
  ShieldCheck,
  Video as VideoCallIcon
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useUser();
  const { profileId } = useParams();
  const { settings } = useApp();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwnProfile = !profileId || profileId === auth.currentUser?.uid;

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const id = profileId || auth.currentUser?.uid;
        if (!id) {
          navigate('/');
          return;
        }

        // Fetch User Info
        const userSnap = await getDoc(doc(db, 'users', id));
        if (userSnap.exists()) {
          setProfileData({ ...userSnap.data(), id });
        } else {
          setErrorMsg("Usuario no encontrado");
        }

        // Fetch Posts
        const q = query(
          collection(db, 'posts'),
          where('userId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(fetchedPosts);
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        setErrorMsg(error.message || "Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profileId, navigate]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'descarga-vidamixe';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al descargar:", error);
      window.open(url, '_blank');
    }
  };

  if (!user) return null;
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
    </div>
  );

  const startCall = () => {
    if (profileData?.id) {
      navigate(`/call/${profileData.id}`);
    }
  };

  const startChat = async () => {
    if (!profileData?.id || !auth.currentUser) return;
    const chatId = [auth.currentUser.uid, profileData.id].sort().join('_');
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row md:pl-24 lg:pl-72 overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-16 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 md:hidden mb-8">
                <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
                  <span className="text-primary font-black text-xl uppercase tracking-tighter">{settings.appName.charAt(0)}</span>
                </div>
                <span className="font-display font-black text-2xl tracking-tighter text-white uppercase">{settings.appName}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-0.5 bg-primary rounded-full" />
                <span className="section-label mb-0">{isOwnProfile ? 'Área Personal' : 'Perfil de Creador'}</span>
              </div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-display font-black tracking-tighter text-white uppercase leading-none"
              >
                {isOwnProfile ? 'Mi' : 'Perfil'} <br />
                <span className="text-primary">{isOwnProfile ? 'Espacio' : 'Mixe'}</span>
              </motion.h1>
            </div>
            
            <div className="flex gap-4">
              {isOwnProfile ? (
                <button 
                  onClick={() => navigate('/settings')}
                  className="btn-outline px-6 py-3 border-white/5 bg-white/[0.01] hover:border-white/20 transition-all flex items-center gap-3"
                >
                  <Settings size={16} />
                  <span className="tracking-[0.2em] font-black text-[9px]">Ajustes</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={startChat}
                    className="btn-outline px-6 py-3 border-white/5 bg-white/[0.01] hover:border-white/20 transition-all flex items-center gap-3"
                  >
                    <MessageSquare size={16} />
                    <span className="tracking-[0.2em] font-black text-[9px]">Mensaje</span>
                  </button>
                  <button 
                    onClick={startCall}
                    className="btn-primary px-6 py-3 flex items-center gap-3"
                  >
                    <VideoCallIcon size={16} />
                    <span className="tracking-[0.2em] font-black text-[9px]">Video Llamada</span>
                  </button>
                </>
              )}
            </div>
          </header>

          {errorMsg ? (
             <div className="glass p-20 text-center flex flex-col items-center">
               <AlertCircle size={48} className="text-red-500 mb-6" />
               <p className="text-text/40 font-black uppercase tracking-[0.3em] mb-8">{errorMsg}</p>
               <button onClick={() => navigate('/feed')} className="btn-primary px-10">Explorar Otros Perfiles</button>
             </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-12">
              {/* Profile Card */}
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
                            src={profileData?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData?.email}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                         </div>
                      </div>
                      <div className="absolute bottom-4 right-4 w-6 h-6 bg-primary border-4 border-background rounded-full z-20 shadow-[0_0_20px_rgba(190,242,100,0.5)]" />
                    </div>
                    
                    <h3 className="text-3xl font-display font-black text-white mb-2 uppercase tracking-tight">{profileData?.fullName}</h3>
                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] opacity-60">{profileData?.email}</p>
                    
                    <div className="mt-12 pt-10 border-t border-white/5 grid grid-cols-2 gap-8">
                      <div className="border-r border-white/5">
                        <span className="block font-black text-3xl text-white tracking-widest uppercase">1.2<span className="text-primary tracking-tighter">k</span></span>
                        <span className="text-[9px] text-text/30 uppercase tracking-[0.3em] font-black">Audiencia</span>
                      </div>
                      <div>
                        <span className="block font-black text-3xl text-white tracking-widest uppercase">482</span>
                        <span className="text-[9px] text-text/30 uppercase tracking-[0.3em] font-black">Conexiones</span>
                      </div>
                    </div>

                    { isOwnProfile && (['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(user.email?.toLowerCase().trim() || '') || ['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(auth.currentUser?.email?.toLowerCase().trim() || '')) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-12 p-8 bg-primary/[0.05] border border-primary/20 rounded-[40px] relative overflow-hidden group cursor-pointer hover:bg-primary/[0.08] transition-all"
                        onClick={() => navigate('/admin')}
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <ShieldCheck size={120} className="text-primary" />
                        </div>
                        <div className="relative z-10 text-left">
                          <div className="w-12 h-12 bg-primary text-background rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                            <ShieldCheck size={24} />
                          </div>
                          <h4 className="text-xl font-black text-primary uppercase tracking-tighter mb-1">ADMINISTRACIÓN</h4>
                          <p className="text-primary/40 text-[9px] font-black uppercase tracking-widest">SISTEMA CENTRAL DE CONTROL</p>
                          <button className="mt-6 flex items-center gap-3 text-primary font-black uppercase text-[9px] tracking-[0.2em] group-hover:translate-x-2 transition-all">
                            ACCEDER AL PANEL <ChevronRight size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Account Details & Posts */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-8 space-y-12"
              >
                <div className="glass p-1">
                  <div className="p-10 md:p-12">
                    <div className="flex items-center justify-between mb-12">
                      <span className="section-label mb-0">Información de Cuenta</span>
                      <UserIcon size={16} className="text-primary/30" />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-12">
                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-text/20 uppercase tracking-[0.3em]">Nombre Público</span>
                        <div className="flex items-center gap-5 py-4 bg-white/[0.01] px-6 rounded-2xl border border-white/5">
                          <UserIcon size={18} className="text-primary/40" />
                          <p className="font-bold text-white/90 uppercase tracking-tighter">{profileData?.fullName}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-text/20 uppercase tracking-[0.3em]">Identidad Digital</span>
                        <div className="flex items-center gap-5 py-4 bg-white/[0.01] px-6 rounded-2xl border border-white/5">
                          <Mail size={18} className="text-primary/40" />
                          <p className="font-bold text-white/90 lowercase">{profileData?.email}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-text/20 uppercase tracking-[0.3em]">Miembro desde</span>
                        <div className="flex items-center gap-5 py-4 bg-white/[0.01] px-6 rounded-2xl border border-white/5">
                          <Calendar size={18} className="text-primary/40" />
                          <p className="font-bold text-white/90 uppercase tracking-tighter">
                            {profileData?.birthDate && new Date(profileData.birthDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-text/20 uppercase tracking-[0.3em]">Status Hero</span>
                        <div className="flex items-center gap-5 py-4 bg-primary/10 px-6 rounded-2xl border border-primary/20 shadow-[0_0_30px_rgba(190,242,100,0.05)]">
                          <Hash size={18} className="text-primary" />
                          <p className="font-black text-primary uppercase tracking-widest text-[10px]">ULTRA.VIP.MIXER</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Posts Gallery */}
                <div className="glass p-1">
                  <div className="p-10 md:p-12">
                    <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-4">
                        <span className="section-label mb-0">Creaciones de {profileData?.fullName?.split(' ')[0]}</span>
                        <span className="bg-white/5 px-3 py-1 rounded-full text-[9px] font-black text-primary/60 border border-white/10 uppercase tracking-widest">
                          Total {posts.length}
                        </span>
                      </div>
                      <ImageIcon size={16} className="text-text/20" />
                    </div>

                    {posts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {posts.map((post) => (
                          <div key={post.id} className="aspect-square glass-card rounded-[32px] overflow-hidden relative group cursor-pointer shadow-2xl">
                             {post.type === 'video' ? (
                               <div className="w-full h-full flex items-center justify-center bg-surface">
                                 <Video size={40} className="text-primary/20 group-hover:text-primary transition-all duration-500 transform group-hover:scale-125" />
                                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40">
                                   <PlayCircle className="text-white" size={48} />
                                 </div>
                               </div>
                             ) : (
                               <img src={post.url} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                             )}
                             
                             <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleDownload(post.url, post.filename);
                                 }}
                                 className="bg-white/10 backdrop-blur-xl text-white p-3 rounded-2xl hover:bg-primary hover:text-background transition-all shadow-2xl border border-white/10"
                                 title="Descargar"
                                >
                                 <Download size={14} strokeWidth={3} />
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 rounded-[40px] border-2 border-dashed border-white/5">
                        <div className="w-16 h-16 bg-white/[0.01] rounded-2xl mx-auto flex items-center justify-center mb-8 border border-white/5">
                          <Upload className="text-text/20" size={24} />
                        </div>
                        <h4 className="text-white font-black uppercase tracking-widest mb-2 text-sm">Sin Contenido</h4>
                        <p className="text-text/20 text-[9px] font-bold uppercase tracking-[0.2em] mb-10">Este creador aún no ha publicado nada.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
