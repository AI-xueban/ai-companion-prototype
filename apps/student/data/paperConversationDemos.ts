export type PaperDemoScenarioId =
  | 'paper-missing-info'
  | 'paper-conflicting-constraints'
  | 'paper-generation-incomplete'
  | 'paper-generation-timeout'
  | 'paper-resume-interrupted'
  | 'paper-active-task-conflict'
  | 'paper-pdf-render-failed'
  | 'paper-pdf-version-stale'
  | 'paper-source-unverified';

export type PaperDemoTone = 'progress' | 'warning' | 'error' | 'success';
export type PaperDemoStageState = 'done' | 'active' | 'pending' | 'warning';

export interface PaperDemoStatusCard {
  title: string;
  summary?: string;
  tone: PaperDemoTone;
  stages: Array<{ label: string; state: PaperDemoStageState }>;
}

export interface PaperDemoMessageSeed {
  sender: 'lumi' | 'user';
  text: string;
  type: 'text' | 'quick-reply' | 'paper-status';
  quickReplies?: string[];
  paperStatus?: PaperDemoStatusCard;
}

export interface PaperConversationDemo {
  id: string;
  scenarioId: PaperDemoScenarioId;
  title: string;
  date: string;
  preview: string;
  badge: '演示';
  messages: PaperDemoMessageSeed[];
}

const status = (
  title: string,
  tone: PaperDemoTone,
  summary: string,
  stages: PaperDemoStatusCard['stages'],
): PaperDemoMessageSeed => ({
  sender: 'lumi',
  text: '',
  type: 'paper-status',
  paperStatus: { title, tone, summary, stages },
});

