import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X, Check } from 'lucide-react';
import { SubjectMap as ThemeLearning, type ExpeditionScreen } from './SubjectMap';
import { loadAcademicContext } from '../../services/academicContextStore';
import { getAvailableTextbookVersions, resolveTextbookVersion } from '../../services/textbookVersionStore';
import './bookKnowledgeLearning.css';
import { KnowledgeTracePage } from './KnowledgeTracePage';
import { PointLearningCard } from './PointLearningCard';
import { ChapterTrainingPanel, chapterTrainingId, type TextTrainingDifficulty } from './ChapterTrainingPanel';
import { KnowledgeVideoListPage, knowledgeVideoProgressId } from './KnowledgeVideoListPage';
import { hasPointPredecessor, type TracePoint } from './pointTrace';
import { BookBranchGraph } from './BookBranchGraph';
import { buildBookGraph, type Point, type Catalog } from './bookLearningGraph';
import { VideoLesson } from '../Learning/VideoLesson';
import { QuizPage } from '../Quiz/QuizPage';
import { DailyConquerModal } from '../MistakeVault/DailyConquerModal';
import { getMistakeVaultData } from '../../services/geminiService';
import { selectPointMistakes, recordPointCorrections, registerPointMistakes } from '../../services/knowledgePointMistakes';
import type { MistakeItem } from '../../types';
import { getBookPointResource, getBookTextVideos, type KnowledgeVideo } from '../../data/bookKnowledgeResources';
import { readBookPointProgress, writeBookPointProgress, getPointHealth, applyPointPractice } from '../../services/bookKnowledgeProgress';
import { KG_SCOPE_MICRO_LESSON, sectionPracticeQuizFields } from '../../utils/kgMicroLesson';
import type { Task } from '../../types';
import type { RewardGrantResult } from '../../types/reward';

