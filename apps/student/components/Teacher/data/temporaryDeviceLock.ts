import type { StudentControl } from './hierarchicalDeviceControl';

export type TemporaryLockScope = { key: string; label: string; ids: string[] };
export type TemporaryLocks = Record<string, TemporaryLockScope>;
export type SchoolTemporaryLockSession = { active: boolean; dailySnapshot: Record<string, boolean> };
export type TemporaryLockClassStates = Record<string, { name: string; enabled: boolean }>;

export const SCHOOL_TEMPORARY_LOCK_NOTICE = '学校管理员正在进行临时锁屏管控，暂时无法修改锁屏状态。';

export const updateSchoolTemporaryLockSession = (
  current: SchoolTemporaryLockSession,
  controls: Record<string, StudentControl>,
  ids: string[],
  enabled: boolean,
): SchoolTemporaryLockSession => enabled
  ? current.active ? current : { active: true, dailySnapshot: Object.fromEntries(ids.map((id) => [id, controls[id].locked])) }
  : { active: false, dailySnapshot: {} };

export const temporaryLockedStudentIds = (locks: TemporaryLocks): Set<string> =>
  new Set(Object.values(locks).flatMap((scope) => scope.ids));

// 按当前班级重新计算；新增和转班学生无需存在于开启前的学生名单中。
export const inheritTemporaryLocksByClass = (
  locks: TemporaryLocks,
  classes: TemporaryLockClassStates,
  students: { id: string; classId: string }[],
  defaultEnabled = false,
): TemporaryLocks => {
  const previous = temporaryLockedStudentIds(locks);
  const ids = students.filter((student) => classes[student.classId]?.enabled ?? (previous.has(student.id) || defaultEnabled)).map((student) => student.id);
  return ids.length ? { students: { key: 'students', label: '管理员临时锁屏', ids } } : {};
};

export const teacherMayModifyLock = (_session: SchoolTemporaryLockSession, locks: TemporaryLocks, ids: string[]) =>
  !ids.some((id) => temporaryLockedStudentIds(locks).has(id));

export const updateTemporaryLocks = (current: TemporaryLocks, scopes: TemporaryLockScope[], enabled: boolean): TemporaryLocks => {
  // 兼容旧的范围数据，但统一按学生保存；上级解除也清除范围内原先的下级锁屏。
  const ids = temporaryLockedStudentIds(current);
  scopes.forEach((scope) => scope.ids.forEach((id) => {
    if (enabled) ids.add(id);
    else ids.delete(id);
  }));
  return ids.size ? { students: { key: 'students', label: '管理员临时锁屏', ids: [...ids] } } : {};
};

// 临时限制只叠加到显示和执行结果，不改写老师原有的锁屏设置。
export const applyTemporaryLocks = (controls: Record<string, StudentControl>, locks: TemporaryLocks): Record<string, StudentControl> => {
  const lockedIds = temporaryLockedStudentIds(locks);
  return Object.fromEntries(Object.entries(controls).map(([id, control]) => [id,
    lockedIds.has(id) ? { ...control, locked: true } : control,
  ]));
};
