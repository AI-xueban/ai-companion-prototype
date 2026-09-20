# 小晤同学 · Agent 开发需求文档

| 项 | 内容 |
|---|---|
| 模块 | 底栏「伙伴」· 小晤同学首页与会话层 |
| 版本 | v1.1 · 2026-08-17 |
| 文档类型 | Agent 产品需求 + 服务契约 + 验收标准 |
| 面向角色 | AI 产品 / Agent 工程 / 后端 / 前端 / 测试 / 内容与安全运营 |
| 产品真源 | [伙伴Tab-小晤同学-产品需求文档PRD](./伙伴Tab-小晤同学-产品需求文档PRD.md) |
| 会话壳交互 | [小晤Space-交互需求文档](./小晤Space-交互需求文档.md) |

> 本文只说明“小晤如何被开发成一个 Agent”。页面长什么样、按钮如何排布，以产品 PRD 为准；文字、语音、拍照等会话壳交互，以 Space 文档为准。

---

# 1. 一页说明

## 1.1 产品目标

小晤是 K12 学生的学习陪伴者，不是每一轮都回答知识问题的搜索框。其可被验证的体验目标是：

- 学生打开伙伴页时，能看到适龄、可开口、不过度学习化的话题；
- 学生说任何内容时，先被安全地接住，再被理解并得到合适的回应；
- 需要事实、讲题、情绪调节时，才被**明确地**转到相应能力；
- 小晤能在得到用户允许的范围内记住偏好与约定，但不制造依赖、不把隐私当话题；
- 任一服务异常时，页面仍可聊天、可返回、可重试，不暴露系统错误。

## 1.2 推荐目标架构（不是把新需求塞进旧三段式）

已有的 `risk → chat → guide` 可以作为**当前版本的兼容实现**，但不建议把它定义为长期架构。它的缺口是：会话状态、上下文装配、路由决策、工具授权和最终输出安全没有独立责任主体，后续加“记忆、讲题、搜索、情绪支持、内容运营”时会迅速耦合成一个大 Prompt。

本需求建议采用“**一个编排中枢 + 多个专职能力 + 双安全闸门**”的目标架构：

```text
小晤同学首页入口 / 用户消息 / 图片 / 语音
                │
                ▼
① 输入安全闸门 Safety Guard
   风险分级、隐私最小化、紧急处置
                │
                ▼
② Context Manager
   装配本轮身份、会话摘要、允许的记忆、学情 hint、可用工具
                │
                ▼
③ Session Orchestrator（唯一调度中枢）
   意图识别 + 情绪识别 + 状态机 + 路由计划 + 是否要确认
      ├──────────────┬───────────────┬──────────────┐
      ▼              ▼               ▼              ▼
④ Topic Agent   Companion Agent  Learning Guide  Emotion Support
   首页话题         陪聊与跟题        检索/拍照讲题     轻情绪支持
      │              │               │              │
      └──────────────┴───────┬───────┴──────────────┘
                              ▼
⑤ Tool Gateway / Memory Service
   工具授权、调用、幂等、结果归一；记忆候选审核与读写
                              │
                              ▼
⑥ Response Composer + 输出安全闸门
   统一成“回复文本 + UI 指令 + 状态更新”，输出二次安全校验
                              │
                              ▼
前端渲染 / 行为埋点 / 异步评测
```

这个结构中的“Agent”并不等于每个框都是一个大模型。MVP 中，`Safety Guard`、`Context Manager`、`Tool Gateway`、`Memory Service` 应优先做成规则/服务；`Session Orchestrator` 与 `Companion Agent` 可由结构化模型能力承担；专项 Agent 只在被路由到时运行。

### 旧链的迁移映射

| 现有概念 | 在目标架构中的位置 | 保留方式 |
|---|---|---|
| risk | 输入 / 输出双 Safety Guard | 保留并补齐风险合同、审计与紧急转介 |
| chat | Session Orchestrator + Companion Agent | 拆开“判断下一步”和“生成自然回复” |
| guide | Learning Guide + Tool Gateway | 拆开“建议做什么”和“是否允许真实执行” |

**编排总原则：安全闸门有最终否决权；Session Orchestrator 有唯一的路由与状态主权；专项 Agent 只在授权范围内工作；Tool Gateway 是唯一可执行工具与写操作的出口。**

## 1.3 本期范围与非范围

