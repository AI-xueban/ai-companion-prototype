export type ThirdPartyApp = {
  id: string;
  name: string;
  icon?: string;
  packageName?: string;
  launchUrl?: string;
  enabled?: boolean;
  installed?: boolean;
  installedVersion?: string;
  latestVersion?: string;
};

/** 学校后台发布到平板的第三方应用演示数据。接入接口时替换为后台返回结果。 */
export const THIRD_PARTY_APPS: ThirdPartyApp[] = [
  { id: 'wechat', name: '微信', icon: '微', packageName: 'com.tencent.mm', enabled: true, installed: true, installedVersion: '8.0.49', latestVersion: '8.0.50' },
  { id: 'browser', name: '浏览器', icon: '网', packageName: 'com.android.browser', enabled: true, installed: true, installedVersion: '12.4.1', latestVersion: '12.4.1' },
  { id: 'feishu', name: '飞书', icon: '飞', packageName: 'com.ss.android.lark', enabled: true, installed: false, latestVersion: '7.2.0' },
  { id: 'notes', name: '笔记', icon: '记', packageName: 'com.example.notes', enabled: false, installed: true, installedVersion: '3.1.0', latestVersion: '3.1.1' },
];