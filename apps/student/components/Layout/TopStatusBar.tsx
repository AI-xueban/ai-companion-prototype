
import React from 'react';
import { UserStats, SubjectType, MapMode } from '../../types';
import { SubjectSwipeSwitcher } from './SubjectSwipeSwitcher';
import type { UiSchoolSystem } from '../../data/juniorDemoCatalog';

interface TopStatusBarProps {
  stats: UserStats;
  activeSubject?: SubjectType;
  onSubjectChange?: (subject: SubjectType) => void;
  currentGrade?: string;
  textbookTerm?: string;
  schoolSystem?: UiSchoolSystem;
  showSubjectSwitcher?: boolean;
  variant?: 'dark' | 'light';
  learningStrategy?: 'sync-mode' | 'exam-mode';
  onStrategyChange?: (strategy: 'sync-mode' | 'exam-mode') => void;
  mapMode?: MapMode;
  onModeChange?: (mode: MapMode) => void;
  hideModeSwitcher?: boolean;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  activeSubject = '数学',
  onSubjectChange,
  currentGrade = '七年级',
  textbookTerm = '上册',
  schoolSystem,
  showSubjectSwitcher = true,
  variant = 'dark',
}) => {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {showSubjectSwitcher && onSubjectChange && (
        <div className="absolute left-1/2 -translate-x-1/2 top-4 z-20 pointer-events-auto">
          <SubjectSwipeSwitcher
            activeSubject={activeSubject}
            onSubjectChange={onSubjectChange}
            currentGrade={currentGrade}
            textbookTerm={textbookTerm}
            schoolSystem={schoolSystem}
            variant={variant}
          />
        </div>
      )}
    </div>
  );
};
