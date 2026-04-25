/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  AlertCircle, 
  ArrowLeft, 
  Loader2,
  Sparkles,
  Wand2,
  CheckCircle2,
  Info
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
  const [suggesting, setSuggesting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = ['TENDENCIAS', 'CULTURA', 'MÚSICA', 'JUEGO DE AZAR', 'ARTE', 'VLOGS'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.size > 50 * 1024 * 1024) {
      setStatus('error');
      setMessage('El archivo es demasiado grande (máx 50MB)');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
    setStatus('idle');
    setProgress(0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
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

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const p = (event.loaded / event.total) * 100;
          setProgress(p);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const localUrl = response.path;
            
            try {
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
              setMessage('¡Publicación exitosa! Guardado en disco local.');
              setFile(null);
              setPreview(null);
              setTimeout(() => navigate('/profile'), 2000);
            } catch (err) {
              console.error("Firestore error:", err);
              setStatus('error');
              setMessage('Subido localmente, pero falló la sincronización con la nube.');
            } finally {
              setUploading(false);
            }
          } catch (e) {
            setStatus('error');
            setMessage('Error al procesar la respuesta del servidor.');
            setUploading(false);
          }
        } else {
          let errorMsg = 'Error al subir al servidor local.';
          try {
            const errorRes = JSON.parse(xhr.responseText);
            if (errorRes.error) errorMsg = errorRes.error;
          } catch (e) {}
          setStatus('error');
          setMessage(`${errorMsg} (Estado: ${xhr.status})`);
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
      setStatus('error');
      setMessage('Error crítico durante la subida.');
      setUploading(false);
    }
  };

  const suggestTitle = async () => {
    if (!category || suggesting) return;
    setSuggesting(true);
    try {
      const response = await fetch('/api/ai/suggest-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      const data = await response.json();
      if (data.suggestion) {
        setTitle(data.suggestion);
      }
    } catch (err) {
      console.error("Gemini error:", err);
    } finally {
      setSuggesting(false);
    }
  };

  if (!user || !user.isLoggedIn) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center p-6">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="glass p-12 rounded-[40px] text-center max-w-md w-full border border-white/5"
         >
           <AlertCircle className="mx-auto mb-6 text-primary" size={64} />
           <h2 className="text-3xl font-black uppercase text-white mb-4 tracking-tighter">Acceso Restringido</h2>
           <p className="text-text/40 mb-10 font-bold uppercase tracking-widest text-[10px]">Debes ser miembro para publicar contenido.</p>
           <Link to="/register" className="btn-primary w-full py-5">Registrarse Ahora</Link>
         </motion.div>
       </div>
     );
  }

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-8 bg-background relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-6">
             <Link to="/feed" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-text/40 hover:text-white transition-all group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver al Feed
            </Link>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-0.5 bg-primary rounded-full" />
              <span className="section-label mb-0 text-primary">Content Creation House</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter text-white leading-[0.75] mb-0">
               Crear <br />
               <span className="text-primary not-italic">Viral</span>
            </h1>
          </div>
          
          <div className="glass p-2 rounded-3xl hidden lg:block">
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 max-w-[240px]">
              <div className="flex items-center gap-3 mb-3">
                <Info size={16} className="text-primary" />
                <span className="text-[10px] font-black uppercase text-white/80 tracking-widest">Almacenamiento Local</span>
              </div>
              <p className="text-[9px] font-bold text-text/40 leading-relaxed uppercase tracking-wider">
                Tus archivos se guardan en el servidor local independiente de la nube para máxima persistencia.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleUpload} className="grid lg:grid-cols-12 gap-12">
          {/* Upload Box */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-12 xl:col-span-7"
          >
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative aspect-[4/5] sm:aspect-video xl:aspect-square rounded-[60px] border-2 border-dashed transition-all duration-700 overflow-hidden group
                ${dragActive ? 'border-primary bg-primary/5' : 'border-white/5 hover:border-white/10 bg-white/[0.01]'}
                ${preview ? 'border-none' : ''}
              `}
            >
              {preview ? (
                <div className="w-full h-full relative">
                  {file?.type.startsWith('video') ? (
                    <video src={preview} className="w-full h-full object-cover" autoPlay muted loop />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                    <button 
                      type="button" 
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="p-6 bg-red-500 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-3xl"
                    >
                      <Plus className="rotate-45" size={32} />
                    </button>
                  </div>
                  <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                    <div className="glass p-4 rounded-3xl backdrop-blur-xl border border-white/10">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Archivo:</p>
                      <p className="text-[12px] font-black text-white truncate max-w-[200px] uppercase italic tracking-tighter">{file?.name}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                      {file?.type.startsWith('video') ? <Video size={20} /> : <ImageIcon size={20} />}
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center p-12 cursor-pointer"
                >
                  <motion.div 
                    animate={dragActive ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
                    className="w-40 h-40 bg-white/[0.03] rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 border border-white/5 relative"
                  >
                    <Upload className={`text-text/20 transition-all ${dragActive ? 'text-primary' : ''}`} size={48} />
                    {dragActive && <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20" />}
                  </motion.div>
                  <h3 className="text-4xl font-black uppercase text-white mb-4 tracking-tighter italic">Soltar Archivo</h3>
                  <p className="text-[10px] font-black text-text/30 uppercase tracking-[0.4em] max-w-xs text-center leading-loose">
                    Imágenes o videos hasta 50MB. <br />
                    Formatos recomendados: MP4, JPEG, PNG.
                  </p>
                  <div className="mt-12 px-8 py-4 bg-primary text-background text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/20">
                    Elegir de mi disco
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*" 
              />
            </div>
          </motion.div>

          {/* Details Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-12 xl:col-span-5 flex flex-col gap-8"
          >
            <div className="glass p-1 rounded-[60px]">
              <div className="p-10 md:p-14 md:pt-16">
                <div className="space-y-12">
                  {/* Title Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                       <label className="section-label mb-0">Título Viral</label>
                       <button 
                        type="button" 
                        onClick={suggestTitle}
                        disabled={suggesting}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-all bg-primary/5 px-4 py-2 rounded-full border border-primary/10 hover:border-primary/40"
                       >
                         {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                         <span>{suggesting ? 'Generando...' : 'Optimizar con IA'}</span>
                       </button>
                    </div>
                    <input 
                      type="text"
                      required
                      placeholder="Escribe algo impactante..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-field py-6 px-8 rounded-3xl bg-white/[0.01] border-white/5 shadow-2xl text-xl font-bold italic uppercase tracking-tighter"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-6">
                    <label className="section-label px-2">Seleccionar Categoría</label>
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`
                            py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300
                            ${category === cat 
                              ? 'bg-primary border-primary text-background shadow-xl shadow-primary/20 scale-105' 
                              : 'bg-white/[0.02] border-white/5 text-text/40 hover:border-white/10 hover:text-white hover:bg-white/[0.04]'
                            }
                          `}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Area */}
                  <div className="pt-10 border-t border-white/5">
                    {uploading ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse italic">Publicando contenido</span>
                            <span className="text-[9px] font-bold text-text/40 uppercase tracking-widest">No cierres esta ventana</span>
                          </div>
                          <span className="text-3xl font-black text-white italic font-mono leading-none tracking-tighter">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <motion.div 
                            className="h-full bg-primary rounded-full shadow-lg shadow-primary/40 relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', damping: 20 }}
                          >
                             <div className="absolute top-0 right-0 h-full w-2 bg-white/40 blur-sm" />
                          </motion.div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <AnimatePresence mode="wait">
                          {status === 'success' && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-6 rounded-3xl bg-primary/10 border border-primary/20 flex items-center gap-4 text-primary"
                            >
                              <CheckCircle2 size={24} />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Transmisión Completa</p>
                                <p className="text-[9px] font-bold opacity-60 uppercase">{message}</p>
                              </div>
                            </motion.div>
                          )}
                          {status === 'error' && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500"
                            >
                              <AlertCircle size={24} />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Falló la conexión</p>
                                <p className="text-[9px] font-bold opacity-60 uppercase">{message}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button 
                          type="submit"
                          disabled={!file || !title || uploading}
                          className="w-full btn-primary py-8 flex items-center justify-center gap-5 text-[14px] disabled:opacity-20 transition-all shadow-3xl shadow-primary/10 group overflow-hidden relative"
                        >
                           <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                           <span className="relative z-10 lg:tracking-[0.4em]">PUBLICAR AHORA</span>
                           <motion.div 
                            className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"
                           />
                        </button>
                        
                        <div className="flex items-center gap-3 justify-center opacity-30">
                          <Sparkles size={12} className="text-primary" />
                          <p className="text-[8px] font-bold uppercase tracking-[0.4em]">Propulsado por SQLite & IA</p>
                          <Sparkles size={12} className="text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
