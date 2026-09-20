/**
 * 组卷题型 Mock。
 *
 * 题型字典来自「菁优网题型相关数据/初中*.txt」；该原始文件只定义学科题型，
 * 不含知识点维度的可用数量。本服务以已选章节/知识点生成稳定的 Mock 库存，
 * 后续接入题库接口时，保持 getPrintQuestionTypeAvailability 的返回结构即可替换。
 */
export interface PrintQuestionTypeAvailability {
  name: string;
  availableCount: number;
}

const JYEOO_JUNIOR_QUESTION_TYPES: Record<string, string[]> = {
  道德与法治: ['选择题', '填空题', '多选题', '判断题', '简答题', '辨析题', '评析题', '阐述见解题', '材料分析题', '判断说理题', '情境探究题', '分析说明题', '综合探究题'],
  地理: ['选择题', '多选题', '判断题', '填空题', '连线题', '解答题'],
  化学: ['选择题', '多选题', '选择填充题', '判断题', '填空题', '实验题', '推断题', '工艺流程题', '科普阅读题', '科学探究题', '综合应用题', '解答题', '计算题'],
  科学: ['选择题', '填空题', '多选题', '判断题', '作图题', '实验探究题', '计算题', '推断题', '解答题', '连线题'],
  历史: ['选择题', '填空题', '多选题', '辨析题', '材料题', '解答题', '判断题', '论述题'],
  生物: ['选择题', '多选题', '判断题', '填空题', '实验探究题', '解答题', '材料分析题'],
  数学: ['选择题', '多选题', '填空题', '解答题', '判断题'],
  物理: ['选择题', '多选题', '填空题', '选择说明题', '判断题', '作图题', '简答题', '实验探究题', '解答题', '计算题', '综合能力题', '科普阅读题'],
  英语: ['听说题', '听力题', '听力填空', '听力匹配', '听力判断', '听力排序', '语音题', '选择题', '语法选择', '完形填空', '阅读理解', '短文还原', '任务型阅读', '补全对话', '单句选词', '选词填空', '短文填空', '语法填空', '用所给单词正确形式填空', '单词拼写', '根据汉语提示完成句子', '句型转换', '连词成句', '情景运用', '句子排序', '翻译题', '阅读翻译', '单句改错', '短文改错', '抄写题', '书面表达', '解答题', '填空题', '词汇应用', '完成句子'],
  语文: ['选择题', '填空题', '多选题', '汉字书写', '解答题', '翻译', '基础知识', '默写', '语言运用', '综合读写', '名著阅读', '现代文阅读', '古诗词赏析', '文言文阅读', '作文', '综合性学习'],
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** 返回本次已选范围内可组卷的题型及可用数量。 */
export function getPrintQuestionTypeAvailability(
  subject: string | undefined,
  selectedScopeLabels: string[] = [],
): PrintQuestionTypeAvailability[] {
  const catalog = JYEOO_JUNIOR_QUESTION_TYPES[subject ?? ''] ?? ['选择题', '填空题', '解答题'];
  const scopeKey = [...selectedScopeLabels].sort().join('|') || '默认范围';
  const hash = stableHash(`${subject ?? ''}|${scopeKey}`);
  const typeCount = Math.min(catalog.length, Math.max(2, 2 + (hash % 3)));
  const start = hash % catalog.length;

  return Array.from({ length: typeCount }, (_, index) => {
    const name = catalog[(start + index) % catalog.length];
    return { name, availableCount: 3 + ((hash >>> (index * 3)) % 10) };
  });
}
