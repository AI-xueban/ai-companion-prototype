
import { 
    DayPlan, SubjectData, SubjectType, MistakeVaultData, UserProfileData, 
    VariantQuestion, MapMode, UserPersona, AcademicProfile, TopicNode, 
    EssayData, EssayAnalysisResult, LeagueTierConfig, UserLeagueStatus, 
    LeaderboardItem, LeagueTierName, LeagueGrade,
    OutfitItem, OutfitCategory
} from "../types";
import { SUBJECT_CONFIGS, MapBuilderHelpers } from './subjectConfig';
import { mathQuestions, chineseQuestions, englishQuestions } from '../data/questionBank';

// This service handles AI interactions. 
// For this prototype, we primarily mock the data to match the visual requirements.

// --- OUTFIT CATALOG (MOCK) ---
export const OUTFIT_CATALOG: OutfitItem[] = [
    // HEADWEAR (User)
    { id: 'hat_grad', name: '博士帽', category: 'headwear', target: 'user', price: 500, unlockCondition: '等级 Lv.5', isLocked: true, assetUrl: '🎓', description: '知识就是力量！' },
    { id: 'glasses_smart', name: '智慧眼镜', category: 'headwear', target: 'user', price: 200, isLocked: false, assetUrl: '👓', description: '看穿一切难题。' },
    { id: 'ears_cat', name: '猫耳耳机', category: 'headwear', target: 'user', price: 300, isLocked: false, assetUrl: '🎧', description: '听见知识的声音。' },
    
    // HANDHELD (User)
    { id: 'book_magic', name: '魔法书', category: 'handheld', target: 'user', price: 150, isLocked: false, assetUrl: '📖', description: '记录每一个灵感。' },
    { id: 'pen_feather', name: '羽毛笔', category: 'handheld', target: 'user', price: 100, isLocked: false, assetUrl: '✒️', description: '书写未来。' },

    // OUTFIT (User)
    { id: 'uniform_school', name: '标准校服', category: 'outfit', target: 'user', price: 0, isLocked: false, assetUrl: '👕', description: 'Lumi 的经典装扮。' },
    { id: 'suit_space', name: '宇航服', category: 'outfit', target: 'user', price: 1000, unlockCondition: '连续打卡 7 天', isLocked: true, assetUrl: '👨‍🚀', description: '目标是星辰大海！' },

    // LUMI ITEMS (AI Companion)
    { id: 'headphones', name: '三太子·哪吒', category: 'headwear', target: 'lumi', price: 500, isLocked: false, assetUrl: '🔥', description: '我命由我不由天' },
    { id: 'glasses', name: '爱因斯坦', category: 'headwear', target: 'lumi', price: 300, isLocked: false, assetUrl: '⚛️', description: '探索相对论的奥秘' },
    { id: 'hat', name: '福尔摩斯', category: 'headwear', target: 'lumi', price: 200, isLocked: false, assetUrl: '🕵️', description: '排除所有不可能' },
    { id: 'scarf', name: '广寒宫·嫦娥', category: 'headwear', target: 'lumi', price: 150, isLocked: false, assetUrl: '🌙', description: '月宫仙子的温柔陪伴' },
];

// Mock State for Outfits
let userUnlockedOutfits: string[] = ['uniform_school', 'none']; // Default owned for user & lumi base
let userCurrentOutfit: any = { outfit: 'uniform_school' };
let userCoins = 850; 

export const buyOutfit = async (id: string): Promise<{ success: boolean; message: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const item = OUTFIT_CATALOG.find(i => i.id === id);
            if (!item) {
                resolve({ success: false, message: '商品不存在' });
                return;
            }
            if (userUnlockedOutfits.includes(id)) {
                resolve({ success: false, message: '已拥有该装扮' });
                return;
            }
            if (userCoins < item.price) {
                resolve({ success: false, message: '积分不足' });
                return;
            }
            
            // Transaction
            userCoins -= item.price;
            userUnlockedOutfits.push(id);
            resolve({ success: true, message: '购买成功！' });
        }, 500);
    });
};

export const equipOutfit = async (category: OutfitCategory, id: string | undefined) => {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            if (id) {
                 if (!userUnlockedOutfits.includes(id)) return;
                 userCurrentOutfit = { ...userCurrentOutfit, [category]: id };
            } else {
                 const newOutfit = { ...userCurrentOutfit };
                 delete newOutfit[category];
                 userCurrentOutfit = newOutfit;
            }
            resolve();
        }, 300);
    });
};

// --- LEAGUE CONFIGURATION ---
export const LEAGUE_TIER_CONFIGS: LeagueTierConfig[] = [
    { name: 'Stardust', label: '星尘联赛', color: 'text-slate-400', icon: '🌑', themeGradient: 'from-slate-400 to-slate-600' },
    { name: 'Meteor', label: '陨石联赛', color: 'text-amber-400', icon: '☄️', themeGradient: 'from-amber-400 to-orange-600' },
    { name: 'Satellite', label: '卫星联赛', color: 'text-blue-400', icon: '🛰️', themeGradient: 'from-blue-400 to-indigo-600' },
    { name: 'Planet', label: '行星联赛', color: 'text-emerald-400', icon: '🪐', themeGradient: 'from-emerald-400 to-teal-600' },
    { name: 'Star', label: '恒星联赛', color: 'text-orange-500', icon: '☀️', themeGradient: 'from-orange-500 to-yellow-600' },
    { name: 'Galaxy', label: '星系联赛', color: 'text-indigo-400', icon: '🌌', themeGradient: 'from-indigo-400 to-purple-700' },
    { name: 'Supernova', label: '超新星联赛', color: 'text-rose-500', icon: '💥', themeGradient: 'from-rose-500 to-pink-700' },
    { name: 'CosmicLegend', label: '宇宙传奇', color: 'text-yellow-500', icon: '👑', themeGradient: 'from-yellow-400 to-orange-500' },
];

