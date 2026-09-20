import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Play } from 'lucide-react';

export interface CatalogVideoView {
  id: string;
  title: string;
}

export interface CatalogSectionView {
  id: string;
  title: string;
  videos: CatalogVideoView[];
}

export interface CatalogLessonView {
  title: string;
  sections: CatalogSectionView[];
}

const COVER_THEMES = [
  { from: '#1e3a5f', to: '#0f172a' },
  { from: '#312e81', to: '#1e1b4b' },
  { from: '#155e75', to: '#0f172a' },
  { from: '#1e3a8a', to: '#172554' },
  { from: '#4c1d95', to: '#1e1b4b' },
  { from: '#0f766e', to: '#134e4a' },
];

function hashText(text: string) {
  return Math.abs([...text].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) | 0, 0));
}

interface SyncCatalogLessonPageProps {
  open: boolean;
  lesson: CatalogLessonView | null;
  onBack: () => void;
  onPlayVideo: (section: CatalogSectionView, video: CatalogVideoView) => void;
}

export const SyncCatalogLessonPage: React.FC<SyncCatalogLessonPageProps> = ({
  open,
  lesson,
  onBack,
  onPlayVideo,
}) => {
  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  if (!viewport) return null;

  return createPortal(
    <AnimatePresence>
      {open && lesson && (
        <motion.div
          key="sync-catalog-lesson-page"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 z-[550] flex flex-col bg-white"
        >
          <header className="shrink-0 border-b border-slate-100 bg-white px-5 pb-3 pt-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                aria-label="返回"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft size={22} />
              </button>
              <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold text-slate-900">{lesson.title}</h1>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-5">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
              {lesson.sections.map((item) => {
                const hideSectionTitle = lesson.sections.length === 1 && item.title === lesson.title;
                return (
                  <div key={item.id} className="space-y-2.5">
                    {!hideSectionTitle && (
                      <div className="flex items-center gap-2 rounded-xl bg-[#F4F5F7] px-3 py-2.5">
                        <span className="text-[14px] font-medium text-slate-500">{item.title}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-3">
                      {item.videos.map((video, index) => {
                        const hash = hashText(`${lesson.title}-${item.id}-${video.id}-${index}`);
                        const theme = COVER_THEMES[hash % COVER_THEMES.length];
                        const duration = `${5 + (hash % 8)}:${String((hash >> 3) % 60).padStart(2, '0')}`;
                        return (
                          <button
                            key={video.id}
                            type="button"
                            onClick={() => onPlayVideo(item, video)}
                            className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_8px_20px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(79,70,229,0.14)] hover:ring-indigo-200"
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
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-lg transition group-hover:scale-105">
                                  <Play size={18} fill="currentColor" className="ml-0.5" />
                                </span>
                              </div>
                              <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                {duration}
                              </span>
                            </div>
                            <div className="px-3 py-2.5">
                              <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800">{video.title}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    viewport,
  );
};
