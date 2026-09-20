import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Flashlight, History, X, Check } from 'lucide-react';
import { AI_SOLVE_MOCK_SHOTS, MISSION_DAILY_MOCK_SHOTS } from '../../data/aiSolveMockData';
import { ShotThumbnail } from './ProblemPaperView';

type CameraMode = 'ask' | 'mirror' | 'homework';

const MODES: { key: CameraMode; label: string }[] = [
  { key: 'ask', label: '拍照问小晤' },
  { key: 'mirror', label: '灵镜讲题' },
  { key: 'homework', label: '智阅作业' },
];

const AI_SOLVE_HISTORY = [
  { id: 'h1', title: '第27题 · 粉刷40面墙', time: '今天 14:32' },
  { id: 'h2', title: '英语 · 短文填空', time: '昨天 19:10' },
  { id: 'h3', title: '语文 · 阅读与积累', time: '6月14日' },
];

export interface AISolveCameraOverlayProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (shotIds: string[]) => void;
  maxPhotos?: number;
  defaultMode?: CameraMode;
}

export const AISolveCameraOverlay: React.FC<AISolveCameraOverlayProps> = ({
  open,
  onClose,
  onConfirm,
  maxPhotos = 3,
  defaultMode = 'mirror',
}) => {
  const [mode, setMode] = useState<CameraMode>(defaultMode);
  const [shotIds, setShotIds] = useState<string[]>([]);
  const [flashOn, setFlashOn] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [hint, setHint] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
    }
  }, [defaultMode, open]);

  const resetAndClose = () => {
    setShotIds([]);
    setFlashOn(false);
    setHint('');
    setHistoryOpen(false);
    setMode(defaultMode);
    onClose();
  };

  const handleModeChange = (next: CameraMode) => {
    setMode(next);
  };

  const handleCapture = () => {
    if (shotIds.length >= maxPhotos) {
      setHint(`最多可拍 ${maxPhotos} 张`);
      window.setTimeout(() => setHint(''), 1500);
      return;
    }

    setShowFlash(true);
    window.setTimeout(() => setShowFlash(false), 120);

    const shotPool = mode === 'ask' ? MISSION_DAILY_MOCK_SHOTS : AI_SOLVE_MOCK_SHOTS;
    const nextShot = shotPool[shotIds.length % shotPool.length];
    setShotIds((prev) => [...prev, nextShot.id]);
  };

  const handleRemovePhoto = (index: number) => {
    setShotIds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (shotIds.length === 0) {
      setHint('请先拍摄至少 1 张');
      window.setTimeout(() => setHint(''), 1500);
      return;
    }
    onConfirm(shotIds);
    setShotIds([]);
    setFlashOn(false);
    setHint('');
    setMode(defaultMode);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[200] bg-slate-900 text-white overflow-hidden flex flex-col"
        >
          <div className="relative flex-1 min-h-0">
            <div
              className={`absolute inset-0 transition-colors duration-300 ${flashOn ? 'bg-slate-800' : 'bg-slate-900'}`}
            />
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/80" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/80" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/80" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/80" />
            </div>

            <AnimatePresence>
              {showFlash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-20 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* 顶栏 */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 md:px-6 pt-4 pb-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                aria-label="返回"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="flex items-center rounded-full bg-white/10 border border-white/10 overflow-hidden text-[13px] font-bold shadow-lg backdrop-blur-md">
                {MODES.map((item, index) => (
                  <React.Fragment key={item.key}>
                    {index > 0 ? <span className="w-px h-4 bg-white/15" /> : null}
                    <button
                      type="button"
                      onClick={() => handleModeChange(item.key)}
                      className={`px-4 md:px-5 py-2 transition-colors whitespace-nowrap ${
                        mode === item.key
                          ? 'bg-brand text-white'
                          : 'text-white/75 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((v) => !v)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                    historyOpen
                      ? 'bg-brand/30 border-brand/50 text-white'
                      : 'bg-white/10 border-white/10 text-white/85 hover:bg-white/15'
                  }`}
                  aria-label="AI解题记录"
                  title="AI解题记录"
                >
                  <History size={20} strokeWidth={2.25} />
                </button>

                <AnimatePresence>
                  {historyOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full mt-2 w-[min(280px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-40"
                    >
                      <div className="px-3 py-2.5 border-b border-white/10">
                        <p className="text-xs font-bold text-white/90">AI解题记录</p>
                      </div>
                      <ul className="max-h-[240px] overflow-y-auto custom-scrollbar py-1">
                        {AI_SOLVE_HISTORY.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors"
                              onClick={() => setHistoryOpen(false)}
                            >
                              <p className="text-[13px] font-semibold text-white/90 leading-snug truncate">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-white/45 mt-0.5">{item.time}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            {/* 中央提示 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-16 md:pr-32">
              <div className="text-center space-y-3">
                <p className="text-lg md:text-xl font-bold tracking-wide text-white/95">
                  {mode === 'homework' ? '把整页作业放进参考线内' : '请保持拍摄内容跟参考线平行'}
                </p>
                <p className="text-sm md:text-base text-white/55 font-medium">
                  {mode === 'homework'
                    ? `最多可拍 ${maxPhotos} 张 · 拍完即可开始批改`
                    : `最多可拍 ${maxPhotos} 张 · 支持多题同页切题`}
                </p>
                {hint ? (
                  <p className="text-xs text-amber-200/90 bg-black/30 inline-block px-3 py-1 rounded-full mt-2">
                    {hint}
                  </p>
                ) : null}
              </div>
            </div>

            {/* 右侧控制区 */}
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-8">
              <button
                type="button"
                onClick={() => setFlashOn((v) => !v)}
                className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
                  flashOn
                    ? 'bg-amber-400/20 border-amber-300/50 text-amber-200'
                    : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/15'
                }`}
                aria-label="手电筒"
              >
                <Flashlight size={20} className={flashOn ? 'fill-current' : ''} />
              </button>

              <button
                type="button"
                onClick={handleCapture}
                disabled={shotIds.length >= maxPhotos}
                className={`w-[72px] h-[72px] rounded-full border-[5px] border-white flex items-center justify-center p-1.5 transition-transform active:scale-95 ${
                  shotIds.length >= maxPhotos ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                aria-label="拍照"
              >
                <div className="w-full h-full rounded-full bg-brand shadow-[0_0_24px_rgba(108,93,211,0.55)]" />
              </button>
            </div>

            {/* 已拍缩略图 + 完成 */}
            {shotIds.length > 0 ? (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-30 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {shotIds.map((id, index) => (
                    <div key={`${id}-${index}`} className="relative shrink-0 w-14 h-14">
                      <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg bg-slate-800">
                        <ShotThumbnail shotId={id} className="w-full h-full" preview />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(index);
                        }}
                        className="absolute -top-1.5 -right-1.5 z-10 w-6 h-6 rounded-full bg-black/75 border border-white/30 flex items-center justify-center hover:bg-rose-600 transition-colors active:scale-95"
                        aria-label="删除照片"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                  {Array.from({ length: maxPhotos - shotIds.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-14 h-14 rounded-xl border border-dashed border-white/20 bg-white/5"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="h-11 px-5 rounded-full bg-brand text-white font-bold text-sm flex items-center gap-2 shadow-[0_8px_24px_rgba(108,93,211,0.45)] hover:bg-brand-light active:scale-95 transition-all"
                >
                  <Check size={16} />
                  完成 ({shotIds.length}/{maxPhotos})
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget,
  );
};
