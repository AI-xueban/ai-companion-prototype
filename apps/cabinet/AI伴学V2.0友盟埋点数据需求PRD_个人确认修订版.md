# AI伴学V2.0友盟埋点数据需求 PRD

## 1. 本版处理结论

本版埋点以 AI伴学V2.0 的真实原型结构为准。

本期统计范围：

| 端 | 覆盖范围 | 本期目标 |
|---|---|---|
| 学生端 | 启动登录、首页、主导航、学科远征、首页同步学习/自主练习、练习答题、错题本、我的星迹、我的课本、原有小晤 Space、AI 解题、金币商城、公益爱心 | 看清活跃、学习入口转化、学科访问、教材配置、练习转化、AI 使用、错题闭环和激励效果 |
| 教师端 | 登录、仪表盘、学情分析、学生档案、消息抽屉、班级激励 | 看清教师是否查看学情、是否进入学生详情、是否处理待办 |

本 PRD 只定义埋点需求，不改变页面、文案、入口位置、跳转、状态记忆、练习组卷或教材配置规则；相关产品行为以现有需求和已实现原型为准。

### 1.1 产品阶段责任边界

产品只负责确定业务统计口径，不负责替研发、测试、数据或友盟决定具体接入实现。
具体未决产品口径统一见第 13 章，其他章节不再重复维护待确认清单。

已经固化的产品默认口径：

1. 保留“连续使用会话”概念；`session_start`表示一次连续使用开始。冷启动和账号切换必须产生新会话，具体后台无操作时长、锁屏和崩溃恢复规则由客户端与测试确定。
2. 曝光统一定义为：目标元素可见面积不低于50%，连续可见至少1秒；完全遮挡期间不计时；同一页面实例内同一对象最多上报一次，重新进入形成新页面实例后可以再次上报。
3. 用户上下文与业务目标上下文分开：当前操作者使用`user_grade`、`user_class_id`；当前学习内容使用`content_grade`；教师当前查看或分析的班级使用`target_class_id`。
4. 数据自然日统一使用`Asia/Shanghai`；跨日业务流程继续使用业务流程ID串联，不因零点重新生成业务ID。

## 2. 埋点目标与友盟结构化处理

### 2.1 埋点目标

本需求文档不是记录所有点击，而是围绕 AI伴学V2.0 当前要验证的产品问题做数据设计。

| 目标 | 要回答的问题 | 主要依赖 |
|---|---|---|
| 活跃与访问 | 学生和教师是否真的进入产品，常用哪些页面 | 友盟基础活跃统计、`session_start`、`home_view`、`student_page_view`、`teacher_page_view` |
| AI 使用 | 小晤 Space 和 AI 解题是否被使用，AI 回复是否成功 | `ai_chat_message_send`、`ai_chat_response_received`、`ai_solve_result_view` |
| 学习入口与学科使用 | 学生是否看到并点击同步学习/自主练习，是否进入学科远征并切换学科 | `home_learning_entry_expose`、`home_module_click`、`subject_expedition_view`、`subject_switch`、`self_practice_enter` |
| 教材配置 | 学生是否进入我的课本，是否修改学期设置或教材版本 | `my_textbook_enter`、`my_textbook_term_setting_change`、`my_textbook_version_change` |
| 学习闭环 | 学生是否完成练习，错题是否被查看、练习、标记掌握 | `quiz_start`、`quiz_submit`、`mistake_detail_view`、`mistake_mastery_update` |
| 激励效果 | 金币、商城、公益是否带来行为转化 | `reward_grant_result`、`store_redeem_result`、`charity_donate_result` |
| 租借转化 | 平板是否成功借出，借出后是否登录并使用学伴 App，租借失败发生在哪一步 | `rental_start`、`rental_success`、`rental_fail`、`login_success` |
| 教师使用 | 教师是否查看学情、进入学生详情、处理消息待办 | `teacher_dashboard_view`、`teacher_student_detail_view`、`teacher_message_handle` |

### 2.2 为什么按友盟做结构化处理

友盟专业版适合用“自定义事件 + 事件属性 + 用户属性”的方式分析产品行为。本文件因此做了以下结构化处理：

| 结构 | 本文对应内容 | 作用 |
|---|---|---|
| 自定义事件 | 第 5、6 章事件清单中的 `event_name` | 告诉友盟发生了什么行为 |
| 事件属性 | 每个事件的关键属性，以及第 4 章字段字典 | 告诉友盟这次行为发生在哪、从哪来、结果如何 |
| 公共字段 | 第 3 章通用字段 | 保证所有事件都能按用户、会话、页面、版本、学校班级串联 |
| 用户属性 | 第 3.4 节用户属性 | 用于友盟分群、留存、路径和漏斗筛选 |
| 漏斗 | 第 8 章关键漏斗 | 用于衡量从入口到结果的转化 |

### 2.3 事件表字段怎么读

后续事件清单中的表格字段统一按下表理解。

| 表格字段 | 含义 | 开发处理方式 |
|---|---|---|
| 优先级 | 本期接入顺序。P0 为首期必须实现，P1 为数据稳定后补充 | 开发排期优先实现 P0 |
| 事件 ID | 上报到友盟的自定义事件唯一标识 | 必须使用本文英文事件 ID，不使用中文作为上报 ID |
| 中文事件名 | 事件的中文业务名称，便于产品评审、研发理解、测试验收和数据核对 | 不参与代码上报；必须与同一行英文事件 ID 一一对应，不得单独改名 |
| 触发条件 | 什么情况下上报这条事件 | 以“用户实际看到/实际完成/后端确认成功”为准 |
| 上报端 | 建议由前端还是后端上报 | 前端报展示和点击，后端报成功结果 |
| 关键属性 | 这条事件除公共字段外必须或建议携带的业务字段 | 按第 4 章字段字典补齐含义和来源 |

### 2.4 前后端分工原则

| 类型 | 上报端 | 例子 | 原因 |
|---|---|---|---|
| 页面展示 | 前端 | `student_page_view`、`teacher_page_view` | 前端最清楚页面是否实际展示 |
| 入口点击 | 前端 | `home_module_click`、`main_tab_click` | 用户点击发生在前端 |
| 拍照、录音、上传状态 | 前端为主，必要时后端补充结果 | `photo_question_confirm`、`lumi_photo_upload_result` | 前端知道交互过程，后端知道最终处理结果 |
| AI 回复成功/失败 | 后端优先 | `ai_chat_response_received`、`ai_chat_response_fail` | 避免前端只收到流式片段就误判成功 |
| 判题和练习完成 | 后端优先 | `quiz_submit` | 后端判题结果更可信 |
| 金币、兑换、捐赠结果 | 后端 | `reward_grant_result`、`store_redeem_result`、`charity_donate_result` | 涉及账户余额和交易结果，必须以后端为准 |

所有标记为“后端上报”的事件，上线前必须确认服务端具备友盟服务端上报、数据转发或统一采集通道。若当前只有客户端 SDK，不得让客户端直接判断后端业务成功；应由后端返回最终结果后再触发上报，并在技术方案中明确失败重试和重复去重口径。

### 2.5 友盟官方文档固定入口

开发接入时以友盟官方最新文档为准。本文只定义 AI伴学V2.0 的业务事件、字段含义和统计口径；SDK 初始化、平台配置、接口调用方式、字段限制等技术细节，需要研发对照以下官方文档完成。