| 本期必须 | 本期不做 / 需另立需求 |
|---|---|
| 首页话题推荐、会话启动、自由聊、火花玩法、轻情绪支持、允许时的检索 / 拍照讲题 / 小游戏转场、可控记忆、风险处置、评测与埋点 | 自动批改、自动修改学习计划/错题本、连续主动催学、教育诊断、心理诊断、无确认的外部写入、开放社交与跨用户记忆 |

---

# 2. 角色、场景与成功标准

## 2.1 目标用户与核心任务

| 用户 | 场景 | 需要完成的任务 | 小晤的正确行为 |
|---|---|---|---|
| 小学生 / 初中生 | 打开伙伴页、不知道聊什么 | 轻松地开始一段对话 | 给一条具体、有趣、低压力的邀请，而不是推题目 |
| 学生 | 已在聊话题，突然说起另一件事 | 被允许换话题 | 先接住新意图，再确认是否切换，不把旧话题当任务 |
| 学生 | 想问一个事实问题 | 得到可信、可读的回答 | 简短回答；必要时检索并给来源，不“假装已经查过” |
| 学生 | 发了题图、明确要讲题 | 跳转到讲题能力 | 明确说明将进入讲题流程，而不是在陪聊里编题解 |
| 学生 | 低落、焦虑或有风险表达 | 被妥善支持 | 先安全处置与共情；必要时引导现实中的可信成人 |
| 返回用户 | 想继续上一段对话 | 有连续感 | 用短摘要确认“继续还是换一个”，不背诵隐私历史 |

## 2.2 指标与验收目标

| 维度 | 指标 / 观察信号 | 第一版目标 |
|---|---|---|
| 启动 | 首页 → 会话点击率 | 可按入口 L1/L2/L3 分别观察，不以单一总值追量 |
| 对话质量 | L1 点击后达到 3 轮的占比 | 观察是否在持续提升 |
| 话题质量 | 首轮“换一个/不想聊”与 3 秒内返回比例 | 持续下降；分内容簇排查 |
| 路由准确 | 工具被正确触发 / 被错误触发 | 关键测试集 ≥ 95% 正确路由 |
| 安全 | 高风险漏拦、普通对话误拦 | 高风险漏拦为 0；误拦单独监测并复盘 |
| 陪伴感 | 反馈中的“被理解”与“语气不对” | 按入口、年级、风险层级分层看 |
| 健康边界 | 强引流、催学、制造依赖的投诉或命中 | 0 容忍，作为发布前阻断项 |

---

# 3. Agent 能力清单与优先级

## 3.1 必须具备的能力（MVP）

| 编号 | 能力 | 说明 | 主责 |
|---|---|---|---|
| A1 | 安全分类与分级 | 识别普通、敏感、紧急风险、年龄不适与需要转人工/成人支持的内容 | Safety Guard |
| A2 | 首页话题推荐 | 按年级、心情、兴趣、负反馈与去重生成 1+2 话题组 | Topic Agent |
| A3 | 会话启动 | 按 L1/L2/L3/继续入口构造完整 Bootstrap，初始化对应会话状态 | Session Orchestrator |
| A4 | 意图与情绪理解 | 每轮识别聊天、事实问答、讲题、图片、情绪、结束/换话题等 | Session Orchestrator |
| A5 | 会话状态管理 | 维护当前目标、锚点、偏题程度、追问次数、可退出状态 | Session Orchestrator |
| A6 | 短而有层次的陪聊 | 先回应用户，再给最多一个自然问题或一个可选出口 | Companion Agent |
| A7 | 工具门控与转场 | 仅在条件满足、用户知情时调用检索/讲题/小游戏 | Learning Guide + Tool Gateway |
| A8 | 关系记忆 | 只读写允许的偏好、雷区、约定和高光摘要，并支持纠正/遗忘 | Memory |
| A9 | 可观测性 | 记录入口、路由、风险、工具、结果、失败与用户反馈 | 编排运行时 |
| A10 | 降级 | 各服务超时、无数据、工具失败时能够平稳回答 | 编排运行时 |

## 3.2 后续能力（不阻塞 MVP）

| 能力 | 触发条件 | 备注 |
|---|---|---|
| 多轮兴趣画像学习 | 有足够的显式选择与行为样本 | 不从单次浏览/单句表达推断敏感偏好 |
| 话题内容 A/B 与内容池运营 | 已有有效埋点和回收规则 | 内容质量优先于点击率 |
| 记忆管理页 | Memory 已有可读写接口 | 支持查看、删除、纠正 |
| 困难情绪的分级随访 | 安全团队确认话术与流程 | 不能用自动消息制造依赖 |
| 多模型 / 多 Agent 评审 | 单链准确率达到稳定水平 | 先有标准测试集再扩复杂度 |

