import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText, MoreHorizontal, Printer, Search, Trash2 } from 'lucide-react';
import { deletePrintedFile, listPrintedFiles, loadPaperDocument, PRINTED_FILES_CHANGED_EVENT, retryPrintedFile, type PrintedFileRecord, type StoredPaperDocument } from '../../services/printedFileService';
import { PaperPdfViewer } from '../LumiSpace/PaperPdfViewer';

const fileDateKey = (value: string | number) => new Date(value).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
const fileDateLabel = (value: string) => {
  const key = fileDateKey(value);
  if (key === fileDateKey(Date.now())) return '今天';
  if (key === fileDateKey(Date.now() - 86400000)) return '昨天';
  return key;
};

export const MyPrintedFilesPage: React.FC<{ onBack: () => void; initialFileId?: string }> = ({ onBack, initialFileId }) => {
  const [files, setFiles] = useState<PrintedFileRecord[]>(() => listPrintedFiles());
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<PrintedFileRecord | null>(null);
  const [document, setDocument] = useState<StoredPaperDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);
  const [openPrintSettings, setOpenPrintSettings] = useState(false);
  useEffect(() => {
    if (!menuFileId) return;
    const dismissOutside = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-file-menu]')) setMenuFileId(null);
    };
    const dismissOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuFileId(null); };
    window.addEventListener('pointerdown', dismissOutside);
    window.addEventListener('keydown', dismissOnEscape);
    return () => {
      window.removeEventListener('pointerdown', dismissOutside);
      window.removeEventListener('keydown', dismissOnEscape);
    };
  }, [menuFileId]);
  const openFile = async (file: PrintedFileRecord, print = false) => {
    setMenuFileId(null);
    setOpenPrintSettings(print);
    setError(null);
    if (!file.documentId) { setPreview(file); return; }
    setLoading(true);
    try {
      const stored = await loadPaperDocument(file.documentId);
      if (!stored) throw new Error('文件内容未找到');
      setDocument(stored);
      setPreview(file);
    } catch { setError('文件打开失败，请重试。'); }
    finally { setLoading(false); }
  };
  const refresh = () => setFiles(listPrintedFiles());
  useEffect(() => { window.addEventListener(PRINTED_FILES_CHANGED_EVENT, refresh); return () => window.removeEventListener(PRINTED_FILES_CHANGED_EVENT, refresh); }, []);
  useEffect(() => {
    const file = listPrintedFiles().find((item) => item.id === initialFileId);
    if (file) void openFile(file);
  }, [initialFileId]);
  const visible = useMemo(() => files
    .filter((file) => `${file.title}${file.subject}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [files, query]);
  const dateGroups = useMemo(() => {
    const groups: { date: string; label: string; files: PrintedFileRecord[] }[] = [];
    for (const file of visible) {
      const date = fileDateKey(file.createdAt);
      const previous = groups[groups.length - 1];
      if (previous?.date === date) previous.files.push(file);
      else groups.push({ date, label: fileDateLabel(file.createdAt), files: [file] });
    }
    return groups;
  }, [visible]);

  return <div className="flex h-full min-h-0 flex-col bg-slate-50">
    <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-6"><button onClick={onBack} aria-label="返回" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition-colors hover:bg-slate-200"><ArrowLeft size={20} /></button><div className="ml-3"><h1 className="text-[18px] font-semibold text-slate-900">我的文件</h1><p className="text-[10px] text-slate-400">共 {visible.length} 份文档</p></div><div className="ml-auto flex h-9 w-[260px] items-center rounded-xl bg-slate-100 px-3"><Search size={14} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索试卷或学科" className="ml-2 min-w-0 flex-1 bg-transparent text-[12px] outline-none" /></div></header>
    {loading ? <p role="status" className="px-6 pt-3 text-sm text-slate-500">正在打开 PDF…</p> : null}{error ? <p role="alert" className="px-6 pt-3 text-sm text-rose-600">{error}</p> : null}<main className="min-h-0 flex-1 overflow-y-auto p-6">{visible.length === 0 ? <div className="mx-auto mt-20 max-w-sm text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-500"><FileText size={30} /></span><h2 className="mt-4 text-[16px] font-semibold">{files.length ? '没有匹配的文件' : '暂无文件'}</h2><p className="mt-2 text-[12px] text-slate-400">保存为 PDF 或生成打印文档后，试卷会自动显示在这里。</p></div> : <div className="mx-auto max-w-[1100px] space-y-5">
      {dateGroups.map((group) => (
        <section key={group.date} aria-label={group.label}>
          <div className="mb-3 flex items-center gap-3"><h2 className="shrink-0 text-xs font-medium text-slate-500">{group.label}</h2><div className="h-px flex-1 bg-slate-200" /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {group.files.map((file) => (
        <article key={file.id} className="group flex items-center rounded-xl border border-slate-100 bg-white shadow-sm transition-colors hover:border-violet-200">
          <button type="button" onClick={() => void openFile(file)} aria-label={`预览${file.title}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><FileText size={20} /></span>
            <div className="min-w-0 flex-1">
              <h3 className="overflow-hidden break-words text-[13px] font-semibold leading-5 text-slate-800" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>{file.title}</h3>
              <p className="mt-1 text-[10px] text-slate-400">共 {file.pageCount} 页</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{new Date(file.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
            </div>
          </button>
          <div data-file-menu className="relative mr-2 flex shrink-0 flex-col items-end justify-between self-stretch py-2">
            <button type="button" aria-label={`更多操作：${file.title}`} aria-expanded={menuFileId === file.id} title="更多" onClick={() => setMenuFileId(menuFileId === file.id ? null : file.id)} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"><MoreHorizontal size={16} /></button>
            {menuFileId === file.id ? (
              <div className="absolute right-0 top-10 z-20 w-28 rounded-lg border border-slate-100 bg-white p-1 shadow-lg">
                <button type="button" onClick={() => { setMenuFileId(null); if (window.confirm('确定删除这份文件？')) { deletePrintedFile(file.id); refresh(); } }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={13} />删除文件</button>
              </div>
            ) : null}
            {file.documentId ? <button type="button" aria-label={`打印${file.title}`} onClick={() => void openFile(file, true)} className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-50"><Printer size={13} />打印</button> : null}
          </div>
        </article>
      ))}
          </div>
        </section>
      ))}
    </div>}</main>
    {preview && document ? <PaperPdfViewer initialPrintOpen={openPrintSettings} pdf={document.pdf} pages={document.previewPages} title={preview.title} version={preview.version ?? 1} contentMode={preview.contentMode} backLabel="返回" onClose={() => { setPreview(null); setDocument(null); }} onPrint={() => { retryPrintedFile(preview.id, 'unknown'); refresh(); }} /> : null}{preview && !document ? <div className="absolute inset-0 z-30 flex flex-col bg-slate-200"><header className="flex h-14 items-center bg-white px-5"><button onClick={() => setPreview(null)} aria-label="返回" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition-colors hover:bg-slate-200"><ArrowLeft size={20} /></button><h2 className="ml-3 text-[15px] font-semibold">{preview.title}</h2><span className="ml-auto text-[11px] text-slate-400">{preview.pageCount} 页 · 历史打印 {preview.attempts} 次</span></header><div className="flex flex-1 justify-center overflow-auto p-7"><div className="min-h-[900px] w-[650px] bg-white p-14 shadow-xl"><h1 className="text-center text-xl font-bold">{preview.title}</h1><p className="mt-3 border-b border-slate-800 pb-3 text-center text-xs">{preview.subject} · 共 {preview.questionCount} 题</p>{Array.from({ length: Math.min(preview.questionCount, 12) }, (_, index) => <div key={index} className="mt-6 text-[13px]">{index + 1}. 历史试卷题目内容预览<div className="mt-3 h-8 border-b border-dashed border-slate-300" /></div>)}</div></div></div> : null}
  </div>;
};
