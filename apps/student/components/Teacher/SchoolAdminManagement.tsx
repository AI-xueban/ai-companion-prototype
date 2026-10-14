import React, { useEffect, useState } from 'react';
import { Building2, Download, Plus, Search, Upload, X } from 'lucide-react';
import { PORTAL_CLASSES, TEACHER_ROLE_OPTIONS, TEACHER_SUBJECT_OPTIONS, TeacherPortalUser } from './data/teacherAccess';
import { AccountImportDialog } from './AccountImportDialog';
import { ImportKind, ImportPerson } from './accountImport';
import { ManagementExportDialog } from './ManagementExportDialog';
import { ExportSheet } from './managementExport';

type View = 'school' | 'classes' | 'teachers' | 'students' | 'deleted-students';
type ChangeRecord = { action: string; operator: string; time: string; changes: { field: string; before: string; after: string }[] };
type Person = { name: string; account: string; className: string; role?: string; staffNumber?: string; subject?: string; homeroomClassName?: string; phoneVerificationStatus?: string; status?: string; operator: string; operatedAt: string; createdAt?: string; history?: ChangeRecord[] };
type DeletedStudent = { student: Person; deletedAt: string; deletedBy: string; source: '单独删除' | '删除班级' };
type ManagedClass = (typeof PORTAL_CLASSES)[number] & { classCode: string; homeroomTeacher: string; studentCount: number; sort: number; note: string; operator: string; operatedAt: string };

const SCHOOL = { name: '罗湖实验学校', code: 'LH-LHSY-001', district: '广东省 / 深圳市 / 罗湖区', address: '深圳市罗湖区校园路 1 号', phone: '0755-2580 0000' };
const SYSTEM_OPERATOR = '系统录入';
const SYSTEM_OPERATION_TIME = '2026-10-08 09:00';
const STUDENT_REGISTRY_KEY = 'ai-companion:teacher-student-registry:v1';
const SCHOOL_MANAGEMENT_KEY = 'ai-companion:teacher-school-management:v1';
const GRADE_LABELS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const classDisplayName = (value: string, grade: number) => `${GRADE_LABELS[grade]}年级${value.trim().replace(/^[一二三四五六七八九1-9]年级/, '')}`;
const INITIAL_STUDENTS: Person[] = [
  { name: '李明', account: '9080005', className: '七年级(2)班', operator: SYSTEM_OPERATOR, operatedAt: SYSTEM_OPERATION_TIME, createdAt: '2026-09-23 16:59:22' },
  { name: '张小花', account: '9080004', className: '七年级(2)班', operator: SYSTEM_OPERATOR, operatedAt: SYSTEM_OPERATION_TIME, createdAt: '2026-09-23 16:59:19' },
];

const readStudentRegistry = (schoolName: string): { active: Person[]; deleted: DeletedStudent[] } => {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDENT_REGISTRY_KEY) || 'null');
    if (saved?.schoolName === schoolName && Array.isArray(saved.active) && Array.isArray(saved.deleted)) {
      return { active: saved.active, deleted: saved.deleted };
    }
  } catch { /* Invalid demo data falls back to the initial roster. */ }
  return { active: INITIAL_STUDENTS, deleted: [] };
};
const readSchoolManagement = (schoolName: string): { classes?: ManagedClass[]; teachers?: Person[] } => {
  try {
    const saved = JSON.parse(localStorage.getItem(SCHOOL_MANAGEMENT_KEY) || 'null');
    if (saved?.schoolName === schoolName && Array.isArray(saved.classes) && Array.isArray(saved.teachers)) return saved;
  } catch { /* Invalid demo data falls back to the initial roster. */ }
  return {};
};

const formatOperationTime = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date());
const formatCreatedAt = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).format(new Date());

