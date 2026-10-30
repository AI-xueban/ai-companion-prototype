import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { IMPORT_HEADERS, ImportKind, ImportPerson, readAccountWorkbook, validateAccountRows } from './accountImport';

export const AccountImportDialog: React.FC<{
  kind: ImportKind; school: string; classes: { name: string; grade: number }[]; existing: ImportPerson[];
  onClose: () => void; onImport: (people: ImportPerson[]) => void; onCreateClasses: () => void;
}> = ({ kind, school, classes, existing, onClose, onImport, onCreateClasses }) => {
  const [raw, setRaw] = useState<{ row: number; values: string[] }[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const label = kind === 'teachers' ? '教师' : kind === 'students' ? '学生' : '班级';
  const unit = kind === 'classes' ? '个' : '位';
  const rows = useMemo(() => raw ? validateAccountRows(raw, kind, classes, existing) : [], [raw, kind, classes, existing]);
  const failures = rows.filter((row) => row.errors.length);
  const visible = errorsOnly ? failures : rows;
  const pageCount = Math.max(1, Math.ceil(visible.length / 20));
  const currentPage = Math.min(page, pageCount);
  const upload = async (file?: File) => {
    if (!file) return;
    const request = ++generation.current;
    setBusy(true); setError(''); setRaw(null); setFileName(file.name); setPage(1); setErrorsOnly(false);
    try {
      const parsed = await readAccountWorkbook(file, kind);
      if (request === generation.current) setRaw(parsed);
    } catch (cause) {
      if (request === generation.current) setError(cause instanceof Error ? cause.message : '文件无法读取，请检查后重新上传');
    } finally { if (request === generation.current) setBusy(false); }
  };
  const reset = () => { generation.current++; setRaw(null); setFileName(''); setError(''); setBusy(false); setPage(1); if (input.current) input.current.value = ''; };
  const confirm = () => {
    const checked = validateAccountRows(raw ?? [], kind, classes, existing);
    if (!checked.length || checked.some((row) => row.errors.length)) { setError('请修正全部错误后重新上传'); return; }
    onImport(checked.map((row) => row.person));
  };
  const secondary = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-blue-300 disabled:opacity-40';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
    <section role="dialog" aria-modal="true" aria-label={`${label}批量导入`} className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold">批量导入{label}</h2><p className="mt-1 text-sm text-slate-500">学校：{school}</p></div><button aria-label="关闭导入" onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X size={20}/></button></header>
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 text-sm">{['准备文件', '校验预览', '确认导入'].map((step, index) => <React.Fragment key={step}>{index > 0 && <span className="h-px w-10 bg-slate-200"/>}<span className={`flex items-center gap-2 ${index === (raw ? 1 : 0) ? 'font-semibold text-blue-600' : 'text-slate-400'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full ${index === (raw ? 1 : 0) ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{index + 1}</span>{step}</span></React.Fragment>)}</div>
      <div className="min-h-0 overflow-y-auto px-6 py-5">
        <input ref={input} type="file" accept=".xlsx" aria-label="上传Excel文件" className="hidden" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ''; }}/>
        {!raw ? <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
          <div className="rounded-xl border border-slate-200 p-5"><div className="mb-3 flex items-center gap-2 font-semibold"><FileSpreadsheet size={20} className="text-blue-600"/>1. 下载并填写模板</div><p className="text-sm leading-6 text-slate-500">使用专用模板，从第 2 行开始填写，每行一{unit}{label}。请保留表头和名单工作表名称。</p><a href={`${import.meta.env.BASE_URL}templates/${kind}-import.xlsx`} download={`${label}导入模板.xlsx`} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600"><Download size={16}/>下载{label}模板</a><div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">{kind === 'teachers' ? <><p>必填：登录手机号、教师姓名、任教学科；校内任职范围选填。</p><p>多科、多班、多项任职范围用“、”分隔；年级组长年级填写 1 至 9 的数字。</p><p>填写班主任班级即记录该班任职，每班仅限一位班主任。导入不会授予系统权限，授权需在教师列表单独维护。</p></> : kind === 'students' ? <><p>必填：学生姓名、所属班级。</p><p>每位学生只能属于一个班级。</p></> : <><p>必填：年级、班级名称；排序和备注选填。</p><p>年级填写 1 至 9 的数字；班级填写完整名称，如七年级(3)班。</p><p>排序为大于 0 的整数，留空时自动排在现有班级后。</p></>}<p>{kind === 'classes' ? '同校班级名称不能重复；已有班级请在列表中编辑。' : kind === 'students' ? '无需填写学号，确认导入后自动生成。' : '手机号按文本填写；已有账号请在列表中编辑。'}</p></div></div>
          <div className="flex flex-col"><div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (!busy) void upload(event.dataTransfer.files[0]); }} className="flex min-h-60 flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-6 text-center"><div className="mb-3 rounded-xl bg-white p-3 text-blue-500"><Upload size={30}/></div><h3 className="font-semibold">2. 上传填写好的 Excel</h3><p className="mt-2 text-sm text-slate-500">拖拽文件到这里，或选择文件上传</p><button disabled={busy} onClick={() => input.current?.click()} className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? '正在读取…' : '选择 Excel 文件'}</button><p className="mt-3 text-xs text-slate-400">仅支持 .xlsx，最大 5 MB，每次最多 5000 条</p>{fileName && <p className="mt-2 max-w-full break-all text-xs text-slate-500">{fileName}</p>}</div><p className="mt-3 text-xs leading-5 text-slate-500">上传后先校验并预览，确认后才会新增{kind === 'classes' ? '班级' : '账号'}。</p></div>
        </div> : <>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3"><FileSpreadsheet size={22} className="shrink-0 text-green-600"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{fileName}</p><p className="mt-1 text-xs text-slate-500">读取到 {rows.length} 条{label}记录</p></div><button onClick={() => input.current?.click()} className={secondary}>重新上传</button></div>
          <div className="my-4 grid grid-cols-3 gap-3">{[['总记录', rows.length, 'text-slate-700'], ['校验通过', rows.length - failures.length, 'text-green-600'], ['需修正', failures.length, failures.length ? 'text-red-500' : 'text-slate-700']].map(([title, count, color]) => <div key={title} className="rounded-lg border border-slate-200 px-4 py-3"><p className="text-xs text-slate-500">{title}</p><p className={`mt-1 text-2xl font-semibold ${color}`}>{count}</p></div>)}</div>
          <div role="status" className={`mb-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${failures.length ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{failures.length ? <AlertCircle size={18} className="shrink-0"/> : <CheckCircle2 size={18} className="shrink-0"/>}<p>{failures.length ? '请按下方行号修正原文件后重新上传。全部通过后才可确认导入。' : `全部校验通过，确认后将新增 ${rows.length} ${unit}${label}${kind === 'classes' ? '' : '账号'}。`}</p></div>
          <div className="mb-3 flex items-center justify-between text-sm"><h3 className="font-semibold">名单预览</h3><label className="flex items-center gap-2 text-slate-500"><input type="checkbox" checked={errorsOnly} onChange={(event) => { setErrorsOnly(event.target.checked); setPage(1); }}/>只看错误</label></div>
          <div className="max-h-72 overflow-auto rounded-lg border border-slate-200"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-500"><tr>{['Excel行号', ...IMPORT_HEADERS[kind], '校验结果'].map((title) => <th key={title} className="whitespace-nowrap px-3 py-3 font-medium">{title}</th>)}</tr></thead><tbody>{visible.slice((currentPage - 1) * 20, currentPage * 20).map((row) => <tr key={row.row} className={`border-t border-slate-100 ${row.errors.length ? 'bg-red-50/40' : ''}`}><td className="px-3 py-3">{row.row}</td>{IMPORT_HEADERS[kind].map((header, index) => <td key={header} className="min-w-24 px-3 py-3">{row.values[index] || '—'}</td>)}<td className={`min-w-64 px-3 py-3 ${row.errors.length ? 'text-red-600' : 'text-green-600'}`}>{row.errors.length ? <ul className="space-y-1">{row.errors.map((issue) => <li key={issue}>{issue}</li>)}</ul> : '通过'}</td></tr>)}</tbody></table>{!visible.length && <p className="p-6 text-center text-sm text-slate-400">暂无错误记录</p>}</div>
          <div className="mt-3 flex items-center justify-end gap-3 text-xs text-slate-500"><span>第 {currentPage} / {pageCount} 页</span><button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className={secondary}>上一页</button><button disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} className={secondary}>下一页</button></div>
        </>}
        {kind !== 'classes' && (!raw || failures.some((row) => row.errors.some((issue) => issue.includes('不存在：')))) && <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm"><h3 className="font-semibold text-amber-800">导入前，请先创建所需班级</h3><button onClick={onCreateClasses} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800">去创建班级</button></div>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>
      <footer className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">{raw && <button onClick={reset} className="mr-auto text-sm text-slate-500">返回准备文件</button>}<button onClick={onClose} className={secondary}>取消</button>{raw && <button disabled={busy || !rows.length || failures.length > 0} onClick={confirm} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">确认导入 {rows.length} {unit}{label}</button>}</footer>
    </section>
  </div>;
};
