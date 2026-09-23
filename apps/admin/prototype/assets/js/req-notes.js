/* 原型需求说明 · 右侧面板 + 注释开关 */

const REQ_ANNOTATE_KEY = 'ai_study_req_annotate_on';

const REQ_PAGE_NOTES = {
  'mall': {
    title: '金币运营 · 捐赠与爱心池',
    summary: '顶部展示当前爱心池总额、累计捐赠、平台配套与今日捐赠。平台配套下展示「通晤纪累计投入」。当前爱心项目以进度条呈现，可编辑上限并开启下阶段。页签为捐赠记录、往期项目、爱心池台账、月报与公示。100 金币 = 1 爱心值 = ¥1，平台按 1:1 配套资助。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  'home-config': {
    title: '首页配置',
    summary: '配置学生端首页板块：新增、启停、筛选。列表含来源、内容数、状态、实际发布时间、更新时间。实际发布时间仅已启用有值；即时/列表启用=本次上线时刻，定时=指定时刻；停用清空显示「—」。每日一词为固定板块，仅可启停，不可编辑/删除/拖拽。',
    doc: '万象视界需求文档 §5.4.5 / §5.9 / §7.1',
  },
  'layout-template': {
    title: '排版模板',
    summary: '只读预览全部图文/视频排版及多档条数效果，供运营选型。不可保存选择；从板块/频道表单跳转而来。板块按精确条数匹配；子频道图文按列换行，视频 6～10 条可横向查看。',
    doc: '万象视界需求文档 §5.6 / §7.2',
  },
  'cabinet-carousel': {
    title: '配置轮播',
    summary: '为单台柜机维护广告区图片轮播（1080×600，上限 3 条）：本地上传 jpg/png/webp/gif、调序、删除。保存并下发后写回该柜。图片停留全柜统一 5 秒，后台无时长配置入口。本期不支持视频。详情页不展示轮播区块。',
    doc: '设备管理需求文档 §4.16 / §5.6.5',
  },
  'cabinet-carousel-batch': {
    title: '批量配置轮播',
    summary: '勾选 ≥1 台柜机后进入。默认空列表；保存并批量下发需二次确认，保存后覆盖所选柜机原有全部轮播（空列表即清空）。编辑能力同单柜：上限 3 条、仅图片。',
    doc: '设备管理需求文档 §4.16 / §5.6.6',
  },
  'hot-recommend': {
    title: '热门推荐',
    summary: '全局唯一配置页，对应学生端首页热门轮播（无多套列表）。自动：展示上限 1～5、频道、排序、更新频率；手动：添加内容上限 5，自动→手动可同步当前结果。不做排版模板选择。支持草稿/即时/定时发布，规则同 §5.4.5。无内容或不满足发布条件时学生端隐藏轮播。',
    doc: '万象视界需求文档 §5.12 / §5.4.5 / §7.8',
  },
  'section-add': {
    title: '新增板块',
    summary: '配置名称、副标题（≤20 字）、数据来源（自动/手动）、展示上限 1～5、排版与发布时间。自动按规则拉取；手动最多关联 5 条。自动→手动时若有预览内容需确认是否同步。「保存并发布」：即时=当前时刻，定时=指定时刻。',
    doc: '万象视界需求文档 §5.4 / §5.6.1 / §7.1.3',
  },
  'section-edit': {
    title: '编辑板块',
    summary: '已启用操作列仅「停用」（清空实际发布时间）；停用后可启用，或编辑后「保存并发布」。再次上线按本次即时/定时写入最新实际发布时间。固定板块「每日一词」不可进入编辑。',
    doc: '万象视界需求文档 §5.4.5 / §7.1.2 / §7.1.3',
  },
  'content': {
    title: '内容管理',
    summary: '内容池：批量导入、手动添加、批量改标签/删除。已启用且已关联频道：仅查看、停用，不显示编辑。停用前若仍关联频道或板块须先解除。草稿仅可编辑；标题点击：草稿不可查看，已启用打开查看弹窗。',
    doc: '万象视界需求文档 §5.2.1 / §7.3',
  },
  'channel': {
    title: '频道管理',
    summary: '维护频道树与启停。实际发布时间规则同板块 §5.4.5。双语新知可编辑不可删除/拖拽；每日一词为系统固定频道，不可编辑/删除。筛选支持名称、状态、实际发布时间。',
    doc: '万象视界需求文档 §5.4.5 / §5.5 / §7.4.1',
  },
  'channel-add': {
    title: '新增频道',
    summary: '填写名称、父级、图标（嫦娥版/小晤版必传）、内容类型、排序方式、关联内容与排版。子频道须填展示条数 N（首页只展示前 N 条；「更多」页展示全部、固定三列卡片）。关联无上限；切换图文/视频会剔除类型不匹配项。「保存并发布」写入实际发布时间。',
    doc: '万象视界需求文档 §5.5 / §5.6.2 / §7.4.2',
  },
  'channel-edit': {
    title: '频道编辑',
    summary: '编辑基础信息与关联列表。已有关联时支持按标题搜索过滤展示（不改已选 ID）。停用清空实际发布时间；再次上线按即时/定时写入最新。系统固定频道不可删除。',
    doc: '万象视界需求文档 §5.4.5 / §7.4.2',
  },
  'tag': {
    title: '标签管理',
    summary: '维护内容标签：新增、编辑、启停。标签改名后同步已关联内容中的名称。不可与已有标签重名。',
    doc: '万象视界需求文档 §5.7 / §7.5',
  },
  'daily-word': {
    title: '每日一词',
    summary: '按年级维护词表。单词数>0 进「编辑」，=0 进「新增」。筛选年级与最新编辑时间，不提供导入时间筛选。学生端按词表顺序依次生效。',
    doc: '万象视界需求文档 §5.8 / §7.7.1',
  },
  'word-edit': {
    title: '编辑词表',
    summary: '维护某年级词条：编辑、批量删除、Excel 导入（导入后自动发布立即生效，无单独「发布」按钮）。最近生效时间、导入时间只读。失败原因展示同内容导入（说明列 + 悬停气泡，最多 100 字）。',
    doc: '万象视界需求文档 §5.8 / §7.7.2',
  },
  'device-overview': {
    title: '设备概览',
    summary: '借租柜运行总览。6 张统计卡：柜机在线（可点进柜机管理）、平板总数、在柜、离柜、逾期提醒、待处理告警。无顶部 Banner、无全流程步骤条。下方最近 5 条使用记录，状态/说明同 §4.10.1。借出须确认后开绑定格口；归还须放入、充电、关门、确认；未完成则设备仍已借出。',
    doc: '设备管理需求文档 §5.1 / §4.2～§4.4',
  },
  'cabinet': {
    title: '柜机管理',
    summary: '柜机台账：柜机 ID、名称、位置、格口占用、在线、轮播素材、心跳、绑定手机号、负责人及联系方式。支持添加/编辑。轮播按柜独立配置或批量覆盖（上限 3 张图，1080×600；停留 5 秒全局统一，后台无时长入口）。详情页不展示轮播。',
    doc: '设备管理需求文档 §4.14 / §4.16 / §5.6',
  },
  'cabinet-detail': {
    title: '柜机详情',
    summary: '基础信息含绑定手机号。格口概览：已绑定=已激活，未绑定=未激活；损坏时格口仍已激活，异常在设备状态体现。卡片展示柜门/设备状态（无说明、无电量）。工具栏：远程重启、远程开门（Q8）。绑定本柜机设备按 cabinetId 筛选。详情页不展示轮播。',
    doc: '设备管理需求文档 §4.6 / §4.14.5 / §5.6.2',
  },
  'tablet': {
    title: '平板设备',
    summary: '列表：设备ID、SN、型号、柜机ID/名称、格口号、柜门、格口状态、设备状态、说明。筛选支持设备ID/SN、柜机ID/名称模糊查询，状态为充电中/已借出/异常。工具栏：导入设备（须选柜机）、设备还原。操作仅「详情」，无电量列。一机一格，绑定格口不随借还变更。',
    doc: '设备管理需求文档 §4.9 / §4.15 / §5.2',
  },
  'tablet-detail': {
    title: '设备详情',
    summary: '只读展示设备ID/SN/型号、屏保二维码（归还时柜机拍该码识别）、柜门/格口/设备状态、初始入柜照及最近 5 条使用记录（含取消借用）。不单独展示充电状态与电量。异常时展示说明行。',
    doc: '设备管理需求文档 §5.3',
  },
  'device-usage': {
    title: '使用记录',
    summary: '借还记录：设备SN、格口号、所属柜机ID、学生、状态、说明、借出/归还时间。状态：开门中/已归还/借出中/归还异常/已逾期/取消借用。取消借用说明固定「未取出设备」。原型默认展示全部样例（正式版默认当日借出）。支持按柜机ID、SN、学号姓名、状态、时间筛选。',
    doc: '设备管理需求文档 §4.10.1 / §5.4.1',
  },
  'device-usage-detail': {
    title: '使用记录详情',
    summary: '时间线：编号密码验证 → 确认借取开绑定格口 → 取消借用（未拔充电器且关门）或取出 → 扫码拍照·归还确认 → 外观对比（仅归还成功）。未关门/未充电/疑似误放/取消归还时设备仍已借出。一机一格，不可跨格口放入。',
    doc: '设备管理需求文档 §4.2.1 / §4.11 / §5.4.2',
  },
  'device-alert': {
    title: '状态告警',
    summary: '列表：告警ID、类型、设备SN、格口、所属柜机ID、内容、状态、产生时间。类型含外观损坏、逾期提醒、未关门、未充电、柜机离线、人工问题反馈。待处理可点「处理」；已解决显示「已处理」不可点。默认按当月筛选。',
    doc: '设备管理需求文档 §4.7 / §5.5',
  },
};