export const calculateLeagueStatus = (totalXp: number): UserLeagueStatus => {
    const XP_PER_GRADE = 500;
    const GRADES_PER_TIER = 3;
    const XP_PER_TIER = XP_PER_GRADE * GRADES_PER_TIER;

    // Determine Tier
    const tierIndex = Math.min(Math.floor(totalXp / XP_PER_TIER), LEAGUE_TIER_CONFIGS.length - 1);
    const xpInTier = totalXp % XP_PER_TIER;
    
    // Determine Grade (III -> II -> I)
    const gradeIndex = Math.min(Math.floor(xpInTier / XP_PER_GRADE), GRADES_PER_TIER - 1);
    const grades: LeagueGrade[] = ['III', 'II', 'I'];
    
    const config = LEAGUE_TIER_CONFIGS[tierIndex];
    const grade = grades[gradeIndex];

    return {
        tier: config.name,
        grade: grade,
        tierLabel: `${config.label} ${grade}`,
        totalXp: totalXp,
        xpInCurrentGrade: xpInTier % XP_PER_GRADE,
        xpNeededForNextGrade: XP_PER_GRADE
    };
};

// --- LEADERBOARD MOCK GENERATOR ---
export const getLeaderboardData = async (period: 'daily' | 'weekly' | 'monthly'): Promise<LeaderboardItem[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const baseXP = period === 'daily' ? 150 : period === 'weekly' ? 2000 : 8000;
            const range = period === 'daily' ? 200 : period === 'weekly' ? 1500 : 5000;
            
            const names = ['张伟', '王芳', '刘强', '陈杰', '杨洋', '赵敏', '周涛', '吴刚', '郑丽', '孙红', '朱明', '何炅', '谢娜', '汪涵'];
            const avatars = ['👦', '👧', '🧑‍🦱', '👩‍🦰', '👱', '👱‍♀️', '🧔', '👩‍🦱', '👨‍🦲', '👩‍🦳', '🧔‍♂️', '👨‍🦰', '👩‍🦱', '👓'];
            const tags = ['计算达人', '逻辑怪才', '文案大师', '翻译专家', '实验能手'];

            let items: Omit<LeaderboardItem, 'rank'>[] = names.map((name, i) => {
                const xp = Math.floor(baseXP + Math.random() * range);
                return {
                    id: `student-${i}`,
                    name,
                    avatar: avatars[i % avatars.length],
                    xp,
                    isMe: false,
                    trend: (Math.random() > 0.5 ? 'up' : 'same') as 'up' | 'same' | 'down',
                    leagueStatus: calculateLeagueStatus(xp),
                    topAbilityTag: tags[i % tags.length]
                };
            });

            // Add current user
            const myXP = Math.floor(baseXP + range * 0.6); 
            items.push({
                id: 'me',
                name: '李华',
                avatar: '🤖',
                xp: myXP,
                isMe: true,
                trend: 'up',
                leagueStatus: calculateLeagueStatus(myXP),
                topAbilityTag: '逻辑强'
            });

            items.sort((a, b) => b.xp - a.xp);
            resolve(items.map((item, index) => ({ ...item, rank: index + 1 })));
        }, 300);
    });
};

// --- MOCK STATE MANAGEMENT ---
let currentPersona: UserPersona = 'average';
let hasCompletedAssessment = true; // Default true for average/ace
let userAcademicProfile: AcademicProfile | undefined = undefined;
const bookmarkedQuestionIds = new Set<string>();

/** 答对题目手动收藏到错题本（原型 mock） */
export const isQuestionBookmarked = (questionId: string) => bookmarkedQuestionIds.has(questionId);

export const toggleQuestionBookmark = (questionId: string) => {
    if (bookmarkedQuestionIds.has(questionId)) {
        bookmarkedQuestionIds.delete(questionId);
        return false;
    }
    bookmarkedQuestionIds.add(questionId);
    return true;
};

export const setMockPersona = (persona: UserPersona) => {
    currentPersona = persona;
    userAcademicProfile = undefined; // Reset
    if (persona === 'newbie') {
        hasCompletedAssessment = false;
    } else {
        hasCompletedAssessment = true;
    }
};

export const resetMockStateForDemo = () => {
    currentPersona = 'average';
    hasCompletedAssessment = true;
    userAcademicProfile = undefined;
    bookmarkedQuestionIds.clear();
    userUnlockedOutfits = ['uniform_school', 'none'];
    userCurrentOutfit = { outfit: 'uniform_school' };
    userCoins = 850;
};

export const setMockNewbieCalibrated = () => {
    currentPersona = 'newbie';
    hasCompletedAssessment = true;
    userAcademicProfile = {
        grade: '七年级',
        textbookVersion: '人教版',
        currentTopicId: 't3' 
    };
};

export const completeMockAssessment = (profile?: AcademicProfile) => {
    hasCompletedAssessment = true;
    if (profile) {
        userAcademicProfile = profile;
    }
};

// 将树形知识目录转换为 SubjectMap 节点（可复用）
const flattenKnowledgeToNodes = (tree: any[], subject: SubjectType, opts?: { mode?: MapMode; limit?: number }) => {
    const nodes: any[] = [];
    let seq = 1;
    const walk = (items: any[], depth = 1, xPhase = 0) => {
        items.forEach((item, idx) => {
            const id = `${subject}-${seq++}`;
            const nodeType = depth >= 4 ? 'level' : depth === 3 ? 'practice' : 'level';
            const status = nodes.length === 0 ? 'current' : 'completed';
            const xOffset = Math.round(Math.sin((xPhase + idx) * 1.2) * 60);
            nodes.push({
                id,
                level: nodes.length + 1,
                nodeType,
                title: item.name,
                status,
                stars: status === 'completed' ? 3 : 0,
                xOffset,
                description: item.children ? undefined : item.name,
            });
            if (item.children) walk(item.children, depth + 1, xPhase + idx + 1);
        });
    };
    walk(tree);
    return opts?.limit ? nodes.slice(0, opts.limit) : nodes;
};

