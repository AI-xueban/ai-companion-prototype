import { QuestionType } from './types';

export const getQuestionTypeLabel = (type: QuestionType): string => {
  const map: Record<QuestionType, string> = {
    single_choice: '单选',
    multiple_choice: '多选',
    fill_in_blank: '填空',
    true_false: '判断',
    // 英语专项
    listening_choice: '听力选择',
    listening_blank: '听力填空',
    listening_match: '听力匹配',
    listening_judge: '听力判断',
    listening_sort: '听力排序',
    phonics: '语音题',
    spelling: '单词拼写',
    grammar_choice: '语法选择',
    word_choice: '单项选择',
    cloze_choice: '选词填空',
    sentence_completion: '完成句子',
    situation: '情景运用',
    reading_comp: '阅读理解',
    task_reading: '任务型阅读',
    short_cloze: '短文填空',
    dialogue_fill: '补全对话',
    translation: '翻译',
    correction: '改错',
    accumulation: '积累运用',
    dictation: '默写',
    integrated_learning: '综合性学习',
    classical_reading: '文言文阅读',
    poem_reading: '诗歌阅读',
  };
  return map[type] || '题目';
};
