import React, { useEffect, useMemo, useState } from 'react';
import { getJuniorChineseTextbookVersions } from '../../data/juniorChineseSyncVideos';
import {
  getDemoTextbookVersions,
  resolveCatalogTerm,
  type UiSchoolSystem,
} from '../../data/juniorDemoCatalog';
import { resolveTextbookVersion } from '../../services/textbookVersionStore';
import { getSyncBookProgress, makeSyncBookKey } from '../../services/syncProgressStore';
import { buildSelfTestTree } from '../../data/juniorSyncAssessment';
import { getGradeSubjects } from '../../data/subjectCatalog';
import { KG_SCOPE_SELF_TEST } from '../../utils/kgMicroLesson';
import { SubjectType, Task } from '../../types';
import { SyncSelfTestPage } from '../SubjectMap/SyncSelfTestPage';

interface SelfPracticePageProps {
  open: boolean;
  grade: string;
  term: string;
  schoolSystem?: UiSchoolSystem;
  initialSubject?: string;
  onBack: () => void;
  onStart: (task: Task) => void;
}

function resolveVersion(subject: string, grade: string, term: string, schoolSystem: UiSchoolSystem) {
  const versions = subject === '语文'
    ? getJuniorChineseTextbookVersions(grade, term)
    : getDemoTextbookVersions(subject, grade, term, schoolSystem);
  return resolveTextbookVersion(subject, versions.length ? versions : ['人教版'], schoolSystem);
}

export const SelfPracticePage: React.FC<SelfPracticePageProps> = ({
  open,
  grade,
  term,
  schoolSystem = '六三制',
  initialSubject = '数学',
  onBack,
  onStart,
}) => {
  const subjects = useMemo(() => getGradeSubjects(grade, schoolSystem), [grade, schoolSystem]);
  const [subject, setSubject] = useState(initialSubject);

  useEffect(() => {
    if (!open) return;
    setSubject(subjects.includes(initialSubject) ? initialSubject : (subjects[0] ?? '语文'));
  }, [open, initialSubject, subjects]);

  const version = useMemo(
    () => resolveVersion(subject, grade, term, schoolSystem),
    [subject, grade, term, schoolSystem],
  );
  const activeTerm = useMemo(
    () => resolveCatalogTerm(subject, grade, term, version, schoolSystem),
    [subject, grade, term, version, schoolSystem],
  );
  const tree = useMemo(
    () => buildSelfTestTree(subject, grade, activeTerm, version, schoolSystem),
    [subject, grade, activeTerm, version, schoolSystem],
  );
  const lastLesson = useMemo(
    () => getSyncBookProgress(makeSyncBookKey(subject, version, grade, activeTerm)),
    [subject, version, grade, activeTerm, open],
  );

  return (
    <SyncSelfTestPage
      open={open}
      subject={subject}
      grade={grade}
      term={activeTerm}
      version={version}
      tree={tree}
      currentChapterHint={lastLesson.catalog}
      currentSectionHint={lastLesson.section}
      subjects={subjects}
      onSubjectChange={setSubject}
      pageTitle="自主练习"
      startLabel="开始练习"
      layerClassName="z-[650]"
      onBack={onBack}
      onStart={(payload) => {
        onStart({
          id: `${subject}-self-practice-${payload.selectedIds.length}-${Date.now()}`,
          title: payload.title,
          subject: subject as SubjectType,
          durationMinutes: Math.max(Math.ceil(payload.questionCount * 1.5), 10),
          completed: false,
          levelType: 'practice',
          quizType: 'standard',
          questionCount: payload.questionCount,
          practiceDifficulty: payload.difficultyLevel,
          practiceDifficultyLabel: payload.difficulty,
          practiceScenario: payload.scenario,
          practiceScenarioLabel: payload.scenarioLabel,
          aiReasoning: KG_SCOPE_SELF_TEST,
        });
      }}
    />
  );
};
