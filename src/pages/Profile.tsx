/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User, 
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
  AlertCircle
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function Profile() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.isLoggedIn) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (auth.currentUser) {
        try {
          const q = query(
            collection(db, 'posts'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const fetchedPosts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPosts(fetchedPosts);
          setErrorMsg(null);
        } catch (error: any) {
          console.error("Error fetching posts:", error);
          setErrorMsg(error.message || "Error al cargar publicaciones");
        } finally {
          setLoadingPosts(false);
        }
      }
    };

    fetchPosts();
  }, []);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'mi-archivo-vidamixe';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading:", error);
      window.open(url, '_blank');
    }
  };

  if (!user) return null;

  const navItems = [
    { label: 'Inicio', icon: <Home size={20} />, path: '/' },
    { label: 'Perfil', icon: <User size={20} />, path: '/profile', active: true },
    { label: 'Vídeos', icon: <Video size={20} />, path: '#' },
    { label: 'Publicar', icon: <Upload size={20} />, path: '/publish' },
    { label: 'Mensajes', icon: <MessageSquare size={20} />, path: '#' },
    { label: 'Chat', icon: <Hash size={20} />, path: '#' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <nav className="w-full md:w-24 lg:w-72 bg-surface border-r border-white/5 flex flex-col p-6 z-10 sticky top-0 h-screen">
          <div className="mb-12 px-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-background font-black text-xl">V</span>
            </div>
            <span className="hidden lg:block font-black text-2xl tracking-tighter text-primary">VIDEOSONIC</span>
          </div>

          <div className="flex-1 space-y-3">
            {navItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all group ${
                  item.active 
                    ? 'bg-primary text-background shadow-lg shadow-primary/10' 
                    : 'text-text/40 hover:bg-white/5 hover:text-text'
                }`}
              >
                <div className={item.active ? 'text-background' : 'group-hover:scale-110 transition-transform'}>
                  {item.icon}
                </div>
                <span className={`hidden lg:block font-bold text-sm tracking-wide uppercase ${item.active ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group mt-8"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="hidden lg:block font-bold text-sm tracking-wide uppercase">Salir</span>
          </button>
        </nav>
      )}

      {/* Bottom Nav for Mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all ${
                item.active ? 'text-primary' : 'text-text/30'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1.5 p-2 text-red-400/60 font-bold"
          >
            <LogOut size={20} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Salir</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          {/* Header */}
          <header className="mb-10 md:mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-4 md:hidden mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-background font-black text-xl">V</span>
                </div>
                <span className="font-black text-2xl tracking-tighter text-primary">VIDEOSONIC</span>
              </div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-black tracking-tight text-text"
              >
                Perfil
              </motion.h1>
              <p className="text-text/40 mt-3 font-medium uppercase tracking-[0.2em] text-[10px] md:text-xs">Panel de Control Personal</p>
            </div>
            <div className="hidden md:flex gap-4">
              <button className="px-6 py-3 bg-surface/50 text-text/60 rounded-xl font-bold hover:text-text border border-white/5 transition-all flex items-center gap-2">
                <Settings size={18} />
                <span>Ajustes</span>
              </button>
            </div>
          </header>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-4"
            >
              <div className="glass p-10 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                
                <div className="relative inline-block mb-8">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-background border-[6px] border-surface shadow-2xl relative z-10 ring-1 ring-white/10">
                    <img 
                      src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 border-[6px] border-surface rounded-full z-20" />
                </div>
                
                <h3 className="text-2xl font-black text-text mb-1">{user.fullName}</h3>
                <p className="text-primary font-bold text-xs uppercase tracking-widest">{user.email}</p>
                
                <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="border-r border-white/5">
                    <span className="block font-black text-2xl text-text">1.2k</span>
                    <span className="text-[10px] text-text/30 uppercase tracking-[0.2em] font-bold">Fans</span>
                  </div>
                  <div>
                    <span className="block font-black text-2xl text-text">482</span>
                    <span className="text-[10px] text-text/30 uppercase tracking-[0.2em] font-bold">Siguiendo</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-8 space-y-8"
            >
              <div className="glass p-10">
                <h3 className="text-lg font-bold mb-10 flex items-center gap-3 text-text/80 uppercase tracking-widest">
                  <User size={18} className="text-primary" />
                  Datos Registrados
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.2em]">Nombre Completo</span>
                    <div className="flex items-center gap-4 py-3 bg-background/30 px-4 rounded-xl border border-white/5">
                      <User size={20} className="text-text/20" />
                      <p className="font-bold text-text/80">{user.fullName}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.2em]">Email Principal</span>
                    <div className="flex items-center gap-4 py-3 bg-background/30 px-4 rounded-xl border border-white/5">
                      <Mail size={20} className="text-text/20" />
                      <p className="font-bold text-text/80">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.2em]">Nacimiento</span>
                    <div className="flex items-center gap-4 py-3 bg-background/30 px-4 rounded-xl border border-white/5">
                      <Calendar size={20} className="text-text/20" />
                      <p className="font-bold text-text/80">{new Date(user.birthDate).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.2em]">Suscripción</span>
                    <div className="flex items-center gap-4 py-3 bg-primary/10 px-4 rounded-xl border border-primary/20">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <p className="font-bold text-primary italic lowercase">video.ultra.premium</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Posts Gallery */}
              <div className="glass p-10">
                <h3 className="text-lg font-bold mb-8 flex items-center justify-between text-text/80 uppercase tracking-widest">
                  <div className="flex items-center gap-3">
                    <ImageIcon size={18} className="text-primary" />
                    Mis Publicaciones
                  </div>
                  <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md">{posts.length}</span>
                </h3>

                {loadingPosts ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="aspect-square bg-white/5 rounded-xl" />
                    ))}
                  </div>
                ) : errorMsg ? (
                  <div className="text-center py-12 border-2 border-dashed border-red-500/10 rounded-2xl">
                    <AlertCircle className="mx-auto mb-4 text-red-500/40" size={32} />
                    <p className="text-red-500/60 font-bold mb-4">{errorMsg}</p>
                    <button onClick={() => window.location.reload()} className="btn-primary text-xs px-6 py-2">Reintentar</button>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {posts.map((post) => (
                      <div key={post.id} className="aspect-square bg-background rounded-xl overflow-hidden border border-white/5 relative group cursor-pointer shadow-lg">
                         {post.type === 'video' ? (
                           <div className="w-full h-full flex items-center justify-center bg-black/40">
                             <Video className="text-text/20 group-hover:text-primary transition-colors" size={32} />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                               <PlayCircle className="text-white" size={40} />
                             </div>
                           </div>
                         ) : (
                           <img src={post.url} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         )}
                         <div className="absolute top-2 right-2 flex gap-1">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDownload(post.url, post.filename);
                             }}
                             className="bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-primary hover:text-background transition-colors"
                             title="Descargar"
                           >
                             <Download size={12} />
                           </button>
                           <span className="bg-black/60 backdrop-blur-md text-[8px] text-white px-2 py-0.5 rounded-full font-bold uppercase flex items-center">
                             {post.type}
                           </span>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                    <Upload className="mx-auto mb-4 text-text/20" size={32} />
                    <p className="text-text/40 font-bold mb-4">Aún no has publicado nada</p>
                    <Link to="/publish" className="btn-primary text-xs px-6 py-2">Subir mi primer video</Link>
                  </div>
                )}
              </div>

              {/* Activity Section */}
              <div className="glass p-10 flex items-center gap-8 group cursor-pointer hover:bg-surface/90 transition-colors">
                <div className="w-24 h-24 bg-background rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/5 shadow-xl group-hover:scale-105 transition-transform">
                  <Video className="text-primary" size={32} />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1 block">Reciente</span>
                  <h4 className="text-xl font-bold text-text mb-1">Descubriendo Nuevos Horizontes</h4>
                  <p className="text-sm text-text/30">Has visto el 80% de este contenido</p>
                </div>
                <ChevronRight className="text-text/20 group-hover:text-primary transition-all group-hover:translate-x-2" size={32} />
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
