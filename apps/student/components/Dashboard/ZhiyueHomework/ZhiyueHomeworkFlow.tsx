import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import scanDemoImg from '@/assets/lingjing-scan-demo.png';
import { LingjingTutorPage } from '../LingjingTutorPage';
import { ZhiyueCameraPage } from './ZhiyueCameraPage';
import { ZhiyueCropPage } from './ZhiyueCropPage';
import { ZhiyueHistoryPage } from './ZhiyueHistoryPage';
import { formatRecordDate, INITIAL_ZHIYUE_RECORDS } from './mockRecords';
import { ZhiyueCapturedPage, ZhiyueMode, ZhiyueQuestionGrade, ZhiyueRecord, ZhiyueStep } from './types';

const ANALYZE_DELAY_MS = 1800;
const MAX_PAGES = 3;

const AnalyzingView = ({ onCancel }: { onCancel: () => void }) => (
  <div className="relative w-full h-full overflow-hidden bg-[#14102e]">
    <img src={scanDemoImg} alt="" className="absolute inset-0 w-full h-full object-contain opacity-80" />
    <div className="absolute inset-0 bg-[#14102e]/45" />
    <motion.div
      className="absolute left-[8%] right-[8%] h-1 rounded-full bg-[#d4c4f8] shadow-[0_0_18px_rgba(212,196,248,0.9)]"
      animate={{ top: ['16%', '84%'] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
    />
    <button
      type="button"
      onClick={onCancel}
      className="absolute top-5 left-5 z-20 text-sm font-bold text-white/80 hover:text-white"
    >
      取消
    </button>
    <div className="absolute inset-x-0 bottom-10 text-center">
      <p className="text-white text-lg font-black">正在扫描批改…</p>
      <p className="text-white/70 text-sm font-medium mt-2">好未来正在识别题目并切题</p>
    </div>
  </div>
);

interface ZhiyueHomeworkFlowProps {
  onBack: () => void;
}

export const ZhiyueHomeworkFlow = ({ onBack }: ZhiyueHomeworkFlowProps) => {
  const [step, setStep] = useState<ZhiyueStep>('camera');
  const [mode, setMode] = useState<ZhiyueMode>('single');
  const [flashOn, setFlashOn] = useState(false);
  const [capturedPages, setCapturedPages] = useState<ZhiyueCapturedPage[]>([]);
  const [records, setRecords] = useState<ZhiyueRecord[]>(INITIAL_ZHIYUE_RECORDS);
  const [fromHistory, setFromHistory] = useState(false);
  const [resultPageCount, setResultPageCount] = useState(1);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [activeQuestionGrades, setActiveQuestionGrades] = useState<Record<string, ZhiyueQuestionGrade>>({});

  useEffect(() => {
    if (step !== 'analyzing') return undefined;

    const timer = window.setTimeout(() => {
      const now = new Date();
      const stamped = formatRecordDate(now);
      const pageCount = mode === 'multi' ? Math.max(capturedPages.length, 1) : 1;
      const recordId = `r-${now.getTime()}`;
      setResultPageCount(pageCount);
      setActiveRecordId(recordId);
      setActiveQuestionGrades({});
      setRecords(prev => [
        {
          id: recordId,
          ...stamped,
          mode,
          pageCount,
        },
        ...prev,
      ]);
      setFromHistory(false);
      setStep('result');
    }, ANALYZE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [step, mode, capturedPages.length]);

  const openCamera = (resetPages = true) => {
    setFromHistory(false);
    if (resetPages) setCapturedPages([]);
    setStep('camera');
  };

  const handleModeChange = (next: ZhiyueMode) => {
    setMode(next);
    setCapturedPages([]);
  };

  const handleShutter = () => {
    if (mode === 'single') {
      setStep('crop');
      return;
    }
    if (capturedPages.length >= MAX_PAGES) return;
    setCapturedPages(prev => [...prev, { id: `p-${Date.now()}`, src: scanDemoImg }]);
  };

  const handleReorderPages = (from: number, to: number) => {
    setCapturedPages(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#14102e]">
      <AnimatePresence mode="wait">
        {step === 'camera' && (
          <motion.div
            key="camera"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ZhiyueCameraPage
              mode={mode}
              flashOn={flashOn}
              capturedPages={capturedPages}
              onModeChange={handleModeChange}
              onToggleFlash={() => setFlashOn(on => !on)}
              onShutter={handleShutter}
              onSubmit={() => setStep('analyzing')}
              onDeletePage={id => setCapturedPages(prev => prev.filter(page => page.id !== id))}
              onReorderPages={handleReorderPages}
              onOpenHistory={() => setStep('history')}
              onBack={onBack}
            />
          </motion.div>
        )}

        {step === 'crop' && (
          <motion.div
            key="crop"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ZhiyueCropPage imageSrc={scanDemoImg} onBack={() => openCamera(false)} onConfirm={() => setStep('analyzing')} />
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <AnalyzingView onCancel={() => openCamera(mode !== 'multi')} />
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LingjingTutorPage
              key={activeRecordId ?? 'result'}
              pageCount={resultPageCount}
              fromHistory={fromHistory}
              initialGrades={activeQuestionGrades}
              onGradesChange={grades => {
                setActiveQuestionGrades(grades);
                if (!activeRecordId) return;
                setRecords(prev =>
                  prev.map(record => (record.id === activeRecordId ? { ...record, questionGrades: grades } : record))
                );
              }}
              headerBackLabel={fromHistory ? '返回' : '重拍'}
              onHeaderBack={fromHistory ? () => setStep('history') : () => openCamera(true)}
              onRetake={() => openCamera(true)}
              onExit={onBack}
            />
          </motion.div>
        )}

        {step === 'history' && (
          <motion.div
            key="history"
            className="absolute inset-0"
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <ZhiyueHistoryPage
              records={records}
              onBack={() => openCamera(false)}
              onOpenRecord={record => {
                setFromHistory(true);
                setResultPageCount(record.pageCount);
                setActiveRecordId(record.id);
                setActiveQuestionGrades(record.questionGrades ?? {});
                setStep('result');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