export const getAcademicTopics = async (grade: string, subject: SubjectType): Promise<TopicNode[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (grade.includes('七')) {
                if (subject === '数学') {
                    resolve([
                        { id: 't1', label: '有理数', status: 'mastered', x: 15, y: 50, connections: ['t2'] },
                        { id: 't2', label: '整式加减', status: 'mastered', x: 35, y: 40, connections: ['t3'] },
                        { id: 't3', label: '一元一次方程', status: 'current', x: 55, y: 60, connections: ['t4', 't5'] },
                        { id: 't4', label: '几何图形', status: 'locked', x: 75, y: 30, connections: [] },
                        { id: 't5', label: '数据收集', status: 'locked', x: 85, y: 70, connections: [] },
                    ]);
                } else if (subject === '英语') {
                    resolve([
                        { id: 'e1', label: '自我介绍', status: 'mastered', x: 10, y: 50, connections: ['e2'] },
                        { id: 'e2', label: '介绍他人', status: 'mastered', x: 25, y: 40, connections: ['e3'] },
                        { id: 'e3', label: '物品归属', status: 'current', x: 45, y: 55, connections: ['e4', 'e5'] },
                        { id: 'e4', label: '位置表达', status: 'locked', x: 65, y: 35, connections: ['e6'] },
                        { id: 'e5', label: '物品拥有', status: 'locked', x: 70, y: 70, connections: ['e6'] },
                        { id: 'e6', label: '喜好表达', status: 'locked', x: 85, y: 50, connections: [] }
                    ]);
                } else if (subject === '语文') {
                    resolve([
                        { id: 'c1', label: '四季美景', status: 'mastered', x: 12, y: 50, connections: ['c2'] },
                        { id: 'c2', label: '亲情至爱', status: 'mastered', x: 28, y: 40, connections: ['c3'] },
                        { id: 'c3', label: '学习生活', status: 'current', x: 48, y: 60, connections: ['c4', 'c5'] },
                        { id: 'c4', label: '人生之舟', status: 'locked', x: 68, y: 30, connections: ['c6'] },
                        { id: 'c5', label: '动物与人', status: 'locked', x: 72, y: 75, connections: ['c6'] },
                        { id: 'c6', label: '想象之翼', status: 'locked', x: 88, y: 50, connections: [] }
                    ]);
                } else {
                    resolve([
                        { id: 't1', label: '基础概念', status: 'mastered', x: 20, y: 50, connections: ['t2'] },
                        { id: 't2', label: '核心模块', status: 'current', x: 50, y: 50, connections: ['t3'] },
                        { id: 't3', label: '进阶应用', status: 'locked', x: 80, y: 50, connections: [] },
                    ]);
                }
            } else {
                resolve([
                    { id: 't1', label: '基础概念', status: 'mastered', x: 20, y: 50, connections: ['t2'] },
                    { id: 't2', label: '核心模块', status: 'current', x: 50, y: 50, connections: ['t3'] },
                    { id: 't3', label: '进阶应用', status: 'locked', x: 80, y: 50, connections: [] },
                ]);
            }
        }, 500);
    });
};

export const generateDailyPlan = async (academicProfile?: AcademicProfile): Promise<DayPlan> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const profile = academicProfile || userAcademicProfile;

      if (currentPersona === 'newbie' && hasCompletedAssessment && profile) {
           resolve({
                id: 'plan-calibrated-1',
                title: '专属起航计划',
                description: `基于你的进度「${profile.grade} · ${profile.textbookVersion}」，Lumi 为你定制了无痛起步方案。`,
                totalXp: 300,
                tasks: [
                    {
                        id: 't-cal-gift',
                        title: '小晤 的见面礼',
                        subject: '综合',
                        durationMinutes: 2,
                        completed: false,
                        aiReasoning: '领取你的专属能力分析报告与首日徽章。',
                        levelType: 'chest'
                    },
                    {
                        id: 't-cal-1', 
                        title: '核心突破：一元一次方程', 
                        subject: '数学', 
                        durationMinutes: 15, 
                        completed: false,
                        aiReasoning: '检测到你正处于此章节，重点攻克“移项变号”易错点。',
                        levelType: 'practice',
                        quizType: 'standard'
                    },
                    {
                        id: 't-cal-2', 
                        title: '视觉化：方程的天平隐喻', 
                        subject: '数学', 
                        durationMinutes: 10, 
                        completed: false,
                        aiReasoning: '根据“视觉型”优势，用图形化方式理解抽象概念。',
                        levelType: 'level'
                    }
                ]
           });
           return;
      }

      if (currentPersona === 'newbie') {
          if (!hasCompletedAssessment) {
              resolve({
                id: 'plan-new-0',
                title: '激活你的学习档案',
                description: '小晤 需要了解你的能力模型，以便为你生成专属地图。',
                totalXp: 0,
                tasks: [
                    {
                        id: 'task-assess',
                        title: '🚀 启动能力测评',
                        subject: '综合',
                        durationMinutes: 3,
                        completed: false,
                        aiReasoning: '耗时 3 分钟，解锁完整功能与 200 XP 奖励。'
                    }
                ]
              });
          } else {
              resolve({
                id: 'plan-new-1',
                title: '新手启航计划',
                description: '根据测评结果，小晤 为你不仅配置了基础关卡，还准备了视觉化学习资料。',
                totalXp: 200, 
                tasks: [
                    {
                        id: 't-new-1', title: '一元一次方程：移项入门', subject: '数学', durationMinutes: 15, completed: false,
                        aiReasoning: '你的逻辑思维很强，我们直接从核心概念开始。'
                    },
                    {
                        id: 't-new-2', title: 'Unit 3: 核心词汇速记', subject: '英语', durationMinutes: 10, completed: false,
                        aiReasoning: '利用你的视觉优势，通过图像记忆单词。'
                    }
                ]
              });
          }
          return;
      }

      if (currentPersona === 'ace') {
          resolve({
            id: 'plan-ace',
            title: '巅峰挑战计划',
            description: '检测到状态火热，今日为你安排了高阶思维训练。',
            totalXp: 1200,
            tasks: [
                { id: 't-ace-1', title: '奥数：抽屉原理进阶', subject: '数学', durationMinutes: 45, completed: false, aiReasoning: '挑战你的逻辑极限。' },
                { id: 't-ace-2', title: 'TECT 英语阅读冲刺', subject: '英语', durationMinutes: 30, completed: true, aiReasoning: '保持语感，维持 S 级评价。' },
                { id: 't-ace-3', title: 'PBL: 火星基地热力学模拟', subject: '科学', durationMinutes: 60, completed: false, aiReasoning: '创新工坊项目关键节点。' }
            ]
          });
          return;
      }

      resolve({
        id: 'plan-1',
        title: '今日能量加油站',
        description: 'AI 根据你昨天的数学测验结果，为你定制了今天的专属计划。',
        totalXp: 450,
        tasks: [
          {
            id: 't1',
            title: '一元一次方程：移项与合并同类项',
            subject: '数学',
            durationMinutes: 20,
            completed: false,
            aiReasoning: '检测到你在昨天的作业中，移项时经常忘记变号，建议重点突击。'
          },
          {
            id: 't2',
            title: '古诗鉴赏：次北固山下',
            subject: '语文',
            durationMinutes: 15,
            completed: false,
            aiReasoning: '这首诗是期中考的必考重点，特别是颔联的哲理。'
          },
          {
            id: 't3',
            title: '英语听力：Unit 3 Daily Routine',
            subject: '英语',
            durationMinutes: 30,
            completed: false,
            aiReasoning: '针对你“长对话理解”薄弱项，生成了专项强化训练。'
          }
        ]
      });
    }, 500);
  });
};

