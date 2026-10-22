import type { StudentControl } from './hierarchicalDeviceControl';

export type TemporaryLockScope = { key: string; label: string; ids: string[] };
export type TemporaryLocks = Record<string, TemporaryLockScope>;

export const updateTemporaryLocks = (current: TemporaryLocks, scopes: TemporaryLockScope[], enabled: boolean): TemporaryLocks => {
  const next = { ...current };
  scopes.forEach((scope) => {
    if (enabled) next[scope.key] ??= { ...scope, ids: [...scope.ids] };
    else delete next[scope.key];
  });
  return next;
};

// 临时限制只叠加到显示和执行结果，不改写老师原有的锁屏设置。
export const applyTemporaryLocks = (controls: Record<string, StudentControl>, locks: TemporaryLocks): Record<string, StudentControl> => {
  const lockedIds = new Set(Object.values(locks).flatMap((scope) => scope.ids));
  return Object.fromEntries(Object.entries(controls).map(([id, control]) => [id,
    lockedIds.has(id) ? { ...control, locked: true } : control,
  ]));
};
