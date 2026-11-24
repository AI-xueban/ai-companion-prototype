import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X, Check } from 'lucide-react';
import { SubjectMap as ThemeLearning, type ExpeditionScreen } from './SubjectMap';
import { loadAcademicContext } from '../../services/academicContextStore';
import { getAvailableTextbookVersions, resolveTextbookVersion } from '../../services/textbookVersionStore';
import './bookKnowledgeLearning.css';
import { KnowledgeTracePage } from './KnowledgeTracePage';
import { PointLearningCard } from './PointLearningCard';
import { hasPointPredecessor, type TracePoint } from './pointTrace';
import { BookBranchGraph } from './BookBranchGraph';
import { buildBookGraph, type Point, type Catalog } from './bookLearningGraph';
import { VideoLesson } from '../Learning/VideoLesson';
import { QuizPage } from '../Quiz/QuizPage';
import { DailyConquerModal } from '../MistakeVault/DailyConquerModal';
import { getMistakeVaultData } from '../../services/geminiService';
import { selectPointMistakes, recordPointCorrections, registerPointMistakes } from '../../services/knowledgePointMistakes';
import type { MistakeItem } from '../../types';
import { getBookPointResource } from '../../data/bookKnowledgeResources';
import { readBookPointProgress, writeBookPointProgress, getPointHealth, applyPointPractice } from '../../services/bookKnowledgeProgress';
import { KG_SCOPE_MICRO_LESSON, sectionPracticeQuizFields } from '../../utils/kgMicroLesson';
import type { Task } from '../../types';
import type { RewardGrantResult } from '../../types/reward';

export type { ExpeditionScreen };
type Book = { id: string; name: string; edition: string; grade: string; term: string; children: Catalog[] };
type Props = React.ComponentProps<typeof ThemeLearning> & { onKnowledgeReward?: (result: RewardGrantResult) => void };
const loaders = import.meta.glob(['../../data/learning-books/*.json', '../../data/learning-books/grade7-first-term/*.json']);
const codes: Record<string, string> = { 数学: 'math', 语文: 'chinese', 英语: 'english', 物理: 'physics', 化学: 'chemistry', 生物: 'bio', 地理: 'geography', 历史: 'history', 道德与法治: 'politics', 科学: 'science' };
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const firstLeaf = (nodes: Catalog[]): Catalog | undefined => {
  for (const node of nodes) {
    if (node.children.length) return node.children[0];
    return node;
  }
};
const findPath = (nodes: Catalog[], id: string, path: Catalog[] = []): Catalog[] => {
  for (const node of nodes) {
    if (node.id === id) return [...path, node];
    const found = findPath(node.children, id, [...path, node]);
    if (found.length) return found;
  }
  return [];
};

