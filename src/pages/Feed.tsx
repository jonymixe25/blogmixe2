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
  Download
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { settings } = useApp();

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, []);

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
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-2"
            >
              Explorar <span className="text-primary italic">{settings.appName}</span>
            </motion.h1>
            <p className="text-text/40 font-medium">Descubre el talento y la cultura de nuestra comunidad</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-background' : 'text-text/40 hover:text-white'}`}
              >
                <Grid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-background' : 'text-text/40 hover:text-white'}`}
              >
                <ListIcon size={20} />
              </button>
            </div>
            
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all w-40 md:w-64"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="aspect-[4/5] bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <motion.div 
            layout
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col gap-8 max-w-2xl mx-auto"
            }
          >
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative overflow-hidden glass hover:border-primary/30 transition-all ${
                    viewMode === 'list' ? 'rounded-3xl' : 'rounded-3xl aspect-[4/5]'
                  }`}
                >
                  {post.type === 'video' ? (
                    <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
                       <video 
                        src={post.url} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        onMouseOver={(e) => (e.currentTarget.play())}
                        onMouseOut={(e) => (e.currentTarget.pause())}
                        muted
                        loop
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <Play className="text-white group-hover:scale-125 transition-transform" size={48} fill="white" />
                       </div>
                    </div>
                  ) : (
                    <img 
                      src={post.url} 
                      alt="Post" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  )}

                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <UserIcon size={14} className="text-primary" />
                      </div>
                      <span className="text-white text-sm font-bold truncate">@usuario</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <button className="flex items-center gap-1.5 text-white/80 hover:text-primary transition-colors">
                          <Heart size={18} />
                          <span className="text-xs font-bold">12</span>
                        </button>
                        <button 
                          onClick={() => handleDownload(post.url, post.filename)}
                          className="flex items-center gap-1.5 text-white/80 hover:text-primary transition-colors"
                          title="Descargar archivo"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                      <button className="text-white/80 hover:text-white">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="glass-dark px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
                      {post.type}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-24 glass rounded-3xl border-2 border-dashed border-white/5">
            <h3 className="text-2xl font-bold text-text/40">No hay publicaciones todavía</h3>
            <p className="text-text/20 mb-8">Sé el primero en compartir algo increíble.</p>
            <Link to="/publish" className="btn-primary px-8 py-3">Publicar Ahora</Link>
          </div>
        )}
      </div>
    </div>
  );
}
