/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Home, FolderSearch, Search, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FileNode, FileType } from './types';
import { storage, generateId, getMimeCategory } from './lib/storage';
import { cn } from './lib/utils';

// Views
import HomeView from './views/Home';
import ExplorerView from './views/Explorer';
import CategoryView from './views/CategoryView';

type ViewType = 'home' | 'explorer' | 'category' | 'search' | 'settings';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<FileType | null>(null);
  const [clipboard, setClipboard] = useState<{ nodes: FileNode[]; type: 'copy' | 'cut' } | null>(null);

  // Load files on mount
  useEffect(() => {
    setFiles(storage.getMetadata());
  }, []);

  const saveFiles = useCallback((newFiles: FileNode[]) => {
    setFiles(newFiles);
    storage.saveMetadata(newFiles);
  }, []);

  const handleCopy = (nodes: FileNode[]) => {
    setClipboard({ nodes, type: 'copy' });
  };

  const handleCut = (nodes: FileNode[]) => {
    setClipboard({ nodes, type: 'cut' });
  };

  const handlePaste = async (targetFolderId: string | null) => {
    if (!clipboard) return;

    let newFiles = [...files];
    const { nodes, type } = clipboard;

    if (type === 'cut') {
      nodes.forEach(node => {
        const index = newFiles.findIndex(f => f.id === node.id);
        if (index !== -1) {
          newFiles[index] = { ...newFiles[index], parentId: targetFolderId };
        }
      });
      setClipboard(null);
    } else {
      for (const node of nodes) {
        const id = generateId();
        const newNode: FileNode = {
          ...node,
          id,
          parentId: targetFolderId,
          createdAt: Date.now()
        };
        newFiles.push(newNode);
        if (!node.isFolder) {
          const blob = await storage.getFileData(node.id);
          if (blob) await storage.saveFileData(id, blob);
        }
      }
    }

    saveFiles(newFiles);
  };

  const handleCreateFolder = (name: string, parentId: string | null = currentFolderId): string => {
    const id = generateId();
    const newFolder: FileNode = {
      id,
      name,
      type: 'folder',
      parentId,
      size: 0,
      mimeType: 'application/x-directory',
      createdAt: Date.now(),
      isFolder: true,
    };
    saveFiles([...files, newFolder]);
    return id;
  };

  const handleUploadFile = async (file: File, parentId: string | null = currentFolderId) => {
    await handleBatchImport([{ type: 'file', name: file.name, file, path: file.name }]);
  };

  const handleDelete = async (id: string) => {
    // Recursive delete for folders
    const toDelete = files.filter(f => f.id === id || f.parentId === id);
    for (const node of toDelete) {
      if (!node.isFolder) {
        await storage.deleteFileData(node.id);
      }
    }
    
    // Simple filter for now (full recursive would be better for deep folders)
    const recursiveDelete = (list: FileNode[], deleteId: string): FileNode[] => {
      const children = list.filter(f => f.parentId === deleteId);
      let newList = list.filter(f => f.id !== deleteId);
      children.forEach(child => {
        newList = recursiveDelete(newList, child.id);
      });
      return newList;
    };

    saveFiles(recursiveDelete(files, id));
  };

  const handleRename = (id: string, newName: string) => {
    saveFiles(files.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const handleBatchImport = async (
    items: { type: 'file' | 'folder'; name: string; file?: File; path: string }[] 
  ) => {
    const newNodes: FileNode[] = [...files];
    const folderPathMap = new Map<string, string>();
    folderPathMap.set('', currentFolderId || '');

    // Sort items by path depth safely
    const sortedItems = [...items].sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    for (const item of sortedItems) {
      const pathParts = item.path.split('/');
      const name = item.name;
      const parentPath = pathParts.slice(0, -1).join('/');
      const parentId = folderPathMap.get(parentPath) || currentFolderId;

      const id = generateId();
      
      if (item.type === 'folder') {
        const newNode: FileNode = {
          id,
          name,
          type: 'folder',
          parentId,
          size: 0,
          mimeType: 'application/x-directory',
          createdAt: Date.now(),
          isFolder: true,
        };
        newNodes.push(newNode);
        folderPathMap.set(item.path, id);
      } else if (item.file) {
        const type = getMimeCategory(item.file.type);
        const newNode: FileNode = {
          id,
          name,
          type,
          parentId,
          size: item.file.size,
          mimeType: item.file.type,
          createdAt: Date.now(),
          isFolder: false,
        };
        await storage.saveFileData(id, item.file);
        newNodes.push(newNode);
      }
    }

    saveFiles(newNodes);
  };

  const navigateToFolder = (id: string | null) => {
    setCurrentFolderId(id);
    setActiveView('explorer');
  };

  const navigateToCategory = (type: FileType) => {
    setActiveCategory(type);
    setActiveView('category');
  };

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-slate-950">
      <div className="bg-mesh" />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <AnimatePresence mode="wait" initial={false}>
          {activeView === 'home' && (
            <HomeView 
              key="home"
              files={files}
              onNavigateCategory={navigateToCategory}
              onNavigateFolder={navigateToFolder}
              onCreateFolder={handleCreateFolder}
            />
          )}
          {activeView === 'explorer' && (
            <ExplorerView 
              key="explorer"
              files={files}
              currentFolderId={currentFolderId}
              onNavigate={navigateToFolder}
              onCreateFolder={handleCreateFolder}
              onUploadFile={handleUploadFile}
              onBatchImport={handleBatchImport}
              onDelete={handleDelete}
              onRename={handleRename}
              onCopy={handleCopy}
              onCut={handleCut}
              onPaste={handlePaste}
              clipboard={clipboard}
            />
          )}
          {activeView === 'category' && activeCategory && (
            <CategoryView 
              key={`category-${activeCategory}`}
              type={activeCategory}
              files={files}
              onDelete={handleDelete}
              onRename={handleRename}
              onCopy={handleCopy}
              onCut={handleCut}
              onPaste={handlePaste}
              onBatchImport={handleBatchImport}
              clipboard={clipboard}
            />
          )}
          {(activeView === 'search' || activeView === 'settings') && (
            <motion.div 
              key={activeView}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="p-12 flex flex-col items-center justify-center h-full opacity-30 text-center gap-6"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                {activeView === 'search' ? <Search size={40} /> : <Settings size={40} />}
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-white uppercase">En Desarrollo</p>
                <p className="text-sm font-medium mt-2 text-slate-400 italic">Próximamente en ArchivoPro</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 h-28 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-50 flex items-end justify-center pb-8 px-6">
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-2 pointer-events-auto flex items-center justify-around shadow-2xl">
          {[
            { id: 'home', icon: Home, label: 'INICIO' },
            { id: 'explorer', icon: FolderSearch, label: 'ARCHIVOS' },
            { id: 'search', icon: Search, label: 'BUSCAR' },
            { id: 'settings', icon: Settings, label: 'AJUSTES' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 px-5 rounded-[24px] transition-all relative overflow-hidden active:scale-90",
                activeView === item.id ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <item.icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} />
              <span className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-bold transition-all",
                activeView === item.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              )}>
                {item.label}
              </span>
              {activeView === item.id && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute inset-0 bg-white/5 -z-10"
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