---

# 4. 端到端编排

## 4.1 请求生命周期

```text
1. 小晤同学首页 / Session 发起请求，带 `request_id`、`session_id`、入口和用户输入
2. 输入 Safety Guard：先做风险分级、敏感内容最小化与紧急转介判断
   ├─ `block / urgent`：直接走安全 Response Composer，结束普通会话链
   ├─ `limited`：允许有限陪伴，关闭工具与长期记忆
   └─ `pass`：继续
3. Context Manager：按“最少够用”原则装配身份、会话摘要、允许的记忆、学情 hint 与工具清单
4. Session Orchestrator：输出 `RoutePlan`（意图、情绪、目标、状态转移、候选专项能力、确认要求）
5. 按 `RoutePlan` 调用一个或多个专项能力
   ├─ 首页请求 → Topic Agent
   ├─ 普通陪聊 / 偏题 → Companion Agent
   ├─ 事实问答 / 明确讲题 → Learning Guide
   └─ 低落情绪 → Emotion Support（高风险仍由 Safety Guard 接管）
6. 如需要真实能力，Tool Gateway 校验权限、确认状态和幂等键后调用工具；结果回给对应专项能力
7. Response Composer 合成一条用户可读回复与受限 UI 指令；输出 Safety Guard 二次检查
8. 返回 ResponseEnvelope；异步写事件、会话摘要和已批准的 Memory 候选
```

## 4.2 时序边界

| 节点 | 同步 / 异步 | 超时建议 | 超时后行为 |
|---|---|---|---|
| 输入 / 输出 Safety Guard | 同步 | 800ms | 采用最保守的短回复，不调用工具 |
| Context Manager | 同步 | 1,000ms | 使用最小身份信息与当前会话 |
| Session Orchestrator | 同步 | 1,500ms | 退回 Companion 的安全自由聊模板 |
| 专项 Agent | 同步 | 4,000ms | 返回“我刚刚没接好这句，你可以再说一遍吗？”并允许重试 |
| 工具调用 | 同步等待 / 显示进行中 | 视工具 5–12s | 返回可理解的失败说明与替代路径 |
| Risk 输出检测 | 同步 | 800ms | 仅返回安全短回应 |
| 事件、记忆候选 | 异步 | 不阻塞 | 写入失败不影响用户本轮 |

## 4.3 禁止的跨层行为

- Safety Guard 不允许把“低落”直接当作高风险，也不允许把普通学习压力拦成拒答。
- Session Orchestrator 不得既路由又绕过 Tool Gateway 执行外部操作。
- 专项 Agent 不允许根据模型自由文本猜测要调用什么工具；只能提出受校验的 `ToolRequest`。
- 任一层不允许把完整历史、原始敏感对话、题目原文无筛选地写入长期记忆。

---

# 5. 模块需求

以下类型为产品合同伪代码；服务端可用 JSON Schema / OpenAPI 实现，但字段语义不得自行改变。

```ts
type ToolCapability = 'web_search' | 'photo_tutor' | 'emotion_game' | 'navigate_hub' | 'write_learning_data';

type MemoryCandidate = {
  type: 'preference' | 'taboo' | 'commitment' | 'highlight';
  summary: string;
  source_turn_id: string;
  confidence: number;
  consent_basis: 'explicit' | 'repeated_behavior';
  expires_at?: string;
};

type ResponseEnvelope = {
  request_id: string;
  message: { text: string; stream?: boolean };
  state: TurnState;
  ui?: UiOffer;
  tool?: { id: string; status: 'offer' | 'running' | 'completed' | 'failed'; tool: ToolCapability };
  safety?: { action: RiskDecision['action']; visible_template_id?: string };
};
```

## 5.1 Session Orchestrator（会话编排中枢）

### 目标

它是每轮对话的唯一“调度大脑”：负责理解用户要什么、当前会话处于什么状态、是否应切换目标、应调用哪个专项能力、是否要向用户确认。它不直接调用工具，也不承担长篇自然语言生成。

```ts
type RoutePlan = {
  primary_route: 'topic' | 'companion' | 'learning' | 'emotion_support' | 'safety';
  intent: 'topic_reply' | 'free_chat' | 'fact_question' | 'ask_for_tutoring' |
          'photo_message' | 'emotion' | 'change_topic' | 'end' | 'unknown';
  emotion: 'neutral' | 'positive' | 'down' | 'anxious' | 'angry' | 'unknown';
  next_state: Partial<TurnState>;
  secondary_routes?: Array<'learning' | 'emotion_support'>;
  requires_confirmation?: boolean;
  tool_candidate?: ToolRequest;
  reasoning_code: string; // 仅日志与评测使用，不展示给用户
};
```