export const getSubjectMapData = async (subject: SubjectType, mode: MapMode = 'sync'): Promise<SubjectData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let nodes = [];
      const isAce = currentPersona === 'ace';
      const isNewbie = currentPersona === 'newbie';
      const newbieUnlocked = hasCompletedAssessment;

      const helpers: MapBuilderHelpers = {
        flattenKnowledgeToNodes,
        mathProNodes: [
            { 
                id: 'p1', level: 1, nodeType: 'level', title: '逻辑觉醒', status: (isNewbie && !newbieUnlocked) ? 'locked' : 'completed', stars: 3, 
                position: { x: 50, y: 85 }, abilityType: 'logic', description: '基础逻辑推理与模式识别'
            },
            { 
                id: 'p2', level: 2, nodeType: 'level', title: '空间折叠', status: isNewbie ? (newbieUnlocked ? 'current' : 'locked') : 'current', stars: isAce ? 3 : 0, 
                position: { x: 25, y: 65 }, abilityType: 'spatial', description: '三维图形展开与旋转想象', duration: '30分钟'
            },
            { 
                id: 'p3', level: 3, nodeType: 'level', title: '极速运算', status: isAce ? 'completed' : 'locked', stars: isAce ? 3 : 0, 
                position: { x: 75, y: 65 }, abilityType: 'compute', description: '24点与速算技巧'
            },
            { 
                id: 'p4', level: 4, nodeType: 'level', title: '记忆殿堂', status: isAce ? 'completed' : 'locked', stars: isAce ? 3 : 0, 
                position: { x: 20, y: 35 }, abilityType: 'memory', description: '瞬间数字记忆训练'
            },
            { 
                id: 'p5', level: 5, nodeType: 'level', title: '语言解码', status: isAce ? 'completed' : 'locked', stars: isAce ? 3 : 0, 
                position: { x: 80, y: 35 }, abilityType: 'verbal', description: '密码破译与文字逻辑'
            },
            { 
                id: 'pboss', level: 6, nodeType: 'boss', title: '思维奇点', status: isAce ? 'current' : 'locked', stars: 0, 
                position: { x: 50, y: 15 }, description: '综合素质极限挑战'
            },
        ],
        mathSyncNodes: [
              // --- WEEK 1: FOUNDATIONS (All Completed) ---
              { id: 'm1', level: 1, nodeType: 'level', title: '有理数运算', status: 'completed', stars: 3, taskTitle: '数轴探秘', chapterNodeType: 'intuition', durationMinutes: 8, icon: '🔮', learningGoals: ['理解数轴的基本概念'], xOffset: 0 },
              { id: 'm2', level: 2, nodeType: 'level', title: '整式的加减', status: 'completed', stars: 2, taskTitle: '同类项判别', chapterNodeType: 'clinic', durationMinutes: 3, icon: '🏥', learningGoals: ['识别同类项'], xOffset: -60 },
              { id: 'm3', level: 3, nodeType: 'level', title: '相反数', status: 'completed', stars: 3, taskTitle: '镜像世界', chapterNodeType: 'practice', durationMinutes: 5, xOffset: 60 },
              { id: 'm4', level: 4, nodeType: 'level', title: '绝对值', status: 'completed', stars: 3, taskTitle: '距离度量', chapterNodeType: 'practice', durationMinutes: 6, xOffset: 0 },
              { id: 'm5', level: 5, nodeType: 'chest', title: '阶段奖励', status: 'completed', stars: 0, description: '包含 50 金币', xOffset: -60 },
              { id: 'm6', level: 6, nodeType: 'level', title: '乘方入门', status: 'completed', stars: 2, taskTitle: '指数爆炸', chapterNodeType: 'intuition', durationMinutes: 5, xOffset: 60 },
              { id: 'm7', level: 7, nodeType: 'level', title: '科学计数法', status: 'completed', stars: 3, taskTitle: '微观宇宙', chapterNodeType: 'application', durationMinutes: 8, xOffset: 0 },

              // --- WEEK 2: EQUATIONS (Days 1-3 Completed, Day 4 Current) ---
              { id: 'm8', level: 8, nodeType: 'level', title: '方程初步', status: 'completed', stars: 3, taskTitle: '天平平衡', chapterNodeType: 'intuition', durationMinutes: 5, xOffset: 0 },
              { id: 'm9', level: 9, nodeType: 'level', title: '移项变号', status: 'completed', stars: 2, taskTitle: '符号魔法', chapterNodeType: 'clinic', durationMinutes: 10, description: '重点攻克易错点', xOffset: -60 },
              { id: 'm10', level: 10, nodeType: 'level', title: '去括号', status: 'completed', stars: 3, taskTitle: '层层剥茧', chapterNodeType: 'practice', durationMinutes: 12, xOffset: 60 },
              
              // === CURRENT MISSION (Day 4) ===
              { id: 'm11', level: 11, nodeType: 'level', title: '去分母', status: 'current', stars: 0, taskTitle: '分数消消乐', chapterNodeType: 'practice', durationMinutes: 15, xOffset: 0 },
              
              // --- Future Locked ---
              { id: 'm12', level: 12, nodeType: 'chest', title: '勇者宝箱', status: 'locked', stars: 0, description: '稀有道具', xOffset: -60 },
              { id: 'm13', level: 13, nodeType: 'level', title: '方程检验', status: 'locked', stars: 0, taskTitle: '真理验证', chapterNodeType: 'gatekeeper', durationMinutes: 8, xOffset: 60 },
              { id: 'm14', level: 14, nodeType: 'level', title: '一元一次方程', status: 'locked', stars: 0, taskTitle: '解方程马拉松', chapterNodeType: 'practice', durationMinutes: 20, xOffset: 0 },

              // --- WEEK 3: APPLICATIONS (All Locked) ---
              { id: 'm15', level: 15, nodeType: 'level', title: '行程问题', status: 'locked', stars: 0, taskTitle: '追及相遇', chapterNodeType: 'application', durationMinutes: 15, xOffset: 0 },
              { id: 'm16', level: 16, nodeType: 'level', title: '工程问题', status: 'locked', stars: 0, taskTitle: '合作效率', chapterNodeType: 'application', durationMinutes: 15, xOffset: -60 },
              { id: 'm17', level: 17, nodeType: 'level', title: '销售问题', status: 'locked', stars: 0, taskTitle: '利润计算器', chapterNodeType: 'application', durationMinutes: 12, xOffset: 60 },
              { id: 'm18', level: 18, nodeType: 'level', title: '储蓄问题', status: 'locked', stars: 0, taskTitle: '理财小能手', chapterNodeType: 'application', durationMinutes: 10, xOffset: 0 },
              { id: 'm19', level: 19, nodeType: 'chest', title: '传说宝箱', status: 'locked', stars: 0, description: '神秘大奖', xOffset: -60 },
              { id: 'm20', level: 20, nodeType: 'level', title: '综合应用', status: 'locked', stars: 0, taskTitle: '生活数学', chapterNodeType: 'practice', durationMinutes: 20, xOffset: 60 },
              { id: 'boss1', level: 21, nodeType: 'boss', title: 'Chapter Boss', status: 'locked', stars: 0, taskTitle: '最终试炼', chapterNodeType: 'gatekeeper', durationMinutes: 30, xOffset: 0 },
        ],
      };

      const cfg = SUBJECT_CONFIGS[subject as keyof typeof SUBJECT_CONFIGS];
      if (!cfg) {
        resolve({ subject, nodes: [] as any });
        return;
      }
      const resolvedNodes = cfg.mapBuilder
        ? cfg.mapBuilder(mode as any, helpers)
        : helpers.flattenKnowledgeToNodes(cfg.knowledgeTree, subject, { mode });
      nodes = resolvedNodes || [];

      resolve({ subject, nodes: nodes as any });
    }, 300);
  });
}

