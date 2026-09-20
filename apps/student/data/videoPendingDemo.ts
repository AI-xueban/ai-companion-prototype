/**
 * §7.8.3 视频未上线 / 正在上架中 —— 演示配置。
 *
 * 和 playbackErrorDemo 的区别：
 * - playbackErrorDemo = 视频已上架但播不了（链接失效 / 加载失败 / 网络超时），走播放器内「暂时无法播放」+ 重试。
 * - videoPendingDemo   = 视频元数据已在目录里（学习路径列得出条目），但背后资源还没上架 / 未过审，
 *                         学习页直接拦住不进播放器，条目标「未上线」，一课一练保留。
 *
 * 当前演示对象：九年级上册语文第六单元（23 曹刿论战 / 24* 邹忌讽齐王纳谏 / 25* 陈涉世家 /
 * 26 出师表 / 27 诗词曲五首），整单元所有课文学习页全部视频未上线。
 */

export interface VideoPendingUnitKey {
  subject: string;
  grade: string;
  term: string;
  /** 章标题 / 单元标题，和 syncLessons[i].unit / catalogUnit.title 对齐，如「第六单元」 */
  unit: string;
}

/** 被标记为「视频未上线」的单元清单。匹配时 subject/grade/term/unit 都要相等。 */
export const VIDEO_PENDING_UNITS: VideoPendingUnitKey[] = [
  { subject: '语文', grade: '九年级', term: '上册', unit: '第六单元' },
  // 英语九年级人教版 Unit 14：走 §7.8.1 空态（SyncEmptySectionState），不走 §7.8.3 banner
  { subject: '英语', grade: '九年级', term: '全一册', unit: 'Unit 14 I remember meeting all of you in Grade 7' },
];

/** 演示用课文小标题（出现在学习页条目 / 播放器标题里时也认）。 */
export const VIDEO_PENDING_DEMO_LESSON_TITLE = '视频未上线演示';

function norm(text?: string | null) {
  return (text ?? '').trim();
}

/** 某个章 / 单元是否整体「视频未上线」。 */
export function isVideoPendingUnit(
  subject?: string | null,
  grade?: string | null,
  term?: string | null,
  unitTitle?: string | null,
): boolean {
  const s = norm(subject);
  const g = norm(grade);
  const t = norm(term);
  const u = norm(unitTitle);
  if (!s || !g || !t || !u) return false;
  return VIDEO_PENDING_UNITS.some(
    (item) =>
      item.subject === s &&
      item.grade === g &&
      item.term === t &&
      item.unit === u,
  );
}

/** 某一课 / 小节是否「视频未上线」。只要它所属单元是 pending，整课都算。 */
export function isVideoPendingSection(
  subject?: string | null,
  grade?: string | null,
  term?: string | null,
  unitTitle?: string | null,
  _sectionTitle?: string | null,
): boolean {
  return isVideoPendingUnit(subject, grade, term, unitTitle);
}

/** 演示课文标题命中（和 playbackErrorDemo 的 isPlaybackErrorDemoText 同构，便于在 SubjectMap 里一并排除）。 */
export function isVideoPendingDemoText(idOrTitle?: string | null): boolean {
  if (!idOrTitle) return false;
  return idOrTitle.includes(VIDEO_PENDING_DEMO_LESSON_TITLE);
}
