/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  X, 
  Video, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useIsMobile } from '../hooks/useIsMobile';

import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Publish() {
  const { user } = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tendencias');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Tendencias', 'Cultura', 'Música', 'Gaming', 'Arte', 'Vlogs'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setStatus('idle');
      setProgress(0);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) return;

    setUploading(true);
    setStatus('idle');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // We'll use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const p = (event.loaded / event.total) * 100;
          setProgress(p);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          const localUrl = response.path;
          
          try {
            // Save record to Firestore (still using Firestore for metadata sync)
            await addDoc(collection(db, 'posts'), {
              userId: auth.currentUser!.uid,
              userName: user?.fullName || 'Usuario',
              title: title || 'Sin título',
              category: category,
              url: localUrl,
              type: file.type.startsWith('video') ? 'video' : 'image',
              createdAt: serverTimestamp(),
              filename: response.filename,
              likes: 0
            });

            setStatus('success');
            setMessage('¡Publicación exitosa! Guardado en almacenamiento local.');
            setFile(null);
            setPreview(null);
            
            setTimeout(() => navigate('/profile'), 1500);
          } catch (err) {
            console.error("Firestore error:", err);
            setStatus('error');
            setMessage('Archivo subido localmente, pero hubo un error al sincronizar con la nube.');
          } finally {
            setUploading(false);
          }
        } else {
          setStatus('error');
          setMessage('Error al subir al servidor local.');
          setUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        setStatus('error');
        setMessage('Error de conexión con el servidor local.');
        setUploading(false);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);

    } catch (error) {
      console.error("Critical upload error:", error);
      setStatus('error');
      setMessage('Error crítico durante la subida.');
      setUploading(false);
    }
  };

  if (!user || !user.isLoggedIn) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center p-6">
         <div className="glass p-10 text-center max-w-sm">
           <AlertCircle className="mx-auto mb-4 text-primary" size={48} />
           <h2 className="text-xl font-bold mb-4">Inicia sesión</h2>
           <p className="text-text/50 mb-6">Debes estar registrado para publicar contenido.</p>
           <Link to="/" className="btn-primary inline-block">Ir al Inicio</Link>
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-16 md:pl-32 lg:pl-80 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-16">
          <Link to="/profile" className="inline-flex items-center gap-3 text-text/30 hover:text-primary transition-all mb-8 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Volver al Perfil</span>
          </Link>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white uppercase mb-4 leading-none">
            Crear <br />
            <span className="text-primary">Nueva Obra</span>
          </h1>
          <p className="text-text/30 font-bold uppercase tracking-[0.3em] text-[10px]">Comparte tu visión con el mundo</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-1 items-start"
        >
          <form onSubmit={handleUpload} className="p-8 md:p-12 space-y-12">
            <div className="grid md:grid-cols-2 gap-12">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-[40px] p-8 text-center transition-all duration-500 cursor-pointer group flex flex-col items-center justify-center min-h-[350px] shadow-2xl ${
                  file ? 'border-primary/40 bg-primary/[0.02]' : 'border-white/5 bg-white/[0.01] hover:border-primary/20 hover:bg-white/[0.03]'
                }`}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*,image/*"
                />

                <AnimatePresence mode="wait">
                  {preview ? (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative w-full h-full flex flex-col items-center"
                    >
                      {file?.type.startsWith('video') ? (
                        <video src={preview} className="w-full max-h-[300px] object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]" controls />
                      ) : (
                        <img src={preview} className="w-full max-h-[300px] object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]" alt="Preview" />
                      )}
                      
                      <div className="mt-6 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Archivo seleccionado</span>
                        <span className="text-text/30 text-[9px] truncate max-w-[200px]">{file?.name}</span>
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreview(null);
                        }}
                        className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-20 border-4 border-background"
                      >
                        <X size={20} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="prompt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6 flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-white/[0.03] border border-white/5 rounded-[24px] mx-auto flex items-center justify-center group-hover:scale-110 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-500 shadow-2xl">
                        <Plus className="text-primary" size={32} />
                      </div>
                      <div className="text-center">
                        <p className="font-display font-black text-white uppercase tracking-wider mb-1">Seleccionar Contenido</p>
                        <p className="text-text/20 text-[9px] font-bold uppercase tracking-widest leading-loose">Solo archivos de alta calidad<br />JPG, PNG, MP4 hasta 50MB</p>
                      </div>
                      <div className="flex justify-center gap-4 pt-4">
                        <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5"><Video size={16} className="text-text/30" /></div>
                        <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5"><ImageIcon size={16} className="text-text/30" /></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-10 flex flex-col justify-center">
                <div className="space-y-4">
                  <label className="section-label">Título de la publicación</label>
                  <input 
                    type="text"
                    required
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Dale un nombre a tu obra..."
                    className="input-field rounded-[20px] bg-white/[0.01] border-white/5 shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                  <label className="section-label">Seleccionar Categoría</label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          category === cat 
                            ? 'bg-primary text-background border-primary shadow-[0_0_20px_rgba(190,242,100,0.1)]' 
                            : 'bg-white/[0.01] text-text/30 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-8">
              {uploading && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Subiendo...</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text/30">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-white/[0.02] rounded-full h-3 overflow-hidden border border-white/5 relative">
                    <motion.div 
                      className="bg-primary h-full absolute top-0 left-0"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: 'spring', damping: 20 }}
                    />
                  </div>
                </div>
              )}

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
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
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-3xl flex items-center gap-4 shadow-2xl"
                  >
                    <AlertCircle size={24} />
                    <span className="text-xs font-black uppercase tracking-widest leading-none">{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={!file || uploading}
                className="btn-primary w-full py-6 flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden group"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span className="tracking-[0.2em]">PROCESANDO...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                    <span className="tracking-[0.2em] text-sm">PUBLICAR AHORA</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
