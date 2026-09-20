import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { SubjectType } from '../../types';
import { STUDENT_STUDY_CONTEXT } from '../../data/syncTextbookCatalog';
import { Annotatable } from '../Prototype/Annotatable';
import { PracticeSetupModal } from './PracticeSetupModal';

export type AssessmentCatalogNode = {
  id: string;
  label: string;
  children: AssessmentCatalogNode[];
  knowledgePoints: string[];
};

export function toAssessmentCatalog(
  nodes: ReadonlyArray<{ id: string; label: string; children?: readonly any[]; knowledgePoints?: string[] }>,
  options?: { chapterOnly?: boolean }
): AssessmentCatalogNode[] {
  return nodes.map((node) => {
    if (options?.chapterOnly) {
      return {
        id: node.id,
        label: node.label,
        knowledgePoints: [],
        children: [],
      };
    }
    const children = toAssessmentCatalog(node.children || []);
    const knowledgePoints =
      node.knowledgePoints && node.knowledgePoints.length > 0
        ? node.knowledgePoints
        : children.length > 0
          ? []
          : fallbackKnowledgePoints(node.label);
    return {
      id: node.id,
      label: node.label,
      knowledgePoints,
      children,
    };
  });
}

function fallbackKnowledgePoints(label: string): string[] {
  const name = label.replace(/^\d+(\.\d+)?\s+/, '').split('_')[0].trim() || label;
  return [`${name}要点`, `${name}应用`];
}

/** 语文、英语不按知识点勾选；数学、科学、地理、生物在最后一级下展示知识点。 */
export function assessmentShowsKnowledgePoints(subject?: SubjectType) {
  return subject !== '语文' && subject !== '英语';
}

export function collectAssessmentLeaves(node: AssessmentCatalogNode): AssessmentCatalogNode[] {
  if (!node.children.length) return [node];
  return node.children.flatMap(collectAssessmentLeaves);
}

function knowledgePointId(sectionId: string, point: string) {
  return `${sectionId}::kp::${point}`;
}

function knowledgePointIdsOf(section: AssessmentCatalogNode) {
  return section.knowledgePoints.map((point) => knowledgePointId(section.id, point));
}

function leafSelectionIds(section: AssessmentCatalogNode, byKnowledgePoint: boolean) {
  return byKnowledgePoint && section.knowledgePoints.length > 0
    ? knowledgePointIdsOf(section)
    : [section.id];
}

function collectLeafSelectionIds(node: AssessmentCatalogNode, byKnowledgePoint: boolean) {
  return collectAssessmentLeaves(node).flatMap((section) => leafSelectionIds(section, byKnowledgePoint));
}

