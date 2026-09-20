/** 快速解题完成后，底部引导进入 1 对 1 讲题的固定提示语（30 条） */
export interface QuickDoneHintLine {
  /** 前半句，常规字重 */
  lead: string;
  /** 后半句，加粗强调 */
  emphasis: string;
}

export const QUICK_DONE_HINT_LINES: QuickDoneHintLine[] = [
  { lead: '没太跟上？', emphasis: '咱们一步步再讲清楚' },
  { lead: '骨架有了，', emphasis: '想一起把数填完整吗？' },
  { lead: '哪一步还想再稳一点？', emphasis: '可以 1 对 1 细讲' },
  { lead: '快速版看完了，', emphasis: '要不要慢慢走一遍？' },
  { lead: '还有小问号？', emphasis: '咱们按你的节奏来讲' },
  { lead: '想自己试但又怕跳步？', emphasis: '我陪你一步一步算' },
  { lead: '思路大概懂了，', emphasis: '接下来一起把答案推出来' },
  { lead: '觉得哪里有点快？', emphasis: '点 1 对 1 我们重讲那一步' },
  { lead: '需要更多例子吗？', emphasis: '进入细讲模式慢慢练' },
  { lead: '想确认关键一步？', emphasis: '咱们对着题目慢慢推' },
  { lead: '快速梳理完成啦，', emphasis: '想深入就一起填数吧' },
  { lead: '还有不清楚的条件？', emphasis: '1 对 1 里我帮你圈出来' },
  { lead: '怕算错单位？', emphasis: '细讲时我们一步步核对' },
  { lead: '想听第二遍？', emphasis: '换更慢的方式再讲一次' },
  { lead: '自己填数前，', emphasis: '要不要先走一遍示范？' },
  { lead: '哪块还想多停一会儿？', emphasis: '告诉我，我们重点讲' },
  { lead: '快速版是地图，', emphasis: '1 对 1 是带你走全程' },
  { lead: '还有疑问没说出来？', emphasis: '细讲里随时问我' },
  { lead: '想练手又需要提示？', emphasis: '咱们边做边讲' },
  { lead: '看完骨架心里没底？', emphasis: '一起把空填上就好了' },
  { lead: '需要把式子写完整？', emphasis: '进入 1 对 1 我带你写' },
  { lead: '想确认思路对不对？', emphasis: '细讲时逐步验证' },
  { lead: '哪一步最容易错？', emphasis: '我们单独拎出来练' },
  { lead: '准备自己挑战一下？', emphasis: '先 1 对 1 走一遍更稳' },
  { lead: '觉得还差一口气？', emphasis: '细讲帮你补最后一步' },
  { lead: '想按你的节奏来？', emphasis: '1 对 1 随时暂停重讲' },
  { lead: '快速版是预览，', emphasis: '完整讲解在这里' },
  { lead: '还有个小卡点？', emphasis: '点 1 对 1 我们攻克它' },
  { lead: '想更扎实再交卷？', emphasis: '咱们把过程走完整' },
  { lead: '随时准备好了，', emphasis: '就一起进入 1 对 1 讲题' },
];

export function getQuickDoneHintLine(seed?: number): QuickDoneHintLine {
  if (seed != null && Number.isFinite(seed)) {
    const index = Math.abs(Math.floor(seed)) % QUICK_DONE_HINT_LINES.length;
    return QUICK_DONE_HINT_LINES[index];
  }
  const index = Math.floor(Math.random() * QUICK_DONE_HINT_LINES.length);
  return QUICK_DONE_HINT_LINES[index];
}
