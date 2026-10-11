import React, { useEffect, useState } from 'react';
import { Building2, Plus, Search, Upload, X } from 'lucide-react';
import { PORTAL_CLASSES, TeacherPortalUser } from './data/teacherAccess';

type View = 'school' | 'classes' | 'teachers' | 'students';
type Person = { name: string; account: string; className: string; role?: string; phoneVerificationStatus?: string; status?: string; operator: string; operatedAt: string; createdAt?: string };
type ManagedClass = (typeof PORTAL_CLASSES)[number] & { classCode: string; homeroomTeacher: string; studentCount: number; sort: number; note: string; operator: string; operatedAt: string };

const SCHOOL = { name: '罗湖实验学校', code: 'LH-LHSY-001', district: '广东省 / 深圳市 / 罗湖区', address: '深圳市罗湖区校园路 1 号', phone: '0755-2580 0000' };
const SYSTEM_OPERATOR = '系统管理员（系统初始化）';
const SYSTEM_OPERATION_TIME = '2026-10-08 09:00';

const formatOperationTime = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date());
const formatCreatedAt = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).format(new Date());

export const SchoolAdminManagement: React.FC<{ initialView: View; currentUser: TeacherPortalUser }> = ({ initialView, currentUser }) => {
  const [view, setView] = useState<View>(initialView);
  const [classes, setClasses] = useState<ManagedClass[]>(PORTAL_CLASSES.map((item, index) => ({
    ...item,
    classCode: `LH-${item.grade}${String(index + 1).padStart(2, '0')}`,
    homeroomTeacher: '-',
    studentCount: 0,
    sort: index + 1,
    note: '-',
    operator: SYSTEM_OPERATOR,
    operatedAt: SYSTEM_OPERATION_TIME,
  })));
  const [teachers, setTeachers] = useState<Person[]>([
    { name: '张雨薇', account: '13800000000', className: '七年级(2)班', role: '数学教师', phoneVerificationStatus: '未验证', status: '正常', operator: SYSTEM_OPERATOR, operatedAt: SYSTEM_OPERATION_TIME, createdAt: '2026-09-24 14:18:12' },
    { name: '李老师', account: '13800000001', className: '七年级(2)班', role: '班主任', phoneVerificationStatus: '未验证', status: '正常', operator: SYSTEM_OPERATOR, operatedAt: SYSTEM_OPERATION_TIME, createdAt: '2026-09-23 21:20:09' },
  ]);
  const [students, setStudents] = useState<Person[]>([
    { name: '李明', account: '9080005', className: '七年级(2)班', operator: SYSTEM_OPERATOR, operatedAt: SYSTEM_OPERATION_TIME, createdAt: '2026-09-23 16:59:22' },
    { name: '张小花', account: '9080004', className: '七年级(2)班', operator: SYSTEM_OPERATOR, operatedAt: SYSTEM_OPERATION_TIME, createdAt: '2026-09-23 16:59:19' },
  ]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('七年级(2)班');
  const [grade, setGrade] = useState('7');
  const [error, setError] = useState('');
  useEffect(() => setView(initialView), [initialView]);

  const titles: Record<View, string> = { school: '学校信息管理', classes: '班级管理', teachers: '教师账号', students: '学生账号' };
  const people = view === 'teachers' ? teachers : students;
  const filteredPeople = people.filter((person) => `${person.name} ${person.account} ${person.className}`.includes(search.trim()));
  const operatorLabel = `${currentUser.name}${currentUser.account ? `（${currentUser.account}）` : ''}`;

  const closeModal = () => {
    setModal(false);
    setBatchMode(false);
    setBatchText('');
    setError('');
  };

  const submit = () => {
    if (batchMode) {
      const names = batchText.split(/[\n,，、;；\t]+/).map((item) => item.trim()).filter(Boolean);
      if (!names.length) { setError('请粘贴要导入的名称，每行一条'); return; }
      const operatedAt = formatOperationTime();
      const createdAt = formatCreatedAt();
      if (view === 'classes') {
        setClasses((items) => [...items, ...names.map((item, index) => ({
          id: `class-${Date.now()}-${index}`,
          name: `${grade}年级${item}`,
          grade: Number(grade),
          alertCount: 0,
          classCode: `LH-${grade}${String(items.length + index + 1).padStart(2, '0')}`,
          homeroomTeacher: '-',
          studentCount: 0,
          sort: items.length + index + 1,
          note: '-',
          operator: operatorLabel,
          operatedAt,
        }))]);
      } else if (view === 'teachers') {
        setTeachers((items) => [...items, ...names.map((teacherName, index) => ({
          name: teacherName,
          account: `新教师${String(items.length + index + 1).padStart(3, '0')}`,
          className,
          role: '普通教师',
          phoneVerificationStatus: '未验证',
          status: '正常',
          operator: operatorLabel,
          operatedAt,
          createdAt,
        }))]);
      } else if (view === 'students') {
        setStudents((items) => [...items, ...names.map((studentName, index) => ({
          name: studentName,
          account: `新学生${String(items.length + index + 1).padStart(3, '0')}`,
          className,
          operator: operatorLabel,
          operatedAt,
          createdAt,
        }))]);
      }
      closeModal();
      return;
    }

    if (!name.trim()) { setError('请填写名称'); return; }
    const operatedAt = formatOperationTime();
    const createdAt = formatCreatedAt();
    if (view === 'classes') setClasses((items) => [...items, { id: `class-${Date.now()}`, name: `${grade}年级${name.trim()}`, grade: Number(grade), alertCount: 0, classCode: `LH-${grade}${String(items.length + 1).padStart(2, '0')}`, homeroomTeacher: '-', studentCount: 0, sort: items.length + 1, note: '-', operator: operatorLabel, operatedAt }]);
    if (view === 'teachers') setTeachers((items) => [...items, { name: name.trim(), account: `新教师${String(items.length + 1).padStart(3, '0')}`, className, role: '普通教师', phoneVerificationStatus: '未验证', status: '正常', operator: operatorLabel, operatedAt, createdAt }]);
    if (view === 'students') setStudents((items) => [...items, { name: name.trim(), account: `新学生${String(items.length + 1).padStart(3, '0')}`, className, operator: operatorLabel, operatedAt, createdAt }]);
    setName('');
    closeModal();
  };

  const openModal = (isBatch: boolean) => {
    setBatchMode(isBatch);
    setBatchText('');
    setError('');
    setModal(true);
  };

  return <div className="h-full flex bg-[#f5f7fa] text-slate-800">
    <main className="min-w-0 flex-1 overflow-y-auto p-7">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs text-slate-400">教师端 / 学校管理 / {titles[view]}</div>
          <h1 className="mt-2 text-2xl font-bold">{titles[view]}</h1>
        </div>
        {view !== 'school' && <div className="flex gap-2">
          {(view === 'classes' || view === 'teachers' || view === 'students') && <button onClick={() => openModal(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-blue-300"><Upload size={16}/>批量导入</button>}
          <button onClick={() => openModal(false)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"> <Plus size={16}/>{view === 'classes' ? '添加班级' : view === 'teachers' ? '新增教师' : '新增学生'}</button>
        </div>}
      </div>

      {view === 'school' ? <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Building2/></div><div><h2 className="text-lg font-bold">{currentUser.schoolName}</h2></div><span className="ml-auto rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">正常</span></div>
        <div className="grid gap-5 pt-5 sm:grid-cols-2">{[['学校编码', SCHOOL.code], ['省市区', SCHOOL.district], ['学校地址', SCHOOL.address], ['联系电话', SCHOOL.phone], ['管理范围', '本校教师、班级及学生']].map(([label, value]) => <div key={label}><div className="text-xs text-slate-400">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>)}</div>
      </section> : <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="按名称或账号查询" className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none"/></div><span className="text-xs text-slate-400">学校：{currentUser.schoolName}（固定）</span></div>
        {view === 'classes' ? <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['序号', '班级名称', '班级编码', '所属学校', '所属年级', '班主任', '学生人数', '排序', '备注', '操作人', '操作时间', '操作'].map((header) => <th key={header} className="px-4 py-3 text-left whitespace-nowrap">{header}</th>)}</tr></thead><tbody>{classes.filter((item) => `${item.name} ${item.classCode}`.includes(search.trim())).map((item, index) => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-4">{index + 1}</td><td className="px-4 py-4 font-medium whitespace-nowrap">{item.name}</td><td className="px-4 py-4">{item.classCode}</td><td className="px-4 py-4 whitespace-nowrap">{currentUser.schoolName}</td><td className="px-4 py-4">{item.grade}年级</td><td className="px-4 py-4">{item.homeroomTeacher}</td><td className="px-4 py-4">{item.studentCount}</td><td className="px-4 py-4">{item.sort}</td><td className="px-4 py-4">{item.note || '-'}</td><td className="px-4 py-4 text-slate-600 whitespace-nowrap">{item.operator}</td><td className="px-4 py-4 text-slate-600 whitespace-nowrap">{item.operatedAt}</td><td className="px-4 py-4 whitespace-nowrap"><button type="button" className="mr-3 text-blue-600 hover:text-blue-700">编辑</button><button type="button" className="text-red-500 hover:text-red-600">删除</button></td></tr>)}</tbody></table> : <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['序号', view === 'teachers' ? '教师姓名' : '学生姓名', view === 'teachers' ? '登录名（手机号）' : '学号', '学校', '班级', ...(view === 'teachers' ? ['教研角色', '手机号验证状态'] : ['创建时间']), '操作人', '操作时间', '状态', '操作'].map((header) => <th key={header} className="px-5 py-3 text-left">{header}</th>)}</tr></thead><tbody>{filteredPeople.map((person, index) => <tr key={`${person.account}-${index}`} className="border-t border-slate-100"><td className="px-5 py-4">{index + 1}</td><td className="px-5 py-4 font-medium">{person.name}</td><td className="px-5 py-4">{person.account}</td><td className="px-5 py-4">{currentUser.schoolName}</td><td className="px-5 py-4">{person.className}</td>{view === 'teachers' ? <><td className="px-5 py-4">{person.role}</td><td className="px-5 py-4"><span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">{person.phoneVerificationStatus}</span></td></> : <td className="px-5 py-4">{person.createdAt}</td>}<td className="px-5 py-4 text-slate-600">{person.operator}</td><td className="px-5 py-4 text-slate-600">{person.operatedAt}</td><td className="px-5 py-4"><span className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">{person.status ?? '正常'}</span></td><td className="px-5 py-4 whitespace-nowrap">{(view === 'teachers' ? ['查看', '编辑', '班级', '删除'] : ['查看', '编辑']).map((action) => <button key={action} type="button" className={`mr-2 last:mr-0 ${action === '删除' ? 'text-red-500 hover:text-red-600' : 'text-blue-600 hover:text-blue-700'}`}>{action}</button>)}</td></tr>)}</tbody></table>}
        {view !== 'classes' && filteredPeople.length === 0 && <div className="p-12 text-center text-sm text-slate-400">暂无匹配数据</div>}
      </section>}
    </main>

    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><section className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{batchMode ? `${view === 'classes' ? '班级' : view === 'teachers' ? '教师' : '学生'}批量导入` : view === 'classes' ? '添加班级' : view === 'teachers' ? '新增教师' : '新增学生'}</h2><button onClick={closeModal}><X size={18}/></button></div>
      <div className="space-y-4">
        {batchMode ? <>
          <label className="block text-sm">{view === 'classes' ? '所属年级' : '所属班级'}
            {view === 'classes' ? <select value={grade} onChange={(event) => setGrade(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">{[1,2,3,4,5,6,7,8,9].map((item) => <option key={item} value={item}>{item}年级</option>)}</select> : <select value={className} onChange={(event) => setClassName(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">{classes.map((item) => <option key={item.id}>{item.name}</option>)}</select>}
          </label>
          <label className="block text-sm">{view === 'classes' ? '班级名称' : view === 'teachers' ? '教师姓名' : '学生姓名'}（每行一条）<textarea value={batchText} onChange={(event) => setBatchText(event.target.value)} rows={6} placeholder={view === 'classes' ? '例如：1班\n2班' : '例如：张三\n李四'} className="mt-1 w-full resize-y rounded-lg border px-3 py-2"/></label>
          <p className="text-xs text-slate-400">操作人：{operatorLabel}；操作时间：{formatOperationTime()}</p>
        </> : view === 'classes' ? <>
          <label className="block text-sm">所属学校<input value={currentUser.schoolName} readOnly className="mt-1 w-full rounded-lg border bg-slate-100 px-3 py-2 text-slate-500"/></label>
          <label className="block text-sm">所属年级<select value={grade} onChange={(event) => setGrade(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">{[1,2,3,4,5,6,7,8,9].map((item) => <option key={item} value={item}>{item}年级</option>)}</select></label>
          <label className="block text-sm">班级名称<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：1班" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
        </> : <>
          <label className="block text-sm">{view === 'teachers' ? '教师姓名' : '学生姓名'}<input value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入姓名" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          <label className="block text-sm">学校<input value={currentUser.schoolName} readOnly className="mt-1 w-full rounded-lg border bg-slate-100 px-3 py-2 text-slate-500"/><span className="mt-1 block text-xs text-slate-400">学校固定为当前管理员所属学校，不可筛选或切换</span></label>
          <label className="block text-sm">所属班级<select value={className} onChange={(event) => setClassName(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">{classes.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
        </>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-2"><button onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm">取消</button><button onClick={submit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">{batchMode ? '确认导入' : '添加'}</button></div>
    </section></div>}
  </div>;
};
