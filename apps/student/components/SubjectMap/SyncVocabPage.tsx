import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Play } from 'lucide-react';
import type { EnglishVocabSection, EnglishVocabUnit } from '../../data/juniorEnglishSyncVocabG7A';
import { SyncUnitCatalog, SyncUnitDetailHeader } from './SyncUnitCatalog';

interface SyncVocabPageProps {
  open: boolean;
  units: EnglishVocabUnit[];
  onBack: () => void;
  onPlayWord: (unit: EnglishVocabUnit, section: EnglishVocabSection, word: string) => void;
}

export const SyncVocabPage: React.FC<SyncVocabPageProps> = ({
  open,
  units,
  onBack,
  onPlayWord,
}) => {
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');

  const unit = useMemo(
    () => units.find((item) => item.id === unitId) ?? units[0],
    [units, unitId],
  );

  useEffect(() => {
    if (!open) return;
    setUnitId(units[0]?.id ?? '');
  }, [open, units]);

  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  if (!viewport) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sync-vocab-page"
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
              <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold text-slate-900">同步词汇</h1>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
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
                    className="mx-auto flex w-full max-w-3xl flex-col gap-4"
                  >
                  {unit.sections.map((section) => (
                    <section
                      key={section.id}
                      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-center gap-2.5 border-b border-slate-50 px-4 py-3">
                        <button
                          type="button"
                          aria-label={`播放 ${section.title}`}
                          onClick={() => onPlayWord(unit, section, section.title)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white transition hover:bg-indigo-600"
                        >
                          <Play size={13} fill="currentColor" className="ml-0.5" />
                        </button>
                        <span className="min-w-0 flex-1 text-[14px] font-semibold text-slate-700">{section.title}</span>
                        {section.words.length > 0 && (
                          <span className="text-[11px] font-medium text-slate-400">{section.words.length} 词</span>
                        )}
                      </div>
                      {section.words.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-4">
                          {section.words.map((word) => (
                            <button
                              key={word}
                              type="button"
                              onClick={() => onPlayWord(unit, section, word)}
                              className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3.5 py-1.5 text-[13px] text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              {word}
                            </button>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
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
