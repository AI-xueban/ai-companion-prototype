import type { MistakeItem, MistakeVaultData } from '../types';
import type { UniversalQuizQuestion } from '../components/Quiz/UniversalQuizView';
import type { QuestionHealthState } from './bookKnowledgeProgress';

const KEY = 'ai_friend_mistake_correction_states_v1';
function readRecord(): { states: Record<string, MistakeItem['status']>; lastSessionId?: string; extraItems?: MistakeItem[] } {
  try { return JSON.parse(localStorage.getItem(KEY) || '{"states":{}}'); } catch { return { states: {} }; }
}

/** Register actual graph exercise errors in the same vault consumed by batch correction. */
export function registerPointMistakes(subject: string, pointName: string, questions: UniversalQuizQuestion[], questionStates: Record<string, QuestionHealthState> = {}) {
  const record = readRecord();
  const items = new Map((record.extraItems ?? []).map(item => [item.id, item]));
  for (const q of questions) {
    const state = questionStates[q.id];
    if (!state || (state !== 'weak' && !items.has(q.id))) continue;
    const status = state === 'weak' ? 'new' : state === 'mastered' ? 'mastered' : 'reviewing';
    record.states[q.id] = status;
    items.set(q.id, { id: q.id, subject, topic: pointName, knowledgePoints: [pointName],
      status, questionSnippet: q.content.stem, fullQuestion: q.content.stem,
      questionType: q.type, options: q.content.options, difficulty: q.difficulty,
      errorType: '其它', lastReview: '刚刚', tags: q.tags,
      stats: { errorCount: 1, reviewCount: 0, correctCount: state === 'mastered' ? 2 : state === 'reviewing' ? 1 : 0,
        lastWrongDate: items.get(q.id)?.stats.lastWrongDate ?? '', mastered: status === 'mastered', isStarred: false },
      correctAnswer: Array.isArray(q.result?.correctAnswer) ? q.result.correctAnswer.join('、') : String(q.result?.correctAnswer ?? ''),
      analysis: q.result?.explanation ?? '',
    });
  }
  try { localStorage.setItem(KEY, JSON.stringify({ ...record, extraItems: [...items.values()] })); } catch { /* storage unavailable */ }
}

export function selectPointMistakes(items: MistakeItem[], subject: string, pointName: string) {
  return [...new Map(items.filter(item => item.subject === subject && item.status !== 'mastered'
    && (item.knowledgePoints?.includes(pointName) || item.topic === pointName)).map(item => [item.id, item])).values()];
}

export function recordPointCorrections(items: MistakeItem[], questions: { questionId: string; isCorrect: boolean }[], sessionId: string) {
  const record = readRecord();
  const states = record.states;
  if (record.lastSessionId === sessionId) return items.map(item => ({ ...item, status: states[item.id] ?? item.status }));
  for (const q of new Map(questions.map(q => [q.questionId, q])).values()) {
    const item = items.find(item => item.id === q.questionId);
    if (!item) continue;
    const current = states[item.id] ?? item.status;
    states[item.id] = !q.isCorrect ? 'new' : current === 'reviewing' || current === 'mastered' ? 'mastered' : 'reviewing';
  }
  try { localStorage.setItem(KEY, JSON.stringify({ ...record, states, lastSessionId: sessionId })); } catch { /* storage unavailable */ }
  return items.map(item => ({ ...item, status: states[item.id] ?? item.status }));
}

export function applyMistakeCorrectionStates(data: MistakeVaultData): MistakeVaultData {
  const record = readRecord();
  const states = record.states;
  const existingIds = new Set(data.groups.flatMap(group => group.items.map(item => item.id)));
  const extra = (record.extraItems ?? []).filter(item => !existingIds.has(item.id));
  const sourceGroups = [...data.groups, ...(extra.length ? [{ topic: '精准学错题', count: extra.length, items: extra }] : [])];
  const groups = sourceGroups.map(group => ({ ...group, items: group.items.map(item => ({
    ...item, status: states[item.id] ?? item.status,
    stats: { ...item.stats, mastered: (states[item.id] ?? item.status) === 'mastered' },
  })) }));
  const items = groups.flatMap(group => group.items);
  return { ...data, groups, totalPending: items.filter(item => item.status !== 'mastered').length,
    subjectStats: data.subjectStats.map(stat => {
      const list = items.filter(item => item.subject === stat.subject);
      const weak = list.filter(item => item.status === 'new').length;
      const reviewing = list.filter(item => item.status === 'reviewing').length;
      const mastered = list.filter(item => item.status === 'mastered').length;
      return { ...stat, weak, reviewing, mastered, total: list.length, pendingCount: weak + reviewing,
        solvedPercentage: list.length ? Math.round(mastered / list.length * 100) : 0 };
    }) };
}
