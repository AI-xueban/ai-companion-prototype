import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, LoaderCircle } from 'lucide-react';
import scanClassroomImg from '@/assets/zhiyue-scan-classroom.png';
import { createLoadingPreview } from './loadingPreview';

interface Props {
  images: string[];
  onBack: () => void;
  onComplete: () => void;
}

export const ZhiyueAnalyzingPage = ({ images, onBack, onComplete }: Props) => {
  const frames = useMemo(() => createLoadingPreview(images.length), [images.length]);
  const [frameIndex, setFrameIndex] = useState(0);
  const frame = frames[Math.min(frameIndex, frames.length - 1)];
  const isFinalizing = frame.phase === 'finalizing' || frame.phase === 'done';
  const receivedFrames = frames.slice(0, frameIndex + 1);
  const isGrading = !isFinalizing && receivedFrames.some(item => item.phase === 'grading');
  const completedPages = new Set(receivedFrames.filter(item => item.phase === 'grading' && item.completed === item.total).map(item => item.pageIndex)).size;
  const isMulti = images.length > 1;

  useEffect(() => {
    if (frame.phase === 'done') {
      onComplete();
      return undefined;
    }
    const timer = window.setTimeout(() => setFrameIndex(index => index + 1), frame.duration);
    return () => window.clearTimeout(timer);
  }, [frame, onComplete]);

  const message = isFinalizing
    ? '批改已完成，正在准备结果…'
    : isGrading
      ? isMulti
        ? `正在批改作业，已完成 ${completedPages} / ${images.length} 张…`
        : `正在逐题批改，已完成 ${frame.completed} / ${frame.total} 题…`
      : '正在识别作业题目…';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#4c4588] text-white">
      <div aria-hidden="true" className="absolute -inset-4 opacity-60 blur-[5px]"
        style={{ backgroundImage: `url(${scanClassroomImg})`, backgroundSize: '110% 145%', backgroundPosition: 'center 80%' }} />
      <div aria-hidden="true" className="absolute inset-0"
        style={{ background: 'linear-gradient(120deg,rgba(42,28,95,.68),rgba(69,76,136,.48) 60%,rgba(117,164,195,.5))' }} />
      <button type="button" aria-label="返回拍照" onClick={onBack}
        className="absolute top-[5%] left-[4.5%] flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
        <ChevronLeft size={28} />
      </button>
      <div className="absolute left-1/2 top-[14%] -translate-x-1/2 w-[43%] max-w-[550px] flex flex-col items-center gap-5">
        <div className="relative w-full aspect-[638/514]">
          <div aria-hidden="true" className="absolute inset-[4%] rotate-[-5deg] rounded-2xl bg-[#e4ddf8]/25" />
          <div className="relative w-full h-full overflow-hidden rounded-2xl border-2 border-[#e5d6ff] bg-white shadow-[0_15px_70px_#23144355,0_0_25px_#c1a5ff44]">
            <img src={images[0]} alt={isMulti ? '第1张作业预览' : '作业照片'} className="w-full h-full object-contain" />
            {!isFinalizing && <motion.div aria-hidden="true"
              className="absolute inset-x-0 h-[3px] bg-[#b998ff] shadow-[0_0_14px_4px_#af91ff88]"
              animate={{ top: ['0%', '100%', '0%'] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }} />}
            {isMulti && <span className="absolute top-3 right-3 rounded-lg bg-[#463574]/85 px-3 py-1.5 text-[11px]">
              共{images.length}张
            </span>}
            {isFinalizing && <div className="absolute inset-0 flex items-center justify-center bg-[#b7a1ed]/10">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#e3d7ff] bg-[#7461cc]/95 shadow-lg"><Check size={31} /></span>
            </div>}
          </div>
        </div>
        <div className="w-full text-center">
          <p role="status" aria-live="polite" className="flex items-center justify-center gap-2 text-base font-bold leading-relaxed">
            {!isGrading && <LoaderCircle size={15} className="animate-spin shrink-0 text-[#e9dcff]" />}{message}
          </p>

        </div>
      </div>
    </div>
  );
};