### 路由规则

| 信号 | 首选路由 | 说明 |
|---|---|---|
| 进入小晤同学首页 | `topic` | 仅生成/读取 TopicPack，不进聊天 |
| L1/L2/L3/继续首轮 | `companion` | 按 Bootstrap 开场，并初始化状态机 |
| 日常聊天、换话题、冷场、结束 | `companion` | 用户意图优先于运营话题 |
| 可验证事实追问、明确“查一下” | `learning` | 先判断是否需要检索与确认 |
| 明确“讲题”、题图、作业图 | `learning` | 只负责转场和工具合同，不在陪聊内假讲解 |
| 一般低落 / 焦虑 | `emotion_support` + `companion` | 共情优先，不默认工具化 |
| high / urgent 风险 | `safety` | 终止其他路由 |

### 验收

- 每轮仅有一个 `primary_route`；多能力协作只能通过显式 `secondary_routes`。
- 工具候选不等于工具执行：未确认时只能返回确认 UI。
- 同一句“我好累”在普通疲惫与紧急风险上下文中，应分别路由到情绪支持与安全流程。

## 5.2 Safety Guard

### 目标

在每一轮输入与输出上执行 K12 安全、适龄与健康陪伴边界。Safety Guard 的输出必须结构化、可审计，并能被编排运行时直接执行。

### 输入与输出

```ts
type RiskDecision = {
  level: 'normal' | 'sensitive' | 'high' | 'urgent';
  action: 'pass' | 'rewrite' | 'block' | 'escalate';
  categories: Array<
    'self_harm' | 'bullying' | 'sexual_content' | 'violent_content' |
    'medical' | 'privacy' | 'illegal_or_dangerous' | 'dependency' | 'age_inappropriate'
  >;
  allow_tools: boolean;
  response_template_id?: string;
  require_adult_support?: boolean;
  log_level: 'normal' | 'restricted';
};
```

### 分类与行动规则

| 级别 | 例子（仅说明） | Safety Guard 行动 | 后续处理 |
|---|---|---|---|
| normal | 普通聊天、普通学习问题 | pass | 正常处理 |
| sensitive | 轻微悲伤、一般隐私、年龄边界内容 | rewrite 或 pass + 限制 | 共情、少追问；不写敏感记忆 |
| high | 持续被欺负、明显自伤表达、严重危险请求 | block / 提供安全话术 | 不讲题、不推游戏；给可信成人支持路径 |
| urgent | 即时自伤/他伤危险、正在发生的紧急危险 | escalate | 固定紧急话术、紧急求助入口；停止普通对话流程 |

### 验收

- 高风险与紧急风险不会进入检索、讲题、小游戏、普通“继续聊”流程。
- 风险命中页不展示分类标签、风险分数、模型报错或内部原因。
- 普通“我好累/考砸了”不能被拒绝；应允许 Companion Agent 先给予短共情。
- 任何风险样本都不会被写为普通兴趣或“高光”记忆。

## 5.3 Context Manager（上下文装配）

### 目标

在每轮只给编排中枢和被选中的专项能力提供“足够而非全部”的上下文，保证准确、节省、可解释、可删除。

### 必带字段

```ts
type ConversationContext = {
  user: {
    user_id: string;
    grade?: string;
    nickname?: string;
    language_style: 'primary' | 'middle';
  };
  bootstrap: SessionBootstrap;
  turn_state: TurnState;
  recent_messages: Array<{ role: 'user' | 'assistant'; text: string }>;
  relationship_brief?: {
    preferences?: string[];
    taboo?: string[];
    pending_commitments?: string[];
    last_topic_summary?: string;
  };
  learning_hint?: string;
  available_tools: ToolCapability[];
};
```

### 规则

- `recent_messages` 默认最多 8～12 条；更早内容由会话摘要代替。
- `learning_hint` ≤200 字，只在用户主动谈及学习或进入相关入口时提供。
- 禁止把完整历史、原始标签来源、敏感风险原文、排名、家庭冲突原文塞进 prompt。
- `taboo` 只以“避免谈及 X”形式提供，不提供原始隐私叙述。

## 5.4 Topic Agent

### 目标

为小晤同学首页生成“想让学生开口的邀请”，不是学习任务入口。

### 输入、输出与规则

