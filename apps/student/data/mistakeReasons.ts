import { MistakeItem } from '../types';

export type MistakeReasonKey =
  | 'misread'
  | 'concept_forgot'
  | 'concept_blur'
  | 'no_idea'
  | 'stuck'
  | 'calc_error'
  | 'formula_wrong'
  | 'time_short'
  | 'guess'
  | 'other';

export const MISTAKE_REASON_MAX_COUNT = 3;

export const MISTAKE_REASON_META: Record<
  MistakeReasonKey,
  { label: string; errorType: MistakeItem['errorType'] }
> = {
  misread: { label: '审题有误', errorType: '审题有误' },
  concept_forgot: { label: '知识点忘了', errorType: '知识点忘了' },
  concept_blur: { label: '概念模糊', errorType: '概念模糊' },
  no_idea: { label: '想不到思路', errorType: '想不到思路' },
  stuck: { label: '思路卡壳', errorType: '思路卡壳' },
  calc_error: { label: '计算出错', errorType: '计算出错' },
  formula_wrong: { label: '公式用错', errorType: '公式用错/条件不符' },
  time_short: { label: '时间不够', errorType: '时间不够做完' },
  guess: { label: '蒙的/不会', errorType: '蒙的/不会' },
  other: { label: '其它', errorType: '其它' },
};

export const MISTAKE_REASON_GROUPS: {
  title: string;
  reasons: MistakeReasonKey[];
}[] = [
  {
    title: '审题与知识',
    reasons: ['misread', 'concept_forgot', 'concept_blur'],
  },
  {
    title: '思路与计算',
    reasons: ['no_idea', 'stuck', 'calc_error', 'formula_wrong'],
  },
  {
    title: '其他',
    reasons: ['time_short', 'guess', 'other'],
  },
];

export const getMistakeReasonLabel = (key?: string | null): string | undefined => {
  if (!key) return undefined;
  const meta = MISTAKE_REASON_META[key as MistakeReasonKey];
  return meta?.label ?? key;
};

export const getMistakeReasonLabels = (keys: MistakeReasonKey[]): string[] =>
  keys.map((key) => MISTAKE_REASON_META[key]?.label ?? key);

/** 脚注区展示：最多展示前 2 项，超出显示「等 N 项」 */
export const formatMistakeReasonsDisplay = (keys: MistakeReasonKey[]): string => {
  if (keys.length === 0) return '';
  const labels = getMistakeReasonLabels(keys);
  if (labels.length <= 2) return labels.join('、');
  return `${labels.slice(0, 2).join('、')}等${labels.length}项`;
};
