import React, { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { createManagementWorkbook, EXPORT_LIMIT, ExportSheet } from './managementExport';

export const ManagementExportDialog: React.FC<{
  title: string; school: string; filterLabel: string;
  getSheets: (all: boolean) => ExportSheet[]; onClose: () => void; onSuccess: (count: number) => void;
}> = ({ title, school, filterLabel, getSheets, onClose, onSuccess }) => {
  const [datasets] = useState(() => ({ filtered: getSheets(false), all: getSheets(true) }));
  const [range, setRange] = useState<'filtered' | 'all'>('filtered');
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');
  const cancelled = useRef(false);
  useEffect(() => { cancelled.current = false; return () => { cancelled.current = true; }; }, []);
  const sheets = datasets[range];
  const count = sheets[0]?.rows.length ?? 0;
  const historyCount = sheets.slice(1).reduce((total, sheet) => total + sheet.rows.length, 0);
  const tooLarge = count + historyCount > EXPORT_LIMIT;
  const download = async () => {
    setBusy(true); setError(''); setPercent(0);
    try {
      const file = await createManagementWorkbook(sheets, setPercent, () => cancelled.current);
      if (cancelled.current) return;
      const link = document.createElement('a');
      const url = URL.createObjectURL(file);
      link.href = url;
      const time = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date()).replace(/[- :]/g, '');
      link.download = `${school}-${title}-${range === 'all' ? '全校' : '当前筛选'}-${time}.xlsx`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      onSuccess(count);
    } catch (cause) {
      if (!cancelled.current) setError(cause instanceof Error ? cause.message : '下载失败，请重试');
    } finally { if (!cancelled.current) setBusy(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><section role="dialog" aria-modal="true" aria-label={`下载${title}`} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
    <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">下载{title}</h2><button aria-label="关闭下载" onClick={onClose}><X size={18}/></button></div>
    <p className="text-sm text-slate-500">学校：{school}</p>
    <fieldset disabled={busy} className="mt-5 space-y-3"><legend className="mb-2 text-sm font-semibold">下载范围</legend>{(['filtered', 'all'] as const).map((value) => <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${range === value ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'}`}><input type="radio" name="export-range" value={value} checked={range === value} onChange={() => { setRange(value); setError(''); }} className="mt-1"/><span className="text-sm"><span className="font-medium">{value === 'filtered' ? '当前筛选结果' : '本校全部数据'}（{datasets[value][0]?.rows.length ?? 0} 条）</span><span className="mt-1 block text-xs text-slate-500">{value === 'filtered' ? filterLabel || '当前未设置筛选，包含全部数据' : '包含本校所有已录入和已导入的数据'}</span></span></label>)}</fieldset>
    <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm"><p>清单 {count.toLocaleString()} 条{historyCount > 0 && `，修改记录 ${historyCount.toLocaleString()} 条`}</p><p className="mt-2 text-xs leading-5 text-slate-500">下载完整字段；{sheets.length > 1 ? '修改记录另存工作表。' : ''}单次最多 1 万条明细（含修改记录）。超过上限请按年级、班级分批下载。</p></div>
    {tooLarge && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">清单及修改记录共 {(count + historyCount).toLocaleString()} 条，超过单次上限。请按年级或班级缩小范围后分批下载。</p>}
    {!count && <p role="status" className="mt-3 text-sm text-slate-500">当前范围暂无数据，请选择本校全部数据或调整筛选。</p>}
    {busy && <div role="status" className="mt-4 text-sm text-blue-600"><p>正在生成文件… {percent}%</p><div className="mt-2 h-1.5 overflow-hidden rounded bg-blue-100"><div className="h-full bg-blue-600" style={{ width: `${percent}%` }}/></div></div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">{busy ? '取消生成' : '取消'}</button><button disabled={busy || !count || tooLarge} onClick={() => { void download(); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><Download size={16}/>{busy ? '生成中…' : '下载 Excel'}</button></div>
  </section></div>;
};