```ts
type TopicPack = {
  pack_id: string;
  hero: Topic;
  secondary: Topic[]; // 1～2 条
  meta: {
    strategy: 'default' | 'mood_first' | 'cold_start';
    reason_codes: Array<'interest' | 'mood' | 'grade' | 'explore' | 'cold_start'>;
    expires_at: string;
  };
};
```

| 规则 | 要求 |
|---|---|
| 编队 | 平时优先“好奇 + 兴趣 + 好奇/学科趣味”；心情低落时主推情绪陪伴；冷启动以好奇为主 |
| 质量 | 主推建议 ≤28 字；有具体物/场景；像朋友提出的问句或半句邀请 |
| 禁止 | 题干、错题、任务名称、成绩、学习催促、浏览标题原文、恐吓或攀比 |
| 去重 | 同一话题簇 7 天内不重复主推；用户连续两次快速退出则当日降权 |
| 刷新 | 只刷新 L1；同日默认最多 3 次；无新内容时从安全冷启动池回退 |

## 5.5 Companion Agent（陪伴对话）

### 目标

在 Session Orchestrator 已确定“可陪聊”的前提下，生成自然、稳定、不过度干预的回复。它不重新判断风险，不自行选择工具，也不掌握写入权限。

### 每轮输出（必须结构化）

```ts
type CompanionDraft = {
  reply_draft: string;
  ui_offer?: UiOffer;
  memory_candidates?: MemoryCandidate[];
  suggested_summary?: string;
};
```

### 对话规则

| 情况 | 必须行为 |
|---|---|
| 入口 L1 | 围绕话题开场，提供“我猜/你先讲/换一个”等低负担选择 |
| 入口 L2 | 按火花玩法推进，不把火花转成课堂讲解 |
| 入口 L3 | 允许用户完全换话题，不回塞首页推荐 |
| 用户偏题 | 先回应新意图；明确新话题则切锚点，不要求回答旧问题 |
| 用户冷场 | 只给一个可选问题或允许结束，不连续追问 |
| 事实不确定 | 说明可查，走 Learning Guide 的检索确认流程；不编造来源 |
| 用户讲题 | 不在本 Agent 内讲解；依赖 Orchestrator 已路由的 Learning Guide 转场 |
| 情绪低落 | 先共情、允许沉默；不要立即教方法、不要催学 |
| 对话结束 | 给可离开的出口，不用“你是不是不喜欢我”式挽留 |

### 文风约束

- 以一到三句为默认长度；除非用户明确要求讲解，不输出大段教程。
- 年级影响词汇、句长、示例，而不影响尊重程度。
- 不以“小晤最懂你”“只有我陪你”描述关系。
- 不辱骂、羞辱、比较成绩、不替用户向教师/家长作判断。

## 5.6 Learning Guide（学习与事实专项）

### 目标

在 Orchestrator 已路由的前提下，处理事实核验、检索解释、图片/题目讲解转场。它解决“学习或事实问题怎么帮”，不承担日常陪聊人格。

### 专项规则与工具门控

| 工具 / 转场 | 允许条件 | 需要用户确认 | 不允许条件 |
|---|---|---|---|
| Web 检索 | 用户明确问可验证事实，或同意“我帮你查吗” | 首次 / 新问题需确认 | 普通闲聊、风险高、模型仅仅不确定但可坦诚回答 |
| 拍照讲题 | 用户明确请求讲题，或已上传可识别题图 | 进入讲题页前确认 | 没有题目、用户只是在分享图片、情绪尚未稳定 |
| 情绪小游戏 | 用户接受建议，或轻度负面且有明确可跳过入口 | 需要 | 高风险、用户拒绝、以游戏替代现实求助 |
| 回小晤同学首页换话题 | 用户说“换一个/不想聊” | 不需要 | 正在处理风险 / 正在进行用户已确认的工具流程 |
| 写学习数据 | 用户明确表达“记录/添加/修改”且目标页允许 | 需要二次确认 | 任何从聊天内容推断的静默写入 |

### ToolRequest 与 UI 指令

```ts
type ToolRequest = {
  tool: 'web_search' | 'photo_tutor' | 'emotion_game' | 'navigate_hub' | 'write_learning_data';
  reason: string;
  confirmation: 'not_required' | 'ask_user' | 'confirmed';
  payload?: Record<string, unknown>;
};

type UiOffer = {
  type: 'quick_replies' | 'confirm_tool' | 'navigate' | 'support_link';
  options: Array<{ id: string; label: string; action: string }>;
};
```

### 验收

