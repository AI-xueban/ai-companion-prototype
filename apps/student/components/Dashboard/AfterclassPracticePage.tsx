import React, { useMemo, useState } from 'react';
import { BookOpen, Calculator, Check, ChevronDown, FlaskConical, Home, Languages, Globe2, Dna, X } from 'lucide-react';
import { SubjectType } from '../../types';
import {
  CatalogNode,
  SUBJECT_TEXTBOOKS,
  STUDENT_STUDY_CONTEXT,
  applyStudyContext,
  applySubjectTextbook,
  getDefaultStudySelection,
  getFirstSection,
  getTextbookCatalog,
  getSubjectsForSchoolSystem,
  isChapterOnlyTextbook,
} from '../../data/syncTextbookCatalog';
import { Annotatable } from '../Prototype/Annotatable';
import { AssessmentConfigPage, assessmentShowsKnowledgePoints, toAssessmentCatalog } from './AssessmentConfigPage';
import { PracticeSetupModal } from './PracticeSetupModal';
import {
  AFTERCLASS_STATUS_LABEL,
  AfterclassPracticeStatus,
  beginAfterclassPractice,
  getAfterclassPracticeBank,
  getAfterclassPracticeStatus,
  refreshAfterclassPracticeBank,
} from '../../data/afterclassPracticeStatus';

export interface AssessmentLaunchSelection {
  subject: SubjectType;
  textbook: string;
  sectionIds: string[];
}

export interface StudyLaunchSelection {
  subject: SubjectType;
  textbook: string;
  chapterId: string;
  chapterLabel: string;
  sectionId: string;
  sectionLabel: string;
  scope: 'section' | 'chapter';
}

const QUESTION_COUNTS = [5, 10, 15];

const SUBJECT_CATEGORY: Record<SubjectType, { label: string; icon: typeof Calculator }> = {
  数学: { label: '计算', icon: Calculator },
  语文: { label: '阅读', icon: BookOpen },
  英语: { label: '听说', icon: Languages },
  道德与法治: { label: '品德', icon: BookOpen },
  历史: { label: '人文', icon: BookOpen },
  科学: { label: '探究', icon: FlaskConical },
  地理: { label: '区域', icon: Globe2 },
  生物: { label: '生命', icon: Dna },
  物理: { label: '实验', icon: FlaskConical },
  化学: { label: '实验', icon: FlaskConical },
};

function catalogLeafIds(chapter: CatalogNode) {
  return chapter.children.length > 0 ? chapter.children.map((item) => item.id) : [chapter.id];
}

function practiceCards(
  chapter: CatalogNode,
  chapterOnly = false
): {
  id: string;
  title: string;
  sectionId: string;
  sectionLabel: string;
  scope: 'section' | 'chapter';
}[] {
  const sectionCards =
    !chapterOnly && chapter.children.length > 0
      ? chapter.children.map((section) => ({
          id: section.id,
          title: section.label,
          sectionId: section.id,
          sectionLabel: section.label,
          scope: 'section' as const,
        }))
      : [];
  return [
    ...sectionCards,
    {
      id: `${chapter.id}__unit`,
      title: '单元测',
      sectionId: chapter.id,
      sectionLabel: chapter.label,
      scope: 'chapter' as const,
    },
  ];
}

