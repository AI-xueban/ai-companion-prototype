/** 语文知识图谱 · 展示方案注册表（预览实验室 + 主应用切换） */

export type ChineseGraphSchemeId =
  | 'legacy-default'
  | 'a-chapter'
  | 'a-chapter-lesson'
  | 'a-directory'
  | 'b-scheme-e'
  | 'c-scheme-d'
  | 'd-lesson-list'
  | 'e-dual-view'
  | 'classic-force';

export type ChineseSchemeGroupId =
  | 'legacy'
  | 'direction-a'
  | 'direction-b'
  | 'direction-c'
  | 'direction-d'
  | 'direction-e'
  | 'classic';

export interface ChineseGraphSchemeMeta {
  id: ChineseGraphSchemeId;
  group: ChineseSchemeGroupId;
  label: string;
  shortLabel: string;
  description: string;
  /** 推荐学段 */
  recommendedFor: 'primary' | 'middle' | 'both';
  badge?: string;
}

export const CHINESE_SCHEME_GROUPS: { id: ChineseSchemeGroupId; label: string }[] = [
  { id: 'legacy', label: '原有方案' },
  { id: 'direction-a', label: '方向 A · 能力气泡' },
  { id: 'direction-b', label: '方向 B · 关系树' },
  { id: 'direction-c', label: '方向 C · 聚焦下钻' },
  { id: 'direction-d', label: '方向 D · 课文清单' },
  { id: 'direction-e', label: '方向 E · 双视图' },
  { id: 'classic', label: '经典方案' },
];

export const CHINESE_GRAPH_SCHEMES: ChineseGraphSchemeMeta[] = [
  {
    id: 'legacy-default',
    group: 'legacy',
    label: '原有默认 · 单元能力气泡',
    shortLabel: '原有默认',
    description: '当前线上语文主视图：单元 scope + 章节知识点气泡，可切换能力目录。',
    recommendedFor: 'primary',
    badge: '当前',
  },
  {
    id: 'a-chapter',
    group: 'direction-a',
    label: '方向 A · 章节知识点气泡',
    shortLabel: 'A · 章节气泡',
    description: '按当前单元挂载点分组，大圆=能力域，圆内=可练原子点，颜色=掌握度。',
    recommendedFor: 'primary',
  },
  {
    id: 'a-chapter-lesson',
    group: 'direction-a',
    label: '方向 A · 单元/课文能力气泡',
    shortLabel: 'A · 单元课文',
    description: 'A 章节气泡 + 左侧切换章节：展开单元后选「整单元概览」或单篇课文，画布仅展示能力气泡。',
    recommendedFor: 'primary',
    badge: '推荐',
  },
  {
    id: 'a-directory',
    group: 'direction-a',
    label: '方向 A · 整册能力目录气泡',
    shortLabel: 'A · 能力目录',
    description: '不按单元过滤，展示整册 knowledge_tree 顶层四大能力域及子项。',
    recommendedFor: 'both',
  },
  {
    id: 'b-scheme-e',
    group: 'direction-b',
    label: '方向 B · 方案 E 关系树',
    shortLabel: 'B · 关系树',
    description: 'theme 空心圆环 + knowledge 实心 + testing 小点，左→右树形布局，与数学框架一致。',
    recommendedFor: 'middle',
  },
  {
    id: 'c-scheme-d',
    group: 'direction-c',
    label: '方向 C · 方案 D 聚焦下钻',
    shortLabel: 'C · 聚焦下钻',
    description: '节点 >20 默认折叠到主题层；点击 KnowledgeNode 镜头聚焦并展开一层子节点。',
    recommendedFor: 'middle',
  },
  {
    id: 'd-lesson-list',
    group: 'direction-d',
    label: '方向 D · 课文清单 + 能力标签',
    shortLabel: 'D · 课文清单',
    description: '按 catalog_tree 课文卡片排列，每篇课文挂 0–N 个能力标签，零图谱学习成本。',
    recommendedFor: 'primary',
  },
  {
    id: 'e-dual-view',
    group: 'direction-e',
    label: '方向 E · 双视图（能力总览 | 课文对照）',
    shortLabel: 'E · 双视图',
    description: '顶部切换「能力总览」与「课文对照」，兼顾单元掌握与课文定位。',
    recommendedFor: 'both',
  },
  {
    id: 'classic-force',
    group: 'classic',
    label: '经典版 · 统一圆点力导向图',
    shortLabel: '经典力导向',
    description: '关闭方案 D/E 增强：统一圆点 + 力导向布局，三科最早原型效果。',
    recommendedFor: 'both',
  },
];

export const CHINESE_SCHEME_STORAGE_KEY = 'kg-chinese-display-scheme';

export function getChineseSchemeMeta(id: ChineseGraphSchemeId): ChineseGraphSchemeMeta {
  return CHINESE_GRAPH_SCHEMES.find(s => s.id === id) ?? CHINESE_GRAPH_SCHEMES[0];
}

export function readStoredChineseScheme(): ChineseGraphSchemeId {
  try {
    const raw = localStorage.getItem(CHINESE_SCHEME_STORAGE_KEY);
    if (raw && CHINESE_GRAPH_SCHEMES.some(s => s.id === raw)) {
      if (raw === 'legacy-default' || raw === 'a-chapter') {
        return 'a-chapter-lesson';
      }
      return raw as ChineseGraphSchemeId;
    }
  } catch {
    /* ignore */
  }
  return 'a-chapter-lesson';
}

export function writeStoredChineseScheme(id: ChineseGraphSchemeId) {
  localStorage.setItem(CHINESE_SCHEME_STORAGE_KEY, id);
}

export function schemesByGroup(group: ChineseSchemeGroupId): ChineseGraphSchemeMeta[] {
  return CHINESE_GRAPH_SCHEMES.filter(s => s.group === group);
}