export const getMistakeVaultData = async (): Promise<MistakeVaultData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        if (currentPersona === 'newbie') {
            resolve({
                totalPending: 0,
                subjectStats: [
                    { subject: '数学', pendingCount: 0, solvedPercentage: 0, weak: 0, reviewing: 0, mastered: 0, total: 0 },
                    { subject: '英语', pendingCount: 0, solvedPercentage: 0, weak: 0, reviewing: 0, mastered: 0, total: 0 },
                    { subject: '语文', pendingCount: 0, solvedPercentage: 0, weak: 0, reviewing: 0, mastered: 0, total: 0 },
                ],
                groups: []
            });
            return;
        }

        const reasonPool = ['审题有误', '知识点忘了', '想不到思路', '计算出错', '时间不够做完', '蒙的/不会', '公式用错/条件不符', '概念模糊'];

        const mapState = (cog?: string): 'new' | 'reviewing' | 'mastered' => {
          if (cog === 'MASTERED') return 'mastered';
          if (cog === 'FADED') return 'reviewing';
          return 'new';
        };

        const mathMistakeIds = [
          'q-math-015',
          'q-math-001',
          'q-math-013',
          'q-math-014',
          'q-math-002',
          'q-math-003',
          'q-math-005',
          'q-math-006',
          'q-math-007',
          'q-math-008',
        ];
        const mistakes = mathMistakeIds
          .map((id) => mathQuestions.find((q) => q.id === id))
          .filter((q): q is NonNullable<typeof q> => !!q)
          .map((q, idx) => {
          const topic = q.knowledgePoints?.[0] || '未分类';
          const errorType = reasonPool[idx % reasonPool.length] as any;
          const status = mapState(q.cognitiveState);
          const isSurveyDemo = q.id === 'q-math-015';
          const correctAttempts = isSurveyDemo ? 0 : (q.correctCount ?? Math.max(2, 10 - idx));
          const wrongAttempts = isSurveyDemo ? 2 : (q.wrongCount ?? Math.max(1, idx + 1));
          const totalAttempts = correctAttempts + wrongAttempts;
          return {
            id: `mist-${q.id}`,
            questionSnippet: isSurveyDemo
              ? '课外活动项目调查统计（填空）'
              : q.content.stem.slice(0, 48) + (q.content.stem.length > 48 ? '...' : ''),
            fullQuestion: q.content.stem,
            subject: '数学',
            topic: isSurveyDemo ? '统计表' : topic,
            errorType,
            status,
            lastReview: isSurveyDemo ? '刚刚' : `${idx + 1}天前`,
            tags: q.tags,
            knowledgePoints: q.knowledgePoints,
            questionType: q.type,
            difficulty: q.difficulty,
            category: q.category,
            correctAttempts,
            wrongAttempts,
            totalAttempts,
            lastAttemptAt: isSurveyDemo ? '2026-06-29' : '2024-01-0' + ((idx % 7) + 1),
            similarIds: q.similarIds,
            stats: { 
              errorCount: wrongAttempts,
              reviewCount: Math.max(0, Math.floor(correctAttempts / 3)),
              correctCount: Math.max(0, correctAttempts - wrongAttempts),
              mastered: status === 'mastered',
              isStarred: !!q.bookmarked,
              lastWrongDate: '2024-01-0' + ((idx % 7) + 1),
            },
            correctAnswer: Array.isArray(q.result?.correctAnswer)
              ? q.result.correctAnswer.join('、')
              : (q.result?.correctAnswer as string),
            userWrongAnswer: isSurveyDemo ? '体育运动、10、20%' : (q.content.originalImageUrl ? '24;12n;150' : '12'),
            analysis: q.result.explanation,
          };
        });

        // 生成语文错题数据
        const chineseMistakes = chineseQuestions.slice(0, 5).map((q, idx) => {
          const topic = q.knowledgePoints?.[0] || '未分类';
          const errorType = reasonPool[(idx + 7) % reasonPool.length] as any; // 错开数学的错误类型
          const status = mapState(q.cognitiveState);
          const correctAttempts = q.correctCount ?? Math.max(2, 8 - idx);
          const wrongAttempts = q.wrongCount ?? Math.max(1, idx + 1);
          const totalAttempts = correctAttempts + wrongAttempts;
          return {
            id: `mist-${q.id}`,
            questionSnippet: q.content.stem.slice(0, 32) + (q.content.stem.length > 32 ? '...' : ''),
            fullQuestion: q.content.stem,
            subject: '语文',
            topic,
            errorType,
            status,
            lastReview: `${idx + 2}天前`,
            tags: q.tags,
            knowledgePoints: q.knowledgePoints,
            questionType: q.type,
            difficulty: q.difficulty,
            category: q.category,
            correctAttempts,
            wrongAttempts,
            totalAttempts,
            lastAttemptAt: '2024-01-0' + ((idx % 5) + 3), // 错开数学的时间
            similarIds: q.similarIds,
            stats: {
              errorCount: wrongAttempts,
              reviewCount: Math.max(0, Math.floor(correctAttempts / 3)),
              correctCount: Math.max(0, correctAttempts - wrongAttempts),
              mastered: status === 'mastered',
              isStarred: !!q.bookmarked,
              lastWrongDate: '2024-01-0' + ((idx % 5) + 3),
            },
            correctAnswer: Array.isArray(q.result.correctAnswer) ? q.result.correctAnswer.join('、') : (q.result.correctAnswer as string),
            userWrongAnswer: q.type === 'dictation' ? '示例答案' : 'B', // 根据题目类型设置不同的错误答案
            analysis: q.result.explanation,
          };
        });

        // 生成英语错题数据
        const englishMistakes = englishQuestions.slice(0, 4).map((q, idx) => {
          const topic = q.knowledgePoints?.[0] || '未分类';
          const errorType = reasonPool[(idx + 12) % reasonPool.length] as any; // 继续错开错误类型
          const status = mapState(q.cognitiveState);
          const correctAttempts = q.correctCount ?? Math.max(2, 7 - idx);
          const wrongAttempts = q.wrongCount ?? Math.max(1, idx + 1);
          const totalAttempts = correctAttempts + wrongAttempts;
          return {
            id: `mist-${q.id}`,
            questionSnippet: q.content.stem.slice(0, 32) + (q.content.stem.length > 32 ? '...' : ''),
            fullQuestion: q.content.stem,
            subject: '英语',
            topic,
            errorType,
            status,
            lastReview: `${idx + 1}天前`,
            tags: q.tags,
            knowledgePoints: q.knowledgePoints,
            questionType: q.type,
            difficulty: q.difficulty,
            category: q.category,
            correctAttempts,
            wrongAttempts,
            totalAttempts,
            lastAttemptAt: '2024-01-0' + ((idx % 4) + 6), // 错开其他学科的时间
            similarIds: q.similarIds,
            stats: {
              errorCount: wrongAttempts,
              reviewCount: Math.max(0, Math.floor(correctAttempts / 3)),
              correctCount: Math.max(0, correctAttempts - wrongAttempts),
              mastered: status === 'mastered',
              isStarred: !!q.bookmarked,
              lastWrongDate: '2024-01-0' + ((idx % 4) + 6),
            },
            correctAnswer: Array.isArray(q.result.correctAnswer) ? q.result.correctAnswer.join('、') : (q.result.correctAnswer as string),
            userWrongAnswer: q.type.includes('listening') ? 'B' : 'went', // 听力题和词汇题不同的错误答案
            analysis: q.result.explanation,
          };
        });

        const extraSubjectSeeds: Array<{
          subject: string;
          topic: string;
          stem: string;
          status: 'new' | 'reviewing' | 'mastered';
          lastReview: string;
        }> = [
          { subject: '物理', topic: '力和运动', stem: '关于牛顿第一定律，下列说法正确的是？', status: 'new', lastReview: '2天前' },
          { subject: '物理', topic: '光学', stem: '光从空气斜射入水中时，折射角与入射角的关系是？', status: 'reviewing', lastReview: '昨天' },
          { subject: '化学', topic: '物质构成', stem: '原子由原子核和核外电子构成，原子核包含？', status: 'new', lastReview: '3天前' },
          { subject: '道德与法治', topic: '权利与义务', stem: '公民的基本权利与义务之间的关系，下列理解正确的是？', status: 'reviewing', lastReview: '今天' },
          { subject: '历史', topic: '中国近代史', stem: '辛亥革命的历史意义主要体现在？', status: 'new', lastReview: '4天前' },
          { subject: '科学', topic: '生命科学', stem: '绿色植物进行光合作用需要的条件包括？', status: 'reviewing', lastReview: '1天前' },
        ];

        const extraSubjectMistakes = extraSubjectSeeds.map((seed, idx) => ({
          id: `mist-extra-${seed.subject}-${idx + 1}`,
          questionSnippet: seed.stem,
          fullQuestion: seed.stem,
          subject: seed.subject,
          topic: seed.topic,
          errorType: reasonPool[(idx + 3) % reasonPool.length] as any,
          status: seed.status,
          lastReview: seed.lastReview,
          tags: [seed.topic],
          knowledgePoints: [seed.topic],
          questionType: 'single_choice',
          difficulty: 2,
          category: 'synchronous',
          correctAttempts: seed.status === 'reviewing' ? 1 : 0,
          wrongAttempts: 1,
          totalAttempts: seed.status === 'reviewing' ? 2 : 1,
          lastAttemptAt: seed.lastReview,
          similarIds: [],
          stats: {
            errorCount: 1,
            reviewCount: seed.status === 'reviewing' ? 1 : 0,
            correctCount: seed.status === 'reviewing' ? 1 : 0,
            mastered: false,
            isStarred: false,
            lastWrongDate: seed.lastReview,
          },
          correctAnswer: 'A',
          userWrongAnswer: 'C',
          analysis: `本题考查「${seed.topic}」，订正后建议再做 1 道同类题巩固。`,
        }));

        // 合并所有学科的错题数据
        const allMistakes = [...mistakes, ...chineseMistakes, ...englishMistakes, ...extraSubjectMistakes];

        const groups = allMistakes.reduce<Record<string, any>>((acc, m) => {
          if (!acc[m.topic]) acc[m.topic] = { topic: m.topic, count: 0, items: [] as any[] };
          acc[m.topic].items.push(m);
          acc[m.topic].count += 1;
          return acc;
        }, {});

        const totalPending = allMistakes.filter(m => m.status !== 'mastered').length;
        const subjectStats = ['数学', '英语', '语文', '物理', '化学', '道德与法治', '历史', '生物', '地理', '科学'].map((subject) => {
          const items = allMistakes.filter(m => m.subject === subject);
          const weak = items.filter(m => m.status === 'new').length;
          const reviewing = items.filter(m => m.status === 'reviewing').length;
          const mastered = items.filter(m => m.status === 'mastered').length;
          return {
            subject,
            pendingCount: weak + reviewing,
            solvedPercentage: items.length ? Math.round((mastered / items.length) * 100) : 0,
            weak,
            reviewing,
            mastered,
            total: items.length,
          };
        });

        resolve({
          totalPending,
          subjectStats,
          groups: Object.values(groups),
        });
    }, 400);
  });
};