function CheckMark({ active, partial }: { active: boolean; partial?: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border ${
        active || partial ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white'
      }`}
    >
      {active ? <Check size={11} className="text-white" strokeWidth={3.2} /> : null}
      {!active && partial ? <span className="h-0.5 w-2 rounded-full bg-white" /> : null}
    </span>
  );
}

export function AssessmentConfigPage({
  catalog,
  onBack,
  onStart,
  switchLabel,
  onSwitch,
  contextLabel,
  subject,
  textbook,
  subjects,
  onSubjectChange,
  catalogAnnotationId = 'subject.sync.textbook-assessment',
  startAnnotationId = 'subject.sync.textbook-assessment',
  switchAnnotationId,
  subjectAnnotationId = 'dashboard.afterclass-practice.subject',
  initialSectionIds,
}: {
  catalog: AssessmentCatalogNode[];
  onBack: () => void;
  onStart: (sectionIds: string[]) => void;
  switchLabel?: string;
  onSwitch?: (selectedSectionIds: string[]) => void;
  contextLabel?: string;
  subject?: SubjectType;
  textbook?: string;
  subjects?: SubjectType[];
  onSubjectChange?: (subject: SubjectType) => void;
  catalogAnnotationId?: string;
  startAnnotationId?: string;
  switchAnnotationId?: string;
  subjectAnnotationId?: string;
  initialSectionIds?: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSectionIds || []));
  const [setupOpen, setSetupOpen] = useState(false);
  const showSubjectPicker = Boolean(subjects?.length && onSubjectChange);
  const showKnowledgePoints = assessmentShowsKnowledgePoints(subject);

  useEffect(() => {
    const leaves = catalog.flatMap((chapter) => collectAssessmentLeaves(chapter));
    const validIds = new Set(leaves.flatMap((section) => leafSelectionIds(section, showKnowledgePoints)));
    const sectionById = new Map(leaves.map((section) => [section.id, section]));
    setSelectedIds((previous) => {
      const next = new Set<string>();
      previous.forEach((id) => {
        if (validIds.has(id)) {
          next.add(id);
          return;
        }
        const section = sectionById.get(id);
        if (section) {
          leafSelectionIds(section, showKnowledgePoints).forEach((leafId) => next.add(leafId));
        }
      });
      if (next.size === previous.size && Array.from(previous).every((id) => next.has(id))) return previous;
      return next;
    });
  }, [catalog, showKnowledgePoints]);

  const selectedSections = useMemo(
    () =>
      catalog.flatMap((chapter) => collectAssessmentLeaves(chapter)).filter((section) => {
        const ids = leafSelectionIds(section, showKnowledgePoints);
        return ids.some((id) => selectedIds.has(id));
      }),
    [catalog, selectedIds, showKnowledgePoints]
  );
  const knowledgeCount = selectedSections.reduce(
    (sum, section) =>
      sum +
      section.knowledgePoints.filter((point) => selectedIds.has(knowledgePointId(section.id, point))).length,
    0
  );
  const chapterCount = catalog.filter((chapter) =>
    collectAssessmentLeaves(chapter).some((section) => selectedSections.some((item) => item.id === section.id))
  ).length;
  const selectedCount = showKnowledgePoints ? knowledgeCount || selectedSections.length : selectedIds.size;
  const recommendedCount = (showKnowledgePoints ? knowledgeCount || selectedSections.length : selectedCount) * 2;
  const selectedSectionIds = selectedSections.map((section) => section.id);
  const selectionSummary =
    selectedCount > 0
      ? showKnowledgePoints
        ? `已选 ${knowledgeCount} 个知识点 · ${chapterCount} 章 · 推荐 ${recommendedCount} 题`
        : `已选 ${selectedCount} 个课时 · ${chapterCount} 章 · 推荐 ${recommendedCount} 题`
      : '请选择章节';

  const toggleIds = (ids: string[]) => {
    if (!ids.length) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      const fullySelected = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (fullySelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const toggleSection = (section: AssessmentCatalogNode) => {
    toggleIds(leafSelectionIds(section, showKnowledgePoints));
  };

  const toggleKnowledgePoint = (sectionId: string, point: string) => {
    toggleIds([knowledgePointId(sectionId, point)]);
  };

  const toggleChapter = (chapter: AssessmentCatalogNode) => {
    toggleIds(collectLeafSelectionIds(chapter, showKnowledgePoints));
  };

  const contextText = useMemo(() => {
    if (contextLabel) return contextLabel;
    const stage = `${STUDENT_STUDY_CONTEXT.stage}${STUDENT_STUDY_CONTEXT.grade} · ${STUDENT_STUDY_CONTEXT.schoolSystem} · ${STUDENT_STUDY_CONTEXT.term}`;
    return textbook ? `${stage} · ${textbook}` : stage;
  }, [contextLabel, textbook]);

  const switchButton =
    switchLabel && onSwitch ? (
      <button
        type="button"
            onClick={() => onSwitch?.(selectedSectionIds)}
        className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-bold text-teal-700 hover:bg-teal-100 active:scale-95"
      >
        {switchLabel}
      </button>
    ) : null;

  const catalogList = (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
      <p className="mb-2.5 truncate text-[12px] font-semibold text-slate-400">{contextText}</p>
      <div className="space-y-2.5">
        {catalog.map((chapter) => {
          const leaves = collectAssessmentLeaves(chapter);
          const leafIds = collectLeafSelectionIds(chapter, showKnowledgePoints);
          const selectedLeafCount = leafIds.filter((id) => selectedIds.has(id)).length;
          const allSelected = leafIds.length > 0 && selectedLeafCount === leafIds.length;
          const partialSelected = selectedLeafCount > 0 && !allSelected;
          const canSelectChapter = chapter.children.length > 0;
          const chapterIsLeaf = !canSelectChapter;

          return (
            <div
              key={chapter.id}
              className={`rounded-[22px] border bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ${
                allSelected
                  ? 'border-teal-300 ring-2 ring-teal-100'
                  : partialSelected
                    ? 'border-teal-200'
                    : 'border-slate-200'
              }`}
            >
              {chapterIsLeaf ? (
                <button
                  type="button"
                  onClick={() => toggleSection(chapter)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-1 py-1 text-left ${
                    allSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <CheckMark active={allSelected} />
                  <span className="min-w-0 flex-1 text-[13px] font-black text-slate-800">{chapter.label}</span>
                </button>
              ) : (
                <>
              {canSelectChapter ? (
                <button
                  type="button"
                  onClick={() => toggleChapter(chapter)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-1 py-1 text-left"
                >
                  <CheckMark active={allSelected} partial={partialSelected} />
                  <span className="min-w-0 flex-1 text-[13px] font-black text-slate-800">{chapter.label}</span>
                  <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                    {showKnowledgePoints
                      ? `${selectedLeafCount}/${leafIds.length}`
                      : `${leaves.filter((section) => selectedIds.has(section.id)).length}/${leaves.length}`}
                  </span>
                </button>
              ) : (
                <p className="px-1 py-1 text-[13px] font-black text-slate-800">{chapter.label}</p>
              )}

              <div className={canSelectChapter ? 'mt-1.5 space-y-0.5 pl-7' : 'mt-1.5 space-y-0.5'}>
                {leaves.map((section) => {
                  const sectionLeafIds = leafSelectionIds(section, showKnowledgePoints);
                  const selectedInSection = sectionLeafIds.filter((id) => selectedIds.has(id)).length;
                  const active = sectionLeafIds.length > 0 && selectedInSection === sectionLeafIds.length;
                  const partial = selectedInSection > 0 && !active;
                  return (
                    <div key={section.id} className={`rounded-xl px-2 py-1.5 ${active ? 'bg-teal-50' : partial ? 'bg-teal-50/50' : ''}`}>
                      <button
                        type="button"
                        onClick={() => toggleSection(section)}
                        className="flex w-full items-start gap-2.5 rounded-lg text-left hover:bg-white/60"
                      >
                        <span className="mt-0.5">
                          <CheckMark active={active} partial={partial} />
                        </span>
                        <span
                          className={`min-w-0 flex-1 text-[12px] font-semibold leading-snug ${
                            active || partial ? 'text-teal-800' : 'text-slate-600'
                          }`}
                        >
                          {section.label}
                        </span>
                      </button>
                      {showKnowledgePoints && section.knowledgePoints.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1 pl-7">
                          {section.knowledgePoints.map((point) => {
                            const selected = selectedIds.has(knowledgePointId(section.id, point));
                            return (
                              <button
                                key={point}
                                type="button"
                                onClick={() => toggleKnowledgePoint(section.id, point)}
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                                  selected
                                    ? 'bg-teal-100 text-teal-800 ring-1 ring-teal-300'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {point}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#F6F3EE] text-slate-800">
      <header className="flex shrink-0 items-center gap-3 border-b border-amber-900/8 bg-white/70 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white bg-white text-slate-600 shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[18px] font-black text-slate-900">精准练习</h1>
        <span className="min-w-0 flex-1" />
        {switchButton ? (
          switchAnnotationId ? (
            <Annotatable annotationId={switchAnnotationId} className="ml-auto shrink-0">
              {switchButton}
            </Annotatable>
          ) : (
            <div className="ml-auto shrink-0">{switchButton}</div>
          )
        ) : null}
      </header>

      {showSubjectPicker ? (
        <div className="grid min-h-0 flex-1 grid-cols-[168px_minmax(0,1fr)]">
          <Annotatable annotationId={subjectAnnotationId} className="min-h-0">
            <aside className="flex h-full min-h-0 flex-col border-r border-amber-900/8 bg-white/45 px-3 py-3">
              <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                {subjects!.map((item) => {
                  const active = subject === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onSubjectChange?.(item)}
                      className={`flex h-11 w-full items-center rounded-2xl px-3 text-left text-[13px] font-black transition-colors ${
                        active
                          ? 'bg-teal-600 text-white shadow-[0_8px_18px_rgba(13,148,136,0.28)]'
                          : 'bg-white/80 text-slate-600 hover:bg-white'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </aside>
          </Annotatable>

          <section className="flex min-h-0 flex-col">
            <Annotatable annotationId={catalogAnnotationId} className="flex min-h-0 flex-1">
              {catalogList}
            </Annotatable>
          </section>
        </div>
      ) : (
        <Annotatable annotationId={catalogAnnotationId} className="flex min-h-0 flex-1">
          {catalogList}
        </Annotatable>
      )}

      <Annotatable annotationId={startAnnotationId} className="shrink-0">
        <footer className="flex shrink-0 items-center gap-3 border-t border-amber-900/8 bg-white/80 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-slate-700">{selectionSummary}</p>
            {selectedCount > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="mt-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
              >
                清空选择
              </button>
            ) : null}
          </div>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => setSetupOpen(true)}
            className="flex h-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 px-6 text-[14px] font-black text-white shadow-[0_10px_24px_rgba(13,148,136,0.28)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            开始精准练习
          </button>
        </footer>
      </Annotatable>

      <PracticeSetupModal
        open={setupOpen}
        recommendedCount={recommendedCount}
        annotationId="dashboard.afterclass-assessment.setup"
        onClose={() => setSetupOpen(false)}
        onConfirm={() => {
          setSetupOpen(false);
          onStart(selectedSectionIds);
        }}
      />
    </div>
  );
}
