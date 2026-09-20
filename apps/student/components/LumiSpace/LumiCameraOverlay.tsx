import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Flashlight, X, Check } from 'lucide-react';
import { LUMI_MOCK_SHOTS } from './lumiPhotoClassify';
import { AI_SOLVE_MOCK_SHOTS } from '../../data/aiSolveMockData';
import { ShotThumbnail } from '../Dashboard/ProblemPaperView';

export type LumiCameraMode = 'ask' | 'mirror' | 'homework';

export type LumiCameraConfirmResult =
  | { mode: 'ask'; photos: string[] }
  | { mode: 'mirror'; shotIds: string[] };

const MODES: { key: LumiCameraMode; label: string }[] = [
  { key: 'ask', label: '拍照问小晤' },
  { key: 'mirror', label: '灵镜讲题' },
  { key: 'homework', label: '智阅作业' },
];

const MODE_HINTS: Record<'ask' | 'mirror', { title: string; subtitle: string }> = {
  ask: {
    title: '拍风景、生活或题目都可以',
    subtitle: '小晤会自动识别，题目可一键解题',
  },
  mirror: {
    title: '对准题目，保持与参考线平行',
    subtitle: '最多可拍 3 张 · 支持多题同页切题讲解',
  },
};

export interface LumiCameraOverlayProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: LumiCameraConfirmResult) => void;
  maxPhotos?: number;
  defaultMode?: LumiCameraMode;
  /** 今日还可上传张数；≤5 时在完成区旁展示 */
  imageQuotaRemaining?: number;
}