export const generateMistakeVariant = async (originalId: string): Promise<VariantQuestion> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: `variant-${Date.now()}`,
                content: '变式训练：已知直角三角形的两边长分别为 6 和 8，求第三边的长度。',
                correctAnswer: '10 或 2√7',
                options: ['10', '2√7', '10 或 2√7', '14'],
                explanation: '考点与原题一致：分类讨论。① 6,8为直角边 => √(36+64)=10。② 8为斜边 => √(64-36)=√28=2√7。'
            });
        }, 1500); 
    });
}

export const getUserGrowthData = async (): Promise<UserProfileData> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const xpToUse = currentPersona === 'newbie' ? (hasCompletedAssessment ? 200 : 0) : (currentPersona === 'ace' ? 19800 : 3200);
            const commonData = {
                leagueStatus: calculateLeagueStatus(xpToUse)
            };

            if (currentPersona === 'newbie') {
                if (!hasCompletedAssessment) {
                    resolve({
                        name: "李华", level: 0, currentXp: 0, nextLevelXp: 200, coins: 0,
                        abilities: { logic: 0, memory: 0, focus: 0, creativity: 0, grit: 0 },
                        assessmentResult: undefined, 
                        achievements: [{ id: 'a1', title: '初来乍到', description: '完成注册', icon: '🐣', unlocked: true, dateUnlocked: '刚刚' }],
                        unlockedOutfitIds: ['uniform_school'],
                        currentOutfit: { outfit: 'uniform_school' },
                        ...commonData
                    });
                } else {
                    resolve({
                        name: "李华", level: 1, currentXp: 200, nextLevelXp: 500, coins: 50,
                        abilities: { logic: 70, memory: 65, focus: 80, creativity: 60, grit: 75 },
                        assessmentResult: {
                            personaTags: ['逻辑 S+', '空间 S', '潜力股'], 
                            radarData: [
                                { subject: '逻辑', score: 92, fullMark: 100 },
                                { subject: '空间', score: 88, fullMark: 100 },
                                { subject: '言语', score: 85, fullMark: 100 },
                                { subject: '人际', score: 80, fullMark: 100 },
                                { subject: '内省', score: 75, fullMark: 100 },
                                { subject: '音乐', score: 70, fullMark: 100 },
                                { subject: '动觉', score: 65, fullMark: 100 },
                                { subject: '自然', score: 60, fullMark: 100 },
                            ],
                            aiEfficiency: { removedTasks: 15, savedTime: '30分钟' },
                            archetype: { 
                                title: "维度探索者", 
                                slogan: "你擅长在脑海中构建多维世界，逻辑与图形是你的双翼。", 
                                iconType: 'explorer', 
                                colorTheme: "from-purple-500 to-indigo-600" 
                            },
                            prescription: { learningMode: "极速理解模式", interactionPref: "视觉化辅助", dailyFocus: "错题归因训练" },
                            projection: { metric: "计算准确率", current: 75, target: 85, days: 14 }
                        }, 
                        achievements: [
                            { id: 'a1', title: '初来乍到', description: '完成注册', icon: '🐣', unlocked: true, dateUnlocked: '1天前' },
                            { id: 'a3', title: '潜力无限', description: '完成能力画像测评', icon: '🔮', unlocked: true, dateUnlocked: '刚刚' },
                        ],
                        unlockedOutfitIds: ['uniform_school'],
                        currentOutfit: { outfit: 'uniform_school' },
                        academicInfo: userAcademicProfile,
                        ...commonData
                    });
                }
                return;
            }

            if (currentPersona === 'ace') {
                resolve({
                    name: "Hermione", level: 20, currentXp: 19800, nextLevelXp: 20000, coins: 9999,
                    abilities: { logic: 98, memory: 95, focus: 99, creativity: 90, grit: 100 },
                    unlockedOutfitIds: ['uniform_school', 'hat_grad', 'glasses_smart', 'ears_cat', 'book_magic', 'pen_feather', 'suit_space'],
                    currentOutfit: { outfit: 'suit_space', headwear: 'glasses_smart', handheld: 'book_magic' },
                    assessmentResult: {
                        personaTags: ['六边形战士', '极速流', '完美主义'],
                        radarData: [
                            { subject: '逻辑', score: 98, fullMark: 100, analysis: '逻辑推理能力已达中学阶段顶峰，建议挑战竞赛题。' },
                            { subject: '基础', score: 100, fullMark: 100, analysis: '基础知识无懈可击，无需重复练习。' },
                            { subject: '专注', score: 99, fullMark: 100, analysis: '拥有惊人的心流控制力。' },
                            { subject: '悟性', score: 95, fullMark: 100, analysis: '融会贯通，触类旁通。' },
                            { subject: '计算', score: 96, fullMark: 100, analysis: '计算准确率极高。' },
                        ],
                        aiEfficiency: { removedTasks: 80, savedTime: '15小时' },
                        archetype: { title: "全能六边形战士", slogan: "无懈可击，追求极致的完美主义者。", iconType: 'polymath', colorTheme: "from-yellow-400 to-orange-500" },
                        prescription: { learningMode: "竞赛冲刺模式", interactionPref: "极简高效", dailyFocus: "高阶思维拓展" },
                        projection: { metric: "综合排名", current: 98, target: 99.9, days: 30 }
                    },
                    achievements: [
                        { id: 'a1', title: '全服第一', description: '排行榜榜首维持30天', icon: '👑', unlocked: true },
                        { id: 'a2', title: '独孤求败', description: '错题本清空保持7天', icon: '🏔️', unlocked: true },
                        { id: 'a3', title: '创新先锋', description: '完成 10 个 PBL 项目', icon: '🚀', unlocked: true },
                    ],
                    ...commonData
                });
                return;
            }

            resolve({
                name: "李华", level: 5, currentXp: 3200, nextLevelXp: 5000, coins: userCoins,
                abilities: { logic: 85, memory: 60, focus: 90, creativity: 85, grit: 70 },
                unlockedOutfitIds: userUnlockedOutfits,
                currentOutfit: userCurrentOutfit,
                assessmentResult: {
                    personaTags: ['逻辑 S+', '空间 S', '潜力股'], 
                    radarData: [
                        { subject: '逻辑', score: 92, fullMark: 100 },
                        { subject: '空间', score: 88, fullMark: 100 },
                        { subject: '言语', score: 85, fullMark: 100 },
                        { subject: '人际', score: 80, fullMark: 100 },
                        { subject: '内省', score: 75, fullMark: 100 },
                        { subject: '音乐', score: 70, fullMark: 100 },
                        { subject: '动觉', score: 65, fullMark: 100 },
                        { subject: '自然', score: 60, fullMark: 100 },
                    ],
                    aiEfficiency: { removedTasks: 30, savedTime: '2小时' },
                    archetype: { 
                        title: "维度探索者", 
                        slogan: "你擅长在脑海中构建多维世界，逻辑与图形是你的双翼。", 
                        iconType: 'explorer', // Keep for compatibility
                        colorTheme: "from-purple-500 to-indigo-600" 
                    },
                    prescription: { learningMode: "极速理解模式", interactionPref: "视觉化辅助", dailyFocus: "错题归因训练" },
                    projection: { metric: "计算准确率", current: 75, target: 85, days: 14 }
                },
                achievements: [
                    { id: 'a1', title: '早起鸟', description: '连续7天在早上8点前完成打卡', icon: '🌅', unlocked: true, dateUnlocked: '2023-10-01' },
                    { id: 'a2', title: '数学之星', description: '数学单元测试满分', icon: '📐', unlocked: true, dateUnlocked: '2023-10-15' },
                    { id: 'a3', title: '专注大师', description: '单次专注时长超过60分钟', icon: '🧘', unlocked: true, dateUnlocked: '2023-10-20' },
                ],
                ...commonData
            });
        }, 400);
    });
}

