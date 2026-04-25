import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Database, Trash2, Plus, RefreshCw, Save, HardDrive, Video, Search } from 'lucide-react';

interface LocalDataItem {
  key: string;
  value: string;
  updated_at: string;
}

interface LocalFile {
  name: string;
  size: number;
  mtime: string;
  path: string;
}

export default function LocalDatabase() {
  const [data, setData] = useState<LocalDataItem[]>([]);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [fileSearch, setFileSearch] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/local/data');
      const result = await response.json();
      if (response.ok) {
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch local data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch('/api/local/files');
      const result = await response.json();
      if (response.ok) {
        setFiles(result);
      }
    } catch (err) {
      console.error('Failed to fetch local files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFiles();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    try {
      const response = await fetch('/api/local/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, value: newValue }),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Dato guardado localmente' });
        setNewKey('');
        setNewValue('');
        fetchData();
      } else {
        setStatus({ type: 'error', message: 'Error al guardar' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error de conexión' });
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const response = await fetch(`/api/local/data/${key}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase()));

  const stats = React.useMemo(() => {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const videoCount = files.filter(f => f.name.match(/\.(mp4|webm|ogg)$/i)).length;
    const imageCount = files.length - videoCount;
    return {
      totalSize: (totalSize / 1024 / 1024).toFixed(2),
      videoCount,
      imageCount
    };
  }, [files]);

  return (
    <div className="min-h-screen pt-32 pb-20 px-8 max-w-6xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-0.5 bg-primary rounded-full" />
          <span className="section-label mb-0">Almacenamiento Local (SQLite)</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-white uppercase leading-none mb-8">
          Base de Datos <br />
          <span className="text-primary">Independiente</span>
        </h1>
        
        <p className="text-text/40 text-sm font-bold uppercase tracking-[0.3em] max-w-2xl">
          Este sistema utiliza SQLite integrado en el servidor para almacenar datos persistentes que no dependen de la nube (Firebase).
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Form Container */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-12"
        >
          <div className="glass p-1">
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-10">
                <span className="section-label mb-0">Insertar Nuevo Registro</span>
                <Plus size={16} className="text-primary/40" />
              </div>

              <form onSubmit={handleSave} className="grid md:grid-cols-3 gap-6 items-end">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Clave (Key)</label>
                  <input 
                    type="text"
                    className="input-field py-4 px-6 rounded-2xl bg-white/[0.01] border-white/5 shadow-inner font-bold"
                    placeholder="ej. config_lang"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Valor (Value)</label>
                  <input 
                    type="text"
                    className="input-field py-4 px-6 rounded-2xl bg-white/[0.01] border-white/5 shadow-inner font-bold"
                    placeholder="ej. es_MX"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="btn-primary py-4 px-8 flex items-center justify-center gap-3 h-[58px]"
                >
                  <Save size={18} />
                  <span className="tracking-[0.2em] font-black text-[10px]">GUARDAR EN DISCO</span>
                </button>
              </form>

              {status && (
                <div className={`mt-6 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest ${status.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                  {status.message}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* List Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-12"
        >
          <div className="glass p-1">
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <span className="section-label mb-0">Contenido Multimedia Local (/uploads)</span>
                    <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-primary border border-white/10 uppercase tracking-widest">
                      {files.length} ARCHIVOS
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-text/30">
                    <div className="flex items-center gap-2">
                       <span className="text-white/60">{stats.totalSize} MB</span> USADOS
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-white/60">{stats.videoCount}</span> VIDEOS
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-white/60">{stats.imageCount}</span> IMÁGENES
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="FILTRAR ARCHIVOS..." 
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[10px] font-black text-white focus:outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all w-48"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary transition-colors" size={14} />
                  </div>
                  <button onClick={fetchFiles} className="text-text/20 hover:text-primary transition-colors p-2 bg-white/5 rounded-xl border border-white/10">
                    <RefreshCw size={18} className={loadingFiles ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                  <div key={file.name} className="group relative aspect-square glass-card rounded-2xl overflow-hidden shadow-xl">
                    {file.name.match(/\.(mp4|webm|ogg)$/i) ? (
                      <div className="w-full h-full bg-surface flex items-center justify-center">
                        <Video size={24} className="text-primary/40" />
                      </div>
                    ) : (
                      <img src={file.path} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                       <p className="text-[8px] font-black text-white truncate uppercase tracking-tighter mb-1">{file.name}</p>
                       <p className="text-[8px] font-black text-primary uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center opacity-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin archivos multimedia</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* SQL Table Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-12"
        >
          <div className="glass p-1">
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <span className="section-label mb-0">Registros en SQLite</span>
                  <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-primary border border-white/10 uppercase tracking-widest">
                    {data.length} TOTAL
                  </div>
                </div>
                <button onClick={fetchData} className="text-text/20 hover:text-primary transition-colors">
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-6 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Clave</th>
                      <th className="text-left py-6 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Valor</th>
                      <th className="text-left py-6 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Actualizado</th>
                      <th className="text-right py-6 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.length > 0 ? data.map((item) => (
                      <tr key={item.key} className="group hover:bg-white/[0.01] transition-colors">
                        <td className="py-6 px-4 font-mono text-primary font-black text-xs uppercase tracking-tighter">{item.key}</td>
                        <td className="py-6 px-4 text-sm font-bold text-white/80">{item.value}</td>
                        <td className="py-6 px-4 text-[9px] font-bold text-text/20 uppercase tracking-widest">
                          {new Date(item.updated_at).toLocaleString()}
                        </td>
                        <td className="py-6 px-4 text-right">
                          <button 
                            onClick={() => handleDelete(item.key)}
                            className="p-3 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-10">
                            <HardDrive size={48} />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin registros locales</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
