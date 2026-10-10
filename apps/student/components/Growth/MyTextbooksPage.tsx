import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Atom,
  Calculator,
  Check,
  ChevronDown,
  Compass,
  FlaskConical,
  Landmark,
  Languages,
  Leaf,
  Microscope,
  PenLine,
  Pencil,
  Scale,
  X,
  type LucideIcon,
} from 'lucide-react';
import { displaySubjectName, getGradeSubjects } from '../../data/subjectCatalog';
import { isJuniorGrade, type UiSchoolSystem } from '../../data/juniorDemoCatalog';
import { getAvailableTextbookVersions, resolveTextbookVersion, saveTextbookVersion } from '../../services/textbookVersionStore';

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级'];
const TERMS = ['上册', '下册'];
const SYSTEMS: UiSchoolSystem[] = ['六三制', '五四制'];

const displayTerm = (term: string) =>
  term === '上册' ? '上学期' : term === '下册' ? '下学期' : term;

const SUBJECT_ICONS: Record<string, { icon: LucideIcon; wrap: string; ink: string }> = {
  语文: { icon: PenLine, wrap: 'bg-rose-50', ink: 'text-rose-500' },
  数学: { icon: Calculator, wrap: 'bg-indigo-50', ink: 'text-indigo-500' },
  英语: { icon: Languages, wrap: 'bg-sky-50', ink: 'text-sky-500' },
  物理: { icon: Atom, wrap: 'bg-violet-50', ink: 'text-violet-500' },
  化学: { icon: FlaskConical, wrap: 'bg-amber-50', ink: 'text-amber-600' },
  道德与法治: { icon: Scale, wrap: 'bg-orange-50', ink: 'text-orange-500' },
  历史: { icon: Landmark, wrap: 'bg-stone-100', ink: 'text-stone-600' },
  生物: { icon: Leaf, wrap: 'bg-emerald-50', ink: 'text-emerald-600' },
  地理: { icon: Compass, wrap: 'bg-teal-50', ink: 'text-teal-600' },
  科学: { icon: Microscope, wrap: 'bg-cyan-50', ink: 'text-cyan-600' },
};

const subjectVisual = (subject: string) =>
  SUBJECT_ICONS[subject] ?? SUBJECT_ICONS.语文;

type OpenMenu =
  | { type: 'system' }
  | { type: 'grade' }
  | { type: 'term' }
  | { type: 'version'; subject: string };

interface MyTextbooksPageProps {
  grade: string;
  term: string;
  schoolSystem: UiSchoolSystem;
  onGradeChange: (grade: string) => void;
  onTermChange: (term: string) => void;
  onSchoolSystemChange: (system: UiSchoolSystem) => void;
  onAcademicContextChange?: (context: { grade: string; term: string; schoolSystem: UiSchoolSystem }) => void;
  onVersionChange?: () => void;
  onBack: () => void;
}