const REQ_FIELD_NOTES = {
  '频道图标': {
    title: '频道图标',
    body: '必填。需分别上传「嫦娥版」「小晤版」两套图标。规格：24×24 / 16×16 / 32×32 px 的 SVG 或 PNG，大小不超过 10 KB。',
    doc: '万象视界需求文档 §7.4.2',
  },
  '频道名称': {
    title: '频道名称',
    body: '必填。展示于学生端频道入口与后台列表。',
    doc: '万象视界需求文档 §7.4.2',
  },
  '父级频道': {
    title: '父级频道',
    body: '可选。选择无则为一级频道；选择已有一级频道则创建为子频道。',
    doc: '万象视界需求文档 §7.4.2',
  },
  '内容类型': {
    title: '内容类型',
    body: '必填。图文 / 视频，决定可关联内容范围与可用排版模板。',
    doc: '万象视界需求文档 §5.6 / §7.4.2',
  },
  '排序方式': {
    title: '排序方式',
    body: '关联内容在学生端的排序规则，如按导入时间、阅读量。',
    doc: '万象视界需求文档 §7.4.2',
  },
  '板块名称': {
    title: '板块名称',
    body: '必填。首页板块标题，对应学生端首页纵向模块名称。',
    doc: '万象视界需求文档 §7.1.3',
  },
  '实际发布时间': {
    title: '实际发布时间',
    body: '板块与频道共用。仅本实体对学生端生效的发布时间，与内容导入时间、更新时间无关。规则：① 仅已启用有值，草稿/已停用为 null，列表显示「—」；② 即时发布或列表点「启用」→ 显示本次上线时刻；③ 指定时间发布 → 显示指定的定时时刻；④ 停用清空，再次启用后重新显示最新实际发布时间。',
    doc: '万象视界需求文档 §5.4.5 / §7.1.1 / §7.4.1',
  },
  '更新时间': {
    title: '更新时间',
    body: '板块配置最近一次变更时间。与「实际发布时间」相互独立：改配置会更新本列，不一定改变实际发布时间。',
    doc: '万象视界需求文档 §7.1.1',
  },
  '发布时间': {
    title: '发布时间',
    body: '保存并发布时的上线方式（板块/频道一致）。即时发布：实际发布时间=保存时刻；指定时间发布：实际发布时间=所选定时时刻（非点保存的时刻）。停用后再上线时，同样按本次选择的即时/定时写入最新实际发布时间。',
    doc: '万象视界需求文档 §5.4.5 / §7.1.3 E / §7.4.2',
  },
  '当前爱心池总额': {
    title: '当前爱心池总额',
    body: '当前爱心池累计金额，由学生捐赠折算（100 金币 = 1 爱心值 = ¥1）。平台配套资助在右侧单独统计。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '爱心池余额': {
    title: '爱心池余额',
    body: '同「当前爱心池总额」。由学生捐赠折算（100 金币 = 1 爱心值 = ¥1）。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '累计捐赠金币': {
    title: '累计捐赠金币',
    body: '全部学生历史捐赠金币合计，对应学生端爱心公告栏捐赠积分口径。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '平台配套资助': {
    title: '平台配套资助',
    body: '平台按捐赠折算金额 1:1 匹配的累计投入，下方说明为「通晤纪累计投入」。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '爱心项目': {
    title: '爱心项目',
    body: '爱心项目按进行中、已完成、已取消分组。学生捐赠进入爱心池。进行中对学生展示已筹金额（无上限）；已完成展示成果照片或视频。进行中与已完成合计最多 6 个。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '项目介绍': {
    title: '项目介绍',
    body: '爱心项目的介绍文案，列表单独成列展示，用于向学生端说明捐赠用途。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '项目图片': {
    title: '项目图片',
    body: '选填。用于学生端展示爱心项目封面。新增/编辑均可上传，支持 jpg / png / webp / gif，单张不超过 10MB。可重新选择或删除。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '新增项目': {
    title: '新增项目',
    body: '创建爱心项目。进行中与已完成合计已达 6 个时按钮禁用。已取消不占名额。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '进行中': {
    title: '进行中',
    body: '可向学生端展示介绍、封面和已筹金额（无上限）。点「标记完成」后改为已完成。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '已筹金额': {
    title: '已筹金额',
    body: '学生端展示该项目已经筹了多少钱，无上限、无进度条。可手填，或点「填入爱心池累计」带入当前累计捐赠折算。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '成果照片 / 视频': {
    title: '成果照片 / 视频',
    body: '已完成项目在学生端展示。可上传图片或 mp4/mov，最多 9 个。进行中也可先传，完成后再给学生看。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '标记完成': {
    title: '标记完成',
    body: '确认后即完成，不要求筹满或先传成果。完成后学生端展示成果照片或视频；可稍后在编辑中补传。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '学生端可见': {
    title: '学生端可见',
    body: '开启后：进行中展示介绍、封面和已筹金额；已完成展示成果照片或视频。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '完成说明': {
    title: '完成说明',
    body: '项目落地结果文案，例如「已为学校安装 20 台空调」。可与成果媒体一起给学生看。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '项目名称': {
    title: '项目名称',
    body: '按被资助项目筛选捐赠记录。可搜索、多选，也可勾选「全部项目」。默认查询全部。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '调整上限': {
    title: '调整上限',
    body: '仅调整当前阶段筹款上限。新上限不得低于已募金币。项目名称和周期不可在此修改。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '调整筹款上限': {
    title: '调整筹款上限',
    body: '仅调整当前阶段筹款上限。展示当前上限，输入新上限后保存。新上限不得低于已募金币。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '结项并开下阶段': {
    title: '结项并开下阶段',
    body: '确认后当前筹款阶段立即结项，学生端不能再向本期捐赠。需填写新阶段名称、周期与上限。结项记录进入「往期项目」，默认未公示；公示、项目成果与文字说明请到往期项目点击「上传项目成果」填写。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '往期项目': {
    title: '往期项目',
    body: '结项后的筹款阶段在「往期项目」页签查看。未公示项目学生端不展示。操作含查看详情、上传项目成果、公示。公示后操作变为取消公示。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '确认结项': {
    title: '确认结项',
    body: '将当前筹款阶段标记为已结项，并按填写的名称、周期、上限开启新阶段。公示、项目成果与文字说明不在结项时填写，请到「往期项目」点击上传项目成果，默认不公示。发布月报时也会执行相同结项逻辑，请勿重复操作。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '爱心值兑换': {
    title: '爱心值兑换',
    body: '学生将金币兑换为爱心值的记录。100 金币 = 1 爱心值。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '项目': {
    title: '项目',
    body: '已更名为「往期项目」，直接查看结项后的筹款阶段。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '编辑': {
    title: '编辑',
    body: '编辑往期项目的成果图片与文字说明。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '公示状态': {
    title: '公示状态',
    body: '往期项目对学生端是否可见。未公示仅后台可查；公示后学生端才展示该项目。列表可公示或取消公示。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '不公示': {
    title: '不公示',
    body: '取消学生端展示。结项后默认未公示；公示弹窗中也可选择不公示，仅在后台保留往期记录。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '上传项目成果': {
    title: '上传项目成果',
    body: '上传成果图片并填写文字说明。结项后默认不公示，学生端不展示该往期项目。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '取消公示': {
    title: '取消公示',
    body: '取消学生端展示，仅在后台保留往期记录。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '公示': {
    title: '公示',
    body: '确认后往期项目对学生端展示。未公示仅后台可查。公示月报则写入学生端爱心公告栏，可预览或撤回。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '被资助项目': {
    title: '被资助项目',
    body: '该笔捐赠对应的公益项目。未关联时显示 —。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '折合人民币': {
    title: '折合人民币',
    body: '捐赠金币按 100 金币 = ¥1 折算的人民币金额。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '按学校汇总': {
    title: '按学校汇总',
    body: '按当前筛选条件，将捐赠记录聚合到学校维度：人次、金币、折合人民币。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '导出 Excel': {
    title: '导出 Excel',
    body: '按当前筛选条件导出当前列表为 CSV（可用 Excel 打开）。图标统一放在列表右上角。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '已取消': {
    title: '已取消',
    body: '存放已取消的爱心项目。可点「恢复」回到原先的进行中或已完成；满 6 个时需先取消其他项目再恢复。',
    doc: '原型 · 金币运营 / 爱心项目',
  },
  '月报与公示': {
    title: '月报与公示',
    body: '按自然月汇总该月产生的数据，不区分项目。原型打开时补齐缺失的已结束月份记录，正式版由后台每月自动生成。列表提供编辑标题、预览、发布，发布后写入学生端爱心公告栏。',
    doc: '原型 · 金币商城 / 爱心公告栏',
  },
  '副标题': {
    title: '副标题',
    body: '选填，不超过 20 字。空则列表可展示为「—」。',
    doc: '万象视界需求文档 §7.1.3',
  },
  '数据来源': {
    title: '数据来源',
    body: '自动：按规则从内容池拉取；手动：运营点选关联内容。切换来源时若已有预览内容需确认。',
    doc: '万象视界需求文档 §7.1.3',
  },
  '展示上限': {
    title: '展示上限',
    body: '自动来源时拉取并展示的内容条数上限，影响排版模板可选范围。',
    doc: '万象视界需求文档 §5.6 / §7.1.3',
  },
  '设备状态': {
    title: '设备状态',
    body: '列表层：充电中 / 已借出 / 异常。在柜设备→充电中；借出→已借出；逾期、擦伤、在柜门开等归入异常并在说明列展示。后台不展示电量百分比。',
    doc: '设备管理需求文档 §4.9.1',
  },
  '柜门': {
    title: '柜门',
    body: '由借租柜门磁上报：关闭 / 打开。已借出设备展示「—」。未关门异常时应为打开。',
    doc: '设备管理需求文档 §4.6 / §4.4',
  },
  '格口状态': {
    title: '格口状态',
    body: '已绑定平板的格口为已激活；未绑定平板为未激活；设备或格口损坏时格口仍为已激活，异常在设备状态中体现。设备电量、柜门和充电状态不影响格口状态。',
    doc: '设备管理需求文档 §4.6.2',
  },
  '说明': {
    title: '说明',
    body: '平板列表：异常原因（逾期、擦伤、未关门等）；无异常不强调。使用记录：取消借用固定「未取出设备」；归还未完成展示未关门、未充电、疑似误放或归还已取消；其余「—」。多项以「；」拼接。',
    doc: '设备管理需求文档 §4.9.1 / §4.10.1 / §4.2.1',
  },
  '记录状态': {
    title: '记录状态',
    body: '开门中 / 已归还 / 借出中 / 归还异常 / 已逾期 / 取消借用。取消借用需设备未拔充电器且关门；归还需放入、充电、关门、确认同时完成；归还门未关为开门中，其他归还问题为归还异常；满24小时未还为已逾期。',
    doc: '设备管理需求文档 §4.2.1 / §4.10.1',
  },
  '取消借用': {
    title: '取消借用',
    body: '确认借取开门后，设备未拔充电器且关门→取消借用并留痕；列表说明「未取出设备」。拔线再放回则仍为已借出。',
    doc: '设备管理需求文档 §4.2.1',
  },
  '设备借出': {
    title: '设备借出',
    body: '编号密码验证后选择设备；确认借取才打开绑定格口。确认前取消不打开柜门。',
    doc: '设备管理需求文档 §4.2.1 / §4.11',
  },
  '告警类型': {
    title: '告警类型',
    body: '外观损坏、逾期提醒、未关门、未充电、柜机离线、人工问题反馈。人工反馈由现场人员上报。',
    doc: '设备管理需求文档 §4.4 / §4.7',
  },
  '格口': {
    title: '格口',
    body: '告警关联设备当前所在格口编号（如 #4）。无关联设备（如柜机离线）显示 —。',
    doc: '设备管理需求文档 §5.5',
  },
  '扫码拍照 · 归还确认': {
    title: '扫码拍照 · 归还确认',
    body: '点击归还后扫码自动拍照并开绑定格口。设备放入、充电、关门、确认后归还成功；未关门、未充电可重试，取消则柜门重新打开。',
    doc: '设备管理需求文档 §4.11',
  },
  '外观对比判定': {
    title: '外观对比判定',
    body: '仅最终正常归还后出现。后台用归还照与基准照做屏幕损伤 AI 对比。取消借用无此节点。',
    doc: '设备管理需求文档 §4.3 / §4.11',
  },
  '每日一词': {
    title: '每日一词（首页板块）',
    body: '系统预置固定板块：不可编辑、删除、拖拽；支持停用/启用。停用清空实际发布时间；再次启用写入当前时刻为最新实际发布时间。停用后学生端不展示该入口。',
    doc: '万象视界需求文档 §5.4.5 / §5.9 / §7.1.2',
  },
  '设备还原': {
    title: '设备还原',
    body: '仅处理「异常 · 设备擦伤」。输入 SN（支持多个）检测通过后才可一键还原；逾期、放置检测等其他异常不在范围内。原型可测 SN：SN20260301005。',
    doc: '设备管理需求文档 §4.15 / §5.2.2',
  },
  '导入设备': {
    title: '导入设备',
    body: '批量导入须先选择所属柜机。正式版写入设备台账并关联该柜；原型仅演示上传/解析 UI。',
    doc: '设备管理需求文档 §4.13',
  },
  '广告轮播': {
    title: '广告轮播',
    body: '柜机广告区图片轮播，尺寸 1080×600，单柜上限 3 条。支持单柜配置与多选批量覆盖。图片停留全柜统一 5 秒，后台无时长入口。本期仅图片，不支持视频。与学生端「热门推荐」轮播无关。',
    doc: '设备管理需求文档 §4.16',
  },
  '轮播素材': {
    title: '轮播素材',
    body: '列表缩略图预览该柜已下发图片；无素材显示「暂无素材」。点击「查看轮播」按 1080×600 预览；「配置轮播」进入单柜编辑。',
    doc: '设备管理需求文档 §5.6.1 / §5.6.4',
  },
  '查看轮播': {
    title: '查看轮播',
    body: '按广告区 1080×600 比例预览当前柜机素材，多张可切换。底部可关闭或去配置。',
    doc: '设备管理需求文档 §5.6.4',
  },
  '配置轮播': {
    title: '配置轮播',
    body: '进入该柜独立配置页：上传、调序、删除后「保存并下发」。满 3 条时「添加图片」置灰。',
    doc: '设备管理需求文档 §5.6.5',
  },
  '批量配置轮播内容': {
    title: '批量配置轮播内容',
    body: '须先勾选 ≥1 台柜机，否则 Toast 提示。保存后覆盖所选柜机原有全部轮播；空列表即清空。需二次确认。',
    doc: '设备管理需求文档 §5.6.6',
  },
  '绑定手机号': {
    title: '绑定手机号',
    body: '柜机绑定手机号，添加/编辑必填，格式 11 位（^1\\d{10}$）。',
    doc: '设备管理需求文档 §4.14.3 / §5.6.1.1',
  },
  '柜机ID': {
    title: '柜机ID',
    body: '柜机独立编号（如 CAB-001）。添加时可改，不可与已有柜机重复。平板、使用记录、告警均按所属柜机ID关联与筛选。',
    doc: '设备管理需求文档 §5.6.1 / §5.2 / §5.4.1',
  },
  '所属柜机ID': {
    title: '所属柜机ID',
    body: '设备台账绑定的柜机 ID。一机一格，不随借还变更。使用记录与告警支持按此模糊筛选。',
    doc: '设备管理需求文档 §4.14.2 / §5.4.1 / §5.5',
  },
  '设备SN': {
    title: '设备SN',
    body: '平板序列号，列表与告警均展示 SN。不可与其他设备重复。设备还原按 SN 检测。',
    doc: '设备管理需求文档 §5.2 / §5.5 / §4.15',
  },
  '远程开门': {
    title: '远程开门',
    body: '柜机详情格口概览下发 Q8 指令。离线柜机不可开门。格口卡片本身不提供单独「开门」按钮。',
    doc: '设备管理需求文档 §4.14.5 / §5.6.2',
  },
  '远程重启': {
    title: '远程重启',
    body: '柜机详情格口概览工具栏，原型 Toast 演示，不下发真实指令。',
    doc: '设备管理需求文档 §5.6.2',
  },
  '展示条数': {
    title: '展示条数',
    body: '仅子频道必填。首页只展示关联列表前 N 条；点击「更多」后展示该子频道全部可展示内容，固定每行 3 条卡片，不沿用首页排版。',
    doc: '万象视界需求文档 §5.5.4 / §5.6.2 / §7.4.2',
  },
};

