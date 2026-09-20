# AI伴学 V2.0 核心架构地图

> 用途：原型迭代时先查本文件定位影响范围，再按需读取目标文件及直接依赖。它是代码导航，不替代 `docs/v2.0/` 中的产品需求。
>
> 更新范围：学生端主原型 `ai_friend_v2.0`；不包含根目录的历史版本、数据处理脚本、素材库和 `promo/` 独立宣传项目。

## 1. 快速入口

| 要找什么 | 优先文件 | 说明 |
|---|---|---|
| 应用启动与全局样式 | `index.tsx` | 挂载 React、错误边界、加载 `styles/ui-clarity.css` |
| 学生端总编排 / 页面切换 | `App.tsx` | Tab、旅程阶段、全局弹层、平板舞台与主要跨页状态 |
| 运行与构建 | `package.json`、`vite.config.ts` | Vite + React + TypeScript；检查命令见下文 |
| 页面和流程的产品定义 | `docs/v2.0/05-产品地图与流程/01-全站页面地图.md` | 五 Tab、跨 Tab 流程和业务边界 |
| 项目工程约束 | `docs/v2.0/00-工程治理/AI伴学V2.0-工程治理说明.md` | 已完成治理、保留模块和技术债务 |

### 开发命令

```text
npm run dev        # 本地预览（Vite，默认 3000）
npm run typecheck  # TypeScript 检查
npm run build      # 生产构建
npm run check      # typecheck + build
```

## 2. 运行壳与导航

```text
index.tsx
  └─ App.tsx
      ├─ appMode：student / teacher / internal
      ├─ journeyPhase：启动、登录、测评、学习流、dashboard
      └─ dashboard + activeTab
          ├─ today    → DashboardImmersive
          ├─ subject  → SubjectMap
          ├─ mistake  → MistakeVault
          ├─ partner  → LumiSpace
          └─ me       → GrowthProfile
```

- `components/Layout/BottomNav.tsx` 只定义五个底栏 ID 与点击回调；不要把业务状态塞入此处。
- `App.tsx` 负责决定何时隐藏底栏：学习、错题详情、同步课时、我的课本、AI 工具、设置/商城/报告等全屏或弹层状态都会隐藏。
- 学生端的 `activeTab` 默认是 `today`；`appMode` 为 `teacher` 或 `internal` 时，改由 `TeacherApp` / `InternalAdminApp` 独立渲染。
- 旅程状态（登录、学情罗盘、测评、学习流）由 `journeyPhase` 管理，不属于日常五 Tab。

## 3. 业务模块索引

| 业务区 | 主组件 | 在 `App.tsx` 的主要入口 / 关联点 | 先读哪些直接依赖 |
|---|---|---|---|
| 首页 | `components/Dashboard/DashboardImmersive.tsx` | `activeTab === 'today'` | 首页所需的卡片组件；`Dashboard/SelfPracticePage.tsx`、`SyncStudyPickerPage.tsx`、`SyncStudySubjectPage.tsx`（涉及同步学或练习时） |
| 学科 / 同步学习 | `components/SubjectMap/SubjectMap.tsx` | `activeTab === 'subject'` | `SyncSectionPage.tsx`、`SyncSelfTestPage.tsx`、`PracticeSetupDialog.tsx`；对应 `data/junior*` 数据 |
| 错题 | `components/MistakeVault/MistakeVault.tsx` | `activeTab === 'mistake'` | `services/mistakeReasonService.ts`、`services/questionFeedbackService.ts`；若涉及订正奖励再读 `rewardService.ts` |
| 伙伴（小晤） | `components/LumiSpace/LumiSpace.tsx` | `activeTab === 'partner'` | `lumiHubData.ts`、`lumiWebSearch.ts`、`lumiChatSpeech.ts`；深度会话通过回调隐藏底栏 |
| 我的 / 成长 | `components/Growth/GrowthProfile.tsx` | `activeTab === 'me'` | `Growth/MyTextbooksPage.tsx`、`services/academicContextStore.ts`、`services/textbookVersionStore.ts` |
| 学习任务流 | `components/Learning/LearningFlow.tsx` | `journeyPhase === 'learning'` | 任务来源、`types/learningReturn.ts`、奖励服务 |
| 测评 | `components/Assessment/AssessmentFlow.tsx`、`AssessmentResult.tsx` | `journeyPhase === 'assessment'` / 报告弹层 | `data/juniorSyncAssessment.ts`、用户档案数据 |
| 答题 | `components/Quiz/QuizPage.tsx`、`SteppingQuizPage.tsx`、`UniversalQuiz*.tsx` | 由首页、学科、错题等流程打开 | `data/questionBank/`、`services/questionSteppingService.ts`、`services/practicedQuestionStore.ts` |
| AI 讲题 / 拍照 | `components/Dashboard/AITutorLayer.tsx`、`ProblemPaperView.tsx` | 首页或伙伴通过回调打开 | `data/aiSolveMockData.ts`；如改真实模型接入再读 `services/qwenService.ts` / `geminiService.ts` |
| 设置、商城、作文、奖励 | `Settings/`、`Store/`、`EssayLab/`、`Rewards/` | 均由 `App.tsx` 的全局开关编排 | 目标组件 + `services/rewardService.ts`（涉及奖励时） |
| 教师 / 内部后台 | `components/Teacher/TeacherApp.tsx`、`components/InternalAdmin/InternalAdminApp.tsx` | 由开发演示控制器切换 | 与学生端五 Tab 解耦；无明确需求不要读取或改动 |

## 4. 关键共享状态与数据边界

