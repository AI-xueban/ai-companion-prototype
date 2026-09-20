import { QuestionItem } from './types';

// 语文题库（示例占位，可继续补充）
export const chineseQuestions: QuestionItem[] = [
  {
    id: 'q-cn-001',
    subject: 'chinese',
    type: 'classical_reading',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['1 沁园春·雪/毛泽东', '词义理解'],
    tags: ['文言文', '基础'],
    content: {
      stem: '下列对“乃”字用法判断正确的是：',
      options: ['A. 才', 'B. 于是', 'C. 竟然', 'D. 就']
    },
    result: { correctAnswer: 'B', explanation: '此处“乃”表承接，可译为“于是”。' },
    cognitiveState: 'FADED'
  },
  {
    id: 'q-cn-002',
    subject: 'chinese',
    type: 'dictation',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['作文-立意', '审题'],
    tags: ['写作', '思路'],
    content: {
      stem: '请写出一个以“坚持”立意的论证核心句：________。'
    },
    result: { correctAnswer: '示例：坚持是抵达理想的必经之路。', explanation: '考查立意与表述，答案开放，需契合主题。' },
    cognitiveState: 'GAP'
  },
  // 积累运用
  {
    id: 'cn-acc-001',
    subject: 'chinese',
    type: 'accumulation',
    difficulty: 2,
    category: 'typical',
    knowledgePoints: ['成语-情感类'],
    tags: ['积累运用'],
    content: { stem: '填入最恰当的成语：看到旧友重逢，他不禁_____。', options: ['喜出望外', '无动于衷', '垂头丧气', '怒不可遏'] },
    result: { correctAnswer: '喜出望外', explanation: '重逢情境对应喜悦。' },
    cognitiveState: 'GAP'
  },
  {
    id: 'cn-acc-002',
    subject: 'chinese',
    type: 'accumulation',
    difficulty: 3,
    category: 'synchronous',
    knowledgePoints: ['病句-搭配不当'],
    tags: ['积累运用'],
    content: { stem: '下列句子中，没有语病的一项是：', options: ['A. 我认为这个观点是正确的。', 'B. 通过这次活动，使我收获很大。', 'C. 老师和我们都参加了这次演出。', 'D. 经过讨论，问题已经基本解决了。'] },
    result: { correctAnswer: 'D', explanation: 'A 赘词“我认为”；B 成分残缺；C 主谓搭配问题；D 通顺。' },
    cognitiveState: 'FADED'
  },
  {
    id: 'cn-acc-003',
    subject: 'chinese',
    type: 'accumulation',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['病句-结构不完整', '病句-搭配不当'],
    tags: ['积累运用', '病句', '非遗'],
    content: {
      stem: `1. 非遗保护我关注
近年来，①跨界融合与数字赋能等非遗保护方式，赋予了传统文化新的时代元素，促进传统文化创新性发展。例如，在中医药领域，②创办虚拟的中草药体验场景，丰富受众参与式互动体验，增强中草药文化的传播效果，促进中药产业的发展；在古乐器领域，使用数控机床的乐器制造、3D建模等方式修复古乐器，用AI技术复原音色，实现中国古乐器声音频谱的版权认证。此外，北京乐器研究所将古乐器复原与非遗技艺相结合，把“燕京八绝”中的金漆镶嵌、景泰蓝等技艺用在被复原的琴上，使乐器成了“行走的展览品”和“移动的非遗博物馆”。
文段中的两处画线句均存在问题，你做出修改。
①改为________
②改为________`,
      subQuestions: [
        { question: '①改为', options: [], answer: '跨界融合与数字赋能等非遗保护方式相结合' },
        { question: '②改为', options: [], answer: '创设虚拟的中草药体验场景' },
      ],
    },
    result: {
      correctAnswer: [
        '跨界融合与数字赋能等非遗保护方式相结合',
        '创设虚拟的中草药体验场景',
      ],
      explanation:
        '①“方式”后补足谓语，形成主谓结构，作为后句主语。\n②“创办”与虚拟场景搭配不当，改为“创设”。',
    },
    cognitiveState: 'GAP',
  },
  
  // 默写
  {
    id: 'cn-dic-001',
    subject: 'chinese',
    type: 'dictation',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['古诗-静夜思'],
    tags: ['默写'],
    content: { stem: '默写《静夜思》前两句：________，________。' },
    result: { correctAnswer: '床前明月光，疑是地上霜。', explanation: '考查完整性与标点。' },
    cognitiveState: 'GAP'
  },
  {
    id: 'cn-dic-002',
    subject: 'chinese',
    type: 'dictation',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['名句-劝学'],
    tags: ['默写'],
    content: { stem: '补写名句：____，业精于勤荒于嬉。' },
    result: { correctAnswer: '人生在勤勤则不匮', explanation: '常见错写为“人生日勤”或漏字。' },
    cognitiveState: 'FADED'
  },
  
  // 综合性学习
  {
    id: 'cn-int-001',
    subject: 'chinese',
    type: 'integrated_learning',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['信息筛选'],
    tags: ['综合性学习'],
    content: { stem: '阅读一则校园环保调查简报，写出两个可执行的改进措施。（开放作答）' },
    result: { correctAnswer: '示例：1）设置垃圾分类指示牌；2）每周组织一次垃圾减量宣传。', explanation: '要求可执行、与环保相关。' },
    cognitiveState: 'GAP'
  },
  {
    id: 'cn-int-002',
    subject: 'chinese',
    type: 'integrated_learning',
    difficulty: 4,
    category: 'finale',
    knowledgePoints: ['口语交际'],
    tags: ['综合性学习'],
    content: { stem: '策划一次“非遗进校园”主题活动，写出活动目标与一条核心流程。（开放作答）' },
    result: { correctAnswer: '示例：目标—了解本地非遗；流程—邀请传承人展示+学生体验+问答。', explanation: '要素齐全、聚焦主题。' },
    cognitiveState: 'GAP'
  },
  
  // 文言文阅读
  {
    id: 'cn-cls-001',
    subject: 'chinese',
    type: 'classical_reading',
    difficulty: 3,
    category: 'textbook',
    knowledgePoints: ['文言-实词'],
    tags: ['文言文阅读'],
    content: { stem: '解释加点词：“学而时习之，不亦说乎？”中的“说”。', options: ['通“悦”，愉快', '通“阅”，阅读', '通“脱”，逃脱', '通“税”，赋税'] },
    result: { correctAnswer: '通“悦”，愉快', explanation: '常见义项辨析。' },
    cognitiveState: 'FADED'
  },
  {
    id: 'cn-cls-002',
    subject: 'chinese',
    type: 'classical_reading',
    difficulty: 4,
    category: 'typical',
    knowledgePoints: ['文言-句意理解'],
    tags: ['文言文阅读'],
    content: { stem: '翻译句子：“青，取之于蓝，而青于蓝。”', options: ['A. 青色来自蓝草，却比蓝更青。', 'B. 蓝色来自青草，却比青更蓝。', 'C. 青草来自蓝色，却比蓝更青。', 'D. 蓝草来自青草，却比青更蓝。'] },
    result: { correctAnswer: 'A', explanation: '取于蓝而胜于蓝，强调超越。' },
    cognitiveState: 'GAP'
  },
  
  // 诗歌阅读
  {
    id: 'cn-poem-001',
    subject: 'chinese',
    type: 'poem_reading',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['意象-情感'],
    tags: ['诗歌阅读'],
    content: { stem: '《春望》“国破山河在，城春草木深”传达了诗人怎样的情感？', options: ['A. 喜悦', 'B. 忧国伤时', 'C. 惊讶', 'D. 愤怒'] },
    result: { correctAnswer: 'B', explanation: '安史之乱背景，忧国之情。' },
    cognitiveState: 'MASTERED'
  },
  {
    id: 'cn-poem-002',
    subject: 'chinese',
    type: 'poem_reading',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['手法-对比'],
    tags: ['诗歌阅读'],
    content: { stem: '《江雪》中“孤舟蓑笠翁，独钓寒江雪”运用了何种表现手法，营造了怎样的意境？', options: ['A. 排比，热烈豪放', 'B. 对比，清冷孤寂', 'C. 夸张，壮阔宏大', 'D. 拟人，温暖宁静'] },
    result: { correctAnswer: 'B', explanation: '前文写千山鸟飞绝，后景对比，意境冷寂。' },
    cognitiveState: 'GAP'
  }

  // 文言文阅读——新增综合题
  ,{
    id: 'cn-cls-003',
    subject: 'chinese',
    type: 'classical_reading',
    difficulty: 4,
    category: 'typical',
    knowledgePoints: ['文言文-一词多义', '文言文-句子翻译', '文言文-断句', '修辞-夸张', '文言文-情感理解'],
    tags: ['文言文阅读', '夸张', '阅读理解'],
    cognitiveState: 'GAP',
    content: {
      stem: `阅读下面选文，完成下面小题。
【甲】
山川之美，古来共谈。高峰入云，清流见底。两岸石壁，五色交辉。青林翠竹，四时俱备。晓雾将歇，猿鸟乱鸣；夕日欲颓，沉鳞竞跃。实是欲界之仙都。自康乐以来，未复有能与其奇者。
（选自《答谢中书书》）
【乙】
故鄣县东三十五里，有青山绝壁干天孤峰入汉；绿嶂百重，清川万转。归飞之鸟，千翼竞来；企水之猿，百臂相接。秋露为霜，春罗被径。风雨如晦，鸡鸣不已。信足荡累颐物，悟衷散赏。
（选自吴均《与施从事书》）`,
      subQuestions: [
        {
          question: '1．下列加点词语意思相同的一组是（  ）',
          options: ['A．高峰入云 / 入则无法拂士', 'B．自康乐以来 / 自非亭午夜分', 'C．企水之猿 / 亲戚畔之', 'D．鸡鸣不已 / 惧其不已也'],
          answer: 'D',
        },
        {
          question: '2．把文中画横线的句子翻译成现代汉语。（1）夕日欲颓，沉鳞竞跃。',
          options: [],
          answer: '夕阳快要落山了，潜游在水中的鱼儿争相跃出水面。',
        },
        {
          question: '2．把文中画横线的句子翻译成现代汉语。（2）绿嶂百重，清川万转。',
          options: [],
          answer: '青翠的山峦千重百叠，清澈的河水千回百转。',
        },
        {
          question: '3．用“/”给乙文画波浪线的句子断句（断两处）。有青山绝壁干天孤峰入汉',
          options: [],
          answer: '有青山/绝壁干天/孤峰入汉',
        },
        {
          question: '4．甲乙两文都运用夸张手法突出山的高峻，如甲文“______”和乙文的“______”，两篇短文都表达了______，此外甲文还表达了______。',
          options: [],
          answer: '高峰入云；绝壁干天，孤峰入汉；对自然美景的热爱；与古今知音共赏美景的闲适自得之情',
        },
      ],
    },
    result: {
      correctAnswer: [
        'D',
        '夕阳快要落山了，潜游在水中的鱼儿争相跃出水面。',
        '青翠的山峦千重百叠，清澈的河水千回百转。',
        '有青山/绝壁干天/孤峰入汉',
        '高峰入云；绝壁干天，孤峰入汉；对自然美景的热爱；与古今知音共赏美景的闲适自得之情',
      ],
      explanation:
        '小题1：已=停止，对应《愚公移山》“惧其不已也”。\n小题2：注意“欲=将要”“颓=坠落”“沉鳞=潜游的鱼”“竞=争相”；“嶂=像屏障的山”“百重=层层叠叠”“清川=清澈的河流”。\n小题3：两处为并列主谓短语，节奏：有青山/绝壁干天/孤峰入汉。\n小题4：夸张写高峻；两文均抒写对山水之美的热爱，甲文兼有与谢灵运等知音共赏之闲适自得。',
    },
    source: '《答谢中书书》《与施从事书》',
  }
];
