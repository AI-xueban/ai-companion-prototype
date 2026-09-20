import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Play } from 'lucide-react';
import type { EnglishSpeakingLesson, EnglishSpeakingUnit } from '../../data/juniorEnglishSyncSpeakingG7A';
import { SyncUnitCatalog, SyncUnitDetailHeader } from './SyncUnitCatalog';

const COVER_THEMES = [
  { from: '#0f766e', to: '#134e4a' },
  { from: '#1e3a5f', to: '#0f172a' },
  { from: '#312e81', to: '#1e1b4b' },
  { from: '#155e75', to: '#0f172a' },
  { from: '#1e3a8a', to: '#172554' },
  { from: '#4c1d95', to: '#1e1b4b' },
];

function hashText(text: string) {
  return Math.abs([...text].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) | 0, 0));
}

interface SyncSpeakingPageProps {
  open: boolean;
  units: EnglishSpeakingUnit[];
  onBack: () => void;
  onPlayLesson: (unit: EnglishSpeakingUnit, lesson: EnglishSpeakingLesson) => void;
}

export const SyncSpeakingPage: React.FC<SyncSpeakingPageProps> = ({
  open,
  units,
  onBack,
  onPlayLesson,
}) => {
  const [introOpen, setIntroOpen] = useState(false);
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');

  const unit = useMemo(
    () => units.find((item) => item.id === unitId) ?? units[0],
    [units, unitId],
  );

  useEffect(() => {
    if (!open) {
      setIntroOpen(false);
      return;
    }
    setIntroOpen(false);
    setUnitId(units[0]?.id ?? '');
  }, [open, units]);

  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  if (!viewport) return null;

  const closeIntro = () => {
    if (introOpen) setIntroOpen(false);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sync-speaking-page"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 z-[550] flex flex-col bg-white"
        >
          <header className="relative shrink-0 border-b border-slate-100 bg-white px-5 pb-3 pt-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                aria-label="返回"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft size={22} />
              </button>
              <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold text-slate-900">外教口语</h1>
              <button
                type="button"
                onClick={() => setIntroOpen((value) => !value)}
                className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-medium transition ${introOpen ? 'bg-[#3B82F6] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                简介
              </button>
            </div>
            {introOpen && (
              <div className="absolute right-5 top-[58px] z-30 w-72 rounded-2xl border border-slate-100 bg-white p-3.5 text-[12px] leading-5 text-slate-600 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                外教老师带你同步课本话题开口说。每单元一到三节口语视频，覆盖问候、家务、动物、自我介绍、家庭、学校、学科、社团、日常作息和购物等场景。
              </div>
            )}
          </header>

          <div className="flex min-h-0 flex-1" onClick={closeIntro}>
            <SyncUnitCatalog items={units} activeId={unit?.id} onSelect={setUnitId} />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
              {unit && <SyncUnitDetailHeader title={unit.title} />}
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAFBFD] px-7 pb-8 pt-5">
                {unit && (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                    {unit.lessons.map((lesson) => {
                      const hash = hashText(`${unit.id}-${lesson.id}-${lesson.title}`);
                      const theme = COVER_THEMES[hash % COVER_THEMES.length];
                      const duration = `${8 + (hash % 6)}:${String((hash >> 3) % 60).padStart(2, '0')}`;
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => onPlayLesson(unit, lesson)}
                          className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_8px_20px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(79,70,229,0.14)] hover:ring-indigo-200"
                        >
                          <div
                            className="relative aspect-video overflow-hidden"
                            style={{ background: `linear-gradient(145deg, ${theme.from}, ${theme.to})` }}
                          >
                            <div
                              className="absolute inset-0 opacity-25"
                              style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
                                backgroundSize: '28px 28px',
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg transition group-hover:scale-105">
                                <Play size={18} fill="currentColor" className="ml-0.5 text-violet-600" />
                              </span>
                            </div>
                            <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              {duration}
                            </span>
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800">{lesson.title}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    viewport,
  );
};
