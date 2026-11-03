import type { ControlModule } from './hierarchicalDeviceControl';

export const controlExceptionScenarios = [
  { id: 'no-grades', label: '学校暂无年级' },
  { id: 'no-classes', label: '年级暂无班级' },
  { id: 'no-students', label: '班级暂无学生' },
  { id: 'load-failed', label: '列表加载失败' },
  { id: 'save-failed', label: '保存失败' },
  { id: 'scope-changed', label: '操作对象发生变化' },
  { id: 'conflict', label: '设置已被他人修改' },
  { id: 'permission', label: '管理员权限失效' },
] as const;
export type ControlExceptionKind = typeof controlExceptionScenarios[number]['id'];
export type ControlExceptionDemo = { kind: ControlExceptionKind | 'normal'; module: Exclude<ControlModule, 'lock'>; key: number };