| 状态 / 数据 | 归属 | 影响面 | 修改警示 |
|---|---|---|---|
| 当前 Tab、旅程、全局弹层、任务上下文 | `App.tsx` 本地 state | 全学生端 | 新增全局流程前先确认能否下沉到模块；避免继续扩大 `App.tsx` |
| 学制、年级、学期 | `services/academicContextStore.ts` | 首页选科、学科、我的课本 | 只有“我的 → 我的课本”允许改；其他页面只读展示 |
| 各科教材版本 | `services/textbookVersionStore.ts` | 同步学习目录与教材展示 | 版本须与当前年级、学期、学制的可选列表一致 |
| 同步课本进度 | `services/syncProgressStore.ts`、`syncMicroLessonProgress.ts` | 同步课时、视频与练习状态 | `SyncBookKey` 包含学科、版本、年级、学期；不要简化其维度 |
| 奖励 / 经验 / 金币 | `services/rewardService.ts` + `App.tsx` 的 `userStats` | 首页、我的、错题订正等 | 完成奖励需走 `onRewardGranted`，以保持 UI 刷新一致 |
| 错题反馈 / 原因 | `services/questionFeedbackService.ts`、`mistakeReasonService.ts` | 错题本与订正体验 | 目前为浏览器本地持久化 mock |
| 知识树掌握状态 | `services/knowledgeTreeService.ts` | 学科图谱与节点练习回流 | 进度与返回节点使用本地/会话存储 |
| 演示数据重置 | `services/demoStateService.ts` | 全部浏览器 mock 状态 | 新增持久化 key 时必须同步加入此服务，保证“重置演示数据”完整 |

## 5. 代码与资源目录约定

```text
components/  页面级模块及可复用 UI（按业务域分目录）
data/        原型 mock、题库、教材目录与演示数据
services/    本地持久化、规则、进度、模型适配等非 UI 逻辑
types/       跨模块业务类型
config/      应用配置与知识图谱功能开关
hooks/       通用 React hook（当前平板缩放 hook 在此）
styles/      全局样式
docs/v2.0/   当前版本产品需求与页面流程
promo/       独立宣传页面/物料，非学生端主原型
```

以下内容默认排除出日常原型改动的上下文：根目录 `版本保存/`、知识图谱原始大 JSON、`node_modules/`、构建产物、截图和 PDF。只有任务明确涉及它们时才读取。

## 6. 常见改动的最小阅读范围

| 需求 | 最小起点 | 可能需要向外扩展的条件 |
|---|---|---|
| 改首页视觉或卡片排列 | `DashboardImmersive.tsx` + 目标子组件 | 交互要打开全局弹层或跳转时，再读 `App.tsx` 对应回调 |
| 改底栏标签 / 图标 / 顺序 | `BottomNav.tsx` | 新增或删除 Tab 才读 `App.tsx` 的条件渲染 |
| 改同步课本目录、视频或一课一练 | `SubjectMap` 或对应 `Sync*Page` + 对应 `data/junior*` | 涉及进度、换书或跨入口回流时，再读同步进度与教材服务 |
| 改“我的课本” | `Growth/MyTextbooksPage.tsx` + 两个教材服务 | 影响学科可选科目时，再读 `data/subjectCatalog.ts` 和 `App.tsx` 的 `applyAcademic*` |
| 改错题订正 | `MistakeVault.tsx` + 对应反馈/原因服务 | 涉及经验金币或全屏流程时，再读奖励服务和 `App.tsx` 回调 |
| 改小晤聊天界面 | `LumiSpace.tsx` + 目标 Lumi 子组件 | 改拍照/讲题联动或底栏隐藏时，再读 `App.tsx` 传入的回调 |
| 改学习或答题回流 | `LearningFlow.tsx` / 对应 Quiz 页面 + `types/learningReturn.ts` | 需要回到首页或学科的状态决策时，读取 `App.tsx` 的回流处理 |

### 答题页面统一基线

- 答题 UI 与交互以 `AI学伴_0812/ai_friend_v2.0/components/Quiz/` 为迁移基线；合并仓库内的唯一维护入口是 `components/Quiz/`。
- 常规练习、逐题练习、错题订正、题库组卷、快速练习和结果回看均复用该目录的组件，不在首页、学科、小学或初中业务目录中另建平行答题界面。
- 小学与初中只提供题目、题型、学科和回流上下文；提交、草稿、计时、听力、作答区、反馈与结果态由 Quiz 组件统一负责。
- 后续维护直接修改合并仓库内的 `components/Quiz/`，不要在运行时引用本机外部文件夹路径，以保证 Git 协作环境可运行。

## 7. 修改前检查清单

1. 先在本地图选定业务模块，再只读取“最小阅读范围”。
2. 改动涉及年级、学期、教材或进度时，检查是否跨到第 4 节的共享状态。
3. 不要把新 mock 数据直接散落到页面组件；优先放入对应 `data/` 或 `services/`。
4. 不要修改 `promo/`、`版本保存/` 或根目录数据工具，除非需求明确点名。
5. 先执行最小相关验证；修改入口、类型、共享服务或构建配置时再执行 `npm run check`。

## 8. 已知架构事实与债务

- `App.tsx` 仍承担大量场景编排和全局状态，是跨页面改动的主要汇合点；普通视觉调整不应直接修改它。
- 原型当前大量使用 `localStorage` / `sessionStorage` 和 mock 数据，尚未接入统一后端仓储。
- `vite-plugin-singlefile` 与高内联资源阈值用于原型交付；不要在普通页面改动中调整构建配置。
- 当前工作区存在其他未提交修改。本地图和 `AGENTS.md` 仅为新增文件，不代表或覆盖那些改动。
