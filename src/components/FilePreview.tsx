import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Download, Maximize2, Minimize2 } from 'lucide-react';
import { FileNode } from '../types';
import { cn } from '../lib/utils';
import { storage } from '../lib/storage';
import { Modal } from './MobileOverlay';
import { PdfViewer } from './PdfViewer';

interface FilePreviewProps {
  node: FileNode | null;
  onClose: () => void;
}

export function FilePreview({ node, onClose }: FilePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null); // For text files
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!node || node.isFolder) {
      setBlobUrl(null);
      setContent(null);
      return;
    }

    const loadFile = async () => {
      setLoading(true);
      try {
        const blob = await storage.getFileData(node.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);

          const isHtml = node.mimeType === 'text/html';
          const isText = (node.mimeType.startsWith('text/') && !isHtml) || node.mimeType === 'application/json';

          if (isText) {
            const text = await blob.text();
            setContent(text);
          }
        }
      } catch (err) {
        console.error('Error loading file preview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [node]);

  if (!node) return null;

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Cargando archivo...</p>
        </div>
      );
    }

    if (!blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p className="font-bold text-[10px] uppercase tracking-widest italic">No se pudo cargar el archivo</p>
        </div>
      );
    }

    if (node.type === 'image') {
      return (
        <div className="h-full w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 shadow-2xl flex items-center justify-center">
          <img src={blobUrl} alt={node.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
        </div>
      );
    }

    if (node.type === 'video') {
      return (
        <div className="h-full w-full rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center">
          <video src={blobUrl} controls className="max-w-full max-h-full" />
        </div>
      );
    }

    if (node.type === 'audio') {
      return (
        <div className="py-10 px-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <X size={40} className="rotate-45" /> {/* Just a placeholder for music vibes */}
            </motion.div>
          </div>
          <audio src={blobUrl} controls className="w-full" />
        </div>
      );
    }

    if (content !== null) {
      return (
        <div className="h-full w-full overflow-y-auto p-6 bg-slate-900/50 border border-white/5 rounded-2xl font-mono text-xs leading-relaxed custom-scrollbar whitespace-pre-wrap text-slate-300">
          {content}
        </div>
      );
    }

    if (node.mimeType === 'application/pdf') {
      return (
        <PdfViewer url={blobUrl} />
      );
    }

    if (node.mimeType === 'text/html') {
      return (
        <div className="flex flex-col h-full gap-4">
          <iframe 
            src={blobUrl} 
            className="flex-1 w-full rounded-2xl border border-white/5 bg-white" 
            title={node.name} 
          />
          <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-widest shrink-0">
            Para una mejor experiencia, usa el botón de abrir en navegador
          </p>
        </div>
      );
    }

    return (
      <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-500">
          <Download size={40} />
        </div>
        <div>
          <p className="text-slate-400 font-medium italic">Sin vista previa disponible para este formato</p>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">{node.mimeType}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={!!node && !isFullscreen}
        onClose={onClose}
        title={node.name}
        variant="full"
        footer={(
          <div className="flex gap-4 w-full">
            <button 
              onClick={onClose}
              className="flex-1 glass-button py-4 rounded-2xl text-sm font-bold text-slate-400 uppercase tracking-widest"
            >
              Cerrar
            </button>
            {blobUrl && (
              <div className="flex flex-1 gap-2">
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                  title="Pantalla Completa"
                >
                  <Maximize2 size={18} />
                </button>
                <button 
                  onClick={() => window.open(blobUrl, '_blank')}
                  className={cn(
                    "flex-1 border text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2 rounded-2xl p-4",
                    node.mimeType === 'text/html' 
                      ? "bg-blue-600/10 border-blue-500/30 text-blue-400" 
                      : "bg-white/5 border-white/10 text-white"
                  )}
                  title={node.mimeType === 'text/html' ? "Abrir página en el navegador" : "Abrir en pestaña nueva"}
                >
                  <ExternalLink size={18} />
                  {node.mimeType === 'text/html' && <span className="text-[10px] tracking-widest hidden xs:inline">ABRIR</span>}
                </button>
                <a 
                  href={blobUrl} 
                  download={node.name}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  BAJAR
                </a>
              </div>
            )}
          </div>
        )}
      >
        {renderPreview()}
      </Modal>

      <AnimatePresence>
        {isFullscreen && node && blobUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-10">
              <h2 className="text-white font-bold text-sm truncate max-w-[70%]">{node.name}</h2>
              <button 
                onClick={() => setIsFullscreen(false)}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md"
              >
                <Minimize2 size={20} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden">
               {node.type === 'image' ? (
                 <img src={blobUrl} className="max-w-full max-h-full object-contain" alt={node.name} />
               ) : node.type === 'video' ? (
                 <video src={blobUrl} controls autoPlay className="max-w-full max-h-full" />
               ) : node.mimeType === 'application/pdf' ? (
                 <PdfViewer url={blobUrl} className="w-full h-full rounded-none border-none" />
               ) : node.mimeType === 'text/html' ? (
                 <iframe src={blobUrl} className="w-full h-full bg-white border-none" title={node.name} />
               ) : content ? (
                 <div className="w-full h-full p-10 pt-24 overflow-auto font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar whitespace-pre-wrap">
                   {content}
                 </div>
               ) : (
                  <div className="text-slate-500 italic uppercase tracking-widest text-[10px] font-bold">Sin vista previa extendida</div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