export const LumiCameraOverlay: React.FC<LumiCameraOverlayProps> = ({
  open,
  onClose,
  onConfirm,
  maxPhotos = 3,
  defaultMode = 'ask',
  imageQuotaRemaining,
}) => {
  const [mode, setMode] = useState<LumiCameraMode>(defaultMode);
  const [photos, setPhotos] = useState<string[]>([]);
  const [shotIds, setShotIds] = useState<string[]>([]);
  const [flashOn, setFlashOn] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [hint, setHint] = useState('');

  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  const captureCount = mode === 'mirror' ? shotIds.length : photos.length;
  const askQuotaLeft =
    typeof imageQuotaRemaining === 'number'
      ? Math.max(0, imageQuotaRemaining - (mode === 'ask' ? photos.length : 0))
      : null;
  const showQuotaHint =
    mode === 'ask'
    && typeof imageQuotaRemaining === 'number'
    && imageQuotaRemaining <= 5;
  const quotaBlocksCapture = mode === 'ask' && askQuotaLeft !== null && askQuotaLeft <= 0;
  const canCapture = captureCount < maxPhotos && !quotaBlocksCapture;
  const emptySlotCount =
    mode === 'ask' && askQuotaLeft !== null
      ? Math.min(maxPhotos - captureCount, askQuotaLeft)
      : Math.max(0, maxPhotos - captureCount);

  useEffect(() => {
    if (open) setMode(defaultMode);
  }, [defaultMode, open]);

  const resetAndClose = () => {
    setPhotos([]);
    setShotIds([]);
    setFlashOn(false);
    setHint('');
    setMode(defaultMode);
    onClose();
  };

  const handleModeChange = (next: LumiCameraMode) => {
    if (next === 'homework') {
      setHint('智阅作业即将上线');
      window.setTimeout(() => setHint(''), 1800);
      return;
    }
    setMode(next);
    setPhotos([]);
    setShotIds([]);
    setHint('');
  };

  const handleCapture = () => {
    if (mode === 'ask' && askQuotaLeft !== null && askQuotaLeft <= 0) {
      setHint('今日上传图片额度还剩 0 张，删除一张后可再拍');
      window.setTimeout(() => setHint(''), 1800);
      return;
    }
    if (captureCount >= maxPhotos) {
      setHint(`最多可拍 ${maxPhotos} 张`);
      window.setTimeout(() => setHint(''), 1500);
      return;
    }

    setShowFlash(true);
    window.setTimeout(() => setShowFlash(false), 120);

    if (mode === 'mirror') {
      const nextShot = AI_SOLVE_MOCK_SHOTS[shotIds.length % AI_SOLVE_MOCK_SHOTS.length];
      setShotIds((prev) => [...prev, nextShot.id]);
      return;
    }

    const nextUrl = LUMI_MOCK_SHOTS[photos.length % LUMI_MOCK_SHOTS.length];
    setPhotos((prev) => [...prev, nextUrl]);
  };

  const handleRemovePhoto = (index: number) => {
    if (mode === 'mirror') {
      setShotIds((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (captureCount === 0) {
      setHint('请先拍摄至少 1 张');
      window.setTimeout(() => setHint(''), 1500);
      return;
    }

    if (mode === 'mirror') {
      onConfirm({ mode: 'mirror', shotIds });
    } else {
      onConfirm({ mode: 'ask', photos });
    }

    setPhotos([]);
    setShotIds([]);
    setFlashOn(false);
    setHint('');
    setMode(defaultMode);
  };

  if (!open) return null;

  const activeHint = mode === 'mirror' || mode === 'ask' ? MODE_HINTS[mode] : MODE_HINTS.ask;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[200] bg-[#14102f] text-white overflow-hidden flex flex-col"
        >
          <div className="relative flex-1 min-h-0">
            <div
              className={`absolute inset-0 transition-colors duration-300 ${flashOn ? 'bg-[#1f1948]' : 'bg-[#14102f]'}`}
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

            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 md:px-6 pt-4 pb-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                aria-label="返回"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="flex items-center rounded-full bg-[#2a2550]/90 border border-white/10 overflow-hidden text-[13px] font-bold shadow-lg">
                {MODES.map((item, index) => (
                  <React.Fragment key={item.key}>
                    {index > 0 ? <span className="w-px h-4 bg-white/15" /> : null}
                    <button
                      type="button"
                      onClick={() => handleModeChange(item.key)}
                      className={`px-3 md:px-4 py-2 transition-colors whitespace-nowrap ${
                        mode === item.key
                          ? 'bg-[#6C5DD3] text-white'
                          : 'text-white/75 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="w-10 h-10" aria-hidden />
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-16 md:pr-32">
              <div className="text-center space-y-3">
                <p className="text-lg md:text-xl font-bold tracking-wide text-white/95">
                  {activeHint.title}
                </p>
                <p className="text-sm md:text-base text-white/55 font-medium">
                  {activeHint.subtitle}
                </p>
                {hint ? (
                  <p className="text-xs text-amber-200/90 bg-black/30 inline-block px-3 py-1 rounded-full mt-2">
                    {hint}
                  </p>
                ) : null}
              </div>
            </div>

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
                disabled={!canCapture}
                className={`w-[72px] h-[72px] rounded-full border-[5px] border-white flex items-center justify-center p-1.5 transition-transform active:scale-95 ${
                  !canCapture ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                aria-label={quotaBlocksCapture ? '今日上传图片额度还剩 0 张' : '拍照'}
              >
                <div className="w-full h-full rounded-full bg-[#6C5DD3] shadow-[0_0_24px_rgba(108,93,211,0.55)]" />
              </button>
            </div>

            {/* 缩略图在上，额度文案始终在缩略图下方 */}
            {showQuotaHint || captureCount > 0 ? (
              <div className="absolute bottom-6 left-4 right-40 md:left-8 md:right-48 z-30 flex flex-col items-start gap-2 pointer-events-none">
                {captureCount > 0 ? (
                  <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
                    {mode === 'mirror'
                      ? shotIds.map((id, index) => (
                            <div key={`${id}-${index}`} className="relative shrink-0 w-14 h-14">
                              <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                                <ShotThumbnail shotId={id} className="w-full h-full" />
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
                          ))
                      : photos.map((url, index) => (
                          <div key={`${url}-${index}`} className="relative shrink-0 w-14 h-14">
                            <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                              <img src={url} alt={`已拍 ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
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
                    {Array.from({ length: emptySlotCount }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="w-14 h-14 rounded-xl border border-dashed border-white/20 bg-white/5"
                      />
                    ))}
                  </div>
                ) : null}
                {showQuotaHint ? (
                  <p className={`text-[11px] font-normal tracking-wide pointer-events-none ${
                    (askQuotaLeft ?? 0) === 0 ? 'text-amber-200/70' : 'text-white/45'
                  }`}>
                    {`今日上传图片额度还剩 ${askQuotaLeft ?? 0} 张`}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* 完成：固定右下角 */}
            {captureCount > 0 ? (
              <button
                type="button"
                onClick={handleConfirm}
                className="absolute bottom-6 right-4 md:right-8 z-30 h-11 px-5 rounded-full bg-[#6C5DD3] text-white font-bold text-sm flex items-center gap-2 shadow-[0_8px_24px_rgba(108,93,211,0.45)] hover:bg-[#5a4bc4] active:scale-95 transition-all"
              >
                <Check size={16} />
                {mode === 'mirror' ? '开始解题' : `完成 (${captureCount}/${maxPhotos})`}
              </button>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget,
  );
};