let reqAnnotateOn = localStorage.getItem(REQ_ANNOTATE_KEY) === '1';
let reqHoverEl = null;
let reqActiveEl = null;

function isReqAnnotateOn() {
  return !!reqAnnotateOn;
}

function setReqAnnotateOn(on) {
  reqAnnotateOn = !!on;
  localStorage.setItem(REQ_ANNOTATE_KEY, reqAnnotateOn ? '1' : '0');
  document.body.classList.toggle('req-annotate-on', reqAnnotateOn);
  const toggle = document.getElementById('req-annotate-toggle');
  if (toggle) toggle.checked = reqAnnotateOn;
  clearReqHighlight();
  if (!reqAnnotateOn) {
    renderReqPanelIdle();
  } else {
    renderReqPanelHint();
  }
}

function clearReqHighlight() {
  if (reqHoverEl) {
    reqHoverEl.classList.remove('req-hover-target');
    reqHoverEl = null;
  }
  if (reqActiveEl) {
    reqActiveEl.classList.remove('req-active-target');
    reqActiveEl = null;
  }
}

function getCurrentRouteKey() {
  try {
    return (typeof parseHash === 'function' ? parseHash().route : location.hash.slice(1).split('?')[0]) || 'home-config';
  } catch (e) {
    return 'home-config';
  }
}

