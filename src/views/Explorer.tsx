import { useRef, useState } from 'react';
import React from 'react';
import { motion } from 'motion/react';
import { Plus, Upload, MoreHorizontal, Share2, Edit2, Trash2, Search, ChevronRight, FolderPlus, FilePlus, FolderUp, Copy, Scissors, ClipboardCheck, LayoutGrid, LayoutList } from 'lucide-react';
import { FileNode } from '../types';
import { storage } from '../lib/storage';
import { cn, formatSize, formatDate } from '../lib/utils';
import { FileIcon } from '../components/FileIcon';
import { Modal, BottomSheet } from '../components/MobileOverlay';
import { FilePreview } from '../components/FilePreview';

interface ExplorerViewProps {
  files: FileNode[];
  currentFolderId: string | null;
  onNavigate: (id: string | null) => void;
  onCreateFolder: (name: string, parentId?: string | null) => string;
  onUploadFile: (file: File) => void;
  onBatchImport: (items: { type: 'file' | 'folder'; name: string; file?: File; path: string }[]) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onCopy: (nodes: FileNode[]) => void;
  onCut: (nodes: FileNode[]) => void;
  onPaste: (parentId: string | null) => void;
  clipboard: { nodes: FileNode[]; type: 'copy' | 'cut' } | null;
  key?: string;
}

