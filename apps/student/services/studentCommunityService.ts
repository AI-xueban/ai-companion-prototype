import { DEMO_STUDENT_ACADEMIC } from '../data/studentAcademicProfile';

export const COMMUNITY_STORAGE_KEY = 'ai_friend_student_community_v1';
export const PLATFORM_STORAGE_KEY = 'hivemate_platform_v3';
export const COMMUNITY_CHANGED = 'student-community-changed';
export const COMMUNITY_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '道德与法治', '科学', '美术', '信息科技'];
export type CommunityPage = 'gallery' | 'mine' | 'create' | 'tasks';
export interface CommunitySource { id: string; kind: 'question' | 'homework'; title: string; subject: string; studentId: string; completedAt: string; }
export interface CommunityWork {
  id: string; title: string; desc: string; subjects: string[]; subject: string; grade: string; classId: string; className: string;
  studentId: string; author: string; mode: 'analysis' | 'ai'; type: string; sourceId?: string; sourceTitle?: string;
  file?: string; status: 'pending' | 'approved' | 'returned'; review?: string; reviewedBy?: string; color?: string;
}
export interface CommunityResource { id: string; title: string; desc: string; subject: string; grade: string; chapter: string; author: string; type: string; studentVisible: boolean; public: boolean; version: string; studentClassIds?: string[]; }
export interface CommunityTask { id: string; title: string; desc: string; subject: string; submitted: boolean; feedback?: string; deadline?: string; answer?: string; }
export interface CommunityProfile { studentId: string; name: string; grade: string; classId: string; className: string; }
export interface CommunityState { sources: CommunitySource[]; works: CommunityWork[]; resources: CommunityResource[]; tasks: CommunityTask[]; }
const empty = (): CommunityState => ({ sources: [], works: [], resources: [], tasks: [] });
const subjectName = (s: string) => ({ math: '数学', chinese: '语文', english: '英语', physics: '物理', chemistry: '化学', biology: '生物' }[s] || s);
export function communityProfile(grade = DEMO_STUDENT_ACADEMIC.grade, name = DEMO_STUDENT_ACADEMIC.name): CommunityProfile {
  return { studentId: DEMO_STUDENT_ACADEMIC.studentId, name, grade, classId: `${grade}-2`, className: `${grade}2班` };
}
export function readCommunity(): CommunityState {
  try { const s = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || 'null'); return s ? { sources: Array.isArray(s.sources) ? s.sources : [], works: Array.isArray(s.works) ? s.works : [], resources: Array.isArray(s.resources) ? s.resources : [], tasks: Array.isArray(s.tasks) ? s.tasks : [] } : empty(); } catch { return empty(); }
}
function save(s: CommunityState) { localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(s)); window.dispatchEvent(new Event(COMMUNITY_CHANGED)); }
export function syncPlatformCommunity(profile: CommunityProfile) {
  try {
    const p = JSON.parse(localStorage.getItem(PLATFORM_STORAGE_KEY) || 'null');
    if (!p) return;
    p.studentProfile = profile;
    localStorage.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(p));
    mergeCommunitySnapshot({ works: p.works || [], resources: (p.resources || []).filter((r: CommunityResource) => r.public && r.studentVisible).map((r: CommunityResource & { studentDescription?: string }) => ({ id: r.id, title: r.title, desc: r.studentDescription || '老师开放的学习材料', subject: r.subject, grade: r.grade, chapter: r.chapter, author: r.author, type: r.type, version: r.version, public: true, studentVisible: true, studentClassIds: r.studentClassIds })), tasks: p.tasks || [] });
  } catch { /* standalone student preview may not have a teacher platform session */ }
}
function updatePlatform(change: (p: { works: CommunityWork[]; tasks: CommunityTask[]; ledger?: Array<{ id: string; title: string; amount: number }> }) => void) {
  try { const p = JSON.parse(localStorage.getItem(PLATFORM_STORAGE_KEY) || 'null'); if (p) { change(p); localStorage.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(p)); } } catch { /* local-only preview */ }
}
export function recordCommunityReward(work: CommunityWork, amount: number) {
  updatePlatform(p => { p.ledger ??= []; if (!p.ledger.some(r => r.id === work.id)) p.ledger.push({ id: work.id, title: work.title, amount }); });
}
export function recordCompletedCommunitySources(rows: Array<{ id: string; title: string; subject: string }>, kind: CommunitySource['kind']) {
  const state = readCommunity();
  rows.forEach(row => {
    const id = `${kind}:${row.id}`;
    const source: CommunitySource = { id, kind, title: row.title || '已完成题目', subject: subjectName(row.subject), studentId: DEMO_STUDENT_ACADEMIC.studentId, completedAt: new Date().toISOString() };
    state.sources = [source, ...state.sources.filter(x => x.id !== id)].slice(0, 300);
  }); save(state);
}
export function mergeCommunitySnapshot(snapshot: Pick<CommunityState, 'works' | 'resources' | 'tasks'>) {
  const state = readCommunity();
  const incoming = snapshot.works.filter(w => w && typeof w.id === 'string' && Array.isArray(w.subjects));
  const ids = new Set(incoming.map(w => w.id));
  state.works = [...incoming, ...state.works.filter(w => !ids.has(w.id) && w.status === 'pending')];
  state.resources = snapshot.resources.filter(r => r.public && r.studentVisible).map(r => ({ ...r, desc: r.desc || '' }));
  state.tasks = snapshot.tasks;
  save(state);
}
export function submitCommunityWork(input: { title: string; desc: string; subjects: string[]; mode: CommunityWork['mode']; sourceId?: string; file?: string }, profile: CommunityProfile): CommunityWork {
  const state = readCommunity();
  const subjects = [...new Set(input.subjects)].filter(s => COMMUNITY_SUBJECTS.includes(s));
  if (!subjects.length) throw new Error('请先选择至少一个科目，再开始创作。');
  if (!input.title.trim() || (!input.desc.trim() && !input.file)) throw new Error('请填写作品名称，并写下讲解或选择解析文件。');
  const source = state.sources.find(s => s.id === input.sourceId && s.studentId === profile.studentId && subjects.includes(s.subject));
  if (input.mode === 'analysis' && !source) throw new Error('解析只能关联本人在平板中已经做过的题目或作业。');
  const work: CommunityWork = { id: `student-work-${crypto.randomUUID()}`, title: input.title.trim(), desc: input.desc.trim(), subjects, subject: subjects.join('、'), mode: input.mode, type: input.mode === 'ai' ? 'AI创作' : source?.kind === 'homework' ? '作业讲解' : '题目讲解', sourceId: source?.id, sourceTitle: source?.title, file: input.file, studentId: profile.studentId, author: profile.name, grade: profile.grade, classId: profile.classId, className: profile.className, status: 'pending', color: input.mode === 'ai' ? 'violet' : 'blue' };
  state.works.unshift(work); save(state);
  updatePlatform(p => { p.works = [work, ...(p.works || []).filter(x => x.id !== work.id)]; });
  return work;
}
export function completeCommunityTask(id: string, answer: string, file?: string) {
  const state = readCommunity(), task = state.tasks.find(t => t.id === id);
  if (!task || (!answer.trim() && !file)) throw new Error('请先写下作答或选择作业文件。');
  task.submitted = true; task.answer = answer; save(state);
  updatePlatform(p => { const t = p.tasks.find(t => t.id === id); if (t) { t.submitted = true; t.answer = answer; } });
  recordCompletedCommunitySources([{ id, title: task.title, subject: task.subject }], 'homework');
  return task;
}
