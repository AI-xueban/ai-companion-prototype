import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { getGradeSubjects } from '../../data/subjectCatalog';
import type { UiSchoolSystem } from '../../data/juniorDemoCatalog';
import type { SubjectType } from '../../types';

interface SyncStudyPickerPageProps {
  open: boolean;
  grade: string;
  term: string;
  schoolSystem?: UiSchoolSystem;
  onBack: () => void;
  onSelectSubject: (subject: SubjectType) => void;
}

export const SyncStudyPickerPage: React.FC<SyncStudyPickerPageProps> = ({
  open,
  grade,
  term,
  schoolSystem = '六三制',
  onBack,
  onSelectSubject,
}) => {
  const subjects = useMemo(() => getGradeSubjects(grade, schoolSystem), [grade, schoolSystem]);
  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  if (!viewport) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sync-study-picker"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 z-[650] flex flex-col bg-[#FAF9F6]"
        >
          <header className="shrink-0 border-b border-indigo-100 bg-white px-5 pb-3 pt-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                aria-label="返回"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[17px] font-semibold text-slate-900">同步课本</h1>
                <p className="truncate text-[11px] text-slate-400">
                  {grade} · {term}
                </p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mx-auto grid max-w-5xl grid-cols-4 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => onSelectSubject(subject as SubjectType)}
                  className="group flex min-h-[92px] flex-col items-start justify-between rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-left shadow-[0_8px_24px_rgba(99,102,241,0.06)] transition hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                    <BookOpen size={16} />
                  </span>
                  <span className="mt-3 flex w-full items-center justify-between gap-1">
                    <span className="text-[15px] font-semibold text-slate-800">
                      {subject === '道德与法治' ? '道法' : subject}
                    </span>
                    <ChevronRight size={16} className="text-indigo-400 transition group-hover:translate-x-0.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    viewport,
  );
};