export const PAPER_CONVERSATION_DEMOS: PaperConversationDemo[] = [
  {
    id: 'h-paper-missing-info',
    scenarioId: 'paper-missing-info',
    title: '生成试卷信息待补充',
    date: '今天',
    preview: '还需要一次确认年级、学科和范围',
    badge: '演示',
    messages: [
      { sender: 'user', text: '帮我生成一份期末试卷。', type: 'text' },
      {
        sender: 'lumi',
        text: '可以。还需要一次确认：哪个年级和学科？考试范围是整册还是指定单元？',
        type: 'quick-reply',
        quickReplies: ['五年级数学·整册', '四年级英语·整册', '我自己补充'],
      },
    ],
  },
  {
    id: 'h-paper-conflict',
    scenarioId: 'paper-conflicting-constraints',
    title: '试卷要求存在冲突',
    date: '今天',
    preview: '15分钟内完成，但需要40道计算题',
    badge: '演示',
    messages: [
      { sender: 'user', text: '生成一套15分钟的数学试卷，要40道题，每道题都要有计算过程。', type: 'text' },
      {
        sender: 'lumi',
        text: '这两个要求难以同时满足：15分钟通常无法完成40道需要计算过程的题。你希望优先保留哪一个？',
        type: 'quick-reply',
        quickReplies: ['保留15分钟，减少题量', '保留40道题，延长时间', '我自己调整'],
      },
    ],
  },
  {
    id: 'h-paper-shortage',
    scenarioId: 'paper-generation-incomplete',
    title: '题目生成不完整',
    date: '今天',
    preview: '需要20道，目前只有12道合适题目',
    badge: '演示',
    messages: [
      { sender: 'user', text: '生成20道分数乘除法实际应用题。', type: 'text' },
      status('题目生成未达到要求', 'warning', '已生成并校验通过12道题目，目标为20道，还差8道。', [
        { label: '已理解生成要求', state: 'done' },
        { label: '已完成试卷结构', state: 'done' },
        { label: '生成并校验通过：12 / 20', state: 'warning' },
        { label: '等待你选择处理方式', state: 'active' },
      ]),
      {
        sender: 'lumi',
        text: '其余题目暂未通过范围、重复度或完整性校验。我不会为了凑题量擅自扩大范围。你想怎么处理？',
        type: 'quick-reply',
        quickReplies: ['加入同类变式题', '扩大到相邻知识点', '减少到12道', '稍后再试'],
      },
    ],
  },
  {
    id: 'h-paper-timeout',
    scenarioId: 'paper-generation-timeout',
    title: '题目生成服务暂时不可用',
    date: '今天',
    preview: '生成要求已保存，可以从中断处重试',
    badge: '演示',
    messages: [
      status('生成试卷暂时中断', 'error', '题目生成服务响应超时，你的要求和已完成步骤都已保存。', [
        { label: '已理解生成要求', state: 'done' },
        { label: '已完成试卷结构', state: 'done' },
        { label: '生成题目服务响应超时', state: 'warning' },
        { label: '生成可修改草稿', state: 'pending' },
      ]),
      {
        sender: 'lumi',
        text: '不需要重新填写要求，可以从题目生成阶段继续。',
        type: 'quick-reply',
        quickReplies: ['重新尝试', '稍后继续', '修改要求', '取消任务'],
      },
    ],
  },
  {
    id: 'h-paper-resume',
    scenarioId: 'paper-resume-interrupted',
    title: '继续未完成的试卷',
    date: '今天',
    preview: '上次进行到题目校验阶段',
    badge: '演示',
    messages: [
      status('发现未完成的试卷', 'warning', '五年级数学期末试卷已进行到题目校验阶段。', [
        { label: '已完成试卷结构', state: 'done' },
        { label: '已匹配25道题', state: 'done' },
        { label: '检查重复与难度', state: 'active' },
        { label: '生成可修改草稿', state: 'pending' },
      ]),
      {
        sender: 'lumi',
        text: '已生成的内容不会重复处理。你想继续、查看当前草稿，还是放弃？',
        type: 'quick-reply',
        quickReplies: ['继续生成', '查看当前草稿', '放弃这次任务'],
      },
    ],
  },
  {
    id: 'h-paper-active-conflict',
    scenarioId: 'paper-active-task-conflict',
    title: '已有试卷正在生成',
    date: '今天',
    preview: '需要先决定如何处理当前任务',
    badge: '演示',
    messages: [
      { sender: 'user', text: '再帮我生成一套英语期中卷。', type: 'text' },
      {
        sender: 'lumi',
        text: '当前的数学期末试卷还在生成。为了避免两个任务互相覆盖，请先选择如何处理当前任务。',
        type: 'quick-reply',
        quickReplies: ['继续当前试卷', '暂停当前，生成英语试卷', '取消当前，生成英语试卷'],
      },
    ],
  },
  {
    id: 'h-paper-pdf-failed',
    scenarioId: 'paper-pdf-render-failed',
    title: 'PDF排版需要处理',
    date: '今天',
    preview: '第9题图片缺失，暂未交付',
    badge: '演示',
    messages: [
      status('PDF暂未生成', 'error', '第9题配图加载失败；试卷草稿已经保留。', [
        { label: '已锁定试卷版本 V3', state: 'done' },
        { label: '已完成基础排版', state: 'done' },
        { label: '检查公式、图片和分页', state: 'warning' },
        { label: '生成下载文件', state: 'pending' },
      ]),
      {
        sender: 'lumi',
        text: '校验未通过前我不会把文件标记为完成。',
        type: 'quick-reply',
        quickReplies: ['替换第9题', '移除图片后排版', '返回草稿', '重新检查'],
      },
    ],
  },
  {
    id: 'h-paper-pdf-stale',
    scenarioId: 'paper-pdf-version-stale',
    title: '试卷修改后需更新PDF',
    date: '今天',
    preview: '当前PDF对应修改前的V3版本',
    badge: '演示',
    messages: [
      status('当前PDF不是最新版本', 'warning', '你修改了第6题和总分，当前PDF仍对应试卷 V3。', [
        { label: '旧文件：PDF V3', state: 'done' },
        { label: '当前草稿：试卷 V4', state: 'active' },
        { label: '等待确认是否重新生成', state: 'pending' },
      ]),
      {
        sender: 'lumi',
        text: '旧文件不会被覆盖，你可以按最新版重新生成。',
        type: 'quick-reply',
        quickReplies: ['按最新版重新生成', '下载旧版本', '查看修改内容'],
      },
    ],
  },
  {
    id: 'h-paper-source-unverified',
    scenarioId: 'paper-source-unverified',
    title: '真题来源待确认',
    date: '今天',
    preview: '找到相关试卷，但暂不能提供完整PDF',
    badge: '演示',
    messages: [
      { sender: 'user', text: '帮我找2025年深圳罗湖区五年级语文期末真题。', type: 'text' },
      status('已找到匹配记录', 'warning', '试卷名称和条件匹配，但完整文件的使用权限尚未确认。', [
        { label: '已匹配地区、年级和学科', state: 'done' },
        { label: '已找到来源信息', state: 'done' },
        { label: '确认展示与下载权限', state: 'warning' },
        { label: '交付PDF', state: 'pending' },
      ]),
      {
        sender: 'lumi',
        text: '我暂时不能把“找到试卷记录”说成“已获得完整真题”。你可以查看来源，或参考这些条件生成一份新试卷。',
        type: 'quick-reply',
        quickReplies: ['查看来源信息', '搜索其他可用试卷', '参考它生成类似试卷'],
      },
    ],
  },
];

