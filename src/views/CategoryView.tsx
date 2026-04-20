import { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Edit2, Trash2, MoreHorizontal, FileText, Image as ImageIcon, Video, Music, Copy, Scissors } from 'lucide-react';
import { FileNode, FileType } from '../types';
import { cn, formatSize, formatDate } from '../lib/utils';
import { FileIcon } from '../components/FileIcon';
import { Modal, BottomSheet } from '../components/MobileOverlay';
import { FilePreview } from '../components/FilePreview';
import { storage } from '../lib/storage';

interface CategoryViewProps {
  type: FileType;
  files: FileNode[];
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onCopy: (nodes: FileNode[]) => void;
  onCut: (nodes: FileNode[]) => void;
  onPaste: (parentId: string | null) => void;
  clipboard: { nodes: FileNode[]; type: 'copy' | 'cut' } | null;
  key?: string;
}

export default function CategoryView({ type, files, onDelete, onRename, onCopy, onCut }: CategoryViewProps) {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [nodeToPreview, setNodeToPreview] = useState<FileNode | null>(null);

  const items = files.filter(f => f.type === type && !f.isFolder);

  const getIcon = () => {
    switch(type) {
      case 'document': return FileText;
      case 'image': return ImageIcon;
      case 'video': return Video;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  const Icon = getIcon();

  const handleShare = async (node: FileNode) => {
    try {
      const blob = await storage.getFileData(node.id);
      if (!blob) return;
      
      const file = new File([blob], node.name, { type: node.mimeType });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: node.name,
          text: `Archivo compartido: ${node.name}`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: node.name,
          text: `Compartiendo desde ArchivoPro: ${node.name}`,
        });
      } else {
        alert('La función de compartir no está disponible en este navegador.');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleRenamePrompt = (node: FileNode) => {
    setSelectedNode(node);
    setRenameValue(node.name);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = () => {
    if (selectedNode && renameValue.trim()) {
      onRename(selectedNode.id, renameValue);
      setIsRenameModalOpen(false);
      setSelectedNode(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="p-8"
    >
      <header className="mb-12 pt-10">
        <div className={cn(
          "w-16 h-16 rounded-[24px] flex items-center justify-center mb-6",
          type === 'document' && "bg-blue-500/20 text-blue-400",
          type === 'image' && "bg-purple-500/20 text-purple-400",
          type === 'video' && "bg-amber-500/20 text-amber-400",
          type === 'audio' && "bg-emerald-500/20 text-emerald-400",
        )}>
          <Icon size={32} />
        </div>
        <h1 className="text-4xl font-bold capitalize text-white">
          {type === 'image' ? 'Imágenes' : type === 'document' ? 'Documentos' : type === 'audio' ? 'Audio' : type}
        </h1>
        <p className="text-slate-500 font-bold tracking-widest text-[11px] mt-2 uppercase">{items.length} ARCHIVOS TOTALES</p>
      </header>

      {items.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-700 italic font-medium">
          No hay archivos aquí
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div 
              key={item.id}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[28px] p-5 flex items-center gap-5 active:bg-white/15 transition-all group active:scale-[0.98]"
              onClick={() => setNodeToPreview(item)}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                <FileIcon type={item.type} size={24} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate text-white">{item.name}</h3>
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-wider text-slate-500 mt-1 uppercase">
                  <span>{formatDate(item.createdAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                  <span>{formatSize(item.size)}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedNode(item)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomSheet 
        isOpen={!!selectedNode && !isRenameModalOpen} 
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.name}
      >
        <button 
          onClick={() => { handleShare(selectedNode!); setSelectedNode(null); }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-white/5 text-base font-medium transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Share2 size={20} />
          </div>
          Compartir Archivo
        </button>
        <button 
          onClick={() => { onCopy([selectedNode!]); setSelectedNode(null); }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-white/5 text-base font-medium transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Copy size={20} />
          </div>
          Copiar
        </button>
        <button 
          onClick={() => { onCut([selectedNode!]); setSelectedNode(null); }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-white/5 text-base font-medium transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Scissors size={20} />
          </div>
          Cortar (Mover)
        </button>
        <button 
          onClick={() => handleRenamePrompt(selectedNode!)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-white/5 text-base font-medium transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Edit2 size={20} />
          </div>
          Renombrar
        </button>
        <button 
          onClick={() => { 
            if (confirm(`¿Eliminar ${selectedNode?.name}?`)) {
              onDelete(selectedNode!.id);
              setSelectedNode(null);
            }
          }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-white/5 text-base font-medium text-red-400 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <Trash2 size={20} />
          </div>
          Eliminar permanentemente
        </button>
      </BottomSheet>

      <Modal 
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)} 
        title="Renombrar"
        footer={(
          <button 
            onClick={handleRenameSubmit}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            GUARDAR CAMBIOS
          </button>
        )}
      >
        <input 
          autoFocus
          type="text" 
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-base font-medium focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
        />
      </Modal>

      <FilePreview 
        node={nodeToPreview} 
        onClose={() => setNodeToPreview(null)} 
      />
    </motion.div>
  );
}
