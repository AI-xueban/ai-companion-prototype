import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import scanDemoImg from '@/assets/zhiyue-homework-photo.png';
import { ZhiyueAnalyzingPage } from './ZhiyueAnalyzingPage';
import { LingjingTutorPage } from '../LingjingTutorPage';
import { ZhiyueCameraPage } from './ZhiyueCameraPage';
import { ZhiyueCropPage } from './ZhiyueCropPage';
import { ZhiyueHistoryPage } from './ZhiyueHistoryPage';
import { formatRecordDate, INITIAL_ZHIYUE_RECORDS } from './mockRecords';
import { ZhiyueCapturedPage, ZhiyueMode, ZhiyueQuestionGrade, ZhiyueRecord, ZhiyueStep } from './types';

const MAX_PAGES = 3;

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

  const handleAnalyzingComplete = useCallback(() => {
    const now = new Date();
    const stamped = formatRecordDate(now);
    const pageCount = mode === 'multi' ? Math.max(capturedPages.length, 1) : 1;
    const recordId = `r-${now.getTime()}`;
    setResultPageCount(pageCount);
    setActiveRecordId(recordId);
    setActiveQuestionGrades({});
    setRecords(prev => [{ id: recordId, ...stamped, mode, pageCount }, ...prev]);
    setFromHistory(false);
    setStep('result');
  }, [mode, capturedPages.length]);

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
            <ZhiyueAnalyzingPage images={mode === 'multi' && capturedPages.length ? capturedPages.map(page => page.src) : [scanDemoImg]} onComplete={handleAnalyzingComplete} />
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
