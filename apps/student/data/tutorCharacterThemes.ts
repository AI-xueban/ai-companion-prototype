import avatarChangE from '@/assets/Avatar-嫦娥.jpg';
import avatarNezha from '@/assets/Avatar-哪吒.jpg';
import avatarHolmes from '@/assets/Avatar-福尔摩斯.jpg';
import avatarEinstein from '@/assets/Avatar-爱因斯坦.jpg';

export type TutorCharacterId = 'change' | 'nezha' | 'holmes' | 'einstein';

export interface TutorCharacterTheme {
  id: TutorCharacterId;
  name: string;
  badge: string;
  avatar: string;
  boardTitle: string;
  pageBg: string;
  pageGradient: string;
  headerBg: string;
  headerBorder: string;
  headerRing: string;
  backBtn: string;
  contentBg: string;
  cardBorder: string;
  cardRing: string;
  inputDivider: string;
  inputShell: string;
  inputField: string;
  inputFieldFocus: string;
  micBtn: string;
  accentBorder: string;
  accentGlow: string;
  accentText: string;
  accentWave: string;
  accentBrush: string;
  speechActive: string;
  speechIdle: string;
  speechHint: string;
  speechProgress: string;
  thinkingBox: string;
  boardOuter: string;
  boardBg: string;
  boardLineColor: string;
  boardHeader: string;
  boardPhaseBadge: string;
  boardEmpty: string;
  boardStepActive: string;
  boardStepDone: string;
  boardStepLabelActive: string;
  boardStepLabelDone: string;
  boardStepGuide: string;
  /** 板书书写工具：quill 羽毛笔 / fountain 钢笔 / brush 朱笔 / chalk 粉笔 */
  boardPen: 'quill' | 'fountain' | 'brush' | 'chalk';
}

