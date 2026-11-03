import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer, X, Check, AlertTriangle, ChevronDown } from 'lucide-react';
import { PAPER_CONTENT_LABELS, type PaperContentMode } from '../../services/printedFileService';

interface PaperPdfViewerProps {
    pdf: Blob;
    pages: Blob[];
    title: string;
    version: number;
    onClose: () => void;
    backLabel?: string;
    onPrint?: () => void;
    contentMode?: PaperContentMode;
    initialPrintOpen?: boolean;
    layerClassName?: string;
    mistakePrintExceptionDemo?: boolean;
}

type MistakePrintIssueId = 'selection_limit' | 'image_only' | 'preview_failed' | 'preview_timeout' | 'pdf_failed' | 'printer_disconnected' | 'printer_not_found' | 'printer_connect_failed' | 'print_interrupted';

const mistakePrintIssueGroups: Array<{ title: string; issues: Array<{ id: MistakePrintIssueId; label: string; description: string; action: string; returnToSelection?: boolean }> }> = [
    { title: '选题与预览', issues: [
        { id: 'selection_limit', label: '达到 50 题上限', description: '单次最多打印 50 题。已选题目会保留，请缩小范围或分批打印。', action: '返回选题', returnToSelection: true },
        { id: 'image_only', label: '部分题目不可打印', description: '部分错题只有整题图片，没有可用于排版的题目数据。其他已选题目会保留，可跳过这些题目后继续。', action: '返回选题', returnToSelection: true },
        { id: 'preview_failed', label: '预览生成失败', description: '错题卷预览暂时无法生成，已选范围和筛选条件会保留。', action: '重试预览' },
        { id: 'preview_timeout', label: '预览生成超时', description: '预览等待时间过长。请检查网络后重试，已选范围和筛选条件会保留。', action: '重试预览' },
    ] },
    { title: '文件生成', issues: [
        { id: 'pdf_failed', label: 'PDF 生成失败', description: '文件生成失败，已选题目仍会保留。请重试或返回调整题目。', action: '重试生成' },
    ] },
    { title: '设备与打印', issues: [
        { id: 'printer_disconnected', label: '打印机未连接', description: '当前没有连接打印机。请先选择并连接设备，再继续打印。', action: '重新搜索' },
        { id: 'printer_not_found', label: '未搜索到打印机', description: '请确认打印机已开机，并与平板连接同一 Wi-Fi，然后重新搜索。', action: '重新搜索' },
        { id: 'printer_connect_failed', label: '连接打印机失败', description: '设备无响应或网络中断。请检查打印机状态，或选择其他设备。', action: '选择其他设备' },
        { id: 'print_interrupted', label: '打印中断失败', description: '打印过程中连接中断。PDF 已保存在“我的文件”，可稍后重新打印。', action: '重试打印' },
    ] },
];

