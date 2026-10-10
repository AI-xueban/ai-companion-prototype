export interface RealPrintQuestionSample {
  sourceId: string;
  subject: string;
  type: string;
  stem: string;
  options?: string[];
  knowledgePoint: string;
  sourceLabel: string;
  imageUrl?: string;
}

/** 用户提供的菁优网题目接口数据，经过去重和页面展示字段归一化。 */
export const REAL_PRINT_QUESTION_SAMPLES: RealPrintQuestionSample[] = [
  {
    sourceId: '2102761412093198337', subject: '语文', type: '选择题', knowledgePoint: '选字词填空', sourceLabel: '2024秋·同步',
    stem: '看图选择汉字正确的一项是（　　）\n①我　②你　③他\n谢谢___　___来拿　___们三个',
    options: ['②①③', '①③②', '③①②'],
    imageUrl: 'http://img.jyeoo.net/quiz/images/202308/343/9e71d27b.png',
  },
  {
    sourceId: '2102760416076021762', subject: '语文', type: '选择题', knowledgePoint: '词语归类或排列', sourceLabel: '2026秋·同步',
    stem: '识字加油站。下列按时间先后顺序排列，正确的一项是（　　）',
    options: ['这个月→下个月→上个月', '去年→今年→明年', '今天晚上→昨天上午→明天下午'],
  },
  {
    sourceId: '2102756226192818177', subject: '语文', type: '填空题', knowledgePoint: '修辞手法', sourceLabel: '2024秋·阜城县期中',
    stem: '指出下列句子运用的修辞手法。\n（1）山上的矮松越发青黑，树尖儿上顶着一髻儿白花，好像日本看护妇。\n（2）那点儿薄雪好像忽然害了羞，微微露出点儿粉色。\n（3）整个的是块空灵的蓝水晶。',
  },
  {
    sourceId: '2102755841190641665', subject: '语文', type: '选择题', knowledgePoint: '易误读常见字', sourceLabel: '2025秋·同步',
    stem: '下列加点字注音有误的一项是（　　）',
    options: ['蝉声（chán）　粗犷（guǎng）　屋檐（yán）', '花苞（bāo）　睫毛（jié）　莅临（lì）', '棱镜（líng）　冷冽（liè）　池畦（qí）', '娇媚（mèi）　静谧（mì）　吝啬（lìn）'],
  },
  {
    sourceId: '2102759671884603393', subject: '数学', type: '判断题', knowledgePoint: '1—5的认识', sourceLabel: '2023秋·邓州市期末',
    stem: '“第5个”和“有5个”中的“5”表示的意思相同。（判断对错）',
    options: ['正确', '错误'],
  },
  {
    sourceId: '2102759633825742850', subject: '数学', type: '填空题', knowledgePoint: '1—5的认识', sourceLabel: '2024秋·太和县期末',
    stem: '与1相邻的两个数分别是 ______ 和 ______。',
  },
  {
    sourceId: '2102759587918831618', subject: '数学', type: '选择题', knowledgePoint: '1—5的认识', sourceLabel: '2025秋·陆川县期末',
    stem: '云云说：“我有5只小鸭。”路路说：“我的小鸭只数和你的一样多。”路路有（　　）只小鸭。',
    options: ['3', '5', '7'],
  },
  {
    sourceId: '2102757228517974018', subject: '数学', type: '选择题', knowledgePoint: '平面图形的分类及识别', sourceLabel: '2025春·同步',
    stem: '下面哪个图形不能在钉子板上围出来？（　　）',
    options: ['长方形', '平行四边形', '圆'],
  },
  {
    sourceId: '2102678141816082434', subject: '数学', type: '填空题', knowledgePoint: '平面图形的分类及识别', sourceLabel: '同步练习',
    stem: '春天来了，小火车在森林中欢快地行驶。数一数：正方形有____个，长方形有____个，平行四边形有____个，三角形有____个，圆有____个。',
  },
  {
    sourceId: '2102757174348791810', subject: '英语', type: '选择题', knowledgePoint: '词汇词性分类', sourceLabel: '2018秋·同步',
    stem: '找出下列每组单词中不同类的选项。（　　）',
    options: ['one', 'two', 'first'],
  },
  {
    sourceId: '2102760318994661377', subject: '生物', type: '选择题', knowledgePoint: '观察植物', sourceLabel: '2017秋·甘肃期中',
    stem: '水生植物的共同特征是（　　）',
    options: ['生长在水里', '都需要土壤', '都不开花'],
  },
];

export const getRealPrintQuestionSamples = (subject: string) => {
  const exact = REAL_PRINT_QUESTION_SAMPLES.filter((item) => item.subject === subject);
  return exact.length > 0 ? exact : REAL_PRINT_QUESTION_SAMPLES;
};
