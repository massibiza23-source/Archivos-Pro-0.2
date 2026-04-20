import { motion } from 'motion/react';
import { Type, Palette, Globe, Check } from 'lucide-react';
import { AppSettings } from '../types';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function SettingsView({ settings, onUpdateSettings }: SettingsViewProps) {
  const update = (patch: Partial<AppSettings>) => {
    onUpdateSettings({ ...settings, ...patch });
  };

  const themes = [
    { id: 'midnight', name: 'Midnight', color: 'bg-slate-950', border: 'border-slate-800' },
    { id: 'forest', name: 'Forest', color: 'bg-emerald-950', border: 'border-emerald-800' },
    { id: 'ocean', name: 'Ocean', color: 'bg-sky-950', border: 'border-sky-800' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-950', border: 'border-rose-800' },
  ];

  const textSizes = [
    { id: 'small', name: 'Pequeño', label: 'A', size: 'text-xs' },
    { id: 'medium', name: 'Normal', label: 'A', size: 'text-base' },
    { id: 'large', name: 'Grande', label: 'A', size: 'text-lg' },
  ];

  const languages = [
    { id: 'es', name: 'Español' },
    { id: 'en', name: 'English' },
  ];

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      es: {
        title: 'Ajustes',
        theme: 'Estilo de Tema',
        textSize: 'Tamaño de Texto',
        language: 'Idioma',
        description: 'Personaliza tu experiencia en ArchivoPro',
        applied: 'Aplicado'
      },
      en: {
        title: 'Settings',
        theme: 'Theme Style',
        textSize: 'Text Size',
        language: 'Language',
        description: 'Personalize your ArchivoPro experience',
        applied: 'Applied'
      }
    };
    return translations[settings.language][key] || key;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="p-8 pb-32 space-y-12"
    >
      <header className="pt-10">
        <h1 className="text-4xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-slate-400 font-medium text-sm">{t('description')}</p>
      </header>

      {/* Theme Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Palette size={20} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{t('theme')}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => update({ theme: theme.id as any })}
              className={cn(
                "relative h-24 rounded-3xl border-2 transition-all overflow-hidden p-4 flex items-end",
                theme.color,
                settings.theme === theme.id ? "border-blue-500 ring-4 ring-blue-500/20" : "border-white/5 grayscale-[0.5] opacity-70"
              )}
            >
              <span className="text-xs font-bold text-white uppercase tracking-widest">{theme.name}</span>
              {settings.theme === theme.id && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                  <Check size={12} strokeWidth={4} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Text Size Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Type size={20} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{t('textSize')}</h2>
        </div>

        <div className="flex gap-4">
          {textSizes.map((size) => (
            <button
              key={size.id}
              onClick={() => update({ textSize: size.id as any })}
              className={cn(
                "flex-1 bg-white/5 border rounded-2xl p-5 flex flex-col items-center gap-2 transition-all",
                settings.textSize === size.id ? "border-blue-500 bg-white/10" : "border-white/10"
              )}
            >
              <span className={cn("font-bold text-white", size.size)}>{size.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{size.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Language Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Globe size={20} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{t('language')}</h2>
        </div>

        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => update({ language: lang.id as any })}
              className={cn(
                "w-full bg-white/5 border rounded-2xl p-5 flex items-center justify-between transition-all",
                settings.language === lang.id ? "border-blue-500 bg-white/10" : "border-white/10"
              )}
            >
              <span className="font-semibold text-white">{lang.name}</span>
              {settings.language === lang.id && (
                <Check size={20} className="text-blue-500" />
              )}
            </button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