function normalizeReqLabel(text) {
  return String(text || '')
    .replace(/[＊*·\s]/g, '')
    .replace(/（.*?）|\(.*?\)/g, '')
    .trim();
}

function findReqFieldNote(labelText) {
  const raw = String(labelText || '').trim();
  if (!raw) return null;
  if (REQ_FIELD_NOTES[raw]) return REQ_FIELD_NOTES[raw];
  const norm = normalizeReqLabel(raw);
  for (const [key, note] of Object.entries(REQ_FIELD_NOTES)) {
    if (normalizeReqLabel(key) === norm) return note;
    if (norm.includes(normalizeReqLabel(key)) || normalizeReqLabel(key).includes(norm)) return note;
  }
  return null;
}

function extractLabelFromEl(el) {
  if (!el || el.nodeType !== 1) return '';
  if (el.dataset?.reqTitle) return el.dataset.reqTitle;
  const label = el.closest?.('.form-item')?.querySelector('.form-label, label');
  if (label) return label.textContent.trim();
  const detailLabel = el.closest?.('.detail-item')?.querySelector('label');
  if (detailLabel) return detailLabel.textContent.trim();
  const filterLabel = el.closest?.('.filter-item')?.querySelector('label');
  if (filterLabel) return filterLabel.textContent.trim();
  if (el.matches('th, .form-label, .form-section-title, .page-card-title, .mall-page-title, .mall-panel-title, .dev-timeline-title')) {
    return el.textContent.trim();
  }
  const statLabel = el.closest?.('.mall-stat-card')?.querySelector('.label');
  if (statLabel) return statLabel.textContent.trim();
  const th = el.closest?.('th');
  if (th) return th.textContent.trim();
  const btn = el.closest?.('button, .btn, .btn-link, .btn-primary');
  if (btn) return btn.textContent.trim();
  const title = el.closest?.('.dev-timeline-item')?.querySelector('.dev-timeline-title');
  if (title) return title.textContent.trim();
  const td = el.closest?.('td');
  if (td) {
    const table = td.closest('table');
    const idx = td.cellIndex;
    const head = table?.querySelector(`thead th:nth-child(${idx + 1})`);
    if (head) return head.textContent.trim();
  }
  return (el.textContent || '').trim().slice(0, 40);
}