- 前端只根据 `UiOffer` 和经验证的 `ToolRequest` 渲染可点击操作，不解析模型自由文本中的“跳转/搜索/删除”。
- 工具失败后，会话仍可继续；回答必须说明“这次没查到/暂时不能打开”，而不是生成虚假答案。
- 每次工具调用必须产生 `tool_requested`、`tool_confirmed`（若有）、`tool_result` / `tool_failed` 事件。

## 5.7 Emotion Support（轻情绪支持专项）

### 目标

只处理被 Orchestrator 判定为 `normal/sensitive` 的一般低落、焦虑、愤怒与受挫表达。它的目标是帮助学生被听见、降低压力并保留选择权；不是心理治疗，也不能覆盖 Safety Guard 的高风险流程。

| 情况 | 输出策略 | 禁止 |
|---|---|---|
| 一般疲惫 / 考试焦虑 | 一句共情 + 一个低压力选择（说说 / 休息一下 / 做呼吸） | 立即安排任务、空泛鸡汤 |
| 生气 / 被误解 | 先复述感受，可邀请讲发生了什么 | 引导攻击、替用户审判他人 |
| 用户拒绝继续聊 | 尊重结束或换话题 | 连续追问“为什么” |
| 高风险信号 | 返回给 Safety Guard，不输出普通安慰 | 游戏、练习、调侃、长期记忆 |

## 5.8 Tool Gateway（工具网关）

### 目标

作为唯一有能力执行检索、讲题转场、小游戏打开、数据写入的服务。它校验 `ToolRequest`、用户确认、风险状态、权限与幂等键；任何模型都不能绕过它直接产生副作用。

| 校验项 | 规则 |
|---|---|
| 风险 | `high/urgent` 一律拒绝普通工具；`sensitive` 默认关闭写入与检索 |
| 确认 | `ask_user` 必须收到同一 `request_id` 的明确确认回执 |
| 权限 | 图片、麦克风、存储等由前端先申请，后端只接受已授权资源 ID |
| 幂等 | 同一 `tool_request_id` 只执行一次；网络重试返回已知结果 |
| 审计 | 记录工具、理由码、确认状态、耗时、结果码；不记录不必要的原文 |

## 5.9 Memory 服务

### 可写记忆范围

| 类型 | 可写示例 | 写入条件 | 读取方式 |
|---|---|---|---|
| 偏好 | 喜欢画水彩、喜欢猜谜 | 用户明确表达或多次稳定表现 | 仅在相关话题自然使用 |
| 雷区 | 不想再聊某次考试 | 用户明确要求避免 | 优先于话题推荐与追问 |
| 约定 | 明天想继续讲恐龙 | 用户明确约定 | 下一次允许短提示，不反复催促 |
| 高光摘要 | 分享了一幅自己满意的画 | 用户主动分享且不含敏感信息 | 作为关系连续性素材 |

### 禁止 / 受限内容

- 禁止：自伤、健康诊断、家庭冲突原文、地址/联系方式、成绩排名、性内容、风险分类原文。
- 受限：情绪状态只可作为短期会话状态或当日摘要，默认不写长期记忆。
- 一条候选记忆必须包含 `source_turn_id`、`confidence`、`consent_basis`、`expires_at`；低置信内容不写。
- 用户说“别提/忘了/不是这样”时，当前轮立即停止引用，并创建删除或更正请求。

## 5.10 Response Composer 与编排运行时

### 责任

- 创建与持续更新 `session_id`、`TurnState`、会话摘要和可追溯 `request_id`；
- 让 Orchestrator 按 RoutePlan 调用专项能力，再将结果合成为唯一对用户可见的 ResponseEnvelope；
- 对所有模型和工具设定超时、重试上限与幂等键；
- 记录每次路由与结果，但对敏感内容使用受限日志；
- 任何模块异常时返回已定义的降级响应。

### 降级矩阵

| 异常 | 用户可见结果 | 业务处理 |
|---|---|---|
| Topic / summary 失败 | 显示本地冷启动话题组 | 记录服务失败，不影响首页 |
| Memory 失败 | 正常聊，不提过去内容 | 不重试写入到当前请求的主链 |
| 专项 Agent 超时 | “我刚刚没接好这句，你可以再说一遍吗？” | 可重试一次，禁止重复发送半成品 |
| 检索失败 | 承认暂时查不到；可继续讲已有常识或换话题 | 不返回伪造链接 |
| Safety Guard 服务异常 | 采用最小安全模板，仅允许普通短聊 | 关闭工具调用 |
| 前端断连 | 允许从会话历史恢复；不重复写同一条记忆 / 工具操作 | 使用 `request_id` 幂等 |

