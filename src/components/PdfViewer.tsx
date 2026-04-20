import { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  className?: string;
}

export function PdfViewer({ url, className }: PdfViewerProps) {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      try {
        const loadingTask = pdfjs.getDocument(url);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setLoading(false);
      }
    };
    loadPdf();
  }, [url]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d');

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
    };

    renderPage();
  }, [pdf, pageNum, scale]);

  const handlePrevPage = () => setPageNum(p => Math.max(1, p - 1));
  const handleNextPage = () => setPageNum(p => Math.min(numPages, p + 1));
  const handleZoomIn = () => setScale(s => Math.min(3, s + 0.2));
  const handleZoomOut = () => setScale(s => Math.max(0.5, s - 0.2));

  return (
    <div className={cn("flex flex-col items-center bg-slate-900 rounded-3xl overflow-hidden border border-white/5 h-full", className)}>
      {/* Controls */}
      <div className="w-full flex items-center justify-between p-4 bg-white/10 backdrop-blur-md border-b border-white/5 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            disabled={pageNum <= 1}
            onClick={handlePrevPage}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-bold text-slate-400 min-w-[60px] text-center">
            {pageNum} / {numPages}
          </span>
          <button 
            disabled={pageNum >= numPages}
            onClick={handleNextPage}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-[10px] font-bold text-slate-500 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={containerRef}
        className="w-full flex-1 overflow-auto flex items-start justify-center p-4 bg-slate-950/80 custom-scrollbar"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Renderizando páginas...</p>
          </div>
        ) : (
          <div className="shadow-2xl shadow-black ring-1 ring-white/10 rounded-sm overflow-hidden">
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
}