export const SchoolAdminManagement: React.FC<{ initialView: View; currentUser: TeacherPortalUser; onNavigate: (view: View) => void }> = ({ initialView, currentUser, onNavigate }) => {
  const [view, setView] = useState<View>(initialView);
  const [initialManagement] = useState(() => readSchoolManagement(currentUser.schoolName));
  const [classes, setClasses] = useState<ManagedClass[]>(initialManagement.classes ?? PORTAL_CLASSES.map((item, index) => ({
    ...item,
    classCode: `LH-${item.grade}${String(index + 1).padStart(2, '0')}`,
    homeroomTeacher: '-',
    studentCount: 0,
    sort: index + 1,
    note: '-',
    operator: SYSTEM_OPERATOR,
    operatedAt: SYSTEM_OPERATION_TIME,
  })));
  const [teachers, setTeachers] = useState<Person[]>(initialManagement.teachers ?? [
    { name: '张雨薇', account: '13800000000', className: '七年级(2)班', role: '教师', subject: '数学', phoneVerificationStatus: '未验证', status: '正常', operator: SYSTEM_OPERATOR, operatedAt: SYSTEM_OPERATION_TIME, createdAt: '2026-09-24 14:18:12' },
    { name: '李老师', account: '13800000001', className: '七年级(2)班', role: '班主任', subject: '语文', homeroomClassName: '七年级(2)班', phoneVerificationStatus: '未验证', status: '正常', operator: SYSTEM_OPERATOR, operatedAt: SYSTEM_OPERATION_TIME, createdAt: '2026-09-23 21:20:09' },
  ]);
  const [initialStudentRegistry] = useState(() => readStudentRegistry(currentUser.schoolName));
  const [students, setStudents] = useState<Person[]>(initialStudentRegistry.active);
  const [deletedStudents, setDeletedStudents] = useState<DeletedStudent[]>(initialStudentRegistry.deleted);
  useEffect(() => {
    localStorage.setItem(SCHOOL_MANAGEMENT_KEY, JSON.stringify({ schoolName: currentUser.schoolName, classes, teachers }));
  }, [currentUser.schoolName, classes, teachers]);
  const [deletedSearch, setDeletedSearch] = useState('');
  useEffect(() => {
    localStorage.setItem(STUDENT_REGISTRY_KEY, JSON.stringify({ schoolName: currentUser.schoolName, active: students, deleted: deletedStudents }));
  }, [currentUser.schoolName, students, deletedStudents]);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [modal, setModal] = useState(false);
  const [importKind, setImportKind] = useState<ImportKind | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [name, setName] = useState('');
  const [className, setClassName] = useState('七年级(2)班');
  const [grade, setGrade] = useState('7');
  const [classSort, setClassSort] = useState('1');
  const [classNote, setClassNote] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [staffNumber, setStaffNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [homeroomClassName, setHomeroomClassName] = useState('未分配');
  const [teacherRole, setTeacherRole] = useState('');
  const [error, setError] = useState('');
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingClass, setEditingClass] = useState<ManagedClass | null>(null);
  const [detail, setDetail] = useState<Person | null>(null);
  const [historyPerson, setHistoryPerson] = useState<Person | null>(null);
  const [assignment, setAssignment] = useState<Person | null>(null);
  const [bindingGrade, setBindingGrade] = useState('');
  const [homeroomTransfer, setHomeroomTransfer] = useState<{ classId: string; teacherAccount: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | ManagedClass | null>(null);
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  useEffect(() => setDeleteAcknowledged(false), [deleteTarget]);
  const [notice, setNotice] = useState('');
  const [undo, setUndo] = useState<Person | null>(null);
  useEffect(() => {
    setFilterGrade(''); setFilterClassId('');
    setHistoryPerson(null);
    setHomeroomTransfer(null);
    setView(initialView); setSearch(''); setDeletedSearch(''); setModal(false); setImportKind(null); setExportOpen(false); setDetail(null); setAssignment(null); setDeleteTarget(null); setError('');
  }, [initialView]);
  useEffect(() => {
    if (!modal && !importKind && !exportOpen && !detail && !historyPerson && !assignment && !deleteTarget && !homeroomTransfer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (homeroomTransfer) { setHomeroomTransfer(null); return; }
        setModal(false); setImportKind(null); setExportOpen(false); setDetail(null); setHistoryPerson(null); setAssignment(null); setDeleteTarget(null); setError('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, importKind, exportOpen, detail, historyPerson, assignment, deleteTarget, homeroomTransfer]);

  const titles: Record<View, string> = { school: '学校信息', classes: '班级管理', teachers: '教师账号', students: '学生账号', 'deleted-students': '已删除学生' };
  const people = view === 'teachers' ? teachers : students;
  const keyword = search.trim().toLocaleLowerCase();
  const matchesSearch = (value: string) => value.toLocaleLowerCase().includes(keyword);
  const availableClasses = classes.filter((item) => !filterGrade || String(item.grade) === filterGrade);
  useEffect(() => {
    if (filterClassId && !classes.some((item) => item.id === filterClassId && (!filterGrade || String(item.grade) === filterGrade))) setFilterClassId('');
  }, [classes, filterGrade, filterClassId]);
  const matchesClassFilter = (item: ManagedClass) => (!filterGrade || String(item.grade) === filterGrade) && (!filterClassId || item.id === filterClassId);
  const filteredClasses = classes.filter((item) => matchesClassFilter(item) && (
    matchesSearch(`${item.name} ${item.classCode}`) || students.some((student) => student.className === item.name && matchesSearch(`${student.name} ${student.account}`))
  )).sort((a, b) => a.sort - b.sort);
  const filteredPeople = people.filter((person) => {
    const assignedClasses = classes.filter((item) => [...person.className.split('、'), ...(person.homeroomClassName ?? '').split('、')].includes(item.name));
    return matchesSearch(`${person.name} ${person.account} ${person.className} ${person.homeroomClassName ?? ''} ${person.subject ?? ''}`) && (
      (!filterGrade && !filterClassId) || assignedClasses.some(matchesClassFilter)
    );
  });
  const filteredDeletedStudents = deletedStudents.filter((entry) => {
    const student = entry.student;
    const classItem = classes.find((item) => item.name === student.className);
    return `${student.name} ${student.account} ${student.className}`.toLocaleLowerCase().includes(deletedSearch.trim().toLocaleLowerCase())
      && (!filterGrade || String(classItem?.grade ?? '') === filterGrade)
      && (!filterClassId || classItem?.id === filterClassId);
  });
  const resetFilters = () => { if (view === 'deleted-students') setDeletedSearch(''); else setSearch(''); setFilterGrade(''); setFilterClassId(''); };
  const exportTitle = view === 'classes' ? '班级清单' : view === 'teachers' ? '教师清单' : view === 'students' ? '学生清单' : '学校信息';
  const exportFilterLabel = [search.trim() && `搜索：${search.trim()}`, filterGrade && `${filterGrade}年级`, filterClassId && classes.find((item) => item.id === filterClassId)?.name].filter(Boolean).join('；');
  const getExportSheets = (all: boolean): ExportSheet[] => {
    if (view === 'school') return [{ name: '学校信息', headers: ['字段', '信息'], rows: [['学校名称', currentUser.schoolName], ['学校编码', SCHOOL.code], ['省市区', SCHOOL.district], ['学校地址', SCHOOL.address], ['联系电话', SCHOOL.phone], ['状态', '正常']] }];
    if (view === 'classes') {
      const list = all ? [...classes].sort((a, b) => a.sort - b.sort) : filteredClasses;
      const studentCounts = new Map<string, number>();
      students.forEach((person) => studentCounts.set(person.className, (studentCounts.get(person.className) ?? 0) + 1));
      const heads = new Map<string, string>();
      teachers.forEach((teacher) => teacher.homeroomClassName?.split('、').forEach((name) => heads.set(name, teacher.name)));
      return [{ name: '班级清单', headers: ['序号', '班级名称', '班级编码', '学校', '年级', '班主任', '学生人数', '排序', '备注', '操作人', '操作时间'], rows: list.map((item, i) => [i + 1, item.name, item.classCode, currentUser.schoolName, item.grade, heads.get(item.name) ?? '', studentCounts.get(item.name) ?? 0, item.sort, item.note === '-' ? '' : item.note, item.operator, item.operatedAt]) }];
    }
    const list = all ? people : filteredPeople;
    const grades = new Map(classes.map((item) => [item.name, item.grade]));
    const rows = list.map((person, i) => {
      const gradeNames = [...new Set([...person.className.split('、'), ...(person.homeroomClassName ?? '').split('、')].map((name) => grades.get(name)).filter(Boolean))].sort((a, b) => a! - b!).map((grade) => `${grade}年级`).join('、');
      return view === 'teachers' ? [i + 1, person.name, person.account, person.staffNumber ?? '', currentUser.schoolName, gradeNames, person.subject ?? '', person.role ?? '', person.className, person.homeroomClassName ?? '未分配', person.phoneVerificationStatus ?? '未验证', person.status ?? '正常', person.createdAt ?? '', person.operator, person.operatedAt] : [i + 1, person.name, person.account, currentUser.schoolName, gradeNames, person.className, person.status ?? '正常', person.createdAt ?? '', person.operator, person.operatedAt];
    });
    return [{ name: exportTitle, headers: view === 'teachers' ? ['序号', '教师姓名', '登录手机号', '教师工号', '学校', '年级', '任教学科', '教师角色', '任教班级', '班主任班级', '手机号验证状态', '状态', '创建时间', '操作人', '操作时间'] : ['序号', '学生姓名', '学号', '学校', '年级', '所属班级', '状态', '创建时间', '操作人', '操作时间'], rows }, { name: '修改记录', headers: ['姓名', view === 'teachers' ? '登录手机号' : '学号', '操作类型', '变更字段', '修改前', '修改后', '操作人', '操作时间'], rows: list.flatMap((person) => (person.history ?? []).flatMap((record) => record.changes.map((change) => [person.name, person.account, record.action, change.field, change.before, change.after, record.operator, record.time]))) }];
  };
  const operatorLabel = currentUser.name;
  const homeroomOwner = (className: string) => teachers.find((teacher) => teacher.homeroomClassName?.split('、').includes(className));
  const recordChange = (before: Person, patch: Partial<Person>, action: string): Person => {
    const after = { ...before, ...patch };
    const fields: [keyof Person, string][] = [['name', '姓名'], ['account', '账号'], ['className', before.role ? '任教班级' : '所属班级'], ['homeroomClassName', '班主任班级'], ['staffNumber', '教师工号'], ['subject', '任教学科'], ['role', '教师角色'], ['phoneVerificationStatus', '手机号验证状态']];
    const changes = fields.filter(([key]) => (before[key] ?? '') !== (after[key] ?? '')).map(([key, field]) => ({ field, before: String(before[key] || '未填写'), after: String(after[key] || '未填写') }));
    if (!changes.length) return before;
    return { ...after, operator: operatorLabel, operatedAt: formatOperationTime(), history: [{ action, operator: operatorLabel, time: formatCreatedAt(), changes }, ...(before.history ?? [])] };
  };

  const closeModal = () => {
    setModal(false);
    setEditingPerson(null);
    setEditingClass(null);
    setError('');
  };

  const submit = () => {
    if (!name.trim()) { setError('请填写名称'); return; }
    if (view === 'classes' && !name.trim().replace(/^[一二三四五六七八九1-9]年级/, '').trim()) { setError('请填写年级后的班级名称，例如：(3)班'); return; }
    if (view === 'students' && !classes.some((item) => item.name === className)) { setError('请选择现有班级；如无班级，请先创建班级'); return; }
    if (view === 'teachers') {
      if (!/^1[3-9]\d{9}$/.test(loginPhone.trim())) { setError('请输入有效的11位登录手机号'); return; }
      if (teachers.some((teacher) => teacher.account === loginPhone.trim() && teacher.account !== editingPerson?.account)) { setError('该登录手机号已存在'); return; }
      if (!subject) { setError('请选择任教学科'); return; }
      const occupiedClass = homeroomClassName.split('、').find((name) => teachers.some((teacher) => teacher.account !== editingPerson?.account && teacher.homeroomClassName?.split('、').includes(name)));
      if (occupiedClass) { setError(`${occupiedClass}已有班主任，请在班级绑定中更换班主任`); return; }
      if (!teacherRole) { setError('请选择教师角色'); return; }
      if (editingPerson && (className !== editingPerson.className || homeroomClassName !== (editingPerson.homeroomClassName ?? '未分配'))) { setError('任教和班主任关系请在“班级绑定”中调整'); return; }
      if (editingPerson && teacherRole !== '班主任' && editingPerson.homeroomClassName && editingPerson.homeroomClassName !== '未分配') { setError('请先在“班级绑定”中解绑班主任班级，再修改角色'); return; }
    }
    const operatedAt = formatOperationTime();
    const createdAt = formatCreatedAt();
    if (editingClass) {
      if (!Number.isInteger(Number(classSort)) || Number(classSort) < 1) { setError('排序请填写大于0的整数'); return; }
      const renamed = classDisplayName(name, Number(grade));
      if (classes.some((item) => item.name === renamed && item.id !== editingClass.id)) { setError('班级名称已存在'); return; }
      const renamePerson = (person: Person) => recordChange(person, { className: person.className.split('、').map((item) => item === editingClass.name ? renamed : item).join('、'), ...(person.homeroomClassName ? { homeroomClassName: person.homeroomClassName.split('、').map((item) => item === editingClass.name ? renamed : item).join('、') } : {}) }, '班级更名');
      setClasses((items) => items.map((item) => item.id === editingClass.id ? { ...item, name: renamed, grade: Number(grade), sort: Number(classSort), note: classNote.trim() || '-', operator: operatorLabel, operatedAt } : item));
      setTeachers((items) => items.map(renamePerson));
      setStudents((items) => items.map(renamePerson));
      setDeletedStudents((items) => items.map((entry) => entry.student.className === editingClass.name ? { ...entry, student: { ...entry.student, className: renamed } } : entry));
      setUndo(null); setNotice('班级资料已更新'); closeModal(); return;
    }
    if (editingPerson) {
      const updatePerson = (item: Person) => item.account === editingPerson.account ? recordChange(item, {
        name: name.trim(), className,
        ...(view === 'teachers' ? { account: loginPhone.trim(), staffNumber: staffNumber.trim(), subject, homeroomClassName, role: teacherRole,
          phoneVerificationStatus: loginPhone.trim() === editingPerson.account ? item.phoneVerificationStatus : '未验证' } : {}),
      }, '编辑资料') : item;
      if (view === 'teachers') setTeachers((items) => items.map(updatePerson));
      else setStudents((items) => items.map(updatePerson));
      setUndo(null); setNotice('账号资料已更新'); closeModal(); return;
    }
    if (view === 'classes' && classes.some((item) => item.name === classDisplayName(name, Number(grade)))) { setError('班级名称已存在'); return; }
    if (view === 'classes') setClasses((items) => [...items, { id: `class-${Date.now()}`, name: classDisplayName(name, Number(grade)), grade: Number(grade), alertCount: 0, classCode: `LH-${grade}${String(Math.max(0, ...items.map((item) => item.sort)) + 1).padStart(2, '0')}`, homeroomTeacher: '-', studentCount: 0, sort: Math.max(0, ...items.map((item) => item.sort)) + 1, note: '-', operator: operatorLabel, operatedAt }]);
    if (view === 'teachers') setTeachers((items) => [...items, { name: name.trim(), account: loginPhone.trim(), className, role: teacherRole, staffNumber: staffNumber.trim(), subject, homeroomClassName: teacherRole === '班主任' ? homeroomClassName : '未分配', phoneVerificationStatus: '未验证', status: '正常', operator: operatorLabel, operatedAt, createdAt }]);
    if (view === 'students') {
      const used = new Set([...students.map((item) => item.account), ...deletedStudents.map((entry) => entry.student.account)]);
      let sequence = Date.now();
      while (used.has(`S${sequence}`)) sequence++;
      setStudents((items) => [...items, { name: name.trim(), account: `S${sequence}`, className, operator: operatorLabel, operatedAt, createdAt }]);
    }
    setName('');
    setUndo(null); setNotice('添加成功');
    closeModal();
  };

  const openModal = (isBatch: boolean) => {
    if (isBatch && (view === 'classes' || view === 'teachers' || view === 'students')) { setImportKind(view); return; }
    setEditingPerson(null);
    setEditingClass(null);
    setName('');
    setLoginPhone('');
    setStaffNumber('');
    setSubject('');
    setHomeroomClassName('未分配');
    setTeacherRole('');
    setClassName(classes[0]?.name ?? '未分配');
    setError('');
    setModal(true);
  };
  const importAccounts = (people: ImportPerson[]) => {
    let nextStudentNumber = Date.now();
    const studentAccounts = new Set([...students.map((student) => student.account), ...deletedStudents.map((entry) => entry.student.account)]);
    const imported: Person[] = people.map((person) => {
      let account = person.account;
      if (importKind === 'students') {
        while (studentAccounts.has(`S${nextStudentNumber}`)) nextStudentNumber++;
        account = `S${nextStudentNumber++}`;
        studentAccounts.add(account);
      }
      return { ...person, account, status: '正常', ...(importKind === 'teachers' ? { phoneVerificationStatus: '未验证' } : {}), operator: operatorLabel, operatedAt: formatOperationTime(), createdAt: formatCreatedAt() };
    });
    if (importKind === 'classes') {
      setClasses((items) => {
        let nextSort = Math.max(0, ...items.map((item) => item.sort), ...people.map((item) => item.sort ?? 0));
        return [...items, ...people.map((item, index) => ({ id: `class-${Date.now()}-${index}`, name: item.name, grade: item.grade!, alertCount: 0, classCode: `LH-${item.grade}${String(Math.max(0, ...items.map((existing) => existing.sort)) + index + 1).padStart(2, '0')}`, homeroomTeacher: '-', studentCount: 0, sort: item.sort ?? ++nextSort, note: item.note || '-', operator: operatorLabel, operatedAt: formatOperationTime() }))];
      });
    } else if (importKind === 'teachers') setTeachers((items) => [...items, ...imported]);
    else setStudents((items) => [...items, ...imported]);
    setSearch(''); setFilterGrade(''); setFilterClassId('');
    setUndo(null); setNotice(`成功导入 ${imported.length} ${importKind === 'classes' ? '个班级' : importKind === 'teachers' ? '位教师' : '位学生'}`); setImportKind(null);
  };

  const personAction = (action: string, person: Person) => {
    setError('');
    if (action === '查看') { setDetail(person); return; }
    if (action === '修改记录') { setHistoryPerson(person); return; }
    if (action === '删除') { setDeleteTarget(person); return; }
    if (action === '班级') { setAssignment(person); setNotice(''); setBindingGrade(''); return; }
    openModal(false); setEditingPerson(person);
    setName(person.name); setLoginPhone(person.account); setStaffNumber(person.staffNumber ?? '');
    setSubject(person.subject ?? (person.role === '数学教师' ? '数学' : person.role === '班主任' ? '语文' : ''));
    setTeacherRole(person.role === '数学教师' || person.role === '普通教师' ? '教师' : person.role ?? '教师'); setClassName(person.className); setHomeroomClassName(person.homeroomClassName ?? '未分配');
  };
  const editClass = (item: ManagedClass) => {
    openModal(false); setEditingClass(item); setName(item.name); setGrade(String(item.grade)); setClassSort(String(item.sort)); setClassNote(item.note === '-' ? '' : item.note);
  };
  const bindingTeacher = assignment ? teachers.find((person) => person.account === assignment.account) : null;
  const bindingClasses = classes.filter((item) => !bindingGrade || String(item.grade) === bindingGrade);
  const toggleClassBinding = (item: ManagedClass, kind: 'teaching' | 'homeroom' = 'teaching') => {
    if (!bindingTeacher) return;
    const field = kind === 'homeroom' ? 'homeroomClassName' : 'className';
    const currentClasses = bindingTeacher[field] ?? '未分配';
    const boundClasses = currentClasses === '未分配' ? [] : currentClasses.split('、');
    const isBound = boundClasses.includes(item.name);
    if (kind === 'homeroom' && !isBound && homeroomOwner(item.name)) {
      setHomeroomTransfer({ classId: item.id, teacherAccount: bindingTeacher.account }); return;
    }
    const nextClasses = isBound ? boundClasses.filter((name) => name !== item.name) : [...boundClasses, item.name];
    const updated = recordChange(bindingTeacher, { [field]: nextClasses.join('、') || '未分配' }, (kind === 'homeroom' ? '班主任' : '任教') + (isBound ? '解绑班级' : '绑定班级'));
    setTeachers((items) => items.map((person) => person.account === bindingTeacher.account ? updated : person));
    setUndo(null);
    setNotice('');
  };
  const transferClass = homeroomTransfer ? classes.find((item) => item.id === homeroomTransfer.classId) : null;
  const transferTeacher = homeroomTransfer ? teachers.find((teacher) => teacher.account === homeroomTransfer.teacherAccount) : null;
  const previousHomeroomTeacher = transferClass ? homeroomOwner(transferClass.name) : null;
  const confirmHomeroomTransfer = () => {
    if (!transferClass || !transferTeacher) { setHomeroomTransfer(null); return; }
    setTeachers((items) => items.map((teacher) => {
      const names = (teacher.homeroomClassName ?? '').split('、').filter((name) => name && name !== '未分配');
      if (teacher.account === transferTeacher.account) return recordChange(teacher, { homeroomClassName: [...new Set([...names, transferClass.name])].join('、') }, '更换班主任');
      if (names.includes(transferClass.name)) return recordChange(teacher, { homeroomClassName: names.filter((name) => name !== transferClass.name).join('、') || '未分配' }, '更换班主任解除关联');
      return teacher;
    }));
    setNotice(''); setUndo(null); setHomeroomTransfer(null);
  };
  const archiveStudent = (student: Person, source: DeletedStudent['source']): DeletedStudent => {
    const deletedAt = formatCreatedAt();
    return {
      student: { ...student, status: '已删除', history: [{ action: source, operator: operatorLabel, time: deletedAt, changes: [{ field: '账号状态', before: student.status ?? '正常', after: '已删除' }] }, ...(student.history ?? [])] },
      deletedAt, deletedBy: operatorLabel, source,
    };
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if ('id' in deleteTarget) {
      const target = deleteTarget;
      if (!deleteAcknowledged) { setError('请先确认已了解删除影响'); return; }
      const removedStudents = students.filter((person) => person.className === target.name);
      const studentCount = removedStudents.length;
      setClasses((items) => items.filter((item) => item.id !== target.id));
      setStudents((items) => items.filter((person) => person.className !== target.name));
      setDeletedStudents((items) => [...removedStudents.map((student) => archiveStudent(student, '删除班级')), ...items]);
      setTeachers((items) => items.map((person) => recordChange(person, { className: person.className.split('、').filter((name) => name !== target.name).join('、') || '未分配', homeroomClassName: (person.homeroomClassName ?? '').split('、').filter((name) => name && name !== target.name).join('、') || '未分配' }, '删除班级解除关联')));
      setUndo(null); setDeleteTarget(null); setError('');
      setNotice(studentCount ? `已删除班级及${studentCount}位学生账号。请先重新创建班级，再从“已删除学生”中恢复账号。` : '已删除班级，如需恢复请重新创建。');
      return;
    } else if (view === 'students') {
      if (!deleteAcknowledged) { setError('请先确认已了解删除影响'); return; }
      const target = deleteTarget;
      setStudents((items) => items.filter((item) => item.account !== target.account));
      setDeletedStudents((items) => [archiveStudent(target, '单独删除'), ...items]);
      setDeleteTarget(null); setUndo(null); setNotice(`已删除学生“${target.name}”。该账号已停用，不能登录或借用平板；可在“已删除学生”中恢复。`); setError('');
      return;
    } else {
      const target = deleteTarget;
      setTeachers((items) => items.filter((item) => item.account !== target.account));
      setUndo(target);
    }
    setDeleteTarget(null); setNotice('已删除，可撤销本次删除'); setError('');
  };
  const restoreTeacher = () => {
    if (!undo) return;
    if (teachers.some((person) => person.account === undo.account)) { setNotice('该登录手机号已被使用，无法撤销删除'); setUndo(null); return; }
    const originalClasses = (undo.homeroomClassName ?? '').split('、').filter((name) => name && name !== '未分配');
    const available = originalClasses.filter((name) => classes.some((item) => item.name === name) && !homeroomOwner(name));
    setTeachers((items) => [...items, { ...undo, className: undo.className.split('、').filter((name) => classes.some((item) => item.name === name)).join('、') || '未分配', homeroomClassName: available.join('、') || '未分配' }]);
    setNotice(available.length === originalClasses.length ? '已撤销删除，教师账号及原班级关系已恢复' : '已恢复教师账号；部分班主任班级已被占用或删除，请重新绑定');
    setUndo(null);
  };
  const restoreStudent = (entry: DeletedStudent) => {
    if (!classes.some((item) => item.name === entry.student.className)) {
      setError(`原班级“${entry.student.className}”已不存在，请先恢复或创建班级，再恢复学生。`);
      return;
    }
    if (students.some((item) => item.account === entry.student.account)) {
      setError(`学号 ${entry.student.account} 已被使用，无法恢复。`);
      return;
    }
    const restored: Person = {
      ...entry.student, status: '正常', operator: operatorLabel, operatedAt: formatOperationTime(),
      history: [{ action: '恢复学生账号', operator: operatorLabel, time: formatCreatedAt(), changes: [{ field: '账号状态', before: '已删除', after: '正常' }] }, ...(entry.student.history ?? [])],
    };
    setStudents((items) => [...items, restored]);
    setDeletedStudents((items) => items.filter((item) => item.student.account !== entry.student.account));
    setError(''); setNotice(`已恢复学生“${entry.student.name}”，账号可再次使用并借用平板。`);
  };
  const deletingClass = deleteTarget && 'id' in deleteTarget ? deleteTarget : null;
  const deletingStudentCount = deletingClass ? students.filter((person) => person.className === deletingClass.name).length : 0;
  const modalTitle = editingClass ? '编辑班级' : editingPerson ? (view === 'teachers' ? '编辑教师' : '编辑学生') : view === 'classes' ? '添加班级' : view === 'teachers' ? '新增教师' : '新增学生';
  const overlay = (title: string, content: React.ReactNode, footer: React.ReactNode, close: () => void) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button aria-label="关闭" onClick={close}><X size={18}/></button></div>{content}{footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}</section></div>;

  return <div className="h-full flex bg-[#f5f7fa] text-slate-800">
    <main className="min-w-0 flex-1 overflow-y-auto p-7">
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">教师端 / 学校账号信息管理 / {titles[view]}</div>
            <h1 className="mt-2 text-2xl font-bold">{titles[view]}</h1>
          </div>
          {(view === 'classes' || view === 'teachers' || view === 'students') && <div className="flex flex-wrap justify-end gap-2"><button onClick={() => setExportOpen(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-blue-300"><Download size={16}/>下载{exportTitle}</button>
            {(view === 'classes' || view === 'teachers' || view === 'students') && <button onClick={() => openModal(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-blue-300"><Upload size={16}/>批量导入</button>}
            {(view === 'classes' || view === 'teachers' || view === 'students') && <button onClick={() => openModal(false)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16}/>{view === 'classes' ? '添加班级' : view === 'teachers' ? '新增教师' : '新增学生'}</button>}
          </div>}
        </div>
        {(view === 'students' || view === 'deleted-students') && <div className="mt-4 flex gap-6 border-b border-slate-200"><button type="button" aria-current={view === 'students' ? 'page' : undefined} onClick={() => { setView('students'); setError(''); }} className={`border-b-2 px-1 pb-2 text-sm font-semibold ${view === 'students' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>在校学生</button><button type="button" aria-current={view === 'deleted-students' ? 'page' : undefined} onClick={() => { setView('deleted-students'); setDeletedSearch(''); setFilterGrade(''); setFilterClassId(''); setError(''); }} className={`border-b-2 px-1 pb-2 text-sm font-semibold ${view === 'deleted-students' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>已删除学生 <span className="ml-1 text-xs text-slate-400">{deletedStudents.length}</span></button></div>}
      </div>

      {view === 'school' ? <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Building2/></div><div><h2 className="text-lg font-bold">{currentUser.schoolName}</h2></div><span className="ml-auto rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">正常</span></div>
        <div className="grid gap-5 pt-5 sm:grid-cols-2">{[['学校编码', SCHOOL.code], ['省市区', SCHOOL.district], ['学校地址', SCHOOL.address], ['联系电话', SCHOOL.phone]].map(([label, value]) => <div key={label}><div className="text-xs text-slate-400">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>)}</div>
      </section> : <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input aria-label={view === 'teachers' ? '搜索教师' : view === 'deleted-students' ? '搜索已删除学生' : '搜索班级或学生'} value={view === 'deleted-students' ? deletedSearch : search} onChange={(event) => view === 'deleted-students' ? setDeletedSearch(event.target.value) : setSearch(event.target.value)} placeholder={view === 'teachers' ? '搜索教师姓名或登录手机号' : view === 'deleted-students' ? '搜索学生姓名、学号或原班级' : '搜索班级、学生姓名或学号'} className="w-64 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"/></div>
          <label className="flex items-center gap-2 text-sm text-slate-500">年级<select aria-label="筛选年级" value={filterGrade} onChange={(event) => { setFilterGrade(event.target.value); setFilterClassId(''); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700"><option value="">全部年级</option>{[1,2,3,4,5,6,7,8,9].map((item) => <option key={item} value={item}>{item}年级</option>)}</select></label>
          {view !== 'teachers' && <label className="flex items-center gap-2 text-sm text-slate-500">班级<select aria-label="筛选班级" value={filterClassId} onChange={(event) => setFilterClassId(event.target.value)} className="max-w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700"><option value="">全部班级</option>{availableClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          <button onClick={resetFilters} disabled={!(view === 'deleted-students' ? deletedSearch : search) && !filterGrade && !filterClassId} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-blue-300 disabled:cursor-default disabled:opacity-40">重置</button>
          <span className="text-xs text-slate-400">共{view === 'classes' ? filteredClasses.length : view === 'deleted-students' ? filteredDeletedStudents.length : filteredPeople.length}{view === 'classes' ? '个班级' : view === 'teachers' ? '位教师' : '位学生'}</span>
          <span className="ml-auto text-xs text-slate-400">学校：{currentUser.schoolName}</span>
        </div>
        <div className="overflow-x-auto">
          {view === 'classes' ? <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['序号', '班级名称', '班级编码', '所属学校', '所属年级', '班主任', '学生人数', '排序', '备注', '操作人', '操作时间', '操作'].map((header) => <th key={header} className="px-4 py-3 text-left whitespace-nowrap">{header}</th>)}</tr></thead><tbody>{filteredClasses.map((item, index) => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-4">{index + 1}</td><td className="px-4 py-4 font-medium whitespace-nowrap">{item.name}</td><td className="px-4 py-4">{item.classCode}</td><td className="px-4 py-4 whitespace-nowrap">{currentUser.schoolName}</td><td className="px-4 py-4">{item.grade}年级</td><td className="px-4 py-4">{teachers.filter((person) => (person.homeroomClassName ?? '').split('、').includes(item.name)).map((person) => person.name).join('、') || '-'}</td><td className="px-4 py-4">{students.filter((person) => person.className === item.name).length}</td><td className="px-4 py-4">{item.sort}</td><td className="px-4 py-4">{item.note || '-'}</td><td className="px-4 py-4 text-slate-600 whitespace-nowrap">{item.operator}</td><td className="px-4 py-4 text-slate-600 whitespace-nowrap">{item.operatedAt}</td><td className="px-4 py-4 whitespace-nowrap"><button type="button" onClick={() => editClass(item)} className="mr-3 text-blue-600 hover:text-blue-700">编辑</button><button type="button" onClick={() => { setError(''); setDeleteTarget(item); }} className="text-red-500 hover:text-red-600">删除</button></td></tr>)}</tbody></table>
            : view === 'deleted-students' ? <table className="w-full min-w-[1050px] text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['序号', '学生姓名', '学号', '原班级', '删除时间', '删除操作人', '删除来源', '操作'].map((header) => <th key={header} className="px-5 py-3 text-left whitespace-nowrap">{header}</th>)}</tr></thead><tbody>{filteredDeletedStudents.map((entry, index) => <tr key={entry.student.account} className="border-t border-slate-100"><td className="px-5 py-4">{index + 1}</td><td className="px-5 py-4 font-medium">{entry.student.name}</td><td className="px-5 py-4">{entry.student.account}</td><td className="px-5 py-4">{entry.student.className}</td><td className="px-5 py-4">{entry.deletedAt}</td><td className="px-5 py-4">{entry.deletedBy}</td><td className="px-5 py-4">{entry.source}</td><td className="px-5 py-4 whitespace-nowrap"><button type="button" onClick={() => { setError(''); setHistoryPerson(entry.student); }} className="mr-3 text-blue-600 hover:text-blue-700">查看历史</button><button type="button" onClick={() => restoreStudent(entry)} className="text-blue-600 hover:text-blue-700">恢复</button></td></tr>)}</tbody></table>
            : <table className={view === 'teachers' ? 'w-full min-w-[1400px] text-sm' : 'w-full text-sm'}><thead className="bg-slate-50 text-slate-500"><tr>{['序号', view === 'teachers' ? '教师姓名' : '学生姓名', view === 'teachers' ? '登录名（手机号）' : '学号', '学校', ...(view === 'teachers' ? ['任教班级', '班主任班级', '任教学科', '教师角色', '手机号验证状态'] : ['班级', '创建时间']), '操作人', '操作时间', '状态', '操作'].map((header) => <th key={header} className="px-5 py-3 text-left">{header}</th>)}</tr></thead><tbody>{filteredPeople.map((person, index) => <tr key={`${person.account}-${index}`} className="border-t border-slate-100"><td className="px-5 py-4">{index + 1}</td><td className="px-5 py-4 font-medium">{person.name}</td><td className="px-5 py-4">{person.account}</td><td className="px-5 py-4">{currentUser.schoolName}</td><td className="px-5 py-4">{person.className}</td>{view === 'teachers' ? <><td className="px-5 py-4">{person.homeroomClassName || '未分配'}</td><td className="px-5 py-4">{person.subject || '未设置'}</td><td className="px-5 py-4">{person.role}</td><td className="px-5 py-4"><span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">{person.phoneVerificationStatus}</span></td></> : <td className="px-5 py-4">{person.createdAt}</td>}<td className="px-5 py-4 text-slate-600">{person.operator}</td><td className="px-5 py-4 text-slate-600">{person.operatedAt}</td><td className="px-5 py-4"><span className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">{person.status ?? '正常'}</span></td><td className="px-5 py-4 whitespace-nowrap">{(view === 'teachers' ? ['查看', '编辑', '班级', '删除'] : ['修改记录', '编辑', '删除']).map((action) => <button key={action} type="button" onClick={() => personAction(action, person)} className={`mr-2 last:mr-0 ${action === '删除' ? 'text-red-500 hover:text-red-600' : 'text-blue-600 hover:text-blue-700'}`}>{action}</button>)}</td></tr>)}</tbody></table>}
        </div>
        {error && view === 'deleted-students' && <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {(view === 'classes' ? filteredClasses.length === 0 : view === 'deleted-students' ? filteredDeletedStudents.length === 0 : filteredPeople.length === 0) && <div className="p-12 text-center text-sm text-slate-400">{view === 'deleted-students' ? deletedStudents.length ? '暂无匹配的删除记录' : '暂无已删除学生' : '暂无匹配数据'}</div>}
      </section>}
       {notice && <div role="status" className="mt-4 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">{notice}{undo && <button className="font-bold underline" onClick={restoreTeacher}>撤销删除</button>}<button aria-label="关闭提示" className="ml-auto" onClick={() => { setNotice(''); setUndo(null); }}><X size={16}/></button></div>}
    </main>
    {exportOpen && <ManagementExportDialog title={exportTitle} school={currentUser.schoolName} filterLabel={exportFilterLabel} getSheets={getExportSheets} onClose={() => setExportOpen(false)} onSuccess={(count) => { setExportOpen(false); setNotice(`已生成${exportTitle}，共 ${count} 条`); setUndo(null); }}/ >}

    {importKind && <AccountImportDialog kind={importKind} school={currentUser.schoolName} classes={classes} existing={importKind === 'teachers' ? teachers : importKind === 'students' ? students : []} onClose={() => setImportKind(null)} onImport={importAccounts} onCreateClasses={() => { setImportKind(null); onNavigate('classes'); }}/>}
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><section role="dialog" aria-modal="true" aria-label={modalTitle} className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-2xl ${view === 'teachers' ? 'max-w-2xl' : 'max-w-lg'}`}>
      <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{modalTitle}</h2><button aria-label="关闭" onClick={closeModal}><X size={18}/></button></div>
      <div className="space-y-4">
        {view === 'classes' ? <>
          <label className="block text-sm">所属学校<input value={currentUser.schoolName} readOnly className="mt-1 w-full rounded-lg border bg-slate-100 px-3 py-2 text-slate-500"/></label>
          <label className="block text-sm">所属年级<select value={grade} onChange={(event) => setGrade(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">{[1,2,3,4,5,6,7,8,9].map((item) => <option key={item} value={item}>{item}年级</option>)}</select></label>
           <label className="block text-sm">班级名称<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：(3)班" className="mt-1 w-full rounded-lg border px-3 py-2"/><span className="mt-1 block text-xs text-slate-500">保存时按所选年级生成完整班级名称；修改年级时同步更新名称。</span></label>
          {editingClass && <><label className="block text-sm">班级编码<input value={editingClass.classCode} readOnly className="mt-1 w-full rounded-lg border bg-slate-100 px-3 py-2 text-slate-500"/></label><label className="block text-sm">排序<input type="number" min="1" step="1" value={classSort} onChange={(event) => setClassSort(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label><label className="block text-sm">备注<textarea value={classNote} onChange={(event) => setClassNote(event.target.value)} rows={2} placeholder="请输入备注（选填）" className="mt-1 w-full rounded-lg border px-3 py-2"/></label></>}
        </> : view === 'teachers' ? <>
           <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">{editingPerson ? '修改登录手机号后，手机号验证状态将恢复为未验证；班级关系请在“班级绑定”中调整' : '演示原型仅新增名单，不开通真实登录账号；初始密码与验证流程由正式账号体系确定'}</div>
          <label className="grid items-center gap-2 text-sm sm:grid-cols-[140px_1fr]"><span>学校</span><input value={currentUser.schoolName} readOnly className="w-full rounded-lg border bg-slate-100 px-3 py-2 text-slate-500"/></label>
          <label className="grid items-center gap-2 text-sm sm:grid-cols-[140px_1fr]"><span><span className="text-red-500">* </span>登录名（手机号）</span><input value={loginPhone} onChange={(event) => setLoginPhone(event.target.value)} type="tel" inputMode="numeric" maxLength={11} autoComplete="off" aria-required="true" placeholder="请输入11位手机号作为登录名" className="w-full rounded-lg border px-3 py-2"/></label>
          <label className="grid items-center gap-2 text-sm sm:grid-cols-[140px_1fr]"><span><span className="text-red-500">* </span>教师姓名</span><input value={name} onChange={(event) => setName(event.target.value)} aria-required="true" placeholder="请输入教师姓名" className="w-full rounded-lg border px-3 py-2"/></label>
          <label className="grid items-center gap-2 text-sm sm:grid-cols-[140px_1fr]"><span>教师工号</span><input value={staffNumber} onChange={(event) => setStaffNumber(event.target.value)} placeholder="请输入教师工号（选填）" className="w-full rounded-lg border px-3 py-2"/></label>
          <div className="grid items-start gap-2 text-sm sm:grid-cols-[140px_1fr]"><span className="pt-2"><span className="text-red-500">* </span>任教学科</span><fieldset aria-label="任教学科" className="rounded-lg border p-3"><legend className="sr-only">任教学科（可多选）</legend><div className="grid grid-cols-3 gap-3">{TEACHER_SUBJECT_OPTIONS.map((item) => <label key={item} className="flex items-center gap-2"><input type="checkbox" checked={subject.split('、').includes(item)} onChange={(event) => setSubject((current) => (event.target.checked ? [...current.split('、').filter(Boolean), item] : current.split('、').filter((value) => value !== item)).join('、'))}/>{item}</label>)}</div><p className="mt-3 text-xs text-slate-400">可选择多门任教学科</p></fieldset></div>
          <label className="grid items-center gap-2 text-sm sm:grid-cols-[140px_1fr]"><span><span className="text-red-500">* </span>教师角色</span><select value={teacherRole} onChange={(event) => { setTeacherRole(event.target.value); if (!editingPerson && event.target.value !== '班主任') setHomeroomClassName('未分配'); }} aria-required="true" className="w-full rounded-lg border px-3 py-2"><option value="" disabled>请选择教师角色</option>{TEACHER_ROLE_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid items-center gap-2 text-sm sm:grid-cols-[140px_1fr]"><span>任教班级</span><select value={className} disabled={!!editingPerson} onChange={(event) => setClassName(event.target.value)} className="w-full rounded-lg border px-3 py-2 disabled:bg-slate-100">{className.includes('、') && <option>{className}</option>}{classes.map((item) => <option key={item.id}>{item.name}</option>)}<option value="未分配">未分配（尽量不要选择）</option></select></label>
          {(!!editingPerson || teacherRole === '班主任') && <label className="grid items-center gap-2 text-sm sm:grid-cols-[140px_1fr]"><span>班主任班级</span><select value={homeroomClassName} disabled={!!editingPerson} onChange={(event) => setHomeroomClassName(event.target.value)} className="w-full rounded-lg border px-3 py-2 disabled:bg-slate-100">{homeroomClassName.includes('、') && <option>{homeroomClassName}</option>}{classes.map((item) => { const owner = homeroomOwner(item.name); const occupied = !!owner && owner.account !== editingPerson?.account; return <option key={item.id} value={item.name} disabled={occupied}>{item.name}{occupied ? '（班主任：' + owner.name + '）' : ''}</option>; })}<option value="未分配">未分配</option></select><span className="text-xs text-slate-400 sm:col-start-2">{editingPerson ? '编辑账号资料时不调整班级关系，请在列表“班级”中绑定或解绑。' : '每班仅限一位班主任，已有班主任的班级请在“班级绑定”中更换。'}</span></label>}
        </> : <>
          <label className="block text-sm">学校<input value={currentUser.schoolName} readOnly className="mt-1 w-full rounded-lg border bg-slate-100 px-3 py-2 text-slate-500"/></label>
          <label className="block text-sm">学生姓名<input value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入姓名" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
           <label className="block text-sm">所属班级<select value={classes.some((item) => item.name === className) ? className : ''} onChange={(event) => setClassName(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="" disabled>请选择现有班级</option>{classes.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
           {!classes.length && <button type="button" className="text-sm font-medium text-blue-600" onClick={() => { closeModal(); onNavigate('classes'); }}>暂无班级，去创建班级</button>}
        </>}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-2"><button onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm">取消</button><button onClick={submit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">{editingPerson || editingClass ? '保存' : '添加'}</button></div>
    </section></div>}
    {detail && overlay(view === 'teachers' ? '教师详情' : '学生详情', <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-4 text-sm">{[
      ['学校', currentUser.schoolName], [view === 'teachers' ? '教师姓名' : '学生姓名', detail.name], [view === 'teachers' ? '登录名（手机号）' : '学号', detail.account],
      ...(view === 'teachers' ? [['教师工号', detail.staffNumber || '未填写'], ['任教学科', detail.subject || (detail.role === '数学教师' ? '数学' : detail.role === '班主任' ? '语文' : '未设置')], ['教师角色', detail.role || '教师'], ['手机号验证状态', detail.phoneVerificationStatus || '未验证']] : []),
      [view === 'teachers' ? '任教班级' : '所属班级', detail.className || '未分配'], ...(view === 'teachers' ? [['班主任班级', detail.homeroomClassName || '未分配']] : []), ['状态', detail.status || '正常'], ['创建时间', detail.createdAt || '-'], ['操作人', detail.operator], ['操作时间', detail.operatedAt],
    ].map(([label, value]) => <React.Fragment key={label}><dt className="text-slate-500">{label}</dt><dd className="break-words">{value}</dd></React.Fragment>)}</dl>, <><button className="rounded-lg border px-4 py-2 text-sm" onClick={() => { setHistoryPerson(detail); setDetail(null); }}>修改记录</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white" onClick={() => { personAction('编辑', detail); setDetail(null); }}>编辑资料</button></>, () => setDetail(null))}
    {historyPerson && overlay(historyPerson.status === '已删除' ? '学生历史记录' : '修改记录', <div className="space-y-4"><div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium">{historyPerson.name} · {historyPerson.account}</div>{historyPerson.history?.length ? <div className="space-y-4">{historyPerson.history.map((record, index) => <section key={index} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-bold text-slate-700">{record.action}</span><span className="text-xs text-slate-400">{record.time}</span></div><p className="mt-2 text-xs text-slate-500">操作人：{record.operator}</p><table className="mt-3 w-full table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="w-1/4 p-2">修改项</th><th className="p-2">修改前</th><th className="p-2">修改后</th></tr></thead><tbody>{record.changes.map((change) => <tr key={change.field} className="border-t border-slate-100"><td className="p-2 align-top">{change.field}</td><td className="break-words p-2 align-top text-slate-500">{change.before}</td><td className="break-words p-2 align-top text-blue-700">{change.after}</td></tr>)}</tbody></table></section>)}</div> : <div className="py-10 text-center"><p className="text-sm text-slate-500">暂无修改记录</p><p className="mt-2 text-xs text-slate-400">修改姓名、所属班级等资料后，会在这里记录修改前后的内容。</p></div>}</div>, null, () => setHistoryPerson(null))}
    {assignment && !homeroomTransfer && overlay('班级绑定', <div className="space-y-4"><div className="rounded-lg bg-slate-50 p-3 text-sm">{assignment.name} · {assignment.account}</div><p className="text-sm text-slate-500">任教可绑定多位教师，每班仅限一位班主任。已有班主任时需确认更换。</p><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm text-slate-600">年级<select aria-label="绑定班级年级筛选" value={bindingGrade} onChange={(event) => { setBindingGrade(event.target.value);  }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700"><option value="">全部年级</option>{[1,2,3,4,5,6,7,8,9].map((item) => <option key={item} value={item}>{item}年级</option>)}</select></label><span className="text-xs text-slate-400">共{bindingClasses.length}个班级</span></div><div className="space-y-2">{bindingClasses.map((item) => {
      return <section key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm"><h3 className="mb-3 font-medium">{item.name}</h3><div className="space-y-2">{(['teaching', 'homeroom'] as const).map((kind) => {
        const isBound = (kind === 'teaching' ? bindingTeacher?.className : bindingTeacher?.homeroomClassName)?.split('、').includes(item.name) ?? false;
        const label = kind === 'teaching' ? '任教' : '班主任';
        const owner = kind === 'homeroom' ? homeroomOwner(item.name) : null;
        const replacing = !!owner && !isBound;
        const actionLabel = isBound ? '解绑' : replacing ? '更换班主任' : '绑定';
        return <div key={kind} className="flex items-center gap-3"><span className="flex-1 text-slate-500">{label}</span><span className={isBound ? 'text-xs text-green-600' : 'text-xs text-slate-400'}>{owner ? '班主任：' + owner.name : isBound ? '已绑定' : '未绑定'}</span><button type="button" aria-label={item.name + label + actionLabel} onClick={() => toggleClassBinding(item, kind)} className={isBound ? 'rounded-lg border border-red-200 px-4 py-1.5 text-red-500 hover:bg-red-50' : 'rounded-lg bg-blue-600 px-4 py-1.5 font-bold text-white hover:bg-blue-700'}>{actionLabel}</button></div>;
      })}</div></section>;
    })}</div>{!bindingClasses.length && <p className="py-6 text-center text-sm text-slate-400">{bindingGrade ? '该年级暂无班级，请先在班级管理中添加' : '暂无班级，请先在班级管理中添加'}</p>}</div>, null, () => setAssignment(null))}
    {deleteTarget && overlay(deletingClass ? '删除班级' : view === 'students' ? '删除学生' : '确认删除', <div className="space-y-4 text-sm"><p>确定删除“{deleteTarget.name}”吗？</p>{deletingClass ? <><div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800"><p className="font-bold">请谨慎操作</p><p>{deletingStudentCount ? '该班级当前有' + deletingStudentCount + '位学生。删除班级将同时移除这些学生账号，删除后如需恢复学生账号，请先重新创建该班级，再到“已删除学生”中恢复。' : '删除后无法撤销，如需恢复请重新创建班级。'}</p><p>教师账号保留，仅解除与该班级的关联。</p></div><p className="text-slate-500">如需调整班级资料，可选择“修改班级”。</p><label className="flex items-start gap-2 text-slate-600"><input type="checkbox" checked={deleteAcknowledged} onChange={(event) => { setDeleteAcknowledged(event.target.checked); setError(''); }} className="mt-1"/><span>我已了解删除影响，并知晓班级删除后需先重建班级才能恢复学生</span></label></> : view === 'students' ? <><div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800"><p className="font-bold">请谨慎操作</p><p>删除该学生后，学生无法使用该账号，也无法借用平板。删除记录会保留，可在“已删除学生”中恢复。</p></div><label className="flex items-start gap-2 text-slate-600"><input type="checkbox" checked={deleteAcknowledged} onChange={(event) => { setDeleteAcknowledged(event.target.checked); setError(''); }} className="mt-1"/><span>我已了解删除影响，确认停用该学生账号</span></label></> : <><div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800"><p className="font-bold">请谨慎操作</p><p>删除该教师账号后，该教师将无法登录，也无法使用通晤纪产品中的各项功能。如需恢复账号，可通过删除后的提示点击“撤销删除”。</p></div></>}{error && <p role="alert" className="text-red-500">{error}</p>}</div>, <><button className="rounded-lg border px-4 py-2 text-sm" onClick={() => { setDeleteTarget(null); setError(''); }}>取消</button>{deletingClass && <button className="rounded-lg border border-blue-200 px-4 py-2 text-sm text-blue-600" onClick={() => { editClass(deletingClass); setDeleteTarget(null); }}>修改班级</button>}<button disabled={(!!deletingClass || view === 'students') && !deleteAcknowledged} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" onClick={confirmDelete}>确认删除</button></>, () => { setDeleteTarget(null); setError(''); })}
    {homeroomTransfer && transferClass && transferTeacher && overlay('更换班主任', <div className="space-y-4 text-sm"><p className="font-medium">{transferClass.name}</p><div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800"><p>该班级已有班主任：{previousHomeroomTeacher?.name || '未分配'}。</p><p className="mt-2">确定更换为{transferTeacher.name}吗？确认后会解除原班主任与该班级的关联，并绑定新班主任。任教班级保持不变。</p></div></div>, <><button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setHomeroomTransfer(null)}>取消</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white" onClick={confirmHomeroomTransfer}>确认更换</button></>, () => setHomeroomTransfer(null))}
  </div>;
};