---

# 6. 会话状态机

## 6.1 状态定义

```ts
type SessionGoal =
  | 'explore_topic' | 'play_spark' | 'free_chat' | 'emotion_support' | 'continue';

type TurnState = {
  session_id: string;
  goal: SessionGoal;
  anchor_topic_id?: string;
  current_focus: string;
  drift_level: 0 | 1 | 2;
  user_emotion: 'neutral' | 'positive' | 'down' | 'anxious' | 'angry' | 'unknown';
  deepen_count: number;
  tool_stage: 'none' | 'offered' | 'confirmed' | 'running' | 'completed' | 'failed';
  offer_exit: boolean;
  summary?: string;
};
```

## 6.2 转移规则

| 当前状态 | 输入 / 事件 | 新状态 | 必须输出 |
|---|---|---|---|
| `explore_topic` | 仍在回答话题 | 保持，`deepen_count + 1` | 一次回应 + 一个轻问题 |
| `explore_topic` | 明确新话题 | `free_chat` 或新的 topic | 承认切换，不追旧话题 |
| 任意 | 低落/焦虑 | `emotion_support` | 共情，暂不催学习 |
| 任意 | 明确讲题 | `tool_stage=offered` | 说明可进入拍照/讲题，并给确认按钮 |
| 任意 | 用户同意工具 | `tool_stage=running` | 进行中状态，禁止重复发起 |
| 任意 | 用户拒绝工具 | 原目标或 `free_chat` | 继续普通对话，不反复推同一工具 |
| 任意 | “换一个/不聊了” | `free_chat` 或首页 | 给选择 / 返回，不追问 |
| 任意 | Risk high/urgent | 安全状态 | 终止普通状态机、按 Risk 模板回应 |

---

# 7. 接口合同

## 7.1 会话入口 Bootstrap

```ts
type SessionBootstrap = {
  entry: 'l1' | 'l2' | 'l3' | 'continue';
  opener_text: string;
  session_goal: SessionGoal;
  topic?: { id: string; kind: 'wonder' | 'interest' | 'mood' | 'subject'; tag: string; text: string };
  spark_id?: string;
  pack_id?: string;
  user_profile_brief: { grade?: string; nickname?: string; language_style: 'primary' | 'middle' };
  relationship_brief?: { preferences?: string[]; taboo?: string[]; last_topic_summary?: string };
  learning_hint?: string;
  safety_tier: 'k12_default';
};
```

## 7.2 Chat 请求与响应

```ts
type PartnerChatRequest = {
  request_id: string;
  session_id: string;
  message: { id: string; type: 'text' | 'voice_transcript' | 'image'; text?: string; image_ids?: string[] };
  bootstrap?: SessionBootstrap; // 仅首轮必传
  client_state?: { current_page: 'hub' | 'session'; tool_confirmation_id?: string };
};

type PartnerChatResponse = {
  request_id: string;
  message: { text: string; stream?: boolean };
  state: TurnState;
  ui?: UiOffer;
  tool?: { id: string; status: 'offer' | 'running' | 'completed' | 'failed'; tool: ToolRequest['tool'] };
  continue_summary?: string;
  safety?: { action: RiskDecision['action']; visible_template_id?: string };
};
```

## 7.3 前后端责任

| 组件 | 必须负责 | 不应负责 |
|---|---|---|
| 前端 | 传入口、显示流式、展示确认、执行已批准 UI、上报行为 | 判断风险、从文本猜工具、拼接完整系统提示 |
| Partner API / Orchestrator | 组装上下文、调用各 Agent、维护状态、返回结构化响应 | 直接依赖页面 DOM 或具体 CSS |
| Agent 服务 | 依据输入输出约束产生决策 | 执行数据库写入、直接修改前端状态 |
| 工具服务 | 返回可验证、可声明失败的结果 | 生成陪聊人格回复 |
| 内容 / 安全运营 | 模板、词库、风险话术、审核规则 | 临时修改线上模型参数而无版本记录 |

---

# 8. 质量、评测与发布

## 8.1 必须建立的测试集

| 测试集 | 覆盖内容 | 最低验收 |
|---|---|---|
| 首页题库 | 年级、冷启动、低心情、兴趣、重复、禁题 | 100% 符合禁题与适龄规则 |
| 对话状态集 | 贴题、轻偏、明确换题、冷场、结束 | 目标状态与可见回复均正确 |
| 工具门控集 | 该查/不该查、该转讲题/不该转、同意/拒绝 | 正确路由 ≥95%，危险场景 100% 不调用 |
| 风险集 | 自伤、欺凌、隐私、性内容、危险行为、依赖表达 | 高风险 / 紧急风险 100% 命中预期路径 |
| 记忆集 | 写入、纠正、忘记、敏感信息 | 禁止内容 0 写入；纠正后 0 再引用 |
| 失败集 | 各服务超时、空结果、重复点击、断连重连 | 无报错页、无重复副作用、可恢复 |

