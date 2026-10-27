import { isResultReleased, parentGradeLabel, canUseAIExplanation } from './homeworkGrading';
import type { GradeQuestion } from './homeworkMock';

export interface QuestionRegion { x: number; y: number; width: number; height: number }
export const NOTEBOOK_KEY = 'demo_homework_notebook_v1';
export const MISTAKE_REASONS = ['知识点不熟', '思路不清', '计算失误', '审题疏漏', '其他'];
export const CUSTOM_MISTAKE_REASON_LIMIT = 10;
export const normalizeMistakeReason = (value:string) => String(value || '').replace(/\s/gu, '');
export const mistakeReasonLength = (value:string) => Array.from(normalizeMistakeReason(value)).length;
export const isValidMistakeReason = (value:string) => mistakeReasonLength(value) > 0 && mistakeReasonLength(value) <= CUSTOM_MISTAKE_REASON_LIMIT;

export interface NotebookEntry {
  key: string; studentId: string; taskId: string; itemId: string; questionId: string;
  imagePath?: string; taskTitle?: string; version: number; reason: string; addedAt: string; question: GradeQuestion;
}
export function questionRegion(question: GradeQuestion, index: number, mock = false): QuestionRegion | null {
  const region = question.region || (mock && index < 2 ? { x: .11, y: index === 0 ? .25 : .515, width: .78, height: .215 } : undefined);
  if (!region || ![region.x, region.y, region.width, region.height].every(Number.isFinite) || region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0 || region.x + region.width > 1 || region.y + region.height > 1) return null;
  return region;
}
export function questionMark(question: GradeQuestion, parent = true) {
  if (question.state === 'confirmed' && (!parent || isResultReleased(question))) return { mark: question.correct ? '✓' : '×', tone: question.correct ? 'correct' : 'wrong', label: question.correct ? '答对' : '答错' };
  const labels: Record<string, string> = { review: '待复核', unreadable: '识别存疑', 'no-answer': '答案存疑', failed: '批改失败', queued: '等待批改', processing: '正在批改', confirmed: '待教师开放' };
  return { mark: ['queued', 'processing'].includes(question.state) ? '…' : question.state === 'confirmed' ? '待开放' : '?', tone: 'pending', label: labels[question.state] || parentGradeLabel(question) };
}
export function notebookKey(studentId: string, taskId: string, itemId: string, questionId: string) { return JSON.stringify([studentId, taskId, itemId, questionId]); }
export function addNotebookEntry(entries: NotebookEntry[], source: { studentId: string; taskId: string; itemId: string; version: number; imagePath?: string; taskTitle?: string }, question: GradeQuestion, reason: string): NotebookEntry[] {
  if (!isResultReleased(question) || !isValidMistakeReason(reason)) return entries;
  reason = normalizeMistakeReason(reason);
  const key = notebookKey(source.studentId, source.taskId, source.itemId, question.id);
  const entry: NotebookEntry = { ...source, questionId: question.id, key, reason, addedAt: new Date().toISOString(), question: JSON.parse(JSON.stringify(question)) };
  if(!canUseAIExplanation(question)){entry.question.answer='';entry.question.analysis='';entry.question.explanation='';entry.question.keyPoint='';entry.question.knowledgeVideoUrl='';entry.question.aiAnswer='';entry.question.aiExplanation='';}
  return [...entries.filter(item => item.key !== key), entry];
}
export function questionGuide(question: GradeQuestion) {
  const fraction = question.stem?.includes('1/2 + 1/4');
  const choir = question.stem?.includes('合唱队有 40');
  return [
    { title: '先理清题意', text: question.analysis || question.stem || '先读题，找出已知条件和要求的量。' },
    { title: '一起分步推导', text: fraction ? '先把 1/2 通分成 2/4，再计算 2/4 + 1/4。' : choir ? '总人数是 40，男生占 3/5，列出算式 40 × 3/5。' : question.explanation || '根据解析逐步写出你的思路。' },
    { title: '试着独立作答', text: '现在请写下这道题的最终答案，再核对自己的思路。' },
  ];
}
export function checkGuideAnswer(answer: string, expected: string) {
  const normalize = (text: string) => text.trim().replace(/\s|[（）()。]/g, '').replace(/人$/, '');
  const a=normalize(answer),b=normalize(expected);
  if(!a)return false;if(a===b)return true;
  const value=(text:string):number|null=>{if(/^[+-]?\d+(?:\.\d+)?$/.test(text))return Number(text);const fraction=text.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);return fraction&&Number(fraction[2])!==0?Number(fraction[1])/Number(fraction[2]):null;};
  const x=value(a),y=value(b);return x!==null&&y!==null&&Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<1e-9;
}