function resolveReqNote(el) {
  const route = getCurrentRouteKey();
  const page = REQ_PAGE_NOTES[route] || {
    title: ROUTE_META?.[route]?.title || route,
    summary: '当前页面暂无更细粒度条目说明，可对照需求文档对应章节。',
    doc: '',
  };

  if (!el) {
    return {
      title: page.title,
      body: page.summary,
      doc: page.doc,
      scope: '页面总览',
    };
  }

  if (el.dataset?.reqBody) {
    return {
      title: el.dataset.reqTitle || extractLabelFromEl(el) || '元素说明',
      body: el.dataset.reqBody,
      doc: el.dataset.reqDoc || page.doc,
      scope: '元素',
    };
  }

  const label = extractLabelFromEl(el);
  const field = findReqFieldNote(label);
  if (field) {
    return {
      title: field.title,
      body: field.body,
      doc: field.doc || page.doc,
      scope: '字段 / 控件',
    };
  }

  if (el.closest?.('.dev-timeline')) {
    return {
      title: label || '全流程时间线',
      body: page.summary,
      doc: page.doc,
      scope: '时间线',
    };
  }

  if (el.closest?.('.data-table, .table-wrap')) {
    return {
      title: label || '列表',
      body: `${page.summary}\n\n点击的列表列/单元格：${label || '（未识别列名）'}`,
      doc: page.doc,
      scope: '列表',
    };
  }

  if (el.closest?.('.filter-form')) {
    return {
      title: label || '筛选区',
      body: `用于按条件过滤当前列表。当前筛选项：${label || '未命名'}。`,
      doc: page.doc,
      scope: '筛选',
    };
  }

  return {
    title: label || page.title,
    body: label
      ? `【${label}】\n\n${page.summary}\n\n（该元素暂无独立字段说明，已回退到当前页需求摘要。）`
      : page.summary,
    doc: page.doc,
    scope: label ? '元素（回退页面说明）' : '页面总览',
  };
}

