import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SubjectType } from '../../types';
import { displaySubjectName, getGradeSubjects } from '../../data/subjectCatalog';
import { isJuniorGrade, type UiSchoolSystem } from '../../data/juniorDemoCatalog';

interface SubjectSwipeSwitcherProps {
  activeSubject: SubjectType;
  onSubjectChange: (subject: SubjectType) => void;
  currentGrade?: string;
  textbookTerm?: string;
  schoolSystem?: UiSchoolSystem;
  variant?: 'dark' | 'light';
}

export const SubjectSwipeSwitcher: React.FC<SubjectSwipeSwitcherProps> = ({
  activeSubject,
  onSubjectChange,
  currentGrade = '七年级',
  textbookTerm = '上册',
  schoolSystem = '六三制',
  variant = 'light',
}) => {
  const [displaySubject, setDisplaySubject] = useState<string>(activeSubject);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDark = variant === 'dark';
  const subjects = useMemo(() => getGradeSubjects(currentGrade, schoolSystem), [schoolSystem, currentGrade]);
  const showTerm = isJuniorGrade(currentGrade, schoolSystem);

  useEffect(() => {
    setDisplaySubject(subjects.includes(activeSubject) ? activeSubject : subjects[0]);
  }, [activeSubject, subjects]);

  const selectSubject = (subject: string) => {
    setDisplaySubject(subject);
    onSubjectChange(subject as SubjectType);
  };
  const switchByDelta = (delta: number) => {
    const next = subjects[subjects.indexOf(displaySubject) + delta];
    if (next) selectSubject(next);
  };
  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
  };
  const handleTouchEnd = (event: React.TouchEvent) => {
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    const dy = event.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) switchByDelta(dx < 0 ? 1 : -1);
  };

  return (
    <div className="relative flex items-center gap-4 select-none touch-pan-y" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div
        className={`h-9 min-w-[108px] max-w-[148px] px-3 rounded-full flex items-center justify-center text-[13px] font-semibold shadow-sm border ${
          isDark ? 'bg-white/15 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-600'
        }`}
        title="年级、册次、学制请到「我的 · 我的课本」修改"
      >
        <span className="truncate">{showTerm ? `${currentGrade} · ${textbookTerm}` : currentGrade}</span>
      </div>

      <div className="flex items-end gap-4 overflow-x-auto no-scrollbar pr-2" aria-label={`${currentGrade}学科切换`}>
        {subjects.map((subject) => {
          const isActive = subject === displaySubject;
          return (
            <button key={subject} type="button" onClick={() => selectSubject(subject)} className="relative whitespace-nowrap pb-1 active:scale-95 transition-transform">
              <span className={`transition-all duration-300 ${isActive ? `text-[15px] font-semibold ${isDark ? 'text-white' : 'text-sky-500'}` : `text-[13px] font-medium ${isDark ? 'text-white/45' : 'text-slate-500'}`}`}>
                {displaySubjectName(subject)}
              </span>
              {isActive && <motion.svg layoutId="subject-wave-underline" className="absolute -bottom-0.5 left-0 w-full h-1.5 text-indigo-500" viewBox="0 0 60 8" fill="none"><path d="M2 5 C 10 1, 18 7, 26 4 S 42 2, 58 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></motion.svg>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
