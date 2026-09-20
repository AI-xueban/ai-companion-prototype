/** Internal slot — UI 优先用 card.tag；无 tag 时回退 KIND_TAG。 */
export type CuriosityKind = 'wonder' | 'subject' | 'interest';

export interface HubCuriosityCard {
  id: string;
  kind: CuriosityKind;
  /** 卡面标题，如「奇思妙想」「科学探究」 */
  tag: string;
  text: string;
  hint?: string;
}

export interface HubCuriosityPack {
  id: string;
  hero: HubCuriosityCard;
  /** 1–2 full questions; interest slot may be omitted. */
  secondary: HubCuriosityCard[];
}

export interface HubSpark {
  id: string;
  label: string;
  openerTitle: string;
  openerText: string;
  replies?: string[];
}

/** @deprecated alias */
export type HubChip = HubSpark;
/** @deprecated alias */
export type HubIntent = HubSpark;

export const HUB_SPARKS_DIVIDER = '其他推荐';

/**
 * L2 · 日常火花（已锁定方案 B）
 * 词条突出陪伴感（陪你 / 一起）；点开即开讲。不做讲题/作文/错题入口。
 */
export const HUB_SPARKS: HubSpark[] = [
  {
    id: 'joke',
    label: '陪你笑一个',
    openerTitle: '陪你笑一个',
    openerText:
      '我陪你听一条课堂版：老师问「举个静摩擦力的例子」，同桌说「我同桌的成绩」。……要不要再来一个？',
    replies: ['再来一个', '换冷知识', '聊聊别的'],
  },
  {
    id: 'idiom',
    label: '一起识成语',
    openerTitle: '一起识成语',
    openerText:
      '我们一起看一个：「沉鱼落雁」——不是鱼和雁摔下来了，是形容人美到鱼都沉、雁都落。你还听过哪个「名不副实」的成语？',
    replies: ['再来一个', '我猜一个', '聊聊别的'],
  },
  {
    id: 'worldRecord',
    label: '聊个世界之最',
    openerTitle: '聊个世界之最',
    openerText:
      '跟你分享一条：目前已知最长的山脉是海底的大洋中脊，比陆地上的安第斯还长。陆地上的「最长」你觉得是哪条？',
    replies: ['再来一条', '我来猜', '聊聊别的'],
  },
  {
    id: 'funFact',
    label: '分享冷知识',
    openerTitle: '分享冷知识',
    openerText:
      '我想到一条冷知识：香蕉是浆果，草莓反而不是。植物分类有时候比考试还反直觉——还想听一条吗？',
    replies: ['再来一条', '换笑话', '聊聊别的'],
  },
  {
    id: 'riddle',
    label: '陪你猜谜',
    openerTitle: '陪你猜谜',
    openerText: '我陪你猜：什么东西越洗越脏？想好了再说；要提示也可以。',
    replies: ['我猜是…', '给个提示', '直接说答案'],
  },
  {
    id: 'tongueTwister',
    label: '一起念绕口令',
    openerTitle: '一起念绕口令',
    openerText:
      '我们一起念：四是四，十是十，十四是十四，四十是四十。你先慢速跟我念一遍？',
    replies: ['我跟读', '再来一段难的', '聊聊别的'],
  },
];

/** @deprecated use HUB_SPARKS */
export const HUB_INTENTS = HUB_SPARKS;

/**
 * L1 主推 + 次推：情境化对话邀约（吸引开口），不是讲题/作业入口。
 * 主推禁止「帮我讲这道题」类功能话术；好奇/情绪/兴趣均可作主推。
 */
export const CURIOSITY_PACKS: HubCuriosityPack[] = [
  {
    id: 'wonder-moon',
    hero: {
      id: 'w-moon',
      kind: 'wonder',
      tag: '奇思妙想',
      text: '如果月亮突然消失一晚，地球会怎样？',
    },
    secondary: [
      {
        id: 'i-draw',
        kind: 'interest',
        tag: '创作分享',
        text: '画完了？给我看看哪一笔最得意',
      },
      {
        id: 'w-heat',
        kind: 'wonder',
        tag: '科学探究',
        text: '冰棍冒的「烟」，是水还是气？',
      },
    ],
  },
  {
    id: 'mood-soft',
    hero: {
      id: 'm-listen',
      kind: 'interest',
      tag: '情绪陪伴',
      text: '今天要是有点闷，要不要先跟我说说？',
    },
    secondary: [
      {
        id: 'i-song',
        kind: 'interest',
        tag: '兴趣陪伴',
        text: '今天耳机单曲循环了哪首？',
      },
      {
        id: 'i-photo',
        kind: 'interest',
        tag: '创作分享',
        text: '拍了张天空，猜猜我看出了什么？',
      },
    ],
  },
  {
    id: 'wonder-earth',
    hero: {
      id: 'w-earth',
      kind: 'wonder',
      tag: '奇思妙想',
      text: '地球突然停转，教室里的人会飞出去吗？',
    },
    secondary: [
      {
        id: 'i-story',
        kind: 'interest',
        tag: '创作分享',
        text: '有个半成品故事，帮我接下一句？',
      },
      {
        id: 'w-cold',
        kind: 'wonder',
        tag: '科学探究',
        text: '「冷」是一种东西，还是热溜走了？',
      },
    ],
  },
  {
    id: 'wonder-weekend',
    hero: {
      id: 'w-weekend',
      kind: 'wonder',
      tag: '语言趣问',
      text: 'How was your weekend，真的在问周末吗？',
    },
    secondary: [
      {
        id: 'i-game',
        kind: 'interest',
        tag: '兴趣陪伴',
        text: '刚打完一把，复盘一下我的离谱操作',
      },
      {
        id: 'i-craft',
        kind: 'interest',
        tag: '创作分享',
        text: '手工快完成了，猜猜我在做什么？',
      },
    ],
  },
  {
    id: 'wonder-mirror',
    hero: {
      id: 'w-mirror-2',
      kind: 'wonder',
      tag: '科学探究',
      text: '镜子里的你，为啥只左右反、上下不反？',
    },
    secondary: [
      {
        id: 'i-draw-2',
        kind: 'interest',
        tag: '创作分享',
        text: '画完了？给我看看哪一笔最得意',
      },
      {
        id: 'i-journal',
        kind: 'interest',
        tag: '兴趣陪伴',
        text: '日记写了一半卡住了，陪我脑暴',
      },
    ],
  },
];

export const FREE_CHAT_OPENER =
  '想聊什么都可以。上面的邀约只是今天的灵感，不点也能直接跟我说。';

/** kind 缺省标题（有 card.tag 时不用） */
export const KIND_TAG: Record<CuriosityKind, string> = {
  wonder: '奇思妙想',
  subject: '学科趣问',
  interest: '兴趣陪伴',
};

/** @deprecated use KIND_TAG / card.tag */
export const KIND_LABEL = KIND_TAG;
