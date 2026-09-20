import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { SubjectMap } from '../SubjectMap/SubjectMap';
import type { SubjectType, Task, UserPersona } from '../../types';
import type { UiSchoolSystem } from '../../data/juniorDemoCatalog';

interface SyncStudySubjectPageProps {
  open: boolean;
  subject: SubjectType;
  grade: string;
  term: string;
  schoolSystem?: UiSchoolSystem;
  userName?: string;
  userPersona?: UserPersona;
  isAssessed?: boolean;
  onBack: () => void;
  onTextbookTermChange?: (term: string) => void;
  onDetailModeChange?: (open: boolean) => void;
  onStartLevel: (taskInfo: Partial<Task>) => void;
  onOpenEssayLab?: () => void;
}

export const SyncStudySubjectPage: React.FC<SyncStudySubjectPageProps> = ({
  open,
  subject,
  grade,
  term,
  schoolSystem = '六三制',
  userName = '同学',
  userPersona = 'average',
  isAssessed = true,
  onBack,
  onTextbookTermChange,
  onDetailModeChange,
  onStartLevel,
  onOpenEssayLab,
}) => {
  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  if (!viewport) return null;

  const subjectLabel = subject === '道德与法治' ? '道法' : subject;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key={`sync-study-subject-${subject}`}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 z-[540] flex flex-col bg-[#FAF9F6]"
        >
          <header className="shrink-0 border-b border-indigo-100 bg-white px-5 pb-3 pt-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                aria-label="返回科目列表"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[17px] font-semibold text-slate-900">
                  {subjectLabel} · 同步课本
                </h1>
                <p className="truncate text-[11px] text-slate-400">
                  {grade} · {term} · 教材全解与同步学习
                </p>
              </div>
            </div>
          </header>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <SubjectMap
              key={`sync-embed-${subject}-${grade}-${term}`}
              activeSubject={subject}
              mapMode="pro"
              embedded
              isAssessed={isAssessed}
              userPersona={userPersona}
              userName={userName}
              userGrade={grade}
              textbookTerm={term}
              onTextbookTermChange={onTextbookTermChange}
              schoolSystem={schoolSystem}
              skipWizard
              onDetailModeChange={onDetailModeChange}
              onStartLevel={onStartLevel}
              onOpenEssayLab={onOpenEssayLab}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    viewport,
  );
};
