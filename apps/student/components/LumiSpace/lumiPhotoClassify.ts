import { DEFAULT_QUESTION, flattenQuestionsFromShots, getQuestionById, needsQuestionPicker, type AISolveQuestion } from '../../data/aiSolveMockData';
import problemEnglishExamImg from '@/assets/problem-english-exam.png';

export type PhotoIntent = 'chat' | 'question' | 'ambiguous';

export interface PhotoClassification {
  intent: PhotoIntent;
  subject?: string;
  questionCount?: number;
  shotId?: string;
  questionId?: string;
}

export type PhotoReplyAction =
  | { type: 'solve_image'; imageIndex: number }
  | { type: 'solve_pick' };

export interface PhotoReplyButton {
  label: string;
  action: PhotoReplyAction;
}

export interface PhotoTriageItem {
  imageIndex: number;
  ordinalLabel: string;
  label: string;
  actionLabel: string;
  action: PhotoReplyAction;
}

export interface PhotoReplyContent {
  text: string;
  buttons: PhotoReplyButton[];
  triageItems: PhotoTriageItem[];
}

/** 原型拍照素材：第 1 张风景 / 第 2 张数学 / 第 3 张英语作业 */
export const LUMI_MOCK_SHOTS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
  problemEnglishExamImg,
];

const CLASSIFY_BY_URL: Record<string, PhotoClassification> = {
  '1506905925346': { intent: 'chat' },
  '1635070041078': {
    intent: 'question',
    subject: '数学',
    questionCount: 1,
    shotId: 'shot-paint',
    questionId: 'q27',
  },
  'problem-english-exam': {
    intent: 'question',
    subject: '英语',
    questionCount: 2,
    shotId: 'shot-english',
    questionId: 'en1',
  },
};

export function classifyLumiPhoto(url: string): PhotoClassification {
  for (const [key, value] of Object.entries(CLASSIFY_BY_URL)) {
    if (url.includes(key)) return { ...value };
  }
  return { intent: 'chat' };
}

export function resolveSolveQuestion(classification: PhotoClassification): AISolveQuestion {
  if (classification.questionId) {
    return getQuestionById(classification.questionId) ?? DEFAULT_QUESTION;
  }
  return DEFAULT_QUESTION;
}

/** 单张图角标文案（仅题目展示标签，统一为「学科+题」） */
export function getPerImageBadgeLabel(classification: PhotoClassification): string | null {
  if (classification.intent !== 'question') return null;
  return classification.subject ? `${classification.subject}题` : '题目';
}

function formatImageOrdinal(index: number): string {
  return `图 ${index + 1}`;
}

const CHAT_INSTEAD_HINT = '还是想跟我继续聊聊，也完全可以哦～';
const TRIAGE_ACTION_LABEL = '去解题';

function buildTriageItem(
  index: number,
  classification: PhotoClassification,
): PhotoTriageItem {
  const label = getPerImageBadgeLabel(classification) ?? '题目';
  return {
    imageIndex: index,
    ordinalLabel: formatImageOrdinal(index),
    label,
    actionLabel: TRIAGE_ACTION_LABEL,
    action: { type: 'solve_image', imageIndex: index },
  };
}

export function canImageStartSolve(classification: PhotoClassification): boolean {
  return classification.intent === 'question' || classification.intent === 'ambiguous';
}

export function canMessageStartSolve(classifications: PhotoClassification[] | undefined): boolean {
  if (!classifications?.length) return false;
  return classifications.some((c) => c.intent === 'question' || c.intent === 'ambiguous');
}

export function collectSolveShotIds(classifications: PhotoClassification[]): string[] {
  const ids = classifications
    .filter((c) => c.intent === 'question' && c.shotId)
    .map((c) => c.shotId!);
  return [...new Set(ids)];
}