export const MyTextbooksPage: React.FC<MyTextbooksPageProps> = ({
  grade,
  term,
  schoolSystem,
  onGradeChange,
  onTermChange,
  onSchoolSystemChange,
  onAcademicContextChange,
  onVersionChange,
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftContext, setDraftContext] = useState({ grade, term, schoolSystem });
  const [draftVersions, setDraftVersions] = useState<Record<string, string>>({});
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ left: number; top: number; width: number } | null>(null);
  const [versionTick, setVersionTick] = useState(0);
  const fieldRefs = useRef<Record<'system' | 'grade' | 'term', HTMLButtonElement | null>>({
    system: null,
    grade: null,
    term: null,
  });
  const activeContext = isEditing ? draftContext : { grade, term, schoolSystem };
  const subjects = useMemo(
    () => getGradeSubjects(activeContext.grade, activeContext.schoolSystem),
    [activeContext.grade, activeContext.schoolSystem],
  );
  const sortedGrades = GRADES;
  const selectedGradeRef = useRef<HTMLButtonElement | null>(null);
  const expandedSubject = openMenu?.type === 'version' ? openMenu.subject : null;
  const isVersionMenu = openMenu?.type === 'version';
  const isFieldMenu = openMenu != null && openMenu.type !== 'version';

  useEffect(() => {
    if (openMenu?.type === 'grade' && selectedGradeRef.current) {
      selectedGradeRef.current.scrollIntoView({ block: 'center' });
    }
  }, [openMenu]);

  const textbooks = useMemo(
    () => subjects.map((subject) => {
      const versions = getAvailableTextbookVersions(
        subject,
        activeContext.grade,
        activeContext.term,
        activeContext.schoolSystem,
      );
      return {
        subject,
        versions,
        current: versions.length
          ? draftVersions[subject] && versions.includes(draftVersions[subject])
            ? draftVersions[subject]
            : resolveTextbookVersion(subject, versions, activeContext.schoolSystem)
          : '',
      };
    }),
    [subjects, activeContext, draftVersions, versionTick],
  );

  const selectedTextbook = textbooks.find((item) => item.subject === expandedSubject);

  const closeMenu = () => {
    setOpenMenu(null);
    setPopoverAnchor(null);
  };

  const discardDraft = () => {
    closeMenu();
    setIsEditing(false);
    setDraftVersions({});
    setLeaveDialogOpen(false);
  };

  const hasUnsavedChanges =
    draftContext.grade !== grade ||
    draftContext.term !== term ||
    draftContext.schoolSystem !== schoolSystem ||
    Object.entries(draftVersions).some(([subject, version]) => {
      const versions = getAvailableTextbookVersions(subject, grade, term, schoolSystem);
      return version !== resolveTextbookVersion(subject, versions, schoolSystem);
    });

  const saveDraft = () => {
    const contextChanged =
      draftContext.grade !== grade ||
      draftContext.term !== term ||
      draftContext.schoolSystem !== schoolSystem;
    if (contextChanged) {
      if (onAcademicContextChange) {
        onAcademicContextChange(draftContext);
      } else {
        if (draftContext.schoolSystem !== schoolSystem) onSchoolSystemChange(draftContext.schoolSystem);
        if (draftContext.grade !== grade) onGradeChange(draftContext.grade);
        if (draftContext.term !== term) onTermChange(draftContext.term);
      }
    }
    const validDraftVersions = Object.entries(draftVersions).filter(([subject, version]) =>
      getAvailableTextbookVersions(
        subject,
        draftContext.grade,
        draftContext.term,
        draftContext.schoolSystem,
      ).includes(version),
    );
    if (validDraftVersions.length) {
      validDraftVersions.forEach(([subject, version]) => saveTextbookVersion(subject, version));
      setVersionTick((value) => value + 1);
      onVersionChange?.();
    }
    discardDraft();
  };

  const beginEditing = () => {
    setDraftContext({ grade, term, schoolSystem });
    setDraftVersions({});
    setIsEditing(true);
  };

  const requestBack = () => {
    closeMenu();
    if (isEditing && hasUnsavedChanges) {
      setLeaveDialogOpen(true);
      return;
    }
    discardDraft();
    onBack();
  };

  const getCardAnchor = (element: HTMLElement, popoverWidth = 220, popoverHeight = 220) => {
    const viewport = document.getElementById('app-viewport');
    const viewportRect = viewport?.getBoundingClientRect();
    if (!viewport || !viewportRect) return null;
    const rect = element.getBoundingClientRect();
    const scaleX = viewportRect.width / viewport.offsetWidth;
    const scaleY = viewportRect.height / viewport.offsetHeight;
    const pad = 12;
    const rawLeft = (rect.left - viewportRect.left) / scaleX + (rect.width / scaleX - popoverWidth) / 2;
    const below = (rect.bottom - viewportRect.top) / scaleY + 8;
    const above = (rect.top - viewportRect.top) / scaleY - popoverHeight - 8;
    const maxLeft = Math.max(pad, viewport.offsetWidth - popoverWidth - pad);
    const top = below + popoverHeight > viewport.offsetHeight - pad ? Math.max(pad, above) : below;
    return {
      left: Math.min(Math.max(rawLeft, pad), maxLeft),
      top,
      width: popoverWidth,
    };
  };

  const openFieldMenu = (type: 'system' | 'grade' | 'term') => {
    if (openMenu?.type === type) {
      closeMenu();
      return;
    }
    const button = fieldRefs.current[type];
    const height = type === 'grade' ? 320 : 160;
    if (button) setPopoverAnchor(getCardAnchor(button, 200, height));
    setOpenMenu({ type });
  };

  const openVersionPicker = (subject: string) => {
    if (!isEditing) return;
    if (openMenu?.type === 'version' && openMenu.subject === subject) {
      closeMenu();
      return;
    }
    setPopoverAnchor(null);
    setOpenMenu({ type: 'version', subject });
  };

  const selectVersion = (subject: string, version: string) => {
    setDraftVersions((previous) => ({ ...previous, [subject]: version }));
    closeMenu();
  };

  const selectSystem = (system: UiSchoolSystem) => {
    setDraftContext((previous) => ({
      ...previous,
      schoolSystem: system,
      grade: isJuniorGrade(previous.grade, system)
        ? previous.grade
        : system === '五四制'
          ? '六年级'
          : '七年级',
    }));
    closeMenu();
  };

  const selectGrade = (item: string) => {
    setDraftContext((previous) => ({ ...previous, grade: item }));
    closeMenu();
  };

  const selectTerm = (item: string) => {
    setDraftContext((previous) => ({ ...previous, term: item }));
    closeMenu();
  };

  const fieldTriggerClass = (open: boolean) =>
    `inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[12px] font-semibold leading-none transition ${
      open
        ? 'border-indigo-400 bg-indigo-50 text-indigo-600 shadow-[0_4px_10px_rgba(99,102,241,0.12)]'
        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-600'
    }`;

  const optionClass = (active: boolean, disabled = false) =>
    `flex h-9 w-full items-center justify-between rounded-xl px-3 text-left text-[13px] font-semibold transition ${
      disabled
        ? 'cursor-not-allowed bg-slate-50 text-slate-300'
        : active
          ? 'bg-indigo-500 text-white'
          : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F5F7FA]">
      <header className="shrink-0 border-b border-indigo-100 bg-white px-5 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={requestBack}
            aria-label="返回"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold text-slate-900">我的课本</h1>
            <p className="truncate text-[11px] text-slate-400">
              {`${activeContext.grade} · ${displayTerm(activeContext.term)} · ${activeContext.schoolSystem}`}
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-5 py-4">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(99,102,241,0.05)]">
          <div className="mb-3 flex shrink-0 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-[13px] font-semibold text-slate-800">本学期课本</h2>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-500">
                {textbooks.length} 科
              </span>
            </div>
            {isEditing ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <button
                  ref={(node) => {
                    fieldRefs.current.system = node;
                  }}
                  type="button"
                  aria-expanded={openMenu?.type === 'system'}
                  aria-haspopup="dialog"
                  aria-label={`学制，当前${activeContext.schoolSystem}`}
                  onClick={() => openFieldMenu('system')}
                  className={fieldTriggerClass(openMenu?.type === 'system')}
                >
                  <span className="text-[10px] font-medium text-slate-400">学制</span>
                  {activeContext.schoolSystem}
                  <ChevronDown size={12} className={`shrink-0 opacity-70 transition-transform ${openMenu?.type === 'system' ? 'rotate-180' : ''}`} />
                </button>
                <button
                  ref={(node) => {
                    fieldRefs.current.grade = node;
                  }}
                  type="button"
                  aria-expanded={openMenu?.type === 'grade'}
                  aria-haspopup="dialog"
                  aria-label={`年级，当前${activeContext.grade}`}
                  onClick={() => openFieldMenu('grade')}
                  className={fieldTriggerClass(openMenu?.type === 'grade')}
                >
                  <span className="text-[10px] font-medium text-slate-400">年级</span>
                  {activeContext.grade}
                  <ChevronDown size={12} className={`shrink-0 opacity-70 transition-transform ${openMenu?.type === 'grade' ? 'rotate-180' : ''}`} />
                </button>
                <button
                  ref={(node) => {
                    fieldRefs.current.term = node;
                  }}
                  type="button"
                  aria-expanded={openMenu?.type === 'term'}
                  aria-haspopup="dialog"
                  aria-label={`学期，当前${displayTerm(activeContext.term)}`}
                  onClick={() => openFieldMenu('term')}
                  className={fieldTriggerClass(openMenu?.type === 'term')}
                >
                  <span className="text-[10px] font-medium text-slate-400">学期</span>
                  {displayTerm(activeContext.term)}
                  <ChevronDown size={12} className={`shrink-0 opacity-70 transition-transform ${openMenu?.type === 'term' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ) : (
              <p className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                {`${schoolSystem} · ${grade} · ${displayTerm(term)}`}
              </p>
            )}
            <button
              type="button"
              onClick={() => (isEditing ? saveDraft() : beginEditing())}
              className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12px] font-semibold transition ${
                isEditing
                  ? 'bg-indigo-500 text-white shadow-[0_4px_10px_rgba(99,102,241,0.28)]'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {isEditing ? <Check size={13} strokeWidth={2.5} /> : <Pencil size={13} strokeWidth={2.25} />}
              {isEditing ? '完成' : '编辑'}
            </button>
          </div>

          <div
            className="grid min-h-0 flex-1 grid-cols-4 gap-2.5"
            style={{ gridTemplateRows: `repeat(${Math.max(1, Math.ceil(textbooks.length / 4))}, minmax(0, 1fr))` }}
          >
            {textbooks.map((item) => {
              const expanded = expandedSubject === item.subject;
              const visual = subjectVisual(item.subject);
              const Icon = visual.icon;
              const hasBook = item.versions.length > 0;
              return (
                <button
                  key={item.subject}
                  type="button"
                  disabled={!isEditing || !hasBook}
                  aria-expanded={expanded}
                  aria-haspopup={isEditing && hasBook ? 'dialog' : undefined}
                  aria-label={
                    !hasBook
                      ? `${displaySubjectName(item.subject)}，当前学制年级学期暂无课本`
                      : isEditing
                        ? `${displaySubjectName(item.subject)}，当前${item.current}，点击切换教材版本`
                        : `${displaySubjectName(item.subject)}，当前${item.current}`
                  }
                  onClick={() => {
                    if (hasBook) openVersionPicker(item.subject);
                  }}
                  className={`relative flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 rounded-2xl border px-2 text-center transition ${
                    !isEditing || !hasBook
                      ? 'cursor-default border-slate-100 bg-slate-50/80'
                      : expanded
                        ? 'border-indigo-400 bg-indigo-50 shadow-[0_6px_16px_rgba(99,102,241,0.12)]'
                        : 'border-slate-100 bg-slate-50/80 hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${visual.wrap} ${visual.ink}`}>
                    <Icon size={16} />
                  </span>
                  <span className="text-[13px] font-semibold leading-none text-slate-800">{displaySubjectName(item.subject)}</span>
                  <span className={`inline-flex max-w-full items-center gap-0.5 leading-none ${expanded ? 'text-indigo-500' : 'text-slate-400'}`}>
                    <span className="truncate text-[11px]">{hasBook ? item.current : '暂无课本'}</span>
                    {isEditing && hasBook && (
                      <ChevronDown size={12} className={`shrink-0 opacity-80 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        </div>
      </div>

      {isVersionMenu && selectedTextbook && createPortal(
        <>
          <div
            className="absolute inset-0 z-[980] bg-slate-950/30"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`选择${displaySubjectName(selectedTextbook.subject)}教材版本`}
            className="absolute inset-x-0 bottom-0 z-[990] flex max-h-[72%] flex-col overflow-hidden rounded-t-[28px] border border-indigo-100 bg-white shadow-[0_-18px_40px_rgba(67,56,202,0.16)]"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-slate-900">
                  选择{displaySubjectName(selectedTextbook.subject)}教材版本
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭"
                onClick={closeMenu}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {selectedTextbook.versions.length ? (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {selectedTextbook.versions.map((version) => {
                    const active = selectedTextbook.current === version;
                    return (
                      <button
                        key={version}
                        type="button"
                        onClick={() => selectVersion(selectedTextbook.subject, version)}
                        className={optionClass(active)}
                      >
                        <span className="truncate">{version}</span>
                        {active && <Check size={14} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="px-1 py-6 text-center text-[12px] leading-5 text-slate-400">
                  当前学制、年级、学期暂无课本
                </p>
              )}
              {selectedTextbook.versions.length === 1 && (
                <p className="mt-3 px-1 text-center text-[11px] text-slate-400">当前年级学期仅此版本</p>
              )}
            </div>
          </div>
        </>,
        document.getElementById('app-viewport') || document.body,
      )}

      {isFieldMenu && popoverAnchor && createPortal(
        <>
          <div
            className="absolute inset-0 z-[980] bg-slate-950/25"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label={
              openMenu.type === 'system'
                ? '选择学制'
                : openMenu.type === 'grade'
                  ? '选择年级'
                  : '选择学期'
            }
            style={{ left: popoverAnchor.left, top: popoverAnchor.top, width: popoverAnchor.width }}
            className="absolute z-[990] overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_18px_40px_rgba(67,56,202,0.16)]"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-700">
                {openMenu.type === 'system'
                  ? '学制'
                  : openMenu.type === 'grade'
                    ? '年级'
                    : '学期'}
              </span>
              <button
                type="button"
                aria-label="关闭"
                onClick={closeMenu}
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={14} strokeWidth={2.25} />
              </button>
            </div>
            <div className={`${openMenu.type === 'grade' ? 'max-h-[280px]' : 'max-h-[200px]'} overflow-y-auto p-2`}>
              {openMenu.type === 'system' && (
                <div className="flex flex-col gap-1">
                  {SYSTEMS.map((system) => (
                    <button
                      key={system}
                      type="button"
                      onClick={() => selectSystem(system)}
                      className={optionClass(activeContext.schoolSystem === system)}
                    >
                      <span>{system}</span>
                      {activeContext.schoolSystem === system && <Check size={14} strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              )}
              {openMenu.type === 'term' && (
                <div className="flex flex-col gap-1">
                  {TERMS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selectTerm(item)}
                      className={optionClass(activeContext.term === item)}
                    >
                      <span>{displayTerm(item)}</span>
                      {activeContext.term === item && <Check size={14} strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              )}
              {openMenu.type === 'grade' && (
                <div className="flex flex-col gap-1">
                  {sortedGrades.map((item) => {
                    const active = item === activeContext.grade;
                    return (
                      <button
                        key={item}
                        ref={active ? (node) => {
                          selectedGradeRef.current = node;
                        } : undefined}
                        type="button"
                        onClick={() => selectGrade(item)}
                        className={optionClass(active)}
                      >
                        <span>{item}</span>
                        {active && <Check size={14} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>,
        document.getElementById('app-viewport') || document.body,
      )}

      {createPortal(
        <AnimatePresence>
          {leaveDialogOpen && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center px-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                aria-hidden="true"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="unsaved-textbook-changes-title"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className="relative z-10 w-full max-w-[360px] rounded-3xl border border-white/80 bg-white p-5 text-center shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
              >
                <h2 id="unsaved-textbook-changes-title" className="text-[17px] font-semibold text-slate-900">课本修改未保存</h2>
                <p className="mt-2 text-[13px] leading-5 text-slate-500">保存后再离开吗？</p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      discardDraft();
                      onBack();
                    }}
                    className="h-11 flex-1 rounded-2xl bg-slate-100 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    不保存
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveDraft();
                      onBack();
                    }}
                    className="h-11 flex-1 rounded-2xl bg-indigo-500 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(99,102,241,0.25)] transition hover:bg-indigo-600"
                  >
                    保存并离开
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById('app-viewport') || document.body,
      )}
    </div>
  );
};
