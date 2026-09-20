import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, Play } from 'lucide-react';
import type { ImproveChapter, ImproveNode, ImproveSection, ImproveVideo } from '../../data/juniorMathImproveG7A';

interface SyncImprovePageProps {
  open: boolean;
  chapters: ImproveChapter[];
  bookName: string;
  onBack: () => void;
  onPlayVideo: (video: ImproveVideo, path: string) => void;
}

interface VideoCardItem {
  video: ImproveVideo;
  label: string;
  path: string;
  duration: string;
  theme: { from: string; to: string; accent: string };
}

const COVER_THEMES = [
  { from: '#1e3a5f', to: '#0f172a', accent: '#93c5fd' },
  { from: '#312e81', to: '#1e1b4b', accent: '#c4b5fd' },
  { from: '#155e75', to: '#0f172a', accent: '#67e8f9' },
  { from: '#1e3a8a', to: '#172554', accent: '#fde68a' },
  { from: '#4c1d95', to: '#1e1b4b', accent: '#f0abfc' },
  { from: '#0f766e', to: '#134e4a', accent: '#99f6e4' },
];

function hashText(text: string) {
  return Math.abs([...text].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) | 0, 0));
}

function toCard(video: ImproveVideo, label: string, path: string): VideoCardItem {
  const hash = hashText(path + video.title);
  const minutes = 5 + (hash % 8);
  const seconds = (hash >> 3) % 60;
  return {
    video,
    label,
    path,
    duration: `${minutes}:${String(seconds).padStart(2, '0')}`,
    theme: COVER_THEMES[hash % COVER_THEMES.length],
  };
}

function collectNodeCards(node: ImproveNode, path: string): VideoCardItem[] {
  const currentPath = `${path}/${node.title}`;
  const own = (node.videos ?? []).map((video, index) => toCard(video, node.title, `${currentPath}/${index}`));
  const nested = (node.children ?? []).flatMap((child) => collectNodeCards(child, currentPath));
  return [...own, ...nested];
}

function collectSectionCards(section: ImproveSection): VideoCardItem[] {
  const direct = (section.videos ?? []).map((video, index) => toCard(video, section.title, `${section.id}/${index}`));
  const nested = (section.nodes ?? []).flatMap((node) => collectNodeCards(node, section.id));
  return [...direct, ...nested];
}

function VideoCard({
  item,
  onPlay,
}: {
  item: VideoCardItem;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_8px_20px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(79,70,229,0.14)] hover:ring-indigo-200"
    >
      <div
        className="relative aspect-video overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${item.theme.from}, ${item.theme.to})` }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute inset-x-3 top-3 truncate text-[11px] font-medium" style={{ color: item.theme.accent }}>
          {item.label}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-lg transition group-hover:scale-105">
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </span>
        </div>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {item.duration}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800">{item.video.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">{item.label}</p>
      </div>
    </button>
  );
}

function SectionTree({
  section,
  onPlayVideo,
}: {
  section: ImproveSection;
  onPlayVideo: (video: ImproveVideo, path: string) => void;
}) {
  const cards = collectSectionCards(section);
  if (cards.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-semibold text-slate-700">{section.title}</h2>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((item) => (
          <VideoCard key={item.path} item={item} onPlay={() => onPlayVideo(item.video, item.path)} />
        ))}
      </div>
    </section>
  );
}

export const SyncImprovePage: React.FC<SyncImprovePageProps> = ({
  open,
  chapters,
  bookName,
  onBack,
  onPlayVideo,
}) => {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);

  const chapter = useMemo(
    () => chapters.find((item) => item.id === chapterId) ?? chapters[0],
    [chapters, chapterId],
  );

  useEffect(() => {
    if (!open) {
      setPickerOpen(false);
      return;
    }
    setChapterId(chapters[0]?.id ?? '');
  }, [open, chapters]);

  const selectChapter = (id: string) => {
    setChapterId(id);
    setPickerOpen(false);
  };

  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  if (!viewport) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sync-improve-page"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 z-[550] flex flex-col bg-[#F7F8FB]"
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
              <h1 className="min-w-0 shrink-0 text-[18px] font-semibold text-slate-900">同步提高</h1>
              <div className="flex min-w-0 flex-1 items-center justify-end">
                <button
                  type="button"
                  onClick={() => setPickerOpen((value) => !value)}
                  className={`flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition ${pickerOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}
                >
                  <span className="truncate">{chapter?.title}</span>
                  <ChevronDown size={12} className={pickerOpen ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
          </header>

          {pickerOpen && (
            <div className="absolute inset-0 z-20">
              <div className="absolute inset-0 bg-slate-950/25" onClick={() => setPickerOpen(false)} aria-hidden="true" />
              <div className="absolute right-5 top-[68px] flex h-72 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="truncate px-3 py-2 text-[11px] font-semibold text-slate-400">{bookName}</div>
                  <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-2">
                    {chapters.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectChapter(item.id)}
                        className={`w-full rounded-lg px-2 py-1.5 text-left text-[13px] font-medium transition ${item.id === chapter?.id ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-5">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
              {chapter?.sections.map((section) => (
                <SectionTree key={section.id} section={section} onPlayVideo={onPlayVideo} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    viewport,
  );
};
