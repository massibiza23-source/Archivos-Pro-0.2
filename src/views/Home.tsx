import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Folder as FolderIcon, FileText, Image as ImageIcon, Video, Music, ChevronRight } from 'lucide-react';
import { FileNode, FileType } from '../types';
import { cn } from '../lib/utils';
import { Modal } from '../components/MobileOverlay';

interface HomeViewProps {
  files: FileNode[];
  onNavigateCategory: (type: FileType) => void;
  onNavigateFolder: (id: string | null) => void;
  onCreateFolder: (name: string) => void;
  key?: string;
}

export default function HomeView({ files, onNavigateCategory, onNavigateFolder, onCreateFolder }: HomeViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const rootFolders = files.filter(f => f.isFolder && f.parentId === null);
  
  const categories = [
    { id: 'document', name: 'Documentos', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/20', count: files.filter(f => f.type === 'document').length },
    { id: 'image', name: 'Imágenes', icon: ImageIcon, color: 'text-purple-400', bgColor: 'bg-purple-500/20', count: files.filter(f => f.type === 'image').length },
    { id: 'video', name: 'Vídeos', icon: Video, color: 'text-amber-400', bgColor: 'bg-amber-500/20', count: files.filter(f => f.type === 'video').length },
    { id: 'audio', name: 'Audio', icon: Music, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', count: files.filter(f => f.type === 'audio').length },
  ];

  const handleCreate = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName);
      setNewFolderName('');
      setIsModalOpen(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="p-8 space-y-12"
    >
      {/* Header */}
      <header className="pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-blue-600/30">A</span>
          ArchivoPro
        </h1>
        <p className="text-slate-400 mt-2 text-sm">Gestiona tu espacio privado de forma segura</p>
      </header>

      {/* Categories Grid */}
      <section>
        <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-6">Categorías</h2>
        <div className="grid grid-cols-2 gap-5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigateCategory(cat.id as FileType)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col items-start gap-5 hover:bg-white/10 active:scale-95 transition-all text-left group"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", cat.bgColor, cat.color)}>
                <cat.icon size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-base text-white">{cat.name}</h3>
                <p className="text-slate-400 text-[11px] mt-1 uppercase tracking-wider font-medium">{cat.count} ARCHIVOS</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Folders Carousel */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-500">Mis Carpetas</h2>
          <button 
            onClick={() => onNavigateFolder(null)}
            className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1 transition-all"
          >
            VER TODO
          </button>
        </div>
        
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 snap-x -mx-8 px-8">
          {/* Create Folder Card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="snap-start flex-shrink-0 w-48 border-2 border-dashed border-white/5 rounded-[28px] p-8 flex flex-col items-center justify-center gap-3 hover:border-white/20 active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-all">
              <Plus size={24} />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">NUEVA</p>
          </button>

          {rootFolders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onNavigateFolder(folder.id)}
              className="snap-start flex-shrink-0 w-48 bg-white/5 border border-white/10 rounded-[28px] p-6 flex flex-col items-start gap-4 hover:border-blue-500/50 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FolderIcon className="text-blue-400" size={24} />
              </div>
              <div className="text-left w-full">
                <p className="text-sm font-semibold text-white truncate">{folder.name}</p>
                <p className="text-slate-500 text-[10px] font-bold mt-1 tracking-widest uppercase">
                  {files.filter(f => f.parentId === folder.id).length} ITEMS
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Carpeta"
        footer={(
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 glass-button py-4 rounded-2xl text-sm font-bold text-slate-400"
            >
              CANCELAR
            </button>
            <button 
              onClick={handleCreate}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              CREAR
            </button>
          </div>
        )}
      >
        <input 
          autoFocus
          type="text" 
          placeholder="Nombre de la carpeta..."
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-base font-medium focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
        />
      </Modal>
    </motion.div>
  );
}
