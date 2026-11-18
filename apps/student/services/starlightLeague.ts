/** 星光学榜简化版。纯规则与演示快照；未连接生产结算或权限接口。 */
export const MAX_LEAGUE_TIER = 9;
export type LeagueMember = {
  id: string; name: string; avatar: string; xp: number; tier: number;
  minutes: number[]; dailyXp: number[]; totalXp: number;
};
export type LeagueScenario = 'normal' | 'zero' | 'new' | 'solo' | 'small' | 'tie' | 'allZero' | 'onePositive' | 'highest' | 'settling' | 'error' | 'vsError' | 'expired';
export const LEAGUE_SCENARIOS: [LeagueScenario, string][] = [
  ['normal', '正常周榜'], ['zero', '本人零分'], ['new', '本周未参赛'], ['solo', '只有本人'],
  ['small', '两人小组'], ['tie', '晋级边界同分'], ['allZero', '全组零分'], ['onePositive', '仅一人正分'],
  ['highest', '最高段位'], ['settling', '结算中'], ['error', '榜单失败'], ['vsError', 'VS 请求失败'], ['expired', '跨周失效'],
];
export function weekWindow(now = Date.now()) {
  const local = new Date(now + 8 * 3600_000);
  const day = (local.getUTCDay() + 6) % 7;
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - day) - 8 * 3600_000;
  return { start, end: start + 7 * 86400_000, id: new Date(start + 8 * 3600_000).toISOString().slice(0, 10) };
}
export function sumSettledXp(records: { id: string; settledAt: number; xp: number; status: string }[], start: number, end: number) {
  const seen = new Set<string>();
  return records.reduce((total, r) => {
    if (r.status !== 'success' || r.xp <= 0 || r.settledAt < start || r.settledAt >= end || seen.has(r.id)) return total;
    seen.add(r.id); return total + r.xp;
  }, 0);
}
export function groupSizes(n: number): number[] {
  if (!Number.isInteger(n) || n < 0) throw new Error('无效人数');
  if (!n) return [];
  if (n < 8) return [n];
  const choices = Array.from({ length: n }, (_, i) => i + 1).filter(k => Math.floor(n / k) >= 8 && Math.ceil(n / k) <= 15);
  choices.sort((a, b) => Math.abs(a - n / 12) - Math.abs(b - n / 12) || b - a);
  const k = choices[0]; const base = Math.floor(n / k);
  return Array.from({ length: k }, (_, i) => base + (i < n % k ? 1 : 0));
}
export function matchGrade(members: LeagueMember[]) {
  const ordered = [...members].sort((a, b) => b.totalXp - a.totalXp || a.id.localeCompare(b.id));
  let offset = 0;
  return groupSizes(ordered.length).map(size => { const group = ordered.slice(offset, offset + size); offset += size; return group; });
}
export function evaluateLeague(members: LeagueMember[]) {
  const ordered = [...members].sort((a, b) => b.xp - a.xp || a.id.localeCompare(b.id));
  const candidates = ordered.filter(m => m.xp > 0 && m.tier < MAX_LEAGUE_TIER);
  const E = candidates.length; const P = ordered.filter(m => m.xp > 0).length;
  const K = E < 2 ? 0 : Math.max(1, Math.floor(E / 4));
  const boundaryTie = K > 0 && candidates[K - 1].xp === candidates[K]?.xp;
  const promoted = new Set((boundaryTie ? candidates.slice(0, K).filter(m => m.xp > candidates[K].xp) : candidates.slice(0, K)).map(m => m.id));
  const champion = P >= 2 && ordered[0].xp > ordered[1].xp ? ordered[0].id : null;
  const rows = ordered.map(m => ({ ...m,
    rank: ordered.filter(other => other.xp > m.xp).length + 1,
    promote: promoted.has(m.id), nextTier: Math.min(MAX_LEAGUE_TIER, m.tier + (promoted.has(m.id) ? 1 : 0)),
    reason: m.tier === MAX_LEAGUE_TIER ? '已达到最高段位，可继续争取本组周冠军' :
      m.xp === 0 ? '本周暂未获得 XP，已有段位保留' : E < 2 ? '本周满足晋级条件的同学不足两位，段位保持' :
      promoted.has(m.id) ? '进入晋级范围，晋一级' : boundaryTie && m.xp === candidates[K].xp ? '晋级边界出现同分，本周段位保持' : '本周未进入晋级范围，已有段位保留',
    gap: ordered.filter(other => other.xp > m.xp).at(-1)?.xp,
  }));
  return { rows, E, P, K, promoted, champion, championReason: P < 2 ? '本周获得 XP 的同学不足两位，未产生本组周冠军' : !champion ? '本周最高分并列，未产生本组周冠军' : `本组周冠军：${ordered[0].name}` };
}
export type LeagueSnapshot = ReturnType<typeof createLeagueDemo>;
export function createLeagueDemo(scenario: LeagueScenario, name: string, xp: number, totalXp: number, avatar: string, seasonId: string) {
  const scores = [3200, 2850, 2600, Math.max(0, xp), 1900, 1700, 1500, 1200, 900, 650, 300, 0];
  const names = ['林小明', '许同学', '陈同学', name, '小雨', '王同学', '小晨', '李同学', '小宁', '周同学', '小安', '赵同学'];
  let members: LeagueMember[] = scores.map((value, i) => ({ id: i === 3 ? 'me' : `peer-${i}`, name: names[i], avatar: i === 3 ? avatar : ['🦊', '🐱', '🐼', '🦁', '🐰'][i % 5],
    xp: value, tier: i === 0 ? 9 : i === 3 ? 3 : 1 + i % 4, totalXp: i === 3 ? totalXp : 7000 - i * 240,
    dailyXp: [Math.floor(value * .3), Math.floor(value * .4), value - Math.floor(value * .3) - Math.floor(value * .4), 0, 0, 0, 0],
    minutes: value === 0 ? [0, 0, 0, 0, 0, 0, 0] : [30 + i * 2, 45 + i, 35 + i * 3, 0, 0, 0, 0],
  }));
  if (scenario === 'zero') members = members.map(m => m.id === 'me' ? { ...m, xp: 0, dailyXp: Array(7).fill(0), minutes: Array(7).fill(0) } : m);
  if (scenario === 'solo' || scenario === 'new') members = members.filter(m => m.id === 'me');
  if (scenario === 'small') members = members.filter(m => ['me', 'peer-1'].includes(m.id));
  if (scenario === 'tie') {
    members = members.filter(m => m.id === 'me' || ['peer-1', 'peer-2', 'peer-4', 'peer-5', 'peer-6', 'peer-7', 'peer-8'].includes(m.id));
    members = members.map((m, i) => ({ ...m, tier: 2, xp: [3000, 2400, 2400, 1700, 1400, 1000, 700, 300][i] }));
  }
  if (scenario === 'allZero') members = members.map(m => ({ ...m, xp: 0 }));
  if (scenario === 'onePositive') members = members.map(m => ({ ...m, xp: m.id === 'me' ? 2100 : 0 }));
  if (scenario === 'highest') members = members.map(m => m.id === 'me' ? { ...m, tier: 9, xp: 3800 } : m);
  // 测试场景调整分数后重建按日分布，确保摘要、趋势与榜单同源。
  members = members.map(m => ({ ...m, dailyXp: [Math.floor(m.xp * .3), Math.floor(m.xp * .4), m.xp - Math.floor(m.xp * .3) - Math.floor(m.xp * .4), 0, 0, 0, 0], minutes: m.xp === 0 ? Array(7).fill(0) : m.minutes }));
  return { seasonId, groupId: `${seasonId}-grade-demo`, members, eligible: scenario !== 'new', scenario };
}
/** 模拟服务边界：只输出白名单汇总数据，不返回经验流水或学习内容。 */
export function getVsSummary(snapshot: LeagueSnapshot, actor: string, target: string, currentSeason: string) {
  if (snapshot.seasonId !== currentSeason) throw new Error('本周分组已更新，请返回榜单重新选择');
  if (!snapshot.eligible || snapshot.members.length < 2 || actor === target || !snapshot.members.some(m => m.id === actor) || !snapshot.members.some(m => m.id === target)) throw new Error('仅可查看当前同组成员的对比数据');
  return [actor, target].map(id => {
    const m = snapshot.members.find(row => row.id === id)!;
    return { id: m.id, name: m.name, xp: m.xp, minutes: m.minutes.reduce((a, b) => a + b, 0), days: m.minutes.filter(n => n > 0).length, dailyXp: [...m.dailyXp], dailyMinutes: [...m.minutes] };
  });
}
export const GROWTH_LEVELS = [
  ['星尘微光', 0], ['星光收集者', 500], ['星轨寻路者', 1500], ['卫星护航员', 3000], ['行星领航员', 5000],
  ['恒星开拓者', 8000], ['星云造梦师', 12000], ['星系探索者', 17000], ['超新星学者', 24000],
] as const;
export function growthLevel(total: number) {
  const index = GROWTH_LEVELS.reduce((found, row, i) => total >= row[1] ? i : found, 0);
  return { name: GROWTH_LEVELS[index][0], next: GROWTH_LEVELS[index + 1]?.[1], start: GROWTH_LEVELS[index][1] };
}