export const PaperPdfViewer: React.FC<PaperPdfViewerProps> = ({ pages, title, onClose, backLabel = '返回', onPrint, contentMode, initialPrintOpen = false, layerClassName = 'z-[500]', mistakePrintExceptionDemo = false }) => {
    const [pageUrls, setPageUrls] = useState<string[]>([]);
    const [printOpen, setPrintOpen] = useState(initialPrintOpen);
    const [printComplete, setPrintComplete] = useState(false);
    const [copies, setCopies] = useState(1);
    const [pageRange, setPageRange] = useState('all');
    const [colorMode, setColorMode] = useState('color');
    const [showExceptionDemos, setShowExceptionDemos] = useState(false);
    const [activeIssue, setActiveIssue] = useState<MistakePrintIssueId | null>(null);

    useEffect(() => {
        const urls = pages.map((page) => URL.createObjectURL(page));
        setPageUrls(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [pages]);

    const contentLabel = contentMode ? PAPER_CONTENT_LABELS[contentMode] : '试卷';
    const issue = mistakePrintIssueGroups.flatMap((group) => group.issues).find((item) => item.id === activeIssue);
    const viewport = document.getElementById('app-viewport') ?? document.body;

    return createPortal(
        <div id="paper-pdf-print-viewer" className={`absolute inset-0 ${layerClassName} flex min-h-0 flex-col overflow-hidden bg-slate-100`}>
            <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-5">
                <button type="button" onClick={onClose} aria-label={backLabel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition-colors hover:bg-slate-200">
                    <ArrowLeft size={20} />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xs font-bold text-slate-900">{title}</h2>
                    <p className="text-[10px] text-slate-400">共 {pageUrls.length} 页</p>
                </div>
                <button type="button" disabled={!pageUrls.length} onClick={() => { setPrintComplete(false); setPrintOpen(true); }} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                    <Printer size={14} /> 打印
                </button>
            </header>
            <div className="paper-pdf-pages min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
                {pageUrls.map((url, index) => (
                    <img key={url} src={url} alt={`试卷第 ${index + 1} 页`} className="mx-auto mb-4 block w-full max-w-[794px] bg-white shadow-md" />
                ))}
            </div>
            {printOpen ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4">
                    <section role="dialog" aria-modal="true" aria-labelledby="paper-print-title" className="flex h-full max-h-[580px] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
                            <h3 id="paper-print-title" className="text-sm font-bold text-slate-900">打印设置</h3>
                            <button type="button" aria-label="关闭打印设置" onClick={() => setPrintOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                        </header>
                        {printComplete ? (
                            <div className="flex flex-col items-center gap-3 p-8 text-center">
                                <span className="rounded-full bg-violet-50 p-3 text-violet-600"><Check size={24} /></span>
                                <p role="status" className="text-sm font-semibold text-slate-800">打印演示已完成</p>
                                <p className="text-xs text-slate-500">{pageRange === 'all' ? pageUrls.length : 1} 页 · {copies} 份 · {colorMode === 'color' ? '彩色' : '黑白'}</p>
                                <button type="button" onClick={() => setPrintOpen(false)} className="mt-2 rounded-xl bg-violet-600 px-6 py-2 text-xs font-bold text-white">返回文档</button>
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1">
                                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4">
                                    {pageUrls.map((url, index) => pageRange === 'all' || pageRange === String(index + 1) ? <img key={url} src={url} alt={`打印预览第 ${index + 1} 页`} className={`mx-auto mb-3 w-full max-w-[420px] bg-white shadow ${colorMode === 'mono' ? 'grayscale' : ''}`} /> : null)}
                                </div>
                                <div className="flex w-64 shrink-0 flex-col overflow-hidden">
                                  <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
                                    <div><p className="text-xs font-semibold text-slate-700">打印设备</p><p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">演示打印机</p></div>
                                    <label className="text-xs font-semibold text-slate-700">页面<select value={pageRange} onChange={(event) => setPageRange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-normal"><option value="all">全部页面（{pageUrls.length} 页）</option>{pageUrls.map((_, index) => <option key={index} value={index + 1}>第 {index + 1} 页</option>)}</select></label>
                                    <label className="text-xs font-semibold text-slate-700">份数<input type="number" min={1} max={99} value={copies} onChange={(event) => setCopies(Math.max(1, Math.min(99, Number(event.target.value) || 1)))} className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-xs font-normal" /></label>
                                    <label className="text-xs font-semibold text-slate-700">色彩<select value={colorMode} onChange={(event) => setColorMode(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-normal"><option value="color">彩色</option><option value="mono">黑白</option></select></label>
                                    <p className="text-[10px] leading-relaxed text-slate-400">A4 纸张 · 当前为打印流程演示</p>
                                    {mistakePrintExceptionDemo ? <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-2.5">
                                        <button type="button" aria-expanded={showExceptionDemos} onClick={() => setShowExceptionDemos((open) => !open)} className="flex w-full items-center gap-1.5 text-left text-[11px] font-semibold text-amber-800"><AlertTriangle size={13} />异常演示<ChevronDown size={13} className={`ml-auto transition-transform ${showExceptionDemos ? 'rotate-180' : ''}`} /></button>
                                        {showExceptionDemos ? <div className="mt-2 space-y-2 border-t border-amber-100 pt-2">{mistakePrintIssueGroups.map((group) => <div key={group.title}><p className="px-1 text-[10px] font-semibold text-slate-400">{group.title}</p>{group.issues.map((item) => <button key={item.id} type="button" onClick={() => { setActiveIssue(item.id); setShowExceptionDemos(false); }} className="mt-0.5 block w-full rounded-lg px-2 py-1.5 text-left text-[11px] text-slate-700 hover:bg-white">{item.label}</button>)}</div>)}</div> : null}
                                    </div> : null}
                                  </div>
                                    <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-white p-4">
                                        <button type="button" onClick={() => setPrintOpen(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600">取消</button>
                                        <button type="button" onClick={() => { onPrint?.(); setPrintComplete(true); }} className="flex-1 rounded-lg bg-violet-600 py-2 text-xs font-bold text-white">确认打印</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            ) : null}
            {issue ? <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="mistake-print-issue-title" className="w-full max-w-[410px] rounded-2xl bg-white p-6 text-center shadow-2xl"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle size={25} /></span><h3 id="mistake-print-issue-title" className="mt-4 text-[17px] font-semibold text-slate-900">{issue.label}</h3><p className="mt-2 text-[12px] leading-6 text-slate-600">{issue.description}</p><button type="button" onClick={() => { setActiveIssue(null); if (issue.returnToSelection) { setPrintOpen(false); onClose(); } }} className="mt-5 h-10 w-full rounded-xl bg-indigo-600 text-[12px] font-semibold text-white">{issue.action}</button><button type="button" onClick={() => setActiveIssue(null)} className="mt-2 h-9 w-full rounded-xl text-[12px] font-semibold text-slate-500 hover:bg-slate-100">返回打印设置</button></section></div> : null}
        </div>,
        viewport,
    );
};