export function SubjectMap(props: Props) {
  const [view, setView] = useState<'map' | 'theme'>('map');
  const [themeVisited, setThemeVisited] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [leaf, setLeaf] = useState<Catalog | null>(null);
  const [point, setPoint] = useState<Point | null>(null);
  const [vaultItems, setVaultItems] = useState<MistakeItem[]>([]);
  const [correction, setCorrection] = useState<{ point: Point; context: string; items: MistakeItem[] } | null>(null);
  const [traceOrigin, setTraceOrigin] = useState<Point | null>(null);
  const [traceSelection, setTraceSelection] = useState<Point | null>(null);
  const [traceIndex, setTraceIndex] = useState<Record<string, Record<string, TracePoint>>>({});
  useEffect(() => {
    let cancelled = false;
    import('../../data/learning-books/point-trace-index.json').then(module => {
      if (!cancelled) setTraceIndex(module.default as Record<string, Record<string, TracePoint>>);
    }).catch(() => { /* No point data means no trace entry. */ });
    return () => { cancelled = true; };
  }, []);
  const [commonTypes, setCommonTypes] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [progressRevision, updateProgress] = useState(0);
  const [session, setSession] = useState<{ point: Point; context: string; resource: NonNullable<ReturnType<typeof getBookPointResource>>; phase: 'video' | 'quiz'; task: Task } | null>(null);
  const [chapterDifficulties, setChapterDifficulties] = useState<Record<string, '基础' | '进阶' | '拓展'>>({});
  const difficultyDialog = useRef<HTMLDialogElement>(null);
  const lastSignal = useRef(props.learningSessionSignal);
  const academic = loadAcademicContext();
  const version = resolveTextbookVersion(props.activeSubject, getAvailableTextbookVersions(props.activeSubject, academic.grade, academic.term, academic.schoolSystem), academic.schoolSystem);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setBook(null); setLeaf(null); setPoint(null); setCommonTypes({}); setError('');
    const code = codes[props.activeSubject];
    const elementary = grades.includes(academic.grade) && !(academic.grade === '六年级' && academic.schoolSystem === '五四制');
    const key = `${code}${elementary ? '3' : ''}`;
    const grade7FirstTerm = academic.grade === '七年级' && academic.term === '上册';
    const loader = (grade7FirstTerm ? loaders[`../../data/learning-books/grade7-first-term/${key}.json`] : undefined)
      ?? loaders[`../../data/learning-books/${key}.json`];
    (async () => {
      if (!loader) return;
      const [bookModule, typeModule] = await Promise.all([loader(), import('../../data/learning-books/common-question-types.json')]);
      const { default: books } = bookModule as { default: Book[] };
      const allTypes = typeModule.default as Record<string, Record<string, string[]>>;
      if (cancelled) return;
      const term = academic.term.includes('下') ? '下' : '上';
      const publisher = (edition: string) => edition.replace(/[（(]\d{4}[）)]/g, '').replace(/^部编版/, '统编版');
      // These unified textbooks are labeled 人教版 in the shared settings.
      const unifiedSubject = ['语文', '历史', '道德与法治'].includes(props.activeSubject);
      const graphPublisher = unifiedSubject && version === '人教版' ? '统编版' : publisher(version);
      const candidates = books.filter(b => b.grade === academic.grade && b.term.includes(term) && (
        grade7FirstTerm ? publisher(b.edition) === graphPublisher : b.edition.replace(/（.*?）|\(.*?\)/g, '') === version
      ));
      // The shared textbook setting identifies the publisher; use its 2024 edition for this graph preview.
      const match = candidates.find(b => b.edition === version && /2024/.test(version))
        ?? ((version === '北师大版' || (grade7FirstTerm && props.activeSubject === '语文'))
          ? candidates.find(b => /[（(]2024[）)]/.test(b.edition)) : undefined)
        ?? candidates[0];
      setBook(match ?? null); setCommonTypes(allTypes[key] ?? {});
      const firstMappedSection = grade7FirstTerm && match
        ? match.children.flatMap(chapter => chapter.children.length ? chapter.children : [chapter])
          .find(section => buildBookGraph(section).length > 0)
        : undefined;
      const initial = firstMappedSection ?? (match ? firstLeaf(match.children) : undefined);
      setLeaf(initial ?? null); setPoint(null);
    })().catch(() => { if (!cancelled) setError('教材目录加载失败，请重试'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [props.activeSubject, academic.grade, academic.term, academic.schoolSystem, version, retry]);

  useEffect(() => {
    if (props.learningSessionSignal !== lastSignal.current) {
      lastSignal.current = props.learningSessionSignal;
      setView('theme'); setThemeVisited(true);
    }
  }, [props.learningSessionSignal]);

  const changeView = (next: 'map' | 'theme') => {
    setView(next);
    if (next === 'theme') setThemeVisited(true);
    else props.onExpeditionScreenChange?.('main');
  };
  const groups = leaf ? buildBookGraph(leaf) : [];
  const points = groups.flatMap(g => g.points);
  const context = `${props.activeSubject}|${academic.schoolSystem}|${book?.id}|${version}|${academic.grade}|${academic.term}`;
  useEffect(() => {
    let cancelled = false;
    const activePoint = traceSelection ?? point;
    if (activePoint) {
      const resource = getBookPointResource(props.activeSubject, activePoint);
      if (!resource.simulated) registerPointMistakes(props.activeSubject, activePoint.name, resource.questions, readBookPointProgress(context, activePoint.id).questionStates);
    }
    getMistakeVaultData().then(data => { if (!cancelled) setVaultItems(data.groups.flatMap(group => group.items)); });
    return () => { cancelled = true; };
  }, [context, point?.id, traceSelection?.id, progressRevision]);
  const difficultyScope = `${context}|${leaf?.id ?? ''}`;
  const difficulty = chapterDifficulties[difficultyScope] ?? '基础';
  const progress = Object.fromEntries(points.map(p => [p.id, readBookPointProgress(context, p.id)]));
  const health = Object.fromEntries(points.map(p => [p.id, getPointHealth(progress[p.id])]));
  const priority = ['weak', 'reviewing', 'exploring', 'unknown'];
  const recommended = priority.flatMap(status => points.filter(p => health[p.id].status === status))[0];
  const masteredCount = points.filter(p => health[p.id].status === 'mastered').length;
  const statuses = Object.fromEntries(points.map(p => [p.id, health[p.id].status]));
  const pointMistakes = point ? selectPointMistakes(vaultItems, props.activeSubject, point.name) : [];
  const selectedHealth = point ? health[point.id] : undefined;
  const traceSubjectCode = codes[props.activeSubject] + (grades.includes(academic.grade) && !(academic.grade === '六年级' && academic.schoolSystem === '五四制') ? '3' : '');
  const canTrace = (id: string) => hasPointPredecessor(traceIndex[traceSubjectCode] ?? {}, id);
  const openPoint = (p: Point, mode: 'video' | 'trace' = 'video') => {
    if (mode === 'trace') { if (!canTrace(p.id)) return; setTraceOrigin(p); setTraceSelection(p); return; }
    if (!traceOrigin) setPoint(p);
    const resource = getBookPointResource(props.activeSubject, p);

    const id = `book-knowledge-${book?.id}-${p.id}`;
    setSession({ point: p, context, resource, phase: 'video', task: {
      id, title: `${p.name} · 知识讲解`, subject: props.activeSubject, durationMinutes: 1, completed: false,
      aiReasoning: KG_SCOPE_MICRO_LESSON,
      sectionVideoPlaylist: { items: [{ id, title: `${p.name} · 知识讲解`, topicTitle: p.name, durationSec: 20 }], currentIndex: 0, scopeLabel: p.name },
      sectionPractice: { id: `${id}-practice`, title: `${p.name} · 知识点练习`, questionCount: resource.questions.length },
    } });
  };
  const closeSession = () => { setSession(null); setCorrection(null); props.onExpeditionScreenChange?.(traceOrigin ? 'textbook-video' : 'main'); };
  useEffect(() => {
    if (session || correction || traceOrigin) props.onExpeditionScreenChange?.('textbook-video');
  }, [Boolean(session || correction || traceOrigin), props.onExpeditionScreenChange]);
  const themeFullScreen = view === 'theme' && themeVisited;
  if (correction) return <DailyConquerModal items={correction.items} maxQuestions={correction.items.length} mode="batch" subjectLabel={props.activeSubject} onClose={closeSession} onComplete={() => {}} onRewardGranted={props.onKnowledgeReward} onSessionResult={result => {
    setVaultItems(recordPointCorrections(vaultItems, result.questions, result.sessionId));
    const previous = readBookPointProgress(correction.context, correction.point.id);
    writeBookPointProgress(correction.context, correction.point.id, applyPointPractice(previous, result));
    updateProgress(n => n + 1);
  }} />;
  if (session) return <div className="bkl-session">
    {session.phase === 'video' ? <VideoLesson key={session.task.id} task={session.task}
      knowledgePreview={{ title: session.point.name, steps: session.resource.steps }}
      onWatched={() => { writeBookPointProgress(session.context, session.point.id, { watched: true }); updateProgress(n => n + 1); }}
      onRewardGranted={props.onKnowledgeReward}
      onExit={closeSession} onComplete={() => setSession(old => old ? { ...old, phase: 'quiz' } : old)} /> :
      <QuizPage key={`${session.task.id}-quiz`} task={{ ...session.task, ...sectionPracticeQuizFields(), title: `${session.point.name} · ${session.resource.simulated ? '流程模拟练习' : '知识点练习'}`, questionCount: session.resource.questions.length }}
        overrideQuestions={session.resource.questions} onExit={closeSession} onRewardGranted={props.onKnowledgeReward}
        onSessionResult={result => {
          if (result.grantResult?.invalidLearning) return;
          const previous = readBookPointProgress(session.context, session.point.id);
          writeBookPointProgress(session.context, session.point.id, applyPointPractice(previous, result, session.resource.simulated));
          updateProgress(n => n + 1);
        }} />}
  </div>;
  if (traceOrigin) return <KnowledgeTracePage origin={traceOrigin} selected={traceSelection ?? traceOrigin} onSelect={setTraceSelection} context={context} subject={props.activeSubject} code={codes[props.activeSubject] + (grades.includes(academic.grade) && !(academic.grade === '六年级' && academic.schoolSystem === '五四制') ? '3' : '')} commonTypes={commonTypes} mistakes={vaultItems} onLearn={openPoint} onCorrect={p => {
    const items = selectPointMistakes(vaultItems, props.activeSubject, p.name);
    if (items.length) setCorrection({ point: p, context, items });
  }} onBack={() => { setTraceOrigin(null); setTraceSelection(null); props.onExpeditionScreenChange?.('main'); }} />;
  return <div className="bkl-shell">
    <div className="bkl-mode-bar">
      <div className="bkl-mode-switch" role="group" aria-label="学习方式">
        <button aria-pressed={view === 'map'} onClick={() => changeView('map')}>精准学</button>
        <button aria-pressed={view === 'theme'} onClick={() => changeView('theme')}>主题学习</button>
      </div>
      <span className="bkl-book-meta">{book?.edition || version} · {academic.grade} · {academic.term}</span>
    </div>
    <div className="bkl-workspace" hidden={view !== 'map'}>
      <aside className="bkl-sidebar">
        {!!points.length && !error && (point ? <>
          <PointLearningCard point={point} health={selectedHealth!} commonTypes={commonTypes[point.id]} masteredCount={masteredCount} totalCount={points.length} mistakeCount={pointMistakes.length} onLearn={() => openPoint(point)} onCorrect={() => setCorrection({ point, context, items: pointMistakes })} onTrace={canTrace(point.id) ? () => openPoint(point, 'trace') : undefined} onClear={() => setPoint(null)} />
        </> : recommended ? <section className="bkl-recommend" aria-label="推荐学习"><h3>推荐学习</h3><strong>{recommended.name}</strong><p>优先攻克薄弱点，再复习与探索</p><button onClick={() => openPoint(recommended)}>开始学习 →</button></section> : <section className="bkl-recommend bkl-all-mastered" role="status"><span aria-hidden="true">✦</span><h3>太棒了！这部分内容都完成了！</h3></section>)}
      </aside>
      <main className="bkl-canvas">
        <div className="bkl-breadcrumb">
          {loading ? <span>正在加载章节…</span> : error ? <span>教材目录加载失败</span> : book ?
            <label className="bkl-path-selector">
              <span>{[props.activeSubject, ...(leaf ? findPath(book.children, leaf.id).map(n => n.name) : [])].join(' / ')}</span>
              <ChevronDown size={14} aria-hidden="true" />
              <select aria-label="选择章节" value={leaf?.id ?? ''} onChange={event => {
                const path = findPath(book.children, event.target.value);
                const section = path[path.length - 1];
                if (!section) return;
                setLeaf(section); setPoint(null);
              }}>
                {book.children.map(chapter => chapter.children.length ?
                  <optgroup key={chapter.id} label={chapter.name}>{chapter.children.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}</optgroup> :
                  <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}
              </select>
            </label> : <span>{props.activeSubject} / 暂无教材目录</span>}
        </div>
        <div className="bkl-canvas-heading"><h2>{leaf?.name ?? '知识图谱学习'}</h2>{leaf && <p>{points.length} 个知识点</p>}</div>
        {loading ? <div className="bkl-graph-empty">正在加载知识点…</div> : error ? <div className="bkl-graph-empty" role="alert"><h3>教材数据加载失败</h3><p>请检查本地预览服务是否运行，然后重试</p><button onClick={() => setRetry(n => n + 1)}>重新加载</button></div> : !book ? <div className="bkl-graph-empty">暂无与当前教材匹配的目录，请在「我的课本」核对教材信息</div> : !points.length ? <div className="bkl-graph-empty">本节暂无教材关联的知识点</div> :
          <BookBranchGraph key={leaf?.id} groups={groups} selected={point?.id} onSelect={setPoint} onClearSelection={() => setPoint(null)} statuses={statuses} recommendedId={recommended?.id} />}
        <div className="bkl-canvas-footer"><span>● 未知　<span style={{ color: '#6d9ee8' }}>● 探索中</span>　<span style={{ color: '#ed6b75' }}>● 待攻克</span>　<span style={{ color: '#e4b342' }}>● 待复习</span>　<span style={{ color: '#42b7ad' }}>● 已掌握</span></span><button className="bkl-difficulty-trigger" aria-label={`难度设置，当前${difficulty}`} aria-haspopup="dialog" onClick={() => difficultyDialog.current?.showModal()}><SlidersHorizontal size={16} /><span>{difficulty}</span></button></div>
      </main>
    </div>
    <dialog ref={difficultyDialog} className="bkl-difficulty-dialog" aria-labelledby="bkl-difficulty-title" onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
    }}>
      <div className="bkl-difficulty-heading"><div><h2 id="bkl-difficulty-title">练习难度</h2><p>选择适合你的训练，每次 6 道题</p></div><button aria-label="关闭难度设置" onClick={() => difficultyDialog.current?.close()}><X size={20} /></button></div>
      <div className="bkl-difficulty-options" role="group" aria-label="练习难度选项">
        {([
          { name: '基础', caption: '理解概念，掌握基础方法' },
          { name: '进阶', caption: '巩固方法，提升综合应用' },
          { name: '拓展', caption: '复杂推理，挑战迁移应用' },
        ] as const).map(option => <button key={option.name} className="bkl-difficulty-option" aria-pressed={difficulty === option.name} onClick={() => { setChapterDifficulties(previous => ({ ...previous, [difficultyScope]: option.name })); difficultyDialog.current?.close(); }}>
          <span><strong>{option.name}</strong><small>{option.caption}</small></span><span className="bkl-difficulty-check">{difficulty === option.name && <Check size={16} />}</span>
        </button>)}
      </div>
      <p className="bkl-difficulty-note">三种难度共用知识讲解视频</p>
    </dialog>
    {themeVisited && <div className="bkl-theme" hidden={!themeFullScreen}><ThemeLearning {...props} /></div>}
  </div>;
}
