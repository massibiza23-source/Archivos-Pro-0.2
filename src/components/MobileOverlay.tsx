import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'full';
}

export const Modal = ({ isOpen, onClose, title, children, footer, variant = 'default' }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className={cn(
              "fixed z-[101] shadow-2xl flex flex-col transition-all duration-300",
              variant === 'full' 
                ? "inset-0 md:inset-4 md:rounded-[40px] bg-slate-900/40" 
                : "inset-x-4 top-[5%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl bg-white/5",
              "backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 focus:outline-none"
            )}
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-lg font-bold text-white tracking-tight truncate max-w-[80%]">{title}</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={cn(
              "flex-1 overflow-hidden",
              variant === 'full' ? "h-full" : "max-h-[75vh]"
            )}>
              {children}
            </div>

            {footer && (
              <div className="flex gap-3 mt-6 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet = ({ isOpen, onClose, title, children }: BottomSheetProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 bg-white/5 backdrop-blur-2xl border-t border-white/10 rounded-t-[40px] p-8 pb-12 z-[101] shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
            {title && <h2 className="text-xl font-bold text-white mb-6 px-2 tracking-tight">{title}</h2>}
            <div className="space-y-2">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
