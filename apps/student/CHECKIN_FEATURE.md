# 每日晨检功能 - MVP实现文档

## 功能概述

实现了AI伙伴(Lumi)引导下的个性化每日任务生成机制，包括：
1. Dashboard显示引导卡片，引导用户与Lumi对话
2. LumiSpace支持结构化晨检对话流程
3. 支持快速生成模式(基于历史数据)
4. 支持任务生成后的微调功能

## 新增/修改的文件

### 新增组件

1. **`components/Dashboard/DailyTaskGuideCard.tsx`**
   - 空状态引导卡片
   - 包含"开始定制"和"快速推荐"两个按钮
   - 支持生成中的loading状态

### 修改的组件

1. **`types.ts`**
   - 新增 `DailyCheckInData` 接口
   - 新增 `CheckInQuestion` 接口

2. **`components/Dashboard/TaskStream.tsx`**
   - 新增 `onRecustomize` 回调prop
   - 添加"重新定制"按钮

3. **`components/LumiSpace/LumiSpace.tsx`**
   - 新增 `checkInMode` prop (是否进入晨检模式)
   - 新增 `onCheckInComplete` 回调
   - 新增 `existingPlan` prop (用于编辑模式)
   - 实现结构化对话流程(4轮问题)
   - 支持快捷回复按钮
   - 支持任务预览和确认
   - 支持任务微调的自然语言理解

4. **`App.tsx`**
   - 新增 `isCheckInMode` 状态
   - 新增 `isGeneratingPlan` 状态
   - 新增 `handleStartCheckIn` - 开始晨检
   - 新增 `handleQuickGenerate` - 快速生成
   - 新增 `handleCheckInComplete` - 晨检完成
   - 新增 `handleRecustomize` - 重新定制
   - 修改 Dashboard 的 today tab，条件渲染引导卡片或任务列表
   - 注释掉自动生成任务的逻辑

## 使用流程

### 场景1: 首次生成今日任务(定制模式)

1. 用户进入App，Dashboard显示 `DailyTaskGuideCard`
2. 用户点击"开始定制今日任务"
3. 自动切换到 LumiSpace (partner tab)
4. Lumi开始4轮结构化对话：
   - Q1: "今天在学校怎么样？" (快捷选项: 挺好的/有点累/遇到难题)
   - Q2: "今天哪些科目的内容想巩固一下？" (快捷选项: 数学/语文/英语/都可以)
   - Q3: "有遇到不太懂的题吗？" (快捷选项: 有几道题不会/没有，跳过)
   - Q4: "今天打算学习多久呀？" (快捷选项: 15分钟/30分钟/45分钟)
5. 对话完成后，显示任务预览
6. 用户确认后，生成任务并自动返回Dashboard

### 场景2: 快速生成模式

1. 用户点击"让 Lumi 快速推荐"
2. Dashboard显示生成中动画(2秒)
3. 基于历史数据自动生成任务
4. 直接显示任务列表

### 场景3: 任务微调

1. 任务生成后，TaskStream右上角显示"重新定制"按钮
2. 用户点击后进入LumiSpace
3. Lumi提示"任务看过啦？要不要调整一下？"
4. 用户可以通过自然语言调整：
   - "数学太难了，简单点" → 降低难度
   - "再加一个语文" → 增加任务
   - "不想做英语了" → 删除任务
5. 系统显示更新后的任务预览
6. 用户确认后返回Dashboard

## 晨检对话系统设计

### 快捷回复按钮
- 圆角按钮，品牌色边框
- hover时填充背景色
- 点击后添加为用户消息

### 消息类型扩展
- `type: 'quick-reply'` - 带快捷回复按钮的消息
- `quickReplies: string[]` - 快捷回复选项数组
- `onQuickReply: (reply: string) => void` - 点击回调

### 对话状态管理
- `isInCheckIn` - 是否处于结构化对话流程中
- `checkInStep` - 当前对话步骤(0-3)
- `checkInData` - 收集的用户回答数据

## 技术细节

### 状态管理
- 使用 React useState 管理晨检状态
- 使用 useEffect 监听 checkInMode 变化，自动开始对话

### 对话流程控制
```typescript
startCheckInFlow() → askCheckInQuestion(0-3) → showTaskPreview() → completeCheckIn()
```

### 任务调整逻辑
- 简单的关键词匹配(MVP阶段)
- 未来可接入真实AI理解用户意图

## 未来优化方向

### 第二阶段
1. 接入真实AI对话(Gemini API)
2. 根据用户回答动态调整问题
3. 支持拍照上传作业题
4. 基于历史数据更精准的快速推荐

### 第三阶段
1. 持久化对话记录
2. 分析用户习惯，优化推荐算法
3. 生成学习周报/月报
4. 家长端查看功能

## 测试建议

1. **测试流程1: 完整对话**
   - 点击"开始定制" → 依次点击快捷回复 → 查看任务预览 → 确认 → 返回Dashboard

2. **测试流程2: 快速生成**
   - 点击"快速推荐" → 等待2秒 → 查看生成的任务

3. **测试流程3: 任务调整**
   - 生成任务后 → 点击"重新定制" → 输入"数学太难了" → 查看Lumi回复 → 确认更新

4. **测试流程4: 多次调整**
   - 在调整对话中 → 继续输入"再加一个语文" → 确认 → 返回Dashboard

## 已知限制(MVP阶段)

1. 晨检对话是写死的4轮问题(未接入真实AI)
2. 任务生成使用原有的 `generateDailyPlan()` 函数(未根据对话定制)
3. 任务微调使用简单的关键词匹配(未接入AI理解)
4. 不支持拍照上传作业
5. 对话数据未持久化

## 界面设计特点

- 渐变色卡片背景(天空蓝 + 紫色)
- 主次按钮明确(主按钮更大，渐变背景)
- 快捷回复按钮使用圆角边框样式
- 重新定制按钮使用毛玻璃效果
- 生成中状态使用旋转星星动画

## 可复用组件

- `DailyTaskGuideCard` - 可用于其他空状态引导场景
- 快捷回复按钮样式 - 可应用到其他对话场景
- 任务预览格式 - 可用于其他任务展示场景


