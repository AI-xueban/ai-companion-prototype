import type { PaperPdfQuestion } from '../components/LumiSpace/lumiPaperPdf';

export type LumiInlineDemoKind = 'print' | 'image';
export const INLINE_DEMO_PROMPTS = {
  print: '帮我出 3 道一元一次方程练习题',
  image: '帮我画一只在月球上看书的小猫，水彩风格',
};
export const INLINE_DEMO_QUESTIONS: PaperPdfQuestion[] = [
  { id: 1, type: '解答题', stem: '解方程：2x + 5 = 17', score: 10, answer: 'x = 6', explanation: '移项得 2x = 12，两边除以 2，得 x = 6。' },
  { id: 2, type: '解答题', stem: '解方程：3x − 4 = 11', score: 10, answer: 'x = 5', explanation: '移项得 3x = 15，两边除以 3，得 x = 5。' },
  { id: 3, type: '解答题', stem: '解方程：5(x − 1) = 20', score: 10, answer: 'x = 5', explanation: '两边除以 5，得 x − 1 = 4，所以 x = 5。' },
];
