/** 课本同步学 · 非语文视频标签归类（阅读版 §7.4.1） */

export type SyncLearnPhase = 'learn' | 'practice';

export interface SyncVideoTagContext {
  subject: string;
  /** 章 / 单元名 */
  unitTitle?: string;
  /** 课 / 节名（学习页顶栏） */
  lessonTitle?: string;
  /** 分组小节名（如物理「知识点」、道法课时名） */
  sectionTitle?: string;
}

export interface SyncVideoTagResult {
  /** 展示用标签，可多个（如 题型讲解、知识精讲） */
  displayTags: string[];
  phase: SyncLearnPhase;
  /** 是否落入科目「其他」 */
  isOther: boolean;
}

const normalize = (text: string) =>
  text
    .replace(/\u3000/g, ' ')
    .replace(/＿/g, '_')
    .trim();

const stripNoise = (text: string) =>
  normalize(text)
    .replace(/^初中(数学|语文|英语|物理|化学|生物|地理|历史|科学)-/, '')
    .trim();

function similarToContext(raw: string, ctx: SyncVideoTagContext): boolean {
  const t = stripNoise(raw);
  if (!t) return false;
  const candidates = [ctx.lessonTitle, ctx.sectionTitle, ctx.unitTitle]
    .filter(Boolean)
    .map((item) => stripNoise(item!));
  return candidates.some((candidate) => {
    if (!candidate) return false;
    if (t === candidate) return true;
    const short = candidate.replace(/^第[一二三四五六七八九十百千\d]+(单元|章|节|课|课时|课题)\s*/, '');
    if (short && (t === short || short.includes(t) || t.includes(short))) return true;
    return false;
  });
}

function subjectOtherLabel(subject: string): string {
  if (subject === '道法') return '道德与法治其他';
  if (subject === '道德与法治') return '道德与法治其他';
  return `${subject}其他`;
}

function phaseForTags(tags: string[]): SyncLearnPhase {
  // 双标签「题型讲解、知识精讲」统一放学
  if (tags.includes('题型讲解') && tags.includes('知识精讲')) return 'learn';
  const learn = new Set(['视频精讲', '知识梳理', '知识精讲', '知识点精讲', '课文精讲', '实验探究']);
  if (tags.some((tag) => learn.has(tag))) return 'learn';
  return 'practice';
}

/**
 * 按 §7.4.1 优先级匹配展示标签与学/练模块。
 * source：原始 videoTag / title / 分组名拼在一起的判据文案。
 */
export function resolveOtherSubjectVideoTag(
  source: string,
  ctx: SyncVideoTagContext,
): SyncVideoTagResult {
  const subject = ctx.subject === '道法' ? '道德与法治' : ctx.subject;
  const raw = stripNoise(source);
  const blob = [
    raw,
    ctx.sectionTitle ? stripNoise(ctx.sectionTitle) : '',
  ].filter(Boolean).join(' ');

  const hit = (tags: string[]): SyncVideoTagResult => ({
    displayTags: tags,
    phase: phaseForTags(tags),
    isOther: false,
  });

  // 1 视频精讲
  if (/视频精讲/.test(blob)) return hit(['视频精讲']);
  // 2 中考链接
  if (blob.includes('中考链接')) return hit(['中考链接']);
  // 3 知识梳理
  if (blob.includes('知识梳理')) return hit(['知识梳理']);
  // 4 综合提升
  if (/综合提升训练|综合提升/.test(blob)) return hit(['综合提升训练']);
  // 4b 数学等存量「拓展提升」归练
  if (blob.includes('拓展提升')) return hit(['拓展提升']);
  // 5 新课标新考法
  if (blob.includes('新课标新考法')) return hit(['新课标新考法']);
  // 6 重难点练习
  if (blob.includes('重难点练习')) return hit(['重难点练习']);
  // 7 实验 / 探究
  if (/实验活动|实验操作|实验|探究/.test(blob)) return hit(['实验探究']);
  // 8 真题 + 易错
  if (blob.includes('真题') && /易错/.test(blob)) return hit(['真题易、错题点拨']);
  // 9 真题
  if (blob.includes('真题')) return hit(['真题点拨']);
  // 10 易错
  if (/易错题|易错点|易错误区|易错：/.test(blob)) return hit(['易错题点拨']);
  // 11 知识精讲 + 题型
  if (/知识精讲|知识点/.test(blob) && /经典题型|题型/.test(blob)) {
    return hit(['题型讲解', '知识精讲']);
  }
  // 12 知识精讲 / 知识点
  if (/知识精讲|知识点/.test(blob)) return hit(['知识精讲']);
  // 物理分组「知识点」本身
  if (ctx.sectionTitle === '知识点' || ctx.sectionTitle === '题型' || ctx.sectionTitle === '易错') {
    if (ctx.sectionTitle === '知识点') return hit(['知识精讲']);
    if (ctx.sectionTitle === '题型') return hit(['题型讲解']);
    if (ctx.sectionTitle === '易错') return hit(['易错题点拨']);
  }
  // 13 题型 / 经典题型
  if (/经典题型|题型/.test(blob)) return hit(['题型讲解']);
  // 14 数学模型
  if (/(8字|倍长中线|半角|模型)/.test(blob) && /模型/.test(blob)) return hit(['知识点精讲']);
  // 15 习题
  if (/习题|_习题/.test(blob)) return hit(['题型讲解']);

  // 学科专属
  if (subject === '历史' || subject === '道德与法治') {
    if (similarToContext(raw, ctx)) return hit(['课文精讲']);
    return {
      displayTags: [subjectOtherLabel(subject)],
      phase: 'learn',
      isOther: true,
    };
  }
  if (subject === '地理') {
    // 「第一课 / 第一课时 / 第1课 / 第1课时」
    if (/第[一二三四五六七八九十百千\d]+课/.test(raw)) return hit(['课文精讲']);
    return {
      displayTags: ['地理其他'],
      phase: 'learn',
      isOther: true,
    };
  }

  return {
    displayTags: [subjectOtherLabel(subject || '学科')],
    phase: 'learn',
    isOther: true,
  };
}

/** 从原始文案里抠出主标题（去掉已识别的类型尾缀） */
export function stripVideoNameFromSource(source: string, displayTags: string[]): string {
  let name = stripNoise(source)
    .replace(/\s*[·\-]\s*/g, ' · ')
    .trim();

  // `主题_知识精讲` / `主题 · 知识精讲`
  const suffixPatterns = [
    '视频精讲',
    '中考链接',
    '知识梳理',
    '综合提升训练',
    '综合提升',
    '新课标新考法',
    '重难点练习',
    '实验探究',
    '真题点拨',
    '易错题点拨',
    '题型讲解',
    '知识精讲',
    '知识点精讲',
    '经典题型',
    '同步巩固练',
    '拓展提升',
  ];
  for (const suffix of suffixPatterns) {
    name = name
      .replace(new RegExp(`(?:\\s*[·\\-_／/]\\s*)${suffix}\\d*$`), '')
      .replace(new RegExp(`_${suffix}$`), '')
      .trim();
  }

  if (displayTags.length === 1 && name === displayTags[0]) return name;
  if (!name) return stripNoise(source) || '同步微课';
  // 若主标题仍是整段且等于某一展示标签，保留原样
  return name;
}