function renderReqPanelContent(note) {
  const bodyEl = document.getElementById('req-panel-body');
  if (!bodyEl || !note) return;
  bodyEl.innerHTML = `
    <div class="req-note-meta">
      <span class="req-note-scope">${esc(note.scope || '说明')}</span>
      <span class="req-note-route">${esc(getCurrentRouteKey())}</span>
    </div>
    <h4 class="req-note-title">${esc(note.title || '需求说明')}</h4>
    <div class="req-note-body">${esc(note.body || '').replace(/\n/g, '<br>')}</div>
    ${note.doc ? `<div class="req-note-doc">依据：${esc(note.doc)}</div>` : ''}
  `;
}

function renderReqPanelIdle() {
  const bodyEl = document.getElementById('req-panel-body');
  if (!bodyEl) return;
  const page = REQ_PAGE_NOTES[getCurrentRouteKey()];
  bodyEl.innerHTML = `
    <div class="req-panel-empty">
      <p>注释模式已关闭，可正常操作原型。</p>
      <p class="req-panel-empty-sub">打开右上角「注释」开关后，点击左侧任意元素查看需求说明。</p>
      ${page ? `<div class="req-page-brief"><strong>当前页：</strong>${esc(page.title)}<br>${esc(page.summary)}</div>` : ''}
    </div>
  `;
}

