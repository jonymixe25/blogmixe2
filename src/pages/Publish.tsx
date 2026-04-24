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

export default function Publish() {
  const { user } = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('success');
        setMessage('¡Publicación exitosa!');
        setFile(null);
        setPreview(null);
      } else {
        setStatus('error');
        setMessage('Error al subir el archivo');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error de conexión');
    } finally {
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
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <Link to="/profile" className="flex items-center gap-2 text-text/40 hover:text-text transition-colors mb-4 group">
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-xs uppercase tracking-widest">Volver al Perfil</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Publicar</h1>
            <p className="text-text/40 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">Sube tus fotos o videos</p>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-12"
        >
          <form onSubmit={handleUpload} className="space-y-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer group ${
                file ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-primary/50'
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
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative"
                  >
                    {file?.type.startsWith('video') ? (
                      <video src={preview} className="max-h-64 mx-auto rounded-xl shadow-2xl" controls />
                    ) : (
                      <img src={preview} className="max-h-64 mx-auto rounded-xl shadow-2xl" alt="Preview" />
                    )}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="w-20 h-20 bg-background rounded-3xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Plus className="text-primary" size={32} />
                    </div>
                    <p className="text-xl font-bold">Haz clic para seleccionar</p>
                    <p className="text-text/30 text-sm">Soportamos Videos y Fotos de alta calidad</p>
                    <div className="flex justify-center gap-4 pt-4">
                      <div className="flex items-center gap-2 text-text/40 px-4 py-2 bg-white/5 rounded-full">
                        <Video size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Video</span>
                      </div>
                      <div className="flex items-center gap-2 text-text/40 px-4 py-2 bg-white/5 rounded-full">
                        <ImageIcon size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Imagen</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3"
              >
                <CheckCircle2 size={20} />
                <span className="font-bold">{message}</span>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3"
              >
                <AlertCircle size={20} />
                <span className="font-bold">{message}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload size={24} />
                  <span>PUBLICAR AHORA</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