export const TUTOR_CHARACTERS: TutorCharacterTheme[] = [
  {
    id: 'change',
    name: '嫦娥',
    badge: '🌙',
    avatar: avatarChangE,
    boardTitle: '广寒板书',
    pageBg: 'bg-amber-50/90',
    pageGradient: 'bg-gradient-to-b from-white via-amber-50/60 to-amber-100/40',
    headerBg: 'bg-white',
    headerBorder: 'border-amber-200/60',
    headerRing: 'ring-amber-100/80',
    backBtn: 'bg-amber-50 border-amber-200/70 hover:bg-amber-100',
    contentBg: 'bg-gradient-to-b from-amber-50/95 to-white',
    cardBorder: 'border-amber-200/60',
    cardRing: 'ring-amber-100/80',
    inputDivider: 'border-amber-200/50',
    inputShell: 'bg-white border-amber-200/60 ring-amber-100/80',
    inputField: 'bg-amber-50/50 border-amber-100',
    inputFieldFocus: 'focus-within:border-brand/50 focus-within:ring-brand/15',
    micBtn: 'bg-white border-amber-200 hover:bg-amber-50 hover:border-amber-300',
    accentBorder: 'border-amber-400',
    accentGlow: 'bg-amber-200/45',
    accentText: 'text-amber-800/70',
    accentWave: 'bg-amber-500/75',
    accentBrush: 'text-amber-600/80',
    speechActive: 'border-amber-300/70 bg-amber-50/95',
    speechIdle: 'border-slate-200/80 bg-white/95',
    speechHint: 'text-amber-700/80 border-amber-200/60',
    speechProgress: 'bg-amber-100 text-amber-800 border-amber-200/80',
    thinkingBox: 'border-sky-200/80 bg-sky-50/95',
    boardOuter: 'border-amber-200/40 shadow-[inset_0_2px_24px_rgba(120,80,30,0.08),0_8px_32px_rgba(0,0,0,0.12)]',
    boardBg: '#f7f2e8',
    boardLineColor: 'rgba(180,140,80,0.12)',
    boardHeader: 'text-amber-900/50',
    boardPhaseBadge: 'text-amber-800/60 bg-amber-100/50',
    boardEmpty: 'text-amber-900/30',
    boardStepActive: 'border-amber-400/50 bg-amber-50/80 ring-amber-300/30',
    boardStepDone: 'bg-white/30',
    boardStepLabelActive: 'bg-amber-200/80 text-amber-900',
    boardStepLabelDone: 'bg-emerald-100 text-emerald-700',
    boardStepGuide: 'text-amber-700/70',
    boardPen: 'quill',
  },
  {
    id: 'nezha',
    name: '哪吒',
    badge: '🔥',
    avatar: avatarNezha,
    boardTitle: '哪吒讲题',
    pageBg: 'bg-rose-50/90',
    pageGradient: 'bg-gradient-to-b from-white via-rose-50/70 to-orange-100/35',
    headerBg: 'bg-white',
    headerBorder: 'border-rose-200/70',
    headerRing: 'ring-rose-100/80',
    backBtn: 'bg-rose-50 border-rose-200/70 hover:bg-rose-100',
    contentBg: 'bg-gradient-to-b from-rose-50/95 to-white',
    cardBorder: 'border-rose-200/60',
    cardRing: 'ring-rose-100/80',
    inputDivider: 'border-rose-200/50',
    inputShell: 'bg-white border-rose-200/60 ring-rose-100/80',
    inputField: 'bg-rose-50/50 border-rose-100',
    inputFieldFocus: 'focus-within:border-rose-400/50 focus-within:ring-rose-200/30',
    micBtn: 'bg-white border-rose-200 hover:bg-rose-50 hover:border-rose-300',
    accentBorder: 'border-rose-400',
    accentGlow: 'bg-rose-200/45',
    accentText: 'text-rose-800/70',
    accentWave: 'bg-rose-500/75',
    accentBrush: 'text-rose-600/80',
    speechActive: 'border-rose-300/70 bg-rose-50/95',
    speechIdle: 'border-slate-200/80 bg-white/95',
    speechHint: 'text-rose-700/80 border-rose-200/60',
    speechProgress: 'bg-rose-100 text-rose-800 border-rose-200/80',
    thinkingBox: 'border-orange-200/80 bg-orange-50/95',
    boardOuter: 'border-rose-200/40 shadow-[inset_0_2px_24px_rgba(180,60,40,0.08),0_8px_32px_rgba(0,0,0,0.1)]',
    boardBg: '#fef2f0',
    boardLineColor: 'rgba(220,120,90,0.12)',
    boardHeader: 'text-rose-900/50',
    boardPhaseBadge: 'text-rose-800/60 bg-rose-100/50',
    boardEmpty: 'text-rose-900/30',
    boardStepActive: 'border-rose-400/50 bg-rose-50/80 ring-rose-300/30',
    boardStepDone: 'bg-white/30',
    boardStepLabelActive: 'bg-rose-200/80 text-rose-900',
    boardStepLabelDone: 'bg-emerald-100 text-emerald-700',
    boardStepGuide: 'text-rose-700/70',
    boardPen: 'brush',
  },
  {
    id: 'holmes',
    name: '福尔摩斯',
    badge: '🔍',
    avatar: avatarHolmes,
    boardTitle: '推理板书',
    pageBg: 'bg-slate-100/90',
    pageGradient: 'bg-gradient-to-b from-white via-slate-100/70 to-indigo-100/30',
    headerBg: 'bg-white',
    headerBorder: 'border-slate-200/70',
    headerRing: 'ring-slate-100/80',
    backBtn: 'bg-slate-50 border-slate-200/70 hover:bg-slate-100',
    contentBg: 'bg-gradient-to-b from-slate-50/95 to-white',
    cardBorder: 'border-slate-200/60',
    cardRing: 'ring-slate-100/80',
    inputDivider: 'border-slate-200/50',
    inputShell: 'bg-white border-slate-200/60 ring-slate-100/80',
    inputField: 'bg-slate-50/50 border-slate-200',
    inputFieldFocus: 'focus-within:border-indigo-400/50 focus-within:ring-indigo-200/30',
    micBtn: 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    accentBorder: 'border-indigo-400',
    accentGlow: 'bg-indigo-200/40',
    accentText: 'text-indigo-800/70',
    accentWave: 'bg-indigo-500/75',
    accentBrush: 'text-indigo-600/80',
    speechActive: 'border-indigo-300/70 bg-indigo-50/95',
    speechIdle: 'border-slate-200/80 bg-white/95',
    speechHint: 'text-indigo-700/80 border-indigo-200/60',
    speechProgress: 'bg-indigo-100 text-indigo-800 border-indigo-200/80',
    thinkingBox: 'border-indigo-200/80 bg-indigo-50/95',
    boardOuter: 'border-slate-300/40 shadow-[inset_0_2px_24px_rgba(60,70,100,0.08),0_8px_32px_rgba(0,0,0,0.1)]',
    boardBg: '#f0f2f6',
    boardLineColor: 'rgba(100,110,140,0.12)',
    boardHeader: 'text-slate-700/50',
    boardPhaseBadge: 'text-indigo-800/60 bg-indigo-100/50',
    boardEmpty: 'text-slate-700/30',
    boardStepActive: 'border-indigo-400/50 bg-indigo-50/80 ring-indigo-300/30',
    boardStepDone: 'bg-white/30',
    boardStepLabelActive: 'bg-indigo-200/80 text-indigo-900',
    boardStepLabelDone: 'bg-emerald-100 text-emerald-700',
    boardStepGuide: 'text-indigo-700/70',
    boardPen: 'fountain',
  },
  {
    id: 'einstein',
    name: '爱因斯坦',
    badge: '⚛️',
    avatar: avatarEinstein,
    boardTitle: '科学板书',
    pageBg: 'bg-sky-50/90',
    pageGradient: 'bg-gradient-to-b from-white via-sky-50/70 to-blue-100/35',
    headerBg: 'bg-white',
    headerBorder: 'border-sky-200/70',
    headerRing: 'ring-sky-100/80',
    backBtn: 'bg-sky-50 border-sky-200/70 hover:bg-sky-100',
    contentBg: 'bg-gradient-to-b from-sky-50/95 to-white',
    cardBorder: 'border-sky-200/60',
    cardRing: 'ring-sky-100/80',
    inputDivider: 'border-sky-200/50',
    inputShell: 'bg-white border-sky-200/60 ring-sky-100/80',
    inputField: 'bg-sky-50/50 border-sky-100',
    inputFieldFocus: 'focus-within:border-sky-400/50 focus-within:ring-sky-200/30',
    micBtn: 'bg-white border-sky-200 hover:bg-sky-50 hover:border-sky-300',
    accentBorder: 'border-sky-400',
    accentGlow: 'bg-sky-200/45',
    accentText: 'text-sky-800/70',
    accentWave: 'bg-sky-500/75',
    accentBrush: 'text-sky-600/80',
    speechActive: 'border-sky-300/70 bg-sky-50/95',
    speechIdle: 'border-slate-200/80 bg-white/95',
    speechHint: 'text-sky-700/80 border-sky-200/60',
    speechProgress: 'bg-sky-100 text-sky-800 border-sky-200/80',
    thinkingBox: 'border-blue-200/80 bg-blue-50/95',
    boardOuter: 'border-sky-200/40 shadow-[inset_0_2px_24px_rgba(40,100,180,0.08),0_8px_32px_rgba(0,0,0,0.1)]',
    boardBg: '#eef6fc',
    boardLineColor: 'rgba(80,140,200,0.12)',
    boardHeader: 'text-sky-900/50',
    boardPhaseBadge: 'text-sky-800/60 bg-sky-100/50',
    boardEmpty: 'text-sky-900/30',
    boardStepActive: 'border-sky-400/50 bg-sky-50/80 ring-sky-300/30',
    boardStepDone: 'bg-white/30',
    boardStepLabelActive: 'bg-sky-200/80 text-sky-900',
    boardStepLabelDone: 'bg-emerald-100 text-emerald-700',
    boardStepGuide: 'text-sky-700/70',
    boardPen: 'chalk',
  },
];

export function getTutorCharacter(id: TutorCharacterId): TutorCharacterTheme {
  return TUTOR_CHARACTERS.find((c) => c.id === id) ?? TUTOR_CHARACTERS[0];
}

export function nextTutorCharacter(id: TutorCharacterId): TutorCharacterTheme {
  const idx = TUTOR_CHARACTERS.findIndex((c) => c.id === id);
  return TUTOR_CHARACTERS[(idx + 1) % TUTOR_CHARACTERS.length];
}