## 8.2 埋点字典（最小集合）

| 事件 | 必填属性 |
|---|---|
| `partner_hub_viewed`（代码事件名保留） | `pack_id`、`strategy`、`has_continue` |
| `partner_topic_clicked` | `topic_id`、`position`、`reason_codes` |
| `partner_session_started` | `entry`、`session_goal`、`pack_id/spark_id` |
| `partner_turn_routed` | `intent`、`emotion`、`drift_level`、`risk_action`、`tool` |
| `partner_tool_requested` / `confirmed` / `result` | `tool`、`reason`、`success`、`latency_ms` |
| `partner_topic_changed` / `session_exit` | `from_goal`、`to_goal`、`round_count` |
| `partner_memory_action` | `type`、`action`（write/delete/correct）、`consent_basis`；**不记录原文** |
| `partner_feedback_submitted` | `rating`、`issues`、`entry`、`round_count` |

## 8.3 发布门槛

- 风险测试集、工具门控集、断连与重复点击测试全部通过。
- 所有模型、模板、内容池和风险规则可记录版本，并能回滚。
- 先在小流量灰度中观察风险误拦、工具误触发、首页秒退与负反馈；未达阈值不扩大。
- 任何“提升停留/回访”的策略不得以催学、恐惧、愧疚或孤立依赖为手段。

---

# 9. 分期拆解与交付物

## Phase 0：合同与可观测性（先完成）

- 定义本页 `SessionBootstrap`、`RoutePlan`、`RiskDecision`、`ResponseEnvelope` 的 JSON Schema。
- 前端改为只消费结构化 `ui` / `tool`，不从自然语言触发动作。
- 增加 `request_id`、`session_id`、埋点和错误分级。

## Phase 1：可用的陪聊主链（MVP）

- 输入 Safety Guard → Context Manager → Session Orchestrator → 专项能力 → Tool Gateway → 输出 Safety Guard；L1/L2/L3/继续的 Bootstrap；Topic 冷启动 / 本地内容池；短对话状态机；检索、讲题、小游戏的确认门控；基础评测集。

## Phase 2：个性化与关系连续性

- 学情/兴趣/心情摘要；可控 Memory；Topic 排序、去重、负反馈降权；会话摘要与“继续”功能。

## Phase 3：运营与持续优化

- 内容池管理、话题质量回收、A/B、监控面板、风险样本回流、记忆管理页与复核机制。

---

# 10. 待确认的产品 / 技术决策

以下问题需要在开始 Agent 开发前由产品、算法与安全负责人确认；未确认时按本文的保守默认值实施。

| 问题 | 默认建议 | 需要确认的负责人 |
|---|---|---|
| `risk` 当前已有的类别、阈值和紧急转介能力 | 以现有分类为准，补齐本页 `RiskDecision` 映射 | 安全 / 算法 |
| `chat` 是否支持结构化 JSON（而非仅文本） | 必须支持；由服务端做 Schema 校验 | Agent 工程 |
| `guide` 是独立模型还是规则层 | MVP 采用规则优先、模型只提出候选 | Agent 工程 / 后端 |
| 检索数据源与引用标准 | 仅允许审核源；无可用源则承认无法验证 | 内容 / 技术 |
| 记忆的用户授权与删除入口 | 默认最小化、可删除、可纠正 | 产品 / 合规 |
| 高风险求助页的地区、电话与成人支持文案 | 由安全团队提供可发布版本 | 安全 / 法务 |
| 多端会话是否需要持续 | 需要时由服务端保存摘要与状态；原型内存状态不作为实现标准 | 后端 / 产品 |

---

# 11. 修订记录

| 版本 | 日期 | 说明 |
|---|---|---|
| v1.1 | 2026-08-17 | 重设目标架构为“双安全闸门 + Session Orchestrator + 专项 Agent + Tool Gateway”；将 `risk → chat → guide` 定义为可兼容的现有实现，而非长期约束 |
| v1.0 | 2026-08-17 | 从现有 `risk → chat → guide` 主链拆出独立 Agent 开发需求，补齐能力边界、接口、状态机、工具门控、评测与分期 |