function renderReqPanelHint() {
  const bodyEl = document.getElementById('req-panel-body');
  if (!bodyEl) return;
  const page = REQ_PAGE_NOTES[getCurrentRouteKey()];
  bodyEl.innerHTML = `
    <div class="req-panel-empty">
      <p>注释模式已开启。</p>
      <p class="req-panel-empty-sub">点击左侧画布中的按钮、字段、表格列等查看对应需求说明；再次关闭开关可恢复正常交互。</p>
      ${page ? `<div class="req-page-brief"><strong>当前页：</strong>${esc(page.title)}<br>${esc(page.summary)}</div>` : ''}
    </div>
  `;
}

function pickReqTarget(el) {
  if (!el || el.nodeType !== 1) return null;
  if (el.closest('.req-panel, .toast-container')) return null;
  const main = document.getElementById('main-content');
  const modal = document.getElementById('modal-overlay');
  const inMain = main?.contains(el);
  const inModal = modal && !modal.hidden && modal.contains(el);
  if (!inMain && !inModal) return null;

  const preferred = el.closest([
    '[data-req-id]',
    '[data-req-body]',
    '.form-item',
    '.detail-item',
    '.filter-item',
    '.dev-timeline-item',
    'th',
    'td',
    'button',
    '.btn',
    '.btn-link',
    '.upload-box',
    '.channel-icon-version',
    '.page-card-title',
    '.form-section-title',
    '.info-banner',
    '.dev-stat-card',
    '.mall-stat-card',
    '.mall-page-title',
    '.mall-project-banner',
    '.mall-project-panel',
    '.mall-panel-title',
    '.dev-flow-step',
    '.placement-scenario',
    'tr',
    '.page-card',
  ].join(','));
  return preferred || el;
}