export function resolveSolveAction(classifications: PhotoClassification[]): {
  shotIds: string[];
  needsPicker: boolean;
  directQuestion: AISolveQuestion | null;
} {
  const shotIds = collectSolveShotIds(classifications);
  if (shotIds.length > 0) {
    const questions = flattenQuestionsFromShots(shotIds);
    return {
      shotIds,
      needsPicker: needsQuestionPicker(shotIds) || questions.length > 1,
      directQuestion: questions.length === 1 ? questions[0] : null,
    };
  }

  const primary = classifications.find((c) => c.intent === 'question');
  if (primary) {
    const question = resolveSolveQuestion(primary);
    return { shotIds: [], needsPicker: false, directQuestion: question };
  }

  if (classifications.some((c) => c.intent === 'ambiguous')) {
    return { shotIds: [], needsPicker: false, directQuestion: DEFAULT_QUESTION };
  }

  return { shotIds: [], needsPicker: false, directQuestion: null };
}

/** @deprecated 使用 resolveSolveAction */
export function resolveMessageSolveAction(classifications: PhotoClassification[]) {
  return resolveSolveAction(classifications);
}

/** 构建小晤对图片消息的回复（陪伴语气 + 分拣卡片数据） */
export function buildPhotoReplyContent(
  _photos: string[],
  classifications: PhotoClassification[],
  userText: string,
): PhotoReplyContent {
  const questionIndices = classifications
    .map((c, i) => (c.intent === 'question' ? i : -1))
    .filter((i) => i >= 0);
  const chatIndices = classifications
    .map((c, i) => (c.intent === 'chat' ? i : -1))
    .filter((i) => i >= 0);
  const ambiguousIndices = classifications
    .map((c, i) => (c.intent === 'ambiguous' ? i : -1))
    .filter((i) => i >= 0);

  const total = classifications.length;
  const triageItems = questionIndices.map((idx) => buildTriageItem(idx, classifications[idx]));
  const hasNonQuestion = chatIndices.length > 0 || ambiguousIndices.length > 0;

  if (questionIndices.length > 0) {
    if (questionIndices.length === 1 && chatIndices.length === 0 && ambiguousIndices.length === 0) {
      const subject = classifications[questionIndices[0]].subject ?? '';
      const text = userText
        ? `收到啦～${subject ? `这像是道${subject}题，` : ''}我可以陪你慢慢讲。`
        : `${subject ? `这像是道${subject}题～` : '收到题目啦～'}点下面卡片，我们一起看。`;
      return { text, buttons: [], triageItems };
    }

    if (questionIndices.length > 1) {
      const text = userText
        ? `收到 ${total} 张图和你的说明啦～我找到了 ${questionIndices.length} 道题目，点卡片去解题。\n${CHAT_INSTEAD_HINT}`
        : `收到 ${total} 张图～里面有 ${questionIndices.length} 道题目，点卡片去解题。\n${CHAT_INSTEAD_HINT}`;
      return { text, buttons: [], triageItems };
    }

    const text = userText
      ? `收到 ${total} 张图和你的说明啦～其中有题目，点卡片去解题。${hasNonQuestion ? `\n${CHAT_INSTEAD_HINT}` : ''}`
      : `收到 ${total} 张图啦～其中有题目，点卡片去解题。${hasNonQuestion ? `\n${CHAT_INSTEAD_HINT}` : ''}`;
    return { text, buttons: [], triageItems };
  }

  if (ambiguousIndices.length > 0 && chatIndices.length === 0) {
    const ambIdx = ambiguousIndices[0];
    return {
      text: userText
        ? '收到图片啦～不太确定是不是题目，要试试讲讲看吗？'
        : '收到图片～不太确定是不是题目，要试试讲讲看吗？',
      buttons: [{ label: '试试讲讲', action: { type: 'solve_image', imageIndex: ambIdx } }],
      triageItems: [],
    };
  }

  const sceneryText = userText
    ? `收到${total > 1 ? ` ${total} 张` : ''}图片啦～有什么想和我说的吗？`
    : total > 1
      ? '收到多张图片啦～想和我分享点什么吗？'
      : '收到图片啦～拍得真好看，这是在哪里呀？';
  return { text: sceneryText, buttons: [], triageItems: [] };
}