export default function ExplorerView({ 
  files, 
  currentFolderId, 
  onNavigate, 
  onCreateFolder, 
  onUploadFile,
  onBatchImport,
  onDelete,
  onRename,
  onCopy,
  onCut,
  onPaste,
  clipboard
}: ExplorerViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isNewContentSheetOpen, setIsNewContentSheetOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [nodeToPreview, setNodeToPreview] = useState<FileNode | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  
  const currentFolder = files.find(f => f.id === currentFolderId);
  const items = files.filter(f => f.parentId === currentFolderId);
  
  const breadcrumbs = [];
  let currId = currentFolderId;
  while (currId) {
    const folder = files.find(f => f.id === currId);
    if (folder) {
      breadcrumbs.unshift(folder);
      currId = folder.parentId;
    } else {
      break;
    }
  }

  const handleShare = async (node: FileNode) => {
    if (node.isFolder) return;
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

  const handleCreatePrompt = () => {
    setNewFolderName('');
    setIsFolderModalOpen(true);
    setIsNewContentSheetOpen(false);
  };

  const handleCreateSubmit = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName);
      setIsFolderModalOpen(false);
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

  const handleFolderImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const importedFiles = e.target.files;
    if (!importedFiles || importedFiles.length === 0) return;

    const itemsToImport: { type: 'file' | 'folder'; name: string; file?: File; path: string }[] = [];
    const seenPaths = new Set<string>();

    const filesArray = Array.from(importedFiles) as (File & { webkitRelativePath?: string })[];

    for (const file of filesArray) {
      // webkitRelativePath is available when webkitdirectory is supported and used.
      // Fallback to filename if not available (handles multi-file selection as a flat list)
      const path = file.webkitRelativePath || file.name;
      const parts = path.split('/');
      
      // Add all parent folders to the import list if not already seen
      let currentPath = '';
      if (parts.length > 1) {
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          if (!seenPaths.has(currentPath)) {
            itemsToImport.push({ type: 'folder', name: parts[i], path: currentPath });
            seenPaths.add(currentPath);
          }
        }
      }

      // Add the file itself
      itemsToImport.push({ type: 'file', name: file.name, file, path });
    }

    onBatchImport(itemsToImport);
    setIsNewContentSheetOpen(false);
    // Reset input value so same folder can be re-imported if needed
    e.target.value = '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col min-h-full"
    >
      {/* Header & Breadcrumbs */}
      <header className="px-8 pt-10 pb-6 sticky top-0 theme-header z-30">
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => onNavigate(null)} className="hover:text-blue-400 transition-colors">
            HOME
          </button>
          {breadcrumbs.map((bc, i) => (
            <div key={bc.id} className="flex items-center gap-2">
              <ChevronRight size={10} className="text-slate-700" />
              <button 
                onClick={() => onNavigate(bc.id)}
                className={cn(
                  "hover:text-blue-400 transition-colors",
                  i === breadcrumbs.length - 1 && "text-slate-200"
                )}
              >
                {bc.name}
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold truncate flex-1 text-white">
            {currentFolder ? currentFolder.name : 'Mis Archivos'}
          </h1>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'gallery' : 'list')}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
              title={viewMode === 'list' ? 'Vista Galería' : 'Vista Lista'}
            >
              {viewMode === 'list' ? <LayoutGrid size={20} /> : <LayoutList size={20} />}
            </button>
            {clipboard && (
              <button 
                onClick={() => onPaste(currentFolderId)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm font-bold flex-col gap-0.5"
                title={`Pegar ${clipboard.nodes.length} items`}
              >
                <ClipboardCheck size={20} />
              </button>
            )}
            <button 
              onClick={() => setIsNewContentSheetOpen(true)}
              className="text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg pb-0.5 active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
        
        <input 
          type="file" 
          multiple
          hidden 
          ref={fileInputRef} 
          onChange={(e) => {
            const uploaded = Array.from(e.target.files || []) as File[];
            if (uploaded.length > 0) {
              onBatchImport(uploaded.map(f => ({ type: 'file', name: f.name, file: f, path: f.name })));
            }
            setIsNewContentSheetOpen(false);
          }} 
        />
        <input 
          type="file" 
          multiple
          {...{ webkitdirectory: "", directory: "" }}
          hidden 
          ref={folderInputRef} 
          onChange={handleFolderImport} 
        />
      </header>

      {/* Content Area */}
      <div className="flex-1 px-8 pb-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-700">
            <div className="w-20 h-20 bg-white/3 rounded-full flex items-center justify-center mb-6">
              <Search size={40} />
            </div>
            <p className="font-bold text-[11px] uppercase tracking-widest italic">Carpeta vacía</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            <div className="px-6 py-2 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] opacity-80 mb-2">
              <span>Nombre</span>
              <span className="mr-8">Acciones</span>
            </div>
            {items.sort((a, b) => Number(b.isFolder) - Number(a.isFolder)).map((item) => (
              <div 
                key={item.id}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[28px] p-5 flex items-center gap-5 active:bg-white/15 transition-all group relative overflow-hidden active:scale-[0.98]"
                onClick={() => {
                  if (item.isFolder) {
                    onNavigate(item.id);
                  } else {
                    setNodeToPreview(item);
                  }
                }}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  item.isFolder ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-400"
                )}>
                  <FileIcon type={item.type} size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate text-white">{item.name}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-bold tracking-wider text-slate-500 mt-1 uppercase">
                    <span>{formatDate(item.createdAt)}</span>
                    {!item.isFolder && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-800" />
                        <span>{formatSize(item.size)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(item);
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white active:scale-95 transition-all"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-4">
            {items.sort((a, b) => Number(b.isFolder) - Number(a.isFolder)).map((item) => (
              <div 
                key={item.id}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-4 flex flex-col items-center text-center gap-4 active:bg-white/15 transition-all group relative overflow-hidden active:scale-[0.95]"
                onClick={() => {
                  if (item.isFolder) {
                    onNavigate(item.id);
                  } else {
                    setNodeToPreview(item);
                  }
                }}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(item);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all z-10"
                >
                  <MoreHorizontal size={16} />
                </button>

                <div className={cn(
                  "w-16 h-16 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg",
                  item.isFolder ? "bg-blue-500/20 text-blue-400 shadow-blue-500/10" : "bg-white/5 text-slate-400 shadow-black/20"
                )}>
                  <FileIcon type={item.type} size={32} />
                </div>
                
                <div className="w-full">
                  <h3 className="font-semibold text-xs truncate text-white uppercase tracking-wider">{item.name}</h3>
                  <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                    {item.isFolder ? 'Carpeta' : formatSize(item.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet 
        isOpen={!!selectedNode} 
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.name}
      >
        {!selectedNode?.isFolder && (
          <button 
            onClick={() => { handleShare(selectedNode!); setSelectedNode(null); }}
            className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-white/5 text-base font-medium transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Share2 size={20} />
            </div>
            Compartir Archivo
          </button>
        )}
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
          onClick={() => { handleRenamePrompt(selectedNode!); }}
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

      {/* Modals */}
      <Modal 
        isOpen={isFolderModalOpen} 
        onClose={() => setIsFolderModalOpen(false)} 
        title="Nueva Carpeta"
        footer={(
          <button 
            onClick={handleCreateSubmit}
            className="w-full bg-white text-black py-4 rounded-2xl text-base font-bold shadow-xl active:scale-95 transition-all"
          >
            Crear Carpeta
          </button>
        )}
      >
        <input 
          autoFocus
          type="text" 
          placeholder="Nombre"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg font-medium shadow-inner focus:border-white/40 outline-none transition-all"
        />
      </Modal>

      <Modal 
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)} 
        title="Renombrar"
        footer={(
          <button 
            onClick={handleRenameSubmit}
            className="w-full bg-white text-black py-4 rounded-2xl text-base font-bold shadow-xl active:scale-95 transition-all"
          >
            Guardar Cambios
          </button>
        )}
      >
        <input 
          autoFocus
          type="text" 
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg font-medium shadow-inner focus:border-white/40 outline-none transition-all"
        />
      </Modal>

      <FilePreview 
        node={nodeToPreview} 
        onClose={() => setNodeToPreview(null)} 
      />

      <BottomSheet 
        isOpen={isNewContentSheetOpen} 
        onClose={() => setIsNewContentSheetOpen(false)}
        title="Crear o Importar"
      >
        <div className="grid grid-cols-1 gap-3 px-2">
          <button 
            onClick={handleCreatePrompt}
            className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white/5 hover:bg-white/10 text-base font-bold text-white transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FolderPlus size={24} />
            </div>
            Nueva Carpeta
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white/5 hover:bg-white/10 text-base font-bold text-white transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <FilePlus size={24} />
            </div>
            Subir Archivos
          </button>

          <button 
            onClick={() => folderInputRef.current?.click()}
            className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white/5 hover:bg-white/10 text-base font-bold text-white transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FolderUp size={24} />
            </div>
            Importar Carpeta (Recursivo)
          </button>
        </div>
      </BottomSheet>
    </motion.div>
  );
}