function showReqForElement(el) {
  const target = pickReqTarget(el);
  if (!target) return;
  if (reqActiveEl) reqActiveEl.classList.remove('req-active-target');
  reqActiveEl = target;
  reqActiveEl.classList.add('req-active-target');
  renderReqPanelContent(resolveReqNote(target));
}

function onReqAnnotateClick(e) {
  if (!reqAnnotateOn) return;
  if (e.target.closest('.req-panel')) return;
  if (e.target.closest('.sider, .header, .tabs-bar')) return;
  const target = pickReqTarget(e.target);
  if (!target) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();
  showReqForElement(target);
}

function onReqAnnotateMouseOver(e) {
  if (!reqAnnotateOn) return;
  if (e.target.closest('.req-panel, .sider, .header, .tabs-bar')) return;
  const target = pickReqTarget(e.target);
  if (!target || target === reqHoverEl) return;
  if (reqHoverEl && reqHoverEl !== reqActiveEl) {
    reqHoverEl.classList.remove('req-hover-target');
  }
  reqHoverEl = target;
  if (reqHoverEl !== reqActiveEl) {
    reqHoverEl.classList.add('req-hover-target');
  }
}

function onReqAnnotateMouseOut(e) {
  if (!reqAnnotateOn || !reqHoverEl) return;
  if (e.relatedTarget && reqHoverEl.contains(e.relatedTarget)) return;
  if (reqHoverEl !== reqActiveEl) {
    reqHoverEl.classList.remove('req-hover-target');
  }
  reqHoverEl = null;
}

function refreshReqPanelForRoute() {
  clearReqHighlight();
  if (reqAnnotateOn) renderReqPanelHint();
  else renderReqPanelIdle();
}

function toggleReqPanel(force) {
  const panel = document.getElementById('req-panel');
  const button = document.getElementById('req-float-btn');
  if (!panel) return;
  const open = typeof force === 'boolean' ? force : panel.classList.contains('is-hidden');
  panel.classList.toggle('is-hidden', !open);
  button?.classList.toggle('is-active', open);
  if (button) button.setAttribute('aria-label', open ? '关闭需求说明' : '打开需求说明');
}

function initReqNotes() {
  const floatButton = document.getElementById('req-float-btn');
  const panel = document.getElementById('req-panel');
  panel?.classList.add('is-hidden');
  floatButton?.addEventListener('click', () => toggleReqPanel());
  const toggle = document.getElementById('req-annotate-toggle');
  if (toggle) {
    toggle.checked = reqAnnotateOn;
    toggle.addEventListener('change', () => setReqAnnotateOn(toggle.checked));
  }
  document.body.classList.toggle('req-annotate-on', reqAnnotateOn);
  document.addEventListener('click', onReqAnnotateClick, true);
  document.addEventListener('mouseover', onReqAnnotateMouseOver, true);
  document.addEventListener('mouseout', onReqAnnotateMouseOut, true);
  if (reqAnnotateOn) renderReqPanelHint();
  else renderReqPanelIdle();
}

window.toggleReqPanel = toggleReqPanel;
window.isReqAnnotateOn = isReqAnnotateOn;
window.setReqAnnotateOn = setReqAnnotateOn;
window.refreshReqPanelForRoute = refreshReqPanelForRoute;
window.initReqNotes = initReqNotes;
