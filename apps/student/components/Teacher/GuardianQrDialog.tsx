import React, { useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { downloadGuardianBundle, downloadGuardianCard, GuardianBatch, GuardianStudent, guardianQrSvg } from './guardianQr';

type Scope = 'all' | 'class' | 'batch';
type Initial = { mode: 'single'; account: string } | { mode: 'bulk'; scope?: Scope; batchId?: string };

export const GuardianQrDialog: React.FC<{
  school: string; students: GuardianStudent[]; classes: { id: string; name: string; grade: number }[];
  batches: GuardianBatch[]; initial: Initial; onClose: () => void;
  onGenerate: (account: string) => void; onRotate: (account: string) => void;
}> = ({ school, students, classes, batches, initial, onClose, onGenerate, onRotate }) => {
  const [scope, setScope] = useState<Scope>(initial.mode === 'bulk' ? initial.scope ?? 'all' : 'all');
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [batchId, setBatchId] = useState(initial.mode === 'bulk' ? initial.batchId ?? batches[0]?.id ?? '' : batches[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmRotate, setConfirmRotate] = useState(false);
  const cancelled = useRef(false);
  const close = () => { cancelled.current = true; onClose(); };
  const isSingle = initial.mode === 'single';
  const selected = isSingle ? students.find((student) => student.account === initial.account) : undefined;
  const batch = batches.find((item) => item.id === batchId);
  const selectedClass = classes.find((item) => item.id === classId);
  const selectedStudents = useMemo(() => {
    if (isSingle) return selected ? [selected] : [];
    if (scope === 'class') return students.filter((student) => student.className === selectedClass?.name);
    if (scope === 'batch') return students.filter((student) => batch?.accounts.includes(student.account));
    return students;
  }, [isSingle, selected, scope, students, selectedClass?.name, batch]);
  const missing = selectedStudents.filter((student) => !student.guardianToken);
  const classGroups = [...new Set(selectedStudents.map((student) => student.className))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const excluded = scope === 'batch' && batch ? batch.accounts.length - selectedStudents.length : 0;
  const makeDownload = async () => {
    setBusy(true); setError(''); setSuccess(''); setCompleted(0); cancelled.current = false;
    try {
      if (isSingle) {
        if (!selected) throw new Error('该学生已不在在校名单中');
        await downloadGuardianCard(selected, school);
      } else {
        const label = scope === 'all' ? '全校按班级' : scope === 'class' ? selectedClass?.name ?? '指定班级' : `录入批次-${batch?.createdAt ?? ''}`;
        await downloadGuardianBundle(selectedStudents, school, label, setCompleted, () => cancelled.current);
      }
      if (!cancelled.current) setSuccess(isSingle ? '卡片图片已下载' : 'ZIP 已下载');
    } catch (cause) {
      if (!cancelled.current) setError(cause instanceof Error ? cause.message : '生成失败，请重试');
    } finally { if (!cancelled.current) setBusy(false); }
  };
  const resetFeedback = () => { setError(''); setSuccess(''); setCompleted(0); };
  const cardPreview = selected?.guardianToken ? guardianQrSvg(selected.guardianToken) : null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
    <section role="dialog" aria-modal="true" aria-label={isSingle ? '家长绑定卡' : '下载家长绑定码'} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold">{isSingle ? '家长绑定卡' : '下载家长绑定码'}</h2><p className="mt-1 text-sm text-slate-500">{school}</p></div><button aria-label="关闭绑定码" onClick={close} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={20}/></button></header>
      <div className="min-h-0 overflow-y-auto px-6 py-5">
        {isSingle ? selected ? <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center"><p className="font-semibold text-slate-800">{selected.name}</p><p className="mt-1 text-sm text-slate-500">{selected.className}</p>{cardPreview ? <img className="mx-auto mt-4 w-48 rounded border bg-white p-1" src={`data:image/svg+xml,${encodeURIComponent(cardPreview)}`} alt={`${selected.name}的家长绑定二维码`}/> : <div className="mt-4 grid h-48 place-items-center rounded border border-dashed text-sm text-slate-400">尚未生成</div>}<p className="mt-3 text-xs text-slate-400">学号 {selected.account}</p></div>
          <div className="space-y-4 text-sm"><div className="rounded-lg bg-blue-50 p-4 leading-6 text-blue-800"><p className="font-semibold">发放方式</p><p>下载卡片后，私下发给这位学生的家庭。</p></div><div className="rounded-lg border border-slate-200 p-4"><p className="font-medium">当前状态：{selected.guardianToken ? '可下载' : '待生成'}</p><p className="mt-2 text-slate-500">重新下载不会换码；错发或泄露时才需补发。</p></div>{!selected.guardianToken ? <button onClick={() => { onGenerate(selected.account); resetFeedback(); }} className="rounded-lg border border-blue-200 px-4 py-2 font-medium text-blue-700">生成绑定码</button> : <div className="border-t border-slate-100 pt-4"><button onClick={() => setConfirmRotate(true)} className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800"><RefreshCw size={16}/>作废并补发</button></div>}</div>
        </div> : <p className="py-10 text-center text-sm text-slate-500">该学生已不在在校名单中，无法下载绑定卡。</p> : <>
          <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-3"><legend className="mb-3 text-sm font-semibold">选择下载范围</legend>{([
            ['all', '全校按班级', '全部在校学生'],
            ['class', '指定班级', '只下载选中班级'],
            ['batch', '某次录入', '仅下载该次新录入的学生'],
          ] as const).map(([value, title, description]) => <label key={value} className={`flex cursor-pointer gap-2 rounded-lg border p-3 ${scope === value ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="guardian-range" checked={scope === value} onChange={() => { setScope(value); resetFeedback(); }} className="mt-1"/><span><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span></label>)}</fieldset>
          {scope === 'class' && <label className="mt-4 block text-sm font-medium">选择班级<select value={classId} onChange={(event) => { setClassId(event.target.value); resetFeedback(); }} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2">{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          {scope === 'batch' && <label className="mt-4 block text-sm font-medium">录入记录<select value={batchId} onChange={(event) => { setBatchId(event.target.value); resetFeedback(); }} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2">{!batches.length && <option value="">暂无录入记录</option>}{batches.map((item, index) => <option key={item.id} value={item.id}>{index === 0 ? '最近一次 · ' : ''}{item.createdAt} · {item.method} · {item.accounts.length} 位 · {item.operator}</option>)}</select></label>}
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"><div className="flex flex-wrap items-center gap-x-5 gap-y-2"><span>学生 <strong className="text-lg text-slate-800">{selectedStudents.length}</strong> 位</span><span>班级 <strong className="text-lg text-slate-800">{classGroups.length}</strong> 个</span><span>待生成 <strong className={missing.length ? 'text-amber-700' : 'text-green-700'}>{missing.length}</strong> 位</span></div>{classGroups.length > 0 && <p className="mt-3 leading-6 text-slate-500">{classGroups.map((name) => `${name} ${selectedStudents.filter((student) => student.className === name).length} 位`).join('　·　')}</p>}{excluded > 0 && <p className="mt-3 text-amber-700">本批另有 {excluded} 位学生已不在在校名单中，不会生成可用卡片。</p>}{!selectedStudents.length && <p className="mt-3 text-slate-500">当前范围没有在校学生，请更换下载范围或先录入学生。</p>}</div>
          {missing.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><span>{missing.map((item) => item.name).slice(0, 5).join('、')}{missing.length > 5 ? `等 ${missing.length} 位` : ''}尚无绑定码。</span><button onClick={() => missing.forEach((item) => onGenerate(item.account))} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium">补生成缺失项</button></div>}
          <p className="mt-4 text-xs leading-5 text-slate-500">ZIP 按年级／班级存放每人一张卡片，并附索引。演示码不可用于真实绑定。</p>
        </>}
        {busy && <p role="status" className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">正在生成卡片… {completed}/{selectedStudents.length}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
      </div>
      <footer className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4"><button onClick={close} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">{busy ? '取消生成' : '关闭'}</button><button disabled={busy || !selectedStudents.length || !!missing.length} onClick={() => { void makeDownload(); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><Download size={16}/>{isSingle ? '下载卡片图片' : '下载 ZIP'}</button></footer>
    </section>
    {confirmRotate && selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"><section role="alertdialog" aria-modal="true" aria-label="确认作废并补发" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><h3 className="text-lg font-bold">作废并补发？</h3><p className="mt-3 text-sm leading-6 text-slate-600">{selected.name}的旧二维码将立即失效。请下载新卡并重新发给家庭；已完成绑定的家长不会被自动解绑。</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setConfirmRotate(false)} className="rounded-lg border px-4 py-2 text-sm">取消</button><button onClick={() => { onRotate(selected.account); setConfirmRotate(false); resetFeedback(); setSuccess('新码已生成，请下载发给家庭'); }} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white">确认补发</button></div></section></div>}
  </div>;
};