| 用途 | 官方文档地址 | 本文对应处理 |
|---|---|---|
| 友盟统计分析文档总入口 | [友盟开发者中心：统计分析文档](https://developer.umeng.com/docs/119267/cate/119267) | 用于确认当前使用的友盟产品版本、功能入口和配置方式 |
| 移动统计/U-App 开发文档 | [友盟开发者中心：U-App 相关开发页](https://developer.umeng.com/docs/119267/detail/179047) | 学生 App 端 SDK 接入、自定义事件上报、基础统计能力参考 |
| 自定义事件/事件属性相关说明 | [友盟开发者中心：事件分析相关开发页](https://developer.umeng.com/docs/191212/detail/201187) | 本文第 5、6、7 章事件 ID 和关键属性按“自定义事件 + 事件属性”方式设计 |
| 字段、版本或平台能力更新核对 | [友盟开发者中心：数据分析相关开发页](https://developer.umeng.com/docs/191212/detail/3026044) | 上线前核对友盟后台是否支持对应字段类型、枚举值和看板配置 |

接入约束：

| 约束 | 要求 |
|---|---|
| 事件 ID | 友盟后台与代码中必须使用本文英文事件 ID；事件 ID 是唯一上报标识 |
| 中文事件名 | 用于需求评审、测试用例和报表说明，不替代英文事件 ID；如中文产品文案变化，不自动修改事件 ID |
| 属性名 | 必须使用本文英文属性名；中文只用于需求评审说明 |
| 字段类型 | 研发接入前需在友盟后台确认 string、number、boolean、enum、array 等类型支持方式 |
| 枚举值 | 枚举值必须稳定，不能随页面中文文案变化 |
| 敏感数据 | 不向友盟事件属性上传学生姓名、手机号、原始图片、原始语音、完整作答文本等敏感内容 |
| 版本变更 | 字段新增、废弃、含义变化时必须更新 `schema_version` |

### 2.6 字段分层与装配责任

本节只调整字段由谁生成、在哪里装配，不删减指标、漏斗、触发条件或事件专属业务属性。

| 层级 | 字段示例 | 责任方 | 事件调用处处理 |
|---|---|---|---|
| 事件专属业务属性 | `entry_position`、`module_id`、`subject`、`quiz_session_id` | 具体业务模块 | 调用事件时传入 |
| 公共上下文属性 | `user_role`、`module_name`、`schema_version`、`session_id`、`is_offline_event` | 统一上报封装 | 自动补充，业务模块不得重复拼装 |
| SDK 基础属性 | 事件时间、平台、App 版本、系统版本、设备信息 | 友盟 SDK | 经后台验收确认可查询后，不再作为自定义属性重复上传 |
| 用户登录身份 | 当前操作者 `user_id` | 登录态管理 | 登录或切换账号时设置一次，退出时清除；不在每个事件重复传入 |

客户端事件与服务端事件分别确定字段来源：客户端能够从 SDK 获得的基础属性不手动重复上传；服务端事件不能依赖客户端 SDK，应由服务端提供事件发生时间、当前操作者及必要业务上下文。离线补报若需要还原真实发生时间，保留业务发生时间，不以补报时间替代。

实施要求：

业务调用处只传事件专属属性；公共属性、SDK 属性和登录身份分别按上表装配。各字段的完整定义、必填条件和生成方式以第 3 章及配套 Excel 为准。本规则不得改变事件 ID、触发条件、指标或漏斗口径。

### 2.7 首次上线的计费与统计边界

本项目第一次上线、第一次接入友盟，必须同时建立“友盟基础统计口径”和“AI伴学业务统计口径”。两者服务的目标不同，不允许混用。

| 指标 | 明确定义 | 去重对象 | 主要用途 | 禁止做法 |
|---|---|---|---|---|
| 友盟 DAU | 当天启动过应用并被友盟识别的活跃设备/UMID 数 | 友盟设备标识/UMID | 套餐容量评估、产品整体启动活跃 | 直接解释为“每日活跃学生数” |
| 业务 DAU | 当天至少发生一次有效登录后业务事件的唯一 `user_id` 数 | AI伴学账号 ID | 衡量实际使用产品的学生/教师人数 | 使用设备数替代账号人数 |
| 启动次数 | 应用当天被启动或唤起的次数 | 不按用户去重 | 分析打开频率和启动质量 | 与 DAU 相加或作为用户数 |
| 有效学习用户数 | 当天至少发生一次 P0 学习行为的唯一学生 `user_id` 数 | 学生账号 ID | 衡量真实学习使用 | 仅进入首页即算学习 |

共享设备场景必须特别说明：同一台租赁平板当天由多名学生使用，可能形成 1 个友盟设备 DAU、多个业务 DAU；同一名学生当天使用多台平板，可能形成多个友盟设备 DAU、1 个业务 DAU。因此看板至少并列展示“友盟 DAU”“业务 DAU”“有效学习用户数”，不得只保留一个笼统的“日活”。

友盟公开页面显示 U-App 专业版按 DAU 容量分档；公开社区的官方答复说明同一设备当天多次打开通常按一个活跃用户计算。自定义事件上报次数不等于 DAU，因此不得通过删除必要业务事件、延迟正常上报或只统计登录用户来人为控制 DAU。官方参考：

- https://www.umeng.com/tube/pay
- https://www.umeng.com/pages/umeng-uapp
- https://community.umeng.com/topic/view/683fe0208bacf41288a9593f

### 2.8 事件记录类型与触发责任

事件清单中的每个 `event_name` 必须且只能归入一个 `record_type`。`eventType=0` 是友盟模板中的事件计数类型，不等同于本文业务记录类型，研发不得混用两者。

| `record_type` | 中文定义 | 标准触发点 | 默认上报端 | 默认去重规则 |
|---|---|---|---|---|
| `page_view` | 页面/完整业务视图实际可见 | 首屏关键内容完成渲染且用户可见 | `client` | 同一页面实例一次；首页同一前台周期一次 |
| `exposure` | 页面内入口、卡片或模块满足曝光条件 | 可见面积≥50%且连续可见≥1秒；完全遮挡不计时 | `client` | 同一页面实例、同一对象一次；新页面实例可再次上报 |
| `click` | 用户主动点击、切换或确认操作 | 有效点击被组件接受 | `client` | 每次有效操作；防抖产生的重复回调只报一次 |
| `process_start` | 一次业务流程开始 | 已创建业务过程 ID 或进入首个有效步骤 | `client` / `server` | 同一业务过程一次 |
| `submit` | 用户提交答案、表单或业务请求 | 请求已正式发出且参数校验通过 | `client` | 同一提交动作一次；重试需保留同一幂等键 |
| `result` | 后端或权威业务系统给出最终结果 | 成功、失败或取消状态已确定 | `server` / `client_server_confirmed` | 同一业务幂等键、同一终态一次 |
| `state_change` | 业务设置、筛选或状态发生有效变化 | 新值与旧值不同且保存生效 | `client` / `server` | 同一操作结果一次，无变化不报 |
| `error` | 可归类的业务失败或服务异常 | 失败原因已确认 | `server` 优先 | 同一请求、同一错误终态一次 |
| `system` | 登录、账号切换、会话开始等系统行为 | 系统状态完成切换 | `client` / `server` | 按账号或会话生命周期一次 |

事件触发责任只允许以下值：

| 字段 | 枚举值 | 说明 |
|---|---|---|
| `report_side` | `client` | 客户端能够确认的曝光、页面可见和用户交互 |
| `report_side` | `server` | 以服务端事务、账户、判题、兑换等权威结果为准 |
| `report_side` | `client_server_confirmed` | 客户端发起，但等待服务端确认后由一个指定责任端上报，禁止两端各报一条 |
| `report_side` | `external_system` | 租借柜、支付或其他第三方系统产生；接入层完成字段映射后上报 |

#### 2.8.1 事件上报责任字段的通俗定义

下列字段用于告诉研发“谁报、什么时候报、如何避免重复”。它们是埋点治理信息，不要求全部作为友盟事件属性上传。

| 字段 | 通俗含义 | 开发需要明确的内容 | 示例 |
|---|---|---|---|
| `final_reporter` | 最终由谁调用友盟接口 | 每条事件只能有一个最终责任方：客户端、服务端或外部系统接入层 | 页面点击由客户端；判题最终结果由服务端 |
| `trigger_phase` | 业务进行到哪一步才算事件发生 | 必须从 `action_confirmed`、`request_sent`、`server_accepted`、`business_success`、`business_failed`、`result_displayed` 中选择 | 首页点击为 `action_confirmed`；兑换结果为 `business_success/business_failed` |
| `idempotency_key` | 判断是不是同一次业务行为的唯一标识 | 同一次行为发生超时、重试、离线补报时必须复用同一个键 | `quiz_session_id + question_id` |
| `client_failure_rule` | 请求尚未成功到达服务端时怎样统计 | 写清校验失败、无网络、用户取消、重复点击是否上报 | 本地校验未通过，不上报业务成功事件 |
| `server_timeout_rule` | 客户端超时但服务端结果晚到时怎样统计 | 超时不能自动等于业务失败；必须说明最终结果由谁补报 | 服务端稍后成功时仍按原幂等键上报一次成功结果 |

`final_reporter` 与 `report_side` 的区别：`report_side`说明哪些系统参与该事件，`final_reporter`必须落到唯一的最终上报责任方。即使事件由客户端发起、服务端确认，也不能让两端分别向友盟上报一条相同事件。

`idempotency_key` 主要用于调用友盟之前防止重复，不等于必须上传友盟的分析属性。事件首次发生时生成并持久化；同一次事件的超时重试、离线补报、跨端转发必须复用，不能每次重试生成新键。

### 2.9 字段来源、属性用途与友盟上报策略

“字段从哪里产生”和“字段是否适合进入友盟”是两个不同问题。每个属性必须同时标记 `field_source`、`property_role`、`cardinality` 和 `umeng_policy`。

#### 2.9.1 字段来源 `field_source`

| 枚举值 | 定义 | 事件调用处是否传入 |
|---|---|---|
| `business_input` | 具体业务模块提供的事件专属属性 | 是 |
| `common_context` | 登录态、页面上下文或统一上报器补充 | 否 |
| `sdk_auto` | 友盟 SDK 自动采集并经后台验收可查询 | 否 |
| `server_generated` | 服务端产生的权威结果、金额或状态 | 由服务端事件提供 |
| `external_system` | 租借柜、支付或第三方接口返回 | 由接入层映射 |
| `analytics_derived` | 由友盟后台报表计算得到的转化率、均值、用户数等指标 | 不上传 |

#### 2.9.2 属性用途 `property_role`

| 枚举值 | 典型字段 | 友盟处理原则 |
|---|---|---|
| `enum_dimension` | `entry_source`、`subject`、`result`、`fail_reason` | 允许进入友盟；必须有完整、稳定的枚举字典和 `unknown` 兜底 |
| `numeric_metric` | `duration_ms`、`question_count`、`score` | 允许进入友盟；必须定义单位、范围和异常值处理 |
| `business_id` | `task_id`、`textbook_version_id`、`question_id` | 条件进入；只有明确分组、筛选或关联用途时才传 |
| `diagnostic_id` | `event_id`、`request_id`、`trace_id`、`message_id` | 默认仅进入普通技术日志/APM或服务端链路，不作为友盟分析维度，也不得承担产品统计 |
| `identity` | `user_id`、`target_student_id` | 按身份生命周期设置或条件关联，禁止同义字段重复上传 |
| `content_sensitive` | 题目原文、学生答案原文、聊天原文、图片、语音 | 禁止进入友盟；只允许上传脱敏分类结果或统计值 |

#### 2.9.3 事件属性必填级别

必填级别必须按“事件 × 属性”判断。同一个字段可以在一个事件中必填、在另一个事件中条件必填，不能只在全局字段字典中规定一次。

| `required_level` | 含义 | 缺失处理 |
|---|---|---|
| `required` | 正常场景一定能取得，且核心指标、去重或事件合法性依赖该字段 | 不得发送正式业务事件；记录埋点质量错误，测试不通过 |
| `conditional_required` | 只在指定业务分支产生，但条件成立后必须存在 | 条件成立却缺失时按必填错误处理 |
| `optional` | 仅用于辅助分析，缺失不影响事件与核心指标 | 省略该字段，事件正常上报；不得传空字符串或伪造值 |
| `not_applicable` | 该事件不应携带该字段 | 出现时视为装配错误 |

每个属性行同时填写：

| 字段 | 说明 |
|---|---|
| `required_condition` | 条件必填的可执行表达式，例如 `login_success_source == rental_pad` |
| `missing_action` | 缺失时采用 `reject_event`、`omit_property`、`use_unknown` 或 `quality_error` |

`unknown` 只表示业务上真实无法确认的合法分类，不能用于掩盖程序没有取到必填字段。可选字段没有值时直接省略，不传 `null`、空字符串、`暂无` 或 `-`。

#### 2.9.4 基数与上报策略

| `cardinality` | 定义 | 示例 | `umeng_policy` |
|---|---|---|---|
| `low` | 值域稳定且通常不超过 50 个 | 学科、入口、结果、失败原因 | `allow`，适合作为筛选和漏斗维度 |
| `medium` | 值域可控，需配置管理 | 教材版本、页面名、知识点一级分类 | `conditional`，上线前确认分析用途与配额 |
| `high` | 值几乎随用户、请求、题目或订单持续增长 | UUID、请求 ID、题目 ID、订单 ID、用户 ID | 产品指标依赖时进入友盟并先验收额度；纯技术排查 ID 不进入友盟 |
| `prohibited` | 原始内容或敏感个人信息 | 姓名、手机号、图片、语音、答案全文 | `deny`，禁止上报 |

当前处理原则：

| 字段 | 友盟处理 |
|---|---|
| `rental_attempt_id` | 必须上报；租借发起、成功、失败、取消和登录率均依赖其去重 |
| `rental_order_id`、`rental_session_id` | 条件上报；分别在订单创建成功、租借成功后产生 |
| `quiz_session_id`、`solve_flow_id` | 必须上报；分别用于练习流程和AI解题流程关联 |
| `request_id`、`conversation_id`、`question_id` | 条件上报；是否作为友盟分析属性仍需结合对应指标与当前套餐能力确认 |
| `event_id` | 统一上报器内部必填并跨重试复用，不作为友盟分析维度 |
| `trace_id`、`upload_batch_id` | 仅普通技术日志/APM使用，不进入友盟 |

### 2.10 事件与参数容量预算

友盟官方历史版本公告曾列出专业版 500 个自定义事件、200 个事件参数、2000 个参数值的额度，并说明超过额度后新增事件可能不再统计；当前采购和上线必须以合同、友盟后台实际显示及技术支持书面答复为准：https://info.umeng.com/detail?cateId=1&id=585

按本版 Excel 当前约 73 个唯一事件、122 个唯一属性计算：事件数量约占历史专业版事件额度的 14.6%，属性数量约占参数额度的 61.0%。因此首期主要风险是属性和高基数参数继续扩张，而不是事件数量不足。

容量治理要求：

1. 相同业务语义优先复用事件，通过稳定低基数枚举区分入口或结果；不同业务语义不得为了节省事件数强行合并。
2. 新增事件必须说明对应指标、漏斗或排查用途；没有使用方的事件不进入 P0。
3. 新增属性必须说明来源、用途、基数和友盟策略；产品指标依赖的流程ID进入友盟，纯技术定位ID不进入友盟。
4. 每次版本评审输出事件数、唯一属性数、低/中/高基数字段数及剩余额度。
5. 当事件或参数使用量达到合同额度的 70%、85%、95% 时分别触发提示、限制新增和专项治理。
6. 核心 P0 学习与结果事件不得抽样；仅允许对不参与人数、转化、留存计算的高频诊断事件做可配置抽样。

### 2.11 环境与数据隔离

开发、测试、预发布和生产数据必须隔离，非生产数据不得进入生产报表或影响生产 DAU；具体 AppKey、SDK 初始化和渠道配置由研发、测试在技术方案中明确。

## 3. 通用字段与用户属性

### 3.1 通用字段

通用字段分为六类：事件基础字段、用户身份字段、学校班级字段、设备版本字段、会话链路字段、上传质量字段。这里的“必填”表示数据最终必须可获得，不表示业务调用处必须逐项手动传入；SDK 已采集字段和公共上下文字段分别由 SDK、统一上报封装负责。

#### 3.1.1 事件基础字段

这类字段描述“这是一条什么事件、什么时候发生、用哪个字段版本解释”。每条事件都必须带。

| 字段 | 类型 | 是否必填 | 字段说明 | 示例 | 生成/获取方式 |
|---|---|---|---|---|---|
| `event_id` | string | 统一上报器内部必填 | 单条业务事件唯一 ID，用于调用友盟前防止重复。事件首次发生时生成一次；同一事件的超时重试、离线补报和跨端转发必须复用，不得重新生成 | `evt_20260811_000001` | 客户端或服务端生成 UUID；不作为友盟分析属性 |
| `event_name` | string | 是 | 事件 ID，必须与本文事件清单中的英文事件 ID 一致 | `ai_chat_message_send` | 埋点代码写死或由事件封装层传入 |
| `event_time` | timestamp | 是 | 事件真实发生时间，不是服务端收到时间。前端事件取客户端发生时间，后端事件取服务端业务完成时间 | `2026-08-11T19:10:00+08:00` | 客户端或服务端生成 |
| `business_event_time` | timestamp | 条件必填 | 仅离线缓存、延迟补报或跨端转发导致上报时间不能代表真实发生时间时使用，记录业务实际发生时间；正常实时事件不重复传入 | `2026-08-11T19:10:00+08:00` | 事件首次发生时生成并随缓存保留 |
| `schema_version` | string | 是 | 埋点字段版本。字段新增、删除、含义变化时必须升级版本 | `v0.6_umeng_20260811` | 埋点 SDK 封装层统一写入 |

#### 3.1.2 用户身份字段

这类字段描述“是谁在使用”。登录前无法取得的字段可以为空；登录成功后必须补齐。

| 字段 | 类型 | 是否必填 | 字段说明 | 示例 | 生成/获取方式 |
|---|---|---|---|---|---|
| `user_id` | string | 登录后必填 | 当前实际操作者的唯一账号 ID。不传姓名、手机号、身份证；登录或切换账号时通过统一登录身份接口设置一次，不在每个事件重复拼装 | `u_10001` | 登录态/账号系统 |
| `user_role` | enum | 登录后必填 | 当前操作者角色，只允许 `student` 或 `teacher`；未登录时为空，不允许根据默认端猜测角色 | `student` | 登录账号角色 |
| `target_student_id` | string | 条件必填 | 当前行为所针对的学生 ID，仅教师查看学生详情、处理学生消息等“操作者与目标学生不同”的场景携带；学生本人事件不与 `user_id` 重复上传 | `stu_10001` | 学生档案/业务对象 |

#### 3.1.3 学校、用户年级与班级字段

这类字段用于学校、班级、年级维度分析。能传 ID 时优先传 ID，名称字段只作为展示辅助。

| 字段 | 类型 | 是否必填 | 字段说明 | 示例 | 生成/获取方式 |
|---|---|---|---|---|---|
| `school_id` | string | 建议必填 | 学校 ID，用于学校维度聚合 | `school_001` | 账号/班级关系 |
| `school_name` | string | 否 | 学校名称。若友盟看板需要直接展示名称可传；若可由 `school_id` 关联，建议不传 | `深圳实验学校` | 账号/学校档案 |
| `user_class_id` | string | 登录后条件必填 | 当前操作者所属班级 ID；不能表示教师正在查看或分析的目标班级 | `class_701` | 账号/班级关系 |
| `class_name` | string | 否 | 当前操作者班级名称。若可由 `user_class_id` 关联，建议不传 | `七年级1班` | 班级档案 |
| `user_grade` | string | 学生登录后建议必填 | 当前操作者档案年级，用于用户分群；不能表示当前学习内容年级 | `七年级` | 学生档案或班级信息 |

事件专属业务上下文使用以下字段，不得被公共用户属性覆盖：

| 字段 | 使用场景 | 说明 |
|---|---|---|
| `content_grade` | 学科远征、同步学习、自主练习、我的课本等内容事件 | 当前实际学习或配置的内容年级 |
| `target_class_id` | 教师仪表盘、学情分析等班级目标事件 | 教师当前查看或分析的目标班级 |

#### 3.1.4 设备与版本字段

这类字段用于区分 App 版本、平板固件和系统 Build，重点服务于问题排查。租赁平板不能读取隐私设备标识。友盟模板列出的保留字段不得作为自定义事件属性重复创建；SDK 已采集且后台可查询的字段直接使用 SDK 口径。

| 字段 | 类型 | 是否必填 | 字段说明 | 示例 | 生成/获取方式 |
|---|---|---|---|---|---|
| `platform` | string | 是 | 运行平台。学生 App 固定为 `android`；教师端如为 Web 可填 `web` | `android` | SDK/运行环境自动采集；不在事件调用处重复传入 |
| `app_version` | string | 是 | App 版本，用于定位版本差异；该名称属于友盟模板保留字段，不得创建同名自定义属性 | `0.6.0` | 友盟 SDK 自动采集并在后台验收 |
| `w_versionstring` | string | 是 | 平板整机固件版本。App 内 WebView/子页面统一读取平板宿主固件版本，用于区分不同系统固件、定位固件兼容问题 | `w_1.2.8` | 宿主 App 或设备系统能力提供 |
| `os_buildstring` | string | 是 | 固件编译 Build 号，用于进一步细分固件版本和排查系统问题 | `eng.user.20260718` | 宿主 App 或设备系统能力提供 |

#### 3.1.5 会话、页面与链路字段

这类字段用于把一次使用、一次登录、一次租赁、一次页面访问和一次接口链路串起来。不要把这些 ID 混用。

| 字段 | 类型 | 是否必填 | 字段说明 | 示例 | 生成/获取方式 |
|---|---|---|---|---|---|
| `session_id` | string | 是 | 一次有效连续使用过程 ID，用于串联同一次连续使用中的业务行为 | `sess_abc123` | 冷启动、登录/切换账号必须重新生成；具体后台阈值、锁屏和崩溃恢复规则由客户端与测试确定 |
| `rental_session_id` | string | 租赁平板条件必填 | 一次平板租用过程 ID，由租赁业务系统在借出成功后生成。禁止读取 IMEI、MAC、设备序列号或广告标识符替代 | `rental_10001` | 租赁业务系统 |
| `page_name` | string | 建议必填 | 当前页面的标准英文名，用于页面访问、路径和漏斗分析 | `lumi_space` | 前端根据路由/当前组件赋值 |
| `module_name` | string | 建议必填 | 当前所属功能模块，比页面更粗一层 | `ai_solve` | 前端按模块枚举赋值 |
| `source_page` | string | 否 | 用户行为发生前所在页面 | `student_today_home` | 前端记录跳转前页面 |
| `entry_source` | string | 否 | 进入当前功能的入口来源，比 `source_page` 更具体 | `home_ai_solve_card` | 点击入口时赋值 |
| `trace_id` | string | 否 | 前后端链路追踪 ID。一次请求从前端到后端、AI 服务、判题服务应尽量保持一致 | `trace_10001` | 前端创建或网关/后端生成 |

#### 3.1.6 上传质量字段

这类字段用于判断弱网、离线补报、乱序和重复上报问题。

| 字段 | 类型 | 是否必填 | 字段说明 | 示例 | 生成/获取方式 |
|---|---|---|---|---|---|
| `event_sequence` | integer | 技术日志可选 | 当前`session_id`内的事件顺序号 | `15` | 如客户端技术日志需要，由统一上报层生成 |
| `network_status` | enum | 否 | 当前网络状态 | `online`、`weak`、`offline` | 客户端网络状态 |
| `is_offline_event` | boolean | 是 | 是否为离线缓存后补报事件 | `false` | 埋点 SDK 根据上传状态赋值 |
| `retry_count` | integer | 技术日志可选 | 上传重试次数，仅用于客户端Debug排查，不要求作为友盟业务属性，也不承担产品统计 | `0` | 客户端统一上报层维护 |

### 3.2 身份和业务过程关联

本节不重复定义字段，只说明不同 ID 如何串联业务过程。字段类型、必填条件和生成方式以第 3.1 节、第 4 章及配套 Excel 为准。

| 关联字段 | 用途 | 使用规则 |
|---|---|---|
| `user_id` + `user_role` | 识别当前实际操作者和角色 | 登录后由统一登录身份设置；未登录时保持为空或使用友盟匿名口径，不猜测用户角色 |
| `target_student_id` | 识别当前行为针对的学生 | 仅教师查看学生详情、处理学生消息等目标对象场景使用；学生本人事件不重复传入 |
| `session_id` | 串联一次连续使用 | 不等同于一次登录；冷启动和账号切换必须刷新，具体后台阈值由客户端与测试确定 |
| `rental_session_id` | 串联一次平板租用过程 | 只在租赁平板场景使用，由租赁业务系统提供，不读取设备隐私标识 |
| `rental_attempt_id` | 串联一次租借尝试 | 用户扫码或点击租借时立即生成；即使订单未创建成功，也必须用它串联失败 |
| `rental_order_id` | 串联一次租借订单 | 订单创建成功后才有；从订单创建、借出成功或失败保持一致 |
| `conversation_id` | 串联一次 AI 对话 | 小晤聊天、AI 解题 1 对 1 讲解等对话场景使用 |
| `request_id` | 串联一轮 AI 请求和回复 | 用户发送和 AI 成功/失败回复使用同一个 `request_id` |
| `solve_flow_id` | 串联一次 AI 解题流程 | 从拍照/上传、识别、解析结果、1 对 1 讲解保持一致 |
| `quiz_session_id` | 串联一次练习/测验 | 从进入练习、单题作答、提交、结果页保持一致 |
| `trace_id` | 串联前后端技术链路 | 用于排查接口、AI 服务、判题服务问题，可不同于业务 ID |

### 3.3 页面与模块字段

`page_name` 和 `module_name` 不要随中文页面标题变化。页面改文案时，字段值也应保持稳定。

| 页面/模块 | 推荐字段值 | 说明 |
|---|---|---|
| 首页 | `student_today_home` | 学生端默认首页 |
| 学科远征 | `subject_expedition` | 底栏学科 Tab；默认进入课本同步学 |
| 同步学习选科 | `sync_subject_picker` | 首页同步学习入口后的选科页 |
| 自主练习选题 | `self_practice_picker` | 首页与学科远征共用的选题页 |
| 我的课本 | `my_textbook` | 我的星迹右上角胶囊入口 |
| 小晤 Space | `lumi_space` | 伙伴聊天、语音、图片、多轮问答 |
| AI 解题 | `ai_solve` | 拍题、解析、1 对 1 讲解 |
| 错题本 | `mistake_vault` | 错题总览、详情、错因、掌握状态 |
| 我的星迹 | `me_page` | 原“我的”页面；稳定 ID 不随中文文案变化 |
| 金币商城 | `coin_store` | 金币兑换、装扮购买 |
| 公益爱心 | `charity_station` | 公益入口、捐赠、爱心池 |
| 教师仪表盘 | `teacher_dashboard` | 教师首页概览 |
| 教师学情分析 | `teacher_analytics` | 班级学情、薄弱点、热力图 |
| 教师学生档案 | `teacher_student_profiles` | 学生列表和学生详情 |
| 教师消息 | `teacher_inbox` | 消息抽屉、报告、兑换待办 |
| 班级激励 | `teacher_incentives` | 商品、兑换审批 |

### 3.4 用户属性

用户属性用于友盟分群和留存分析，不建议把高频变化字段都放入用户属性。金币余额、经验值、消息数等变化频繁的数据，应作为事件属性或业务库指标处理。

| 属性 | 类型 | 说明 | 示例 | 更新时机 |
|---|---|---|---|---|
| `user_role` | enum | 用户角色 | `student` | 登录成功后 |
| `user_grade` | string | 当前学生操作者档案年级 | `七年级` | 登录成功或档案更新后 |
| `school_id` | string | 学校 ID | `school_001` | 登录成功后 |
| `user_class_id` | string | 当前操作者所属班级 ID | `class_701` | 登录成功或班级变更后 |
| `student_persona` | enum | 学生学习画像，用于区分新手/普通/活跃等原型人群 | `newbie`、`average` | 用户画像生成或变化后 |
| `learning_strategy` | enum | 当前学习策略 | `sync_mode`、`exam_mode` | 策略切换后 |
| `is_first_login` | boolean | 是否首次登录 | `true` | 登录成功后 |
| `device_rental_type` | enum | 设备来源，不读取设备隐私标识 | `owned`、`rental`、`unknown` | 登录或设备绑定后 |

## 4. 事件专属字段字典

本章解释后续事件表中“关键属性”的含义。表中示例只用于帮助理解，不代表完整枚举；合法枚举统一以第 9 章为准，事件与属性的必填关系以配套 Excel 为准。

### 4.1 基础访问字段

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `landing_page` | string | 本次会话进入后的第一个页面 | `student_today_home` |
| `load_duration_ms` | number | 页面从开始加载到可见的耗时 | `850` |

### 4.2 首页与入口字段

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `has_today_plan` | boolean | 首页是否已有今日计划。本期不统计日课事件，但首页状态可保留 | `true` |
| `coin_balance` | number | 当前金币余额，只记录数值，不记录账户明细 | `1280` |
| `weekly_xp` | number | 本周经验值 | `2100` |
| `module_id` | enum | 首页被点击模块的稳定 ID | `ai_solve`、`coin_store`、`charity_progress`、`me_page` |
| `module_position` | string | 模块在页面中的位置 | `home_top_card`、`side_tool_1` |
| `target_page` | string | 点击后预期跳转页面 | `ai_solve` |
| `mood_tags` | array | 用户提交的心情标签枚举，不传自由文本 | `["happy","tired"]` |
| `tag_count` | number | 心情标签数量 | `2` |
| `active_stage_id` | string | 当前公益阶段 ID | `charity_stage_01` |

### 4.3 AI 与小晤字段

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `scene` | enum | AI 使用场景，用于区分普通聊天、拍题、计划调整等 | `lumi_partner_chat`、`ai_solve_one_to_one` |
| `conversation_id` | string | 一次连续 AI 对话 ID | `conv_10001` |
| `request_id` | string | 一轮 AI 请求 ID。用户问题和 AI 回复需使用同一个 `request_id` | `req_10001` |
| `round_index` | number | 对话轮次，从 1 开始递增 | `3` |
| `input_type` | enum | 输入方式 | `text`、`voice`、`image`、`mixed` |
| `has_image` | boolean | 本轮消息是否带图片 | `true` |
| `image_count` | number | 本轮上传图片数量 | `2` |
| `response_duration_ms` | number | AI 从收到请求到返回成功的耗时 | `3200` |
| `response_type` | enum | AI 回复类型 | `text`、`solve_plan`、`search_answer`、`quick_reply` |
| `fail_reason` | string | 失败原因枚举或错误码 | `timeout`、`model_error`、`image_recognition_failed` |
| `upload_batch_id` | string | 一批图片上传的批次 ID | `upload_10001` |
| `success_count` | number | 上传成功图片数 | `2` |
| `fail_count` | number | 上传失败图片数 | `0` |
| `rating` | enum | 用户对会话反馈 | `helpful`、`neutral`、`bad` |
| `feedback_tags` | array | 反馈标签枚举 | `["answer_clear","too_slow"]` |
| `message_count` | number | 当前会话消息总数 | `12` |

### 4.4 AI 解题字段

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `entry_position` | string | AI 解题入口所在位置 | `home_ai_solve_card` |
| `default_mode` | enum | 进入 AI 解题时默认模式 | `photo_ask_xiaowu` |
| `solve_mode` | enum | 解题能力类型 | `photo_ask_xiaowu`、`lingjing_explain`、`homework_review` |
| `solve_flow_id` | string | 一次拍题解题流程 ID，从拍照到解析、讲解保持一致 | `solve_10001` |
| `question_count` | number | 本次识别出的题目数 | `3` |
| `question_id` | string | 题目 ID | `q_10001` |
| `feedback_result` | enum | 对解析或讲解是否满意 | `satisfied`、`unsatisfied` |
| `feedback_reason` | string | 不满意原因枚举 | `not_clear`、`wrong_answer`、`too_long` |

### 4.5 练习与错题字段

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `quiz_session_id` | string | 一次练习/测验过程 ID | `quiz_10001` |
| `quiz_type` | enum | 练习类型 | `normal`、`listening`、`daily_conquer`、`remedial` |
| `question_count` | number | 本次练习题目数 | `6` |
| `question_type` | enum | 题型 | `single_choice`、`multiple_choice`、`blank`、`paper_source` |
| `answer_result` | enum | 单题作答结果 | `correct`、`wrong`、`partial`、`manual_pending` |
| `time_spent_sec` | number | 单题作答耗时，单位秒 | `45` |
| `score` | number | 整组练习得分 | `83` |
| `correct_count` | number | 正确题数 | `5` |
| `wrong_count` | number | 错误题数 | `1` |
| `duration_ms` | number | 整组练习耗时，单位毫秒 | `360000` |
| `reward_xp` | number | 本次结果页展示的经验奖励 | `80` |
| `reward_coins` | number | 本次结果页展示的金币奖励 | `20` |
| `pending_count` | number | 错题本待处理错题数 | `12` |
| `mastered_count` | number | 已掌握错题数 | `48` |
| `mistake_id` | string | 错题记录 ID | `mistake_10001` |
| `knowledge_point` | string | 知识点名称或 ID，优先传 ID | `linear_equation` |
| `filter_type` | enum | 错题筛选类型 | `subject`、`status`、`reason`、`star` |
| `filter_value` | string | 筛选值 | `math`、`pending`、`calculation_error` |
| `reason_type` | enum | 错因类型 | `concept`、`calculation`、`careless`、`unknown` |
| `action` | enum | 掌握状态动作 | `mark_mastered`、`unmark_mastered` |
| `drill_question_count` | number | 举一反三练习题数 | `3` |

### 4.6 金币、商城与公益字段

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `reward_source` | enum | 奖励来源 | `quiz_complete`、`welcome_gift`、`daily_conquer` |
| `xp_delta` | number | 本次经验变化值 | `80` |
| `coin_delta` | number | 本次金币变化值 | `20` |
| `grant_result` | enum | 奖励发放结果 | `success`、`fail`、`duplicate` |
| `store_type` | enum | 商城类型 | `coin_store`、`wardrobe`、`wish_pool` |
| `item_id` | string | 商品或装扮 ID | `item_10001` |
| `item_price` | number | 商品展示价格，单位金币 | `300` |
| `coin_cost` | number | 本次兑换消耗金币 | `300` |
| `redeem_result` | enum | 兑换结果 | `success`、`fail` |
| `stage_id` | string | 公益阶段 ID | `charity_stage_01` |
| `donate_coins` | number | 本次捐赠金币数 | `100` |
| `coin_balance_before` | number | 捐赠前金币余额 | `1280` |
| `coin_balance_after` | number | 捐赠后金币余额 | `1180` |
| `donate_result` | enum | 捐赠结果 | `success`、`fail` |

### 4.7 教师端字段

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `login_method` | enum | 登录方式 | `password`、`sms_code`、`sso` |
| `todo_count` | number | 当前待办数量 | `3` |
| `time_range` | enum | 学情分析时间范围 | `7d`、`30d`、`semester` |
| `keyword_type` | enum | 搜索关键词类型，不传原始关键词 | `student_name`、`student_id` |
| `result_count` | number | 搜索结果数量 | `8` |
| `target_tab` | string | 切换到的标签页 | `knowledge`、`mistake`、`timeline` |
| `unread_count` | number | 未读消息数量 | `4` |
| `message_id` | string | 消息 ID | `msg_10001` |
| `message_type` | enum | 消息类型 | `report`、`redeem`、`system` |
| `handle_result` | enum | 消息处理结果 | `handled`、`ignored`、`failed` |
| `record_id` | string | 兑换审批记录 ID | `redeem_10001` |
| `audit_action` | enum | 审批动作 | `approve`、`reject` |
| `reject_reason` | string | 拒绝原因枚举或简短说明，不传长文本 | `not_eligible` |

### 4.8 租借柜字段

租借柜字段用于回答三个核心问题：是否成功借出、借出耗时多久、借出后是否有人登录学伴 App 使用。实现时不要只记录成功订单，失败和取消也必须记录，否则无法计算失败率。

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `rental_attempt_id` | string | 一次租借尝试 ID。用户扫码、点击租借或柜机发起租借时立即生成；无论后续是否创建订单都必须保留 | `rent_attempt_10001` |
| `rental_order_id` | string | 一次租借订单 ID。订单创建成功后生成；订单创建失败时可以为空 | `rent_order_10001` |
| `rental_session_id` | string | 一次成功租借后的使用会话 ID。只有 `rental_success` 后才生成，用于串联后续 App 登录和使用 | `rental_sess_10001` |
| `rental_account_id` | string | 租赁业务侧用户 ID。不得传手机号、姓名、身份证等明文个人信息 | `rent_user_10001` |
| `cabinet_id` | string | 租借柜 ID。只传柜机编码，不传详细地址 | `cabinet_sz_001` |
| `cabinet_site_id` | string | 柜机所在点位 ID，用于按学校/门店/校区聚合；详细地址留在业务系统 | `site_school_001_gate_a` |
| `slot_id` | string | 柜机格口 ID，用于排查某个格口无法开门、无法检测取机等问题 | `slot_08` |
| `device_asset_id` | string | 平板资产 ID，由资产系统提供。不使用 IMEI、MAC、设备序列号、广告标识符 | `asset_pad_10001` |
| `rental_channel` | enum | 租借入口或发起方式 | `cabinet_qr`、`app_scan`、`staff_assist` |
| `rental_step` | enum | 当前完成或失败的租借步骤 | `scan`、`order_create`、`device_bind`、`success` |
| `fail_step` | enum | 失败发生在哪一步。必须传枚举，不要只传错误文案 | `scan`、`order_create`、`device_bind`、`unknown` |
| `fail_reason` | string | 失败原因枚举或错误码。由租赁系统定义稳定值，不要传接口原始报错长文本 | `payment_failed`、`cabinet_offline`、`slot_jammed`、`device_unavailable` |
| `rental_duration_ms` | number | 从 `rental_start` 的 `event_time` 到 `rental_success` / `rental_fail` / `rental_cancel` 的总耗时，单位毫秒 | `92000` |
| `order_create_duration_ms` | number | 从租借开始到订单创建成功/失败的耗时，单位毫秒 | `1200` |
| `app_login_after_rental` | boolean | 成功借出后是否已产生学伴 App 登录成功。通常由数据统计时计算，必要时可由后端回写 | `true` |
| `app_login_delay_ms` | number | 从 `rental_success.event_time` 到 `rental_app_login_success.event_time` 的耗时，单位毫秒 | `180000` |
| `user_id` | 统一登录身份 | 借出后登录学伴 App 的当前操作者使用全局唯一 `user_id`，通过友盟账号统计接口设置 | `u_10001` |
| `login_success_source` | enum | 登录成功来源，用于区分是否发生在租赁平板链路中 | `rental_pad`、`normal_app` |


### 4.9 V2.0 新增：学科远征、首页学习入口与我的课本字段

以下字段只补充本次新需求。字段使用稳定英文枚举，不随“学科远征”“我的星迹”等中文文案调整而改变。

| 字段 | 类型 | 说明 | 示例 / 枚举 |
|---|---|---|---|
| `source_tab` | enum | 点击底部导航前所在 Tab | `today`、`subject`、`mistake`、`me` |
| `target_tab` | enum | 仅说明 `main_tab_click`：学科远征仍使用稳定值 `subject`，我的星迹仍使用 `me`；教师页内标签按对应事件局部枚举 | `subject`、`me` |
| `study_mode` | enum | 学科远征当前模式 | `textbook_sync`、`personalized` |
| `source_subject` | enum | 切换前学科 | 同 `subject` 枚举 |
| `target_subject` | enum | 切换后学科 | 同 `subject` 枚举 |
| `switch_method` | enum | 学科切换方式 | `tab_click`、`horizontal_swipe` |
| `module_id` | enum | 首页学习卡片稳定 ID | `sync_study`、`self_practice` |
| `module_position` | string | 首页入口位置；布局变化时新增枚举，不改旧值 | `home_right_card` |
| `target_page` | enum | 点击后目标页 | `sync_subject_picker`、`self_practice_picker` |
| `school_system` | enum | 当前学制 | `six_three`、`five_four` |
| `textbook_term` | enum | 当前册次 | `first_term`、`second_term`、`full_year` |
| `textbook_version_id` | string | 数据侧稳定教材版本 ID，不传中文展示名 | `pep_7a_math` |
| `subject_count` | number | 当前学制与年级下实际展示的学科数 | `8` |
| `edit_action` | enum | 我的课本编辑态操作 | `enter_edit`、`finish_edit` |
| `setting_type` | enum | 被修改的学期设置项 | `school_system`、`grade`、`textbook_term` |
| `old_value` | string | 修改前值；年级表示修改前的`content_grade` | `七年级` |
| `new_value` | string | 修改后值；年级表示修改后的`content_grade` | `八年级` |
| `old_textbook_version_id` | string | 修改前教材版本 ID | `pep_7a_math` |
| `new_textbook_version_id` | string | 修改后教材版本 ID | `bnup_7a_math` |

## 5. 学生端事件清单

### 5.1 基础活跃与页面

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `login_success` | 学生登录成功 | 学生登录成功 | 后端 | `login_method`、`is_first_login`、`rental_attempt_id`、`rental_order_id`、`rental_session_id`、`login_success_source` |
| P0 | `session_start` | 会话开始 | 新建 `session_id` 后上报一次；页面重渲染、同一会话内前后台短暂切换不上报 | 前端 | `landing_page` |
| P0 | `student_page_view` | 学生页面展示 | 首页以外的学生页面内容实际展示；首页不触发本事件 | 前端 | `page_name`、`load_duration_ms` |
| P0 | `main_tab_click` | 底部主导航点击 | 点击底部导航 | 前端 | `source_tab`、`target_tab` |

页面事件互斥规则：

| 页面 | 上报事件 | 禁止同时上报 |
|---|---|---|
| 首页 | `home_view` | `student_page_view(page_name=student_today_home)` |
| 其他学生页面 | `student_page_view`，以及该模块明确要求的业务事件 | 不得将通用页面 PV 与模块业务事件相加作为页面访问次数 |

`student_page_view` 用于通用页面路径，模块专属事件用于业务状态和漏斗。两类事件可以在非首页页面同时存在，但报表必须分别计算，不得相加。

学生端和教师端 `page_name`、`module_name` 统一使用第 3.3 节定义，不在事件章节重复维护页面枚举。

### 5.2 首页与主入口

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `home_view` | 首页展示 | 首页内容实际可见；同一次前台停留周期只报一次，且不同时触发 `student_page_view` | 前端 | `has_today_plan`、`coin_balance`、`weekly_xp` |
| P0 | `home_module_click` | 首页核心模块点击 | 点击首页核心模块 | 前端 | `module_id`、`module_position`、`target_page` |
| P0 | `mood_panel_open` | 打开心情记录 | 打开心情记录弹窗 | 前端 | `source_page` |
| P0 | `mood_record_submit` | 提交心情记录 | 心情记录成功 | 后端优先 | `mood_tags`、`tag_count` |
| P0 | `coin_store_enter` | 进入金币商城 | 进入金币商城 | 前端 | `entry_source`、`coin_balance` |
| P0 | `charity_enter` | 进入公益爱心 | 进入公益爱心页 | 前端 | `entry_source`、`active_stage_id` |

首页 `module_id` 使用第 9 章统一枚举；`custom_today_task`、`daily_mission` 相关点击本期不统计。

### 5.3 小晤 Space 与 AI 对话

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `lumi_space_enter` | 进入小晤Space | 进入小晤 Space | 前端 | `entry_source`、`accessory_id` |
| P0 | `ai_chat_message_send` | 发送AI消息 | 学生发送文字/语音/图片消息 | 前端 | `scene`、`conversation_id`、`request_id`、`round_index`、`input_type`、`has_image`、`image_count` |
| P0 | `ai_chat_response_received` | AI回复成功 | AI 回复成功 | 后端 | `scene`、`conversation_id`、`request_id`、`round_index`、`response_duration_ms`、`response_type` |
| P0 | `ai_chat_response_fail` | AI回复失败 | AI 回复失败 | 后端 | `scene`、`request_id`、`fail_reason` |
| P1 | `lumi_voice_input_start` | 开始语音输入 | 点击并开始语音输入 | 前端 | `source_page` |
| P1 | `lumi_photo_upload_result` | 图片上传结果 | 图片上传成功/失败 | 前端/后端 | `upload_batch_id`、`image_count`、`success_count`、`fail_count` |
| P1 | `lumi_session_feedback_submit` | 提交对话反馈 | 提交本次对话反馈 | 前端/后端 | `conversation_id`、`rating`、`feedback_tags`、`message_count` |
| P1 | `lumi_new_chat_click` | 点击新对话 | 点击新对话 | 前端 | `conversation_id`、`message_count` |

`scene` 使用第 9 章统一枚举。

### 5.4 AI 解题与 1 对 1 讲解

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `ai_solve_entry_expose` | AI解题入口曝光 | AI 解题入口实际曝光 | 前端 | `entry_position` |
| P0 | `ai_solve_enter` | 进入AI解题 | 进入 AI 解题拍照/上传流程 | 前端 | `entry_source`、`default_mode` |
| P0 | `ai_solve_mode_click` | 切换AI解题模式 | 切换拍照问小晤/灵镜讲题/智阅作业 | 前端 | `solve_mode` |
| P0 | `photo_question_start` | 开始拍照上传题目 | 点击拍照/上传题目 | 前端 | `solve_flow_id`、`solve_mode` |
| P0 | `photo_question_confirm` | 确认提交题目图片 | 确认提交图片进入识别 | 前端 | `solve_flow_id`、`solve_mode`、`image_count` |
| P0 | `ai_solve_result_view` | AI解题结果展示 | 解析结果页实际展示 | 前端 | `solve_flow_id`、`question_count`、`subject`、`response_duration_ms` |
| P0 | `ai_solve_one_to_one_enter` | 进入一对一讲解 | 从解析结果进入 1 对 1 讲解 | 前端 | `solve_flow_id`、`conversation_id`、`question_id` |
| P0 | `ai_solve_plan_feedback` | 提交解题反馈 | 对解析/讲解结果提交满意度 | 前端/后端 | `solve_flow_id`、`feedback_result`、`feedback_reason` |
| P0 | `photo_question_fail` | 题目识别解析失败 | 图片识别/解析失败 | 后端 | `solve_flow_id`、`request_id`、`fail_reason` |

`solve_mode` 使用第 9 章统一枚举。

### 5.5 练习、答题与错题本

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `quiz_start` | 开始练习测验 | 进入一组练习/测验 | 前端 | `quiz_session_id`、`quiz_type`、`subject`、`question_count`、`entry_source` |
| P0 | `question_answer_submit` | 提交单题答案 | 单题提交答案 | 前端/后端 | `quiz_session_id`、`question_id`、`question_type`、`answer_result`、`time_spent_sec` |
| P0 | `quiz_submit` | 提交整组练习 | 整组练习提交 | 后端优先 | `quiz_session_id`、`score`、`correct_count`、`wrong_count`、`duration_ms` |
| P0 | `quiz_result_view` | 练习结果展示 | 练习结果页展示 | 前端 | `quiz_session_id`、`score`、`reward_xp`、`reward_coins` |
| P0 | `mistake_vault_enter` | 进入错题本 | 进入错题本 | 前端 | `pending_count`、`mastered_count` |
| P0 | `mistake_filter_change` | 切换错题筛选 | 切换错题筛选条件 | 前端 | `filter_type`、`filter_value`、`subject` |
| P0 | `mistake_detail_view` | 查看错题详情 | 打开错题详情/预览 | 前端 | `mistake_id`、`question_id`、`subject`、`knowledge_point` |
| P0 | `mistake_reason_update` | 修改错因标签 | 修改错因标签 | 前端/后端 | `mistake_id`、`reason_type` |
| P0 | `mistake_mastery_update` | 更新掌握状态 | 标记掌握/取消掌握 | 前端/后端 | `mistake_id`、`action` |
| P1 | `mistake_drill_start` | 开始错题举一反三 | 从错题进入举一反三练习 | 前端 | `mistake_id`、`drill_question_count` |

### 5.6 我的、金币、装扮与公益

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `me_page_enter` | 进入我的星迹 | 进入我的页 | 前端 | `level`、`xp_today`、`coin_balance` |
| P0 | `reward_grant_result` | 奖励发放结果 | 金币/经验发放完成 | 后端 | `reward_source`、`xp_delta`、`coin_delta`、`grant_result` |
| P0 | `store_item_view` | 查看商城商品 | 查看商城商品/装扮 | 前端 | `store_type`、`item_id`、`item_price` |
| P0 | `store_redeem_submit` | 提交商城兑换 | 提交兑换 | 前端/后端 | `store_type`、`item_id`、`coin_cost` |
| P0 | `store_redeem_result` | 商城兑换结果 | 兑换成功/失败 | 后端 | `store_type`、`item_id`、`redeem_result`、`fail_reason` |
| P0 | `charity_donate_submit` | 提交公益捐赠 | 发起金币捐赠 | 前端 | `stage_id`、`donate_coins`、`coin_balance_before` |
| P0 | `charity_donate_result` | 公益捐赠结果 | 捐赠成功/失败 | 后端 | `stage_id`、`donate_coins`、`donate_result`、`coin_balance_after` |


### 5.7 V2.0 新增：学科远征、首页学习入口与我的课本

本节是本次新增范围。原有事件保持不变；“小晤同学”因本次没有真实开发，不新增事件。

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `subject_expedition_view` | 学科远征页展示 | 学科远征 Tab 的 L1 内容实际可见；同一次停留不因组件重渲染重复上报 | 前端 | `entry_source`、`subject`、`study_mode`、`content_grade`、`school_system`、`textbook_term`、`textbook_version_id` |
| P0 | `subject_switch` | 学科远征切换学科 | 用户点学科名或左右滑，且目标学科内容切换成功 | 前端 | `source_subject`、`target_subject`、`switch_method`、`content_grade`、`school_system`、`textbook_term`、`textbook_version_id` |
| P0 | `home_learning_entry_expose` | 首页学习入口曝光 | 首页同步学习/自主练习卡片可见面积≥50%且连续可见≥1秒；每个`home_view`页面实例内每张卡最多一次 | 前端 | `module_id`、`module_position`、`content_grade`、`school_system`、`textbook_term` |
| P0 | `home_module_click` | 首页核心模块点击 | 点击首页核心模块且导航动作被前端接受；本次仅扩展同步学习/自主练习枚举，不改变其他原有模块口径 | 前端 | `module_id`、`module_position`、`target_page`、`content_grade`、`school_system`、`textbook_term` |
| P0 | `sync_study_subject_select` | 同步学习选择学科 | 在首页同步学习选科页选择学科，且该科教材全解实际可见 | 前端 | `subject`、`content_grade`、`school_system`、`textbook_term`、`textbook_version_id` |
| P0 | `self_practice_enter` | 自主练习选题页进入 | 自主练习选题页实际可见；首页与学科远征入口共用 | 前端 | `entry_source`、`subject`、`content_grade`、`school_system`、`textbook_term`、`textbook_version_id` |
| P0 | `my_textbook_enter` | 我的课本页进入 | 从我的星迹点击我的课本，且全屏页实际可见 | 前端 | `entry_source`、`content_grade`、`school_system`、`textbook_term`、`subject_count` |
| P0 | `my_textbook_edit_action` | 我的课本编辑态操作 | 点击编辑进入编辑态，或点击完成回浏览态 | 前端 | `edit_action`、`content_grade`、`school_system`、`textbook_term` |
| P0 | `my_textbook_term_setting_change` | 我的课本学期设置变更 | 编辑态修改学制、年级或册次，且新值实际生效；重复选择同值不上报 | 前端 | `setting_type`、`old_value`、`new_value`、`subject_count` |
| P0 | `my_textbook_version_change` | 我的课本教材版本变更 | 编辑态选择某学科新教材版本，且新版本实际生效 | 前端 | `subject`、`old_textbook_version_id`、`new_textbook_version_id`、`content_grade`、`school_system`、`textbook_term` |

入口枚举：

| 事件 | `entry_source` 枚举 |
|---|---|
| `subject_expedition_view` | `bottom_tab`、`return_from_detail` |
| `self_practice_enter` | `home_self_practice_card`、`subject_self_practice_card` |
| `my_textbook_enter` | `my_star_trail_capsule` |

事件复用说明：底部 Tab 点击继续使用 `main_tab_click`。学科远征传 `target_tab=subject`，我的星迹传 `target_tab=me`；稳定枚举不随中文 Tab 名变化。首页入口点击继续使用 `home_module_click`，避免为两张卡重复创建点击事件。

## 6. 租借柜与租赁平板事件清单

本模块用于统计租借柜到学伴 App 使用的完整链路。租借柜事件可以由租借柜系统、租赁业务后端或 App 承接页上报；涉及租借成功、失败、取消等最终结果时，以租赁业务后端为准。

开发必须先理解两个 ID：

| ID | 什么时候生成 | 为什么需要 |
|---|---|---|
| `rental_attempt_id` | 用户扫码、点击租借或柜机发起租借时立即生成 | 用来统计所有租借尝试。即使订单创建失败，也能知道这次尝试失败了 |
| `rental_order_id` | 租借订单创建成功后生成 | 用来串联订单创建后的成功、失败、取消等后续过程 |

如果没有 `rental_attempt_id`，订单创建失败的人会丢失，租借失败率会被低估。

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `rental_start` | 开始租借 | 用户开始租借流程。包括扫码、点击租借、柜机屏幕发起租借 | 前端/租借柜系统 | 必填：`rental_attempt_id`、`cabinet_id`、`rental_channel`；可选：`cabinet_site_id` |
| P0 | `rental_order_create_success` | 租借订单创建成功 | 租借订单创建成功。此时已经拿到订单 ID | 后端 | 必填：`rental_attempt_id`、`rental_order_id`、`cabinet_id`；可选：`slot_id`、`device_asset_id`、`order_create_duration_ms` |
| P0 | `rental_success` | 平板租借成功 | 平板成功借出。必须是业务系统确认“平板已借出”，不是用户点击按钮 | 后端 | 必填：`rental_attempt_id`、`rental_order_id`、`rental_session_id`、`cabinet_id`、`slot_id`、`device_asset_id`、`rental_duration_ms` |
| P0 | `rental_fail` | 平板租借失败 | 租借流程失败，用户未成功借出平板。包括扫码失败、订单创建失败、设备绑定失败等 | 后端优先 | 必填：`rental_attempt_id`、`fail_step`、`fail_reason`、`rental_duration_ms`；条件必填：`rental_order_id`、`cabinet_id`、`slot_id` |
| P0 | `rental_cancel` | 取消租借 | 用户主动取消租借，或长时间未继续导致流程关闭 | 前端/后端 | 必填：`rental_attempt_id`、`rental_step`、`rental_duration_ms`；条件必填：`rental_order_id` |
| P0 | `rental_app_login_success` | 租借平板登录成功 | 租借成功后，在该平板上学伴 App 登录成功。用于判断“借出后是否真的使用学伴 App” | 后端 | 必填：`rental_attempt_id`、`rental_order_id`、`rental_session_id`、`device_asset_id`、`app_login_delay_ms`；当前操作者统一关联 `user_id` |
| P1 | `rental_step_complete` | 租借步骤完成 | 某个租借关键步骤完成，用于辅助排查流程卡点 | 租借柜系统/后端 | 必填：`rental_attempt_id`、`rental_step`；条件必填：`rental_order_id`；可选：`order_create_duration_ms` |

口径说明：

| 指标 | 计算方式 |
|---|---|
| 租借发起次数 | `rental_start` 按 `rental_attempt_id` 去重 |
| 租借成功次数 | `rental_success` 按 `rental_attempt_id` 去重 |
| 租借失败次数 | `rental_fail` 按 `rental_attempt_id` 去重 |
| 租借取消次数 | `rental_cancel` 按 `rental_attempt_id` 去重 |
| 租借成功率 | `rental_success` 去重尝试数 ÷ `rental_start` 去重尝试数 |
| 租借失败率 | `rental_fail` 去重尝试数 ÷ `rental_start` 去重尝试数 |
| 租借成功平均耗时 | 成功租借的 `rental_duration_ms` 平均值 |
| 借出后学伴 App 登录率 | `rental_app_login_success` 去重尝试数 ÷ `rental_success` 去重尝试数 |
| 借出后首次登录耗时 | `app_login_delay_ms` 的平均值/P50/P90 |

实现要求：

| 要求 | 说明 |
|---|---|
| 必须先生成 `rental_attempt_id` | `rental_start` 时就生成，后续订单创建、成功、失败、取消、登录学伴 App 都必须带 |
| 订单创建后再生成 `rental_order_id` | 订单创建失败时没有 `rental_order_id` 是允许的，但不能缺 `rental_attempt_id` |
| 成功后生成 `rental_session_id` | 只有确认借出成功后，后续 App 登录和使用事件才携带 `rental_session_id` |
| 不读取设备隐私标识 | `device_asset_id` 必须来自资产系统，不得使用 IMEI、MAC、设备序列号、广告标识符 |
| App 登录要回写租赁链路 | `login_success` 或后端登录成功事件需要能关联 `rental_attempt_id`、`rental_order_id`、`rental_session_id`，用于判断借出后是否真的使用学伴 App |

## 7. 教师端事件清单

| 优先级 | 事件 ID（英文） | 中文事件名 | 触发条件 | 上报端 | 关键属性 |
|---|---|---|---|---|---|
| P0 | `teacher_login_success` | 教师登录成功 | 教师登录成功 | 后端 | `login_method` |
| P0 | `teacher_page_view` | 教师页面展示 | 教师端页面展示 | 前端 | `page_name` |
| P0 | `teacher_nav_click` | 教师侧边导航点击 | 点击侧边栏导航 | 前端 | `source_page`、`target_page` |
| P0 | `teacher_dashboard_view` | 教师仪表盘展示 | 仪表盘展示 | 前端 | `target_class_id`、`todo_count` |
| P0 | `teacher_analytics_view` | 进入教师学情分析 | 进入学情分析 | 前端 | `target_class_id`、`subject`、`time_range` |
| P0 | `teacher_student_search` | 教师搜索学生 | 搜索学生 | 前端 | `keyword_type`、`result_count` |
| P0 | `teacher_student_detail_view` | 教师查看学生详情 | 打开学生详情抽屉 | 前端 | `target_student_id`、`entry_source` |
| P0 | `teacher_student_detail_tab_click` | 学生详情标签切换 | 学生详情内切换标签 | 前端 | `target_student_id`、`target_tab` |
| P0 | `teacher_message_drawer_open` | 打开教师消息抽屉 | 打开消息抽屉 | 前端 | `unread_count` |
| P0 | `teacher_message_detail_view` | 查看教师消息详情 | 查看消息详情 | 前端 | `message_id`、`message_type`、`target_student_id` |
| P0 | `teacher_message_handle` | 处理教师消息 | 标记消息已处理/处理待办 | 前端/后端 | `message_id`、`message_type`、`handle_result` |
| P0 | `teacher_incentive_tab_click` | 班级激励标签切换 | 班级激励页切换商品/兑换 | 前端 | `target_tab` |
| P0 | `teacher_redeem_audit_result` | 教师兑换审批结果 | 教师审批兑换 | 后端 | `record_id`、`audit_action`、`reject_reason` |

教师页面统计规则：`teacher_page_view` 只用于通用页面路径；`teacher_dashboard_view`、`teacher_analytics_view` 等专属事件用于数据内容加载成功和业务漏斗。两类事件可以同时存在，但不得相加作为页面访问次数。

## 8. 关键漏斗

| 漏斗 | 步骤 | 计算目的 |
|---|---|---|
| 学生基础活跃 | `session_start` → `login_success`（需要登录时）→ `home_view` → `main_tab_click` | 看一次有效使用从会话开始、登录、首页到功能访问是否顺畅；App 启动量单独使用友盟基础统计，不混入业务漏斗 |
| 租借到使用 | `rental_start` → `rental_order_create_success` → `rental_success` → `rental_app_login_success` → `home_view` | 看平板借出后是否登录并进入学伴 App |
| 租借失败定位 | `rental_start` → `rental_fail`，按 `fail_step`、`fail_reason` 拆分 | 看有多少人租借失败，以及失败发生在哪一步 |
| 小晤对话 | `lumi_space_enter` → `ai_chat_message_send` → `ai_chat_response_received` → `lumi_session_feedback_submit` | 看小晤使用率、AI 成功率、反馈率 |
| AI 解题 | `ai_solve_enter` → `photo_question_confirm` → `ai_solve_result_view` → `ai_solve_one_to_one_enter` → `ai_chat_message_send(scene=ai_solve_one_to_one)` | 看拍题到讲解转化 |
| 首页学习入口 | `home_view` → `home_learning_entry_expose` → `home_module_click` → `sync_study_subject_select` / `self_practice_enter` | 看首页两张学习卡的曝光、点击和实际进入转化 |
| 学科远征 | `main_tab_click(target_tab=subject)` → `subject_expedition_view` → `subject_switch` / `self_practice_enter` | 看学科远征访问、切科和自主练习入口转化 |
| 我的课本 | `main_tab_click(target_tab=me)` → `me_page_enter` → `my_textbook_enter` → `my_textbook_edit_action` → `my_textbook_term_setting_change` / `my_textbook_version_change` | 看学生是否进入并实际修改教材配置 |
| 错题闭环 | `mistake_vault_enter` → `mistake_detail_view` → `mistake_drill_start` → `quiz_submit` → `mistake_mastery_update` | 看错题是否被再次练习并掌握 |
| 激励公益 | `reward_grant_result` → `coin_store_enter` / `charity_enter` → `store_redeem_result` / `charity_donate_result` | 看金币是否驱动兑换和公益行为 |
| 教师学情 | `teacher_login_success` → `teacher_dashboard_view` → `teacher_analytics_view` → `teacher_student_detail_view` → `teacher_message_handle` | 看教师是否形成查看和处理闭环 |

漏斗统一规则：

| 规则 | 说明 |
|---|---|
| 去重口径 | 用户级转化默认按 `user_id + natural_day` 去重，业务流程按对应流程 ID 去重 |
| 时间窗口 | 学生学习/AI 漏斗建议 30 分钟，教师学情漏斗建议 1 天 |
| 结果口径 | 成功类结果以后端事件为准 |
| 排除范围 | 新规日课不进入本期漏斗；小晤同学本次不新增漏斗或事件 |

## 9. 字段枚举

| 字段 | 枚举值 |
|---|---|
| `user_role` | `student`、`teacher` |
| `content_grade` | 以产品实际年级体系为准；必须使用稳定枚举，不使用页面临时文案 |
| `page_name`、`module_name` | 以第 3.3 节页面与模块表为唯一依据 |
| `source_tab`、`target_tab` | `today`、`subject`、`partner`、`mistake`、`me`；`partner` 沿用原有入口，本次只是不新增“小晤同学”事件 |
| `study_mode` | `textbook_sync`、`personalized` |
| `school_system` | `six_three`、`five_four` |
| `textbook_term` | `first_term`、`second_term`、`full_year` |
| `switch_method` | `tab_click`、`horizontal_swipe` |
| `module_id` | `mood_record`、`coin_store`、`charity_progress`、`ai_solve`、`ranking`、`me_page`、`sync_study`、`self_practice` |
| `edit_action` | `enter_edit`、`finish_edit` |
| `subject` | `chinese`、`math`、`english`、`morality`、`history`、`biology`、`geography`、`science`、`physics`、`chemistry` |
| `scene` | `lumi_partner_chat`、`ai_solve_one_to_one`、`plan_adjustment`、`web_search`、`photo_triage` |
| `input_type` | `text`、`voice`、`image`、`mixed` |
| `answer_result` | `correct`、`wrong`、`partial`、`manual_pending` |
| `solve_mode` | `photo_ask_xiaowu`、`lingjing_explain`、`homework_review` |
| `store_type` | `coin_store`、`wardrobe`、`wish_pool` |
| `message_type` | `report`、`redeem`、`system` |
| `rental_channel` | `cabinet_qr`、`app_scan`、`staff_assist` |
| `rental_step` | `scan`、`order_create`、`device_bind`、`success` |
| `fail_step` | `scan`、`order_create`、`device_bind`、`unknown` |

## 10. 隐私与合规

不采集学生真实姓名、手机号、身份证、精确地理位置、设备 IMEI、MAC、广告标识符。涉及图片、语音、作答内容时，埋点只传业务 ID、内容类型、数量、结果和耗时，不直接上传原始文本、原图或语音内容到友盟事件属性。

学生情绪、错因标签等属于敏感学习相关信息，事件属性只传枚举值和业务 ID，明细内容留在业务系统，数据看板只做聚合分析。

租借柜场景中，平板只能使用资产系统提供的 `device_asset_id` 作为业务资产标识，不得读取或上传 IMEI、MAC、设备序列号、广告标识符。柜机位置如需分析，只使用 `cabinet_id` 关联业务系统，不在友盟中直接上传详细地址。

## 11. 开发交付清单

| 交付项 | 说明 |
|---|---|
| 事件字典 | 以本文英文事件 ID、中文事件名、触发条件和属性为准 |
| 属性映射表 | 每个“事件×属性”明确来源、必填级别、条件、缺失处理和友盟策略；研发联调时验证而不是自行补定义 |
| 前后端分工表 | 每个事件明确 `final_reporter`、`trigger_phase`、`idempotency_key`、客户端失败和服务端超时规则；未确认项进入遗留问题清单 |
| 测试用例 | 每个 P0 事件至少覆盖一次正常上报、一次缺字段校验、一次离线补报 |
| 友盟看板 | 配置活跃、首页学习入口、学科远征、我的课本、AI 解题、小晤对话、错题闭环、教师学情、公益激励看板 |

## 12. 验收标准

上线前优先确认以下内容：

| 验收项 | 标准 |
|---|---|
| 上报正确 | 事件按规定时机上报，不重复、不遗漏 |
| 需求覆盖 | 学科远征、首页同步学习/自主练习、我的课本等本期需求均有完整数据 |
| 数据正确 | 用户身份、事件名称及关键业务字段上报正确 |
| 支持分析 | 数据可在友盟后台查询，并能支持本 PRD 定义的指标和漏斗分析 |

其他字段来源、上报端、必填条件及去重规则，以配套 Excel 为准。