function InsufficientBankModal({
  sectionTitle,
  selectedCount,
  remaining,
  onConfirm,
  onCancel,
  onRefresh,
}: {
  sectionTitle: string;
  selectedCount: number;
  remaining: number;
  onConfirm: () => void;
  onCancel: () => void;
  onRefresh: () => void;
}) {
  const canContinue = remaining > 0;
  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4 py-6"
      onClick={onCancel}
    >
      <Annotatable annotationId="dashboard.afterclass-practice.bank-shortage" className="w-full max-w-[400px]">
        <div
          className="rounded-[28px] bg-white px-6 pb-5 pt-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[20px] font-black leading-snug text-slate-900">
              {canContinue ? `目前只能出 ${remaining} 题` : '当前小节没有新题了'}
            </h3>
            <button
              type="button"
              onClick={onCancel}
              aria-label="关闭"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-slate-500">
            {canContinue ? (
              <>
                当前小节「
                <span className="font-black text-slate-900">{sectionTitle}</span>
                」还剩 {remaining} 道新题，不够 {selectedCount} 道。可以先做做看。
              </>
            ) : (
              <>
                当前小节「
                <span className="font-black text-slate-900">{sectionTitle}</span>
                」的题你都做过了。
              </>
            )}
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            {canContinue ? (
              <button
                type="button"
                onClick={onConfirm}
                className="flex h-12 items-center justify-center rounded-full bg-[#7B61FF] text-[16px] font-black text-white shadow-[0_10px_22px_rgba(123,97,255,0.28)]"
              >
                确认按 {remaining} 题开始
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-12 items-center justify-center rounded-full bg-[#F3F0FF] text-[16px] font-black text-[#7B61FF]"
            >
              刷新本练习的题
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-12 items-center justify-center rounded-full bg-[#F4F5F7] text-[16px] font-black text-slate-600"
            >
              先不练了
            </button>
          </div>
        </div>
      </Annotatable>
    </div>
  );
}

function PracticeStatusBadge({ status }: { status: AfterclassPracticeStatus }) {
  const tone =
    status === 'completed'
      ? 'bg-emerald-50 text-emerald-600'
      : status === 'in_progress'
        ? 'bg-amber-50 text-amber-600'
        : 'bg-slate-100 text-slate-400';
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${tone}`}>
      {AFTERCLASS_STATUS_LABEL[status]}
    </span>
  );
}

function PracticeLessonCard({
  card,
  subject,
  textbook,
  count,
  onCountChange,
  onPractice,
}: {
  card: ReturnType<typeof practiceCards>[number];
  subject: SubjectType;
  textbook: string;
  count: number;
  onCountChange: (value: number) => void;
  onPractice: () => void;
}) {
  const isUnit = card.scope === 'chapter';
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] p-4 shadow-[0_10px_24px_rgba(56,120,180,0.10)] ${
        isUnit ? 'bg-[#FFF6D9] ring-1 ring-amber-200/80' : 'bg-white'
      }`}
    >
      <div
        className={`absolute -right-4 -top-4 h-14 w-14 rounded-full ${
          isUnit ? 'bg-amber-100' : 'bg-sky-50'
        }`}
      />
      <div className="relative flex items-start justify-between gap-2">
        <h3
          className={`min-w-0 flex-1 text-[15px] font-black leading-snug ${
            isUnit ? 'text-amber-800' : 'text-slate-800'
          }`}
        >
          {card.title}
        </h3>
        <PracticeStatusBadge status={getAfterclassPracticeStatus(subject, textbook, card.id)} />
      </div>
      {isUnit ? null : (
        <div className="relative mt-3">
          <QuestionCountSelect value={count} onChange={onCountChange} />
        </div>
      )}
      <button
        type="button"
        onClick={onPractice}
        className="relative mt-4 inline-flex h-8 items-center rounded-full border-[1.5px] border-orange-400 px-3.5 text-[13px] font-black text-orange-500 hover:bg-orange-50 active:scale-95"
      >
        去练习
      </button>
    </div>
  );
}

function QuestionCountSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-500"
      >
        做{value}题
        <ChevronDown size={12} className={open ? 'rotate-180' : ''} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 min-w-[88px] overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(count);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-[12px] font-bold ${
                  count === value ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                做{count}题
                {count === value ? <Check size={12} /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function AfterclassPracticePage({
  onBack,
  onStart,
  onStartAssessment,
  grade,
  term,
  schoolSystem,
  initialSubject,
  initialTextbook,
}: {
  onBack: () => void;
  onStart: (selection: StudyLaunchSelection) => void;
  onStartAssessment?: (selection: AssessmentLaunchSelection) => void;
  grade: string;
  term: string;
  schoolSystem: string;
  initialSubject?: SubjectType;
  initialTextbook?: string;
}) {
  const defaults = useMemo(() => {
    applyStudyContext({ stage: '小学', grade, term, schoolSystem });
    if (initialSubject && initialTextbook) applySubjectTextbook(initialSubject, initialTextbook);
    const fallback = getDefaultStudySelection();
    if (!initialSubject) return fallback;
    const textbook = initialTextbook || SUBJECT_TEXTBOOKS[initialSubject] || fallback.textbook;
    const catalog = getTextbookCatalog(initialSubject, textbook);
    const first = getFirstSection(catalog);
    return {
      subject: initialSubject,
      textbook,
      chapterId: first?.chapter.id || '',
      sectionId: first?.section.id || '',
    };
  }, [grade, initialSubject, initialTextbook, schoolSystem, term]);
  const [view, setView] = useState<'practice' | 'assessment'>('practice');
  const [subject, setSubject] = useState<SubjectType>(defaults.subject);
  const [textbook, setTextbook] = useState(defaults.textbook || SUBJECT_TEXTBOOKS[defaults.subject]);
  const [chapterId, setChapterId] = useState(defaults.chapterId);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [unitSetupChapter, setUnitSetupChapter] = useState<CatalogNode | null>(null);
  const [, setBankTick] = useState(0);
  const [shortage, setShortage] = useState<{
    chapter: CatalogNode;
    card: ReturnType<typeof practiceCards>[number];
    requestedCount: number;
    remaining: number;
  } | null>(null);
  const SUBJECTS = getSubjectsForSchoolSystem(STUDENT_STUDY_CONTEXT.schoolSystem);
  const chapterOnly = isChapterOnlyTextbook(subject, textbook);

  const catalog = getTextbookCatalog(subject, textbook);
  const selectedChapter = useMemo(() => {
    return (
      catalog.find((item) => item.id === chapterId) ||
      catalog.find((item) => item.children.some((child) => child.id === chapterId)) ||
      catalog[0] ||
      null
    );
  }, [catalog, chapterId]);

  const carriedAssessmentIds = useMemo(() => {
    if (!selectedChapter) return [];
    if (chapterOnly) return [selectedChapter.id];
    return catalogLeafIds(selectedChapter);
  }, [chapterOnly, selectedChapter]);

  const applyAssessmentSelectionToPractice = (sectionIds: string[]) => {
    if (!sectionIds.length) return;
    for (const chapter of catalog) {
      const leaves = catalogLeafIds(chapter);
      if (sectionIds.includes(chapter.id) || leaves.some((id) => sectionIds.includes(id))) {
        setChapterId(chapter.id);
        return;
      }
    }
  };

  const applySubjectCatalog = (nextSubject: SubjectType) => {
    const nextTextbook = SUBJECT_TEXTBOOKS[nextSubject] || '人教版';
    const nextCatalog = getTextbookCatalog(nextSubject, nextTextbook);
    const fallback = getFirstSection(nextCatalog);
    setSubject(nextSubject);
    setTextbook(nextTextbook);
    setChapterId(fallback?.chapter.id || '');
  };

  const startCard = (
    chapter: CatalogNode,
    card: ReturnType<typeof practiceCards>[number],
    questionCount: number
  ) => {
    setChapterId(chapter.id);
    beginAfterclassPractice(subject, textbook, card.id, questionCount);
    onStart({
      subject,
      textbook,
      chapterId: chapter.id,
      chapterLabel: chapter.label,
      sectionId: card.sectionId,
      sectionLabel: card.sectionLabel,
      scope: card.scope,
    });
  };

  const tryStartCard = (
    chapter: CatalogNode,
    card: ReturnType<typeof practiceCards>[number],
    questionCount: number
  ) => {
    const bank = getAfterclassPracticeBank(subject, textbook, card.id);
    if (bank.remaining < questionCount) {
      setShortage({ chapter, card, requestedCount: questionCount, remaining: bank.remaining });
      return;
    }
    startCard(chapter, card, questionCount);
  };

  const unitRecommendedCount = useMemo(() => {
    if (!unitSetupChapter) return 10;
    if (chapterOnly || unitSetupChapter.children.length === 0) return 10;
    if (assessmentShowsKnowledgePoints(subject)) {
      const knowledgeCount = unitSetupChapter.children.reduce(
        (sum, section) => sum + (section.knowledgePoints?.length || 0),
        0
      );
      return Math.min(40, Math.max(1, (knowledgeCount || unitSetupChapter.children.length) * 2));
    }
    return Math.min(40, Math.max(1, unitSetupChapter.children.length * 2));
  }, [chapterOnly, subject, unitSetupChapter]);

  if (view === 'assessment') {
    return (
      <AssessmentConfigPage
        catalog={toAssessmentCatalog(catalog, {
          chapterOnly: isChapterOnlyTextbook(subject, textbook),
        })}
        onBack={onBack}
        onStart={(sectionIds) => onStartAssessment?.({ subject, textbook, sectionIds })}
        switchLabel="切换到一课一练"
        onSwitch={(sectionIds) => {
          applyAssessmentSelectionToPractice(sectionIds);
          setView('practice');
        }}
        subject={subject}
        textbook={textbook}
        subjects={SUBJECTS}
        onSubjectChange={applySubjectCatalog}
        initialSectionIds={carriedAssessmentIds}
        catalogAnnotationId="dashboard.afterclass-assessment.catalog"
        startAnnotationId="dashboard.afterclass-assessment.start"
        switchAnnotationId="dashboard.afterclass-practice.switch"
      />
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#D8EEFF] text-slate-800">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-8 h-28 w-40 rounded-full bg-white/70 blur-[2px]" />
        <div className="absolute left-28 top-3 h-16 w-28 rounded-full bg-white/80" />
        <div className="absolute right-8 top-6 h-24 w-44 rounded-full bg-white/75" />
        <div className="absolute bottom-10 right-16 h-20 w-32 rounded-full bg-white/50" />
        <div className="absolute -bottom-8 left-10 h-24 w-52 rounded-full bg-sky-100/80" />
      </div>

      <header className="relative z-20 flex shrink-0 items-center gap-3 px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回首页"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B9EFF] text-white shadow-[0_8px_18px_rgba(59,158,255,0.35)] active:scale-95"
        >
          <Home size={18} fill="currentColor" />
        </button>
        <h1 className="shrink-0 text-[18px] font-black text-slate-900">一课一练</h1>
        <span className="min-w-0 flex-1" />
        <Annotatable annotationId="dashboard.afterclass-practice.switch" className="shrink-0">
          <button
            type="button"
            onClick={() => setView('assessment')}
            className="rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-bold text-sky-600 shadow-sm"
          >
            切换到精准练习
          </button>
        </Annotatable>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 gap-4 px-5 pb-5 pt-1">
        <div className="flex h-full w-[210px] shrink-0 flex-col">
          <Annotatable annotationId="dashboard.afterclass-practice.subject" className="flex min-h-0 flex-1">
          <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[28px] bg-white/90 shadow-[0_12px_30px_rgba(56,120,180,0.12)]">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
              {SUBJECTS.map((item) => {
                const active = item === subject;
                const ItemIcon = SUBJECT_CATEGORY[item].icon;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => applySubjectCatalog(item)}
                    className={`mb-1 flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left ${
                      active ? 'bg-sky-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        active ? 'bg-[#3B9EFF]' : 'bg-transparent'
                      }`}
                    />
                    <ItemIcon size={14} className={active ? 'text-[#3B9EFF]' : 'text-slate-400'} />
                    <span
                      className={`text-[13px] leading-snug ${
                        active ? 'font-black text-slate-900' : 'font-semibold text-slate-600'
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        </Annotatable>
        </div>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <Annotatable annotationId="dashboard.afterclass-practice.textbook" className="shrink-0">
            <span className="block truncate text-[12px] font-semibold text-slate-500">
              {STUDENT_STUDY_CONTEXT.stage}
              {STUDENT_STUDY_CONTEXT.grade}
              {' · '}
              {STUDENT_STUDY_CONTEXT.schoolSystem}
              {' · '}
              {STUDENT_STUDY_CONTEXT.term}
              {' · '}
              {textbook}
            </span>
          </Annotatable>
          <Annotatable annotationId="dashboard.afterclass-practice.catalog" className="flex min-h-0 flex-1 flex-col">
            <Annotatable annotationId="dashboard.afterclass-practice.start" className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1 no-scrollbar">
              {catalog.map((chapter) => {
                const cards = practiceCards(chapter, chapterOnly);
                return (
                  <div key={chapter.id} className="shrink-0 space-y-2">
                    <h2 className="px-0.5 text-[15px] font-black text-slate-800">{chapter.label}</h2>
                    <div className="grid grid-cols-2 content-start gap-3">
                      {cards.map((card) => {
                        const count = questionCounts[card.id] || 10;
                        return (
                          <PracticeLessonCard
                            key={card.id}
                            card={card}
                            subject={subject}
                            textbook={textbook}
                            count={count}
                            onCountChange={(next) =>
                              setQuestionCounts((current) => ({ ...current, [card.id]: next }))
                            }
                            onPractice={() => {
                              if (card.scope === 'chapter') setUnitSetupChapter(chapter);
                              else tryStartCard(chapter, card, count);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            </Annotatable>
          </Annotatable>
        </section>
      </div>
      <PracticeSetupModal
        open={Boolean(unitSetupChapter)}
        recommendedCount={unitRecommendedCount}
        annotationId="dashboard.afterclass-practice.start"
        onClose={() => setUnitSetupChapter(null)}
        onConfirm={(value) => {
          const chapter = unitSetupChapter;
          const unitCard = chapter
            ? practiceCards(chapter, chapterOnly).find((card) => card.scope === 'chapter')
            : undefined;
          setUnitSetupChapter(null);
          if (chapter && unitCard) tryStartCard(chapter, unitCard, value.questionCount);
        }}
      />
      {shortage ? (
        <InsufficientBankModal
          sectionTitle={shortage.card.title}
          selectedCount={shortage.requestedCount}
          remaining={shortage.remaining}
          onCancel={() => setShortage(null)}
          onRefresh={() => {
            refreshAfterclassPracticeBank(subject, textbook, shortage.card.id);
            setBankTick((value) => value + 1);
            setShortage(null);
          }}
          onConfirm={() => {
            const { chapter, card, remaining } = shortage;
            setShortage(null);
            startCard(chapter, card, remaining);
          }}
        />
      ) : null}
    </div>
  );
}