export type { ExpeditionScreen };
type Book = { id: string; name: string; edition: string; grade: string; term: string; children: Catalog[] };
type Props = React.ComponentProps<typeof ThemeLearning> & {
  onKnowledgeReward?: (result: RewardGrantResult) => void;
  learningView?: 'map' | 'theme';
  onLearningViewChange?: (view: 'map' | 'theme') => void;
};
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
  const chapterTrainingMode = props.activeSubject === '语文' || props.activeSubject === '英语';
  const [localView, setView] = useState<'map' | 'theme'>('map');
  const view = props.learningView ?? localView;
  const [themeVisited, setThemeVisited] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [leaf, setLeaf] = useState<Catalog | null>(null);
  const [selectedPoint, setPoint] = useState<Point | null>(null);
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
  const [session, setSession] = useState<{ point: Point; context: string; resource: NonNullable<ReturnType<typeof getBookPointResource>>; phase: 'video' | 'quiz'; task: Task; chapterVideo?: boolean; chapterTraining?: boolean } | null>(null);
  const [videoList, setVideoList] = useState<{ textId: string; title: string; context: string; videos: KnowledgeVideo[] } | null>(null);
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
      const firstMappedSection = !chapterTrainingMode && grade7FirstTerm && match
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
      props.onLearningViewChange?.('theme');
    }
  }, [props.learningSessionSignal]);

  useEffect(() => {
    if (view === 'theme') setThemeVisited(true);
    else props.onExpeditionScreenChange?.('main');
  }, [view, props.onExpeditionScreenChange]);
  const onThemeScreenChange = useCallback((screen: ExpeditionScreen) => {
    if (view === 'theme') props.onExpeditionScreenChange?.(screen);
  }, [view, props.onExpeditionScreenChange]);
  const groups = leaf ? buildBookGraph(leaf) : [];
  const sections = book?.children.flatMap(chapter => chapter.children.length ? chapter.children : [chapter]) ?? [];
  const sectionIndex = sections.findIndex(section => section.id === leaf?.id);
  const selectSection = (section: Catalog | undefined) => {
    if (!section || loading || error) return;
    setLeaf(section); setPoint(null);
  };
  const points = groups.flatMap(g => g.points);
  const context = `${props.activeSubject}|${academic.schoolSystem}|${book?.id}|${version}|${academic.grade}|${academic.term}`;
  const difficultyScope = `${context}|${leaf?.id ?? ''}`;
  const difficulty = chapterDifficulties[difficultyScope] ?? '基础';
  const progress = Object.fromEntries(points.map(p => [p.id, readBookPointProgress(context, p.id)]));
  const health = Object.fromEntries(points.map(p => [p.id, getPointHealth(progress[p.id])]));
  const priority = ['weak', 'reviewing', 'exploring', 'unknown'];
  const recommended = priority.flatMap(status => points.filter(p => health[p.id].status === status))[0];
  const point = points.find(p => p.id === selectedPoint?.id) ?? recommended ?? points[0] ?? null;
  useEffect(() => {
    if (point && selectedPoint?.id !== point.id) setPoint(point);
  }, [point?.id, selectedPoint?.id]);
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
  const masteredCount = points.filter(p => health[p.id].status === 'mastered').length;
  const statuses = Object.fromEntries(points.map(p => [p.id, health[p.id].status]));
  const pointMistakes = point ? selectPointMistakes(vaultItems, props.activeSubject, point.name) : [];
  const selectedHealth = point ? health[point.id] : undefined;
  const traceSubjectCode = codes[props.activeSubject] + (grades.includes(academic.grade) && !(academic.grade === '六年级' && academic.schoolSystem === '五四制') ? '3' : '');
  const canTrace = (id: string) => hasPointPredecessor(traceIndex[traceSubjectCode] ?? {}, id);
  const openPoint = (p: Point, mode: 'video' | 'trace' = 'video') => {
    if (mode === 'trace') {
      const index = traceIndex[traceSubjectCode] ?? {};
      const previousId = index[p.id]?.previousId;
      const previous = previousId ? index[previousId] : undefined;
      if (!previous) return;
      setTraceOrigin(p); setTraceSelection(previous); return;
    }
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
  const openChapterVideo = () => {
    if (!chapterTrainingMode || !book || !leaf) return;
    setVideoList({ textId: leaf.id, title: leaf.name, context, videos: getBookTextVideos(props.activeSubject, leaf.id, leaf.name) });
  };
  const openTextTraining = (difficulty: TextTrainingDifficulty) => {
    if (!chapterTrainingMode || !book || !leaf) return;
    const id = chapterTrainingId(leaf.id, difficulty);
    setSession({ point: { id, name: leaf.name }, context, phase: 'quiz', chapterTraining: true,
      resource: { steps: [], questions: [], simulated: true }, task: {
        ...sectionPracticeQuizFields(),
        id: `book-knowledge-training-${book.id}-${id}`,
        title: `${leaf.name} · ${difficulty}训练（流程模拟）`, subject: props.activeSubject, completed: false,
        questionCount: 6, practiceDifficulty: difficulty === '基础' ? 2 : difficulty === '进阶' ? 3 : 4,
        practiceDifficultyLabel: difficulty,
      },
    });
  };
  const playKnowledgeVideo = (video: KnowledgeVideo) => {
    if (!videoList) return;
    const id = `book-knowledge-video-${video.id}`;
    setSession({ point: { id: knowledgeVideoProgressId(videoList.textId, video.id), name: video.title }, context: videoList.context, resource: { steps: video.steps, questions: [], simulated: video.simulated }, phase: 'video', chapterVideo: true, task: {
      id, title: video.title, subject: props.activeSubject, durationMinutes: Math.ceil(video.durationSec / 60), completed: false, aiReasoning: KG_SCOPE_MICRO_LESSON,
      sectionVideoPlaylist: { items: [{ id, title: video.title, topicTitle: videoList.title, durationSec: video.durationSec }], currentIndex: 0, scopeLabel: videoList.title },
    } });
  };
  const closeSession = () => { setSession(null); setCorrection(null); props.onExpeditionScreenChange?.(traceOrigin || videoList ? 'textbook-video' : 'main'); };
  useEffect(() => {
    if (session || correction || traceOrigin || videoList) props.onExpeditionScreenChange?.('textbook-video');
  }, [Boolean(session || correction || traceOrigin || videoList), props.onExpeditionScreenChange]);
  const themeFullScreen = view === 'theme' && themeVisited;
  if (correction) return <DailyConquerModal items={correction.items} maxQuestions={correction.items.length} mode="batch" subjectLabel={props.activeSubject} onClose={closeSession} onComplete={() => {}} onRewardGranted={props.onKnowledgeReward} onSessionResult={result => {
    setVaultItems(recordPointCorrections(vaultItems, result.questions, result.sessionId));
    const previous = readBookPointProgress(correction.context, correction.point.id);
    writeBookPointProgress(correction.context, correction.point.id, applyPointPractice(previous, result));
    updateProgress(n => n + 1);
  }} />;
  if (session?.chapterTraining) return <div className="bkl-session bkl-text-training-session">
    <header><span>{session.point.name} · {session.task.practiceDifficultyLabel}训练</span><small>演示题不计入课文健康分</small></header>
    <div className="bkl-text-training-body"><QuizPage key={session.task.id} task={session.task} onExit={closeSession} onRewardGranted={props.onKnowledgeReward} /></div>
  </div>;
  if (session) return <div className="bkl-session">
    {session.phase === 'video' ? <VideoLesson key={session.task.id} task={session.task}
      knowledgePreview={{ title: session.point.name, steps: session.resource.steps }}
      onWatched={() => { writeBookPointProgress(session.context, session.point.id, { watched: true }); updateProgress(n => n + 1); }}
      onRewardGranted={props.onKnowledgeReward}
      onExit={closeSession} onComplete={() => { if (session.chapterVideo) closeSession(); else setSession(old => old ? { ...old, phase: 'quiz' } : old); }} /> :
      <QuizPage key={`${session.task.id}-quiz`} task={{ ...session.task, ...sectionPracticeQuizFields(), title: `${session.point.name} · ${session.resource.simulated ? '流程模拟练习' : '知识点练习'}`, questionCount: session.resource.questions.length }}
        overrideQuestions={session.resource.questions} onExit={closeSession} onRewardGranted={props.onKnowledgeReward}
        onSessionResult={result => {
          if (result.grantResult?.invalidLearning) return;
          const previous = readBookPointProgress(session.context, session.point.id);
          writeBookPointProgress(session.context, session.point.id, applyPointPractice(previous, result, session.resource.simulated));
          updateProgress(n => n + 1);
        }} />}
  </div>;
  if (videoList) return <KnowledgeVideoListPage title={videoList.title} textId={videoList.textId} context={videoList.context} videos={videoList.videos} onPlay={playKnowledgeVideo} onBack={() => { setVideoList(null); props.onExpeditionScreenChange?.('main'); }} />;
  if (traceOrigin) return <KnowledgeTracePage origin={traceOrigin} selected={traceSelection ?? traceOrigin} onSelect={setTraceSelection} context={context} subject={props.activeSubject} code={codes[props.activeSubject] + (grades.includes(academic.grade) && !(academic.grade === '六年级' && academic.schoolSystem === '五四制') ? '3' : '')} commonTypes={commonTypes} mistakes={vaultItems} onLearn={openPoint} onCorrect={p => {
    const items = selectPointMistakes(vaultItems, props.activeSubject, p.name);
    if (items.length) setCorrection({ point: p, context, items });
  }} onBack={() => { setTraceOrigin(null); setTraceSelection(null); props.onExpeditionScreenChange?.('main'); }} />;
  return <div className="bkl-shell">
    <div className={`bkl-workspace ${chapterTrainingMode ? 'bkl-chapter-workspace' : ''}`} hidden={view !== 'map'}>
        <div className="bkl-breadcrumb bkl-section-toolbar">
          {loading ? <span>正在加载章节…</span> : error ? <span>教材目录加载失败</span> : book ?
            <label className="bkl-path-selector">
              <span>{leaf ? findPath(book.children, leaf.id).map(n => n.name).join(' / ') : '请选择章节'}</span>
              <ChevronDown size={14} aria-hidden="true" />
              <select aria-label="选择章节" value={leaf?.id ?? ''} onChange={event => {
                const path = findPath(book.children, event.target.value);
                const section = path[path.length - 1];
                if (!section) return;
                selectSection(section);
              }}>
                {book.children.map(chapter => chapter.children.length ?
                  <optgroup key={chapter.id} label={chapter.name}>{chapter.children.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}</optgroup> :
                  <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}
              </select>
            </label> : <span>暂无教材目录</span>}
          <nav className="bkl-section-navigation" aria-label="课文与章节切换">
            <button type="button" aria-label="上一课" title={sections[sectionIndex - 1] ? `上一课：${sections[sectionIndex - 1].name}` : '已经是第一课'} disabled={loading || !!error || sectionIndex <= 0} onClick={() => selectSection(sections[sectionIndex - 1])}><ChevronLeft size={19} aria-hidden="true" /></button>
            <button type="button" aria-label="下一课" title={sections[sectionIndex + 1] ? `下一课：${sections[sectionIndex + 1].name}` : '已经是最后一课'} disabled={loading || !!error || sectionIndex < 0 || sectionIndex >= sections.length - 1} onClick={() => selectSection(sections[sectionIndex + 1])}><ChevronRight size={19} aria-hidden="true" /></button>
          </nav>
        </div>
      {!chapterTrainingMode && <aside className="bkl-sidebar">
        {point && !error && <PointLearningCard point={point} health={selectedHealth!} commonTypes={commonTypes[point.id]} masteredCount={masteredCount} totalCount={points.length} mistakeCount={pointMistakes.length} onLearn={() => openPoint(point)} onCorrect={() => setCorrection({ point, context, items: pointMistakes })} onTrace={canTrace(point.id) ? () => openPoint(point, 'trace') : undefined} />}
      </aside>}
      <main className={`bkl-canvas ${chapterTrainingMode ? 'bkl-chapter-canvas' : ''}`}>

        {!chapterTrainingMode && <div className="bkl-canvas-heading"><h2>{leaf?.name ?? '精准学'}</h2>{leaf && <p>{points.length} 个知识点</p>}</div>}
        {loading ? <div className="bkl-graph-empty">{chapterTrainingMode ? '正在加载课文…' : '正在加载知识点…'}</div> : error ? <div className="bkl-graph-empty" role="alert"><h3>教材数据加载失败</h3><p>请检查本地预览服务是否运行，然后重试</p><button onClick={() => setRetry(n => n + 1)}>重新加载</button></div> : !book ? <div className="bkl-graph-empty">暂无与当前教材匹配的目录，请在「我的课本」核对教材信息</div> : chapterTrainingMode ? (leaf ? <ChapterTrainingPanel key={`${context}|${leaf.id}`} context={context} chapterId={leaf.id} subject={props.activeSubject} videos={getBookTextVideos(props.activeSubject, leaf.id, leaf.name)} onVideo={openChapterVideo} onTraining={openTextTraining} /> : <div className="bkl-graph-empty">暂无可训练的课文</div>) : !points.length ? <div className="bkl-graph-empty">本节暂无教材关联的知识点</div> :
          <BookBranchGraph key={leaf?.id} groups={groups} selected={point?.id} onSelect={setPoint} statuses={statuses} recommendedId={recommended?.id} />}
        {!chapterTrainingMode && <div className="bkl-canvas-footer"><span>● 未知　<span style={{ color: '#6d9ee8' }}>● 探索中</span>　<span style={{ color: '#ed6b75' }}>● 待攻克</span>　<span style={{ color: '#e4b342' }}>● 待复习</span>　<span style={{ color: '#42b7ad' }}>● 已掌握</span></span><button className="bkl-difficulty-trigger" aria-label={`难度设置，当前${difficulty}`} aria-haspopup="dialog" onClick={() => difficultyDialog.current?.showModal()}><SlidersHorizontal size={16} /><span>{difficulty}</span></button></div>}
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
    {themeVisited && <div className="bkl-theme" hidden={!themeFullScreen}><ThemeLearning {...props} onExpeditionScreenChange={onThemeScreenChange} /></div>}
  </div>;
}