// Essay mocks remain unchanged
export const mockEssayOCR = async (type: 'english' | 'chinese'): Promise<EssayData> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (type === 'english') {
                resolve({
                    id: 'essay-demo-en', subject: '英语', title: 'Technology in Our Life',
                    content: "Technology is very important in our life today. It makes our life fast and easy. For example, we use smartphones to talk with friends and buy things online. Last week, I buy a new phone. It was very expensive but useful.\n\nHowever, technology also has bad sides. Many students play video games all day and do not do homeworks. I think this is terrible. Also, people do not talk face to face anymore. They just send messages.\n\nIn my opinion, we should use technology smart. We can use it to learn new things, not just for play. If we use it good, it will help us a lot."
                });
            } else {
                resolve({
                    id: 'essay-demo-cn', subject: '语文', title: '那一次，我长大了',
                    content: "窗外的蝉鸣声嘶力竭，夏日的午后总是让人昏昏欲睡. 我坐在书桌前，盯着眼前这道怎么也解不开的数学题，心里烦躁得像有一团火在烧..."
                });
            }
        }, 1500);
    });
};

export const analyzeEssay = async (essay: EssayData): Promise<EssayAnalysisResult> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (essay.subject === '英语') {
                resolve({
                    score: 78,
                    radarData: [
                        { dimension: '词汇', score: 72, fullMark: 100 },
                        { dimension: '语法', score: 68, fullMark: 100 },
                        { dimension: '结构', score: 85, fullMark: 100 },
                        { dimension: '内容', score: 80, fullMark: 100 },
                        { dimension: '连贯', score: 78, fullMark: 100 },
                    ],
                    generalComment: "文章结构清晰，分论点明确。时态运用存在一些不一致，部分词汇搭配偏中式英语（Chinglish），建议积累更多地道表达。",
                    annotations: [
                        {
                            id: 'en1', type: 'suggestion', originalText: 'fast and easy', startIndex: 52, endIndex: 65,
                            suggestion: 'convenient and efficient', distractors: ['quick and simple'],
                            contextQuery: '在正式的科技类写作中，哪个表达更专业？',
                            explanation: 'fast and easy 比较口语化，convenient and efficient 更书面、更高级。'
                        }
                    ],
                    improvedVersion: "Technology plays a crucial role in our lives today. It makes our lives convenient and efficient..."
                });
            } else {
                resolve({
                    score: 88,
                    radarData: [
                        { dimension: '立意', score: 90, fullMark: 100 },
                        { dimension: '描写', score: 85, fullMark: 100 },
                        { dimension: '结构', score: 88, fullMark: 100 },
                        { dimension: '情感', score: 92, fullMark: 100 },
                        { dimension: '文采', score: 80, fullMark: 100 },
                    ],
                    generalComment: "这是一篇非常感人的记叙文。通过“解题-冲突-愧疚-和解”的情节波折，自然地引出了成长的感悟。",
                    annotations: []
                });
            }
        }, 2000);
    });
};

export const getHistorySnapshot = async (id: string, type: 'english' | 'chinese'): Promise<{ essay: EssayData, result: EssayAnalysisResult }> => {
    const essay = await mockEssayOCR(type);
    const result = await analyzeEssay(essay);
    return { essay, result };
};
