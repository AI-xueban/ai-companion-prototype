import { ZhiyueRecord } from './types';

const SAMPLE_SELF_GRADE = {
  '0:q7': {
    systemGrade: 'incorrect' as const,
    systemAt: new Date(2026, 4, 14, 20, 12, 12).getTime(),
    userGrade: 'correct' as const,
    userAt: new Date(2026, 4, 14, 20, 18, 12).getTime(),
    step: 'done' as const,
  },
};

export const INITIAL_ZHIYUE_RECORDS: ZhiyueRecord[] = [
  { id: 'r-0429-1', dateKey: '2026-04-29', dateLabel: '2026年4月29日', time: '12:12', mode: 'single', pageCount: 1, questionGrades: SAMPLE_SELF_GRADE },
  { id: 'r-0429-2', dateKey: '2026-04-29', dateLabel: '2026年4月29日', time: '12:12', mode: 'multi', pageCount: 2 },
  { id: 'r-0428-1', dateKey: '2026-04-28', dateLabel: '2026年4月28日', time: '13:12', mode: 'single', pageCount: 1 },
  { id: 'r-0428-2', dateKey: '2026-04-28', dateLabel: '2026年4月28日', time: '13:12', mode: 'multi', pageCount: 2 },
  { id: 'r-0428-3', dateKey: '2026-04-28', dateLabel: '2026年4月28日', time: '13:12', mode: 'single', pageCount: 1 },
  { id: 'r-0427-1', dateKey: '2026-04-27', dateLabel: '2026年4月27日', time: '13:12', mode: 'single', pageCount: 1 },
];

export const formatRecordDate = (date: Date) => {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dateLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return { dateKey, dateLabel, time };
};
