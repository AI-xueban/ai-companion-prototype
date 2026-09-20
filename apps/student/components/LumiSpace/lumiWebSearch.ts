export interface SearchSource {
  index: number;
  title: string;
  snippet: string;
  site: string;
  url: string;
}

export interface SearchAgentResult {
  sources: SearchSource[];
  answer: string;
  /** Agent 改写后的检索词（如「2026年8月24日深圳天气」），用于回答气泡顶部展示 */
  searchQuery: string;
}

const SOURCE_POOL: Omit<SearchSource, 'index'>[] = [
  {
    title: '一元二次方程根的判别式与解法',
    snippet: '判别式 Δ = b² − 4ac 可判断实根个数；Δ>0 两实根，Δ=0 重根，Δ<0 无实根。',
    site: '人教社学习园地',
    url: 'https://example.com/math/quadratic',
  },
  {
    title: '初中数学：配方法与求根公式对照',
    snippet: '配方可直观理解求根公式来源，适合先建立直觉再记公式。',
    site: '学科网·数学',
    url: 'https://example.com/math/complete-square',
  },
  {
    title: '如何用韦达定理快速验算',
    snippet: '两根之和等于 −b/a，两根之积等于 c/a，可用于检验解题结果。',
    site: '学而思学习报',
    url: 'https://example.com/math/vieta',
  },
  {
    title: '英语写作：观点段常用衔接词',
    snippet: 'Firstly / Furthermore / In conclusion 等衔接词能让段落更清晰。',
    site: 'BBC Learning English',
    url: 'https://example.com/en/linkers',
  },
  {
    title: '古诗词鉴赏：意象与情感对应',
    snippet: '月、柳、雁等意象常与思乡、离别相关，答题时先抓意象再推情感。',
    site: '语文报·中考版',
    url: 'https://example.com/chinese/imagery',
  },
  {
    title: '光合作用与呼吸作用的区别',
    snippet: '光合作用吸收 CO₂ 释放 O₂；呼吸作用相反。二者在植物体内同时发生。',
    site: '国家中小学智慧教育平台',
    url: 'https://example.com/bio/photosynthesis',
  },
  {
    title: '考前焦虑的自我调节方法',
    snippet: '深呼吸、分段复习、睡眠优先比临时抱佛脚更有效。',
    site: '青少年心理月刊',
    url: 'https://example.com/mind/exam-anxiety',
  },
  {
    title: '牛顿第一定律：惯性与受力',
    snippet: '物体保持匀速直线运动或静止，是因为合力为零，而非没有力。',
    site: '物理好朋友',
    url: 'https://example.com/physics/inertia',
  },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 模拟 Agent 把用户原话改写为检索词：补日期、抽地点与主题、去口语语气词 */
function reformulateQuery(userQuery: string): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const q = userQuery.trim();

  // 天气类：日期 + 地点 + 天气
  if (q.includes('天气') || q.includes('气温') || q.includes('下雨') || q.includes('下雪')) {
    const stop = new Set(['今天', '明天', '后天', '昨天', '天气', '气温', '怎么样', '如何', '地区', '的', '呢', '吗', '吧', '啊', '呀']);
    const loc = (q.match(/[\u4e00-\u9fa5]{2,6}/g) || []).find((s) => !stop.has(s)) || '';
    return `${dateStr}${loc}天气`;
  }

  // 默认：去问号与语气词，保留原意
  return q
    .replace(/[？?]+/g, '')
    .replace(/(怎么样|如何|吗|呢|吧|啊|呀|告诉我|帮我查查|我想知道)/g, '')
    .trim() || q;
}

function pickSources(query: string, count: number): SearchSource[] {
  const q = query.toLowerCase();
  const scored = SOURCE_POOL.map((item, i) => {
    const hay = `${item.title} ${item.snippet} ${item.site}`.toLowerCase();
    let score = 0;
    q.split(/\s+/).filter(Boolean).forEach((token) => {
      if (hay.includes(token)) score += 3;
    });
    if (q.includes('方程') || q.includes('数学')) {
      if (hay.includes('方程') || hay.includes('数学') || hay.includes('根')) score += 2;
    }
    if (q.includes('英语') || q.includes('写作')) {
      if (hay.includes('英语') || hay.includes('写作')) score += 2;
    }
    if (q.includes('诗') || q.includes('语文')) {
      if (hay.includes('诗') || hay.includes('意象') || hay.includes('语文')) score += 2;
    }
    if (q.includes('生物') || q.includes('光合')) {
      if (hay.includes('光合') || hay.includes('生物')) score += 2;
    }
    if (q.includes('焦虑') || q.includes('紧张') || q.includes('压力')) {
      if (hay.includes('焦虑') || hay.includes('心理')) score += 2;
    }
    return { item, score: score + (i % 3) * 0.1 };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(({ item }, index) => ({
    ...item,
    index: index + 1,
  }));
}

function buildAnswer(query: string, sources: SearchSource[]): string {
  const lead = sources[0];
  const second = sources[1];

  return [
    `关于「${query.trim() || '你的问题'}」，我综合检索到的资料后，先给你一个清晰结论：`,
    '',
    `核心要点可以参考 ${lead ? `[${lead.index}]` : ''}：${lead?.snippet || '先抓住概念定义，再看例题用法。'}`,
    second
      ? `另外，${second.snippet.replace(/。$/, '')}${`[${second.index}]`} 也能帮你加深理解。`
      : '',
    '',
    `学习建议：先读懂概念，再做 1～2 道基础题巩固；不确定时对照来源核对。`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** 模拟联网搜索：先耗时，再返回篇数、来源与带引用标注的回答 */
export async function runLumiWebSearch(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<SearchAgentResult> {
  const count = 4 + (query.length % 3); // 4–6
  await wait(900 + Math.min(query.length, 20) * 30);
  if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const sources = pickSources(query, count);
  await wait(500);
  if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  return {
    sources,
    answer: buildAnswer(query, sources),
    searchQuery: reformulateQuery(query),
  };
}
