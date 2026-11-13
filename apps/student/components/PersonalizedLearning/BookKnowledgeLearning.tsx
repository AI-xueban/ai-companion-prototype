import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { SubjectMap as ThemeLearning, type ExpeditionScreen } from './SubjectMap';
import { loadAcademicContext } from '../../services/academicContextStore';
import { getAvailableTextbookVersions, resolveTextbookVersion } from '../../services/textbookVersionStore';
import './bookKnowledgeLearning.css';
import { BookBranchGraph } from './BookBranchGraph';
import { buildBookGraph, type Point, type Catalog } from './bookLearningGraph';
import { VideoLesson } from '../Learning/VideoLesson';
import { QuizPage } from '../Quiz/QuizPage';
import { getBookPointResource } from '../../data/bookKnowledgeResources';
import { readBookPointProgress, writeBookPointProgress } from '../../services/bookKnowledgeProgress';
import { KG_SCOPE_MICRO_LESSON, sectionPracticeQuizFields } from '../../utils/kgMicroLesson';
import type { Task } from '../../types';
import type { RewardGrantResult } from '../../types/reward';

export type { ExpeditionScreen };
type Book = { id: string; name: string; edition: string; grade: string; term: string; children: Catalog[] };
type Props = React.ComponentProps<typeof ThemeLearning> & { onKnowledgeReward?: (result: RewardGrantResult) => void };
const loaders = import.meta.glob('../../data/learning-books/*.json');
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [, updateProgress] = useState(0);
  const [session, setSession] = useState<{ point: Point; context: string; resource: NonNullable<ReturnType<typeof getBookPointResource>>; phase: 'video' | 'quiz'; task: Task } | null>(null);
  const lastSignal = useRef(props.learningSessionSignal);
  const academic = loadAcademicContext();
  const version = resolveTextbookVersion(props.activeSubject, getAvailableTextbookVersions(props.activeSubject, academic.grade, academic.term, academic.schoolSystem), academic.schoolSystem);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setBook(null); setLeaf(null); setPoint(null); setError('');
    const code = codes[props.activeSubject];
    const elementary = grades.includes(academic.grade) && !(academic.grade === '六年级' && academic.schoolSystem === '五四制');
    const key = `${code}${elementary ? '3' : ''}`;
    const loader = loaders[`../../data/learning-books/${key}.json`];
    (async () => {
      if (!loader) return;
      const { default: books } = await loader() as { default: Book[] };
      if (cancelled) return;
      const term = academic.term.includes('下') ? '下' : '上';
      const candidates = books.filter(b => b.grade === academic.grade && b.term.includes(term) && b.edition.replace(/（.*?）|\(.*?\)/g, '') === version);
      // The shared textbook setting identifies the publisher; use its 2024 edition for this graph preview.
      const match = (version === '北师大版' ? candidates.find(b => /[（(]2024[）)]/.test(b.edition)) : undefined) ?? candidates[0];
      setBook(match ?? null);
      const initial = match ? firstLeaf(match.children) : undefined;
      setLeaf(initial ?? null); setPoint(initial ? buildBookGraph(initial).flatMap(g => g.points)[0] ?? null : null);
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
  const progress = Object.fromEntries(points.map(p => [p.id, readBookPointProgress(context, p.id)]));
  const practiced = points.filter(p => progress[p.id].practiced).length;
  const watched = points.filter(p => progress[p.id].watched && !progress[p.id].practiced).length;
  const completion = points.length ? Math.round(practiced / points.length * 100) : 0;
  const recommended = points.find(p => !progress[p.id].practiced) ?? points[0];
  const statuses = Object.fromEntries(points.map(p => [p.id, progress[p.id].practiced ? 'practiced' : progress[p.id].watched ? 'learning' : 'new']));
  const openPoint = (p: Point) => {
    setPoint(p);
    const resource = getBookPointResource(props.activeSubject, p);
    const id = `book-knowledge-${book?.id}-${p.id}`;
    setSession({ point: p, context, resource, phase: 'video', task: {
      id, title: `${p.name} · 知识讲解`, subject: props.activeSubject, durationMinutes: 1, completed: false,
      aiReasoning: KG_SCOPE_MICRO_LESSON,
      sectionVideoPlaylist: { items: [{ id, title: `${p.name} · 知识讲解`, topicTitle: p.name, durationSec: 20 }], currentIndex: 0, scopeLabel: p.name },
      sectionPractice: { id: `${id}-practice`, title: `${p.name} · 知识点练习`, questionCount: resource.questions.length },
    } });
  };
  const closeSession = () => { setSession(null); props.onExpeditionScreenChange?.('main'); };
  useEffect(() => {
    if (session) props.onExpeditionScreenChange?.('textbook-video');
  }, [Boolean(session), props.onExpeditionScreenChange]);
  const noPointsSubject = props.activeSubject === '语文' || props.activeSubject === '英语';
  const themeFullScreen = view === 'theme' && themeVisited;
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
          writeBookPointProgress(session.context, session.point.id, { practiced: true, correctCount: result.correctCount, totalCount: result.totalCount }); updateProgress(n => n + 1);
        }} />}
  </div>;
  return <div className="bkl-shell">
    <div className="bkl-mode-bar">
      <div className="bkl-mode-switch" role="group" aria-label="学习方式">
        <button aria-pressed={view === 'map'} onClick={() => changeView('map')}>知识图谱学习</button>
        <button aria-pressed={view === 'theme'} onClick={() => changeView('theme')}>主题学习</button>
      </div>
      <span className="bkl-book-meta">{book?.edition || version} · {academic.grade} · {academic.term}</span>
    </div>
    <div className="bkl-workspace" hidden={view !== 'map'}>
      <aside className="bkl-sidebar">
        {!!points.length && !error && <>
          <section className="bkl-mastery"><h3>本节学习情况 <span>未测评</span></h3>
            <div className="bkl-mastery-body"><div className="bkl-ring" style={{ background: `conic-gradient(#7753f2 ${completion}%, #e8e1fc 0)` }}><div><strong>{completion}%</strong><small>学习完成率</small></div></div>
              <div className="bkl-mastery-numbers"><b>{points.length} 个知识点</b><div><span><strong>{points.length - watched - practiced}</strong>未学习</span><span><strong>{watched}</strong>已观看</span><span><strong>{practiced}</strong>已练习</span></div></div></div>
          </section>
          <section className="bkl-recommend"><h3>推荐学习</h3><strong>{recommended?.name}</strong><p>{practiced === points.length ? '本节已练完，可以选择知识点复习' : '按教材顺序，学习首个未完成知识点'}</p><button onClick={() => recommended && openPoint(recommended)}>开始学习 →</button></section>
        </>}
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
                setLeaf(section); setPoint(buildBookGraph(section).flatMap(g => g.points)[0] ?? null);
              }}>
                {book.children.map(chapter => chapter.children.length ?
                  <optgroup key={chapter.id} label={chapter.name}>{chapter.children.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}</optgroup> :
                  <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}
              </select>
            </label> : <span>{props.activeSubject} / 暂无教材目录</span>}
        </div>
        <div className="bkl-canvas-heading"><h2>{leaf?.name ?? '知识图谱学习'}</h2>{leaf && <p>{points.length} 个知识点</p>}</div>
        {loading ? <div className="bkl-graph-empty">正在加载知识点…</div> : error ? <div className="bkl-graph-empty" role="alert"><h3>教材数据加载失败</h3><p>请检查本地预览服务是否运行，然后重试</p><button onClick={() => setRetry(n => n + 1)}>重新加载</button></div> : noPointsSubject ? <div className="bkl-graph-empty"><BookOpen size={34} /><h3>当前学科暂无知识点图谱</h3><p>可以切换到主题学习继续学习</p><button onClick={() => changeView('theme')}>进入主题学习 →</button></div> : !book ? <div className="bkl-graph-empty">暂无与当前教材匹配的目录，请在「我的课本」核对教材信息</div> : !points.length ? <div className="bkl-graph-empty">当前目录暂无知识点</div> :
          <BookBranchGraph key={leaf?.id} groups={groups} selected={point?.id} onSelect={openPoint} statuses={statuses} recommendedId={recommended?.id} />}
        <div className="bkl-canvas-footer"><span>● 未测　<span style={{ color: '#9b7cdc' }}>● 已观看</span>　<span style={{ color: '#42b7ad' }}>● 已练习</span></span></div>
      </main>
    </div>
    {themeVisited && <div className="bkl-theme" hidden={!themeFullScreen}><ThemeLearning {...props} /></div>}
  </div>;
}
