/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  User as UserIcon,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  Download,
  ShieldCheck,
  Video as VideoCallIcon
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const { settings } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetchedPosts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching feed:", error);
      setLoading(false);
    });

    return unsub;
  }, []);

  useEffect(() => {
    const results = posts.filter(post => 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(results);
  }, [searchTerm, posts]);

  const toggleCategory = (cat: string) => {
    if (searchTerm === cat) {
      setSearchTerm('');
    } else {
      setSearchTerm(cat);
    }
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    // This is a simple implementation. In production, use transactions and a subcollection of likes.
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: (currentLikes || 0) + 1
      });
      // Locally update state for better UX
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

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
      // Fallback: abrir en nueva pestaña
      window.open(url, '_blank text-white');
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-20 px-4 sm:px-8 md:pl-32 lg:pl-80 bg-background overflow-x-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-20 relative">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-start gap-8">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-12 h-0.5 bg-primary rounded-full" />
              <span className="section-label mb-0">Comunidad Mixe</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white mb-6 leading-[0.9]"
            >
              Explorar <br />
              <span className="text-primary not-italic">{settings.appName}</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-text/60 max-w-lg text-lg font-medium leading-relaxed"
            >
              Descubre el talento, la música y la cultura que define a nuestra comunidad en una sola plataforma.
            </motion.p>

            {(['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(auth.currentUser?.email?.toLowerCase().trim() || '')) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link 
                  to="/admin"
                  className="inline-flex mt-12 items-center gap-3 px-6 py-3 bg-primary/[0.05] border border-primary/20 rounded-2xl text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-background transition-all shadow-2xl"
                >
                  <ShieldCheck size={16} />
                  Panel de Administración Central
                </Link>
              </motion.div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full justify-between">
            <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.05] backdrop-blur-xl">
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest ${viewMode === 'grid' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'text-text/40 hover:text-white'}`}
              >
                <Grid size={16} />
                <span className="hidden sm:inline">Cuadrícula</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest ${viewMode === 'list' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'text-text/40 hover:text-white'}`}
              >
                <ListIcon size={16} />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>
            
            <div className="relative group w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Buscar por título, usuario o categoría..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field py-3 pl-12 pr-6 md:w-80 shadow-2xl"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary transition-colors" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <span className="section-label">Publicaciones Recientes</span>
          <div className="h-px flex-1 mx-8 bg-white/5" />
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {settings.categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => toggleCategory(cat)}
                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all border whitespace-nowrap ${
                  searchTerm === cat ? 'bg-primary border-primary text-background' : 'border-white/10 text-text/40 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="aspect-[4/5] bg-white/[0.02] rounded-[40px] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <motion.div 
            layout
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              : "flex flex-col gap-12 max-w-4xl mx-auto"
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: 'spring', damping: 25, stiffness: 120 }}
                  className={`group glass-card ${
                    viewMode === 'list' ? 'rounded-[40px] flex flex-col md:flex-row h-auto md:h-72' : 'rounded-[40px] aspect-[4/5]'
                  }`}
                >
                  <div className={`${viewMode === 'list' ? 'w-full md:w-2/5' : 'w-full h-full'} relative h-full bg-surface`}>
                    {post.type === 'video' ? (
                      <div className="w-full h-full relative overflow-hidden">
                         <video 
                          src={post.url} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                          onMouseOver={(e) => (e.currentTarget.play())}
                          onMouseOut={(e) => (e.currentTarget.pause())}
                          muted
                          loop
                         />
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                           <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                             <Play className="text-white ml-1" size={24} fill="white" />
                           </div>
                         </div>
                      </div>
                    ) : (
                      <img 
                        src={post.url} 
                        alt="Post" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      />
                    )}
                    
                    <div className="absolute top-6 left-6 z-20">
                      <span className="glass-dark px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20 backdrop-blur-md">
                        {post.type}
                      </span>
                    </div>
                  </div>

                  <div className={`${viewMode === 'list' ? 'flex-1 p-8 md:p-10' : 'absolute inset-0 p-8'} flex flex-col justify-end pointer-events-none`}>
                    {viewMode === 'grid' && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:from-black/100 transition-all duration-500" />}
                    
                    <div className="relative z-10 w-full">
                      <div className="flex flex-col gap-2 mb-6 transform group-hover:-translate-y-2 transition-transform duration-500">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(post.category || 'General');
                          }}
                          className="pointer-events-auto w-fit text-primary text-[9px] font-black uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full mb-2 hover:bg-primary hover:text-background transition-all"
                        >
                          {post.category || 'General'}
                        </button>
                        <h3 className="text-white font-bold text-2xl leading-none tracking-tight uppercase group-hover:text-primary transition-colors cursor-default">
                          {post.title || 'Publicación'}
                        </h3>
                        <Link 
                          to={`/profile/${post.userId}`}
                          className="pointer-events-auto flex items-center gap-3 w-fit group/user"
                        >
                          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 group-hover/user:border-primary/50 transition-all">
                            <UserIcon size={12} className="text-white/40 group-hover/user:text-primary" />
                          </div>
                          <span className="text-white/40 group-hover/user:text-primary text-[10px] font-bold tracking-widest uppercase transition-all">@{post.userName || 'usuario'}</span>
                        </Link>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-white/5 pointer-events-auto opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <div className="flex gap-4">
                          <button 
                            onClick={() => handleLike(post.id, post.likes)}
                            className="flex items-center gap-2 text-white/60 hover:text-primary transition-all active:scale-125"
                          >
                            <Heart size={20} fill={post.likes > 0 ? "currentColor" : "none"} className={post.likes > 0 ? 'text-primary' : ''} />
                            <span className="text-xs font-black tracking-tighter">{post.likes || 12}</span>
                          </button>
                          <button 
                            onClick={() => navigate(`/call/${post.userId}`)}
                            className="flex items-center justify-center p-1 text-white/60 hover:text-primary transition-all"
                            title="Llamar a este creador"
                          >
                            <VideoCallIcon size={18} />
                          </button>
                          <button 
                            onClick={() => handleDownload(post.url, post.filename)}
                            className="flex items-center gap-2 text-white/60 hover:text-primary transition-all"
                            title="Descargar archivo"
                          >
                            <Download size={20} />
                          </button>
                        </div>
                        <button className="text-white/60 hover:text-white transition-all transform hover:rotate-12">
                          <Share2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-32 glass rounded-[40px] border-2 border-dashed border-white/5 max-w-4xl mx-auto">
            <h3 className="text-3xl font-black uppercase text-white mb-4">No hay publicaciones todavía</h3>
            <p className="text-text/30 mb-10 max-w-md mx-auto">Sé el primero en compartir algo increíble con la comunidad VidaMixe.</p>
            <Link to="/publish" className="btn-primary">Publicar Ahora</Link>
          </div>
        )}
      </div>
    </div>
  );
}
