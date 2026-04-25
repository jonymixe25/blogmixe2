/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
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
  Video as VideoCallIcon,
  Sparkles,
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
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
      setLoading(false);
    }, (error) => {
      console.error("Error fetching feed:", error);
      setLoading(false);
    });

    return unsub;
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, posts]);

  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 6);
  }, [posts]);

  const toggleCategory = (cat: string) => {
    if (searchTerm === cat) {
      setSearchTerm('');
    } else {
      setSearchTerm(cat);
    }
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: (currentLikes || 0) + 1
      });
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
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-20 px-4 sm:px-8 md:pl-32 lg:pl-80 bg-background overflow-x-hidden selection:bg-primary selection:text-background">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="mb-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="w-16 h-1 bg-gradient-to-r from-primary to-transparent rounded-full" />
                <span className="section-label mb-0 text-primary flex items-center gap-2">
                  <Globe size={14} />
                  Red Global Mixe
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter text-white mb-8 leading-[0.8]"
              >
                Explorar <br />
                <span className="text-primary not-italic">{settings.appName}</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-text/60 text-xl font-medium leading-relaxed max-w-lg mb-10"
              >
                La plataforma descentralizada para la expresión cultural y artística más avanzada de la región.
              </motion.p>

              <div className="flex flex-wrap gap-4">
                <Link to="/publish" className="btn-primary px-10 py-5 flex items-center gap-3 group">
                   <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                   <span>PUBLICAR CONTENIDO</span>
                </Link>
                {(['ayuuktv42@gmail.com', 'ayuuk42@gmail.com'].includes(auth.currentUser?.email?.toLowerCase().trim() || '')) && (
                  <Link to="/admin" className="glass px-8 py-5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-primary hover:border-primary/40 transition-all flex items-center gap-3">
                    <ShieldCheck size={18} />
                    Panel Maestro
                  </Link>
                )}
              </div>
            </div>

            {/* Stats / Trending Mini List */}
            <div className="lg:w-80 space-y-6">
               <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <TrendingUp size={14} />
                    Tendencias
                  </span>
                  <Link to="/feed" className="text-[8px] font-bold uppercase text-text/30 hover:text-white transition-colors">Ver Todo</Link>
               </div>
               <div className="space-y-3">
                  {trendingPosts.slice(0, 3).map((post, i) => (
                    <div key={post.id} className="glass p-3 rounded-2xl flex items-center gap-4 hover:bg-white/[0.05] transition-all cursor-pointer group">
                       <div className="w-12 h-12 rounded-xl bg-surface overflow-hidden border border-white/5">
                          <img src={post.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{post.title}</p>
                          <p className="text-[8px] font-bold text-text/40 uppercase tracking-widest">@{post.userName}</p>
                       </div>
                       <div className="text-primary">
                          <Zap size={14} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="sticky top-12 z-40 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 glass p-3 rounded-[30px] border border-white/5 shadow-2xl backdrop-blur-2xl">
           <div className="flex items-center gap-2 w-full md:w-auto">
              {['grid', 'list'].map((mode: any) => (
                <button 
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${viewMode === mode ? 'bg-primary text-background' : 'text-text/40 hover:text-white hover:bg-white/5'}`}
                >
                  {mode === 'grid' ? <Grid size={16} /> : <ListIcon size={16} />}
                  <span>{mode === 'grid' ? 'Mosaico' : 'Lista'}</span>
                </button>
              ))}
           </div>

           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial">
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80 bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-white placeholder:text-text/20 focus:outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20" size={18} />
              </div>
              <button className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all">
                <Filter size={20} />
              </button>
           </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide">
          {['Todos', ...settings.categories].map(cat => (
            <button 
              key={cat} 
              onClick={() => toggleCategory(cat === 'Todos' ? '' : cat)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                (searchTerm === cat || (cat === 'Todos' && searchTerm === '')) 
                ? 'bg-primary border-primary text-background shadow-xl shadow-primary/20' 
                : 'bg-white/5 border-white/10 text-text/40 hover:border-white/20 hover:text-white hover:scale-105'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Section */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="aspect-[4/5] bg-white/[0.02] rounded-[50px] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <motion.div 
            layout
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
              : "flex flex-col gap-12 max-w-4xl mx-auto"
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: 'spring', damping: 25, stiffness: 120 }}
                  className={`group relative glass rounded-[50px] overflow-hidden border border-white/5 hover:border-primary/20 transition-all duration-500 shadow-2xl ${
                    viewMode === 'list' ? 'flex flex-col md:flex-row h-auto md:h-80' : 'aspect-[4/5]'
                  }`}
                >
                  <div className={`${viewMode === 'list' ? 'w-full md:w-[45%]' : 'w-full h-full'} relative h-full bg-surface overflow-hidden`}>
                    {post.type === 'video' ? (
                      <div className="w-full h-full relative">
                         <video 
                          src={post.url} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onMouseOver={(e) => (e.currentTarget.play())}
                          onMouseOut={(e) => (e.currentTarget.pause())}
                          muted
                          loop
                         />
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-500">
                           <div className="w-20 h-20 bg-black/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10">
                             <Play className="text-white ml-2" size={32} fill="white" />
                           </div>
                         </div>
                      </div>
                    ) : (
                      <img 
                        src={post.url} 
                        alt="Post" 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      />
                    )}
                    
                    {/* Tags Over Photo */}
                    <div className="absolute top-8 left-8 flex flex-col gap-3 z-20">
                      <span className="glass-dark px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 backdrop-blur-xl">
                        {post.category || 'General'}
                      </span>
                      {post.likes > 20 && (
                        <span className="bg-orange-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-500/20">
                          <TrendingUp size={12} />
                          Viral
                        </span>
                      )}
                    </div>

                    <div className="absolute top-8 right-8 z-20">
                       <button 
                        onClick={() => handleDownload(post.url, post.filename)}
                        className="w-12 h-12 glass shadow-xl rounded-2xl flex items-center justify-center text-white/60 hover:text-primary transition-all backdrop-blur-xl border border-white/10"
                       >
                          <Download size={20} />
                       </button>
                    </div>
                  </div>

                  <div className={`${viewMode === 'list' ? 'flex-1 p-10' : 'absolute inset-0 p-10 flex flex-col justify-end'} pointer-events-none relative`}>
                    {viewMode === 'grid' && (
                       <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    
                    <div className="relative z-10 space-y-6 transform group-hover:-translate-y-2 transition-transform duration-500">
                       <div className="space-y-4">
                          <Link 
                            to={`/profile/${post.userId}`}
                            className="pointer-events-auto flex items-center gap-4 group/user w-fit"
                          >
                             <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 group-hover/user:border-primary/50 transition-all overflow-hidden p-0.5">
                                <div className="w-full h-full rounded-xl bg-surface-dark flex items-center justify-center">
                                   <UserIcon size={16} className="text-white/20 group-hover/user:text-primary" />
                                </div>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-white/40 group-hover/user:text-primary text-[10px] font-black tracking-widest uppercase transition-all">@{post.userName || 'usuario'}</span>
                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Creador Verificado</span>
                             </div>
                          </Link>

                          <h3 className="text-white font-black text-3xl leading-none tracking-tighter uppercase group-hover:text-primary transition-colors cursor-default drop-shadow-2xl italic">
                            {post.title || 'Publicación'}
                          </h3>
                       </div>

                       <div className="flex items-center justify-between pt-8 border-t border-white/5 pointer-events-auto opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700 delay-75">
                         <div className="flex gap-6">
                           <button 
                             onClick={() => handleLike(post.id, post.likes)}
                             className="flex items-center gap-3 text-white/60 hover:text-primary transition-all active:scale-125"
                           >
                             <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${post.likes > 0 ? 'bg-primary/10 border-primary/20 text-primary' : ''}`}>
                                <Heart size={20} fill={post.likes > 0 ? "currentColor" : "none"} />
                             </div>
                             <div className="flex flex-col items-start leading-none gap-1">
                                <span className="text-sm font-black italic tracking-tighter text-white">{post.likes || 0}</span>
                                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Likes</span>
                             </div>
                           </button>
                           
                           <button 
                             onClick={() => navigate(`/call/${post.userId}`)}
                             className="flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-primary transition-all"
                             title="Llamada Directa"
                           >
                             <VideoCallIcon size={24} />
                           </button>
                         </div>
                         
                         <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all transform hover:rotate-12">
                           <Share2 size={24} />
                         </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-40 glass rounded-[60px] border-2 border-dashed border-white/5 max-w-4xl mx-auto"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-10 border border-white/10 opacity-20">
               <Search size={48} />
            </div>
            <h3 className="text-4xl font-black italic uppercase text-white mb-6 tracking-tighter">Sin resultados</h3>
            <p className="text-text/30 mb-12 max-w-md mx-auto font-bold uppercase tracking-widest text-xs leading-loose">No encontramos publicaciones que coincidan con tu búsqueda. Prueba con otros términos o explora las categorías principales.</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="btn-primary px-12 py-5"
            >
              Reiniciar Búsqueda
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
