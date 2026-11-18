export const printerDemoScenarios = [
  { id: 'same-wifi', label: '同一 Wi-Fi · 正常连接' },
  { id: 'no-wifi', label: '未连接 Wi-Fi' },
  { id: 'hidden-wifi', label: '手动添加隐藏网络' },
  { id: 'hotspot', label: '直连打印机热点 · 无互联网' },
  { id: 'wrong-password', label: 'Wi-Fi 连接失败 · 密码错误' },
  { id: 'wifi-timeout', label: 'Wi-Fi 连接失败 · 超时' },
  { id: 'no-printers', label: '同网搜不到打印机' },
  { id: 'printer-failed', label: '打印机连接失败' },
  { id: 'printer-offline', label: '打印机离线' },
  { id: 'out-of-paper', label: '打印暂停 · 缺纸' },
  { id: 'out-of-ink', label: '打印暂停 · 耗材用尽' },
  { id: 'paper-jam', label: '打印暂停 · 卡纸' },
  { id: 'blocked-unknown', label: '打印暂停 · 原因未知' },
  { id: 'low-supply', label: '打印中 · 耗材偏低' },
  { id: 'before-send', label: '打印中断 · 任务尚未发送' },
  { id: 'after-send', label: '打印中断 · 已发送，结果待确认' },
] as const;

export type PrinterDemoScenarioId = typeof printerDemoScenarios[number]['id'];
export type DemoPrintInterruption = Extract<PrinterDemoScenarioId, 'before-send' | 'after-send'>;
export type DemoWifiIssue = Extract<PrinterDemoScenarioId, 'wrong-password' | 'wifi-timeout'>;
export type DemoPrinterIssue = Extract<PrinterDemoScenarioId, 'no-printers' | 'printer-failed' | 'printer-offline'>;

export interface DemoPrintIssue {
  title: string;
  description: string;
  action: string;
}

export const demoPrintIssues: Partial<Record<PrinterDemoScenarioId, DemoPrintIssue>> = {
  'out-of-paper': { title: '打印暂停，打印机缺纸', description: '请在打印机上补充纸张。加纸后可以查看当前任务是否继续。', action: '我已加纸' },
  'out-of-ink': { title: '打印暂停，耗材已用尽', description: '请按打印机面板提示更换墨盒或碳粉。更换后可以查看当前任务是否继续。', action: '我已更换耗材' },
  'paper-jam': { title: '打印暂停，打印机卡纸', description: '请按打印机面板提示清理卡纸。处理后可以查看当前任务是否继续。', action: '我已清理卡纸' },
  'blocked-unknown': { title: '打印暂停，请查看打印机面板', description: '请在打印机面板查看并处理异常，处理后可以查询当前任务。', action: '我已检查打印机' },
};

export interface DemoWifiNetwork {
  name: string;
  localOnly?: boolean;
  hotspot?: boolean;
}

export const classroomWifi: DemoWifiNetwork = { name: 'AI-Classroom' };
export const printerHotspot: DemoWifiNetwork = { name: 'DIRECT-58-EPSON', localOnly: true, hotspot: true };
export const hiddenWifiName = 'AI-Classroom-Hidden';