export const getPaperDemoOutcome = (
  scenarioId: PaperDemoScenarioId,
  action: string,
): PaperDemoMessageSeed[] => {
  const success = (title: string, summary: string): PaperDemoMessageSeed[] => [
    status(title, 'success', summary, [
      { label: '已保存你的选择', state: 'done' },
      { label: '已更新试卷任务', state: 'done' },
      { label: '正在继续生成与校验', state: 'active' },
    ]),
  ];

  if (action.includes('稍后') || action.includes('放弃') || action.includes('取消任务')) {
    return [{ sender: 'lumi', text: action.includes('取消') || action.includes('放弃') ? '好的，任务已经停止；已生成的草稿会保留在对话记录中。' : '好的，我已暂停任务。之后从这条对话记录进入就能继续。', type: 'text' }];
  }
  if (action === '我自己补充' || action === '我自己调整' || action === '修改要求') {
    return [{ sender: 'lumi', text: '可以，请一次把需要调整的内容说完整，我只会继续确认真正影响结果的信息。', type: 'text' }];
  }
  if (action === '查看来源信息') {
    return [{ sender: 'lumi', text: '来源记录：2025年深圳市罗湖区五年级语文期末试卷；当前仅核验到标题、地区、年级、学科与发布页，未取得可授权下载的完整文件，因此不能交付或复刻原卷。', type: 'text' }];
  }
  if (action === '下载旧版本') {
    return success('旧版本可以下载', '将下载明确标记为“PDF V3（旧版本）”，不会冒充当前版本。');
  }
  if (scenarioId === 'paper-source-unverified' && action === '参考它生成类似试卷') {
    return success('已转为生成新试卷', '会参考地区、年级和卷型条件生成，并明确标注“非原真题”。');
  }
  if (scenarioId === 'paper-active-task-conflict') {
    if (action === '继续当前试卷') {
      return [status('继续当前数学试卷', 'progress', '原任务保持活跃，不会创建英语试卷任务。', [
        { label: '数学期末试卷：继续生成', state: 'active' },
        { label: '英语期中试卷：未创建', state: 'pending' },
      ])];
    }
    return [status(action.startsWith('暂停') ? '已暂停旧任务并创建新任务' : '已取消旧任务并创建新任务', 'success', '两个任务状态已分开记录，不会互相覆盖。', [
      { label: `数学期末试卷：${action.startsWith('暂停') ? '已暂停，可稍后恢复' : '已取消，草稿仍保留'}`, state: 'done' },
      { label: '英语期中试卷：已创建', state: 'done' },
      { label: '英语试卷正在确认生成要求', state: 'active' },
    ])];
  }
  if (scenarioId === 'paper-pdf-render-failed') {
    if (action === '重新检查') {
      return [status('正在重试PDF校验', 'progress', '试卷 V3 未发生修改，将复用已完成排版，只重试图片与分页检查。', [
        { label: '复用试卷版本 V3', state: 'done' },
        { label: '复用基础排版结果', state: 'done' },
        { label: '重新检查第9题图片', state: 'active' },
        { label: '生成下载文件', state: 'pending' },
      ])];
    }
    return [status('已创建试卷 V4', 'warning', '移除图片改变了题目内容，需要重新校验整卷并再次确认定稿。', [
      { label: '旧PDF任务 V3 已停止', state: 'done' },
      { label: '修改已保存为试卷 V4', state: 'done' },
      { label: '等待整卷重新校验', state: 'active' },
      { label: '确认后创建新PDF任务', state: 'pending' },
    ])];
  }
  if (scenarioId === 'paper-generation-timeout' || scenarioId === 'paper-resume-interrupted') {
    return success('正在从中断处继续', '已跳过完成步骤，从题目生成或校验阶段恢复。');
  }
  return success('生成要求已更新', `已按“${action}”更新任务，不会静默改变其他已确认条件。`);
};
